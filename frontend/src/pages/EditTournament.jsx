import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentAPI } from '../api/tournament';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../utils/imageUrl';
import {
  ArrowLeft,
  Layers,
  Trash2,
  Calendar,
  CreditCard,
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
  Upload,
  X,
  QrCode,
} from 'lucide-react';

const B = {
  bg: '#07071a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  input: 'rgba(0,0,0,0.3)',
  inputBorder: 'rgba(255,255,255,0.1)',
  green: '#00ff88',
  cyan: '#00d4ff',
  purple: '#a855f7',
};

const EditTournament = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    registrationOpenDate: '',
    registrationCloseDate: '',
    startDate: '',
    endDate: '',
    upiId: '',
    accountHolderName: '',
  });

  const [newQRFile, setNewQRFile] = useState(null);
  const [newQRPreview, setNewQRPreview] = useState(null);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getTournament(id);
      const t = response.data;

      if (user?.id !== t.organizerId) {
        navigate(`/tournaments/${id}`);
        return;
      }

      setTournament(t);
      setFormData({
        registrationOpenDate: formatDateForInput(t.registrationOpenDate),
        registrationCloseDate: formatDateForInput(t.registrationCloseDate),
        startDate: formatDateForInput(t.startDate),
        endDate: formatDateForInput(t.endDate),
        upiId: t.upiId || '',
        accountHolderName: t.accountHolderName || '',
      });
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
      return dateString.slice(0, 16);
    }
    return dateString;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleQRFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return; }
      if (file.size > 5 * 1024 * 1024) { setError('Image size should be less than 5MB'); return; }
      setNewQRFile(file);
      setNewQRPreview(URL.createObjectURL(file));
    }
  };

  const removeNewQR = () => {
    if (newQRPreview) URL.revokeObjectURL(newQRPreview);
    setNewQRFile(null);
    setNewQRPreview(null);
  };

  const handleSaveDates = async () => {
    setSaving(true);
    setError(null);
    try {
      await tournamentAPI.updateTournament(id, {
        registrationOpenDate: formData.registrationOpenDate,
        registrationCloseDate: formData.registrationCloseDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      setSuccess('Dates updated successfully!');
      fetchTournament();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update dates'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentInfo = async () => {
    setSaving(true);
    setError(null);
    try {
      if (newQRFile) {
        await tournamentAPI.uploadPaymentQR(id, newQRFile, formData.upiId, formData.accountHolderName);
        setNewQRFile(null);
        setNewQRPreview(null);
      } else {
        await tournamentAPI.updatePaymentInfo(id, {
          upiId: formData.upiId,
          accountHolderName: formData.accountHolderName,
        });
      }
      setSuccess('Payment info updated!');
      fetchTournament();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update payment info'));
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: B.bg }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mx-auto"
            style={{ borderColor: `${B.green} transparent transparent transparent` }} />
          <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: B.bg }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: '#f87171' }} />
          <p className="text-white font-bold mb-4">Tournament not found</p>
          <button onClick={() => navigate('/tournaments')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
            Browse Tournaments
          </button>
        </div>
      </div>
    );
  }

  // ── Common field style ────────────────────────────────────────────────────
  const inputStyle = {
    background: B.input,
    border: `1.5px solid ${B.inputBorder}`,
    outline: 'none',
    colorScheme: 'dark',
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: B.bg }}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Header */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeft className="h-4 w-4" /> Back to Tournament
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.3),rgba(124,58,237,0.2))', border: '1px solid rgba(168,85,247,0.4)' }}>
            <Settings className="w-5 h-5" style={{ color: B.purple }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Edit Tournament</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{tournament.name}</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-xs font-semibold flex-1" style={{ color: '#f87171' }}>{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4" style={{ color: '#f87171' }} /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: B.green }} />
            <p className="text-xs font-semibold flex-1" style={{ color: B.green }}>{success}</p>
            <button onClick={() => setSuccess(null)}><X className="w-4 h-4" style={{ color: B.green }} /></button>
          </div>
        )}

        <div className="space-y-4">

          {/* ── Tournament Dates ─────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            {/* Section header */}
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(0,255,136,0.04)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}>
                <Calendar className="w-4 h-4" style={{ color: B.green }} />
              </div>
              <h2 className="text-sm font-black text-white">Tournament Dates</h2>
            </div>

            <div className="p-4 space-y-4">
              {[
                { label: 'Registration Opens', field: 'registrationOpenDate' },
                { label: 'Registration Closes', field: 'registrationCloseDate' },
                { label: 'Tournament Starts', field: 'startDate' },
                { label: 'Tournament Ends', field: 'endDate' },
              ].map(({ label, field }) => (
                <div key={field}>
                  <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {label}
                  </label>
                  <input
                    type="datetime-local"
                    value={formData[field]}
                    onChange={e => handleChange(field, e.target.value)}
                    className="w-full px-3 py-3 rounded-xl text-white text-sm"
                    style={inputStyle}
                  />
                </div>
              ))}

              <button
                onClick={handleSaveDates}
                disabled={saving}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg,#00c853,#00ff88)',
                  color: '#07071a',
                  boxShadow: '0 4px 15px rgba(0,200,83,0.35)',
                }}
              >
                {saving
                  ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#07071a transparent transparent transparent' }} />
                  : <Save className="w-4 h-4" />}
                Save Dates
              </button>
            </div>
          </div>

          {/* ── Payment QR ───────────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(0,212,255,0.04)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)' }}>
                <CreditCard className="w-4 h-4" style={{ color: B.cyan }} />
              </div>
              <h2 className="text-sm font-black text-white">Payment QR Code</h2>
            </div>

            <div className="p-4 space-y-4">
              {/* QR preview */}
              {newQRPreview ? (
                <div className="relative w-fit mx-auto">
                  <div className="p-2 bg-white rounded-xl">
                    <img src={newQRPreview} alt="New QR" className="w-44 h-44 object-contain rounded-lg" />
                  </div>
                  <button onClick={removeNewQR}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: '#ef4444' }}>
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                  <p className="text-center text-xs font-bold mt-2" style={{ color: '#fbbf24' }}>New QR (not saved yet)</p>
                </div>
              ) : tournament.paymentQRUrl ? (
                <div className="w-fit mx-auto p-2 bg-white rounded-xl">
                  <img src={getImageUrl(tournament.paymentQRUrl)} alt="Payment QR" className="w-44 h-44 object-contain rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <QrCode className="w-10 h-10 mb-2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>No QR uploaded yet</p>
                </div>
              )}

              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: B.cyan }}
              >
                <Upload className="h-4 w-4" />
                {tournament.paymentQRUrl ? 'Change QR Code' : 'Upload QR Code'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQRFileSelect} className="hidden" />

              {/* UPI + Account */}
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>UPI ID</label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={e => handleChange('upiId', e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full px-3 py-3 rounded-xl text-white text-sm"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Account Holder Name</label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={e => handleChange('accountHolderName', e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-3 rounded-xl text-white text-sm"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={handleSavePaymentInfo}
                disabled={saving}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg,rgba(0,212,255,0.8),rgba(0,150,200,0.9))',
                  color: '#07071a',
                  boxShadow: '0 4px 15px rgba(0,212,255,0.25)',
                }}
              >
                {saving
                  ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#07071a transparent transparent transparent' }} />
                  : <Save className="w-4 h-4" />}
                Save Payment Info
              </button>
            </div>
          </div>

          {/* ── Manage Categories ─────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(168,85,247,0.04)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <Layers className="w-4 h-4" style={{ color: B.purple }} />
              </div>
              <h2 className="text-sm font-black text-white">Categories & Entry Fees</h2>
            </div>

            <div className="p-4">
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Manage categories, entry fees, prize money and participant limits.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/tournaments/${id}/categories`)}
                  className="flex-1 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg,rgba(168,85,247,0.8),rgba(124,58,237,0.9))',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(168,85,247,0.3)',
                  }}
                >
                  <Layers className="w-4 h-4" />
                  Manage Categories
                </button>
                {tournament.categories?.length > 0 && (
                  <span className="text-xs font-bold flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {tournament.categories.length} configured
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EditTournament;
