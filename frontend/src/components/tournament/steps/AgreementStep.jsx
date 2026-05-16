import { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

const TERMS = [
  {
    title: "Accurate Information",
    body: "All tournament details you provide (name, venue, dates, categories, prize money) are accurate and truthful. Matchify.pro is not responsible for incorrect information provided by organizers.",
  },
  {
    title: "Registration Fees & Payments",
    body: "You are solely responsible for collecting and managing registration fees from participants. Matchify.pro does not process or guarantee these payments. Any disputes between organizers and players regarding fees must be resolved directly.",
  },
  {
    title: "Fair Play & Conduct",
    body: "You agree to conduct the tournament in a fair, transparent, and non-discriminatory manner. Matchify.pro reserves the right to suspend organizer accounts for reports of misconduct, fraud, or unfair practices.",
  },
  {
    title: "Platform Commission",
    body: "You agree to Matchify.pro platform fee structure as communicated separately. Non-payment of platform fees may result in suspension of your organizer account.",
  },
  {
    title: "Cancellations & Refunds",
    body: "If you cancel a tournament after collecting fees, you are obligated to refund all registered participants. Matchify.pro may take action against organizers with unresolved refund complaints.",
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
    <div className="space-y-6">
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
          Read and accept the terms before publishing your tournament
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(168,85,247,0.2)",
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div
          className="max-h-72 overflow-y-auto px-5 py-4 space-y-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(168,85,247,0.3) transparent" }}
        >
          {TERMS.map((term, i) => (
            <div key={i}>
              <p className="text-sm font-bold text-white mb-0.5">
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

      <button
        type="button"
        onClick={() => { setAgreed(v => !v); setAttempted(false); }}
        className="w-full flex items-start gap-3 p-4 rounded-2xl transition-all text-left"
        style={{
          background: agreed
            ? "linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,212,255,0.08))"
            : attempted
            ? "rgba(239,68,68,0.08)"
            : "rgba(255,255,255,0.04)",
          border: `2px solid ${agreed ? "rgba(0,255,136,0.4)" : attempted ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.12)"}`,
        }}
      >
        <div className="flex-shrink-0 mt-0.5">
          {agreed ? (
            <CheckCircleSolid className="w-5 h-5" style={{ color: "#00ff88" }} />
          ) : (
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: attempted ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.25)" }}
            />
          )}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: agreed ? "#00ff88" : "rgba(255,255,255,0.85)" }}>
            I agree to the Organizer Terms &amp; Conditions
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            You must accept these terms to proceed to the review step
          </p>
        </div>
      </button>

      {attempted && !agreed && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
          <p className="text-xs font-semibold" style={{ color: "#ef4444" }}>
            You must accept the terms and conditions to continue
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
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
            background: agreed ? "linear-gradient(135deg,#00ff88,#00d4ff)" : "rgba(255,255,255,0.08)",
            color: agreed ? "#07071a" : "rgba(255,255,255,0.3)",
            border: agreed ? "none" : "1px solid rgba(255,255,255,0.1)",
            cursor: agreed ? "pointer" : "not-allowed",
          }}
        >
          Review Tournament
        </button>
      </div>
    </div>
  );
};

export default AgreementStep;
