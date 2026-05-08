---
title: "Go: Auth Profissional — JWT, PASETO, Sessions e RBAC"
category: auth
stack: [Go, golang-jwt, paseto, gorilla/sessions, OAuth2]
tags: [auth, jwt, paseto, oauth, rbac, security, golang]
excerpt: "Autenticação em Go pronto pra qualquer entrevista: JWT vs PASETO vs sessão, alg confusion, key rotation, refresh tokens, OAuth2 code flow e middleware RBAC sem armadilha."
related: [go-security-pratico, go-chi-http, session-cookie-vs-jwt, oauth-2-1, rbac-vs-abac]
updated: "2026-05-08"
---

## Antes de escrever código

Auth é o componente mais escrutinado em entrevista sênior porque erros aqui são facilmente catastróficos. Antes do "como implementar", responda:

- O que estou autenticando? Browser, mobile, server-to-server?
- Sessão server-side ou stateless?
- Token vai cruzar domínios?
- Quem revoga?
- Qual o blast radius de um token vazado?

## Sessions vs JWT vs PASETO

| | Server session | JWT | PASETO |
|---|---|---|---|
| Estado | Server (Redis/DB) | Client | Client |
| Revogação | Imediata | Difícil sem blacklist | Difícil sem blacklist |
| Algoritmo | N/A | Negociável (perigoso) | Versionado (v3/v4) |
| Tamanho na rede | Pequeno (cookie) | Grande | Grande |
| Caso ideal | App web first-party | API entre domínios | Mesmo de JWT, mais seguro por design |

Regra prática: **app web monolítico → session cookie**. **API consumida por mobile/SPA/serviços externos → JWT/PASETO curto + refresh server-side**.

## JWT em Go com `golang-jwt/jwt`

```go
import (
    "github.com/golang-jwt/jwt/v5"
    "time"
)

type Claims struct {
    UserID string   `json:"sub"`
    Tenant string   `json:"tenant"`
    Roles  []string `json:"roles"`
    jwt.RegisteredClaims
}

func issueToken(secret []byte, userID, tenant string, roles []string) (string, error) {
    claims := Claims{
        UserID: userID,
        Tenant: tenant,
        Roles:  roles,
        RegisteredClaims: jwt.RegisteredClaims{
            Issuer:    "billing-service",
            Audience:  jwt.ClaimStrings{"internal-api"},
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
            ID:        uuid.NewString(), // jti para revogação
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(secret)
}
```

## Validação correta — onde os bugs vivem

```go
func parseToken(tokenStr string, secret []byte) (*Claims, error) {
    claims := &Claims{}
    token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
        // ⚠️ Sem essa checagem você é vulnerável a alg=none e alg confusion
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
        }
        return secret, nil
    },
        jwt.WithIssuer("billing-service"),
        jwt.WithAudience("internal-api"),
        jwt.WithExpirationRequired(),
    )
    if err != nil || !token.Valid {
        return nil, fmt.Errorf("invalid token: %w", err)
    }
    return claims, nil
}
```

Pontos críticos que aparecem em pentest:

- **alg=none**: lib antiga aceita JWT sem assinatura. Sempre valide o `Method` esperado.
- **alg confusion** (RS256↔HS256): atacante muda o `alg` para HS256 e usa a chave pública como secret. Sempre cheque o tipo da chave.
- **kid injection**: `kid` controlado pelo atacante apontando para chave previsível. Em rotação real, valide o `kid` contra um keystore conhecido.
- **expiração obrigatória**: `WithExpirationRequired()` força. Sem isso, claims sem `exp` ficam válidos pra sempre.

## RS256/RSA com JWKS rotation

Em produção real você publica chaves via JWKS endpoint e roda rotação:

```go
import "github.com/MicahParks/keyfunc/v3"

jwks, err := keyfunc.NewDefault([]string{"https://auth.example.com/.well-known/jwks.json"})
if err != nil { return err }

token, err := jwt.Parse(tokenStr, jwks.Keyfunc,
    jwt.WithValidMethods([]string{"RS256"}),
    jwt.WithIssuer("https://auth.example.com"),
)
```

`keyfunc` cuida de cache, refresh do JWKS e seleção de chave por `kid`. Implementar isso na mão é fácil de errar.

## PASETO: alternativa moderna

PASETO (Platform-Agnostic SEcurity TOkens) elimina a categoria toda de vulnerabilidades de algoritmo: cada versão tem **um** algoritmo embutido (v4 usa Ed25519 público ou XChaCha20 simétrico).

