---
title: "Go: gRPC vs REST vs Connect — Protocolo para Microsserviços"
category: stack-guides
tags: [golang, grpc, rest, protobuf, connect, microservices]
stack: [Go, gRPC, Protobuf, Connect-Go, HTTP/2]
excerpt: gRPC domina comunicação síncrona entre microsserviços Go — contrato forte, performance e streaming. Connect-Go é o meio-termo que também suporta HTTP/1.1. REST para APIs públicas.
related: [golang-microservices, golang-chi-gin-fiber, microservices-quando-usar, event-driven]
updated: "2026-04"
---

## Quando usar cada um

| Critério | gRPC | Connect-Go | REST/JSON |
|---|---|---|---|
| Comunicação interna entre serviços | ✅ Ideal | ✅ Ideal | Funciona |
| API pública (browsers, mobile) | ❌ Limitado | ✅ Funciona | ✅ Ideal |
| Streaming bidirecional | ✅ Nativo | ✅ | ❌ |
| Contrato forte (código gerado) | ✅ | ✅ | Só com OpenAPI |
| Compatibilidade HTTP/1.1 | ❌ Requer H2 | ✅ | ✅ |
| Curva de aprendizado | Alta | Média | Baixa |

## gRPC — padrão para comunicação interna

### Definindo o contrato (proto)

```protobuf
// proto/user/v1/user.proto
syntax = "proto3";
package user.v1;

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  rpc WatchUserEvents(WatchRequest) returns (stream UserEvent); // streaming
}

message GetUserRequest {
  string id = 1;
}

message GetUserResponse {
  User user = 1;
}

message User {
  string id         = 1;
  string email      = 2;
  string name       = 3;
  int64  created_at = 4;
}
```

### Servidor gRPC

```go
// internal/infrastructure/grpc/server.go
type UserServer struct {
    userpb.UnimplementedUserServiceServer
    getUserUC *application.GetUser
}

func (s *UserServer) GetUser(ctx context.Context, req *userpb.GetUserRequest) (*userpb.GetUserResponse, error) {
    user, err := s.getUserUC.Execute(ctx, req.Id)
    if err != nil {
        // Converte erros de domínio para status gRPC
        switch {
        case errors.Is(err, domain.ErrUserNotFound):
            return nil, status.Error(codes.NotFound, "usuário não encontrado")
        default:
            return nil, status.Error(codes.Internal, "erro interno")
        }
    }
    return &userpb.GetUserResponse{
        User: &userpb.User{
            Id:        user.ID,
            Email:     user.Email,
            Name:      user.Name,
            CreatedAt: user.CreatedAt.Unix(),
        },
    }, nil
}

// main.go
func main() {
    lis, _ := net.Listen("tcp", ":9090")

    grpcServer := grpc.NewServer(
        grpc.ChainUnaryInterceptor(
            otelgrpc.UnaryServerInterceptor(),  // tracing
            AuthInterceptor(),                   // auth
            LoggingInterceptor(),                // logs
        ),
    )

    userpb.RegisterUserServiceServer(grpcServer, &UserServer{})
    grpcServer.Serve(lis)
}
```

### Cliente gRPC

```go
// Conexão com connection pooling
conn, err := grpc.NewClient("user-service:9090",
    grpc.WithTransportCredentials(insecure.NewCredentials()), // use TLS em prod
    grpc.WithChainUnaryInterceptor(
        otelgrpc.UnaryClientInterceptor(),
    ),
)
userClient := userpb.NewUserServiceClient(conn)

// Chamada com timeout
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()

resp, err := userClient.GetUser(ctx, &userpb.GetUserRequest{Id: id})
```

## Connect-Go — melhor dos dois mundos

Connect gera handlers que funcionam com gRPC, gRPC-Web E HTTP/1.1 JSON nativamente. Ideal quando você precisa que o serviço seja acessível do browser também.

```go
// Mesmo proto, mas com Connect
import "connectrpc.com/connect"

type UserHandler struct {
    getUserUC *application.GetUser
}

func (h *UserHandler) GetUser(
    ctx context.Context,
    req *connect.Request[userpb.GetUserRequest],
) (*connect.Response[userpb.GetUserResponse], error) {
    user, err := h.getUserUC.Execute(ctx, req.Msg.Id)
    if err != nil {
        return nil, connect.NewError(connect.CodeNotFound, err)
    }
    return connect.NewResponse(&userpb.GetUserResponse{...}), nil
}

// Registra no Chi/Mux padrão — funciona com HTTP/1.1 e H2
mux := http.NewServeMux()
path, handler := userpbconnect.NewUserServiceHandler(&UserHandler{})
mux.Handle(path, handler)

// Agora funciona com curl, Postman, navegador E clientes gRPC
```

## Streaming bidirecional — quando usar

```go
// Streaming server-side — notificações em tempo real
func (s *UserServer) WatchUserEvents(
    req *userpb.WatchRequest,
    stream userpb.UserService_WatchUserEventsServer,
) error {
    events := s.eventBus.Subscribe(req.UserId)
    defer s.eventBus.Unsubscribe(req.UserId, events)

    for {
        select {
        case event := <-events:
            if err := stream.Send(&userpb.UserEvent{...event}); err != nil {
                return err // client desconectou
            }
        case <-stream.Context().Done():
            return nil // cliente cancelou
        }
    }
}
```

## Geração de código (Makefile)

```makefile
proto:
    protoc \
        --go_out=. \
        --go-grpc_out=. \
        --connect-go_out=. \
        proto/user/v1/user.proto
```

## Como pedir pra IA

```
Crie um servidor {{gRPC/Connect-Go}} em Go para o serviço {{nome}}:
- Proto em /proto/{{nome}}/v1
- Handler em /internal/infrastructure/grpc
- Converta erros de domínio para status codes gRPC semanticamente corretos
- Interceptors: OpenTelemetry tracing, logging estruturado, autenticação JWT
- Cliente tipado para ser usado por outros serviços
- Testes unitários mockando o use case
```
