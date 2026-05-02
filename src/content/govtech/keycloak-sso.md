---
title: "Keycloak SSO para Sistemas Públicos"
category: "govtech"
stack: ["Keycloak", "NestJS", "Gov.br", "OpenID Connect"]
tags: ["sso", "iam", "rbac", "gov.br", "keycloak", "b2g", "segurança"]
excerpt: "Keycloak como IAM central para prefeituras: realm por tenant, RBAC hierárquico, SSO com Gov.br e trilha de auditoria de acessos."
---

## Visão Geral

Keycloak é o padrão de facto para Identity and Access Management (IAM) em sistemas públicos brasileiros. Ele centraliza autenticação, autorização e auditoria de todos os sistemas da prefeitura — ERP, portal de transparência, protocolo eletrônico — em um único ponto de controle.

Em sistemas B2G, o Keycloak resolve três problemas simultaneamente: SSO entre sistemas internos da prefeitura, federação com Gov.br para cidadãos, e trilha de auditoria de logins exigida pelos Tribunais de Contas.

## Contexto B2G

- TCEs exigem rastreabilidade de quem acessou o quê e quando em sistemas de finanças públicas
- Servidores públicos têm regimes de licença/afastamento — acesso deve ser suspenso automaticamente
- Gov.br é o IdP nacional: cidadãos usam CPF/senha Gov.br para acessar portais de prefeituras (Lei 14.129/21)
- Auditoria de TCU/CGU frequentemente pede logs de acessos dos últimos 5 anos
- Múltiplos sistemas (ERP, IPTU, tributação, protocolo) precisam de SSO real — sem múltiplos logins

## Quando usar

- ERP municipal com 3+ sistemas que precisam compartilhar sessão
- Portal do cidadão que deve aceitar autenticação Gov.br
- Necessidade de suspender acesso imediato quando servidor exonerado
- Auditoria de acessos como requisito de TCE/TCU
- RBAC granular com hierarquia de secretarias e departamentos

## Trade-offs

| Aspecto | Keycloak | Alternativa (Auth.js / custom) |
|---|---|---|
| Complexidade operacional | Alta — requer JVM, banco próprio, HA setup | Baixa |
| Custo de compliance | Praticamente zero — já tem auditoria, MFA, brute force | Alto — implementar do zero |
| Gov.br federation | Nativo via OIDC | Manual |
| Curva de aprendizado | Íngreme — admin console complexo | Moderada |
| Vendor lock-in | Baixo — padrão OpenID Connect | Varia |

**Use Keycloak quando o custo de compliance superar o custo operacional** — em sistemas B2G, sempre supera.

## Implementação

### 1. Configuração de Realm por Prefeitura

```json
// realm-prefeitura-exemplo.json (exportar via Admin CLI para versionamento)
{
  "realm": "prefeitura-exemplo-sp",
  "displayName": "Prefeitura de Exemplo - SP",
  "enabled": true,
  "loginWithEmailAllowed": false,
  "bruteForceProtected": true,
  "permanentLockout": false,
  "maxFailureWaitSeconds": 900,
  "minimumQuickLoginWaitSeconds": 60,
  "waitIncrementSeconds": 60,
  "quickLoginCheckMilliSeconds": 1000,
  "maxDeltaTimeSeconds": 43200,
  "failureFactor": 5,
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "accessTokenLifespan": 300,
  "refreshTokenMaxReuse": 0,
  "revokeRefreshToken": true,
  "roles": {
    "realm": [
      { "name": "prefeito", "description": "Acesso total ao sistema" },
      { "name": "secretario", "description": "Acesso à secretaria vinculada" },
      { "name": "servidor", "description": "Acesso operacional padrão" },
      { "name": "auditor", "description": "Somente leitura, acesso a logs" },
      { "name": "contador", "description": "Módulo financeiro e contábil" }
    ]
  },
  "identityProviders": [
    {
      "alias": "gov-br",
      "displayName": "Gov.br",
      "providerId": "oidc",
      "enabled": true,
      "config": {
        "authorizationUrl": "https://sso.acesso.gov.br/authorize",
        "tokenUrl": "https://sso.acesso.gov.br/token",
        "userInfoUrl": "https://sso.acesso.gov.br/userinfo",
        "clientId": "${GOV_BR_CLIENT_ID}",
        "clientSecret": "${GOV_BR_CLIENT_SECRET}",
        "defaultScope": "openid profile email govbr_confiabilidades",
        "syncMode": "FORCE"
      }
    }
  ],
  "passwordPolicy": "length(12) and upperCase(1) and lowerCase(1) and digits(1) and notUsername"
}
```

