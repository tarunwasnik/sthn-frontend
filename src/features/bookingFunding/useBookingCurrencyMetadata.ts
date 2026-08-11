import { useEffect, useState } from "react";
import { getSupportedCurrencies } from "../wallet/api";
import type { CurrencyMetadataDto } from "../wallet/types";
export function useBookingCurrencyMetadata() { const [currencies, setCurrencies] = useState<CurrencyMetadataDto[]>([]); useEffect(() => { void getSupportedCurrencies().then(setCurrencies).catch(() => undefined); }, []); return currencies; }
