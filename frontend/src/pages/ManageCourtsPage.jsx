import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Plus, Edit3, Trash2, ToggleLeft, ToggleRight,
  Clock, IndianRupee, ChevronDown, ChevronUp, Check, X,
  Calendar, Layers
} from 'lucide-react';
import api from '../utils/api';

const B = {
  bg: '#0a0a0f', card: '#12121a', card2: '#1a1a26',
  border: 'rgba(255,255,255,0.07)',
  cyan: '#FCD34D', green: '#F59E0B', amber: '#f59e0b',
  red: '#ef4444', purple: '#8B5CF6',
  text: 'rgba(255,255,255,0.85)', muted: 'rgba(255,255,255,0.45)',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SPORTS = ['Badminton', 'Tennis', 'Squash', 'Table Tennis', 'Basketball', 'Football', 'Cricket', 'Swimming'];

const TIME_OPTIONS = [];
for (let h = 5; h <= 23; h++) {
  for (let m of [0, 30]) {
    const hh = h.toString().padStart(2, '0');
    const mm = m.toString().padStart(2, '0');
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

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

function AvailabilityEditor({ availability, onSave, saving }) {
  const [avail, setAvail] = useState(
    DAYS.map((_, i) => {
      const existing = availability?.find(a => a.dayOfWeek === i);
      return existing || { dayOfWeek: i, openTime: '06:00', closeTime: '22:00', slotDuration: 60, isOpen: i !== 0 };
    })
  );

  function update(idx, field, val) {
    setAvail(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));
  }

  return (
    <div className="space-y-3">
      {avail.map((day, idx) => (
        <div key={idx} className="rounded-xl overflow-hidden" style={{ background: B.card2, border: `1px solid ${B.border}` }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => update(idx, 'isOpen', !day.isOpen)}>
              {day.isOpen
                ? <ToggleRight size={24} color={B.green} />
                : <ToggleLeft size={24} color={B.muted} />}
            </button>
            <p className="font-black text-white flex-1">{DAYS[idx]}</p>
            {!day.isOpen && <span className="text-xs font-bold" style={{ color: B.muted }}>Closed</span>}
          </div>
          {day.isOpen && (
            <div className="px-4 pb-3 grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: B.muted }}>Open</p>
                <select
                  value={day.openTime}
                  onChange={e => update(idx, 'openTime', e.target.value)}
                  className="w-full rounded-lg px-2 py-1.5 text-xs font-bold text-white"
                  style={{ background: B.bg, border: `1px solid ${B.border}` }}
                >
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: B.muted }}>Close</p>
                <select
                  value={day.closeTime}
                  onChange={e => update(idx, 'closeTime', e.target.value)}
                  className="w-full rounded-lg px-2 py-1.5 text-xs font-bold text-white"
                  style={{ background: B.bg, border: `1px solid ${B.border}` }}
                >
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: B.muted }}>Slot</p>
                <select
                  value={day.slotDuration}
                  onChange={e => update(idx, 'slotDuration', parseInt(e.target.value))}
                  className="w-full rounded-lg px-2 py-1.5 text-xs font-bold text-white"
                  style={{ background: B.bg, border: `1px solid ${B.border}` }}
                >
                  <option value={30}>30m</option>
                  <option value={60}>1hr</option>
                  <option value={90}>1.5hr</option>
                  <option value={120}>2hr</option>
                </select>
              </div>
            </div>
          )}
        </div>
      ))}
      <button
        onClick={() => onSave(avail)}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl font-black text-sm"
        style={{ background: saving ? B.card2 : `linear-gradient(135deg, ${B.green}, #D97706)`, color: saving ? B.muted : '#000' }}
      >
        {saving ? 'Saving…' : 'Save Availability'}
      </button>
    </div>
  );
}

