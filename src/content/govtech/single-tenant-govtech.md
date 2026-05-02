---
title: "Single-tenant vs Multi-tenant para prefeituras brasileiras"
category: "govtech"
stack: ["Kubernetes", "ArgoCD", "Helm", "PostgreSQL", "Terraform", "NestJS"]
tags: ["multi-tenant", "single-tenant", "isolamento", "lgpd", "k8s", "argocd", "helm", "govtech"]
excerpt: "Prefeituras exigem isolamento de dados por obrigação legal (LGPD) e requisitos de licitação. Este card compara estratégias de isolamento e apresenta implementação com ArgoCD ApplicationSet, PostgreSQL RLS e Terraform por município."
---

## Visão Geral

Em GovTech, a decisão de isolamento de dados não é arquitetural — é **legal e política**. Editais de licitação frequentemente exigem cláusulas como "os dados do município não poderão ser acessados por outros clientes do fornecedor". Isso elimina na prática o multi-tenant tradicional (banco compartilhado com `tenant_id`).

As estratégias disponíveis em ordem crescente de isolamento:

| Estratégia | Isolamento | Custo operacional | Risco LGPD |
|------------|-----------|-------------------|------------|
| Multi-tenant (banco único) | Baixo | Mínimo | Alto — bug = cross-tenant leak |
| Row-Level Security (RLS) | Médio | Baixo | Médio — depende de implementação |
| Database separado por tenant | Alto | Médio | Baixo |
| Namespace K8s por tenant | Muito alto | Alto | Mínimo |
| Cluster separado por tenant | Máximo | Máximo | Zero |

## Contexto B2G

Por que prefeituras exigem isolamento:

1. **LGPD**: dado de cidadão do Município A não pode vazar para Município B — responsabilidade do gestor municipal
2. **Licitações**: editais TRE/TCE frequentemente exigem "ambiente exclusivo"
3. **Customização fiscal**: cada município tem alíquotas, prazos, regras de isenção distintas
4. **SLA independente**: manutenção em Município A não pode afetar Município B
5. **Auditoria**: TCE estadual precisa acessar dados do município sem ver dados de outros

Na prática: para contratos de até 5 prefeituras pequenas, DB separado no mesmo cluster resolve. Para 50+ prefeituras, GitOps com ArgoCD ApplicationSet por município.

## Quando usar

- **Row-Level Security (RLS)**: POC, MVP com 2-3 municípios, quando o edital não exige isolamento explícito
- **Database separado**: quando o edital exige "dados isolados" mas não "ambiente dedicado" — 5-50 municípios
- **Namespace K8s separado**: quando o edital exige "ambiente dedicado" — 20-200 municípios em cloud compartilhada
- **Cluster separado**: municípios grandes (capital estadual), contratos com exigência de on-premise

## Trade-offs

### Custo estimado por estratégia (10 municípios)

| Estratégia | Infra/mês | Ops time/semana | Deploy de update |
|------------|-----------|-----------------|-----------------|
| RLS banco único | R$ 800 | 2h | 5 min |
| DB separado, K8s compartilhado | R$ 1.500 | 4h | 15 min por município |
| Namespace K8s por município | R$ 3.000 | 6h | ArgoCD automático |
| Cluster por município | R$ 8.000 | 12h | ArgoCD automático |

O modelo **namespace K8s + ArgoCD ApplicationSet** é o sweet spot para 10-200 municípios: isolamento suficiente para editais + automação que escala.

## Implementação

### Estrutura de repositório GitOps

```
infra/
  helm/
    municipio-app/
      Chart.yaml
      values.yaml              # defaults
      values-sao-paulo.yaml    # override por município
      values-campinas.yaml
      templates/
        deployment.yaml
        service.yaml
        ingress.yaml
        configmap.yaml
        secret.yaml
  argocd/
    applicationset.yaml        # gera um Application por município
  terraform/
    modules/
      municipio/
        main.tf                # RDS, namespace, secrets
    environments/
      sao-paulo/
        main.tf
      campinas/
        main.tf
```

### ArgoCD ApplicationSet por município

```yaml
# infra/argocd/applicationset.yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: municipios
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - municipio: sao-paulo
            slug: sp
            dominio: sp.sistema.gov.br
            regiao: sa-east-1
            plano: enterprise
          - municipio: campinas
            slug: campinas
            dominio: campinas.sistema.gov.br
            regiao: sa-east-1
            plano: standard
          - municipio: santos
            slug: santos
            dominio: santos.sistema.gov.br
            regiao: sa-east-1
            plano: standard

  template:
    metadata:
      name: "municipio-{{municipio}}"
      labels:
        municipio: "{{municipio}}"
        plano: "{{plano}}"
    spec:
      project: govtech-municipios

      source:
        repoURL: https://github.com/empresa/govtech-infra
        targetRevision: main
        path: infra/helm/municipio-app
        helm:
          valueFiles:
            - values.yaml
            - "values-{{slug}}.yaml"
          parameters:
            - name: municipio.slug
              value: "{{slug}}"
            - name: municipio.dominio
              value: "{{dominio}}"
            - name: municipio.plano
              value: "{{plano}}"

      destination:
        server: https://kubernetes.default.svc
        namespace: "municipio-{{slug}}"  # namespace isolado por município

      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
          - PrunePropagationPolicy=foreground
```

