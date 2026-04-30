---
title: "EDA Sistemático — do Raw Data ao Insight Acionável"
category: data-science
stack: [Python, Pandas, Matplotlib, Seaborn]
tags: [eda, análise exploratória, dados, hipóteses]
excerpt: "Processo estruturado de Exploratory Data Analysis que transforma dados brutos em hipóteses validadas antes de qualquer modelagem."
related: [pandas-patterns, data-cleaning, statistical-thinking]
updated: 2026-04
---

## Visão Geral

EDA não é "olhar os dados" — é um protocolo científico que responde três perguntas antes de qualquer modelo: O que eu tenho? O que está errado? O que vale investigar?

## Protocolo em 5 Etapas

**1. Shape & Schema** — entenda estrutura antes de conteúdo
```python
df.shape, df.dtypes, df.info()
df.head(), df.sample(10)  # sample > head para ver variação
```

**2. Missing & Outliers** — mapeie o problema antes de corrigir
```python
df.isnull().sum() / len(df)  # % de nulos por coluna
df.describe(percentiles=[.01, .05, .25, .5, .75, .95, .99])
# Outliers: IQR method
Q1, Q3 = df[col].quantile([0.25, 0.75])
outliers = df[(df[col] < Q1 - 1.5*(Q3-Q1)) | (df[col] > Q3 + 1.5*(Q3-Q1))]
```

**3. Distribuições** — histogramas antes de médias
```python
df.hist(figsize=(16, 12), bins=50)  # visão geral
# Para colunas categóricas:
df[col].value_counts(normalize=True).head(20)
```

**4. Correlações** — suspeite de >0.9 (leakage) e <0.01 (ruído)
```python
corr = df.select_dtypes(include='number').corr()
import seaborn as sns
sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm')
```

**5. Target Analysis** — entenda o que você quer prever
```python
# Classificação: verifique desbalanceamento
df['target'].value_counts(normalize=True)
# Regressão: verifique distribuição e skewness
df['target'].skew()  # >1 ou <-1: considere log transform
```

## Armadilhas

- **Olhar a média sem a distribuição** — a média esconde bimodalidade, caudas pesadas, outliers. Sempre plote.
- **Tratar nulos antes de entender por que existem** — nulo em "data de saída" significa que o cliente ainda está ativo, não é dado faltante.
- **Correlacionar tudo com o target sem split temporal** — em dados com componente temporal, correlação no dataset completo vaza o futuro.
- **Escalar dados antes do EDA** — escale depois. Durante EDA você precisa das unidades reais para detectar anomalias.

## Quando o EDA está pronto

- Você consegue explicar em 3 frases o que o dataset representa
- Você sabe quais colunas têm problemas de qualidade e qual a causa
- Você tem pelo menos 2 hipóteses testáveis sobre o que influencia o target
- Você identificou se há data leakage potencial