```go
import "aidanwoods.dev/go-paseto"

key := paseto.NewV4AsymmetricSecretKey()
token := paseto.NewToken()
token.SetIssuer("billing-service")
token.SetExpiration(time.Now().Add(15 * time.Minute))
token.SetString("user_id", userID)
signed := token.V4Sign(key, nil)
```

Se está começando hoje e o ecossistema permite, PASETO é a escolha mais defensiva.

## Refresh token: estado server-side é necessário

Token de acesso curto (5–15 min) + refresh token longo (7–30 dias) é o padrão. Refresh **precisa** ser revogável — armazene server-side (Redis ou tabela):

```go
type RefreshToken struct {
    JTI       string
    UserID    string
    DeviceID  string
    ExpiresAt time.Time
    RevokedAt *time.Time
}
```

No `POST /auth/refresh`:

1. valide assinatura;
2. consulte o storage — se `RevokedAt != nil`, recuse;
3. **rotacione**: emita novo refresh, marque o anterior como usado;
4. detecte reuso: se um refresh já consumido voltar, **revogue toda a árvore** dessa sessão (refresh token reuse detection).

Sem rotação + detecção de reuso, refresh token vazado dá acesso vitalício.

## OAuth2 Authorization Code com PKCE

`golang.org/x/oauth2` cobre o boilerplate. Para login com gov.br, GitHub, Google, etc:

```go
conf := &oauth2.Config{
    ClientID:     os.Getenv("OAUTH_CLIENT_ID"),
    ClientSecret: os.Getenv("OAUTH_CLIENT_SECRET"),
    RedirectURL:  "https://app.example.com/auth/callback",
    Scopes:       []string{"openid", "profile", "email"},
    Endpoint:     google.Endpoint,
}

verifier := oauth2.GenerateVerifier()
state := randomState()
storeStateAndVerifier(state, verifier) // server-side, TTL curto

url := conf.AuthCodeURL(state,
    oauth2.AccessTypeOffline,
    oauth2.S256ChallengeOption(verifier),
)
http.Redirect(w, r, url, http.StatusFound)
```

No callback, sempre valide `state` (CSRF) e use o `verifier` correspondente (PKCE). Nunca confie no token do provider sem checar `aud` e `iss`.

## Middleware AuthN + AuthZ no Chi

```go
func RequireAuth(secret []byte) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            tokenStr := bearerToken(r)
            if tokenStr == "" {
                respondError(w, http.StatusUnauthorized, "missing token")
                return
            }
            claims, err := parseToken(tokenStr, secret)
            if err != nil {
                respondError(w, http.StatusUnauthorized, "invalid token")
                return
            }
            ctx := context.WithValue(r.Context(), userKey{}, claims)
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

func RequireRole(role string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            c, _ := r.Context().Value(userKey{}).(*Claims)
            if !slices.Contains(c.Roles, role) {
                respondError(w, http.StatusForbidden, "missing role")
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}
```

Use `userKey{}` (zero-cost struct) como chave de context para evitar collision com strings.

## AuthZ além de roles — RBAC vs ABAC

RBAC simples vira insuficiente quando aparece "usuário X só pode editar pedidos do tenant dele e que ainda não foram pagos". Para isso:

- **resource-based**: o handler busca o recurso e verifica `recurso.tenantID == claims.Tenant`;
- **policy engine** (OPA/Casbin): regras declarativas externas — útil quando regras são muitas e mudam sem deploy.

Nunca confie só em RBAC para multi-tenancy. Sempre cheque o tenant do recurso vs o tenant do token.

## Cookies de sessão (caso server-side)

```go
import "github.com/gorilla/sessions"

store := sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))
store.Options = &sessions.Options{
    Path:     "/",
    MaxAge:   60 * 60 * 8, // 8h
    HttpOnly: true,
    Secure:   true,
    SameSite: http.SameSiteLaxMode,
}
```

Para apps server-side em Go (HTML SSR), cookie de sessão é mais simples e seguro que JWT — revogação é trivial e tamanho fica pequeno.

## Anti-padrões que reprovam em entrevista

- aceitar `alg=none` ou não validar o método;
- guardar JWT em `localStorage` em SPA — XSS rouba;
- token sem `exp`;
- mesma chave HS256 para todos os ambientes;
- refresh sem rotação;
- AuthZ só por role sem checar tenant/owner do recurso;
- comparar token com `==` em vez de `subtle.ConstantTimeCompare` em casos de HMAC manual;
- logar `Authorization` header.

## Critério de domínio

Você dominou este card quando consegue desenhar o fluxo completo de auth de um sistema multi-tenant — emissão, validação, refresh, revogação, rotação de chave — explicando cada decisão em termos de blast radius do token vazado.
