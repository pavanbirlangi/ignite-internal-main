// The round glass buttons on the right of the header (account, cart): the same glass as the
// platform pill, brightening with a blue glow on hover while the icon lifts.
export const headerIconButtonClass = [
  'relative flex size-11 shrink-0 items-center justify-center rounded-full text-white',
  'bg-background/60 border border-white/10 shadow-lg backdrop-blur-2xl',
  'transition-[background-color,border-color,box-shadow,scale] duration-200 ease-out',
  'hover:border-white/20 hover:bg-white/10 hover:shadow-[0_8px_24px_-8px_rgba(36,104,223,0.75)]',
  'focus-visible:ring-primary/70 focus:outline-none focus-visible:ring-2 active:scale-95',
  '[&_svg]:size-6 [&_svg]:transition-transform [&_svg]:duration-300 [&_svg]:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
  'hover:[&_svg]:-translate-y-0.5 hover:[&_svg]:scale-105',
  'motion-reduce:transition-none motion-reduce:[&_svg]:transition-none',
].join(' ')
