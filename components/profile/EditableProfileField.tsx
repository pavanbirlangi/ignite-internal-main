'use client'

import { useEffect, useState, ReactNode } from 'react'
import { ProfileField } from './ProfileField'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ACCOUNT_INPUT_CLASS,
  ACCOUNT_PRIMARY_BUTTON_CLASS,
  ACCOUNT_TEXT_BUTTON_CLASS,
} from '@/components/library/account-ui'

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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className={cn(ACCOUNT_TEXT_BUTTON_CLASS, 'h-10 px-3')}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            aria-busy={isSaving || undefined}
            className={cn(ACCOUNT_PRIMARY_BUTTON_CLASS, 'min-w-20')}
          >
            {isSaving ? <Loader2 className="animate-spin" /> : 'Save'}
          </button>
        </div>
      )
    } else {
      actionContent = (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className={ACCOUNT_TEXT_BUTTON_CLASS}
        >
          {value ? 'Edit' : 'Add'}
        </button>
      )
    }
  }

  const displayContent = renderDisplay ? (
    renderDisplay(value)
  ) : (
    <div className="relative">
      <p
        className={cn(
          'truncate text-sm! leading-5! font-medium',
          value ? 'text-white/95' : 'text-white/65',
        )}
      >
        {value || placeholder || 'Not added'}
      </p>
      {children}
    </div>
  )

  return (
    <ProfileField
      label={label}
      action={actionContent}
      className={className}
      stacked={isEditing}
    >
      {isEditing ? (
        <div className="pt-1">
          {renderEdit ? (
            renderEdit(tempValue, setTempValue)
          ) : (
            <input
              value={tempValue}
              onChange={(e) =>
                setTempValue(
                  transformValue ? transformValue(e.target.value) : e.target.value,
                )
              }
              placeholder={placeholder}
              className={ACCOUNT_INPUT_CLASS}
              inputMode={inputMode}
              maxLength={maxLength}
              autoFocus
            />
          )}
        </div>
      ) : (
        displayContent
      )}
    </ProfileField>
  )
}
