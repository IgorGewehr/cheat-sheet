---
title: "Linux & Shell para Devs Backend"
category: stack-guides
stack: [Linux, Bash, Node.js, Docker]
tags: [linux, shell, bash, terminal, ssh, processos, deploy]
excerpt: "Os comandos que você usa todo dia como dev backend: navegação, inspeção de processos, rede, permissões, ssh e scripting básico para CI/CD."
related: [github-actions-cicd, docker-compose-dev, nestjs-config-env]
updated: "2026-05"
---

## Navegação e Manipulação de Arquivos

```bash
# Onde estou / listar
pwd                          # diretório atual
ls -la                       # lista com permissões e hidden files
ls -lh                       # tamanhos legíveis (K, M, G)

# Navegar
cd /caminho/absoluto
cd ..                        # volta um nível
cd ~                         # home do usuário
cd -                         # volta para o diretório anterior

# Criar e remover
mkdir -p src/modules/pedidos  # cria diretório e pais (-p)
rm -rf dist/                  # remove recursivo (cuidado: irreversível)
cp -r src/ backup/            # copia recursivo
mv arquivo.ts novo-nome.ts    # renomear ou mover

# Buscar
find . -name "*.ts" -not -path "*/node_modules/*"
grep -r "PedidosService" src/ --include="*.ts"
grep -rn "TODO" src/          # com número de linha
```

## Visualizar e Inspecionar Arquivos

```bash
cat arquivo.ts                # imprime tudo (ruim para arquivos grandes)
less arquivo.log              # paginado, sair com q
head -20 arquivo.log          # primeiras 20 linhas
tail -50 arquivo.log          # últimas 50 linhas
tail -f logs/app.log          # segue o arquivo em tempo real (logs ao vivo)

# Filtrar e transformar
grep "ERROR" logs/app.log     # só linhas com ERROR
grep -v "DEBUG" logs/app.log  # excluir linhas com DEBUG
cat arquivo.json | jq '.'     # formatar JSON (requer jq instalado)

# Contar
wc -l arquivo.ts              # número de linhas
```

## Processos

```bash
# Ver processos rodando
ps aux                        # todos os processos
ps aux | grep node            # filtrar por nome
pgrep -f "nest start"         # PID dos processos que contêm o padrão

# Matar processos
kill 12345                    # envia SIGTERM (graceful shutdown)
kill -9 12345                 # envia SIGKILL (força, sem cleanup)
pkill -f "nest start"         # mata por padrão de nome

# Monitorar em tempo real
top                           # CPU/memória de todos os processos
htop                          # versão melhorada do top (instale: apt install htop)

# Rodar em background
nohup npm run start > app.log 2>&1 &
echo $!                       # PID do último processo em background
```

## Rede

```bash
# Testar endpoints
curl http://localhost:3000/pedidos
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -d '{"clienteId": "uuid", "valor": 1500}'
curl -I http://localhost:3000     # apenas headers
curl -v http://localhost:3000     # verbose (útil para debug TLS)

# Ver portas em uso
lsof -i :3000                 # o que está usando a porta 3000
netstat -tlnp                 # todas as portas em escuta (Linux)
ss -tlnp                      # alternativa mais moderna ao netstat

# DNS
nslookup api.meusite.com
dig api.meusite.com

# Latência e conectividade
ping api.meusite.com
traceroute api.meusite.com
```

## Permissões

```bash
# Ler permissões: drwxr-xr-x
# d = diretório | rwx = owner | r-x = grupo | r-x = outros

chmod 755 script.sh           # rwxr-xr-x (executável por todos)
chmod 600 .env                # rw------- (só o owner lê/escreve)
chmod +x deploy.sh            # adiciona permissão de execução

chown usuario:grupo arquivo    # mudar dono
chown -R node:node /app       # recursivo (Docker containers precisam disso)
```

## SSH para Deploy

```bash
# Conectar
ssh usuario@servidor.com
ssh -i ~/.ssh/chave.pem usuario@ip   # com chave privada (AWS, DigitalOcean)

# Copiar arquivos
scp dist.tar.gz usuario@servidor:/app/
scp -r ./configs usuario@servidor:/etc/app/

# Tunnel para acessar banco remoto localmente
ssh -L 5432:localhost:5432 usuario@servidor    # Postgres remoto → localhost:5432

# Configurar acesso sem senha (~/.ssh/config)
Host meu-servidor
  HostName 192.168.1.100
  User deploy
  IdentityFile ~/.ssh/deploy_key
```

## Variáveis de Ambiente e Shell Script

```bash
# Variáveis
export DATABASE_URL="postgres://user:pass@localhost/db"
echo $DATABASE_URL

# Ler .env em shell
export $(cat .env | xargs)

# Condicional
if [ -f ".env" ]; then
  echo "arquivo existe"
fi

# Loop
for file in src/**/*.ts; do
  echo "processando $file"
done

# Script de deploy básico
#!/bin/bash
set -e                        # para se qualquer comando falhar

echo "Fazendo build..."
npm run build

echo "Rodando migrations..."
npm run db:migrate

echo "Reiniciando serviço..."
pm2 restart meu-app

echo "Deploy concluído"
```

## Variáveis de Ambiente no Node.js/NestJS

```bash
# Rodar com variáveis inline
DATABASE_URL=postgres://... NODE_ENV=production node dist/main.js

# .env para desenvolvimento (nunca commitar)
DATABASE_URL=postgres://user:password@localhost:5432/meubanco
JWT_SECRET=dev-secret-local
PORT=3000
```

**Regra**: `process.env.DATABASE_URL` sem validação é bug esperando acontecer. Use `@nestjs/config` com schema Zod/Joi que valida as variáveis no boot — falha rápido se alguma estiver faltando.
