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
  media?: string[];
  thumbnailUrl?: string | null;
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

  const [data, setData] =
    useState<CreatorPublicProfileDTO | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [selectedSlots, setSelectedSlots] =
    useState<string[]>([]);

  const [loadingBooking, setLoadingBooking] =
    useState(false);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [loadingReviews, setLoadingReviews] =
    useState(true);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [hasMore, setHasMore] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const observerRef =
    useRef<IntersectionObserver | null>(null);

  const LIMIT = 5;

  /* ================= GLOBAL IMAGE PREVIEW ================= */

  const [previewImage, setPreviewImage] =
    useState<string | null>(null);

  const openPreview = (image: string) => {
    setPreviewImage(image);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

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

      if (initial) {
        setLoadingReviews(true);
      } else {
        setLoadingMore(true);
      }

      const res = await api.get(
        `/api/v1/reviews/creator/${creatorId}`,
        {
          params: {
            page,
            limit: LIMIT,
          },
        }
      );

      const newReviews =
        res.data.reviews || [];

      const pagination =
        res.data.pagination;

      setReviews((prev) =>
        page === 1
          ? newReviews
          : [...prev, ...newReviews]
      );

      setHasMore(
        page < pagination.totalPages
      );

      setCurrentPage(page);

    } catch {

      setHasMore(false);

    } finally {

      setLoadingReviews(false);
      setLoadingMore(false);

    }

  };

  /* ================= INFINITE SCROLL ================= */

  const lastReviewRef = useCallback(
    (node: HTMLDivElement | null) => {

      if (
        loadingMore ||
        loadingReviews
      ) {
        return;
      }

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current =
        new IntersectionObserver((entries) => {

          if (
            entries[0].isIntersecting &&
            hasMore &&
            data?.id
          ) {
            fetchReviews(
              data.id,
              currentPage + 1
            );
          }

        });

      if (node) {
        observerRef.current.observe(node);
      }

    },
    [
      loadingMore,
      loadingReviews,
      hasMore,
      currentPage,
      data?.id,
    ]
  );

  useEffect(() => {
    return () =>
      observerRef.current?.disconnect();
  }, []);

  /* ================= FETCH SLOTS ================= */

  const fetchSlots = async (
    date: string
  ) => {

    try {

      if (!slug) return;

      const res = await api.get(
        `/public/creators/${slug}/slots`,
        {
          params: { date },
        }
      );

      setSlots(
        res.data.slots || []
      );

      setSelectedSlots([]);

    } catch {

      setSlots([]);

    }

  };

  /* ================= HELPERS ================= */

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  if (!data) {

    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        Loading...
      </div>
    );

  }

  const services =
    data.services || [];

  const galleryImages =
    (data.media || []).slice(0, 6);

  /* ================= SLOT LOGIC ================= */

  const toggleSlot = (
    slotId: string
  ) => {

    const clickedSlot =
      slots.find(
        (s) => s.id === slotId
      );

    if (
      !clickedSlot ||
      !selectedService
    ) {
      return;
    }

    if (
      clickedSlot.serviceId !==
      selectedService.id
    ) {
      return;
    }

    let updated = [
      ...selectedSlots,
    ];

    if (
      updated.includes(slotId)
    ) {

      updated = updated.filter(
        (id) => id !== slotId
      );

    } else {

      updated.push(slotId);

    }

    setSelectedSlots(updated);

  };

  const totalPrice =
    selectedSlots.length
      ? slots
          .filter((s) =>
            selectedSlots.includes(
              s.id
            )
          )
          .reduce(
            (sum, s) =>
              sum + s.price,
            0
          )
      : 0;

  /* ================= BOOKING ================= */

  const handleBooking =
    async () => {

      if (
        !selectedService ||
        selectedSlots.length === 0
      ) {
        return;
      }

      try {

        setLoadingBooking(true);

        await api.post(
          "/v1/bookings/request",
          {
            serviceId:
              selectedService.id,
            slotIds:
              selectedSlots,
          }
        );

        alert(
          "Booking request sent successfully."
        );

        setSelectedSlots([]);

      } catch (err: any) {

        alert(
          err?.response?.data
            ?.message ||
            "Booking failed"
        );

      } finally {

        setLoadingBooking(false);

      }

    };

  /* ================= RATING BREAKDOWN ================= */

  const ratingCounts =
    [5, 4, 3, 2, 1].map(
      (star) => ({
        star,
        count: reviews.filter(
          (r) =>
            r.rating === star
        ).length,
      })
    );

  const totalReviews =
    reviews.length || 1;

