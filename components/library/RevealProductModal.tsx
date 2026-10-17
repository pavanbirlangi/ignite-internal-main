'use client'

import * as React from 'react'
import { Clock, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { ProductHeader } from './reveal-product-modal/ProductHeader'
import { KeyList } from './reveal-product-modal/KeyList'
import { KeyHelpLine, ModalFooter } from './reveal-product-modal/ModalFooter'
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
    { guide?: string; name: string; icon?: string | null; link?: string | null } | undefined
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
        // Only this product's keys: asking for the whole order would reveal every product's key.
        const data = await keysService.getOrderKeys(product.orderId, {
          variantId: product.variantId || undefined,
        })
        if (!cancelled) {
          // Still filtered here, so an older backend answering with the whole order is harmless.
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

  // A refunded assignment is a key the admin revoked: never show it, even if a key comes back.
  const activeAssignments = assignments.filter((a) => a.status !== 'refunded')
  const isRevoked = assignments.length > 0 && activeAssignments.length === 0
  const pendingCount = activeAssignments.filter((a) => a.status === 'pending_manual').length
  const isPending =
    activeAssignments.length > 0 && pendingCount === activeAssignments.length
  const keys = activeAssignments.map((a) => a.key).filter((k): k is string => !!k)
  const latestRevealedAt = activeAssignments.find((a) => a.revealedAt)?.revealedAt

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

  const noticeClass = 'bg-background border-border flex items-center gap-3 rounded-xl border p-4'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="bg-card border-border max-h-[92vh] w-full gap-0 overflow-hidden rounded-2xl border p-0 text-white/95 shadow-2xl outline-none sm:max-w-150"
      >
        <div className="flex max-h-[calc(92vh-2px)] flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <DialogHeader className="border-border flex flex-row items-center justify-between space-y-0 border-b px-6 py-4 text-left">
            <DialogTitle className="text-xl font-bold">Your key</DialogTitle>
            <DialogClose
              aria-label="Close"
              className="grid size-9 cursor-pointer place-items-center rounded-full bg-white/5 text-white/65 transition-colors outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="size-4.5" />
            </DialogClose>
          </DialogHeader>

          <div className="flex flex-col gap-6 p-6">
            <ProductHeader
              product={product}
              activationGuide={activationGuide}
              guideLoading={guideLoading}
            />

            <div>
              {loading ? (
                <div className="flex flex-col gap-2">
                  <div className="bg-secondary h-4 w-24 animate-pulse rounded" />
                  <div className="bg-secondary h-13 animate-pulse rounded-[10px]" />
                </div>
              ) : error ? (
                <div className="border-red/30 bg-red/10 rounded-xl border p-4">
                  <p className="text-sm text-[#FF6B76]">{error}</p>
                </div>
              ) : isRevoked ? (
                <div className={noticeClass}>
                  <p className="text-sm text-white/65">
                    This key was revoked because the order was refunded.
                  </p>
                </div>
              ) : isPending ? (
                <PendingNotice title="Your key is being prepared" />
              ) : keys.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <KeyList keys={keys} />
                  {pendingCount > 0 && (
                    <PendingNotice
                      title={
                        pendingCount === 1
                          ? '1 more key is being prepared'
                          : `${pendingCount} more keys are being prepared`
                      }
                    />
                  )}
                </div>
              ) : (
                <div className={noticeClass}>
                  <p className="text-sm text-white/65">No keys available for this product.</p>
                </div>
              )}
            </div>

            <ModalFooter
              revealDate={latestRevealedAt ?? null}
              activationGuide={activationGuide}
              guideLoading={guideLoading || loading}
            />
          </div>

          <div className="border-border border-t px-6 py-4">
            <KeyHelpLine />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Amber clock notice for keys our team still has to hand out.
function PendingNotice({ title }: { title: string }) {
  return (
    <div className="bg-background border-border flex items-center gap-3 rounded-xl border p-4">
      <Clock className="size-5.5 shrink-0 text-[#F5A524]" />
      <div>
        <p className="text-sm font-bold text-white/95">{title}</p>
        <p className="text-sm! leading-5! text-white/65">
          It appears here as soon as it&apos;s ready. Check back soon.
        </p>
      </div>
    </div>
  )
}
