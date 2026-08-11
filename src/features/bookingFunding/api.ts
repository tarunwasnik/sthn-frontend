import api from "../../api/axios";
import type { BookingFunding, BookingPricingPreview } from "./types";
export const previewBookingPricing = async (serviceId: string, slotIds: string[]) => (await api.post<{ preview: BookingPricingPreview }>("/v1/bookings/pricing-preview", { serviceId, slotIds })).data.preview;
export const getBookingFunding = async (bookingId: string) => (await api.get<{ funding: BookingFunding }>(`/v1/bookings/${bookingId}/funding`)).data.funding;
