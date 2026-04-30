---
title: "Feature Engineering — Transformar Dados em Sinal"
category: data-science
stack: [Python, Pandas, Scikit-learn, NumPy]
tags: [features, ml, transformação, encodings]
excerpt: "Feature engineering é a principal alavanca de performance em ML: modelos bons com features ruins perdem para modelos simples com features excelentes."
related: [data-leakage, sklearn-patterns, ml-evaluation, eda-workflow]
updated: 2026-04
---

## Princípio

Features são o vocabulário do modelo. Se o modelo não consegue ver o padrão nos dados crus, você precisa torná-lo visível explicitamente.

## Numéricas

```python
# Log transform: reduz skewness em distribuições com cauda longa
import numpy as np
df['receita_log'] = np.log1p(df['receita'])  # log1p trata zeros corretamente

# Binning: transforma contínua em categórica ordenada
df['faixa_etaria'] = pd.cut(df['idade'], bins=[0,18,35,60,100],
                            labels=['jovem','adulto','meia_idade','senior'])

# Interações: captura relações que modelos lineares não veem
df['valor_por_item'] = df['valor_total'] / df['qtd_itens'].clip(lower=1)
df['dias_sem_compra_x_ticket'] = df['dias_sem_compra'] * df['ticket_medio']
```

## Temporais

```python
# Extrair componentes — ciclos sazonais são features poderosas
df['hora']        = df['data'].dt.hour
df['dia_semana']  = df['data'].dt.dayofweek
df['mes']         = df['data'].dt.month
df['e_fds']       = df['dia_semana'].isin([5, 6]).astype(int)
df['e_fim_mes']   = (df['data'].dt.day >= 25).astype(int)

# Lag features para séries temporais (sempre com shift positivo para evitar leakage)
df = df.sort_values(['cliente_id', 'data'])
df['receita_lag_7d']  = df.groupby('cliente_id')['receita'].shift(7)
df['receita_mm_30d']  = df.groupby('cliente_id')['receita'].transform(
    lambda x: x.shift(1).rolling(30).mean()  # shift(1) garante sem leakage
)
```

## Categóricas

```python
from sklearn.preprocessing import OrdinalEncoder, TargetEncoder

# One-Hot: baixa cardinalidade (<20 valores), sem ordem
pd.get_dummies(df, columns=['status', 'uf'], drop_first=True)

# Ordinal: categorias com ordem explícita
enc = OrdinalEncoder(categories=[['baixo','medio','alto']])
df['risco_ord'] = enc.fit_transform(df[['risco']])

# Target Encoding: alta cardinalidade (cidade, produto) — APENAS no treino
enc = TargetEncoder(smooth='auto')
df_train['cidade_enc'] = enc.fit_transform(df_train[['cidade']], y_train)
df_test['cidade_enc']  = enc.transform(df_test[['cidade']])

# Frequency Encoding: alternativa sem risco de leakage
freq = df_train['produto_id'].value_counts(normalize=True)
df['produto_freq'] = df['produto_id'].map(freq).fillna(0)
```

## Agregações (RFM e similares)

```python
# Recency-Frequency-Monetary — o trio clássico de comportamento de cliente
hoje = df['data'].max()
rfm = df.groupby('cliente_id').agg(
    recency   = ('data', lambda x: (hoje - x.max()).days),
    frequency = ('pedido_id', 'count'),
    monetary  = ('valor', 'sum'),
).reset_index()
```

## Armadilhas

- **Target encoding no dataset completo** — vaza o target para features. Use apenas no treino.
- **Features derivadas de médias sem lookback** — em dados temporais, a média de toda a série inclui o futuro. Use `rolling(...).mean()` com `shift(1)`.
- **One-hot em alta cardinalidade** — 10.000 cidades = 10.000 colunas. Use frequency ou target encoding.
- **Normalizar antes de criar features** — crie features nos dados crus, normalize no final via Pipeline.