### 2. NestJS com passport-keycloak-bearer

```bash
npm install @nestjs/passport passport passport-keycloak-bearer
```

```typescript
// src/auth/keycloak.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-keycloak-bearer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(private config: ConfigService) {
    super({
      host: config.get<string>('KEYCLOAK_HOST'), // https://auth.prefeitura.sp.gov.br
      realm: config.get<string>('KEYCLOAK_REALM'), // prefeitura-exemplo-sp
    });
  }

  async validate(payload: KeycloakJwtPayload) {
    // payload já foi verificado pelo Keycloak public key
    if (!payload.sub) throw new UnauthorizedException('Token inválido');

    return {
      sub: payload.sub,
      preferred_username: payload.preferred_username,
      email: payload.email,
      // roles vêm em realm_access.roles
      roles: payload.realm_access?.roles ?? [],
      // secretaria como atributo customizado no Keycloak
      secretaria: payload.secretaria ?? null,
      sessionId: payload.session_state,
    };
  }
}

interface KeycloakJwtPayload {
  sub: string;
  preferred_username: string;
  email: string;
  realm_access?: { roles: string[] };
  resource_access?: Record<string, { roles: string[] }>;
  secretaria?: string;
  session_state: string;
  iat: number;
  exp: number;
}
```

```typescript
// src/auth/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const Roles = (...roles: string[]) =>
  Reflect.metadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    const userRoles: string[] = user?.roles ?? [];

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Roles necessárias: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
```

```typescript
// src/financeiro/empenho.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('empenhos')
@UseGuards(AuthGuard('keycloak'), RolesGuard)
export class EmpenhoController {
  @Post()
  @Roles('contador', 'secretario', 'prefeito')
  async registrar(@Body() dto: RegistrarEmpenhoDto) {
    // ...
  }
}
```

### 3. Exportar Realm para Versionamento (CI/CD)

```bash
# Exportar realm completo (sem segredos de client)
docker exec keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/realm-export \
  --realm prefeitura-exemplo-sp \
  --users realm_file

# Commitar no repositório de IaC
cp /tmp/realm-export/prefeitura-exemplo-sp-realm.json \
  ./infra/keycloak/realms/
```

```yaml
# docker-compose.yml - subir Keycloak com realm pré-configurado
services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    command: start-dev --import-realm
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: ${KC_DB_PASSWORD}
    volumes:
      - ./infra/keycloak/realms:/opt/keycloak/data/import
    ports:
      - "8080:8080"
```

## Armadilhas

- **Não versionar o realm**: Export manual vira desastre. Configure export automático no CI e commit no repositório de IaC.
- **Token lifetime muito longo**: `accessTokenLifespan` de 1h em sistema público é falha de segurança. Máximo 5 minutos; use refresh token.
- **Esquecer brute force protection**: Ataques de força bruta contra contas de servidores públicos são reais. Sempre habilitar com lockout temporário.
- **Gov.br em dev**: O ambiente de staging do Gov.br exige cadastro separado. Comece cedo — aprovação pode levar semanas.
- **Não mapear roles no token**: Por padrão Keycloak só coloca `realm_access.roles` no token se o mapper estiver configurado. Verifique no protocolo mapper do client.
- **Sessão vs token**: Invalidação de sessão (ex: servidor demitido) exige revogar sessão no Keycloak **e** expirar o access token. Com refresh token rotation isso é automático.

## Referências

- [Documentação oficial Keycloak 24](https://www.keycloak.org/documentation)
- [Gov.br integração OpenID Connect](https://manual-roteiro-integracao-login-unico.servicos.gov.br/)
- [Lei 14.129/2021 — Gov Digital](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14129.htm)
- [BNDES — Guia de Segurança para Sistemas Públicos](https://www.bndes.gov.br)
