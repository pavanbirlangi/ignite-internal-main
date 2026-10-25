// Opens the header's search (desktop panel or phone overlay) from anywhere on the page, e.g. the
// 404 page's search box. The Navbar listens for this event.
export const OPEN_SEARCH_EVENT = 'increddy:open-search'

export function openSiteSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))
}
