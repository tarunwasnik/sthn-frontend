import type { CurrencyMetadataDto } from "../wallet/types";

export interface ParsedMinorAmount {
  amount?: number;
  error?: string;
}

/** Parses a user-entered major-unit string without floating-point arithmetic. */
export function parseMajorAmount(
  value: string,
  minorUnits: number,
): ParsedMinorAmount {
  const trimmed = value.trim();
  if (!trimmed) return { error: "Enter an amount." };
  const match = /^(\d+)(?:\.(\d*))?$/.exec(trimmed);
  if (!match) return { error: "Enter a positive amount using digits only." };

  const whole = match[1];
  const fraction = match[2] ?? "";
  if (fraction.length > minorUnits) {
    return {
      error: minorUnits === 0
        ? "This currency does not support decimal amounts."
        : `Use no more than ${minorUnits} decimal place${minorUnits === 1 ? "" : "s"}.`,
    };
  }

  const combined = `${whole}${fraction.padEnd(minorUnits, "0")}`.replace(
    /^0+(?=\d)/,
    "",
  );
  const amount = Number(combined);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    return { error: "Enter an amount greater than zero." };
  }
  return { amount };
}

/** Display-only formatter; it never converts, totals, or changes money. */
export function formatMinorAmount(
  amount: number,
  currency: string,
  metadata?: CurrencyMetadataDto,
): string {
  const fallbackFractionDigits = new Intl.NumberFormat(undefined, { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
  const minorUnits = metadata?.minorUnits ?? fallbackFractionDigits;
  const value = Math.abs(amount) / 10 ** minorUnits;
  const display = value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: minorUnits });
  if (metadata?.symbol) return `${amount < 0 ? "-" : ""}${metadata.symbol}${display}`;
  return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: minorUnits }).format(amount / 10 ** minorUnits);
}
