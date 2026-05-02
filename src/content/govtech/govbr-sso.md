---
title: "Integração com Login Gov.br (OpenID Connect)"
category: "govtech"
stack: ["NestJS", "Keycloak", "TypeScript", "Passport.js", "Next.js"]
tags: ["govbr", "sso", "oidc", "keycloak", "autenticacao", "openid-connect", "cidadao"]
excerpt: "Gov.br é o sistema nacional de autenticação federal baseado em OpenID Connect sobre Keycloak. Este card cobre níveis de confiabilidade (Bronze/Prata/Ouro), integração técnica com NestJS e fallback para quando o Gov.br fica fora do ar."
---

## Visão Geral

Gov.br é o Identity Provider (IdP) federal do governo brasileiro. Serviços que interagem com dados pessoais federais (CPF validado, título de eleitor, dados de saúde) devem usar Gov.br como autenticação. É baseado em **OpenID Connect 1.0** sobre uma instância do **Keycloak** do governo federal.

Ambientes:
- **Produção**: `sso.acesso.gov.br`
- **Staging**: `sso.staging.acesso.gov.br`
- **Documentação**: `acesso.gov.br/manual-desenvolvedor`

Dados que o Gov.br pode fornecer (por nível):
| Campo | Bronze | Prata | Ouro |
|-------|--------|-------|------|
| CPF validado | sim | sim | sim |
| Nome completo | sim | sim | sim |
| E-mail | se cadastrado | sim | sim |
| Foto | não | não | sim |
| Data de nascimento | não | sim | sim |
| Endereço | não | não | sim |
| Celular validado | não | sim | sim |

## Contexto B2G

Para portais municipais, o Gov.br resolve dois problemas críticos:
1. **Validação de CPF sem precisar integrar com Receita Federal** — o Ouro já fez biometria facial validada pelo DENATRAN
2. **Responsabilidade de autenticação** — se o cidadão entrar com CPF de outra pessoa, a responsabilidade é do Gov.br, não da prefeitura

Casos de uso típicos:
- Emissão de guias de IPTU (Bronze mínimo)
- Solicitação de benefícios sociais (Prata mínimo — confirmar identidade)
- Serviços que envolvem movimentação financeira (Prata/Ouro)
- Acesso a dados de saúde (Ouro)

## Quando usar

- Sistema de protocolo digital (requerimentos, alvarás)
- Portal do cidadão com dados personalizados
- Emissão de certidões negativas de débito
- Cadastro em programas sociais
- Qualquer serviço que hoje pede CPF + senha fraca

Não usar Gov.br para: sistemas internos de servidores públicos (usar AD/LDAP municipal ou Keycloak próprio).

## Trade-offs

| Aspecto | Gov.br | Cadastro próprio |
|---------|--------|-----------------|
| Validação de identidade | Alta (Prata = banco validado, Ouro = biometria) | Baixa (só CPF + e-mail) |
| Responsabilidade | Compartilhada com governo federal | 100% sua |
| Dependência de disponibilidade | Alta — Gov.br fora = cidadão não acessa | Nenhuma dependência externa |
| Dados cadastrais | Atualizados pelo próprio Gov.br | Você mantém |
| Tempo de implementação | 3-5 dias | 1-2 semanas (com segurança adequada) |

**Recomendação**: Gov.br para autenticação pública + cadastro local como fallback (circuit breaker). O cidadão que não consegue acessar o Gov.br deve poder usar usuário/senha local temporário.

## Implementação

### Configuração do IdP Gov.br no Keycloak municipal