return (
  <div className="min-h-screen bg-[#050505] text-white">

    {/* ================= IMAGE PREVIEW MODAL ================= */}

    {previewImage && (

      <div
        className="
          fixed inset-0 z-[999]
          bg-black/95
          backdrop-blur-xl
          flex items-center justify-center
          p-4
        "
        onClick={closePreview}
      >

        {/* CLOSE */}

        <button
          onClick={closePreview}
          className="
            absolute top-5 right-5
            w-12 h-12
            rounded-full
            bg-white/10
            hover:bg-white/20
            border border-white/10
            text-white
            text-2xl
            transition-all
            duration-300
            z-30
          "
        >
          ×
        </button>

        {/* IMAGE */}

        <div
          className="
            w-full
            h-full
            flex
            items-center
            justify-center
            px-4
            md:px-16
          "
          onClick={(e) =>
            e.stopPropagation()
          }
        >

          <img
            src={previewImage}
            alt="preview"
            className="
              max-w-full
              max-h-[92vh]
              object-contain
              rounded-[28px]
              shadow-2xl
            "
          />

        </div>

      </div>

    )}

    <div
      className="
        max-w-[1600px]
        mx-auto
        px-4
        sm:px-6
        lg:px-8
        py-6
        md:py-8
        lg:py-10
        space-y-10
      "
    >

      {/* ================= HERO ================= */}

<div
  className="
    relative
    overflow-hidden

    rounded-[28px]
    md:rounded-[36px]

    border border-white/10

    h-[220px]
    sm:h-[260px]
    md:h-[520px]

    bg-white/[0.03]
  "
>

  {/* COVER IMAGE */}

  <button
    type="button"
    onClick={() =>
      openPreview(
        data.coverUrl ||
        data.media?.[0] ||
        "/covers/default.png"
      )
    }
    className="w-full h-full"
  >

    <img
      src={
        data.coverUrl ||
        data.media?.[0] ||
        "/covers/default.png"
      }
      alt={data.displayName}
      className="
        w-full
        h-full
        object-cover
        transition-transform
        duration-700
        hover:scale-[1.02]
      "
    />

  </button>

  {/* OVERLAY */}

  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

  {/* CONTENT */}

<div
  className="
    absolute
    inset-x-0
    bottom-0

    p-5
    sm:p-6
    md:p-12

    pb-3
    sm:pb-5
    md:pb-16
  "
>

  {/* PROFILE */}

  <div
    className="
      absolute

      left-4
      right-4

      md:left-14
      md:right-auto

      lg:left-20

      bottom-3
      sm:bottom-4
      md:bottom-14

      flex
      flex-col
      md:flex-row

      items-start
      md:items-end

      gap-2
      sm:gap-3
      md:gap-6
    "
  >

    {/* AVATAR */}

    <button
      type="button"
      onClick={() =>
        openPreview(
          data.avatarUrl ??
          "/avatars/default.png"
        )
      }
      className="shrink-0"
    >

      <img
        src={
          data.avatarUrl ??
          "/avatars/default.png"
        }
        alt={data.displayName}
        className="
          w-16 h-16
          sm:w-20 sm:h-20
          md:w-36 md:h-36

          rounded-full
          object-cover

          border border-white/10
          ring-4 ring-emerald-400/10

          bg-white/[0.04]

          transition-transform
          duration-500

          hover:scale-[1.03]
        "
      />

    </button>

    {/* INFO */}

    <div
      className="
        space-y-1
        md:space-y-3

        text-left
      "
    >

      <h1
        className="
          text-[18px]
          sm:text-[24px]
          md:text-5xl
          lg:text-6xl

          font-bold
          tracking-tight
          text-white

          leading-[0.95]

          drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]
        "
      >
        {data.displayName}
      </h1>

      {data.reviewCount > 0 && (

        <div
          className="
            flex
            items-center
            gap-2

            text-xs
            sm:text-sm
          "
        >

          <StarRating
            value={Math.round(data.rating ?? 0)}
            readonly
          />

          <span className="font-medium text-white">
            {(data.rating ?? 0).toFixed(1)}
          </span>

          <span className="text-white/60">
            ({data.reviewCount} reviews)
          </span>

        </div>

      )}

    </div>

  </div>

