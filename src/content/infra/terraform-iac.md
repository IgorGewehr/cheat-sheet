---
title: "Terraform — IaC production-grade"
category: "infra"
stack: ["Terraform", "AWS", "GCP", "S3", "DynamoDB"]
tags: ["iac", "terraform", "infra", "aws", "state", "módulos"]
excerpt: "Infraestrutura como código com state remoto, módulos reutilizáveis e drift detection. Essencial quando infra cresce além de um Dockerfile e um painel de console."
related: [github-actions-cicd, kubernetes-workloads]
updated: 2026-05
---

## Visão Geral

Terraform transforma infra em código versionável, revisável e reproduzível. O ponto crítico em produção é o **state**: quem controla o state, controla a infra. State remoto com locking (S3 + DynamoDB) é o mínimo para trabalho em time.

---

## Quando usar / Quando não usar

**Use quando:**
- Infra tem mais de 5 recursos ou vai crescer
- Time precisa de PR review antes de `apply`
- Múltiplos ambientes (dev, staging, prod) com configurações semelhantes
- Precisa de auditoria de mudanças de infra

**Não use quando:**
- Protótipo descartável — console manual é mais rápido
- Time é exclusivamente GCP → Pulumi com TypeScript ou Deployment Manager pode ser mais idiomático
- Recursos são gerenciados por uma plataforma PaaS (Vercel, Railway) que abstrai a infra

---

## Trade-offs

| Vantagem | Desvantagem |
|---|---|
| HCL legível e declarativo | State pode ficar fora de sincronia (drift) |
| Módulos reutilizáveis no registry | `terraform destroy` é perigoso sem proteção |
| Plan mostra diff antes do apply | Recursos com dependências circulares causam `apply` parcial |
| Multi-cloud (AWS, GCP, Azure, K8s) | Provider de terceiros pode ter bugs/atrasos |
| Workspace para múltiplos envs | Workspace não substitui estrutura de diretórios para isolamento real |

---

## Implementação

### Estrutura de diretórios recomendada

```
infra/
  modules/
    vpc/
      main.tf
      variables.tf
      outputs.tf
    ecs-service/
      main.tf
      variables.tf
      outputs.tf
  envs/
    staging/
      main.tf
      terraform.tfvars
      backend.tf
    production/
      main.tf
      terraform.tfvars
      backend.tf
  bootstrap/        # cria o S3 + DynamoDB para o próprio state
    main.tf
```

### State remoto com S3 + DynamoDB (locking)

```hcl
# infra/bootstrap/main.tf — roda UMA vez manualmente
resource "aws_s3_bucket" "tf_state" {
  bucket = "myapp-terraform-state-prod"

  lifecycle {
    prevent_destroy = true  # nunca destrua o state bucket
  }
}

resource "aws_s3_bucket_versioning" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  versioning_configuration {
    status = "Enabled"  # rollback de state corrompido
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tf_state" {
  bucket = aws_s3_bucket.tf_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_dynamodb_table" "tf_locks" {
  name         = "myapp-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

```hcl
# infra/envs/production/backend.tf
terraform {
  backend "s3" {
    bucket         = "myapp-terraform-state-prod"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "myapp-terraform-locks"  # locking distribuído
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # sempre pin major+minor
    }
  }

  required_version = ">= 1.9.0"
}
```

### Módulo reutilizável — ECS Service

```hcl
# infra/modules/ecs-service/variables.tf
variable "service_name" {
  type        = string
  description = "Nome do serviço ECS"
}

variable "image" {
  type        = string
  description = "Docker image URI (ex: ghcr.io/myorg/myapp:sha-abc123)"
}

variable "desired_count" {
  type    = number
  default = 2
}

variable "cpu" {
  type    = number
  default = 512
}

variable "memory" {
  type    = number
  default = 1024
}

variable "environment_variables" {
  type    = map(string)
  default = {}
}

