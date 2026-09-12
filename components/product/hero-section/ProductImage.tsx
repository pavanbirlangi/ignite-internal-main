import { getProxyImageUrl } from '@/lib/utils'
import Image from 'next/image'

interface ProductImageProps {
  src: string
  alt: string
}

export default function ProductImage({ src, alt }: ProductImageProps) {
  return (
    <div className="group relative h-full w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/50 md:w-[342px]">
      <Image
        src={getProxyImageUrl(src)}
        alt={alt}
        fill
        className="h-full w-full transform object-cover object-top transition-transform duration-500 group-hover:scale-105"
        priority
        quality={100}
      />
    </div>
  )
}
