---
title: "Overfitting e Underfitting — Diagnóstico e Correção"
category: data-science
stack: [Python, Scikit-learn, Matplotlib]
tags: [overfitting, underfitting, regularização, bias-variance, generalização]
excerpt: "O dilema bias-variance na prática: como diagnosticar se seu modelo memorizou o treino ou é simples demais para aprender o padrão."
related: [ml-evaluation, model-selection, data-leakage, sklearn-patterns]
updated: 2026-04
---

## Diagnóstico Rápido

```python
from sklearn.model_selection import learning_curve
import matplotlib.pyplot as plt

train_sizes, train_scores, val_scores = learning_curve(
    model, X_train, y_train,
    cv=5, scoring='roc_auc',
    train_sizes=np.linspace(0.1, 1.0, 10),
    n_jobs=-1
)

plt.plot(train_sizes, train_scores.mean(axis=1), label='Treino')
plt.plot(train_sizes, val_scores.mean(axis=1),   label='Validação')
plt.legend(); plt.xlabel('Amostras de treino'); plt.ylabel('AUC')
```

**Interpretação:**
- Treino alto, Validação baixa, gap grande → **Overfitting**
- Treino baixo, Validação baixa, gap pequeno → **Underfitting**
- Treino ≈ Validação, ambos altos → **Bom fit**
- Validação sobe com mais dados → **Coleta mais dados** vai ajudar

## Corrigindo Overfitting

**Regularização** (modelos lineares)
```python
from sklearn.linear_model import Ridge, Lasso, ElasticNet

# Ridge: L2 — encolhe todos os coeficientes
ridge = Ridge(alpha=1.0)  # alpha maior = mais regularização

# Lasso: L1 — zera coeficientes (feature selection automático)
lasso = Lasso(alpha=0.01)

# Encontrar alpha ótimo
from sklearn.linear_model import RidgeCV
ridge_cv = RidgeCV(alphas=[0.001, 0.01, 0.1, 1, 10, 100])
ridge_cv.fit(X_train, y_train)
print(f"Melhor alpha: {ridge_cv.alpha_}")
```

**Para árvores e ensembles**
```python
# Principais hiperparâmetros de regularização
params_antioverfitting = {
    # RandomForest / GradientBoosting
    'max_depth': 5,           # limita profundidade das árvores
    'min_samples_leaf': 20,   # mínimo de amostras por folha
    'max_features': 0.7,      # subsample de features por split

    # XGBoost / LightGBM
    'reg_alpha': 0.1,         # L1 regularization
    'reg_lambda': 1.0,        # L2 regularization
    'subsample': 0.8,         # subsample de amostras por árvore
    'colsample_bytree': 0.8,  # subsample de features por árvore
}
```

**Mais dados ou Data Augmentation**
```python
# SMOTE para desbalanceamento (cria amostras sintéticas da classe minoritária)
from imblearn.over_sampling import SMOTE
smote = SMOTE(random_state=42)
X_res, y_res = smote.fit_resample(X_train, y_train)
```

**Early Stopping** (para boosting e redes neurais)
```python
import xgboost as xgb
model = xgb.XGBClassifier(n_estimators=1000, early_stopping_rounds=50)
model.fit(X_train, y_train,
          eval_set=[(X_val, y_val)],
          verbose=False)
print(f"Melhor iteração: {model.best_iteration}")
```

## Corrigindo Underfitting

```python
# 1. Aumentar capacidade do modelo
model = GradientBoostingClassifier(n_estimators=500, max_depth=8)

# 2. Reduzir regularização
ridge = Ridge(alpha=0.0001)

# 3. Adicionar features (feature engineering)

# 4. Remover regularização prematura
# Evite: max_depth=2, min_samples_leaf=100 em datasets com padrões complexos
```

## Armadilhas

- **Treinar mais tempo resolve overfitting** — só para redes neurais com early stopping. Para árvores sem controle, mais iterações = mais overfitting.
- **Dropout resolve tudo em redes neurais** — dropout complementa regularização L2, não a substitui.
- **Aumentar o dataset sempre resolve overfitting** — se o modelo tem capacidade muito alta e o padrão é simples, mais dados não ajudam: regularize primeiro.
