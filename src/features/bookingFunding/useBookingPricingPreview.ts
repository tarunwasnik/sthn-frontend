import { useEffect, useMemo, useState } from "react";
import { previewBookingPricing } from "./api";
import type { BookingPricingPreview } from "./types";
export function useBookingPricingPreview(serviceId?: string, slotIds: string[] = []) {
  const key = useMemo(() => serviceId && slotIds.length ? `${serviceId}:${[...slotIds].sort().join(",")}` : "", [serviceId, slotIds]);
  const [preview, setPreview] = useState<BookingPricingPreview | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  const refresh = async () => { if (!key || !serviceId) return; setLoading(true); setError(null); setPreview(null); try { setPreview(await previewBookingPricing(serviceId, slotIds)); } catch { setError("Could not check booking pricing and Wallet availability."); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, [key]);
  return { preview, error, loading, refresh, selectionKey: key };
}
