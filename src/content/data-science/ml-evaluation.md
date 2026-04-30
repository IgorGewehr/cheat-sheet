---
title: "Avaliação de Modelos — Métricas Além da Acurácia"
category: data-science
stack: [Python, Scikit-learn, Matplotlib]
tags: [métricas, avaliação, classificação, regressão, ml]
excerpt: "Escolher a métrica errada é tão fatal quanto usar o modelo errado. A métrica deve refletir o custo real dos erros do negócio."
related: [model-selection, data-leakage, overfitting-strategies, mlops-basics]
updated: 2026-04
---

## Classificação

### Quando acurácia engana

Dataset com 99% da classe A e 1% da classe B: um modelo que chuta sempre A tem 99% de acurácia e é completamente inútil.

### Métricas por contexto

| Contexto | Métrica | Por quê |
|---------|---------|---------|
| Detecção de fraude | Recall da classe fraude | Falso negativo (fraude não detectada) é caro |
| Diagnóstico médico | Recall (sensibilidade) | Falso negativo = doença não detectada |
| Spam filter | Precision | Falso positivo = email legítimo na lixeira |
| Ranking / Recomendação | AUC-ROC, NDCG | Importa a ordenação, não o threshold |
| Balanceado entre erros | F1-score | Média harmônica precision/recall |
| Classes muito desbalanceadas | PR-AUC > ROC-AUC | ROC é otimista em desbalanceamento |

```python
from sklearn.metrics import (classification_report, confusion_matrix,
                              roc_auc_score, average_precision_score)

print(classification_report(y_test, y_pred))

# AUC-ROC: usa probabilidades, não threshold
auc_roc = roc_auc_score(y_test, y_pred_proba[:, 1])

# PR-AUC: melhor para classes desbalanceadas
pr_auc = average_precision_score(y_test, y_pred_proba[:, 1])
```

### Calibração

Quando você precisa que a probabilidade predita reflita a probabilidade real (ex: "70% de chance de churn"):
```python
from sklearn.calibration import calibration_curve, CalibratedClassifierCV

# Verificar calibração
prob_true, prob_pred = calibration_curve(y_test, y_proba, n_bins=10)
# Se a curva se afasta da diagonal, o modelo não está calibrado

# Calibrar um modelo
calibrated = CalibratedClassifierCV(model, method='isotonic', cv='prefit')
calibrated.fit(X_val, y_val)
```

## Regressão

```python
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

mae  = mean_absolute_error(y_test, y_pred)   # interpretável na unidade original
rmse = root_mean_squared_error(y_test, y_pred) # penaliza erros grandes
r2   = r2_score(y_test, y_pred)               # % da variância explicada

# MAPE: cuidado com zeros no target
mape = np.mean(np.abs((y_test - y_pred) / y_test.clip(lower=1e-8))) * 100
```

**RMSE vs MAE**: se erros grandes são proporcionalmente mais custosos, use RMSE. Se todos os erros têm custo linear, use MAE.

## Validação Robusta

```python
from sklearn.model_selection import StratifiedKFold, cross_validate

# StratifiedKFold mantém proporção das classes em cada fold
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

results = cross_validate(model, X, y, cv=cv,
    scoring=['roc_auc', 'average_precision', 'f1'],
    return_train_score=True)

# Train score >> Test score = overfitting
print(f"AUC treino: {results['train_roc_auc'].mean():.4f}")
print(f"AUC teste:  {results['test_roc_auc'].mean():.4f}")
```

## Análise de Erros

A métrica diz *quanto* você erra. A análise de erros diz *onde*:

```python
# Quais exemplos o modelo mais erra?
errors = df_test.copy()
errors['pred'] = y_pred
errors['proba'] = y_proba
errors['correto'] = y_pred == y_test

# Perfil dos erros
errors[~errors['correto']].describe()
errors[~errors['correto']]['segmento'].value_counts()
# Padrão típico: o modelo falha sistematicamente em um subgrupo
```

## Armadilhas

- **Reportar apenas a métrica principal** — sempre mostre pelo menos 3 métricas + confusion matrix.
- **Avaliar uma vez no test set e iterar** — o test set fica "contaminado" com cada iteração. Use CV no train, test apenas no final.
- **Ignorar calibração em problemas de decisão** — probabilidade não-calibrada com threshold fixo gera decisões erradas.
