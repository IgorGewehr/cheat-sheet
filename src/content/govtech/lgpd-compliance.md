---
title: "LGPD na prática para sistemas públicos B2G"
category: "govtech"
stack: ["NestJS", "TypeORM", "PostgreSQL", "TypeScript", "Node.js"]
tags: ["lgpd", "privacidade", "segurança", "criptografia", "auditoria", "anpd", "compliance"]
excerpt: "Órgãos públicos têm base legal 'cumprimento de obrigação legal' mas ainda têm obrigações plenas da LGPD. Este card cobre criptografia at rest, pseudonimização, audit trail de acesso e privacidade por design em sistemas municipais."
---

## Visão Geral

A LGPD (Lei 13.709/2018) se aplica integralmente a órgãos públicos. A diferença é que **a base legal para tratamento de dados pessoais de cidadãos é "cumprimento de obrigação legal"** — não consentimento. Isso não dispensa as obrigações técnicas: criptografia, minimização de dados, logs de acesso, DPO, notificação de incidentes em 72h.

Dados tratados em sistemas municipais:
- **Dados pessoais**: CPF, nome, endereço, e-mail, telefone
- **Dados sensíveis**: dados de saúde (SUS, programas sociais), raça/cor (IBGE), situação financeira (débitos), biometria

## Contexto B2G

Para prefeituras:
- **DPO (Encarregado)** é obrigatório por lei para órgãos públicos (Art. 41 LGPD)
- **ANPD** pode auditar qualquer sistema que trate dados de cidadãos
- Dados de **Bolsa Família**, **Cadastro Único** e saúde são sensíveis — criptografia obrigatória
- **Prazo de incidente**: 72h para notificar ANPD + titular em caso de vazamento
- **Retenção**: manter apenas pelo tempo necessário + definido em lei (ex: dados fiscais 5 anos)

O maior risco prático: banco de dados de prefeitura vazado com CPF + endereço + débitos de 500 mil cidadãos.

## Quando usar

- Qualquer campo que armazene CPF, RG, saúde, biometria → `@EncryptedColumn`
- Todo acesso a dados sensíveis → middleware de auditoria
- Ao criar nova tabela → definir data retention (TTL policy)
- Ao onboarding de novo sistema → RoPA (Record of Processing Activities)
- Migração de dados legados → script de pseudonimização

## Trade-offs

| Estratégia | Proteção | Impacto em performance | Busca no DB |
|------------|----------|----------------------|-------------|
| Criptografia AES-256-GCM | Alta — dado ilegível sem chave | Overhead de ~2ms por campo | Não é possível fazer `WHERE cpf = ?` diretamente |
| Tokenização (hash determinístico) | Média — token não revela CPF | Mínimo | `WHERE cpf_token = ?` funciona |
| Pseudonimização | Média | Mínimo | Com tabela de mapeamento separada |
| Nenhuma (só TLS em trânsito) | Baixa — dump do DB expõe tudo | Nenhum | Normal |

**Estratégia recomendada**: tokenização (HMAC-SHA256 com secret) para campos de busca (CPF) + criptografia AES-256-GCM para campos de exibição (nome completo, endereço, dados de saúde).

## Implementação

### Configuração das chaves (variáveis de ambiente)

```bash
# .env
ENCRYPTION_KEY=64-hex-chars-gerado-com-openssl-rand-hex-32  # 32 bytes = 256 bits
ENCRYPTION_HMAC_SECRET=outro-secret-64-hex-chars
```

### Decorator `@EncryptedColumn` com TypeORM + AES-256-GCM

