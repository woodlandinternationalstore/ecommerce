/** "Make | Model | Generation | Chassis | 2018-2023 | Engine", one per line. */
export function parseCompat(text: string) {
  const out: { make: string; model: string; generation: string; chassis: string; from: number | null; to: number | null; engine: string }[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).forEach((line, i) => {
    const [make = "", model = "", generation = "", chassis = "", years = "", engine = ""] = line.split("|").map((s) => s.trim());
    if (!make || !model) return void errors.push(`Compatibility line ${i + 1}: make and model are required`);
    let from: number | null = null;
    let to: number | null = null;
    if (years) {
      const m = /^(\d{4})\s*(?:[-–]\s*(\d{4}))?$/.exec(years);
      if (!m) return void errors.push(`Compatibility line ${i + 1}: years must look like 2018 or 2018-2023`);
      from = Number(m[1]);
      to = m[2] ? Number(m[2]) : from;
    }
    out.push({ make, model, generation, chassis, from, to, engine });
  });
  return { rows: out, errors };
}
