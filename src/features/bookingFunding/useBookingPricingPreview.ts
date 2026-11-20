import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { previewBookingPricing } from "./api";
import type { BookingPricingPreview } from "./types";
export function useBookingPricingPreview(serviceId?: string, slotIds: string[] = []) {
  const key = useMemo(() => serviceId && slotIds.length ? `${serviceId}:${[...slotIds].sort().join(",")}` : "", [serviceId, slotIds]);
  const [preview, setPreview] = useState<BookingPricingPreview | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  useEffect(() => {
    let current = true;
    setPreview(null); setError(null);
    if (!key || !serviceId) { setLoading(false); return () => { current = false; }; }
    setLoading(true);
    void previewBookingPricing(serviceId, slotIds).then((value) => {
      if (current) setPreview(value);
    }).catch((failure: unknown) => {
      if (!current) return;
      const message = axios.isAxiosError(failure) && failure.response?.status === 400 && typeof failure.response.data?.message === "string"
        ? failure.response.data.message : "Could not check booking pricing and availability.";
      setError(message);
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [key]);
  return { preview, error, loading, selectionKey: key };
}
