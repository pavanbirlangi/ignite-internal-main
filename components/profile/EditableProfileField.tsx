'use client'

import { useEffect, useState, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProfileField } from './ProfileField'
import { Loader2 } from 'lucide-react'

interface EditableProfileFieldProps {
  label: string
  value?: string
  onSave?: (newValue: string) => Promise<void>
  readOnly?: boolean
  placeholder?: string
  customAction?: ReactNode
  className?: string
  renderDisplay?: (value: string) => ReactNode
  children?: ReactNode
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  maxLength?: number
  transformValue?: (value: string) => string
  renderEdit?: (value: string, onChange: (value: string) => void) => ReactNode
}

export function EditableProfileField({
  label,
  value = '',
  onSave,
  readOnly = false,
  placeholder,
  customAction,
  className,
  renderDisplay,
  children,
  inputMode,
  maxLength,
  transformValue,
  renderEdit,
}: EditableProfileFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [tempValue, setTempValue] = useState(value)

  useEffect(() => {
    setTempValue(value)
  }, [value])

  const handleSave = async () => {
    if (!onSave) return
    try {
      setIsSaving(true)
      await onSave(tempValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  // Determine the action button(s)
  let actionContent: ReactNode = null

  if (customAction) {
    actionContent = customAction
  } else if (!readOnly && onSave) {
    if (isEditing) {
      actionContent = (
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 rounded-[6px] text-base font-semibold sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="w-full flex-1 rounded-[6px] text-base font-semibold sm:w-44"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      )
    } else {
      actionContent = (
        <Button
          variant="secondary"
          className="w-full rounded-[6px] text-base font-semibold sm:w-44"
          onClick={() => setIsEditing(true)}
        >
          Update
        </Button>
      )
    }
  } else if (readOnly && customAction) {
    actionContent = customAction
  }

  const displayContent = renderDisplay ? (
    renderDisplay(value)
  ) : (
    <div className="relative w-full">
      <Input
        value={value}
        readOnly
        placeholder={placeholder || '--'}
        className="bg-secondary text-muted-foreground cursor-default rounded-[6px] border-none py-3.5 pr-8 text-xs! font-medium"
      />
      {children}
    </div>
  )

  return (
    <ProfileField label={label} action={actionContent} className={className}>
      {isEditing ? (
        renderEdit ? (
          renderEdit(tempValue, setTempValue)
        ) : (
          <Input
            value={tempValue}
            onChange={(e) =>
              setTempValue(
                transformValue ? transformValue(e.target.value) : e.target.value,
              )
            }
            placeholder={placeholder}
            className="bg-secondary rounded-[6px] border-none text-xs! font-medium"
            inputMode={inputMode}
            maxLength={maxLength}
            autoFocus
          />
        )
      ) : (
        displayContent
      )}
    </ProfileField>
  )
}
