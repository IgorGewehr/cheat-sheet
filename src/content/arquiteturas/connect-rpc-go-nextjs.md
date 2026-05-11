---
title: "Connect-RPC — Go ↔ Next.js sem REST nem gRPC-Web"
category: arquiteturas
stack: [Go, Next.js, Connect, Protobuf, TypeScript]
tags: [connect, rpc, protobuf, grpc-web, type-safety, streaming]
excerpt: "Alternativa moderna a REST e gRPC-Web. Servidor Go fala HTTP/1.1 + HTTP/2 + gRPC simultaneamente. Cliente Next.js consome via Connect-Web com types gerados de .proto. Streaming bidi sem WebSocket."
related: [nextjs-go-backend-integration, go-bff-cors-cookies, golang-grpc, go-sdd-openapi]
updated: "2026-05"
---

## Quando considerar Connect

Você já tem `.proto` no projeto (ou tá disposto a adotar) e quer:

- **Um servidor Go que fala REST-ish + gRPC + Connect** sem dois binários.
- **Cliente TypeScript type-safe** sem `openapi-typescript` no meio.
- **Streaming server→client e bidi** no browser sem WebSocket.
- **Contratos versionados** com evolução backward-compatible nativa do protobuf.

Se você não tem `.proto` e seu time conhece OpenAPI, **fique com REST + `openapi-fetch`** (ver `nextjs-go-backend-integration`). Connect compensa quando o ecossistema é polyglot ou microservices internos já usam gRPC.

## Stack Connect

- **Protocolo**: HTTP/1.1, HTTP/2 e gRPC simultaneamente. Mesmo handler, três wire formats.
- **`connectrpc.com/connect`**: lib Go (gerada via `buf generate`).
- **`@connectrpc/connect-web`** + **`@connectrpc/connect-query`** (opcional): cliente TS, integra com TanStack Query.
- **`buf`**: gera código Go + TS a partir de `.proto`.

## Setup mínimo

```proto
// proto/projeto/v1/projeto.proto
syntax = "proto3";
package projeto.v1;

service ProjetoService {
  rpc GetProjeto(GetProjetoRequest) returns (Projeto);
  rpc ListProjetos(ListProjetosRequest) returns (ListProjetosResponse);
  rpc StreamEventos(StreamEventosRequest) returns (stream EventoProjeto);
}

message Projeto {
  string id = 1;
  string nome = 2;
  google.protobuf.Timestamp criado_em = 3;
}
```

```yaml
# buf.gen.yaml
version: v2
plugins:
  - remote: buf.build/protocolbuffers/go
    out: gen/go
  - remote: buf.build/connectrpc/go
    out: gen/go
  - remote: buf.build/bufbuild/es
    out: src/gen
  - remote: buf.build/connectrpc/es
    out: src/gen
```

```bash
buf generate  # gera Go e TS de uma vez
```

## Lado Go: handler Connect

```go
// internal/handler/projeto.go
package handler

import (
    "context"
    "connectrpc.com/connect"
    projetov1 "exemplo.com/gen/go/projeto/v1"
    "exemplo.com/gen/go/projeto/v1/projetov1connect"
)

type ProjetoServer struct {
    svc *service.ProjetoService
}

func (s *ProjetoServer) GetProjeto(
    ctx context.Context,
    req *connect.Request[projetov1.GetProjetoRequest],
) (*connect.Response[projetov1.Projeto], error) {
    p, err := s.svc.GetByID(ctx, req.Msg.Id)
    if err != nil {
        if errors.Is(err, service.ErrNotFound) {
            return nil, connect.NewError(connect.CodeNotFound, err)
        }
        return nil, connect.NewError(connect.CodeInternal, err)
    }
    return connect.NewResponse(&projetov1.Projeto{
        Id:        p.ID,
        Nome:      p.Nome,
        CriadoEm:  timestamppb.New(p.CriadoEm),
    }), nil
}

func (s *ProjetoServer) StreamEventos(
    ctx context.Context,
    req *connect.Request[projetov1.StreamEventosRequest],
    stream *connect.ServerStream[projetov1.EventoProjeto],
) error {
    eventos := s.svc.Subscribe(ctx, req.Msg.ProjetoId)
    for evt := range eventos {
        if err := stream.Send(&projetov1.EventoProjeto{
            Tipo:      evt.Tipo,
            Payload:   evt.Payload,
            EmitidoEm: timestamppb.New(evt.At),
        }); err != nil {
            return err
        }
    }
    return nil
}
```

Montagem no router Chi:

```go
func main() {
    mux := http.NewServeMux()
    projServer := &handler.ProjetoServer{Svc: projetoSvc}
    path, h := projetov1connect.NewProjetoServiceHandler(
        projServer,
        connect.WithInterceptors(authInterceptor, loggingInterceptor),
    )
    mux.Handle(path, h)

    // h2c permite HTTP/2 sem TLS pra dev — em produção use TLS real
    srv := &http.Server{
        Addr:    ":8080",
        Handler: h2c.NewHandler(mux, &http2.Server{}),
    }
    srv.ListenAndServe()
}
```

## Lado Next: cliente Connect-Web

```ts
// src/lib/rpc/client.ts (server-only)
import "server-only";
import { createClient } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { ProjetoService } from "@/gen/projeto/v1/projeto_pb";

const transport = createConnectTransport({
  baseUrl: process.env.GO_API_URL!,
  httpVersion: "2",
});

export const projetoClient = createClient(ProjetoService, transport);
```

