---
title: "Limpeza de Dados — Estratégias para Dados Sujos de Produção"
category: data-science
stack: [Python, Pandas, NumPy]
tags: [limpeza, dados, qualidade, imputação, outliers]
excerpt: "Dados de produção são sempre sujos. Estratégias para tratar nulos, outliers, inconsistências e duplicatas sem destruir informação real."
related: [eda-workflow, pandas-patterns, feature-engineering, data-leakage]
updated: 2026-04
---

## Princípio

**Entenda antes de corrigir.** Cada "problema" nos dados tem uma causa. Tratar sem entender a causa gera dados "limpos" mas semanticamente errados.

## Valores Nulos: Mecanismos e Estratégias

Antes de imputar, entenda o mecanismo:

| Mecanismo | Exemplo | Estratégia |
|-----------|---------|-----------|
| **MCAR** — Missing Completely At Random | Falha de sensor aleatória | Imputar com média/mediana |
| **MAR** — Missing At Random (depende de outra coluna) | Renda nula para desempregados | Imputar por grupo |
| **MNAR** — Missing Not At Random | Salário nulo porque não quer revelar | Criar flag `is_null`, não imputar |

```python
# Diagnóstico: nulos são aleatórios ou têm padrão?
df['tem_renda'] = df['renda'].notna().astype(int)
# Se 'tem_renda' correlaciona com target → MNAR → não imputar!
df.groupby('tem_renda')['churnou'].mean()

# Imputação por grupo (MAR)
df['renda'] = df.groupby('ocupacao')['renda'].transform(
    lambda x: x.fillna(x.median())
)

# Flag de nulo + imputação (MNAR)
df['renda_missing'] = df['renda'].isna().astype(int)
df['renda'] = df['renda'].fillna(0)  # valor sentinel, não a média
```

## Outliers: Remover vs. Transformar vs. Manter

```python
# Detecção com IQR (robusto a outliers)
def iqr_bounds(series, k=1.5):
    Q1 = series.quantile(0.25)
    Q3 = series.quantile(0.75)
    IQR = Q3 - Q1
    return Q1 - k * IQR, Q3 + k * IQR

lower, upper = iqr_bounds(df['receita'])
outliers = df[(df['receita'] < lower) | (df['receita'] > upper)]
print(f"{len(outliers)} outliers ({len(outliers)/len(df):.1%})")

# Opção 1: Remover (só se outlier é erro de medição)
df_clean = df[df['receita'].between(lower, upper)]

# Opção 2: Clampar (winsorization — mantém informação ordinal)
df['receita'] = df['receita'].clip(lower=lower, upper=upper)

# Opção 3: Log transform (reduz impacto sem remover)
df['receita_log'] = np.log1p(df['receita'].clip(lower=0))
```

**Regra:** um cliente que comprou R$ 500k é um outlier REAL e importante. Não remova — entenda e trate (log transform ou feature separada para grandes clientes).

## Inconsistências e Padronização

```python
# Strings inconsistentes
df['uf'] = (df['uf']
    .str.strip()
    .str.upper()
    .replace({'S.PAULO': 'SP', 'SÃO PAULO': 'SP', 'SAOPAULO': 'SP'})
)

# Datas inconsistentes
df['data'] = pd.to_datetime(df['data'], errors='coerce', dayfirst=True)
datas_invalidas = df['data'].isna().sum()

# Valores fora do domínio
# Idade negativa, percentual > 100, preço = 0 para produto obrigatório
df = df[df['idade'].between(0, 120)]
df = df[df['desconto_pct'].between(0, 100)]
```

## Duplicatas

```python
# Duplicatas exatas
df.duplicated().sum()
df = df.drop_duplicates()

# Duplicatas por chave de negócio
# Um cliente pode aparecer múltiplas vezes por eventos distintos
duplicatas_cliente = df.duplicated(subset=['cliente_id', 'data_pedido']).sum()

# Resolver: manter o mais recente por grupo
df = (df
    .sort_values('criadoEm', ascending=False)
    .drop_duplicates(subset=['cliente_id'], keep='first')
)
```

## Checklist de Qualidade

```python
def data_quality_report(df):
    return pd.DataFrame({
        'nulos_%':       df.isnull().mean() * 100,
        'unicos':        df.nunique(),
        'dtype':         df.dtypes,
        'zeros_%':       (df == 0).mean() * 100,
        'negativos_%':   (df < 0).mean() * 100,
    }).round(2)

print(data_quality_report(df))
```

## Armadilhas

- **Imputar a média sem criar flag** — se nulo tem significado (MNAR), a imputação destrói essa informação.
- **Remover outliers antes do EDA** — você pode estar removendo os casos mais informativos do negócio.
- **Limpar dados antes do split treino/teste** — imputação com estatísticas do dataset completo vaza o teste no treino.
