import CodeBlockFile from '@/components/CodeBlockFile'
import NoteBox from '@/components/NoteBox'

export function FileUpload() {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl font-bold border-b-2 border-accent pb-3 mb-8">
        File Upload
      </h1>

      <NoteBox type="danger" title="Segurança em Uploads">
        <ul className="list-disc list-inside">
          <li>Valide tipo MIME no servidor (não confie no cliente)</li>
          <li>Limite tamanho por tipo de arquivo</li>
          <li>Renomeie arquivos (nunca use nome original)</li>
          <li>Escaneie por malware em uploads públicos</li>
          <li>Use URLs assinadas para arquivos privados</li>
        </ul>
      </NoteBox>

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Limites por Plano
      </h3>

      <CodeBlockFile
        file="upload/limits.ts"
        fileName="lib/upload/limits.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Upload Direto para S3 (Presigned URL)
      </h3>

      <NoteBox type="info" title="Por que Presigned URLs?">
        Upload direto do browser para S3 evita que seu servidor seja gargalo.
        O arquivo nunca passa pelo seu backend.
      </NoteBox>

      <CodeBlockFile
        file="upload/s3.ts"
        fileName="lib/upload/s3.ts"
      />

      <CodeBlockFile
        file="upload/presign-route.ts"
        fileName="app/api/upload/presign/route.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Componente de Upload
      </h3>

      <CodeBlockFile
        file="upload/FileUpload.tsx"
        fileName="components/FileUpload.tsx"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Confirmar Upload e Salvar Metadata
      </h3>

      <CodeBlockFile
        file="upload/confirm-route.ts"
        fileName="app/api/upload/confirm/route.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Schema de Arquivos
      </h3>

      <CodeBlockFile
        file="upload/schema.prisma"
        fileName="prisma/schema.prisma"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Validação de Tipo Real (Magic Bytes)
      </h3>

      <NoteBox type="danger" title="Não confie em Content-Type">
        Usuários mal-intencionados podem enviar .exe renomeado para .jpg.
        Valide os magic bytes do arquivo.
      </NoteBox>

      <CodeBlockFile
        file="upload/validate.ts"
        fileName="lib/upload/validate.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Processamento de Imagens
      </h3>

      <CodeBlockFile
        file="upload/process-image.ts"
        fileName="lib/upload/process-image.ts"
      />

      <h3 className="text-xl font-semibold mt-8 mb-4 border-l-4 border-accent pl-3">
        Deletar Arquivos
      </h3>

      <CodeBlockFile
        file="upload/delete-route.ts"
        fileName="app/api/files/[id]/route.ts"
      />
    </div>
  )
}
