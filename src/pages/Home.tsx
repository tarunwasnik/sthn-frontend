// frontend/src/pages/Home.tsx

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchHome } from "../api/public";
import type { HomeDTO } from "../api/public";
import CreatorCard from "../components/CreatorCard";

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState<HomeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetchHome()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      
      {/* Background Glow (ORIGINAL RESTORED) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[900px] h-[400px] md:h-[600px] bg-teal-500/10 blur-[120px] md:blur-[150px] rounded-full" />
      </div>

      {/* ================= NAVBAR ================= */}
      <nav className="flex items-center justify-between px-4 md:px-10 py-4 md:py-6 max-w-7xl mx-auto relative z-50">
        
        <div className="text-lg md:text-xl font-bold text-teal-400">
          STHN
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 text-gray-300">
          <span className="hover:text-white cursor-pointer">Explore</span>
          <span className="hover:text-white cursor-pointer">Become a Host</span>
          <span className="hover:text-white cursor-pointer">Safety</span>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-gray-300 hover:text-white transition"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/register")}
            className="bg-teal-400 text-black px-5 py-2 rounded-full font-semibold hover:bg-teal-300 transition"
          >
            Join Now
          </button>
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => navigate("/register")}
            className="bg-teal-400 text-black px-4 py-1.5 rounded-full text-sm font-semibold"
          >
            Join Now
          </button>

          <button
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* ================= DRAWER ================= */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          
          <div
            className="flex-1 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />

          <div className="w-[75%] max-w-sm bg-[#061412] p-6 flex flex-col gap-6 shadow-xl">
            
            <div className="flex justify-end">
              <button onClick={() => setMenuOpen(false)}>✕</button>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="text-left text-gray-300"
            >
              Login
            </button>

            <button
              onClick={() => navigate("/register")}
              className="bg-teal-400 text-black px-4 py-3 rounded-full font-semibold"
            >
              Join Now
            </button>

            <div className="border-t border-white/10 pt-4 space-y-4 text-gray-300">
              <div>Explore</div>
              <div>Become a Creator</div>
              <div>Safety</div>
            </div>
          </div>
        </div>
      )}

      {/* ================= HERO ================= */}
      <section className="text-center mt-12 md:mt-20 px-4 md:px-6">
        
        <div className="inline-block px-3 py-1 text-[10px] md:text-xs bg-teal-900/40 border border-teal-500/30 rounded-full text-teal-300 mb-4 md:mb-6">
          5,240 experiences booked today
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
          Book Time.
          <br />
          <span className="text-teal-400">Build Experiences.</span>
        </h1>

        <p className="mt-4 md:mt-6 text-sm md:text-base text-gray-400 max-w-xl md:max-w-2xl mx-auto">
          Connect with world-class creators for personalized, time-based sessions.
        </p>

        {/* Search Card */}
<div className="mt-8 md:mt-10 max-w-md md:max-w-4xl mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col gap-4">

  <div className="flex flex-col divide-y divide-white/10">
    
    <input
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      placeholder="Location (City or Online)"
      className="bg-transparent outline-none text-white placeholder-gray-400 py-3 text-sm"
    />

    <input
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      placeholder="Category (Photography, Music, etc.)"
      className="bg-transparent outline-none text-white placeholder-gray-400 py-3 text-sm"
    />
  </div>

  <button
    onClick={() => {
      navigate(
        `/explore?location=${encodeURIComponent(location)}&category=${encodeURIComponent(category)}`
      );
    }}
    className="mt-2 bg-teal-400 text-black py-3 rounded-xl font-semibold hover:bg-teal-300 transition"
  >
    Search
  </button>
</div>
      </section>

      {/* ================= STATS ================= */}
      <section className="mt-16 md:mt-20 max-w-5xl mx-auto px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 text-center">
        
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Creators" value={data?.stats.totalCreators || 0} />
            <StatCard label="Bookings" value={data?.stats.totalBookings || 0} />
            <StatCard label="Users" value={data?.stats.totalUsers || 0} />
          </>
        )}
      </section>

      {/* ================= FEATURED CREATORS ================= */}
      <section className="mt-20 md:mt-24 max-w-6xl mx-auto px-4 md:px-6">
        
        <h2 className="text-xl md:text-2xl font-semibold mb-6 md:mb-10">
          Featured Creators
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : data?.featuredCreators?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {data.featuredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-10">
            No creators available right now.
          </div>
        )}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="mt-24 md:mt-32 border-t border-white/10 py-10 md:py-16 px-4 md:px-10 text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-10">
          
          <div>
            <div className="text-teal-400 font-bold text-lg md:text-xl mb-3">
              STHN
            </div>
            <p className="max-w-sm text-sm">
              The world’s premium marketplace for time-based creative experiences.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 md:gap-16 text-sm">
            
            <div>
              <div className="text-white mb-3">Explore</div>
              <div className="space-y-2">
                <div>Featured</div>
                <div>Categories</div>
                <div>Gift Cards</div>
              </div>
            </div>

            <div>
              <div className="text-white mb-3">Company</div>
              <div className="space-y-2">
                <div>About</div>
                <div>Privacy</div>
                <div>Terms</div>
              </div>
            </div>

          </div>
        </div>
      </footer>

      {/* ================= BOTTOM NAV ================= */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl flex justify-around py-3 text-xs md:hidden shadow-lg">
        <div className="text-teal-400 font-semibold">Explore</div>
        <div className="text-gray-400">Saved</div>
        <div className="text-gray-400">Cart</div>
        <div className="text-gray-400">Profile</div>
      </div>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
      <div className="text-2xl md:text-3xl font-bold text-teal-400">
        {value}
      </div>
      <div className="text-gray-400 mt-2 text-sm md:text-base">
        {label}
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 animate-pulse">
      <div className="h-6 w-16 bg-white/10 rounded mb-3 mx-auto" />
      <div className="h-4 w-24 bg-white/10 rounded mx-auto" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl h-40 animate-pulse" />
  );
}