```typescript
// src/common/crypto/encryption.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly key: Buffer;
  private readonly hmacSecret: Buffer;

  constructor(private config: ConfigService) {
    const keyHex = this.config.getOrThrow<string>("ENCRYPTION_KEY");
    const hmacHex = this.config.getOrThrow<string>("ENCRYPTION_HMAC_SECRET");

    if (keyHex.length !== 64) {
      throw new Error("ENCRYPTION_KEY deve ter 32 bytes (64 hex chars)");
    }

    this.key = Buffer.from(keyHex, "hex");
    this.hmacSecret = Buffer.from(hmacHex, "hex");
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12); // 96 bits para GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag(); // 128 bits de autenticação

    // Formato: iv(12) + authTag(16) + ciphertext, tudo em base64
    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  }

  decrypt(ciphertext: string): string {
    const buffer = Buffer.from(ciphertext, "base64");

    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  }

  // Token determinístico para busca (não reverte para o valor original)
  tokenize(value: string): string {
    return crypto
      .createHmac("sha256", this.hmacSecret)
      .update(value.toLowerCase().trim())
      .digest("hex");
  }
}
```

```typescript
// src/common/crypto/encrypted-column.transformer.ts
import { EncryptionService } from "./encryption.service";

// Singleton para uso nos transformers TypeORM (fora do DI container)
let encryptionService: EncryptionService | null = null;

export function setEncryptionService(service: EncryptionService) {
  encryptionService = service;
}

export function encryptedTransformer() {
  return {
    to(value: string | null): string | null {
      if (!value || !encryptionService) return value;
      return encryptionService.encrypt(value);
    },
    from(value: string | null): string | null {
      if (!value || !encryptionService) return value;
      try {
        return encryptionService.decrypt(value);
      } catch {
        // Dado corrompido ou chave errada — não vazar o erro
        return "[DADO ILEGÍVEL]";
      }
    },
  };
}
```

```typescript
// src/modules/cidadao/entities/cidadao.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, Index, CreateDateColumn } from "typeorm";
import { encryptedTransformer } from "@/common/crypto/encrypted-column.transformer";

@Entity("cidadaos")
export class Cidadao {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // CPF tokenizado para busca segura — não é possível reverter para o CPF original
  @Column({ name: "cpf_token", unique: true })
  @Index()
  cpfToken: string; // HMAC-SHA256 do CPF

  // Nome completo criptografado — só exibido em contexto autenticado
  @Column({ name: "nome_completo_encrypted", type: "text" })
  nomeCompleto: string; // transformer criptografa/decripta automaticamente

  // E-mail criptografado
  @Column({ name: "email_encrypted", type: "text", nullable: true })
  email: string | null;

  // Dado sensível de saúde — sempre criptografado
  @Column({ name: "cid_encrypted", type: "text", nullable: true })
  cid: string | null; // Código Internacional de Doenças

  // Data de nascimento (menos sensível, mas ainda pessoal)
  @Column({ name: "data_nascimento", type: "date" })
  dataNascimento: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  // TTL: marcar para deleção após retenção
  @Column({ name: "deletar_apos", type: "timestamptz", nullable: true })
  deletarApos: Date | null;
}
```

```typescript
// src/modules/cidadao/cidadao.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cidadao } from "./entities/cidadao.entity";
import { EncryptionService } from "@/common/crypto/encryption.service";

@Injectable()
export class CidadaoService {
  constructor(
    @InjectRepository(Cidadao)
    private readonly cidadaoRepo: Repository<Cidadao>,
    private readonly encryption: EncryptionService,
  ) {}

  async findByCpf(cpf: string): Promise<Cidadao | null> {
    const cpfToken = this.encryption.tokenize(cpf);
    return this.cidadaoRepo.findOne({ where: { cpfToken } });
  }

  async create(data: {
    cpf: string;
    nomeCompleto: string;
    email?: string;
    dataNascimento: Date;
  }): Promise<Cidadao> {
    // Privacidade por design: só armazenar o mínimo necessário
    const cidadao = this.cidadaoRepo.create({
      cpfToken: this.encryption.tokenize(data.cpf),
      nomeCompleto: this.encryption.encrypt(data.nomeCompleto),
      email: data.email ? this.encryption.encrypt(data.email) : null,
      dataNascimento: data.dataNascimento,
      // Retenção: dados fiscais = 5 anos após último movimento
      deletarApos: null, // definido ao encerrar relação com cidadão
    });

    return this.cidadaoRepo.save(cidadao);
  }
}
```

