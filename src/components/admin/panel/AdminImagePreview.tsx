import { useEffect } from "react";
import { X } from "lucide-react";

interface Props { image: { src: string; title: string; subtitle?: string } | null; onClose: () => void }
export default function AdminImagePreview({ image, onClose }: Props) {
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [onClose]);
  if (!image) return null;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={onClose}><div className="relative flex h-full w-full max-w-6xl flex-col" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between pb-3 text-white"><div><p className="font-semibold">{image.title}</p>{image.subtitle && <p className="text-sm text-slate-300">{image.subtitle}</p>}</div><button aria-label="Close image preview" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10"><X /></button></div><img src={image.src} alt={image.title} className="min-h-0 w-full flex-1 rounded-xl object-contain" /></div></div>;
}
