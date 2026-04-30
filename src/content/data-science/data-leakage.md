---
title: "Data Leakage — o Erro Mais Silencioso do ML"
category: data-science
stack: [Python, Pandas, Scikit-learn]
tags: [leakage, overfitting, validação, pipeline]
excerpt: "Data leakage acontece quando informação do futuro contamina o treino, gerando modelos com performance irreal que colapsam em produção."
related: [ml-evaluation, ml-pipeline-production, overfitting-strategies]
updated: 2026-04
---

## O Problema

Um modelo com 99% de acurácia no test set que cai para 60% em produção quase sempre tem leakage. Você treinou com informação que não existiria no momento da predição.

## Tipos de Leakage

**Target Leakage** — feature que é consequência do target, não causa
```
Problema: prever churn usando "número de chamados de cancelamento"
Por quê: chamados de cancelamento acontecem porque o cliente vai churnar
Correto: usar apenas dados disponíveis ANTES do evento de churn
```

**Temporal Leakage** — dados do futuro no treino
```python
# ERRADO: split aleatório em séries temporais
X_train, X_test = train_test_split(df, test_size=0.2, random_state=42)

# CORRETO: split temporal
cutoff = df['date'].quantile(0.8)
X_train = df[df['date'] <= cutoff]
X_test  = df[df['date'] >  cutoff]
```

**Preprocessing Leakage** — normalização/imputação feita antes do split
```python
# ERRADO: fit no dataset completo
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)  # vazou estatísticas do test set
X_train, X_test = train_test_split(X_scaled, ...)

# CORRETO: fit apenas no treino
X_train, X_test = train_test_split(X, ...)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test  = scaler.transform(X_test)  # apenas transform, nunca fit
```

**Duplicate Leakage** — amostras duplicadas ou muito similares em treino e teste
```python
# Verificar duplicatas antes do split
df.duplicated().sum()
# Para dados de clientes: um cliente não pode aparecer em treino E teste
```

## Pipeline Correta (Anti-Leakage)

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

# Pipeline garante que preprocessing é fitado APENAS no treino
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('model', RandomForestClassifier())
])

# Cross-validation sem leakage
from sklearn.model_selection import cross_val_score
scores = cross_val_score(pipe, X_train, y_train, cv=5)
```

## Diagnóstico

Suspeite de leakage quando:
- Performance no test muito acima do baseline óbvio
- Feature importance mostra uma coluna com importância muito acima das demais
- Remover uma feature "estranha" derruba drasticamente a performance
- Performance em produção < performance no test por margem grande

## Checklist Anti-Leakage

- [ ] Split temporal antes de qualquer preprocessing
- [ ] Preprocessing dentro de Pipeline ou fitado apenas no train
- [ ] Verificar se alguma feature é temporalmente posterior ao target
- [ ] Verificar duplicatas antes do split
- [ ] Features derivadas de agregações usam window functions com lookback correto