```json
// keycloak/identity-providers/govbr.json
{
  "alias": "govbr",
  "displayName": "Login Gov.br",
  "providerId": "oidc",
  "enabled": true,
  "trustEmail": true,
  "storeToken": false,
  "addReadTokenRoleOnCreate": false,
  "authenticateByDefault": false,
  "linkOnly": false,
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "clientId": "SEU_CLIENT_ID_AQUI",
    "clientSecret": "SEU_CLIENT_SECRET_AQUI",
    "tokenUrl": "https://sso.acesso.gov.br/token",
    "authorizationUrl": "https://sso.acesso.gov.br/authorize",
    "userInfoUrl": "https://sso.acesso.gov.br/userinfo",
    "jwksUrl": "https://sso.acesso.gov.br/.well-known/jwks.json",
    "validateSignature": "true",
    "useJwksUrl": "true",
    "pkceEnabled": "true",
    "pkceMethod": "S256",
    "defaultScope": "openid email profile govbr_confiabilidades",
    "clientAuthMethod": "client_secret_post",
    "syncMode": "IMPORT",

    "userAttribute.cpf": "cpf",
    "userAttribute.nivel_acesso": "nivel_acesso",
    "userAttribute.amr": "amr",

    "claimDelimiter": " ",
    "guiOrder": "0",
    "backchannelSupported": "false"
  }
}
```

### Mapper de claims Gov.br no Keycloak

```json
// keycloak/identity-providers/govbr-mappers.json
[
  {
    "name": "CPF",
    "identityProviderMapper": "oidc-user-attribute-idp-mapper",
    "config": {
      "claim": "sub",
      "user.attribute": "cpf",
      "syncMode": "INHERIT"
    }
  },
  {
    "name": "Nome completo",
    "identityProviderMapper": "oidc-full-name-idp-mapper",
    "config": {
      "syncMode": "INHERIT"
    }
  },
  {
    "name": "Nível de acesso",
    "identityProviderMapper": "oidc-user-attribute-idp-mapper",
    "config": {
      "claim": "nivel_acesso",
      "user.attribute": "nivel_acesso",
      "syncMode": "INHERIT"
    }
  },
  {
    "name": "Confiabilidades",
    "identityProviderMapper": "oidc-user-attribute-idp-mapper",
    "config": {
      "claim": "govbr_confiabilidades",
      "user.attribute": "govbr_confiabilidades",
      "syncMode": "INHERIT"
    }
  }
]
```

### NestJS Strategy para Gov.br (OIDC via Passport)

```typescript
// src/auth/strategies/govbr.strategy.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Client, Issuer, TokenSet, UserinfoResponse } from "openid-client";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GovBrStrategy extends PassportStrategy(Strategy, "govbr") {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    client: Client,
  ) {
    super({
      client,
      params: {
        scope: "openid email profile govbr_confiabilidades",
        // PKCE habilitado automaticamente pelo openid-client
      },
      passReqToCallback: false,
      usePKCE: true,
    });
  }

  // Factory estático para criar a strategy com o issuer do Gov.br
  static async create(
    config: ConfigService,
    authService: AuthService,
  ): Promise<GovBrStrategy> {
    const isStaging = config.get("NODE_ENV") !== "production";
    const issuerUrl = isStaging
      ? "https://sso.staging.acesso.gov.br"
      : "https://sso.acesso.gov.br";

    const govbrIssuer = await Issuer.discover(issuerUrl);

    const client = new govbrIssuer.Client({
      client_id: config.getOrThrow("GOVBR_CLIENT_ID"),
      client_secret: config.getOrThrow("GOVBR_CLIENT_SECRET"),
      redirect_uris: [config.getOrThrow("GOVBR_REDIRECT_URI")],
      response_types: ["code"],
    });

    return new GovBrStrategy(config, authService, client);
  }

  async validate(tokenSet: TokenSet, userinfo: UserinfoResponse) {
    // Claims do Gov.br
    const claims = tokenSet.claims();
    const cpf = (claims.sub as string).replace(/\D/g, ""); // sub = CPF sem formatação
    const nomeCompleto = userinfo.name ?? (userinfo as Record<string, unknown>)["nome_social"] as string;
    const email = userinfo.email;
    const nivelAcesso = (userinfo as Record<string, unknown>)["nivel_acesso"] as string ?? "1";
    const confiabilidades = (userinfo as Record<string, unknown>)["govbr_confiabilidades"] as string[] ?? [];

    if (!cpf) {
      throw new UnauthorizedException("CPF não retornado pelo Gov.br");
    }

    // Mapear nível de acesso para Bronze/Prata/Ouro
    const nivel = this.mapNivelAcesso(parseInt(nivelAcesso), confiabilidades);

    // Criar ou atualizar o cidadão no banco local
    const cidadao = await this.authService.upsertCidadaoGovBr({
      cpf,
      nomeCompleto: nomeCompleto ?? "Não informado",
      email: email ?? null,
      nivelConfiabilidade: nivel,
    });

    return cidadao;
  }

  private mapNivelAcesso(nivel: number, confiabilidades: string[]): "bronze" | "prata" | "ouro" {
    // Nível 3 = Ouro (biometria facial validada)
    if (nivel >= 3 || confiabilidades.includes("3")) return "ouro";
    // Nível 2 = Prata (validação bancária ou certificado digital)
    if (nivel >= 2 || confiabilidades.includes("2")) return "prata";
    // Nível 1 = Bronze (cadastro básico)
    return "bronze";
  }
}
```

