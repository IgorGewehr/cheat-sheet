---
title: "Go: Configuração com envconfig ou Viper"
category: padroes-backend
stack: [Go, envconfig, Viper]
tags: [golang, config, environment, twelve-factor, validation]
excerpt: "Configuração profissional em Go: env vars, validação no boot, defaults explícitos, secrets fora do código e quando escolher envconfig ou Viper."
related: [nestjs-config-env, ai-config-hardcoded, secrets-management]
updated: "2026-05-07"
---

## Config é contrato operacional

Configuração não é detalhe. Ela define como o mesmo binário roda em local, staging e produção. Em serviço sério, configuração inválida deve falhar no boot, não no primeiro request.

Exemplos:

- `DATABASE_URL`;
- `REDIS_URL`;
- `RABBITMQ_URL`;
- `HTTP_ADDR`;
- `LOG_LEVEL`;
- `ENVIRONMENT`;
- `OPENAPI_VALIDATE_RESPONSES`.

## envconfig

`envconfig` é simples e direto: mapeia variáveis de ambiente para struct.

```go
type Config struct {
	Environment string        `envconfig:"ENVIRONMENT" default:"development"`
	HTTPAddr    string        `envconfig:"HTTP_ADDR" default:":8080"`
	DatabaseURL string        `envconfig:"DATABASE_URL" required:"true"`
	RedisURL    string        `envconfig:"REDIS_URL" required:"true"`
	ShutdownTTL time.Duration `envconfig:"SHUTDOWN_TTL" default:"15s"`
}

func Load() (Config, error) {
	var cfg Config
	if err := envconfig.Process("", &cfg); err != nil {
		return Config{}, err
	}
	return cfg, validate(cfg)
}
```

Use quando seu serviço segue Twelve-Factor e recebe tudo por env vars.

## Viper

Viper é mais amplo: lê arquivos, env vars, flags e remote config. Use quando você precisa combinar fontes ou manter config local mais rica.

O risco: flexibilidade demais pode esconder a origem da configuração. Se usar Viper, documente precedência.

## Validação

Valide invariantes:

```go
func validate(cfg Config) error {
	if cfg.DatabaseURL == "" {
		return errors.New("DATABASE_URL is required")
	}
	if cfg.Environment == "production" && strings.Contains(cfg.DatabaseURL, "localhost") {
		return errors.New("production database cannot point to localhost")
	}
	return nil
}
```

## Secrets

Nunca commite secrets. Em Docker Compose local, `.env.example` mostra nomes sem valores reais. Em produção, use secret manager, variáveis injetadas pelo orquestrador ou mecanismo equivalente.

## Critério de domínio

Você dominou este card quando seu serviço falha rápido com config inválida, tem `.env.example` útil e separa config operacional de regra de negócio.