</div>

  </div>

      {/* ================= INFO SECTION ================= */}

<div className="space-y-8 md:space-y-12">

  {/* ================= INFO GRID ================= */}

  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

    {/* AGE */}

    <div
      className="
        rounded-[30px]
        border border-white/[0.06]
        bg-gradient-to-b
        from-white/[0.025]
        to-white/[0.01]
        px-6
        py-5
        space-y-4
        shadow-[0_0_0_1px_rgba(255,255,255,0.02)]
      "
    >

      <h3
        className="
          text-[13px]
          uppercase
          tracking-[0.18em]
          text-white/35
          font-medium
        "
      >
        Age
      </h3>

      <div
        className="
          text-white
          text-lg
          font-semibold
        "
      >
        {data.age
          ? `${data.age} years`
          : "Not specified"}
      </div>

    </div>

    {/* LANGUAGES */}

    {data.languages?.length > 0 && (

      <div
        className="
          rounded-[30px]
          border border-white/[0.06]
          bg-gradient-to-b
          from-white/[0.025]
          to-white/[0.01]
          px-6
          py-5
          space-y-4
          shadow-[0_0_0_1px_rgba(255,255,255,0.02)]
        "
      >

        <h3
          className="
            text-[13px]
            uppercase
            tracking-[0.18em]
            text-white/35
            font-medium
          "
        >
          Languages
        </h3>

        <div
          className="
            text-white
            text-lg
            font-semibold
          "
        >
          {data.languages.join(", ")}
        </div>

      </div>

    )}

    {/* LOCATION */}

    <div
      className="
        rounded-[30px]
        border border-white/[0.06]
        bg-gradient-to-b
        from-white/[0.025]
        to-white/[0.01]
        px-6
        py-5
        space-y-4
        shadow-[0_0_0_1px_rgba(255,255,255,0.02)]
      "
    >

      <h3
        className="
          text-[13px]
          uppercase
          tracking-[0.18em]
          text-white/35
          font-medium
        "
      >
        Location
      </h3>

      <div
        className="
          text-white
          text-lg
          font-semibold
        "
      >
        {data.city}, {data.country}
      </div>

    </div>

  </div>

  {/* ================= CATEGORIES ================= */}

  {data.categories?.length > 0 && (

    <div
      className="
        rounded-[30px]
        border border-white/[0.06]
        bg-gradient-to-b
        from-white/[0.025]
        to-white/[0.01]
        px-6
        py-5
        space-y-4
        shadow-[0_0_0_1px_rgba(255,255,255,0.02)]
      "
    >

      <div className="flex items-center justify-between">

        <h3
          className="
            text-[13px]
            uppercase
            tracking-[0.18em]
            text-white/35
            font-medium
          "
        >
          Categories
        </h3>

      </div>

      <div className="flex flex-wrap gap-3">

        {data.categories.map((category) => (

          <div
            key={category}
            className="
              px-5 py-2.5
              rounded-full
              border border-white/[0.08]
              bg-white/[0.03]
              text-white/85
              text-sm
              font-medium
              tracking-wide

              transition-all
              duration-300

              hover:bg-white/[0.07]
              hover:border-white/[0.14]
              hover:text-white
              hover:-translate-y-[1px]

              shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]
            "
          >
            {category}
          </div>

        ))}

      </div>

    </div>

  )}

  {/* ================= ABOUT ================= */}

  <div
    className="
      rounded-[30px]
      border border-white/[0.06]
      bg-gradient-to-b
      from-white/[0.025]
      to-white/[0.01]
      px-6
      py-5
      space-y-4
      shadow-[0_0_0_1px_rgba(255,255,255,0.02)]
    "
  >

    <h3
      className="
        text-[13px]
        uppercase
        tracking-[0.18em]
        text-white/35
        font-medium
      "
    >
      About
    </h3>

    <p
      className="
        text-white/75
        leading-relaxed
        text-[15px]
      "
    >
      {data.bio ||
        "No creator bio added yet."}
    </p>

  </div>