### PostgreSQL Row Level Security (para o modelo RLS)

```sql
-- migrations/001_setup_rls.sql

-- Habilitar RLS na tabela principal
ALTER TABLE cidadaos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_iptu ENABLE ROW LEVEL SECURITY;

-- Policy: cada sessão só vê dados do próprio município
CREATE POLICY municipio_isolation ON cidadaos
  USING (municipio_id = current_setting('app.municipio_id')::uuid);

CREATE POLICY municipio_isolation ON lancamentos_iptu
  USING (municipio_id = current_setting('app.municipio_id')::uuid);

-- IMPORTANTE: o superuser bypassa RLS por padrão
-- Criar role sem bypass para a aplicação
CREATE ROLE app_user NOINHERIT;
ALTER ROLE app_user SET row_security = on;
-- NÃO dar BYPASSRLS ao app_user

-- Conceder permissões mínimas
GRANT SELECT, INSERT, UPDATE, DELETE ON cidadaos TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON lancamentos_iptu TO app_user;

-- Bloquear acesso de um município aos dados de outro
-- mesmo que RLS seja desativado por bug:
CREATE POLICY deny_cross_tenant ON cidadaos AS RESTRICTIVE
  USING (municipio_id = current_setting('app.municipio_id')::uuid);
```

```typescript
// src/database/rls.middleware.ts (NestJS + TypeORM)
import { Injectable, NestMiddleware } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class RLSMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: any, res: any, next: () => void) {
    const municipioId = req.user?.municipioId;

    if (!municipioId) {
      return next();
    }

    // Definir o contexto de tenant para esta conexão/transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(
        `SET LOCAL app.municipio_id = '${municipioId}'`
      );
      req.queryRunner = queryRunner;
      next();
    } catch (err) {
      await queryRunner.release();
      throw err;
    }
  }
}
```

### Terraform module para criação de ambiente por município

```hcl
# infra/terraform/modules/municipio/main.tf

variable "municipio_slug" {
  type        = string
  description = "Slug do município (ex: sao-paulo)"
}

variable "plano" {
  type        = string
  description = "standard | enterprise"
  default     = "standard"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.medium"
}

# Namespace K8s isolado
resource "kubernetes_namespace" "municipio" {
  metadata {
    name = "municipio-${var.municipio_slug}"
    labels = {
      municipio = var.municipio_slug
      managed-by = "terraform"
    }
  }
}

# Network Policy: pods do namespace só falam entre si + ingress
resource "kubernetes_network_policy" "isolation" {
  metadata {
    name      = "isolation"
    namespace = kubernetes_namespace.municipio.metadata[0].name
  }

  spec {
    pod_selector {}
    policy_types = ["Ingress", "Egress"]

    ingress {
      from {
        namespace_selector {
          match_labels = {
            # Só permite tráfego do mesmo namespace
            "kubernetes.io/metadata.name" = kubernetes_namespace.municipio.metadata[0].name
          }
        }
      }
      from {
        namespace_selector {
          match_labels = {
            "kubernetes.io/metadata.name" = "ingress-nginx"
          }
        }
      }
    }

    egress {
      # Permitir DNS
      ports {
        port     = "53"
        protocol = "UDP"
      }
      # Permitir saída para o RDS (mesmo VPC)
    }
  }
}

# RDS PostgreSQL isolado por município (plano enterprise)
resource "aws_db_instance" "municipio" {
  count = var.plano == "enterprise" ? 1 : 0

  identifier        = "govtech-${var.municipio_slug}"
  engine            = "postgres"
  engine_version    = "16.2"
  instance_class    = var.db_instance_class
  allocated_storage = 50
  storage_encrypted = true  # Obrigatório LGPD

  db_name  = "govtech_${replace(var.municipio_slug, "-", "_")}"
  username = "govtech_${replace(var.municipio_slug, "-", "_")}"
  password = random_password.db[0].result

  backup_retention_period = 35  # 5 semanas
  deletion_protection     = true

  tags = {
    Municipio = var.municipio_slug
    LGPD      = "dados-pessoais"
  }
}

# Secret no K8s com a connection string do DB
resource "kubernetes_secret" "db_credentials" {
  metadata {
    name      = "db-credentials"
    namespace = kubernetes_namespace.municipio.metadata[0].name
  }

  data = {
    DATABASE_URL = var.plano == "enterprise" ? (
      "postgresql://${aws_db_instance.municipio[0].username}:${random_password.db[0].result}@${aws_db_instance.municipio[0].endpoint}/${aws_db_instance.municipio[0].db_name}"
    ) : (
      "postgresql://${var.municipio_slug}:${random_password.shared_db.result}@shared-postgres:5432/govtech_${replace(var.municipio_slug, "-", "_")}"
    )
  }
}
```