### Proteção de rotas por nível de confiabilidade

```typescript
// src/auth/decorators/nivel-govbr.decorator.ts
import { SetMetadata } from "@nestjs/common";

export type NivelConfiabilidade = "bronze" | "prata" | "ouro";

export const NIVEL_KEY = "nivelConfiabilidade";
export const NivelMinimo = (nivel: NivelConfiabilidade) =>
  SetMetadata(NIVEL_KEY, nivel);

// src/auth/guards/nivel-confiabilidade.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { NIVEL_KEY, NivelConfiabilidade } from "../decorators/nivel-govbr.decorator";

const NIVEL_ORDER: Record<NivelConfiabilidade, number> = {
  bronze: 1,
  prata: 2,
  ouro: 3,
};

@Injectable()
export class NivelConfiabilidadeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const nivelRequerido = this.reflector.getAllAndOverride<NivelConfiabilidade>(
      NIVEL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!nivelRequerido) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { nivelConfiabilidade: NivelConfiabilidade };

    if (!user?.nivelConfiabilidade) {
      throw new ForbiddenException("Autenticação via Gov.br necessária");
    }

    const nivelUsuario = NIVEL_ORDER[user.nivelConfiabilidade];
    const nivelMinimo = NIVEL_ORDER[nivelRequerido];

    if (nivelUsuario < nivelMinimo) {
      throw new ForbiddenException(
        `Nível de confiabilidade insuficiente. Necessário: ${nivelRequerido}. Atual: ${user.nivelConfiabilidade}`
      );
    }

    return true;
  }
}

// Uso nos controllers:
// src/modules/beneficios/beneficios.controller.ts
@Controller("beneficios")
@UseGuards(JwtAuthGuard, NivelConfiabilidadeGuard)
export class BeneficiosController {
  @Get("meus-beneficios")
  @NivelMinimo("bronze")
  getMeusBeneficios() { ... }

  @Post("solicitar")
  @NivelMinimo("prata") // Benefício social requer validação bancária
  solicitarBeneficio() { ... }

  @Get("dados-saude")
  @NivelMinimo("ouro") // Dados de saúde requerem biometria
  getDadosSaude() { ... }
}
```

### Circuit breaker para Gov.br fora do ar

