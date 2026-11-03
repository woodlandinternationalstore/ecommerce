import { describe, expect, it } from "vitest";
import { translate } from "../src/lib/i18n-core";
import { SW } from "../src/lib/sw";

describe("language", () => {
  it("translates to Swahili and falls back to English", () => {
    expect(translate("sw", "Order now")).toBe("Agiza sasa");
    expect(translate("en", "Order now")).toBe("Order now");
    expect(translate("sw", "Some text we never translated")).toBe("Some text we never translated");
  });
  it("fills in values", () => {
    expect(translate("sw", "Only {n} available", { n: 3 })).toBe("Vipo 3 tu");
    expect(translate("en", "Max {n}", { n: 5 })).toBe("Max 5");
  });
  it("keeps every placeholder from the English text", () => {
    for (const [en, sw] of Object.entries(SW)) {
      const keys = (s: string) => (s.match(/{w+}/g) ?? []).sort().join(",");
      expect(keys(sw), en).toBe(keys(en));
    }
  });
});
