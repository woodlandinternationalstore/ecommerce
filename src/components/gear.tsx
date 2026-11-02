/** Decorative SVG gear. Pure geometry, no assets. */
function gearPath(teeth: number, outer: number, inner: number, hole: number) {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const p = (r: number, off: number) => `${(50 + r * Math.cos(a + off)).toFixed(2)},${(50 + r * Math.sin(a + off)).toFixed(2)}`;
    pts.push(p(inner, 0), p(outer, step * 0.18), p(outer, step * 0.42), p(inner, step * 0.6));
  }
  const ring = `M${pts.join(" L")} Z`;
  const circle = `M${50 + hole},50 a${hole},${hole} 0 1,0 ${-hole * 2},0 a${hole},${hole} 0 1,0 ${hole * 2},0 Z`;
  return `${ring} ${circle}`;
}

export function Gear({
  teeth = 12, className = "", fill = "currentColor", opacity = 1,
}: { teeth?: number; className?: string; fill?: string; opacity?: number }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path d={gearPath(teeth, 48, 39, 14)} fill={fill} fillRule="evenodd" opacity={opacity} />
    </svg>
  );
}
