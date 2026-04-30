---
title: "ML Pipeline para Produção — do Notebook ao Serviço"
category: data-science
stack: [Python, FastAPI, Scikit-learn, Docker]
tags: [mlops, produção, pipeline, deploy, api]
excerpt: "A distância entre um notebook funcionando e um modelo em produção confiável é onde a maioria dos projetos de ML falha."
related: [mlops-basics, sklearn-patterns, data-leakage, overfitting-strategies]
updated: 2026-04
---

## O Gap Notebook → Produção

Notebook: executa de cima para baixo, dados carregados manualmente, sem versionamento de dados ou modelo, sem testes, sem monitoramento.

Produção: precisa de dados de entrada validados, preprocessing idêntico ao treino, predição em <200ms, logs de cada predição, drift detection.

## Estrutura Mínima

```
ml_service/
├── model/
│   ├── train.py          # script de treino reproduzível
│   ├── evaluate.py       # métricas e análise de erros
│   └── artifacts/
│       ├── pipeline.joblib   # preprocessor + model
│       └── metrics.json      # métricas do treino
├── api/
│   ├── main.py           # FastAPI endpoint
│   ├── schemas.py        # Pydantic input/output validation
│   └── predict.py        # lógica de predição
├── tests/
│   ├── test_preprocessing.py
│   └── test_predict.py
└── Dockerfile
```

## Train Script Reproduzível

```python
# train.py
import joblib, json
from datetime import datetime

def train(data_path: str, output_dir: str):
    df = pd.read_parquet(data_path)
    X = df.drop(columns=['target'])
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipe = build_pipeline()  # sua Pipeline sklearn
    pipe.fit(X_train, y_train)

    # Avaliar e salvar métricas
    y_proba = pipe.predict_proba(X_test)[:, 1]
    metrics = {
        'auc_roc': roc_auc_score(y_test, y_proba),
        'pr_auc': average_precision_score(y_test, y_proba),
        'train_date': datetime.utcnow().isoformat(),
        'n_train': len(X_train),
        'n_test': len(X_test),
    }

    joblib.dump(pipe, f'{output_dir}/pipeline.joblib')
    json.dump(metrics, open(f'{output_dir}/metrics.json', 'w'))
    return metrics
```

## API com FastAPI

```python
# api/main.py
from fastapi import FastAPI
from pydantic import BaseModel, validator
import joblib, numpy as np

app = FastAPI()
pipe = joblib.load('model/artifacts/pipeline.joblib')

class PredictionInput(BaseModel):
    cliente_id: str
    receita: float
    dias_ativo: int
    plano: str

    @validator('receita')
    def receita_positiva(cls, v):
        if v < 0: raise ValueError('receita deve ser >= 0')
        return v

class PredictionOutput(BaseModel):
    cliente_id: str
    probabilidade_churn: float
    decisao: str

@app.post('/predict', response_model=PredictionOutput)
def predict(input: PredictionInput):
    df = pd.DataFrame([input.dict()])
    proba = pipe.predict_proba(df)[0, 1]

    # Log da predição (para monitoramento futuro)
    logger.info({'input': input.dict(), 'proba': float(proba)})

    return PredictionOutput(
        cliente_id=input.cliente_id,
        probabilidade_churn=round(float(proba), 4),
        decisao='risco_alto' if proba > 0.7 else 'risco_baixo',
    )
```

## Testes Críticos

```python
# test_preprocessing.py
def test_pipeline_sem_leakage():
    """Pipeline deve produzir resultados idênticos entre fit/transform e transform"""
    pipe.fit(X_train, y_train)
    pred_1 = pipe.predict_proba(X_test)
    pred_2 = pipe.predict_proba(X_test)  # segunda chamada
    np.testing.assert_array_almost_equal(pred_1, pred_2)

def test_missing_values():
    """API deve lidar com valores faltantes sem explodir"""
    X_missing = X_test.copy()
    X_missing.iloc[0, 0] = np.nan
    preds = pipe.predict_proba(X_missing)
    assert not np.any(np.isnan(preds))

def test_novos_valores_categoricos():
    """Modelo não deve quebrar com categoria nunca vista no treino"""
    X_new = X_test.copy()
    X_new.iloc[0, categorical_col_idx] = 'CATEGORIA_NOVA'
    preds = pipe.predict_proba(X_new)  # handle_unknown='ignore'
    assert preds.shape == (len(X_new), 2)
```

## Armadilhas

- **Carregar modelo na request** — carregue no startup da aplicação, não a cada request.
- **Não versionar artefatos** — inclua data, hash dos dados e métricas no nome do artifact.
- **Assumir que o input de produção é limpo** — valide sempre com Pydantic ou similar antes de passar ao modelo.
- **Deploy sem baseline de latência** — meça p50/p95/p99 antes de ir ao ar.
