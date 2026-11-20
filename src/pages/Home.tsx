// frontend/src/pages/Home.tsx

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchHome } from "../api/public";
import type { HomeDTO } from "../api/public";
import CreatorCard from "../components/CreatorCard";
import ThemeQuickToggle from "../components/theme/ThemeQuickToggle";
import { useAuth } from "../hooks/useAuth";
import { getAccessToken } from "../auth/session";

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, creatorStatus, role } = useAuth();

  const [data, setData] =
    useState<HomeDTO | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [location, setLocation] =
    useState("");

  const [category, setCategory] =
    useState("");

  useEffect(() => {
    fetchHome()
      .then(setData)
      .finally(() =>
        setLoading(false)
      );
  }, []);

  const beginCreatorJourney = () => {
    // AuthContext is asynchronously refreshed after sign-out. Require the
    // current browser session token as well, so a stale render cannot expose
    // the authenticated Creator-application route to a logged-out visitor.
    if (!isAuthenticated || !getAccessToken()) {
      navigate("/register");
      return;
    }
    if (isAuthenticated && (role === "creator" || creatorStatus === "approved")) {
      navigate("/dashboard/creator");
      return;
    }
    navigate("/creator-application");
  };

  return (
    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-theme-bg
        text-theme-text
      "
    >
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div
          className="
            absolute
            top-0
            left-1/2
            -translate-x-1/2
            w-[600px]
            md:w-[900px]
            h-[400px]
            md:h-[600px]
            bg-theme-accent/10
            blur-[140px]
            rounded-full
          "
        />
      </div>

      {/* ================= NAVBAR ================= */}

      <nav
        className="
          flex
          items-center
          justify-between
          px-3
          md:px-10
          py-4
          md:py-6
          max-w-7xl
          mx-auto
          relative
          z-50
        "
      >
        <div
          className="
            text-lg
            md:text-xl
            font-semibold
            text-theme-text
          "
        >
          STHN
        </div>

        {/* Desktop Menu */}

        <div
          className="
            hidden
            md:flex
            gap-8
            text-theme-muted
          "
        >
          <span className="cursor-pointer hover:text-theme-text">
            Explore
          </span>

          <span className="cursor-pointer hover:text-theme-text">
            Become a Host
          </span>

          <span className="cursor-pointer hover:text-theme-text">
            Safety
          </span>
        </div>

        {/* Desktop Actions */}

        <div
          className="
            hidden
            md:flex
            items-center
            gap-4
          "
        >
          <ThemeQuickToggle className="hidden md:inline-flex" />
          <button
            type="button"
            onClick={() =>
              navigate("/login")
            }
            className="
              text-theme-muted
              hover:text-theme-text
              transition
            "
          >
            Login
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
            className="
              bg-theme-primary
              text-theme-primary-text
              px-5
              py-2
              rounded-[var(--radius-control)]
              font-medium
              hover:opacity-90
              transition
            "
          >
            Join Now
          </button>
        </div>

        {/* Mobile Actions */}

        <div
          className="
            flex
            md:hidden
            items-center
            gap-1.5
            sm:gap-2
          "
        >
          <ThemeQuickToggle className="inline-flex h-10 w-10 md:hidden" />

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="min-h-10 rounded-[var(--radius-control)] px-1.5 text-sm font-medium text-theme-muted transition-colors hover:text-theme-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/register")
            }
            className="
              bg-theme-primary
              text-theme-primary-text
              min-h-10
              px-3
              rounded-[var(--radius-control)]
              text-sm
              font-medium
              focus-visible:outline
              focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-theme-accent
            "
          >
            Join Now
          </button>
        </div>
      </nav>

      {/* ================= HERO ================= */}

      <section
        className="
          text-center
          mt-12
          md:mt-20
          px-4
          md:px-6
        "
      >
        <div
          className="
            inline-block
            px-3
            py-1
            text-[10px]
            md:text-xs
            bg-theme-accent-tint
            border
            border-theme-accent
            rounded-[var(--radius-control)]
            text-theme-accent
            mb-4
            md:mb-6
          "
        >
          Explore real creator
          availability
        </div>

        <h1
          className="
            text-3xl
            sm:text-4xl
            md:text-6xl
            font-semibold
            leading-tight
          "
        >
          Book Time.
          <br />

          <span className="text-theme-accent">
            Build Experiences.
          </span>
        </h1>

        <p
          className="
            mt-4
            md:mt-6
            text-sm
            md:text-base
            text-theme-muted
            max-w-xl
            md:max-w-2xl
            mx-auto
          "
        >
          Connect with world-class
          creators for personalized,
          time-based sessions.
        </p>

        {/* Search Card */}

        <div
          className="
            mt-8
            md:mt-10
            max-w-md
            md:max-w-4xl
            mx-auto
            bg-theme-surface
            border
            border-theme-border
            rounded-[var(--radius-card-featured)]
            shadow-sm
            p-5
            md:p-6
            flex
            flex-col
            gap-4
          "
        >
          <div
            className="
              flex
              flex-col
              divide-y
              divide-theme-border
            "
          >
            <input
              aria-label="Location"
              value={location}
              onChange={(e) =>
                setLocation(
                  e.target.value
                )
              }
              placeholder="Location (City or Online)"
              className="
                bg-transparent
                text-theme-text
                placeholder:text-theme-muted
                py-3
                text-sm
              "
            />

            <input
              aria-label="Category"
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              placeholder="Category (Photography, Music, etc.)"
              className="
                bg-transparent
                text-theme-text
                placeholder:text-theme-muted
                py-3
                text-sm
              "
            />
          </div>

          <button
            type="button"
            onClick={() => {
              navigate(
                `/explore?location=${encodeURIComponent(
                  location
                )}&category=${encodeURIComponent(
                  category
                )}`
              );
            }}
            className="
              mt-2
              bg-theme-primary
              text-theme-primary-text
              py-3
              rounded-[var(--radius-control)]
              font-medium
              hover:opacity-90
              transition-opacity
            "
          >
            Search
          </button>
        </div>
      </section>

      {/* ================= STATS ================= */}

      <section
        className="
          mt-16
          md:mt-20
          max-w-5xl
          mx-auto
          px-4
          md:px-6
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          gap-4
          md:gap-6
          text-center
        "
      >
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Creators"
              value={
                data?.stats
                  .totalCreators ?? 0
              }
            />

            <StatCard
              label="Bookings"
              value={
                data?.stats
                  .totalBookings ?? 0
              }
            />

            <StatCard
              label="Users"
              value={
                data?.stats
                  .totalUsers ?? 0
              }
            />
          </>
        )}
      </section>

      {/* ================= FEATURED CREATORS ================= */}

      <section
        className="
          mt-20
          md:mt-24
          max-w-6xl
          mx-auto
          px-4
          md:px-6
        "
      >
        <h2
          className="
            text-xl
            md:text-2xl
            font-semibold
            mb-6
            md:mb-10
          "
        >
          Featured Creators
        </h2>

        {loading ? (
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
              gap-5
            "
          >
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : data?.featuredCreators
            ?.length ? (
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
              gap-5
              items-start
            "
          >
            {data.featuredCreators.map(
              (creator) => (
                <CreatorCard
                  key={creator.id}
                  creator={creator}
                />
              )
            )}
          </div>
        ) : (
          <div
            className="
            rounded-[var(--radius-card)]
            border border-dashed border-theme-border
            bg-theme-inset
            py-10
            text-center text-theme-muted
            "
          >
            No creators available
            right now.
          </div>
        )}

        <section className="mt-8 rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-5 text-center sm:mt-10 sm:p-7">
          <h3 className="text-lg font-semibold text-theme-text">Have a skill worth sharing?</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-theme-muted">Become a Creator and offer personalized experiences to people looking for your expertise.</p>
          <button type="button" onClick={beginCreatorJourney} className="mt-5 min-h-11 rounded-[var(--radius-control)] bg-theme-primary px-4 py-2.5 text-sm font-semibold text-theme-primary-text transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent">Become a Creator</button>
        </section>
      </section>

      {/* ================= FOOTER ================= */}

      <footer
        className="
          mt-24
          md:mt-32
          border-t
          border-theme-border
          py-10
          md:py-16
          px-4
          md:px-10
          text-theme-muted
        "
      >
        <div
          className="
            max-w-7xl
            mx-auto
            flex
            flex-col
            md:flex-row
            justify-between
            gap-10
          "
        >
          <div>
            <div
              className="
                text-theme-text
                font-semibold
                text-lg
                md:text-xl
                mb-3
              "
            >
              STHN
            </div>

            <p
              className="
                max-w-sm
                text-sm
              "
            >
              The world’s premium
              marketplace for
              time-based creative
              experiences.
            </p>
          </div>

          <div
            className="
              flex
              flex-col
              sm:flex-row
              gap-8
              md:gap-16
              text-sm
            "
          >
            <div>
              <div className="mb-3 text-theme-text">
                Explore
              </div>

              <div className="space-y-2">
                <div>Featured</div>

                <div>
                  Categories
                </div>

                <div>
                  Gift Cards
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 text-theme-text">
                Company
              </div>

              <div className="space-y-2">
                <div>About</div>

                <div>Privacy</div>

                <div>Terms</div>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        bg-theme-surface
        border
        border-theme-border
        rounded-[var(--radius-card)]
        shadow-sm
        p-6
        md:p-8
      "
    >
      <div
        className="
          text-2xl
          md:text-3xl
          font-semibold
          text-theme-text
        "
      >
        {value}
      </div>

      <div
        className="
          text-theme-muted
          mt-2
          text-sm
          md:text-base
        "
      >
        {label}
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div
      className="
        bg-theme-surface
        border
        border-theme-border
        rounded-[var(--radius-card)]
        p-6
        md:p-8
        animate-pulse
      "
    >
      <div
        className="
          h-6
          w-16
          bg-theme-inset
          rounded
          mb-3
          mx-auto
        "
      />

      <div
        className="
          h-4
          w-24
          bg-theme-inset
          rounded
          mx-auto
        "
      />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="
        bg-theme-surface
        border
        border-theme-border
        rounded-[var(--radius-card)]
        h-[420px]
        animate-pulse
      "
    />
  );
}
