---
title: "Seleção de Modelos — Quando Usar Cada Algoritmo"
category: data-science
stack: [Python, Scikit-learn, XGBoost, LightGBM]
tags: [modelos, algoritmos, ml, seleção]
excerpt: "Guia de decisão para escolher o modelo certo: começa simples, escala complexity apenas quando os dados justificam."
related: [ml-evaluation, overfitting-strategies, sklearn-patterns, feature-engineering]
updated: 2026-04
---

## Regra de Ouro

**Comece com o modelo mais simples que pode funcionar.** Um modelo linear mal-compreendido é mais perigoso que um modelo linear simples. Complexidade só se justifica com dados suficientes e performance que valide o custo.

## Guia de Decisão

### Classificação Binária / Multiclasse

| Situação | Modelo Indicado |
|----------|----------------|
| Baseline rápido, interpretabilidade necessária | Logistic Regression |
| Dados tabulares, <100k amostras | Random Forest |
| Dados tabulares, performance máxima | XGBoost / LightGBM |
| Features de texto | Logistic Regression + TF-IDF ou BERT |
| Muitas classes, hierarquia | LightGBM com class weights |

### Regressão

| Situação | Modelo Indicado |
|----------|----------------|
| Relação linear, interpretabilidade | Ridge / Lasso |
| Features com alta correlação (multicolinearidade) | Ridge |
| Seleção automática de features | Lasso / ElasticNet |
| Não-linearidades, interações | Random Forest / XGBoost |
| Séries temporais com sazonalidade | Prophet / SARIMA / LightGBM com lag features |

### Quando usar Deep Learning

Use redes neurais apenas quando:
- Dados > 100k amostras (ou transfer learning disponível)
- Input é imagem, texto ou áudio
- Embeddings de alta dimensão são necessários
- Tabulares com >1M amostras e relações muito complexas

Para a maioria dos problemas de negócio com dados tabulares, **XGBoost ou LightGBM superam redes neurais**.

## Baseline Obrigatório

Sempre calcule um baseline ingênuo ANTES de qualquer modelo:

```python
from sklearn.dummy import DummyClassifier, DummyRegressor

# Classificação: baseline = classe majoritária
dummy = DummyClassifier(strategy='most_frequent')
dummy.fit(X_train, y_train)
print(f"Baseline accuracy: {dummy.score(X_test, y_test):.3f}")

# Regressão: baseline = média do target
dummy = DummyRegressor(strategy='mean')
dummy.fit(X_train, y_train)
# RMSE do baseline
from sklearn.metrics import root_mean_squared_error
print(f"Baseline RMSE: {root_mean_squared_error(y_test, dummy.predict(X_test)):.3f}")
```

Se seu modelo mal bate o baseline, o problema está nos dados ou nas features — não no algoritmo.

## XGBoost / LightGBM: Defaults Razoáveis

```python
import lightgbm as lgb
from sklearn.model_selection import cross_val_score

model = lgb.LGBMClassifier(
    n_estimators=500,
    learning_rate=0.05,
    num_leaves=31,         # controla complexidade
    min_child_samples=20,  # regularização
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    n_jobs=-1,
)
scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
print(f"CV AUC: {scores.mean():.4f} ± {scores.std():.4f}")
```

## Armadilhas

- **Tunagem de hiperparâmetros antes de validar o problema** — tune depois de confirmar que a abordagem faz sentido.
- **Comparar modelos em test set** — compare no validation set ou CV. Test set é usado UMA vez.
- **Ignorar o baseline** — um modelo com 95% de acurácia em dataset 95% desbalanceado é inútil.
- **"XGBoost sempre ganha"** — para datasets pequenos (<500 amostras), modelos mais simples generalizam melhor.
