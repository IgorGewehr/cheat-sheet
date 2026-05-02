---
title: "Apache Kafka para Resiliência em Sistemas Públicos"
category: "govtech"
stack: ["Kafka", "NestJS", "KafkaJS", "PostgreSQL"]
tags: ["kafka", "mensageria", "resiliência", "b2g", "eventos", "dlt", "filas"]
excerpt: "Kafka em ERP municipal: por que não RabbitMQ, topologia de tópicos para prefeituras, consumer groups por serviço e Dead Letter Topics para auditoria."
---

## Visão Geral

Apache Kafka resolve um problema específico de sistemas públicos: **a prefeitura não controla os picos de acesso**. Vencimento de IPTU, pagamento de servidores no dia 30, abertura de editais — geram picos previsíveis mas imensos. Kafka absorve esses picos, garante que nenhuma mensagem é perdida mesmo com falha de serviço, e sua retenção nativa serve como camada extra de auditoria.

## Contexto B2G

- Dia 30 de dezembro: execução orçamentária do exercício com deadline legal — o sistema não pode cair
- Vencimento de IPTU de toda a cidade no mesmo dia: dezenas de milhares de contribuintes acessando simultaneamente
- Folha de pagamento de servidores: falha de processamento tem implicação legal (Lei 8.112)
- TCE exige rastreabilidade de mensagens: saber que o evento de "empenho aprovado" chegou ao módulo de contabilidade
- Integração com SIAFI, SIOPE, SIOPS, NFS-e: sistemas externos com latência e instabilidade imprevisíveis

## Quando usar

- Integração entre módulos do ERP que podem processar de forma assíncrona (financeiro → contabilidade → fiscal)
- Picos de acesso previsíveis que não podem derrubrar o sistema core
- Integrações com sistemas externos instáveis (SEFAZ, banco de dados tributários)
- Quando o histórico de mensagens é requisito de auditoria (Kafka retém por padrão 7 dias)

## Trade-offs

| Aspecto | Kafka | RabbitMQ |
|---|---|---|
| Retenção de mensagens | Nativa — replay total | Mensagem some após consumo |
| Throughput | Altíssimo (1M+ msgs/s) | Médio (50-100k msgs/s) |
| Curva operacional | Alta — ZooKeeper/KRaft, brokers, replication | Moderada |
| Retry granular por consumer | Não nativo — implementar manualmente | Nativo com DLX |
| Auditoria de eventos | Excelente — log imutável persistente | Fraca |
| Ordem de mensagens | Garantida por partição | Por fila com single consumer |

**Use Kafka** quando retenção + replay + throughput são requisitos. **Use RabbitMQ** para workflows complexos com retry/DLX nativos e menor volume.

## Implementação

### 1. Topologia de Tópicos para ERP Municipal

```
prefeitura.pagamentos          # Pagamentos autorizados (retenção: 90 dias)
prefeitura.empenhos            # Registro/alteração/anulação de empenhos
prefeitura.cidadao-eventos     # Eventos de portal do cidadão (IPTU, alvará)
prefeitura.notas-fiscais       # NFS-e emitidas/canceladas
prefeitura.folha-pagamento     # Processamento de folha (dado sensível — encriptar)
prefeitura.integracao-sefaz    # Tentativas de integração com SEFAZ-SP
prefeitura.dlq                 # Dead Letter: mensagens que falharam N vezes
```

```bash
# Criar tópicos com retenção e replicação adequados
kafka-topics.sh --bootstrap-server localhost:9092 --create \
  --topic prefeitura.pagamentos \
  --partitions 12 \
  --replication-factor 3 \
  --config retention.ms=7776000000 \  # 90 dias
  --config min.insync.replicas=2

kafka-topics.sh --bootstrap-server localhost:9092 --create \
  --topic prefeitura.dlq \
  --partitions 3 \
  --replication-factor 3 \
  --config retention.ms=31536000000  # 1 ano — auditoria
```

### 2. NestJS com KafkaJS — Setup

```typescript
// src/kafka/kafka.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'erp-municipal',
              brokers: config.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
              ssl: config.get('NODE_ENV') === 'production',
              sasl: config.get('NODE_ENV') === 'production'
                ? {
                    mechanism: 'scram-sha-512',
                    username: config.get('KAFKA_USERNAME'),
                    password: config.get('KAFKA_PASSWORD'),
                  }
                : undefined,
            },
            producer: {
              idempotent: true,  // Exatamente uma vez — crítico para finanças
              transactionalId: 'erp-municipal-producer',
              allowAutoTopicCreation: false,  // Tópicos criados explicitamente
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
```

### 3. Producer com Confirmação e Idempotência

```typescript
// src/financeiro/kafka-financeiro.producer.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class KafkaFinanceiroProducer {
  private readonly logger = new Logger(KafkaFinanceiroProducer.name);

  constructor(@Inject('KAFKA_CLIENT') private kafka: ClientKafka) {}

  async publicarEmpenhoRegistrado(evento: EmpenhoRegistradoEvento): Promise<void> {
    const message = {
      key: evento.empenhoId,  // Mesma chave = mesma partição = ordem garantida
      value: JSON.stringify({
        ...evento,
        _meta: {
          eventType: 'EmpenhoRegistrado',
          eventVersion: 1,
          producedAt: new Date().toISOString(),
          correlationId: evento.correlationId,
        },
      }),
      headers: {
        'event-type': 'EmpenhoRegistrado',
        'content-type': 'application/json',
        'x-correlation-id': evento.correlationId,
      },
    };

    try {
      await firstValueFrom(
        this.kafka
          .emit('prefeitura.empenhos', message)
          .pipe(timeout(5000)),
      );

      this.logger.log(`Empenho publicado: ${evento.empenhoId}`);
    } catch (err) {
      this.logger.error(`Falha ao publicar empenho: ${evento.empenhoId}`, err);
      throw err;  // Deixar o caller decidir se faz retry ou fallback
    }
  }
}

interface EmpenhoRegistradoEvento {
  empenhoId: string;
  correlationId: string;
  numero: string;
  valor: number;
  dotacao: string;
  exercicio: number;
}
```

