import React from 'react'

export const INPUT_CLASS =
    'bg-secondary placeholder:text-muted-foreground focus:border-primary h-[48px] rounded-[12px] border-transparent px-4 text-sm! font-bold! text-white/95 focus-visible:ring-0'

export function OrDivider() {
    return (
        <div className="mb-6 flex items-center gap-3">
            <span className="border-muted-foreground flex-1 border-t" />
            <span className="text-white/65 text-sm font-bold">OR</span>
            <span className="border-muted-foreground flex-1 border-t" />
        </div>
    )
}
