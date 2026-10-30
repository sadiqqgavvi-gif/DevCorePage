/**
 * Renders lines as masked words for GSAP to animate (target `.sw-word`).
 * Screen readers get the plain sentence; the split markup is hidden from them.
 * `accent` words share one gradient, split across them so it reads as a single sweep.
 */
export function SplitWords({
  lines,
  accent = [],
  wordClassName = "",
}: {
  lines: string[];
  accent?: string[];
  wordClassName?: string;
}) {
  const accentClass = (word: string) => {
    const position = accent.indexOf(word);
    if (position < 0) return "";
    if (accent.length === 1) return "accent-text";
    return position === 0 ? "accent-text-start" : "accent-text-end";
  };

  return (
    <>
      <span className="sr-only">{lines.join(" ")}</span>
      <span aria-hidden>
        {lines.map((line) => (
          <span key={line} className="sw-line">
            {line.split(" ").map((word, index) => (
              <span key={`${word}-${index}`}>
                <span className="sw-mask">
                  <span className={`sw-word ${wordClassName} ${accentClass(word)}`}>{word}</span>
                </span>{" "}
              </span>
            ))}
          </span>
        ))}
      </span>
    </>
  );
}
