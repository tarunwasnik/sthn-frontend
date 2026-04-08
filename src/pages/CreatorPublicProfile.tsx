// frontend/src/pages/CreatorPublicProfile.tsx

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchCreatorProfile } from "../api/public";
import api from "../api/axios";
import type { CreatorPublicProfileDTO } from "../api/public";
import StarRating from "../components/StarRating";

/* ================= TYPES ================= */

interface Slot {
  id: string;
  serviceId: string;
  price: number;
  startTime: string;
  endTime: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  price: number;
}

interface Review {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewerId?: {
    displayName?: string;
    avatarUrl?: string;
  };
}

/* ================= COMPONENT ================= */

export default function CreatorPublicProfile() {
  const { slug } = useParams<{ slug: string }>();

  const [data, setData] = useState<CreatorPublicProfileDTO | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [reportedReviews, setReportedReviews] = useState<string[]>([]);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  const LIMIT = 5;

  /* ================= FETCH PROFILE ================= */

  useEffect(() => {
    if (!slug) return;

    fetchCreatorProfile(slug).then((res) => {
      setData(res);
      if (res?.id) {
        fetchReviews(res.id, 1, true);
      }
    });
  }, [slug]);

  /* ================= FETCH REVIEWS ================= */

  const fetchReviews = async (
    creatorId: string,
    page: number,
    initial = false
  ) => {
    try {
      if (initial) setLoadingReviews(true);
      else setLoadingMore(true);

      const res = await api.get(
        `/api/v1/reviews/creator/${creatorId}`,
        { params: { page, limit: LIMIT } }
      );

      const newReviews = res.data.reviews || [];
      const pagination = res.data.pagination;

      setReviews((prev) =>
        page === 1 ? newReviews : [...prev, ...newReviews]
      );

      setHasMore(page < pagination.totalPages);
      setCurrentPage(page);
    } catch (err) {
      setHasMore(false);
    } finally {
      setLoadingReviews(false);
      setLoadingMore(false);
    }
  };

  /* ================= INFINITE SCROLL ================= */

  const lastReviewRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore || loadingReviews) return;

      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && data?.id) {
          fetchReviews(data.id, currentPage + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loadingMore, loadingReviews, hasMore, currentPage, data?.id]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  /* ================= SLOTS ================= */

  const fetchSlots = async (date: string) => {
    try {
      if (!slug) return;

      const res = await api.get(`/public/creators/${slug}/slots`, {
        params: { date },
      });

      setSlots(res.data.slots || []);
      setSelectedSlots([]);
    } catch {
      setSlots([]);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!data) return <div className="p-8">Loading...</div>;

  const services = data.services || [];

  /* ================= SLOT LOGIC ================= */

  const toggleSlot = (slotId: string) => {
    const clickedSlot = slots.find((s) => s.id === slotId);
    if (!clickedSlot || !selectedService) return;

    if (clickedSlot.serviceId !== selectedService.id) return;

    let updated = [...selectedSlots];

    if (updated.includes(slotId)) {
      updated = updated.filter((id) => id !== slotId);
    } else {
      updated.push(slotId);
    }

    setSelectedSlots(updated);
  };

  const totalPrice = selectedSlots.length
    ? slots
        .filter((s) => selectedSlots.includes(s.id))
        .reduce((sum, s) => sum + s.price, 0)
    : 0;

  const handleBooking = async () => {
    if (!selectedService || selectedSlots.length === 0) return;

    try {
      setLoadingBooking(true);

      await api.post("/v1/bookings/request", {
        serviceId: selectedService.id,
        slotIds: selectedSlots,
      });

      alert("Booking request sent successfully.");
      setSelectedSlots([]);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Booking failed");
    } finally {
      setLoadingBooking(false);
    }
  };

  /* =========================
     UI (UNCHANGED)
  ========================= */

 /* ================= RATING BREAKDOWN ================= */

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const totalReviews = reviews.length || 1;

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 space-y-10">

      {/* ================= HEADER ================= */}
      <div className="flex gap-6 items-start border-b border-gray-800 pb-8">

        <img
          src={data.avatarUrl ?? "/avatars/default.png"}
          className="w-24 h-24 rounded-full object-cover border border-gray-700"
        />

        <div className="space-y-3">

          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{data.displayName}</h1>
            {data.age && (
              <span className="text-sm text-gray-400">
                {data.age} yrs
              </span>
            )}
          </div>

          <div className="text-sm text-gray-400">
            {data.city}, {data.country}
          </div>

          {data.reviewCount === 0 ? (
            <div className="text-sm text-gray-400">
              No reviews yet
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(data.rating ?? 0)} readonly />
              <span>{(data.rating ?? 0).toFixed(1)}</span>
              <span className="text-gray-400">
                ({data.reviewCount} reviews)
              </span>
            </div>
          )}

          {data.bio && (
            <p className="text-gray-300 max-w-xl">
              {data.bio}
            </p>
          )}
        </div>
      </div>

      {/* ================= MAIN ================= */}
      <div className="grid grid-cols-3 gap-12">

        {/* LEFT */}
        <div className="col-span-2 space-y-10">

          {/* EXPERIENCES */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Available Experiences
            </h2>

            <div className="space-y-4">
              {services.map((service) => {
                const selected = selectedService?.id === service.id;

                return (
                  <div
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setSelectedSlots([]);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border ${
                      selected
                        ? "border-blue-500 bg-gray-800"
                        : "border-gray-800 bg-gray-900 hover:border-gray-600"
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {service.title}
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {service.description}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-bold">
                          {data.currency} {service.price}
                        </div>
                        <div className="text-xs text-gray-500">
                          {service.durationMinutes} min
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REVIEWS */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Reviews & Ratings
            </h2>

            {reviews.length > 0 && (
              <div className="bg-gray-900 p-5 rounded-xl mb-6">
                {ratingCounts.map(({ star, count }) => {
                  const percent = (count / totalReviews) * 100;

                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-6">{star}★</span>
                      <div className="flex-1 bg-gray-800 h-2 rounded">
                        <div
                          className="bg-yellow-400 h-2 rounded"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span>{Math.round(percent)}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT BOOKING */}
        <div className="sticky top-24 h-fit bg-gray-900 p-6 rounded-2xl border border-gray-800 space-y-6">

          {!selectedService ? (
            <div className="text-sm text-gray-400">
              Select an experience to continue booking.
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {data.currency} {totalPrice || selectedService.price}
                <span className="text-sm text-gray-400 ml-2">
                  / {selectedService.durationMinutes} min
                </span>
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedDate(value);
                  fetchSlots(value);
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2"
              />

              {slots.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => toggleSlot(slot.id)}
                      className={`border rounded-lg p-2 text-sm ${
                        selectedSlots.includes(slot.id)
                          ? "bg-blue-600 border-blue-500"
                          : "bg-gray-800 border-gray-700 hover:border-blue-500"
                      }`}
                    >
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </button>
                  ))}
                </div>
              ) : (
                selectedDate && (
                  <div className="text-sm text-gray-500">
                    No slots available for this date
                  </div>
                )
              )}

              {selectedSlots.length > 0 && (
                <div className="border-t border-gray-700 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Price</span>
                    <span>{data.currency} {totalPrice}</span>
                  </div>

                  <button
                    disabled={loadingBooking}
                    onClick={handleBooking}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl disabled:opacity-50"
                  >
                    {loadingBooking ? "Processing..." : "Book Experience"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}