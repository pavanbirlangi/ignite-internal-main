import { AlertCircle } from 'lucide-react'

interface WarningBoxProps {
  warningText?: string
  labels?: {
    importantNotice?: string
    warningText?: string
  }
}

export default function WarningBox({ warningText, labels }: WarningBoxProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)]/80 px-4 py-2.5">
      <AlertCircle className="text-accent mt-0.5 shrink-0" size={20} />
      <p className="text-accent text-sm leading-relaxed">
        <span className="font-bold">
          {labels?.importantNotice ?? 'Important Notice:'}
        </span>{' '}
        {warningText ??
          labels?.warningText ??
          'Works with both the OLD and NEW Xbox accounts as long as there is no active subscription. The product is only available in countries where XBOX LIVE service is available. You cannot extend your current subscription with this product. To redeem your key, your current subscription must first expire.'}
      </p>
    </div>
  )
}
