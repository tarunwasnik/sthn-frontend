import type { BookingFunding } from "./types";

export function providerFundingLabel(state: NonNullable<BookingFunding["providerFunding"]>["state"], method?: string): string {
  const prefix = method === "INTERNAL" ? "Development simulator: " : "";
  switch (state) {
    case "PENDING": return `${prefix}provider payment awaiting confirmation`;
    case "CONFIRMED": return `${prefix}provider payment verified`;
    case "FAILED": return `${prefix}provider payment failed`;
    case "UNKNOWN": return `${prefix}provider payment unresolved; reconciliation required`;
    case "CANCELLED": return `${prefix}provider payment cancelled`;
    case "REFUNDED": return `${prefix}provider payment refunded`;
  }
}
