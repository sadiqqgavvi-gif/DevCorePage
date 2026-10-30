const VEINS = [
  "M18 40C30 28 44 48 56 34S78 30 84 44",
  "M14 58C28 66 38 50 52 60S74 72 86 58",
  "M28 22C36 36 26 50 38 62S42 78 34 84",
  "M66 18C58 34 70 46 60 60S58 78 68 84",
  "M22 74C36 70 48 80 62 72S76 66 82 72",
];

/** CSS and SVG core: the stand-in for the 3D sphere when WebGL is unavailable or too slow. */
export function CoreVisual({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`core-visual ${className}`}>
      <span className="core-ring core-ring-b" />
      <span className="core-ring core-ring-c" />
      <span className="core-ring core-ring-a" />
      <span className="core-sphere" />
      <svg viewBox="0 0 100 100" className="core-veins core-veins-a" fill="none">
        {VEINS.map((d) => (
          <path key={d} d={d} stroke="#7fb4ff" strokeWidth=".9" strokeLinecap="round" />
        ))}
      </svg>
      <svg viewBox="0 0 100 100" className="core-veins core-veins-b" fill="none">
        {VEINS.map((d) => (
          <path key={d} d={d} stroke="#a58bff" strokeWidth=".6" strokeLinecap="round" />
        ))}
      </svg>
    </div>
  );
}
