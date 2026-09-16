import PCIcon from '@/components/icons/PCIcon'
import PlayStationIcon from '@/components/icons/PlayStationIcon'
import XboxIcon from '@/components/icons/XboxIcon'
import NintendoIcon from '@/components/icons/NintendoIcon'
import SteamIcon from '@/components/icons/SteamIcon'

// Product cards show a small store/platform badge (Steam, Xbox, etc.) --
// there's no backend field for it (see MEDUSA_MIGRATION_BACKEND_REQUIREMENTS.md
// R-28), it's meant to be derived client-side from the product's real
// `platform` metadata instead, matching that item's own suggested resolution.
// Each case renders its icon as a static JSX tag (not a variable holding a
// component reference) so eslint's react-hooks/static-components rule can
// verify nothing is being created fresh on every render -- extend this with
// one more `case` (plus one more icon import) whenever a product uses a
// platform not listed here yet.
export function PlatformBadge({
  platform,
  title,
}: {
  platform?: string | null
  title?: string
}) {
  const wrapperClassName =
    'bg-black/60 flex h-8 w-8 items-center justify-center rounded-lg text-white backdrop-blur-sm [&>svg]:h-4.5 [&>svg]:w-4.5'

  switch (platform?.trim().toLowerCase()) {
    case 'steam':
      return (
        <div title={title} className={wrapperClassName}>
          <SteamIcon />
        </div>
      )
    case 'pc':
    case 'windows':
      return (
        <div title={title} className={wrapperClassName}>
          <PCIcon />
        </div>
      )
    case 'playstation':
    case 'ps4':
    case 'ps5':
      return (
        <div title={title} className={wrapperClassName}>
          <PlayStationIcon />
        </div>
      )
    case 'xbox':
      return (
        <div title={title} className={wrapperClassName}>
          <XboxIcon />
        </div>
      )
    case 'nintendo':
    case 'switch':
      return (
        <div title={title} className={wrapperClassName}>
          <NintendoIcon />
        </div>
      )
    default:
      return null
  }
}
