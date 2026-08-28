import { useEffect, useRef, useState } from "react";
import { getAdminVerificationCapture } from "../../../api/adminProfileVerification.api";
import type { AdminVerificationDetail } from "../../../api/adminProfileVerification.api";
import AdminStatusBadge from "../table/AdminStatusBadge";
import AdminImagePreview from "./AdminImagePreview";

const date = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "—";
const Field = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className="mt-1 break-words text-sm text-slate-200">{value || "—"}</p>
  </div>
);
export default function ProfileVerificationDetailContent({
  detail,
}: {
  detail: AdminVerificationDetail;
}) {
  const [captures, setCaptures] = useState<
    Record<number, { url?: string; failed?: boolean }>
  >({});
  const [preview, setPreview] = useState<{
    src: string;
    title: string;
    subtitle?: string;
  } | null>(null);
  const generation = useRef(0);
  const urls = useRef<string[]>([]);
  const clean = () => {
    urls.current.forEach(URL.revokeObjectURL);
    urls.current = [];
  };
  useEffect(() => {
    const token = ++generation.current;
    clean();
    setCaptures({});
    void Promise.all(
      detail.captures.map(async (capture) => {
        try {
          const url = URL.createObjectURL(
            await getAdminVerificationCapture(capture.viewPath),
          );
          if (generation.current !== token) {
            URL.revokeObjectURL(url);
            return;
          }
          urls.current.push(url);
          setCaptures((current) => ({
            ...current,
            [capture.challengeIndex]: { url },
          }));
        } catch {
          if (generation.current === token)
            setCaptures((current) => ({
              ...current,
              [capture.challengeIndex]: { failed: true },
            }));
        }
      }),
    );
    return () => {
      generation.current += 1;
      clean();
    };
  }, [detail]);
  const image = (src: string, title: string, subtitle?: string) => (
    <button
      type="button"
      className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-left transition hover:border-cyan-500 hover:brightness-110"
      onClick={() => setPreview({ src, title, subtitle })}
    >
      <img
        src={src}
        alt={title}
        className="h-36 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
      />
      <span className="absolute bottom-2 right-2 rounded bg-black/65 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
        View
      </span>
    </button>
  );
  const {
    profile,
    account,
    verificationRequest: request,
    faceSession,
  } = detail;
  return (
    <div className="space-y-7">
      <section className="rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
          Subject / verification summary
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <AdminStatusBadge status={request.status} />
          <AdminStatusBadge status={profile.profileStatus} />
          <span className="text-sm text-slate-400">
            Attempt #{request.attemptNumber} · V
            {request.profileSubmissionVersion}
          </span>
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Account & identity
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Real name" value={profile.realName} />
          <Field label="Username" value={profile.username} />
          <Field label="Email" value={account.email} />
          <Field label="Date of birth" value={date(profile.dateOfBirth)} />
          <Field
            label="Mobile"
            value={[profile.mobileCountryCode, profile.mobileNumber]
              .filter(Boolean)
              .join(" ")}
          />
          <Field label="Account role" value={account.role} />
          <Field label="Account status" value={account.status} />
          <Field label="Profile status" value={profile.profileStatus} />
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Location & communication
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Country" value={profile.country} />
          <Field label="City" value={profile.city} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.languages.map((language, index) => (
            <span
              key={`${language}-${index}`}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
            >
              {language}
            </span>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Profile content
        </h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
          {profile.bio}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.interests.map((interest, index) => (
            <span
              key={`${interest}-${index}`}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300"
            >
              {interest}
            </span>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Profile media
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>{image(profile.avatar, "Avatar")}</div>
          <div className="sm:col-span-2">{image(profile.cover, "Cover")}</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {profile.profilePhotos.map((src, index) => (
            <div key={`${src}-${index}`}>
              {image(src, `Profile photo ${index + 1}`)}
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Verification attempt
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Reference" value={request.verificationReference} />
          <Field label="Submitted" value={date(request.submittedAt)} />
          <Field
            label="Processing started"
            value={date(request.processingStartedAt)}
          />
          <Field
            label="Escalated"
            value={date(request.adminReviewRequiredAt)}
          />
          <Field
            label="Escalation code"
            value={request.adminReviewReasonCode}
          />
          <Field label="Escalation reason" value={request.adminReviewReason} />
          <Field label="Decision" value={request.decision} />
          <Field label="Decision reason" value={request.decisionReason} />
          <Field label="Decided" value={date(request.decidedAt)} />
          <Field label="Expired" value={date(request.expiredAt)} />
        </div>
      </section>
      <section className="rounded-xl border border-slate-800 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Face verification session
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field
            label="Session reference"
            value={faceSession.sessionReference}
          />
          <Field label="Status" value={faceSession.status} />
          <Field
            label="Submission version"
            value={faceSession.profileSubmissionVersion}
          />
          <Field label="Current" value={faceSession.isCurrent ? "Yes" : "No"} />
          <Field
            label="Captures"
            value={`${faceSession.acceptedCaptureCount} / ${faceSession.requiredCaptureCount}`}
          />
          <Field label="Challenges" value={faceSession.challenges.join(", ")} />
          <Field label="Started" value={date(faceSession.startedAt)} />
          <Field
            label="Completed"
            value={date(faceSession.captureCompletedAt)}
          />
          <Field label="Invalidated" value={date(faceSession.invalidatedAt)} />
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
          Face verification captures
        </h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...detail.captures]
            .sort((a, b) => a.challengeIndex - b.challengeIndex)
            .map((capture) => {
              const state = captures[capture.challengeIndex];
              return (
                <div
                  key={capture.challengeIndex}
                  className="overflow-hidden rounded-xl border border-cyan-900/60 bg-slate-950"
                >
                  <p className="border-b border-slate-800 p-3 text-xs text-slate-300">
                    Challenge {capture.challengeIndex} ·{" "}
                    {capture.challengeType.replace(/_/g, " ")}
                  </p>
                  {state?.url ? (
                    <button
                      type="button"
                      className="w-full transition hover:brightness-110"
                      onClick={() =>
                        setPreview({
                          src: state.url!,
                          title: `Face verification — Challenge ${capture.challengeIndex}`,
                          subtitle: capture.challengeType.replace(/_/g, " "),
                        })
                      }
                    >
                      <img
                        src={state.url}
                        alt={`Face verification challenge ${capture.challengeIndex}`}
                        className="h-64 w-full bg-slate-900/60 object-contain"
                      />
                    </button>
                  ) : (
                    <p className="grid h-64 place-items-center bg-slate-900/60 text-sm text-slate-500">
                      {state?.failed
                        ? "Capture unavailable"
                        : "Loading protected capture…"}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      </section>
      <section className="rounded-xl border border-cyan-900/60 bg-slate-950 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
          AI shadow analysis
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          Advisory only — Admin decision remains authoritative.
        </p>
        {detail.shadowIdentityAnalysis.status === "NOT_CONFIGURED" ? (
          <p className="mt-3 text-sm text-slate-300">
            Identity model not configured. No shadow identity result is
            available for this attempt.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              label="Processing status"
              value={detail.shadowIdentityAnalysis.status}
            />
            <Field
              label="Conclusion"
              value={detail.shadowIdentityAnalysis.conclusion}
            />
            {detail.shadowIdentityAnalysis.similarity !== null && (
              <Field
                label="Similarity score"
                value={detail.shadowIdentityAnalysis.similarity}
              />
            )}{" "}
            {detail.shadowIdentityAnalysis.threshold !== null && (
              <Field
                label="Configured threshold"
                value={detail.shadowIdentityAnalysis.threshold}
              />
            )}
            <Field
              label="Model"
              value={
                detail.shadowIdentityAnalysis.model
                  ? `${detail.shadowIdentityAnalysis.model.identifier} / ${detail.shadowIdentityAnalysis.model.version}`
                  : null
              }
            />
            <Field
              label="Processed"
              value={date(detail.shadowIdentityAnalysis.processedAt)}
            />
            <Field
              label="Reason code"
              value={detail.shadowIdentityAnalysis.reasonCode}
            />
            <Field
              label="Reason"
              value={detail.shadowIdentityAnalysis.reason}
            />
          </div>
        )}
      </section>
      <AdminImagePreview image={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
