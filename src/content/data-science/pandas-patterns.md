---
title: "Pandas Patterns — DataFrames Eficientes e Legíveis"
category: data-science
stack: [Python, Pandas, NumPy]
tags: [pandas, performance, dataframe, python]
excerpt: "Padrões para escrever código Pandas idiomático, eficiente e que não explode memória em datasets reais."
related: [eda-workflow, data-cleaning, feature-engineering]
updated: 2026-04
---

## Regra Principal

**Nunca use loops Python em DataFrames.** Pandas é vetorizado — um loop explícito é 100-1000x mais lento que a operação equivalente em coluna.

## Seleção e Filtro

```python
# Prefira .loc para label-based, .iloc para posição
df.loc[df['status'] == 'ativo', 'receita']
df.loc[mask, ['col1', 'col2']]  # múltiplas colunas com máscara

# Condições múltiplas: use & e |, não 'and'/'or'
mask = (df['valor'] > 100) & (df['status'] == 'ativo')
df.loc[mask]

# .query() para filtros legíveis
df.query("valor > 100 and status == 'ativo'")
df.query("data >= @data_inicio")  # variáveis externas com @
```

## Transformações em Coluna

```python
# .assign() mantém imutabilidade — retorna novo df, não modifica
df = (df
    .assign(receita_liquida = lambda x: x['receita'] - x['desconto'])
    .assign(mes = lambda x: x['data'].dt.month)
    .assign(categoria_normalizada = lambda x: x['categoria'].str.lower().str.strip())
)

# np.where para condicionais simples (muito mais rápido que apply)
import numpy as np
df['tier'] = np.where(df['receita'] > 10_000, 'premium', 'standard')

# np.select para múltiplas condições
conditions = [df['receita'] > 50_000, df['receita'] > 10_000, df['receita'] > 0]
choices    = ['enterprise', 'premium', 'standard']
df['tier'] = np.select(conditions, choices, default='sem_receita')
```

## GroupBy Eficiente

```python
# Named aggregation — explícita e sem multi-index
resultado = df.groupby('cliente_id').agg(
    total_compras    = ('valor', 'sum'),
    qtd_pedidos      = ('pedido_id', 'count'),
    ticket_medio     = ('valor', 'mean'),
    ultima_compra    = ('data', 'max'),
).reset_index()

# transform() para manter o shape original (útil para features)
df['media_categoria'] = df.groupby('categoria')['valor'].transform('mean')
df['rank_no_grupo']   = df.groupby('categoria')['valor'].transform('rank')
```

## Memória

```python
# Verificar uso de memória
df.memory_usage(deep=True).sum() / 1e6  # MB

# Downcast numéricos
df['id'] = pd.to_numeric(df['id'], downcast='integer')
df['valor'] = pd.to_numeric(df['valor'], downcast='float')

# Categoricals para strings de baixa cardinalidade (>10x economia)
df['status'] = df['status'].astype('category')
df['uf'] = df['uf'].astype('category')
```

## Armadilhas

- **`apply()` com função Python** — use operações vetorizadas. `apply` tem o custo de loop.
- **`iterrows()` ou `itertuples()`** — quase sempre há uma alternativa vetorizada.
- **Chained indexing** (`df['col'][mask] = valor`) — use `.loc`. Chained indexing pode modificar uma cópia.
- **`inplace=True`** — não economiza memória de verdade e dificulta o debug. Prefira reatribuição.
- **Concatenar em loop** (`df = pd.concat([df, row])`)— construa uma lista e concatene uma vez ao final.