```typescript
// src/auth/govbr-circuit-breaker.service.ts
import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

@Injectable()
export class GovBrCircuitBreaker {
  private readonly logger = new Logger(GovBrCircuitBreaker.name);
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();

  private readonly FAILURE_THRESHOLD = 5;
  private readonly SUCCESS_THRESHOLD = 2;
  private readonly TIMEOUT_MS = 30_000; // 30 segundos de intervalo antes de tentar novamente

  async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        this.logger.warn("Gov.br circuit OPEN — usando fallback");
        if (fallback) return fallback();
        throw new ServiceUnavailableException(
          "O sistema Gov.br está temporariamente indisponível. Tente novamente em alguns minutos."
        );
      }
      // Tentar novamente (HALF_OPEN)
      this.state = "HALF_OPEN";
      this.successCount = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err as Error);
      if (fallback) return fallback();
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.SUCCESS_THRESHOLD) {
        this.state = "CLOSED";
        this.logger.log("Gov.br circuit fechado — serviço recuperado");
      }
    }
  }

  private onFailure(err: Error) {
    this.failureCount++;
    this.logger.warn(`Gov.br falha #${this.failureCount}: ${err.message}`);

    if (this.failureCount >= this.FAILURE_THRESHOLD || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.TIMEOUT_MS;
      this.logger.error("Gov.br circuit ABERTO — serviço indisponível");
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}
```

### Controller de autenticação Gov.br

```typescript
// src/auth/auth.controller.ts
import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { GovBrCircuitBreaker } from "./govbr-circuit-breaker.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly jwt: JwtService,
    private readonly circuitBreaker: GovBrCircuitBreaker,
  ) {}

  // 1. Inicia o fluxo — redireciona para o Gov.br
  @Get("govbr")
  @UseGuards(AuthGuard("govbr"))
  async loginGovBr() {
    // Passport redireciona automaticamente para o Gov.br
  }

  // 2. Callback após autenticação no Gov.br
  @Get("govbr/callback")
  @UseGuards(AuthGuard("govbr"))
  async callbackGovBr(@Req() req: any, @Res() res: Response) {
    const user = req.user;

    const token = this.jwt.sign({
      sub: user.id,
      cpfToken: user.cpfToken,
      nivel: user.nivelConfiabilidade,
    });

    // Redirect para o frontend com o token
    const frontendUrl = process.env.FRONTEND_URL!;
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  // 3. Status do circuit breaker (para monitoramento)
  @Get("govbr/status")
  getStatus() {
    return { circuitBreaker: this.circuitBreaker.getState() };
  }
}
```

## Armadilhas

**1. Usar o `sub` do Gov.br como ID interno**
O `sub` (que é o CPF) pode mudar de formato entre ambientes staging e produção. Sempre criar um ID interno próprio (UUID) e armazenar o CPF tokenizado.

**2. Não implementar o PKCE**
Sem PKCE, o fluxo Authorization Code é vulnerável a interceptação do código. O Gov.br exige PKCE. Usar a opção `usePKCE: true` do `openid-client`.

**3. Confiar no nível de acesso sem re-verificar**
O `nivel_acesso` do JWT pode estar desatualizado. Para operações críticas, chamar o endpoint `/userinfo` novamente em vez de confiar só no token.

**4. Sem timeout configurado no HTTP client**
Se o Gov.br travar (sem resposta), seu servidor também trava. Configurar timeout de 10s no cliente HTTP e implementar circuit breaker.

**5. Exibir mensagem "Gov.br fora do ar" para o usuário**
Usuário não sabe o que é "Gov.br". Mensagem adequada: "O sistema de autenticação do governo federal está temporariamente indisponível. Entre em contato com a prefeitura pessoalmente ou tente novamente em alguns minutos."

**6. Não invalidar o token local quando o usuário faz logout no Gov.br**
Implementar backchannel logout ou verificar a validade do token Gov.br a cada request crítico.

## Referências

- [Documentação oficial Gov.br para desenvolvedores](https://acesso.gov.br/manual-desenvolvedor)
- [openid-client (Node.js)](https://github.com/panva/node-openid-client)
- [Keycloak — Identity Brokering](https://www.keycloak.org/docs/latest/server_admin/#_identity_broker)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [PKCE — RFC 7636](https://www.rfc-editor.org/rfc/rfc7636)
