import type { CurrencyMetadataDto } from "../wallet/types";
export const formatBookingMoney = (amount: number, currency: string, metadata: CurrencyMetadataDto[]) => {
  const item = metadata.find((entry) => entry.code === currency);
  const minorUnits = item?.minorUnits ?? 0;
  return new Intl.NumberFormat(undefined, { style: "currency", currency, minimumFractionDigits: minorUnits, maximumFractionDigits: minorUnits }).format(amount / 10 ** minorUnits);
};

/** Formats a creator-facing booked service price already expressed in major units. */
export const formatMajorUnitBookingMoney = (amount: number, currency: string, metadata: CurrencyMetadataDto[]) => {
  const item = metadata.find((entry) => entry.code === currency);
  const fractionDigits = item ? {
    minimumFractionDigits: item.minorUnits,
    maximumFractionDigits: item.minorUnits,
  } : {};
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    ...fractionDigits,
  }).format(amount);
};
