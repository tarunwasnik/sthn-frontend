//frontend/src/components/admin/common/AdminAvatar.tsx

interface AdminAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export default function AdminAvatar({
  src,
  name,
  size = "md",
}: AdminAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-xl border border-slate-700 object-cover`}
      />
    );
  }

  const initials = name
    .trim()
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`
        ${sizes[size]}
        flex
        items-center
        justify-center
        rounded-xl
        border
        border-slate-700
        bg-slate-800
        font-semibold
        text-slate-300
      `}
    >
      {initials}
    </div>
  );
}
