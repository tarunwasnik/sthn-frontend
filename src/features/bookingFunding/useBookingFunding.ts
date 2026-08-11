import { useEffect, useState } from "react";
import { getBookingFunding } from "./api";
import type { BookingFunding } from "./types";
export function useBookingFunding(bookingId?: string) { const [funding, setFunding] = useState<BookingFunding | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false); const refresh = async () => { if (!bookingId) return; setLoading(true); try { setFunding(await getBookingFunding(bookingId)); setError(null); } catch { setError("Funding details are unavailable."); } finally { setLoading(false); } }; useEffect(() => { void refresh(); }, [bookingId]); return { funding, error, loading, refresh }; }
