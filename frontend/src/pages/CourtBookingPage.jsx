import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, IndianRupee, ChevronLeft,
  ChevronRight, Upload, CheckCircle, X, Check, AlertCircle
} from 'lucide-react';
import api from '../utils/api';
import { fetchUpload } from '../utils/fetchUpload';
import LoadingScreen from '../components/LoadingScreen';

const B = {
  bg: '#0a0a0f', card: '#12121a', card2: '#1a1a26',
  border: 'rgba(255,255,255,0.07)',
  cyan: '#FCD34D', green: '#F59E0B', amber: '#f59e0b',
  red: '#ef4444',
  text: 'rgba(255,255,255,0.85)', muted: 'rgba(255,255,255,0.45)',
};

const STEP_LABELS = ['Select Date', 'Pick Slot', 'Pay & Confirm'];

function Toast({ msg, type, onClose }) {
  if (!msg) return null;
  const color = type === 'error' ? B.red : B.green;
  return (
    <div className="fixed top-4 left-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: color + '15', border: `1px solid ${color}40`, backdropFilter: 'blur(12px)' }}>
      {type === 'error' ? <X size={16} color={color} /> : <Check size={16} color={color} />}
      <p className="text-sm font-bold flex-1" style={{ color }}>{msg}</p>
      <button onClick={onClose}><X size={14} color={B.muted} /></button>
    </div>
  );
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-1 px-4 pb-4">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
              style={{
                background: i < step ? B.green : i === step ? B.cyan : B.card2,
                color: i <= step ? '#000' : B.muted,
                border: i > step ? `1px solid ${B.border}` : 'none'
              }}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span className="text-xs font-bold hidden sm:block" style={{ color: i === step ? 'white' : B.muted }}>
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div className="flex-1 h-px mx-1" style={{ background: i < step ? B.green : B.border }} />
          )}
        </div>
      ))}
    </div>
  );
}

// Generate 14 days from today
function generateDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    dates.push({
      iso,
      day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      isToday: i === 0
    });
  }
  return dates;
}

