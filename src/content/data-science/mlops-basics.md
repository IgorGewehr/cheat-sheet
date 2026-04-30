---
title: "MLOps Básico — Servir e Monitorar Modelos em Produção"
category: data-science
stack: [Python, MLflow, Docker, FastAPI]
tags: [mlops, monitoramento, drift, versionamento, produção]
excerpt: "MLOps é a diferença entre um modelo que funciona no notebook e um modelo que funciona confiabilidade por meses em produção."
related: [ml-pipeline-production, ml-evaluation, overfitting-strategies]
updated: 2026-04
---

## O que MLOps resolve

- **Reproduzibilidade**: "Eu treinei esse modelo na semana passada mas não consigo reproduzir"
- **Data Drift**: "O modelo funcionou bem 3 meses e agora está errando tudo"
- **Deploy caótico**: "Qual versão está em produção mesmo?"
- **Debug impossível**: "O modelo errou, mas eu não sei com quais dados"

## Experiment Tracking com MLflow

```python
import mlflow
import mlflow.sklearn

mlflow.set_experiment("churn_prediction_v2")

with mlflow.start_run(run_name="lgbm_baseline"):
    # Logar parâmetros
    mlflow.log_params({
        'n_estimators': 500,
        'learning_rate': 0.05,
        'max_depth': 6,
    })

    model.fit(X_train, y_train)

    # Logar métricas
    mlflow.log_metrics({
        'train_auc': roc_auc_score(y_train, model.predict_proba(X_train)[:, 1]),
        'val_auc':   roc_auc_score(y_val,   model.predict_proba(X_val)[:, 1]),
    })

    # Logar modelo com preprocessor
    mlflow.sklearn.log_model(pipeline, "model")

# Ver experimentos: mlflow ui
```

## Monitoramento de Data Drift

Data drift = a distribuição dos dados de entrada mudou em relação ao treino. Causa queda silenciosa de performance.

```python
from scipy.stats import ks_2samp

def detectar_drift(X_treino: pd.DataFrame, X_prod: pd.DataFrame,
                   threshold: float = 0.05) -> dict:
    """Kolmogorov-Smirnov test para cada feature numérica"""
    resultados = {}
    for col in X_treino.select_dtypes(include='number').columns:
        stat, p_value = ks_2samp(X_treino[col].dropna(), X_prod[col].dropna())
        resultados[col] = {'drift': p_value < threshold, 'p_value': p_value}
    return resultados

# Rodar semanalmente com amostra dos últimos 7 dias de produção
drift_report = detectar_drift(X_treino_ref, X_producao_ultima_semana)
features_com_drift = [k for k, v in drift_report.items() if v['drift']]
```

## Monitoramento de Performance

Quando você tem feedback do ground truth (ex: em churn, sabe 30 dias depois se o cliente churnou):

```python
# Guardar predições com timestamp
predictions_log = pd.DataFrame({
    'cliente_id':   ids,
    'probabilidade': probas,
    'data_predicao': pd.Timestamp.now(),
})
predictions_log.to_parquet('predictions/2026-04-30.parquet')

# 30 dias depois, calcular AUC real
ground_truth = pd.read_parquet('ground_truth/2026-04-30.parquet')
merged = predictions_log.merge(ground_truth, on='cliente_id')
auc_real = roc_auc_score(merged['churnou'], merged['probabilidade'])

# Alertar se AUC cair >5% em relação ao baseline
if auc_real < baseline_auc * 0.95:
    alertar("DRIFT DE PERFORMANCE DETECTADO")
```

## Quando Retreinar

| Sinal | Ação |
|-------|------|
| AUC de produção cai >5% do baseline | Retreinar com dados recentes |
| Drift detectado em feature crítica | Investigar causa → retreinar |
| Nova categoria dominante nos dados | Retreinar |
| Mudança de negócio (nova oferta, sazonalidade) | Retreinar + checar features |

```python
# Retreino com sliding window (dados mais recentes têm mais peso)
cutoff = pd.Timestamp.now() - pd.DateOffset(months=6)
X_recent = df[df['data'] >= cutoff]
model.fit(X_recent, y_recent)
```

## Armadilhas

- **Não logar as predições** — sem log, você não consegue diagnosticar erros nem calcular AUC real.
- **Retreinar sem comparar com a versão anterior** — o novo modelo pode ser pior. Sempre compare métricas antes de promover.
- **Drift em feature não implica queda de performance** — investigue antes de retreinar compulsivamente.
- **Usar o mesmo test set para comparar versões** — o test set original não representa a distribuição atual. Use dados recentes.
