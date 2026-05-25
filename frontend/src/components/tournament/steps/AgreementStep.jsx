import { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

const TERMS = [
  {
    title: "Accurate Information",
    body: "All tournament details you provide (name, venue, dates, categories, prize money) are accurate and truthful. Matchify.pro is not responsible for incorrect information provided by organizers.",
  },
  {
    title: "Payment Structure — You Must Understand This",
    body: "All registration fees collected from players go through Matchify.pro. You will receive 30% of the total collected amount BEFORE the tournament begins. You will receive the remaining 67% AFTER the tournament is fully completed and results are declared. Matchify.pro retains 3% as a platform service fee. This structure is non-negotiable and applies to every tournament you create.",
    highlight: true,
  },
  {
    title: "Fair Play & Conduct",
    body: "You agree to conduct the tournament in a fair, transparent, and non-discriminatory manner. Matchify.pro reserves the right to suspend organizer accounts for reports of misconduct, fraud, or unfair practices.",
  },
  {
    title: "Cancellations & Refunds",
    body: "If you cancel a tournament after collecting fees, you are obligated to refund all registered participants. Matchify.pro may take action against organizers with unresolved refund complaints. The 3% platform fee is non-refundable in case of organizer-initiated cancellations.",
  },
  {
    title: "Data & Privacy",
    body: "Participant data collected through Matchify.pro may only be used for tournament management purposes. You agree not to misuse, sell, or share participant data with third parties.",
  },
  {
    title: "Compliance",
    body: "You are responsible for ensuring your tournament complies with all applicable local laws, sports body regulations, and venue requirements. Matchify.pro is not liable for regulatory non-compliance.",
  },
];

const AgreementStep = ({ onNext, onPrev }) => {
  const [agreed, setAgreed] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const handleNext = () => {
    if (!agreed) {
      setAttempted(true);
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(139,92,246,0.15))",
            border: "1px solid rgba(168,85,247,0.4)",
          }}
        >
          <span className="text-2xl">📋</span>
        </div>
        <h2
          className="text-xl font-black"
          style={{
            background: "linear-gradient(135deg,#ffffff,#c4b5fd)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Organizer Agreement
        </h2>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          Read every section carefully before accepting
        </p>
      </div>

      {/* ── PAYMENT BREAKDOWN — most important, cannot be missed ── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.08))",
          border: "2px solid rgba(251,191,36,0.5)",
          boxShadow: "0 0 24px rgba(251,191,36,0.15)",
        }}
      >
        {/* glow corner */}
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #fbbf24, transparent)" }}
        />

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">💰</span>
          <h3 className="text-base font-black text-white">
            Revenue Distribution — Read Carefully
          </h3>
        </div>

        <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
          All registration fees collected from players are managed by Matchify.pro.
          Here is exactly how the money is distributed:
        </p>

        {/* Three payment rows */}
        <div className="space-y-3">
          {/* 30% */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.15))",
                border: "1.5px solid rgba(245,158,11,0.5)",
              }}
            >
              <span className="text-lg font-black" style={{ color: "#FCD34D", lineHeight: 1 }}>30%</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">First Payout — Before Tournament</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Paid to you <span className="font-bold text-green-400">before</span> the tournament begins, once registrations close
              </p>
            </div>
            <span className="text-lg flex-shrink-0">🏁</span>
          </div>

          {/* 67% */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.35)",
            }}
          >
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15))",
                border: "1.5px solid rgba(99,102,241,0.5)",
              }}
            >
              <span className="text-lg font-black" style={{ color: "#a78bfa", lineHeight: 1 }}>67%</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">Final Payout — After Tournament</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Paid to you <span className="font-bold text-violet-400">after</span> the tournament is fully completed and results are declared
              </p>
            </div>
            <span className="text-lg flex-shrink-0">🏆</span>
          </div>

          {/* 3% */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <div
              className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.12))",
                border: "1.5px solid rgba(239,68,68,0.4)",
              }}
            >
              <span className="text-lg font-black" style={{ color: "#f87171", lineHeight: 1 }}>3%</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-black text-white">Matchify.pro Platform Fee</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Retained by Matchify.pro as a service fee — <span className="font-bold text-red-400">non-refundable</span>
              </p>
            </div>
            <span className="text-lg flex-shrink-0">⚙️</span>
          </div>
        </div>

        {/* Total bar */}
        <div
          className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <span className="text-xs font-bold text-white">Total</span>
          <div className="flex items-center gap-3 text-xs font-black">
            <span style={{ color: "#FCD34D" }}>30%</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>+</span>
            <span style={{ color: "#a78bfa" }}>67%</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>+</span>
            <span style={{ color: "#f87171" }}>3%</span>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>=</span>
            <span className="text-white">100%</span>
          </div>
        </div>

        <p
          className="text-xs mt-3 font-semibold"
          style={{ color: "rgba(251,191,36,0.85)" }}
        >
          ⚠️ By accepting this agreement you confirm you fully understand and agree to this payment structure.
        </p>
      </div>

      {/* ── Full Terms & Conditions ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(168,85,247,0.2)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div
          className="max-h-60 overflow-y-auto px-5 py-4 space-y-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(168,85,247,0.3) transparent" }}
        >
          {TERMS.map((term, i) => (
            <div
              key={i}
              className={term.highlight ? "p-3 rounded-xl" : ""}
              style={
                term.highlight
                  ? { background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }
                  : {}
              }
            >
              <p
                className="text-sm font-bold mb-0.5"
                style={{ color: term.highlight ? "#fbbf24" : "white" }}
              >
                {i + 1}. {term.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                {term.body}
              </p>
            </div>
          ))}

          <div
            className="rounded-xl p-3 mt-2"
            style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}
          >
            <p className="text-xs" style={{ color: "rgba(196,181,253,0.8)" }}>
              By accepting, you confirm you have read all terms above and agree to be bound by them.
              These terms apply to every tournament you create on Matchify.pro.
            </p>
          </div>
        </div>
      </div>

      {/* ── Checkbox ── */}
      <button
        type="button"
        onClick={() => { setAgreed(v => !v); setAttempted(false); }}
        className="w-full flex items-start gap-3 p-4 rounded-2xl transition-all text-left"
        style={{
          background: agreed
            ? "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.08))"
            : attempted
            ? "rgba(239,68,68,0.08)"
            : "rgba(255,255,255,0.04)",
          border: `2px solid ${agreed ? "rgba(245,158,11,0.4)" : attempted ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
        }}
      >
        <div className="flex-shrink-0 mt-0.5">
          {agreed ? (
            <CheckCircleSolid className="w-5 h-5" style={{ color: "#FCD34D" }} />
          ) : (
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: attempted ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.25)" }}
            />
          )}
        </div>
        <div>
          <p className="text-sm font-black" style={{ color: agreed ? "#FCD34D" : "rgba(255,255,255,0.9)" }}>
            I have read and I fully agree to the Organizer Terms &amp; Conditions
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            Including the 30% / 67% / 3% payment structure stated above — this is mandatory to proceed
          </p>
        </div>
      </button>

      {/* Error if not accepted */}
      {attempted && !agreed && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)" }}
        >
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
          <p className="text-xs font-bold" style={{ color: "#ef4444" }}>
            You must accept the terms and conditions — including the payment structure — to continue
          </p>
        </div>
      )}

      {/* Nav buttons */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3.5 rounded-xl font-black text-sm transition-all"
          style={{
            background: agreed
              ? "linear-gradient(135deg,#F59E0B,#FCD34D)"
              : "rgba(255,255,255,0.06)",
            color: agreed ? "#07071a" : "rgba(255,255,255,0.25)",
            border: agreed ? "none" : "1px solid rgba(255,255,255,0.08)",
            cursor: agreed ? "pointer" : "not-allowed",
            boxShadow: agreed ? "0 6px 20px rgba(245,158,11,0.35)" : "none",
          }}
        >
          {agreed ? "Review Tournament →" : "Accept Terms to Continue"}
        </button>
      </div>
    </div>
  );
};

export default AgreementStep;