</div>
      {/* ================= GALLERY ================= */}

{galleryImages.length > 0 && (

  <div className="space-y-6">

    {/* HEADER */}

    <div className="flex items-center justify-between">

      <h2 className="text-[30px] font-semibold tracking-tight text-white">
        Gallery
      </h2>

      <div className="text-sm text-white/35">
        {galleryImages.length} photos
      </div>

    </div>

    {/* GRID */}

<div
  className="
    grid
    grid-cols-2
    sm:grid-cols-2
    lg:grid-cols-3
    xl:grid-cols-4

    gap-3
    md:gap-5
  "
>

  {galleryImages.map(
    (
      image: string,
      index: number
    ) => (

      <button
        key={index}
        onClick={() => openPreview(image)}
        className="
          relative
          overflow-hidden

          rounded-[22px]
          md:rounded-[30px]

          aspect-[4/5]

          bg-white/[0.02]
          border border-white/[0.06]

          group
          transition-all
          duration-500

          hover:-translate-y-1
          hover:border-white/[0.12]
        "
      >

        {/* IMAGE */}

        <img
          src={image}
          alt={`gallery-${index}`}
          className="
            w-full
            h-full
            object-cover

            transition-transform
            duration-700

            group-hover:scale-[1.04]
          "
        />

        {/* OVERLAY */}

        <div
          className="
            absolute inset-0

            bg-gradient-to-t
            from-black/40
            via-transparent
            to-transparent

            opacity-70
          "
        />

        {/* INDEX */}

        <div
          className="
            absolute
            top-2
            right-2

            md:top-4
            md:right-4

            w-7
            h-7
            md:w-8
            md:h-8

            rounded-full

            bg-black/40
            border border-white/10
            backdrop-blur-md

            flex
            items-center
            justify-center

            text-[11px]
            md:text-xs

            text-white/70
            font-medium
          "
        >
          {index + 1}
        </div>

      </button>

    )
  )}

</div>

  </div>

)}

      {/* ================= MAIN CONTENT ================= */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-[1fr_340px]
          gap-8
          lg:gap-10
          items-start
        "
      >

        {/* ================= LEFT ================= */}

        <div className="space-y-12">

         {/* ================= SERVICES ================= */}

<div className="space-y-5">

  <div className="flex items-center justify-between">

    <h2 className="text-2xl font-semibold">
      Available Experiences
    </h2>

    <div className="text-sm text-white/40">
      {services.length} service
      {services.length !== 1 && "s"}
    </div>

  </div>

  {services.length === 0 ? (

    <div
      className="
        rounded-[26px]
        border border-white/10
        bg-white/[0.03]
        p-6
        text-white/50
      "
    >
      No experiences available yet.
    </div>

  ) : (

    <div className="space-y-5">

      {services.map((service) => {

        const selected =
          selectedService?.id ===
          service.id;

        return (

          <div
            key={service.id}
            onClick={() => {

              if (
                selectedService?.id ===
                service.id
              ) {
                setSelectedService(null);
                setSelectedSlots([]);
                return;
              }

              setSelectedService(service);
              setSelectedSlots([]);

            }}
            className={`
              group
              cursor-pointer
              overflow-hidden
              rounded-[34px]
              border
              transition-all
              duration-300
              backdrop-blur-xl
              ${
                selected
                  ? `
                    border-white/20
                    bg-gradient-to-r
                    from-white/[0.06]
                    to-white/[0.03]
                    ring-1 ring-white/10
                  `
                  : `
                    border-white/10
                    bg-gradient-to-r
                    from-white/[0.045]
                    to-white/[0.02]
                    hover:from-white/[0.06]
                    hover:to-white/[0.03]
                    hover:border-white/15
                  `
              }
            `}
          >

            <div
  className="
    flex
    flex-col
    md:flex-row

    items-start

    gap-4
    md:gap-8

    p-4
    md:p-5
  "
>

              {/* ================= IMAGE ================= */}

{service.media?.[0] && (

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();

      const imageUrl =
        service.media?.[0];

      if (!imageUrl) return;

      openPreview(imageUrl);
    }}
    className="
      group/image
      relative
      overflow-hidden

      w-full
      md:w-[260px]

      h-[180px]
      md:h-[170px]

      shrink-0

      rounded-[22px]
      md:rounded-[26px]

      border border-white/10
      bg-white/[0.03]

      hover:border-white/20

      transition-all
      duration-300
    "
  >

    <img
      src={service.media[0]}
      alt={service.title}
      className="
        w-full
        h-full
        object-cover

        transition-transform
        duration-700

        group-hover/image:scale-[1.05]
      "
    />

    {/* OVERLAY */}

    <div
      className="
        absolute
        inset-0
        bg-gradient-to-t
        from-black/35
        via-black/5
        to-transparent
      "
    />

    {/* PREVIEW BADGE */}

    <div
      className="
        absolute
        bottom-3
        right-3

        px-3
        py-1.5

        rounded-full

        bg-black/55
        backdrop-blur-md

        border border-white/10

        text-[11px]
        text-white/80

        opacity-0
        group-hover/image:opacity-100

        transition-all
        duration-300
      "
    >
      Preview
    </div>

  </button>

)}
              {/* ================= CONTENT ================= */}

              <div
  className="
    flex-1

    flex
    flex-col
    md:flex-row

    items-start
    md:justify-between

    gap-4
    md:gap-10

    min-h-auto
    md:min-h-[170px]

    py-1
    md:py-3
  "
>

                {/* ================= LEFT ================= */}

                <div
                  className="
                    flex-1
                    min-w-0
                    h-full
                    flex
                    flex-col
                    justify-start
                  "
                >

                  <div className="space-y-3">

                    <h3
  className="
    text-[22px]
    md:text-[28px]

    font-semibold
    text-white

    tracking-tight
    leading-tight

    break-words

    max-w-full
  "
>
                      {service.title}
                    </h3>

                    <p
  className="
    text-[14px]
    md:text-[15px]

    text-white/55

    leading-relaxed
    break-words

    max-w-full
    md:max-w-[680px]
  "
>
                      {service.description}
                    </p>

                  </div>

                </div>

                {/* ================= RIGHT ================= */}

                <div
  className="
    w-full
    md:w-auto

    shrink-0

    text-left
    md:text-right

    flex
    flex-col

    items-start
    md:items-end

    justify-start

    pt-2
    md:pt-1
  "
>

                  <div
                    className="
                      text-[14px]
                      text-white/35
                      mb-3
                    "
                  >
                    Starting from
                  </div>

                  <div
                    className="
                      text-[32px]
                      font-bold
                      text-white
                      leading-none
                      tracking-tight
                    "
                  >
                    {data.currency}{" "}
                    {service.price}
                  </div>

                  <div
                    className="
                      text-[15px]
                      text-white/40
                      mt-3
                    "
                  >
                    {service.durationMinutes} min
                  </div>

                </div>

              </div>

            </div>

          </div>

        );
      })}

    </div>

  )}

