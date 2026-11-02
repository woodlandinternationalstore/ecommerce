"use client";

import type { ReactNode } from "react";

/** GET form that re-submits when a select changes, so dependent dropdowns update. Works without JS via the Show button. */
export function AutoSubmitForm({ action, children, className }: { action: string; children: ReactNode; className?: string }) {
  return (
    <form
      action={action}
      method="get"
      className={className}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") (e.currentTarget as HTMLFormElement).requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