function formatTime12(t) {
  if (!t) return t;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function CourtBookingPage() {
  const { academyId, courtId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0=date, 1=slot, 2=payment
  const [court, setCourt] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const fileRef = useRef();
  const dates = generateDates();

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '' }), 4000);
  }

  useEffect(() => {
    loadCourtAndAcademy();
  }, [courtId, academyId]);

  async function loadCourtAndAcademy() {
    try {
      setLoading(true);
      const [courtRes, acadRes] = await Promise.allSettled([
        api.get(`/academies/${academyId}/courts`),
        api.get(`/academies/${academyId}`)
      ]);
      const allCourts = courtRes.value?.data?.data?.courts || [];
      const found = allCourts.find(c => c.id === courtId);
      setCourt(found || null);
      const raw = acadRes.value?.data?.data?.academy;
      if (raw) {
        setAcademy({
          ...raw,
          sports: Array.isArray(raw.sports) ? raw.sports : JSON.parse(raw.sports || '[]'),
        });
      }
    } catch (err) {
      showToast('Failed to load court details', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadSlots(date) {
    try {
      setLoadingSlots(true);
      setSlots([]);
      const res = await api.get(`/courts/${courtId}/slots`, { params: { date } });
      const data = res.data.data;
      if (data.closed) {
        setSlots([]);
        showToast('Court is closed on this day', 'error');
      } else {
        setSlots(data.slots || []);
      }
    } catch (err) {
      showToast('Failed to load slots', 'error');
    } finally {
      setLoadingSlots(false);
    }
  }

  function selectDate(d) {
    setSelectedDate(d);
    setSelectedSlot(null);
    loadSlots(d.iso);
    setStep(1);
  }

  function selectSlot(slot) {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setStep(2);
  }

  function handleScreenshot(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshot(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!selectedSlot || !selectedDate) return;
    if (!screenshot) {
      showToast('Please upload your payment screenshot', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('courtId', courtId);
      formData.append('bookingDate', selectedDate.iso);
      formData.append('startTime', selectedSlot.startTime);
      formData.append('endTime', selectedSlot.endTime);
      formData.append('durationMinutes', selectedSlot.durationMinutes);
      formData.append('amount', selectedSlot.price);
      if (notes) formData.append('notes', notes);
      formData.append('paymentScreenshot', screenshot);

      await fetchUpload('/court-bookings', formData);

      setBookingDone(true);
    } catch (err) {
      showToast(err.response?.data?.error || 'Booking failed. Try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ────────────────────────────────────────────────────
  if (bookingDone) {
    return (
      <div style={{ minHeight: '100vh', background: B.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: 20 }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${B.green}20`, border: `2px solid ${B.green}40` }}>
          <CheckCircle size={40} color={B.green} />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-white mb-2">Booking Submitted!</h2>
          <p className="text-sm leading-relaxed" style={{ color: B.muted }}>
            Your booking request has been sent to the academy.<br />
            They'll confirm after verifying your payment.
          </p>
        </div>
        <div className="w-full rounded-2xl p-4 space-y-2" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: B.muted }}>Court</span>
            <span className="text-xs font-black text-white">{court?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: B.muted }}>Date</span>
            <span className="text-xs font-black text-white">
              {selectedDate && new Date(selectedDate.iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: B.muted }}>Time</span>
            <span className="text-xs font-black text-white">{formatTime12(selectedSlot?.startTime)} – {formatTime12(selectedSlot?.endTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs" style={{ color: B.muted }}>Amount</span>
            <span className="text-xs font-black" style={{ color: B.cyan }}>₹{selectedSlot?.price}</span>
          </div>
        </div>
        <div className="flex gap-3 w-full">
          <button onClick={() => navigate('/my-bookings')}
            className="flex-1 py-4 rounded-2xl font-black text-sm"
            style={{ background: `linear-gradient(135deg, ${B.cyan}, #0099bb)`, color: '#000' }}>
            My Bookings
          </button>
          <button onClick={() => navigate(`/academies/${academyId}`)}
            className="flex-1 py-4 rounded-2xl font-black text-sm"
            style={{ background: B.card, border: `1px solid ${B.border}`, color: B.muted }}>
            Back to Academy
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Loading court availability..." />;
  }

  const upiId = academy?.upiId;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const upiDeepLink = upiId && selectedSlot
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(academy?.name || 'Academy')}&am=${selectedSlot.price}&cu=INR&tn=${encodeURIComponent(`Court Booking - ${court?.name}`)}`
    : null;

  return (
    <div style={{ minHeight: '100vh', background: B.bg, paddingBottom: 40 }}>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <ArrowLeft size={16} color={B.text} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">{court?.name || 'Book Court'}</h1>
          {court && <p className="text-xs" style={{ color: B.muted }}>{court.sport} · ₹{court.pricePerHour}/hr</p>}
        </div>
      </div>

      <StepIndicator step={step} />

      <div className="px-4 space-y-4">

        {/* ── Step 0: Date ── */}
        {step === 0 && (
          <>
            <div className="rounded-2xl p-4" style={{ background: B.card, border: `1px solid ${B.border}` }}>
              <p className="text-sm font-black text-white mb-3">Select Date</p>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {dates.map(d => (
                  <button
                    key={d.iso}
                    onClick={() => selectDate(d)}
                    className="flex-shrink-0 w-14 flex flex-col items-center py-3 rounded-xl transition-all active:scale-95"
                    style={{
                      background: selectedDate?.iso === d.iso ? `${B.cyan}20` : B.card2,
                      border: `1px solid ${selectedDate?.iso === d.iso ? B.cyan + '50' : B.border}`,
                    }}
                  >
                    <span className="text-xs font-bold" style={{ color: d.isToday ? B.cyan : B.muted }}>
                      {d.isToday ? 'Today' : d.day}
                    </span>
                    <span className="text-lg font-black text-white">{d.date}</span>
                    <span className="text-xs" style={{ color: B.muted }}>{d.month}</span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: B.muted }}>Tap a date to see available slots</p>
          </>
        )}

        {/* ── Step 1: Slot ── */}
        {step === 1 && (
          <>
            {/* Selected date summary */}
            <button onClick={() => setStep(0)} className="w-full rounded-2xl p-3 flex items-center gap-3"
              style={{ background: B.card, border: `1px solid ${B.cyan}30` }}>
              <Calendar size={16} color={B.cyan} />
              <div className="flex-1 text-left">
                <p className="text-xs" style={{ color: B.muted }}>Selected date</p>
                <p className="text-sm font-black text-white">
                  {selectedDate && new Date(selectedDate.iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <span className="text-xs font-bold" style={{ color: B.cyan }}>Change</span>
            </button>

            <div className="rounded-2xl p-4" style={{ background: B.card, border: `1px solid ${B.border}` }}>
              <p className="text-sm font-black text-white mb-3">Available Slots</p>
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid rgba(0,212,255,0.15)', borderTopColor: B.cyan, animation: 'spin 0.7s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle size={32} color={B.muted} className="mx-auto mb-2" />
                  <p className="text-sm font-black text-white">No slots available</p>
                  <p className="text-xs mt-1" style={{ color: B.muted }}>Try a different date</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot.startTime}
                      onClick={() => selectSlot(slot)}
                      disabled={!slot.available}
                      className="py-3 rounded-xl text-center transition-all active:scale-95"
                      style={{
                        background: !slot.available ? B.card2
                          : selectedSlot?.startTime === slot.startTime ? `${B.cyan}20` : B.card2,
                        border: `1px solid ${!slot.available ? 'transparent'
                          : selectedSlot?.startTime === slot.startTime ? B.cyan + '50' : B.border}`,
                        opacity: !slot.available ? 0.35 : 1,
                        cursor: !slot.available ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <p className="text-xs font-black" style={{ color: !slot.available ? B.muted : selectedSlot?.startTime === slot.startTime ? B.cyan : 'white' }}>
                        {formatTime12(slot.startTime)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: B.muted }}>
                        {slot.available ? `₹${slot.price}` : 'Booked'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Step 2: Payment ── */}
        {step === 2 && (
          <>
            {/* Booking summary */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: B.card, border: `1px solid ${B.border}` }}>
              <p className="text-sm font-black text-white">Booking Summary</p>
              <div className="space-y-2">
                {[
                  { label: 'Court', value: court?.name },
                  { label: 'Date', value: selectedDate && new Date(selectedDate.iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) },
                  { label: 'Time', value: `${formatTime12(selectedSlot?.startTime)} – ${formatTime12(selectedSlot?.endTime)}` },
                  { label: 'Duration', value: `${selectedSlot?.durationMinutes} min` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-xs" style={{ color: B.muted }}>{r.label}</span>
                    <span className="text-xs font-black text-white">{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${B.border}` }}>
                  <span className="text-sm font-black text-white">Total</span>
                  <span className="text-sm font-black" style={{ color: B.cyan }}>₹{selectedSlot?.price}</span>
                </div>
              </div>
            </div>

            {/* Pay via UPI */}
            {upiId ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.amber}30` }}>
                <div className="px-4 py-3 flex items-center gap-2" style={{ background: `${B.amber}10`, borderBottom: `1px solid ${B.amber}20` }}>
                  <AlertCircle size={14} color={B.amber} />
                  <p className="text-xs font-black" style={{ color: B.amber }}>PAY BEFORE CONFIRMING</p>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs font-black mb-1" style={{ color: B.muted }}>UPI ID</p>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: B.card2, border: `1px solid ${B.border}` }}>
                      <span className="text-sm font-black text-white flex-1">{upiId}</span>
                      <button onClick={() => { navigator.clipboard.writeText(upiId); showToast('UPI ID copied!'); }}
                        className="text-xs font-bold" style={{ color: B.cyan }}>Copy</button>
                    </div>
                  </div>

                  {/* QR via API */}
                  <div className="flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(academy?.name || 'Academy')}&am=${selectedSlot?.price}&cu=INR`)}`}
                      alt="UPI QR"
                      className="rounded-xl"
                      style={{ width: 180, height: 180 }}
                    />
                  </div>

                  {isAndroid && upiDeepLink && (
                    <a href={upiDeepLink}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl w-full font-black text-sm"
                      style={{ background: `${B.green}20`, color: B.green, border: `1px solid ${B.green}40` }}>
                      📲 Pay ₹{selectedSlot?.price} with UPI App
                    </a>
                  )}

                  {!isAndroid && !upiDeepLink && (
                    <p className="text-xs text-center" style={{ color: B.muted }}>
                      📱 On iPhone, scan QR with your camera app
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-4" style={{ background: B.card, border: `1px solid ${B.border}` }}>
                <p className="text-sm font-black text-white mb-1">Payment</p>
                <p className="text-xs" style={{ color: B.muted }}>Contact the academy to arrange payment: {academy?.phone}</p>
              </div>
            )}

            {/* Screenshot upload */}
            <div className="rounded-2xl p-4" style={{ background: B.card, border: `1px solid ${B.border}` }}>
              <p className="text-sm font-black text-white mb-1">Upload Payment Screenshot</p>
              <p className="text-xs mb-3" style={{ color: B.muted }}>After paying, upload the screenshot to confirm your booking</p>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleScreenshot} />

              {screenshotPreview ? (
                <div className="relative">
                  <img src={screenshotPreview} alt="Payment screenshot" className="w-full rounded-xl object-cover" style={{ maxHeight: 200 }} />
                  <button
                    onClick={() => { setScreenshot(null); setScreenshotPreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <X size={16} color="white" />
                  </button>
                  <button
                    onClick={() => fileRef.current.click()}
                    className="mt-2 w-full py-2.5 rounded-xl text-xs font-bold"
                    style={{ background: B.card2, color: B.muted, border: `1px solid ${B.border}` }}>
                    Change Screenshot
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current.click()}
                  className="w-full py-8 rounded-xl flex flex-col items-center gap-2 transition-all"
                  style={{ background: B.card2, border: `2px dashed ${B.border}` }}>
                  <Upload size={24} color={B.muted} />
                  <span className="text-sm font-bold" style={{ color: B.muted }}>Tap to upload screenshot</span>
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="rounded-2xl p-4" style={{ background: B.card, border: `1px solid ${B.border}` }}>
              <p className="text-sm font-black text-white mb-2">Notes (optional)</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any special requests or notes for the academy…"
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 resize-none"
                style={{ background: B.card2, border: `1px solid ${B.border}` }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!screenshot || submitting}
              className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
              style={{
                background: screenshot && !submitting ? `linear-gradient(135deg, ${B.green}, #0891b2)` : B.card2,
                color: screenshot && !submitting ? '#000' : B.muted
              }}
            >
              <CheckCircle size={18} />
              {submitting ? 'Submitting Booking…' : 'Submit Booking Request'}
            </button>

            <p className="text-xs text-center" style={{ color: B.muted }}>
              Booking will be confirmed once the academy verifies your payment
            </p>
          </>
        )}
      </div>
    </div>
  );
}

