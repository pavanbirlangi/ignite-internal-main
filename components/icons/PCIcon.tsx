// Solid monitor glyph, drawn to match the Xbox, PlayStation and Nintendo icons (same 28px grid,
// centred on y=14). The CMS navbar item for PC uses the same artwork.
export default function PCIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.5 3h19a3 3 0 0 1 3 3v10.5a3 3 0 0 1-3 3h-19a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm.8 2.6a1.2 1.2 0 0 0-1.2 1.2v8.9a1.2 1.2 0 0 0 1.2 1.2h17.4a1.2 1.2 0 0 0 1.2-1.2V6.8a1.2 1.2 0 0 0-1.2-1.2H5.3Z"
        fill="currentColor"
      />
      <path d="M11.2 19.5h5.6l.8 3.1H10.4l.8-3.1Z" fill="currentColor" />
      <rect
        x="7.5"
        y="22.6"
        width="13"
        height="2.4"
        rx="1.2"
        fill="currentColor"
      />
    </svg>
  )
}
