# 1. Criar migration a partir do schema
npx prisma migrate dev --name add_user_role

# 2. Aplicar migrations em produção
npx prisma migrate deploy

# 3. Resetar DB (development)
npx prisma migrate reset

# 4. Gerar client após mudanças
npx prisma generate

# 5. Visualizar DB
npx prisma studio