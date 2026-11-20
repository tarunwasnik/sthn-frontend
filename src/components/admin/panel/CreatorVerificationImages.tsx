import { useEffect, useState } from "react";
import { getAdminVerificationCapture } from "../../../api/adminProfileVerification.api";

type Capture = { challengeIndex: number; challenge: string; viewPath: string };
type ImageState = { url: string } | { failed: true };

export default function CreatorVerificationImages({ avatar, cover, captures }: { avatar?: string | null; cover?: string | null; captures: Capture[] }) {
  const [images, setImages] = useState<Record<number, ImageState>>({});
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    setImages({});
    setPreview(null);
    for (const capture of captures) {
      void getAdminVerificationCapture(capture.viewPath).then((blob) => {
        if (!active) return;
        const url = URL.createObjectURL(blob);
        urls.push(url);
        setImages((current) => ({ ...current, [capture.challengeIndex]: { url } }));
      }).catch(() => {
        if (active) setImages((current) => ({ ...current, [capture.challengeIndex]: { failed: true } }));
      });
    }
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [captures]);

  const imageButton = (src: string, title: string, height: string) => (
    <button type="button" aria-label={`Enlarge ${title}`} onClick={() => setPreview({ src, title })} className="w-full rounded-[var(--radius-card)] border border-theme-border bg-theme-inset p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-theme-accent">
      <img src={src} alt={title} className={`${height} w-full object-contain`} />
    </button>
  );

  return <section aria-label="Identity image comparison" className="min-w-0 space-y-4 text-theme-text">
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      <div><p className="mb-2 text-sm font-medium">Creator avatar</p>{avatar ? imageButton(avatar, "Creator avatar", "h-56") : <p className="text-sm text-theme-muted">Avatar unavailable</p>}</div>
      <div><p className="mb-2 text-sm font-medium">Creator cover</p>{cover ? imageButton(cover, "Creator cover", "h-56") : <p className="text-sm text-theme-muted">Cover unavailable</p>}</div>
    </div>
    {preview && <div role="region" aria-label="Enlarged image" className="rounded-[var(--radius-card)] border border-theme-border bg-theme-surface p-3">
      <div className="flex items-center justify-between gap-2"><p className="font-medium">{preview.title}</p><button type="button" onClick={() => setPreview(null)} className="rounded border border-theme-border px-3 py-1 text-sm">Close enlarged image</button></div>
      <img src={preview.src} alt={`Enlarged ${preview.title}`} className="mt-2 max-h-[65vh] w-full object-contain" />
    </div>}
    <div><p className="font-medium">Protected live captures</p>
      {captures.length === 0 && <p className="mt-2 text-sm text-theme-muted">No captures available.</p>}
      <div className="mt-2 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[...captures].sort((a, b) => a.challengeIndex - b.challengeIndex).map((capture) => {
          const state = images[capture.challengeIndex];
          const title = `Capture ${capture.challengeIndex + 1} · ${capture.challenge}`;
          return <div key={capture.challengeIndex} className="min-w-0 rounded-[var(--radius-card)] border border-theme-border bg-theme-inset p-2"><p className="mb-2 break-words text-xs">{title}</p>{state && "url" in state ? imageButton(state.url, title, "h-48") : <p className="grid h-48 place-items-center text-sm text-theme-muted">{state && "failed" in state ? "Capture unavailable" : "Loading protected capture…"}</p>}</div>;
        })}
      </div>
    </div>
  </section>;
}