Uso em RSC:

```tsx
// app/projetos/[id]/page.tsx
import { projetoClient } from "@/lib/rpc/client";
import { headers } from "next/headers";
import { getAccessToken } from "@/lib/auth";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAccessToken();
  const projeto = await projetoClient.getProjeto(
    { id },
    { headers: { authorization: `Bearer ${token}` } },
  );
  return <ProjetoView projeto={projeto} />;
}
```

**Type-safety real**: `projeto.nome` é `string` garantido pelo `.proto`. Trocar `string` por `int` no proto quebra o build TS no próximo `buf generate`. Não tem chance de drift silencioso.

## Streaming server→client em Client Component

Pra UI realtime (cursor de progresso, feed de eventos):

```tsx
// components/EventosProjeto.tsx
"use client";

import { useEffect, useState } from "react";
import { createConnectTransport } from "@connectrpc/connect-web";
import { createClient } from "@connectrpc/connect";
import { ProjetoService } from "@/gen/projeto/v1/projeto_pb";

const transport = createConnectTransport({
  baseUrl: "/api/rpc", // BFF route handler, não Go direto
});
const client = createClient(ProjetoService, transport);

export function EventosProjeto({ projetoId }: { projetoId: string }) {
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      for await (const evt of client.streamEventos(
        { projetoId },
        { signal: ctrl.signal },
      )) {
        setEventos((prev) => [...prev, evt]);
      }
    })();
    return () => ctrl.abort();
  }, [projetoId]);

  return <ul>{eventos.map((e) => <li key={e.id}>{e.tipo}</li>)}</ul>;
}
```

Connect-Web usa HTTP/2 streaming nativo. Não precisa de WebSocket, e fallback automático pra HTTP/1.1 chunked quando o navegador/proxy não suporta H2.

## BFF + Connect

Se aplicar o padrão BFF (recomendado, ver `go-bff-cors-cookies`), crie um route handler que faz proxy do `application/connect+proto` ou `application/connect+json`:

```ts
// app/api/rpc/[...path]/route.ts
import { getAccessToken } from "@/lib/auth";

async function proxy(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname.replace("/api/rpc", "");
  const token = await getAccessToken();

  return fetch(`${process.env.GO_API_URL}${path}${url.search}`, {
    method: req.method,
    headers: {
      ...Object.fromEntries(req.headers),
      authorization: `Bearer ${token}`,
      host: new URL(process.env.GO_API_URL!).host,
    },
    body: req.body,
    duplex: "half", // streaming requests
  } as RequestInit);
}

export { proxy as GET, proxy as POST };
```

Isso preserva streaming Connect através do BFF sem buffer.

## Connect vs alternativas — decisão honesta

| Critério | REST + OpenAPI | gRPC-Web | **Connect** |
|---|---|---|---|
| Browser nativo | ✅ | ⚠️ via Envoy | ✅ |
| Type-safety fim-a-fim | ⚠️ via codegen | ✅ | ✅ |
| Streaming server→client | SSE separado | ✅ | ✅ |
| Bidi streaming | ❌ (WebSocket) | ⚠️ limitado | ✅ |
| Backward compat | manual | nativo | nativo |
| Curva pro time | Baixa | Alta | Média |
| Ecossistema (proxies, debug) | Imenso | Médio | Crescendo |
| Boa pra: | Maioria dos casos | Microservices internos | Polyglot + RPC moderno |

**Resumo**: Connect é a escolha mais nova e a melhor tecnicamente em vários eixos, mas tooling/debug ainda perde pro REST. Se seu produto não exige streaming bidi nem polyglot agressivo, REST + OpenAPI continua sendo a opção pragmática.

## Armadilhas

- **Misturar Connect e REST no mesmo handler**: dá pra fazer, mas confunde monitoring (`/api/projetos` REST vs `/projeto.v1.ProjetoService/GetProjeto` Connect). Padronize.
- **`buf generate` fora do CI**: drift entre `.proto` e código gerado vira bug invisível. Rode no pre-commit ou CI obrigatório.
- **Streaming sem timeout**: stream pendurado consome FD e goroutine. Sempre `ctx.WithTimeout` ou `Deadline` no servidor.
- **Esquecer h2c em dev**: cliente reclama "stream closed" sem TLS. Use `h2c.NewHandler` em dev, TLS real em prod.
- **Confundir Connect com gRPC-Web**: são protocolos *diferentes*. Cliente Connect-Web consome Connect e gRPC; gRPC-Web só consome gRPC-Web via proxy.

## Como pedir pra IA

```
Migre meu serviço Go que hoje expõe REST com Chi pra Connect-RPC,
mantendo coexistência REST durante transição:

PROTO:
- proto/projeto/v1/projeto.proto com GetProjeto, ListProjetos, StreamEventos
- buf.gen.yaml gerando Go (connectrpc/go) e TS (connectrpc/es)

GO:
- Handler Connect mountado em mux, mantendo Chi pra rotas legadas
- Interceptors: auth (extrai bearer), logging com slog, recovery
- h2c em dev, http.Server normal em prod (TLS termina no proxy)

NEXT 15:
- src/lib/rpc/client.ts server-only com createConnectTransport
- Uso em RSC com getAccessToken() do BFF
- Componente client com streaming via for await (AbortController)
- Route handler /api/rpc/[...path] como BFF proxy preservando streaming

NÃO use: WebSocket (use streaming Connect), JWT no client, REST fetch
manual quando já existe método tipado no client gerado.
```
