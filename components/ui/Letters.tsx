/**
 * Splits text into letters for GSAP to light up (target `.letter`). Letters sit inside a whole word,
 * so lines only ever break between words. Screen readers get the plain sentence.
 * Inside a `data-letters` element, Providers ties the reveal to that element's section.
 */
export function Letters({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text.split(" ").map((word, index) => (
          <span key={`${word}-${index}`}>
            <span className="inline-block">
              {Array.from(word).map((letter, position) => (
                <span key={position} className="letter">
                  {letter}
                </span>
              ))}
            </span>{" "}
          </span>
        ))}
      </span>
    </>
  );
}
