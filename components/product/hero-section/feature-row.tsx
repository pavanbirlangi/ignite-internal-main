import { Zap, Star, Shield } from 'lucide-react'
import type { FeatureRowProps as BaseFeatureRowProps } from '@/types/ProductFeatureTypes'
import type { ProductFeatures } from '@/lib/services/product.service'

interface FeatureRowProps extends BaseFeatureRowProps {
  features?: ProductFeatures | null
  labels?: {
    instant?: string
    delivery?: string
    secure?: string
  }
}

export default function FeatureRow({ product, features, labels }: FeatureRowProps) {
  const parsedRating = features?.rating ?? (product.rating?.value
    ? Number.parseFloat(product.rating.value)
    : Number.NaN)
  const rating = Number.isFinite(parsedRating) ? parsedRating.toFixed(1) : '0'

  return (
    <div className="grid w-full grid-cols-3 gap-4 text-white">
      <div className="bg-secondary/80 flex items-center justify-center gap-2 rounded-[12px] border border-white/5 p-4">
        <Zap size={18} className="text-primary" fill="currentColor" />
        <span className="text-sm font-medium">
          {features?.instantText ?? (product.instantDelivery ? (labels?.instant ?? 'Instant') : (labels?.delivery ?? 'Delivery'))}
        </span>
      </div>
      <div className="bg-secondary/80 flex items-center justify-center gap-2 rounded-[12px] border border-white/5 p-4">
        <Shield size={18} className="text-destructive" />
        <span className="text-sm font-medium">{features?.secureText ?? (labels?.secure ?? 'Secure')}</span>
      </div>
      <div className="bg-secondary/80 flex items-center justify-center gap-2 rounded-[12px] border border-white/5 p-4">
        <Star size={18} className="text-accent"  />
        <span className="text-sm font-medium">{rating}</span>
      </div>
    </div>
  )
}
