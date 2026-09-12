'use client'

import type { ChooseIssueTypeProps } from '@/types/HelpTypes'

export function ChooseIssueType({
  categories,
  onSelectCategory,
}: ChooseIssueTypeProps) {
  return (
    <div className="mx-auto w-full max-w-[780px]">
      <div className="border-border bg-secondary/40 w-full rounded-[20px] border p-6 md:p-10">
        {/* Header */}
        <h1 className="mb-1 text-xl font-semibold text-white md:text-[28px]">
          Choose the type of issue
        </h1>
        <p className="text-muted-foreground font-medium text-sm">
          What kind of issue are you experiencing?
        </p>

        <span className="border-secondary my-6 block h-[1px] w-full border-b"></span>

        {/* 2x2 Grid of Issue Categories */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category)}
              className="bg-secondary hover:bg-secondary/60 flex cursor-pointer items-start gap-4 rounded-[6px] p-4 text-left transition-colors md:p-8"
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {typeof category.icon === 'string' ? (
                  <div dangerouslySetInnerHTML={{ __html: category.icon }} />
                ) : (
                  category.icon
                )}
              </div>

              {/* Text */}
              <div>
                <h3 className="mb-1 text-sm font-semibold text-white md:text-[18px]">
                  {category.title}
                </h3>
                <p className="text-muted-foreground font-medium text-xs leading-relaxed">
                  {category.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
