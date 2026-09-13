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
import { keysService, KeyAssignment } from '@/lib/services/keys.service'
import { ProductService } from '@/lib/services/product.service'
import { extractApiErrorMessage } from '@/lib/utils/api-error'

interface RevealProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: ProductDetails
}

// Simple in-memory cache so repeated opens are instant. No email in the cache
// key -- the route is session-authenticated with a server-side ownership
// check, not looked up by email at all (confirmed live).
const keysCache = new Map<string, KeyAssignment[]>()

export function RevealProductModal({
  isOpen,
  onClose,
  product,
}: RevealProductModalProps) {
  const [assignments, setAssignments] = React.useState<KeyAssignment[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activationGuide, setActivationGuide] = React.useState<
    { guide: string; name: string; icon?: string | null } | undefined
  >(undefined)
  const [guideLoading, setGuideLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen || !product.orderId) return

    const cacheKey = `${product.orderId}|${product.variantId}`

    // Serve from cache if available -- but never re-serve a still-pending
    // result, since an admin may have awarded a real key since it was cached.
    const cached = keysCache.get(cacheKey)
    if (cached && !cached.some((a) => a.status === 'pending_manual')) {
      setAssignments(cached)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    async function fetchKeys() {
      setLoading(true)
      setError(null)

      try {
        const data = await keysService.getOrderKeys(product.orderId)
        if (!cancelled) {
          // Filter to the selected variant only (an order can contain other products)
          const variantAssignments = product.variantId
            ? data.filter((a) => a.variantId === product.variantId)
            : data
          keysCache.set(cacheKey, variantAssignments)
          setAssignments(variantAssignments)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch keys:', err)
          setError(extractApiErrorMessage(err, 'Failed to load your key. Please try again.'))
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
  }, [isOpen, product.orderId, product.variantId])

  const isPending =
    assignments.length > 0 &&
    assignments.every((a) => a.status === 'pending_manual')
  const keys = assignments.map((a) => a.key).filter((k): k is string => !!k)
  const latestRevealedAt = assignments.find((a) => a.revealedAt)?.revealedAt

  React.useEffect(() => {
    if (!isOpen || !product.handle) return

    setGuideLoading(true)
    setActivationGuide(undefined)

    async function fetchActivationGuide() {
      try {
        const productDetail = await ProductService.getProductByHandleUncached(
          product.handle,
        )
        setActivationGuide(productDetail?.activationGuide ?? undefined)
      } catch (err) {
        // Activation guide is optional -- log so a real failure is visible,
        // but don't block the key reveal on it.
        console.error('Failed to load activation guide:', err)
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
                ) : isPending ? (
                  <div className="bg-secondary flex items-center justify-center rounded-xl p-4">
                    <p className="text-muted-foreground text-sm">
                      Your key is being prepared -- check back soon.
                    </p>
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
              revealDate={latestRevealedAt ?? null}
              activationGuide={activationGuide}
              guideLoading={guideLoading || loading}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