### 4. Consumer com Retry e Dead Letter Topic

```typescript
// src/contabilidade/kafka-contabilidade.consumer.ts
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Controller()
export class KafkaContabilidadeConsumer {
  private readonly logger = new Logger(KafkaContabilidadeConsumer.name);
  private readonly MAX_RETRIES = 5;

  constructor(
    @Inject('KAFKA_CLIENT') private kafka: ClientKafka,
    private contabilidadeService: ContabilidadeService,
  ) {}

  @MessagePattern('prefeitura.empenhos')
  async handleEmpenho(
    @Payload() message: unknown,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    const topic = context.getTopic();
    const partition = context.getPartition();
    const offset = context.getMessage().offset;
    const headers = context.getMessage().headers as Record<string, Buffer>;

    const retryCount = parseInt(
      headers['x-retry-count']?.toString() ?? '0',
      10,
    );

    try {
      const evento = this.parseMessage(message);
      await this.processarEmpenho(evento);

      this.logger.log(
        `Empenho processado: ${evento.empenhoId} [partition=${partition}, offset=${offset}]`,
      );
    } catch (err) {
      this.logger.warn(
        `Falha ao processar empenho [retry=${retryCount}]: ${err.message}`,
      );

      if (retryCount >= this.MAX_RETRIES) {
        await this.sendToDLT(message, err, headers);
        return;  // Não relança — mensagem vai para DLT, consumer continua
      }

      // Backoff exponencial
      await this.delay(Math.pow(2, retryCount) * 1000);

      throw err;  // NestJS vai fazer retry automático
    }
  }

  private async sendToDLT(
    originalMessage: unknown,
    error: Error,
    originalHeaders: Record<string, Buffer>,
  ): Promise<void> {
    const retryCount = parseInt(
      originalHeaders['x-retry-count']?.toString() ?? '0',
      10,
    );

    await this.kafka
      .emit('prefeitura.dlq', {
        value: JSON.stringify({
          originalMessage,
          error: {
            message: error.message,
            stack: error.stack,
          },
          originalTopic: 'prefeitura.empenhos',
          failedAt: new Date().toISOString(),
          retryCount,
        }),
        headers: {
          'x-original-topic': 'prefeitura.empenhos',
          'x-retry-count': retryCount.toString(),
          'x-failure-reason': error.message.substring(0, 200),
        },
      })
      .toPromise();

    this.logger.error(
      `Mensagem enviada ao DLT após ${retryCount} tentativas: ${error.message}`,
    );
  }

  private parseMessage(raw: unknown): EmpenhoRegistradoEvento {
    if (typeof raw === 'string') return JSON.parse(raw);
    if (Buffer.isBuffer(raw)) return JSON.parse(raw.toString());
    return raw as EmpenhoRegistradoEvento;
  }

  private async processarEmpenho(evento: EmpenhoRegistradoEvento): Promise<void> {
    // Idempotência: verificar se já processou este correlationId
    const jaProcessado = await this.contabilidadeService.verificarProcessado(
      evento.correlationId,
    );
    if (jaProcessado) {
      this.logger.warn(`Evento duplicado ignorado: ${evento.correlationId}`);
      return;
    }

    await this.contabilidadeService.registrarLancamento(evento);
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### 5. Consumer Groups por Serviço

```typescript
// src/main.ts — microservice config
app.connectMicroservice({
  transport: Transport.KAFKA,
  options: {
    client: {
      brokers: [process.env.KAFKA_BROKERS],
    },
    consumer: {
      groupId: 'erp-contabilidade-v1',  // Versionar o group ID
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxBytesPerPartition: 1048576,  // 1MB
    },
  },
});

// Serviço fiscal usa group diferente — recebe os mesmos eventos
// groupId: 'erp-fiscal-v1'
// groupId: 'erp-portal-transparencia-v1'
```

### 6. Monitoramento com Kafka UI

```yaml
# docker-compose.yml
services:
  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    environment:
      KAFKA_CLUSTERS_0_NAME: prefeitura-prod
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
      KAFKA_CLUSTERS_0_AUDIT_TOPICAUDITENABLED: "true"
    ports:
      - "8080:8080"
```

## Armadilhas

- **Auto-create topics**: Desabilite `allowAutoTopicCreation`. Tópico criado com defaults errados (1 partição, sem replicação) em produção é desastre silencioso.
- **Sem idempotência no producer**: Em sistema financeiro, mensagem duplicada = duplo empenho. `idempotent: true` é obrigatório.
- **Consumer sem idempotência**: Producer idempotente não garante que o consumer não processe duas vezes. Sempre verificar `correlationId` antes de processar.
- **Group ID sem versão**: Mudar o schema quebra consumers antigos. Versione o group ID (`erp-contabilidade-v1` → `v2`) para migração gradual.
- **DLT sem monitoramento**: Mensagens no DLT são silenciosas. Configure alerta para qualquer mensagem no tópico `prefeitura.dlq`.
- **Retenção curta em dados financeiros**: 7 dias (padrão Kafka) é insuficiente para auditoria. Configure 90 dias para tópicos financeiros.

## Referências

- [KafkaJS Documentation](https://kafka.js.org/)
- [NestJS Microservices — Kafka](https://docs.nestjs.com/microservices/kafka)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent — Kafka for Finance](https://www.confluent.io/use-case/financial-services/)