### Script de migração de dados entre tenants (shared → dedicated)

```typescript
// scripts/migrate-tenant.ts
// Mover um município do DB compartilhado para DB dedicado

import { DataSource } from "typeorm";

async function migrateTenant(municipioSlug: string) {
  const sourceDs = new DataSource({
    type: "postgres",
    url: process.env.SHARED_DATABASE_URL,
  });

  const targetDs = new DataSource({
    type: "postgres",
    url: process.env.TARGET_DATABASE_URL, // DB dedicado do município
  });

  await Promise.all([sourceDs.initialize(), targetDs.initialize()]);

  console.log(`Iniciando migração do município: ${municipioSlug}`);

  // Tabelas a migrar (topological order — respeitar foreign keys)
  const tables = [
    "municipios",
    "cidadaos",
    "imoveis",
    "lancamentos_iptu",
    "pagamentos",
    "contratos",
    "licitacoes",
  ];

  const queryRunner = targetDs.createQueryRunner();
  await queryRunner.startTransaction();

  try {
    for (const table of tables) {
      console.log(`  Migrando tabela: ${table}`);

      // Buscar em lotes para não explodir memória
      let offset = 0;
      const batchSize = 500;

      while (true) {
        const rows = await sourceDs.query(
          `SELECT * FROM ${table} WHERE municipio_id = $1 LIMIT $2 OFFSET $3`,
          [municipioSlug, batchSize, offset]
        );

        if (rows.length === 0) break;

        // INSERT com ON CONFLICT para idempotência
        const columns = Object.keys(rows[0]);
        const placeholders = rows
          .map(
            (_, rowIdx) =>
              `(${columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`).join(", ")})`
          )
          .join(", ");

        const values = rows.flatMap((row: Record<string, unknown>) =>
          columns.map((col) => row[col])
        );

        await queryRunner.query(
          `INSERT INTO ${table} (${columns.join(", ")})
           VALUES ${placeholders}
           ON CONFLICT DO NOTHING`,
          values
        );

        offset += batchSize;
        console.log(`    ${table}: ${offset} registros migrados`);
      }
    }

    await queryRunner.commitTransaction();
    console.log("Migração concluída com sucesso.");

    // Só apagar da origem após validar o destino
    console.log("ATENÇÃO: validar o destino antes de executar a limpeza:");
    console.log(
      `  DELETE FROM cidadaos WHERE municipio_id = '${municipioSlug}';`
    );
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error("Migração falhou — rollback executado:", err);
    throw err;
  } finally {
    await queryRunner.release();
    await Promise.all([sourceDs.destroy(), targetDs.destroy()]);
  }
}

migrateTenant(process.env.MUNICIPIO_SLUG!);
```

## Armadilhas

**1. Esquecer `FORCE ROW LEVEL SECURITY` em tabelas com superuser**
O superuser do PostgreSQL bypassa RLS por padrão. Use `ALTER TABLE x FORCE ROW LEVEL SECURITY` para garantir que nenhum role bypassa a policy — inclusive na aplicação se por bug usar as credenciais erradas.

**2. Multi-tenant com `tenant_id` sem índice composto**
`WHERE municipio_id = ? AND cpf_token = ?` sem índice `(municipio_id, cpf_token)` = full table scan. Todo índice precisa incluir `municipio_id` como primeira coluna.

**3. ArgoCD ApplicationSet sem RBAC por município**
Sem RBAC, um admin do ArgoCD pode fazer sync de qualquer Application — incluindo de outro município. Configurar Projects e RBAC do ArgoCD por namespace.

**4. Secrets compartilhados entre namespaces**
`DATABASE_URL` como secret global acessível por todos os namespaces destrói o isolamento. Cada namespace deve ter seus próprios secrets.

**5. Migração sem validação de contagem de registros**
Sempre comparar `SELECT COUNT(*) FROM table WHERE municipio_id = ?` na origem vs destino antes de deletar da origem.

## Referências

- [ArgoCD ApplicationSet](https://argo-cd.readthedocs.io/en/stable/user-guide/application-set/)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Terraform Kubernetes Provider](https://registry.terraform.io/providers/hashicorp/kubernetes/latest)
- [Multi-tenancy in Kubernetes](https://kubernetes.io/docs/concepts/security/multi-tenancy/)
