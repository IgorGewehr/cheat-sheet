---
title: "Sklearn Patterns — Boas Práticas com Scikit-learn"
category: data-science
stack: [Python, Scikit-learn, Pandas]
tags: [sklearn, pipeline, transformers, ml, produção]
excerpt: "Padrões para usar Scikit-learn de forma robusta: Pipelines que previnem leakage, transformers customizados e search eficiente."
related: [data-leakage, model-selection, ml-pipeline-production, feature-engineering]
updated: 2026-04
---

## Pipeline: A Abstração Central

Pipeline garante que preprocessing é sempre fitado no treino e apenas transformado no teste. É o anti-leakage por design.

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.ensemble import GradientBoostingClassifier

# Definir transformações por tipo de coluna
numeric_features = ['idade', 'receita', 'dias_ativo']
categorical_features = ['plano', 'uf', 'canal']

numeric_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
])

categorical_transformer = Pipeline([
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
])

preprocessor = ColumnTransformer([
    ('num', numeric_transformer, numeric_features),
    ('cat', categorical_transformer, categorical_features),
])

# Pipeline completa
pipe = Pipeline([
    ('preprocessor', preprocessor),
    ('classifier', GradientBoostingClassifier(n_estimators=200)),
])

pipe.fit(X_train, y_train)
pipe.score(X_test, y_test)
```

## Transformer Customizado

Para criar transformações que o sklearn não oferece, seguindo a interface padrão:

```python
from sklearn.base import BaseEstimator, TransformerMixin

class LogTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, columns):
        self.columns = columns

    def fit(self, X, y=None):
        return self  # sem estado para aprender

    def transform(self, X):
        X = X.copy()
        for col in self.columns:
            X[col] = np.log1p(X[col].clip(lower=0))
        return X

class TemporalFeatures(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): return self
    def transform(self, X):
        X = X.copy()
        X['hora']      = pd.to_datetime(X['data']).dt.hour
        X['dia_semana']= pd.to_datetime(X['data']).dt.dayofweek
        return X.drop(columns=['data'])
```

## Hyperparameter Search

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform

param_dist = {
    'classifier__n_estimators':    randint(100, 500),
    'classifier__max_depth':       randint(3, 10),
    'classifier__learning_rate':   uniform(0.01, 0.2),
    'classifier__min_samples_leaf':randint(1, 50),
}

# RandomizedSearch > GridSearch: mesmo orçamento, mais espaço explorado
search = RandomizedSearchCV(
    pipe, param_dist,
    n_iter=50, cv=5,
    scoring='roc_auc',
    random_state=42, n_jobs=-1,
    verbose=1,
)
search.fit(X_train, y_train)
print(f"Best AUC: {search.best_score_:.4f}")
print(search.best_params_)
```

## Serialização e Deploy

```python
import joblib

# Salvar pipeline completa (inclui preprocessor + modelo)
joblib.dump(pipe, 'model_v1.joblib')

# Carregar e usar — garante mesmas transformações em produção
pipe_loaded = joblib.load('model_v1.joblib')
predictions = pipe_loaded.predict_proba(X_new)
```

## Feature Importance com Pipeline

```python
# Acessar o modelo dentro do pipeline
model = pipe.named_steps['classifier']
preprocessor = pipe.named_steps['preprocessor']

# Reconstruir nomes das features após ColumnTransformer
feature_names = (
    numeric_features +
    list(preprocessor.named_transformers_['cat']
         .named_steps['onehot'].get_feature_names_out(categorical_features))
)

importances = pd.Series(model.feature_importances_, index=feature_names)
importances.nlargest(20).plot(kind='barh')
```

## Armadilhas

- **`set_params()` para acessar parâmetros** — use `__` como separador: `pipe.set_params(classifier__n_estimators=300)`.
- **Salvar apenas o modelo, não o preprocessor** — sem a Pipeline, você não consegue reproducir as mesmas transformações.
- **GridSearch com muitos parâmetros** — o espaço cresce exponencialmente. Use RandomizedSearch ou Optuna/BayesSearch.