</div>

          {/* ================= REVIEWS ================= */}

<div className="space-y-6">

  {/* HEADER */}

  <div className="flex items-center justify-between">

    <h2 className="text-2xl font-semibold">
      Reviews & Ratings
    </h2>

    {reviews.length > 0 && (
      <div className="text-sm text-white/40">
        {reviews.length} review
        {reviews.length !== 1 && "s"}
      </div>
    )}

  </div>

  {/* ================= RATING SUMMARY ================= */}

  {reviews.length > 0 && (

    <div
      className="
        rounded-[30px]
        border border-white/10
        bg-white/[0.03]
        backdrop-blur-xl
        p-6 md:p-7
        space-y-6
      "
    >

      {/* TOP */}

      <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          gap-6
          md:gap-10
        "
      >

        {/* LEFT */}

        <div className="shrink-0">

          <div
            className="
              text-5xl
              font-bold
              tracking-tight
              text-white
            "
          >
            {(data.rating ?? 0).toFixed(1)}
          </div>

          <div className="mt-2">
            <StarRating
              value={Math.round(data.rating ?? 0)}
              readonly
            />
          </div>

          <div className="text-sm text-white/45 mt-2">
            Based on {reviews.length} reviews
          </div>

        </div>

        {/* RIGHT */}

        <div className="flex-1 space-y-4">

          {ratingCounts.map(
            ({ star, count }) => {

              const percent =
                (count / totalReviews) * 100;

              return (

                <div
                  key={star}
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    className="
                      w-10
                      text-sm
                      text-white/70
                    "
                  >
                    {star}★
                  </div>

                  <div
                    className="
                      flex-1
                      h-2.5
                      rounded-full
                      overflow-hidden
                      bg-white/[0.06]
                    "
                  >

                    <div
                      className="
                        h-full
                        rounded-full
                        bg-emerald-300
                      "
                      style={{
                        width: `${percent}%`,
                      }}
                    />

                  </div>

                  <div
                    className="
                      w-12
                      text-right
                      text-xs
                      text-white/45
                    "
                  >
                    {count}
                  </div>

                </div>

              );
            }
          )}

        </div>

      </div>

    </div>

  )}

  {/* ================= REVIEW LIST ================= */}

  {reviews.length > 0 ? (

    <div className="space-y-4">

      {reviews.map(
        (review, index) => {

          const isLast =
            index === reviews.length - 1;

          return (

            <div
              key={review._id}
              ref={
                isLast
                  ? lastReviewRef
                  : null
              }
              className="
                rounded-[28px]
                border border-white/10
                bg-white/[0.03]
                backdrop-blur-xl
                p-5 md:p-6
                transition-all
                duration-300
                hover:border-white/15
              "
            >

              <div className="flex gap-4">

                {/* AVATAR */}

                <div className="shrink-0">

                  <img
                    src={
                      review.reviewerId
                        ?.avatarUrl ||
                      "/avatars/default.png"
                    }
                    alt={
                      review.reviewerId
                        ?.displayName ||
                      "User"
                    }
                    className="
                      w-14
                      h-14
                      rounded-full
                      object-cover
                      border border-white/10
                      bg-white/[0.04]
                    "
                  />

                </div>

                {/* CONTENT */}

                <div className="flex-1 min-w-0">

                  {/* TOP */}

                  <div
                    className="
                      flex
                      flex-col
                      md:flex-row
                      md:items-start
                      md:justify-between
                      gap-3
                    "
                  >

                    <div className="space-y-2">

                      <div
                        className="
                          text-white
                          font-semibold
                          text-[16px]
                        "
                      >
                        {review.reviewerId
                          ?.displayName ||
                          "Anonymous User"}
                      </div>

                      <StarRating
                        value={review.rating}
                        readonly
                      />

                    </div>

                    <div
                      className="
                        text-xs
                        text-white/40
                        shrink-0
                      "
                    >
                      {new Date(
                        review.createdAt
                      ).toLocaleDateString()}
                    </div>

                  </div>

                  {/* COMMENT */}

                  {review.comment && (

                    <p
                      className="
                        mt-4
                        text-[15px]
                        leading-relaxed
                        text-white/65
                        break-words
                      "
                    >
                      {review.comment}
                    </p>

                  )}

                </div>

              </div>

            </div>

          );
        }
      )}

      {/* LOADING MORE */}

      {loadingMore && (

        <div
          className="
            rounded-[24px]
            border border-white/10
            bg-white/[0.03]
            p-5
            text-center
            text-sm
            text-white/50
          "
        >
          Loading more reviews...
        </div>

      )}

    </div>

  ) : (

    <div
      className="
        rounded-[28px]
        border border-white/10
        bg-white/[0.03]
        backdrop-blur-xl
        p-8
        text-center
        space-y-3
      "
    >

      <div className="text-5xl">
        ⭐
      </div>

      <div className="text-xl font-semibold">
        No reviews yet
      </div>

      <p className="text-sm text-white/50">
        Reviews and ratings from users
        will appear here.
      </p>

    </div>

  )}