variable "secrets" {
  description = "SSM Parameter Store paths"
  type        = map(string)  # { "DATABASE_URL" = "/myapp/prod/db-url" }
  default     = {}
}
```

```hcl
# infra/modules/ecs-service/main.tf
resource "aws_ecs_task_definition" "this" {
  family                   = var.service_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name  = var.service_name
    image = var.image

    environment = [
      for k, v in var.environment_variables : { name = k, value = v }
    ]

    secrets = [
      for k, path in var.secrets : {
        name      = k
        valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter${path}"
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.service_name}"
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}

resource "aws_ecs_service" "this" {
  name            = var.service_name
  cluster         = data.aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  deployment_controller {
    type = "ECS"  # rolling update nativo
  }

  deployment_circuit_breaker {
    enable   = true   # para deploy se health checks falham
    rollback = true   # reverte automaticamente
  }

  network_configuration {
    subnets          = data.aws_subnets.private.ids
    security_groups  = [aws_security_group.service.id]
    assign_public_ip = false
  }

  lifecycle {
    ignore_changes = [desired_count]  # permite autoscaling sem drift
  }
}
```

### Usando o módulo por ambiente

```hcl
# infra/envs/production/main.tf
module "api" {
  source = "../../modules/ecs-service"

  service_name  = "myapp-api"
  image         = "ghcr.io/myorg/myapp:sha-${var.git_sha}"
  desired_count = 4
  cpu           = 1024
  memory        = 2048

  environment_variables = {
    NODE_ENV = "production"
    LOG_LEVEL = "info"
  }

  secrets = {
    DATABASE_URL  = "/myapp/prod/database-url"
    JWT_SECRET    = "/myapp/prod/jwt-secret"
  }
}
```

### Import de recursos existentes

```bash
# Importa recurso criado manualmente no console
terraform import aws_s3_bucket.assets meu-bucket-criado-no-console

# Terraform 1.5+: import block no próprio HCL (revisável em PR)
```

```hcl
# import.tf — commita junto com o código, roda no apply
import {
  to = aws_security_group.legacy
  id = "sg-0abc123def456"
}

resource "aws_security_group" "legacy" {
  name        = "legacy-sg"
  description = "Importado do console"
  vpc_id      = data.aws_vpc.main.id
  # define todos os atributos para match com o estado atual
}
```

### Drift detection no CI

```yaml
# .github/workflows/terraform-drift.yml
name: Drift Detection

on:
  schedule:
    - cron: "0 8 * * 1-5"  # 8h nos dias úteis
  workflow_dispatch:

jobs:
  drift-check:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      issues: write

    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.9.0"

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      - run: terraform init
        working-directory: infra/envs/production

      - id: plan
        run: |
          terraform plan -detailed-exitcode -no-color 2>&1 | tee plan.txt
          echo "exit_code=${PIPESTATUS[0]}" >> $GITHUB_OUTPUT
        working-directory: infra/envs/production
        continue-on-error: true

      - name: Abrir issue se drift detectado
        if: steps.plan.outputs.exit_code == '2'  # 2 = mudanças detectadas
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('infra/envs/production/plan.txt', 'utf8');
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 Drift detectado em production',
              body: `\`\`\`\n${plan.slice(0, 65000)}\n\`\`\``,
              labels: ['terraform', 'drift', 'urgent']
            });
```

---

## Armadilhas comuns

**1. `terraform destroy` sem proteção**
```hcl
# Proteja recursos críticos contra destroy acidental
resource "aws_rds_instance" "main" {
  # ...
  deletion_protection = true  # banco

  lifecycle {
    prevent_destroy = true  # terraform destroy falha aqui
  }
}
```

**2. Secrets em `.tfvars` comitados**
Nunca ponha senhas em `terraform.tfvars`. Use SSM Parameter Store ou Vault, referencie via `data`:
```hcl
data "aws_ssm_parameter" "db_password" {
  name            = "/myapp/prod/db-password"
  with_decryption = true
}
```

**3. Workspace como substituto de isolamento**
`terraform workspace new staging` ainda usa o mesmo estado e provider. Para isolamento real (permissões de IAM, contas AWS separadas), use **diretórios separados** por ambiente.

**4. `ignore_changes` esquecido em autoscaling**
Se o ECS/ASG ajusta `desired_count`, Terraform vai querer reverter no próximo apply. Adicione `ignore_changes = [desired_count]`.

**5. Provider sem version constraint**
```hcl
# RUIM — pega a última versão, pode quebrar
terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

# BOM — pin de versão
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"  # permite patch, bloqueia major
    }
  }
}
```

---

## Links e referências

- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [S3 Backend](https://developer.hashicorp.com/terraform/language/backend/s3)
- [Import blocks (1.5+)](https://developer.hashicorp.com/terraform/language/import)
- [Terraform Registry — módulos AWS](https://registry.terraform.io/namespaces/terraform-aws-modules)
- [OpenTofu](https://opentofu.org/) — fork open-source do Terraform (licença BUSL)
