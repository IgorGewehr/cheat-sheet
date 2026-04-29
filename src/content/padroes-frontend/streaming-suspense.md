---
title: "Streaming + Suspense pra perceived performance"
category: padroes-frontend
stack: [Next.js, React]
tags: [performance, ux]
excerpt: "Mostra o que está pronto enquanto o resto carrega. Em vez de bloquear na query mais lenta, divide a página em pedaços."
related: [server-components, app-router]
updated: 2026-04
---

## O problema que resolve

Página com 4 seções, uma demora 800ms (relatório). Sem streaming, o usuário espera 800ms vendo nada. Com streaming + Suspense, vê tudo o que está pronto em 50ms e só a seção lenta mostra skeleton.

## Como aplicar

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react";
import { CardsRapidos } from "./cards-rapidos";
import { Relatorio } from "./relatorio";

export default function Page() {
  return (
    <>
      <CardsRapidos />  {/* renderiza quando pronto */}
      <Suspense fallback={<SkeletonRelatorio />}>
        <Relatorio />   {/* relatório lento, vai com skeleton */}
      </Suspense>
    </>
  );
}

// relatorio.tsx — Server Component async
async function Relatorio() {
  const dados = await dbHeavyQuery();
  return <Chart dados={dados} />;
}
```

Cada `Suspense` define uma fronteira de streaming. Tudo o que está fora resolve primeiro.

## `loading.tsx`

Em App Router, `loading.tsx` num segmento envolve a `page.tsx` em `<Suspense>` automaticamente. Use pra placeholder de página inteira.

Para granularidade fina, use `<Suspense>` manual.

## Paralelizar buscas

Componentes irmãos dentro de RSCs rodam suas async em paralelo se você não awaitar tudo no pai:

```tsx
// ruim — sequencial
export default async function Page() {
  const a = await fetchA();
  const b = await fetchB();
  return <div>...</div>;
}

// melhor — paralelo
export default async function Page() {
  const [a, b] = await Promise.all([fetchA(), fetchB()]);
  return <div>...</div>;
}

// ainda melhor — streaming, cada um aparece quando pronto
export default function Page() {
  return (
    <>
      <Suspense fallback={<S />}><A /></Suspense>
      <Suspense fallback={<S />}><B /></Suspense>
    </>
  );
}
```

## Como pedir pra IA

> "Refatore `app/dashboard/page.tsx` pra usar streaming. Identifique as 4 seções, isole cada uma em RSC async própria, e envolva as duas mais lentas (`<Relatorio />` e `<MetricasMensais />`) em `<Suspense>` com skeleton individual. Garanta que dado é buscado dentro de cada subcomponente, não no pai."

## Auditoria

- [ ] Página com seções de latências diferentes tem `<Suspense>` por seção.
- [ ] Buscas independentes não estão sequenciadas com `await` em série.
- [ ] Fallbacks têm dimensão próxima do conteúdo final (sem CLS).
- [ ] Ordem visual não muda quando streaming completa (use `min-height`).
- [ ] Nenhuma seção rápida está bloqueada por uma lenta no pai.
