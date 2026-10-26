// Each Help Centre page sets its own container (as the activation guides do).
export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[60vh]">{children}</div>
}
