import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Calendar,
  MessageCircle,
  Settings,
  ChevronDown,
} from "lucide-react";
import api from "../api/axios";

type Props = {
  children: ReactNode;
};

type Profile = {
  username?: string;
  profilePhotos?: string[];
};

export default function UserDashboardLayout({
  children,
}: Props) {
  const navigate = useNavigate();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [showMore, setShowMore] =
    useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const authRes =
          await api.get("/auth/me");

        const userId =
          authRes.data.id;

        const profileRes =
          await api.get(
            `/v1/users/${userId}`
          );

        setProfile(
          profileRes.data.profile
        );
      } catch (err) {
        console.error(
          "Failed to load profile",
          err
        );
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (showMore) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [showMore]);

  const avatar =
    profile?.profilePhotos?.[0];

  const displayName =
    profile?.username || "User";

  const initials =
    displayName
      .charAt(0)
      .toUpperCase();

  return (
    <div
      className="
        h-screen
        flex
        text-[#F8FAFC]
        overflow-x-hidden
      "
      style={{
        background:
          "radial-gradient(circle at top center, #1A1A1A 0%, #111111 40%, #050505 100%)",
      }}
    >
      {/* SIDEBAR */}
      <aside
        className="
          hidden
          md:flex
          w-64
          h-screen
          shrink-0
          flex-col
          bg-[#0B0B0C]
          border-r
          border-[rgba(255,255,255,0.08)]
        "
      >
        <div>
          <div
            className="
              p-6
              border-b
              border-[rgba(255,255,255,0.08)]
            "
          >
            <h1
              className="
                text-xl
                font-bold
                text-[#F8FAFC]
              "
            >
              STHN
            </h1>

            <p
              className="
                text-sm
                text-[rgba(255,255,255,0.50)]
              "
            >
              User Panel
            </p>
          </div>

          <nav className="p-4 space-y-2">
            <SidebarItem
              to="/dashboard/user"
              icon={
                <LayoutDashboard size={18} />
              }
              label="Dashboard"
              end
            />

            <SidebarItem
              to="/dashboard/user/browse"
              icon={<Search size={18} />}
              label="Browse Creators"
            />

            <SidebarItem
              to="/dashboard/user/bookings"
              icon={<Calendar size={18} />}
              label="My Bookings"
            />

            <SidebarItem
              to="/dashboard/user/messages"
              icon={
                <MessageCircle size={18} />
              }
              label="Messages"
            />

            <SidebarItem
              to="/dashboard/user/settings"
              icon={<Settings size={18} />}
              label="Settings"
            />
          </nav>
        </div>
      </aside>

      {/* MAIN */}
      <div
        className="
          flex-1
          h-screen
          flex
          flex-col
          relative
          min-w-0
          isolate
          overflow-hidden
        "
      >
        {/* HEADER */}
        <header
          className="
            h-14
            md:h-16
            flex
            items-center
            justify-between
            px-3
            sm:px-4
            md:px-6
            border-b
            border-[rgba(255,255,255,0.08)]
            bg-[#111111]
            relative
            z-10
          "
        >
          <h2
            className="
              text-sm
              md:text-lg
              font-semibold
              text-[#E5E7EB]
            "
          >
            User Dashboard
          </h2>

          <div
            onClick={() =>
              navigate("/profile")
            }
            className="
              w-9
              h-9
              rounded-full
              bg-[rgba(255,255,255,0.05)]
              border
              border-[rgba(255,255,255,0.08)]
              overflow-hidden
              cursor-pointer
              hover:bg-[rgba(255,255,255,0.08)]
              transition
            "
          >
            {avatar ? (
              <img
                src={avatar}
                className="
                  w-full
                  h-full
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  w-full
                  h-full
                  flex
                  items-center
                  justify-center
                  text-xs
                  text-[rgba(255,255,255,0.55)]
                "
              >
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <main
          className="
            flex-1
            overflow-y-auto
            w-full
            max-w-full
            px-3
            sm:px-4
            md:px-6
            py-4
            md:py-6
            pb-32
            md:pb-6
            relative
            z-10
          "
        >
          {children}
        </main>

        {/* MOBILE NAV */}
        <nav
          className="
            fixed
            bottom-3
            left-1/2
            -translate-x-1/2
            w-[95%]
            max-w-md
            bg-[#151515]
            border
            border-[rgba(255,255,255,0.08)]
            rounded-2xl
            flex
            justify-around
            items-center
            py-3
            text-xs
            md:hidden
            shadow-[0_10px_30px_rgba(0,0,0,0.35)]
            z-[900]
          "
        >
          <BottomNavItem
            to="/dashboard/user"
            icon={
              <LayoutDashboard size={20} />
            }
            label="Home"
            end
          />

          <BottomNavItem
            to="/dashboard/user/browse"
            icon={<Search size={20} />}
            label="Browse"
          />

          <BottomNavItem
            to="/dashboard/user/bookings"
            icon={<Calendar size={20} />}
            label="Bookings"
          />

          <BottomNavItem
            to="/dashboard/user/messages"
            icon={
              <MessageCircle size={20} />
            }
            label="Messages"
          />

          <button
            onClick={() =>
              setShowMore(true)
            }
            className="
              flex
              flex-col
              items-center
              justify-center
              text-[rgba(255,255,255,0.50)]
            "
          >
            <span className="text-lg">
              ⋯
            </span>
            <span>More</span>
          </button>
        </nav>

        {/* MORE SHEET */}
        {showMore && (
          <>
            <div
              onClick={() =>
                setShowMore(false)
              }
              className="
                fixed
                inset-0
                bg-black/70
                z-[1000]
              "
            />

            <div className="fixed inset-x-0 bottom-0 z-[1001]">
              <div
                className="
                  bg-[#151515]
                  border-t
                  border-[rgba(255,255,255,0.08)]
                  rounded-t-2xl
                  px-5
                  pt-5
                  pb-10
                  max-h-[75vh]
                  overflow-y-auto
                  relative
                "
              >
                <div className="flex justify-center mb-4">
                  <div
                    className="
                      w-10
                      h-1
                      bg-[rgba(255,255,255,0.20)]
                      rounded-full
                    "
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SheetItem
                    to="/dashboard/user/settings"
                    icon={<Settings size={18} />}
                    label="Settings"
                    close={() =>
                      setShowMore(false)
                    }
                  />
                </div>

                <button
                  onClick={() =>
                    setShowMore(false)
                  }
                  className="
                    absolute
                    bottom-4
                    right-4
                    w-10
                    h-10
                    flex
                    items-center
                    justify-center
                    rounded-full
                    bg-[rgba(255,255,255,0.05)]
                    border
                    border-[rgba(255,255,255,0.08)]
                    text-[rgba(255,255,255,0.55)]
                    hover:bg-[rgba(255,255,255,0.10)]
                    transition
                  "
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* SIDEBAR ITEM */

function SidebarItem({
  to,
  icon,
  label,
  end = false,
}: any) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `
        flex
        items-center
        space-x-3
        px-3
        py-2.5
        rounded-xl
        transition
        border
        ${
          isActive
            ? `
              bg-[rgba(255,255,255,0.06)]
              text-white
              border-[rgba(255,255,255,0.08)]
            `
            : `
              text-[rgba(255,255,255,0.60)]
              border-transparent
              hover:bg-[rgba(255,255,255,0.04)]
              hover:text-[#E5E7EB]
            `
        }
      `
      }
    >
      {icon}
      <span className="text-sm">
        {label}
      </span>
    </NavLink>
  );
}

function BottomNavItem({
  to,
  icon,
  label,
  end = false,
}: any) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `
        flex
        flex-col
        items-center
        justify-center
        ${
          isActive
            ? "text-white"
            : "text-[rgba(255,255,255,0.50)]"
        }
      `
      }
    >
      <div className="mb-0.5">
        {icon}
      </div>

      <span>{label}</span>
    </NavLink>
  );
}

function SheetItem({
  to,
  icon,
  label,
  close,
}: any) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => {
        navigate(to);
        close();
      }}
      className="
        bg-[rgba(255,255,255,0.04)]
        border
        border-[rgba(255,255,255,0.08)]
        rounded-xl
        py-4
        flex
        flex-col
        items-center
        justify-center
        gap-2
        text-sm
        hover:bg-[rgba(255,255,255,0.08)]
        transition
      "
    >
      <div className="text-[rgba(255,255,255,0.70)]">
        {icon}
      </div>

      <span className="text-[#F8FAFC]">
        {label}
      </span>
    </button>
  );
}