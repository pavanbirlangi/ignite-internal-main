import React from 'react'

export default function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={className}
      width="48"
      height="48"
      viewBox="0 0 48 48"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.3285 23.9997C10.3285 22.4754 10.5816 21.0141 11.0335 19.6434L3.12466 13.604C1.58328 16.7336 0.714844 20.26 0.714844 23.9997C0.714844 27.7362 1.58221 31.2605 3.12146 34.388L11.026 28.3368C10.5784 26.9725 10.3285 25.5165 10.3285 23.9997Z"
        fill="var(--google-yellow)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.2152 10.133C27.5265 10.133 30.5175 11.3064 32.8675 13.2264L39.7038 6.39971C35.5379 2.77304 30.197 0.533043 24.2152 0.533043C14.9284 0.533043 6.94695 5.84398 3.125 13.604L11.0338 19.6434C12.8561 14.1117 18.0507 10.133 24.2152 10.133Z"
        fill="var(--google-red)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.2152 37.8664C18.0507 37.8664 12.8561 33.8877 11.0338 28.356L3.125 34.3944C6.94695 42.1554 14.9284 47.4664 24.2152 47.4664C29.947 47.4664 35.4193 45.4312 39.5265 41.6178L32.0193 35.8141C29.9011 37.1485 27.2339 37.8664 24.2152 37.8664Z"
        fill="var(--google-green)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M46.6467 23.9997C46.6467 22.613 46.433 21.1197 46.1126 19.733H24.2148V28.7997H36.8194C36.1892 31.8909 34.4737 34.2674 32.019 35.8141L39.5262 41.6178C43.8405 37.6136 46.6467 31.6488 46.6467 23.9997Z"
        fill="var(--google-blue)"
      />
    </svg>
  )
}
