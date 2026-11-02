"use client";

export function PrintButton() {
  return <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print summary</button>;
}
