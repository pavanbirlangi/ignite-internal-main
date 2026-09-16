export default function SteamIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle
        cx="11.5"
        cy="17"
        r="8.16667"
        stroke="currentColor"
        strokeWidth="2.16667"
      />
      <circle
        cx="19"
        cy="9.5"
        r="3.5"
        stroke="currentColor"
        strokeWidth="2.16667"
      />
      <circle cx="17.1" cy="11.2" r="1.4" fill="currentColor" />
      <path
        d="M13.6 14.6L16.5 11.8"
        stroke="currentColor"
        strokeWidth="2.16667"
        strokeLinecap="round"
      />
    </svg>
  )
}
