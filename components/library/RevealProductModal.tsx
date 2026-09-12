'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { ProductHeader } from './reveal-product-modal/ProductHeader'
import { KeyList } from './reveal-product-modal/KeyList'
import { ModalFooter } from './reveal-product-modal/ModalFooter'
import { ProductDetails } from './reveal-product-modal/types'
import { keysService } from '@/lib/services/keys.service'
import { useUserStore } from '@/store/useUserStore'
import { ProductService } from '@/lib/services/product.service'

interface RevealProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: ProductDetails
}

// Simple in-memory cache so repeated opens are instant
const keysCache = new Map<string, string[]>()

export function RevealProductModal({
  isOpen,
  onClose,
  product,
}: RevealProductModalProps) {
  const [keys, setKeys] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activationGuide, setActivationGuide] = React.useState<
    { guide: string; name: string; icon?: string | null } | undefined
  >(undefined)
  const [guideLoading, setGuideLoading] = React.useState(false)
  const userEmail = useUserStore((state) => state.user?.email)

  React.useEffect(() => {
    if (!isOpen || !product.orderId || !userEmail) return

    const cacheKey = `${userEmail}|${product.orderId}|${product.variantId}`

    // Serve from cache if available
    if (keysCache.has(cacheKey)) {
      setKeys(keysCache.get(cacheKey)!)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    async function fetchKeys() {
      setLoading(true)
      setError(null)
      setKeys([])

      try {
        const data = await keysService.getKeys(product.orderId, userEmail!)
        if (!cancelled) {
          // Filter keys to the selected variant only
          const variantKeys = product.variantId
            ? data.filter((k) => k.variant_id === product.variantId)
            : data
          const licenseKeys = variantKeys.map((k) => k.license_key)
          keysCache.set(cacheKey, licenseKeys)
          setKeys(licenseKeys)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch keys:', err)
          setError('Failed to load keys. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchKeys()

    return () => {
      cancelled = true
    }
  }, [isOpen, product.orderId, product.variantId, userEmail])

  React.useEffect(() => {
    if (!isOpen || !product.handle) return

    setGuideLoading(true)
    setActivationGuide(undefined)

    async function fetchActivationGuide() {
      try {
        const shopifyProduct = await ProductService.getProductByHandle(
          product.handle,
        )
        if (shopifyProduct?.activationGuide) {
          setActivationGuide(shopifyProduct.activationGuide)
        } else {
          setActivationGuide(undefined)
        }
      } catch {
        // activation guide is optional
      } finally {
        setGuideLoading(false)
      }
    }

    fetchActivationGuide()
  }, [isOpen, product.handle])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="bg-secondary/40 border-secondary max-h-[95vh] w-full gap-0 overflow-hidden border p-0 text-white shadow-2xl backdrop-blur-xl outline-none sm:max-w-200 sm:rounded-[30px]"
      >
        <div className="flex max-h-[calc(95vh-2px)] flex-col gap-8 overflow-y-auto p-4 [-ms-overflow-style:'none'] [scrollbar-width:'none'] sm:p-10 [&::-webkit-scrollbar]:hidden">
          <DialogHeader className="border-secondary flex flex-row items-center justify-between space-y-0 border-b pb-6 text-left">
            <DialogTitle className="text-xl font-semibold md:text-2xl">
              Reveal Product
            </DialogTitle>
            <DialogClose className="rounded-full p-2 transition-colors hover:bg-white/10">
              <X className="text-muted-foreground h-6 w-6" />
            </DialogClose>
          </DialogHeader>

          <div className="flex flex-col gap-8">
            <ProductHeader
              product={product}
              activationGuide={activationGuide}
              guideLoading={guideLoading}
            />

            <div className="flex flex-col gap-3">
              <h4 className="text-lg font-semibold">Reveal Product</h4>
              <div>
                {loading ? (
                  <div className="flex flex-col gap-4">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-secondary h-12 animate-pulse rounded-xl md:h-13.5"
                      />
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center rounded-xl bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                ) : keys.length > 0 ? (
                  <KeyList keys={keys} />
                ) : (
                  <div className="bg-secondary flex items-center justify-center rounded-xl p-4">
                    <p className="text-muted-foreground text-sm">
                      No keys available for this product.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <ModalFooter
              revealDate={product.revealDate}
              activationGuide={activationGuide}
              guideLoading={guideLoading || loading}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
