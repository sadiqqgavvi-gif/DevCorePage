import { CHAPTERS, SITE } from "@/lib/content";
import { Logo } from "@/components/ui/Logo";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-ink-950 pb-1">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm text-muted">
            A software engineering and AI agency building intelligent software and digital products.
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="label">explore</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 text-sm">
            {CHAPTERS.filter((item) => item.id !== "top").map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="inline-flex min-h-11 items-center capitalize text-muted underline-offset-4 transition-colors hover:text-paper hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="label">contact</h2>
          <a
            href={`mailto:${SITE.email}`}
            className="mt-3 inline-flex min-h-11 items-center text-sm text-paper underline-offset-4 hover:underline"
          >
            {SITE.email}
          </a>
        </div>
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-4 font-mono text-xs text-faint">
        <span>© 2026 Devcore</span>
        <a href="#top" className="inline-flex min-h-11 items-center transition-colors hover:text-paper">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
