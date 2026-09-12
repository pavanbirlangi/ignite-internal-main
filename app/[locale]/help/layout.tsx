export default function HelpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[60vh] border-t border-muted-foreground/40 md:mt-6 mt-2">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-10 md:py-16">
        {children}
      </div>
    </div>
  )
}