### Middleware de auditoria de acesso a dados sensíveis

```typescript
// src/common/middleware/data-access-audit.middleware.ts
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DataAccessLog } from "../entities/data-access-log.entity";

@Injectable()
export class DataAccessAuditMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(DataAccessLog)
    private readonly logRepo: Repository<DataAccessLog>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Rotas que acessam dados sensíveis
    const sensitiveRoutes = [
      /\/cidadaos\/[^/]+$/,
      /\/servidores\/[^/]+\/dados-pessoais/,
      /\/beneficiarios\/[^/]+/,
    ];

    const isSensitive = sensitiveRoutes.some((r) => r.test(req.path));

    if (isSensitive && req.user) {
      const user = req.user as { id: string; nome: string; cargo: string };

      // Log assíncrono — não bloquear a requisição
      setImmediate(async () => {
        await this.logRepo.save({
          userId: user.id,
          userName: user.nome,
          cargo: user.cargo,
          ip: req.ip ?? req.socket.remoteAddress,
          method: req.method,
          path: req.path,
          resourceId: req.params.id ?? null,
          timestamp: new Date(),
          userAgent: req.get("User-Agent"),
        });
      });
    }

    next();
  }
}

// src/common/entities/data-access-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity("data_access_logs")
export class DataAccessLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  @Index()
  userId: string;

  @Column({ name: "user_name" })
  userName: string;

  @Column()
  cargo: string;

  @Column()
  ip: string;

  @Column()
  method: string;

  @Column()
  path: string;

  @Column({ name: "resource_id", nullable: true })
  resourceId: string | null;

  @Column({ name: "user_agent", nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: "timestamp", type: "timestamptz" })
  @Index()
  timestamp: Date;
}
```

### Migration de pseudonimização de dados legados

```typescript
// src/database/migrations/1714000000000-PseudonimizarCpfs.ts
import { MigrationInterface, QueryRunner } from "typeorm";
import * as crypto from "crypto";

export class PseudonimizarCpfs1714000000000 implements MigrationInterface {
  name = "PseudonimizarCpfs1714000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adicionar coluna de token
    await queryRunner.query(`
      ALTER TABLE cidadaos
      ADD COLUMN IF NOT EXISTS cpf_token VARCHAR(64),
      ADD COLUMN IF NOT EXISTS cpf_encrypted TEXT
    `);

    // 2. Processar em lotes para não travar o DB
    const batchSize = 1000;
    let offset = 0;
    const hmacSecret = process.env.ENCRYPTION_HMAC_SECRET!;

    while (true) {
      const rows = await queryRunner.query(
        `SELECT id, cpf FROM cidadaos WHERE cpf_token IS NULL LIMIT $1 OFFSET $2`,
        [batchSize, offset],
      );

      if (rows.length === 0) break;

      for (const row of rows) {
        if (!row.cpf) continue;

        const token = crypto
          .createHmac("sha256", Buffer.from(hmacSecret, "hex"))
          .update(row.cpf.replace(/\D/g, ""))
          .digest("hex");

        await queryRunner.query(
          `UPDATE cidadaos SET cpf_token = $1 WHERE id = $2`,
          [token, row.id],
        );
      }

      offset += batchSize;
      console.log(`Pseudonimizados: ${offset} registros`);
    }

    // 3. Tornar cpf_token obrigatório e único, remover CPF plaintext
    await queryRunner.query(`
      ALTER TABLE cidadaos
        ALTER COLUMN cpf_token SET NOT NULL,
        ADD CONSTRAINT cidadaos_cpf_token_unique UNIQUE (cpf_token)
    `);

    // Remover coluna original (fazer em manutenção ou em migration separada após validar)
    // await queryRunner.query(`ALTER TABLE cidadaos DROP COLUMN cpf`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE cidadaos
        DROP CONSTRAINT IF EXISTS cidadaos_cpf_token_unique,
        DROP COLUMN IF EXISTS cpf_token,
        DROP COLUMN IF EXISTS cpf_encrypted
    `);
  }
}
```

### Template de RoPA simplificado

```typescript
// src/common/lgpd/ropa.config.ts
// RoPA = Record of Processing Activities (Art. 37 LGPD)

