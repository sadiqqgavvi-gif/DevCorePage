import type { ServiceIcon as IconName } from "@/lib/content";

const PATHS: Record<IconName, React.ReactNode> = {
  ai: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="20" cy="6" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
      <circle cx="20" cy="18" r="1.5" />
      <path d="M5.3 6.8 9.4 10.4M18.7 6.8l-4.1 3.6M5.3 17.2l4.1-3.6M18.7 17.2l-4.1-3.6" />
    </>
  ),
  software: <path d="m8 6-6 6 6 6M16 6l6 6-6 6M13.5 4l-3 16" />,
  apps: (
    <>
      <rect x="2" y="4" width="15" height="12" rx="2" />
      <rect x="15" y="9" width="7" height="12" rx="1.5" fill="var(--card-fill, #14161a)" />
      <path d="M6 20h6M9 16v4" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 18a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.5 1.3A3.9 3.9 0 0 1 17 18Z" />
      <path d="M12 21v-7m-2.5 2.5L12 14l2.5 2.5" />
    </>
  ),
  design: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M3 9h18M9 21V9" />
    </>
  ),
  automation: (
    <>
      <path d="M20 8a8.5 8.5 0 0 0-15-2L3 8m0-5v5h5" />
      <path d="M4 16a8.5 8.5 0 0 0 15 2l2-2m0 5v-5h-5" />
    </>
  ),
};

export function ServiceIcon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-7 text-cyan"
    >
      {PATHS[name]}
    </svg>
  );
}
