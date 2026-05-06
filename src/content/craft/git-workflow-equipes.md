---
title: "Git Workflow para Equipes — Do Commit ao Deploy"
category: craft
stack: [Git, GitHub, Node.js]
tags: [git, workflow, conventional-commits, branching, pr, husky, commitlint]
excerpt: "Branch strategy, conventional commits, PRs e ferramentas de automação que evitam conflitos e mantêm o histórico legível quando a equipe cresce."
related: [github-actions-cicd, monorepo-turborepo]
updated: "2026-05"
---

## Branch Strategy

Para equipes pequenas (2-8 devs) o modelo mais prático:

```
main          ← produção, sempre estável
  └── feature/pedidos-paginacao      ← feature nova
  └── fix/calculo-imposto-nfce       ← bug fix
  └── refactor/pedidos-use-cases     ← refatoração
  └── chore/atualiza-dependencias    ← manutenção
```

**Regras**:
- `main` nunca recebe push direto — sempre via PR
- Branch por tarefa, não por dev ("feature de João" não é nome de branch)
- Branch vive enquanto o trabalho vive — merge e delete

## Conventional Commits

Formato: `<tipo>(<escopo opcional>): <descrição>`

```bash
feat(pedidos): adiciona paginação cursor-based
fix(nfe): corrige cálculo de ICMS em substituição tributária
refactor(auth): extrai verificação de token para guard dedicado
test(clientes): adiciona testes de integração para criação
chore: atualiza drizzle-orm para 0.32
docs: documenta fluxo de aprovação de pedidos
```

**Por que importa**:
- `CHANGELOG.md` pode ser gerado automaticamente
- `feat:` = versão minor, `fix:` = patch, `feat!:` = major (semver automático)
- Histórico vira documentação: `git log --oneline` mostra o que mudou sem precisar abrir o diff

## Fluxo de Pull Request

```bash
# 1. Criar branch a partir de main atualizado
git checkout main && git pull
git checkout -b feature/minha-feature

# 2. Desenvolver com commits pequenos e descritivos
git add src/pedidos/
git commit -m "feat(pedidos): adiciona endpoint de criação"

git add src/pedidos/
git commit -m "test(pedidos): adiciona testes unitários do service"

# 3. Antes de abrir PR: rebase em main para manter histórico limpo
git fetch origin
git rebase origin/main

# 4. Push e abrir PR
git push -u origin feature/minha-feature
```

**PR bom tem**:
- Título = conventional commit da feature principal
- Descrição: o quê mudou, por quê, como testar
- Menos de 400 linhas de diff (acima disso, divide em PRs menores)

## Rebase vs Merge — quando usar cada

```bash
# Rebase: para atualizar sua branch com main (histórico limpo)
git rebase origin/main

# Merge: para integrar feature branches em main (via PR no GitHub)
# GitHub faz o merge — você não precisa fazer manualmente
```

**Nunca**: `git rebase main` depois de ter feito push de uma branch compartilhada. Rebase reescreve história — se outros devs têm a branch, você vai criar conflitos impossíveis.

## .gitignore essencial para Node.js

```gitignore
# Dependências
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
.next/

# Ambiente — NUNCA commitar secrets
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db
```

`.env` no `.gitignore` é obrigatório. Secrets em repositório é incidente de segurança.

## Automação com Husky + Commitlint + Lint-staged

```bash
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional lint-staged
npx husky init
```

`commitlint.config.js`:
```js
module.exports = { extends: ['@commitlint/config-conventional'] };
```

`.husky/commit-msg`:
```bash
npx --no -- commitlint --edit $1
```

`.husky/pre-commit`:
```bash
npx lint-staged
```

`package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

Resultado: commit com mensagem inválida → rejeitado. Código com lint error → rejeitado. CI não precisa verificar o óbvio.

## Comandos de resgate

```bash
# Desfazer último commit (mantém as mudanças staged)
git reset --soft HEAD~1

# Ver o que vai entrar no commit
git diff --staged

# Stash: guardar trabalho inacabado antes de trocar de branch
git stash push -m "wip: metade do form de pedido"
git stash pop

# Conflito de merge: ver estado atual
git status
git diff          # ver o conflito
# editar arquivo, resolver conflito
git add arquivo
git rebase --continue    # ou git merge --continue

# Histórico bonito
git log --oneline --graph --decorate
```