function CourtCard({ court, onEdit, onToggle, onAvailability }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ background: `${B.cyan}15` }}>
            🏸
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-black text-white">{court.name}</p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                background: court.isActive ? `${B.green}20` : `${B.red}20`,
                color: court.isActive ? B.green : B.red
              }}>
                {court.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: B.muted }}>{court.sport}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <IndianRupee size={12} color={B.cyan} />
                <span className="text-sm font-black" style={{ color: B.cyan }}>₹{court.pricePerHour}/hr</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} color={B.muted} />
                <span className="text-xs" style={{ color: B.muted }}>
                  {court.availability?.filter(a => a.isOpen).length || 0}/7 days open
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: B.card2, color: B.cyan, border: `1px solid ${B.border}` }}
          >
            <Calendar size={14} />
            Availability
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={() => onEdit(court)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            style={{ background: B.card2, color: B.text, border: `1px solid ${B.border}` }}
          >
            <Edit3 size={14} />
            Edit
          </button>
          <button
            onClick={() => onToggle(court)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: B.card2, border: `1px solid ${B.border}` }}
          >
            {court.isActive ? <ToggleRight size={18} color={B.green} /> : <ToggleLeft size={18} color={B.muted} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${B.border}` }}>
          <p className="text-xs font-black pt-3 pb-2" style={{ color: B.muted }}>AVAILABILITY SCHEDULE</p>
          <AvailabilityEditor
            availability={court.availability}
            onSave={(avail) => onAvailability(court.id, avail)}
            saving={false}
          />
        </div>
      )}
    </div>
  );
}

function CourtForm({ court, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: court?.name || '',
    sport: court?.sport || 'Badminton',
    description: court?.description || '',
    pricePerHour: court?.pricePerHour || '',
  });

  function set(field, val) { setForm(p => ({ ...p, [field]: val })); }

  const isValid = form.name && form.sport && form.pricePerHour;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-black mb-1.5 block" style={{ color: B.text }}>Court Name</label>
        <input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Court 1, Main Badminton Court"
          className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-gray-600"
          style={{ background: B.card2, border: `1px solid ${B.border}` }}
        />
      </div>

      <div>
        <label className="text-sm font-black mb-1.5 block" style={{ color: B.text }}>Sport</label>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map(s => (
            <button
              key={s}
              onClick={() => set('sport', s)}
              className="px-3 py-1.5 rounded-xl text-xs font-black"
              style={{
                background: form.sport === s ? `${B.cyan}20` : B.card2,
                color: form.sport === s ? B.cyan : B.muted,
                border: `1px solid ${form.sport === s ? B.cyan + '40' : B.border}`
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-black mb-1.5 block" style={{ color: B.text }}>Price per Hour (₹)</label>
        <input
          type="number"
          value={form.pricePerHour}
          onChange={e => set('pricePerHour', e.target.value)}
          placeholder="e.g. 300"
          className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-gray-600"
          style={{ background: B.card2, border: `1px solid ${B.border}` }}
        />
      </div>

      <div>
        <label className="text-sm font-black mb-1.5 block" style={{ color: B.text }}>Description (optional)</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Any special notes about this court…"
          rows={3}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-gray-600 resize-none"
          style={{ background: B.card2, border: `1px solid ${B.border}` }}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3.5 rounded-2xl font-black text-sm"
          style={{ background: B.card2, color: B.muted, border: `1px solid ${B.border}` }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={!isValid || saving}
          className="flex-1 py-3.5 rounded-2xl font-black text-sm"
          style={{
            background: isValid && !saving ? `linear-gradient(135deg, ${B.cyan}, #0099bb)` : B.card2,
            color: isValid && !saving ? '#000' : B.muted
          }}
        >
          {saving ? 'Saving…' : court ? 'Update Court' : 'Add Court'}
        </button>
      </div>
    </div>
  );
}

export default function ManageCourtsPage() {
  const { academyId } = useParams();
  const navigate = useNavigate();
  const [courts, setCourts] = useState([]);
  const [academy, setAcademy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  }

  useEffect(() => { loadCourts(); }, [academyId]);

  async function loadCourts() {
    try {
      setLoading(true);
      const res = await api.get(`/owner/academies/${academyId}/courts`);
      setCourts(res.data.data.courts);
      setAcademy(res.data.data.academy);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load courts', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCourt(form) {
    try {
      setSaving(true);
      await api.post(`/owner/academies/${academyId}/courts`, form);
      showToast('Court added!');
      setShowAddForm(false);
      loadCourts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add court', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditCourt(form) {
    try {
      setSaving(true);
      await api.put(`/owner/academies/${academyId}/courts/${editingCourt.id}`, form);
      showToast('Court updated!');
      setEditingCourt(null);
      loadCourts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update court', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(court) {
    try {
      await api.put(`/owner/academies/${academyId}/courts/${court.id}`, { isActive: !court.isActive });
      showToast(`Court ${!court.isActive ? 'activated' : 'deactivated'}`);
      loadCourts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to toggle', 'error');
    }
  }

  async function handleAvailability(courtId, avail) {
    try {
      await api.put(`/owner/academies/${academyId}/courts/${courtId}/availability`, { availability: avail });
      showToast('Availability saved!');
      loadCourts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save availability', 'error');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: B.bg, paddingBottom: 40 }}>
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '' })} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <ArrowLeft size={16} color={B.text} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">Manage Courts</h1>
          {academy && <p className="text-xs" style={{ color: B.muted }}>{academy.name}</p>}
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingCourt(null); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black"
          style={{ background: `${B.cyan}20`, color: B.cyan, border: `1px solid ${B.cyan}40` }}
        >
          <Plus size={14} />
          Add Court
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Add form */}
        {showAddForm && (
          <div className="rounded-2xl p-4" style={{ background: B.card, border: `1px solid ${B.cyan}30` }}>
            <p className="text-sm font-black text-white mb-4">New Court</p>
            <CourtForm onSave={handleAddCourt} onCancel={() => setShowAddForm(false)} saving={saving} />
          </div>
        )}

        {/* Edit form */}
        {editingCourt && (
          <div className="rounded-2xl p-4" style={{ background: B.card, border: `1px solid ${B.amber}30` }}>
            <p className="text-sm font-black text-white mb-4">Edit — {editingCourt.name}</p>
            <CourtForm court={editingCourt} onSave={handleEditCourt} onCancel={() => setEditingCourt(null)} saving={saving} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(245,158,11,0.15)', borderTopColor: B.cyan, animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : courts.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl" style={{ background: B.card }}>🏸</div>
            <p className="text-white font-black">No Courts Yet</p>
            <p className="text-xs text-center" style={{ color: B.muted }}>Add your first court to start accepting bookings</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${B.cyan}, #0099bb)`, color: '#000' }}
            >
              <Plus size={16} />
              Add First Court
            </button>
          </div>
        ) : (
          courts.map(court => (
            <CourtCard
              key={court.id}
              court={court}
              onEdit={c => { setEditingCourt(c); setShowAddForm(false); }}
              onToggle={handleToggle}
              onAvailability={handleAvailability}
            />
          ))
        )}

        {/* Go to bookings */}
        {courts.length > 0 && (
          <button
            onClick={() => navigate(`/owner/academies/${academyId}/bookings`)}
            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
            style={{ background: B.card, border: `1px solid ${B.border}`, color: B.cyan }}
          >
            <Calendar size={16} />
            View Bookings
          </button>
        )}
      </div>
    </div>
  );
}


