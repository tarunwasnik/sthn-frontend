import { getActiveDisplayTimeZone } from "./displayTimeZone";

const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const getBookingDisplayTimeZone = () => (getActiveDisplayTimeZone() ?? localTimeZone) || "your local timezone";

export const formatBookingLocalDateTime = (value: string | Date) =>
  new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: getActiveDisplayTimeZone(),
  }).format(new Date(value));

export const formatBookingLocalTime = (value: string | Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: getActiveDisplayTimeZone(),
  }).format(new Date(value));
