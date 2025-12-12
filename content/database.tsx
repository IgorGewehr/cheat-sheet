import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function PrismaDrizzle() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Prisma vs Drizzle
      </h1>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Comparação
      </h3>

      <table className="guide-table">
        <thead>
          <tr>
            <th>Aspecto</th>
            <th>Prisma</th>
            <th>Drizzle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Filosofia</td>
            <td>Schema-first, abstrai SQL</td>
            <td>SQL-first, "TypeScript ORM"</td>
          </tr>
          <tr>
            <td>Performance</td>
            <td>Boa (query engine separada)</td>
            <td>Excelente (queries diretas)</td>
          </tr>
          <tr>
            <td>Bundle Size</td>
            <td>~2MB+ (engine binária)</td>
            <td>~50KB</td>
          </tr>
          <tr>
            <td>Edge Runtime</td>
            <td>Precisa de adapter (Neon, etc)</td>
            <td>Funciona nativamente</td>
          </tr>
          <tr>
            <td>Curva de Aprendizado</td>
            <td>Mais fácil</td>
            <td>Precisa conhecer SQL</td>
          </tr>
          <tr>
            <td>Migrations</td>
            <td>prisma migrate</td>
            <td>drizzle-kit</td>
          </tr>
        </tbody>
      </table>

      <NoteBox type="info" title="Recomendação">
        <strong>Prisma</strong>: Projetos maiores, equipes com menos experiência SQL, muitas relações complexas.
        <br />
        <strong>Drizzle</strong>: Performance crítica, Edge Functions, bundle size importa, SQL experts.
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Setup Prisma
      </h3>

      <CodeBlockFile
        file="database/prisma-schema.prisma"
        fileName="prisma/schema.prisma"
      />

      <CodeBlockFile
        file="database/prisma-db.ts"
        fileName="lib/db.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Setup Drizzle
      </h3>

      <CodeBlockFile
        file="database/drizzle-schema.ts"
        fileName="lib/db/schema.ts"
      />

      <CodeBlockFile
        file="database/drizzle-db.ts"
        fileName="lib/db/index.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Queries Comuns - Prisma
      </h3>

      <CodeBlockFile
        file="database/prisma-queries.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Queries Comuns - Drizzle
      </h3>

      <CodeBlockFile
        file="database/drizzle-queries.ts"
      />
    </div>
  )
}

export function MigrationsSeeds() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        Migrations & Seeds
      </h1>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Workflow Prisma
      </h3>

      <CodeBlockFile
        file="database/prisma-migrations.sh"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Workflow Drizzle
      </h3>

      <CodeBlockFile
        file="database/drizzle-config.ts"
        fileName="drizzle.config.ts"
      />

      <CodeBlockFile
        file="database/drizzle-migrations.sh"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Seed Script
      </h3>

      <CodeBlockFile
        file="database/prisma-seed.ts"
        fileName="prisma/seed.ts"
      />

      <CodeBlockFile
        file="database/prisma-seed-package.json"
        fileName="package.json"
      />

      <NoteBox type="success" title="Executar Seed">
        <code>npx prisma db seed</code> - executa o seed script
        <br />
        <code>npx prisma migrate reset</code> - reset + seed automático
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Scripts npm Recomendados
      </h3>

      <CodeBlockFile
        file="database/scripts-package.json"
        fileName="package.json"
      />

      <NoteBox type="warning" title="Ambiente de Produção">
        <ul className="list-disc list-inside space-y-1">
          <li>Nunca use <code>migrate dev</code> ou <code>db push</code> em produção</li>
          <li>Sempre use <code>migrate deploy</code> em CI/CD</li>
          <li>Faça backup antes de migrations destrutivas</li>
          <li>Teste migrations em staging primeiro</li>
        </ul>
      </NoteBox>
    </div>
  )
}
