import Image from 'next/image'

// Imagem responsiva com sizes correto
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Acima do fold - carrega imediatamente
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Imagem de avatar (tamanho fixo)
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
/>

// Imagem que preenche o container
<div className="relative h-64">
  <Image
    src="/bg.jpg"
    alt="Background"
    fill
    className="object-cover"
    sizes="100vw"
  />
</div>
