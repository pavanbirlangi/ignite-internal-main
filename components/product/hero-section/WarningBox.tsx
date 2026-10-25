import { AlertCircle } from 'lucide-react'

interface WarningBoxProps {
  warningText: string
  labels?: {
    importantNotice?: string
  }
}

// The admin's "Important notice" for a product, in the site's warning tone.
export default function WarningBox({ warningText, labels }: WarningBoxProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#F5A524]/25 bg-[#F5A524]/10 px-3.5 py-3 text-sm leading-5 text-[#F5A524]">
      <AlertCircle className="mt-px size-4.5 shrink-0" />
      <p className="leading-5!">
        <span className="font-bold">{labels?.importantNotice ?? 'Important notice:'}</span> {warningText}
      </p>
    </div>
  )
}
