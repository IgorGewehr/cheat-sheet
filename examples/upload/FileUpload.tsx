'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

type FileUploadProps = {
  onUploadComplete: (key: string, url: string) => void
  accept?: Record<string, string[]>
  maxSize?: number
}

export function FileUpload({
  onUploadComplete,
  accept = { 'image/*': ['.png', '.jpg', '.jpeg'] },
  maxSize = 5 * 1024 * 1024,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      // 1. Pega URL assinada
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      })

      if (!presignRes.ok) {
        const data = await presignRes.json()
        throw new Error(data.error || 'Erro ao preparar upload')
      }

      const { url, key } = await presignRes.json()

      // 2. Upload direto para S3 com progresso
      await uploadWithProgress(url, file, setProgress)

      // 3. Confirma upload no backend
      const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, fileName: file.name, fileSize: file.size }),
      })

      if (!confirmRes.ok) {
        throw new Error('Erro ao confirmar upload')
      }

      const { publicUrl } = await confirmRes.json()
      onUploadComplete(key, publicUrl)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      uploadFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: uploading,
  })

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
      `}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">Enviando... {progress}%</p>
        </div>
      ) : (
        <div>
          <p className="text-gray-600">
            {isDragActive
              ? 'Solte o arquivo aqui'
              : 'Arraste um arquivo ou clique para selecionar'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Máximo {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  )
}

// Helper para upload com progresso
function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error('Upload failed'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))

    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}