export const ROPA: ProcessingActivity[] = [
  {
    nome: "Cadastro de Cidadãos",
    finalidade: "Identificação do contribuinte para emissão de guias de IPTU e taxas municipais",
    baseLegal: "Cumprimento de obrigação legal (Art. 7, II, LGPD) — Lei 5.172/1966 (CTN)",
    dadosTratados: ["nome", "cpf", "data_nascimento", "endereço", "email"],
    dadosSensiveis: [],
    retencao: "5 anos após extinção do débito ou relação tributária",
    compartilhamento: ["Secretaria da Fazenda do Estado (SEFAZ)", "Receita Federal (via convênio)"],
    medidasSeguranca: ["AES-256-GCM at rest", "TLS 1.3 in transit", "RBAC", "Audit log"],
    dpo: "dpo@prefeitura.gov.br",
    dataUltimaRevisao: "2026-01-01",
  },
  {
    nome: "Registro de Beneficiários de Programas Sociais",
    finalidade: "Gestão de benefícios sociais municipais (Bolsa Creche, Passe Livre)",
    baseLegal: "Cumprimento de obrigação legal + Interesse público (Art. 7, II e III, LGPD)",
    dadosTratados: ["nome", "cpf", "renda_familiar", "composicao_familiar", "endereço"],
    dadosSensiveis: ["dados_saude", "raca_cor"],
    retencao: "10 anos após encerramento do benefício",
    compartilhamento: ["CRAS", "MDS (Ministério do Desenvolvimento Social)"],
    medidasSeguranca: ["AES-256-GCM", "TLS 1.3", "acesso restrito por cargo", "audit log obrigatório"],
    dpo: "dpo@prefeitura.gov.br",
    dataUltimaRevisao: "2026-01-01",
  },
];

interface ProcessingActivity {
  nome: string;
  finalidade: string;
  baseLegal: string;
  dadosTratados: string[];
  dadosSensiveis: string[];
  retencao: string;
  compartilhamento: string[];
  medidasSeguranca: string[];
  dpo: string;
  dataUltimaRevisao: string;
}
```

## Armadilhas

**1. Usar CPF como chave primária ou em URL**
`GET /cidadaos/123.456.789-00` expõe o CPF em logs de servidor, CDN e analytics. Use UUID como ID público e tokenize o CPF para busca.

**2. Logar dados pessoais em stack traces**
`console.error("Erro ao processar cidadão:", cidadao)` pode serializar o objeto inteiro — incluindo nome, CPF e dados de saúde — para o Datadog/Sentry. Use serializers que mascaram campos sensíveis.

**3. `SELECT *` em tabelas com dados sensíveis**
DTOs explícitos. Nunca retornar a entidade TypeORM diretamente em um endpoint.

**4. Backup sem criptografia**
Dump do PostgreSQL sem `--compress` + GPG equivale a ter os dados em texto puro em um bucket S3. Criptografar backups com chave offline.

**5. Não mapear o DPO no sistema**
O DPO (Encarregado) precisa estar identificado no sistema e ser contactável. Implementar endpoint `/.well-known/lgpd` com informações do DPO.

**6. Compartilhamento com terceiros sem contrato de processamento**
APIs de terceiros (ex: validação de CPF, geolocalização) que recebem dados pessoais precisam de contrato de operador de dados.

## Referências

- [LGPD — Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD — Guia de Boas Práticas](https://www.gov.br/anpd)
- [ENISA — Pseudonymisation Techniques](https://www.enisa.europa.eu/publications/pseudonymisation-techniques-and-best-practices)
- [OWASP — Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