</div>

        </div>

        {/* ================= BOOKING PANEL ================= */}

        <div
          className="
            lg:sticky
            lg:top-24
            h-fit
            rounded-[28px]
            border border-white/10
            bg-white/[0.03]
            backdrop-blur-xl
            p-5 md:p-6
            space-y-6
          "
        >

          {!selectedService ? (

            <div className="space-y-5 max-w-3xl">

              <div className="text-white font-medium">
                Select an experience
              </div>

              <p className="text-sm text-white/50 leading-relaxed">
                Choose a service to view pricing,
                available slots, and booking
                details.
              </p>

            </div>

          ) : (

            <>

              {/* PRICE */}

              <div className="space-y-2">

                <div className="text-3xl font-bold">

                  {data.currency}{" "}
                  {totalPrice ||
                    selectedService.price}

                </div>

                <div className="text-sm text-white/50">
                  {
                    selectedService.durationMinutes
                  }{" "}
                  minute experience
                </div>

              </div>

              {/* SERVICE SUMMARY */}

              <div
                className="
                  rounded-2xl
                  border border-white/10
                  bg-black/20
                  p-4
                  space-y-2
                "
              >

                <div className="font-medium">
                  {selectedService.title}
                </div>

                <p className="text-sm text-white/50 leading-relaxed">
                  {selectedService.description}
                </p>

              </div>

              {/* DATE */}

              <div className="space-y-2">

                <div className="text-sm text-white/60">
                  Select Date
                </div>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setSelectedDate(value);

                    fetchSlots(value);
                  }}
                  className="
                    w-full
                    rounded-xl
                    border border-white/10
                    bg-white/[0.03]
                    px-4 py-3
                    text-white
                    outline-none
                  "
                />

              </div>

              {/* SLOTS */}

              {slots.length > 0 ? (

                <div className="space-y-5 max-w-3xl">

                  <div className="text-sm text-white/60">
                    Available Slots
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">

                    {slots.map((slot) => (

                      <button
                        key={slot.id}
                        onClick={() =>
                          toggleSlot(slot.id)
                        }
                        className={`
                          rounded-xl
                          border
                          px-3 py-3
                          text-sm
                          transition-all
                          duration-300
                          ${
                            selectedSlots.includes(
                              slot.id
                            )
                              ? `
                                bg-emerald-400/15
                                border-emerald-400/30
                                text-emerald-200
                              `
                              : `
                                bg-white/[0.03]
                                border-white/10
                                hover:border-white/20
                              `
                          }
                        `}
                      >

                        <div>
                          {formatTime(
                            slot.startTime
                          )}
                        </div>

                        <div className="text-xs opacity-60 mt-1">
                          {formatTime(
                            slot.endTime
                          )}
                        </div>

                      </button>

                    ))}

                  </div>

                </div>

              ) : (
                selectedDate && (

                  <div
                    className="
                      rounded-2xl
                      border border-white/10
                      bg-black/20
                      p-4
                      text-sm text-white/50
                    "
                  >
                    No slots available for this
                    date.
                  </div>

                )
              )}

              {/* TOTAL */}

              {selectedSlots.length > 0 && (

                <div className="border-t border-white/10 pt-5 space-y-5">

                  <div className="flex items-center justify-between">

                    <span className="text-white/60">
                      Total Price
                    </span>

                    <span className="text-xl font-bold">
                      {data.currency}{" "}
                      {totalPrice}
                    </span>

                  </div>

                  <button
                    disabled={loadingBooking}
                    onClick={handleBooking}
                    className="
                      w-full
                      rounded-2xl
                      bg-emerald-400
                      hover:bg-emerald-300
                      text-black
                      font-semibold
                      py-3.5
                      transition-all
                      duration-300
                      disabled:opacity-50
                    "
                  >

                    {loadingBooking
                      ? "Processing..."
                      : "Book Experience"}

                  </button>

                </div>

              )}

            </>

          )}

        </div>

      </div>

    </div>

  </div>
);
}