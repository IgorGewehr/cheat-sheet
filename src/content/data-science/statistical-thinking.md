---
title: "Pensamento Estatístico para Engenheiros"
category: data-science
stack: [Python, SciPy, Statsmodels, NumPy]
tags: [estatística, testes, distribuições, inferência, ab-testing]
excerpt: "Os conceitos estatísticos que engenheiros precisam dominar para não tirar conclusões erradas de dados reais."
related: [eda-workflow, ml-evaluation, data-cleaning]
updated: 2026-04
---

## Por Que Engenheiros Precisam de Estatística

Você toma decisões com dados toda semana: "Esse deploy melhorou a latência?", "Esse segmento de clientes compra mais?", "Esse feature importa para o modelo?". Sem estatística, você decide com anedota.

## Distribuições que Aparecem em Produção

```python
import numpy as np
import scipy.stats as stats

# Latência de API: quase sempre Log-Normal (não Normal!)
# A média é enganosa — use percentis
latencias = np.array([...])  # ms
print(f"p50: {np.percentile(latencias, 50):.1f}ms")
print(f"p95: {np.percentile(latencias, 95):.1f}ms")  # o que o usuário lento experimenta
print(f"p99: {np.percentile(latencias, 99):.1f}ms")  # cauda pesada

# Valores monetários: geralmente Pareto (poucos clientes, muito valor)
# Converter para log antes de modelar
log_receita = np.log1p(receita)

# Erros por hora: Poisson
# Contagens de eventos raros em janela de tempo fixa
```

## Testes de Hipótese na Prática

**A/B Testing:**
```python
from scipy.stats import chi2_contingency, ttest_ind

# Conversão (métrica binária): Chi-quadrado ou Z-test de proporções
conversoes_a = [1, 0, 1, 1, 0, ...]
conversoes_b = [1, 1, 1, 0, 1, ...]

# Tabela de contingência
tabela = [[sum(conversoes_a), len(conversoes_a) - sum(conversoes_a)],
          [sum(conversoes_b), len(conversoes_b) - sum(conversoes_b)]]
chi2, p_value, _, _ = chi2_contingency(tabela)
print(f"p-value: {p_value:.4f}")

# Métrica contínua (receita, tempo de sessão): t-test
t_stat, p_value = ttest_ind(receitas_a, receitas_b, equal_var=False)
```

**Tamanho de amostra antes de começar o teste:**
```python
from statsmodels.stats.power import NormalIndPower

# Quantos usuários por grupo para detectar um efeito de 2%?
effect_size = 0.02  # diferença absoluta na taxa de conversão
baseline = 0.10     # taxa atual
power = NormalIndPower()
n = power.solve_power(effect_size=effect_size/np.sqrt(baseline*(1-baseline)),
                      power=0.8, alpha=0.05)
print(f"Usuários por grupo necessários: {int(n)}")
```

## Erros Comuns de Interpretação

**p-value não é probabilidade do efeito ser real:**
- p < 0.05 não significa "95% de chance de que o efeito existe"
- Significa: "se o efeito fosse zero, teríamos <5% de chance de ver esses dados"
- Com amostra grande, qualquer efeito minúsculo tem p < 0.05

**Effect Size importa mais que p-value:**
```python
from scipy.stats import ttest_ind

# Grupo A: 1M usuários, conversão 10.001%
# Grupo B: 1M usuários, conversão 10.000%
# p < 0.05 mas effect size = 0.001% — irrelevante para o negócio

# Sempre calcule Cohen's d ou lift relativo
def cohen_d(x, y):
    return (np.mean(x) - np.mean(y)) / np.sqrt((np.std(x)**2 + np.std(y)**2) / 2)
```

**Múltiplos testes sem correção:**
```python
# Se você testa 20 métricas com alpha=0.05, espera 1 falso positivo por acaso
# Correção de Bonferroni:
alpha_corrigido = 0.05 / n_testes  # mais conservador
# Ou use FDR (False Discovery Rate) para grandes números de testes
from statsmodels.stats.multitest import multipletests
_, p_adjusted, _, _ = multipletests(p_values, method='fdr_bh')
```

## Armadilhas

- **Parar o teste quando p < 0.05** — "peeking" infla o falso positivo. Defina o tamanho amostral antes.
- **Ignorar variância** — duas médias iguais com variâncias diferentes contam histórias completamente diferentes.
- **Assumir normalidade** — dados de negócio raramente são normais. Verifique com `stats.normaltest()`.
- **Correlação causal** — correlação entre sorvete e afogamentos não implica que sorvete causa afogamentos. Ambos sobem no verão.
