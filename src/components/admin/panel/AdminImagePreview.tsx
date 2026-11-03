import { useEffect } from "react";
import { X } from "lucide-react";

interface Props { image: { src: string; title: string; subtitle?: string } | null; onClose: () => void }
export default function AdminImagePreview({ image, onClose }: Props) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  if (!image) return null;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={onClose}><div className="relative flex h-full w-full max-w-6xl flex-col" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between pb-3 text-white"><div><p className="font-semibold">{image.title}</p>{image.subtitle && <p className="text-sm text-white/80">{image.subtitle}</p>}</div><button aria-label="Close image preview" onClick={onClose} className="rounded-[var(--radius-control)] p-2 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-accent"><X /></button></div><img src={image.src} alt={image.title} className="min-h-0 w-full flex-1 rounded-[var(--radius-card)] object-contain" /></div></div>;
}
