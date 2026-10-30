/** The Devcore mark: a D whose bowl opens into a C around a live core. Matches app/icon.svg. */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className={className} fill="none">
      <path
        d="M8 5.5V26.5M8 5.5H15C21.3 5.5 25.8 9.1 26.3 13.2M8 26.5H15C21.3 26.5 25.8 22.9 26.3 18.8"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinecap="square"
      />
      <rect x="13.2" y="12.7" width="6.6" height="6.6" transform="rotate(45 16.5 16)" fill="var(--color-cyan)" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-display text-[0.9375rem] font-semibold tracking-[0.1em] [font-stretch:125%]">
      <LogoMark />
      <span className="max-[340px]:sr-only">DEVCORE</span>
    </span>
  );
}
