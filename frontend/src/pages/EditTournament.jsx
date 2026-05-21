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
  Image,
  MapPin,
  Info,
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
  amber: '#fbbf24',
};

/**
 * Compress an image file client-side using Canvas API.
 * Keeps each image under 1.5 MB to stay well under Vercel's 4.5 MB
 * request-body limit for serverless functions.
 * Falls back to the original file on any error.
 */
function compressImage(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(file); return; }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIM = 1200;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const tryQuality = (q) => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          if (blob.size <= 1.5 * 1024 * 1024 || q <= 0.3) {
            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            tryQuality(Math.max(0.3, q - 0.1));
          }
        }, 'image/jpeg', q);
      };
      tryQuality(0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

const ZONES = ['North', 'South', 'East', 'West', 'Central', 'Northeast'];
const FORMATS = ['singles', 'doubles', 'both'];
const PRIVACY = ['public', 'private'];

const EditTournament = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const posterInputRef = useRef(null);

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Info fields
  const [infoData, setInfoData] = useState({
    name: '',
    description: '',
    venue: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    zone: '',
    format: '',
    privacy: '',
    contactPhone: '',
    whatsappNumber: '',
  });

  // Date fields
  const [dateData, setDateData] = useState({
    registrationOpenDate: '',
    registrationCloseDate: '',
    startDate: '',
    endDate: '',
  });

  // Payment fields
  const [paymentData, setPaymentData] = useState({
    upiId: '',
    accountHolderName: '',
  });

  const [newQRFile, setNewQRFile] = useState(null);
  const [newQRPreview, setNewQRPreview] = useState(null);

  // Poster state
  const [newPosterFiles, setNewPosterFiles] = useState([]);
  const [newPosterPreviews, setNewPosterPreviews] = useState([]);
  const [deletingPosterId, setDeletingPosterId] = useState(null);
  const [uploadingPosters, setUploadingPosters] = useState(false);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  // Auto-dismiss error after 5s, success after 3s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [success]);

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
      setInfoData({
        name: t.name || '',
        description: t.description || '',
        venue: t.venue || '',
        address: t.address || '',
        city: t.city || '',
        state: t.state || '',
        pincode: t.pincode || '',
        zone: t.zone || '',
        format: t.format || '',
        privacy: t.privacy || 'public',
        contactPhone: t.contactPhone || '',
        whatsappNumber: t.whatsappNumber || '',
      });
      setDateData({
        registrationOpenDate: formatDateForInput(t.registrationOpenDate),
        registrationCloseDate: formatDateForInput(t.registrationCloseDate),
        startDate: formatDateForInput(t.startDate),
        endDate: formatDateForInput(t.endDate),
      });
      setPaymentData({
        upiId: t.upiId || '',
        accountHolderName: t.accountHolderName || '',
      });
    } catch (err) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const showMsg = (type, msg) => {
    if (type === 'error') { setError(msg); setSuccess(null); }
    else { setSuccess(msg); setError(null); }
  };

  // ── Save handlers ──────────────────────────────────────────────────────────

  const handleSaveInfo = async () => {
    setSaving(true);
    setError(null);
    try {
      await tournamentAPI.updateTournament(id, infoData);
      showMsg('success', 'Tournament details updated!');
      fetchTournament();
    } catch (err) {
      showMsg('error', getErrorMessage(err, 'Failed to update details'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDates = async () => {
    setSaving(true);
    setError(null);
    try {
      await tournamentAPI.updateTournament(id, dateData);
      showMsg('success', 'Dates updated!');
      fetchTournament();
    } catch (err) {
      showMsg('error', getErrorMessage(err, 'Failed to update dates'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentInfo = async () => {
    setSaving(true);
    setError(null);
    try {
      if (newQRFile) {
        const compressedQR = await compressImage(newQRFile);
        await tournamentAPI.uploadPaymentQR(id, compressedQR, paymentData.upiId, paymentData.accountHolderName);
        setNewQRFile(null);
        setNewQRPreview(null);
      } else {
        await tournamentAPI.updatePaymentInfo(id, paymentData);
      }
      showMsg('success', 'Payment info updated!');
      fetchTournament();
    } catch (err) {
      showMsg('error', getErrorMessage(err, 'Failed to update payment info'));
    } finally {
      setSaving(false);
    }
  };

  // ── QR handlers ────────────────────────────────────────────────────────────

  const handleQRFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { showMsg('error', 'Please upload an image file'); return; }
      if (file.size > 5 * 1024 * 1024) { showMsg('error', 'Image size must be under 5MB'); return; }
      setNewQRFile(file);
      setNewQRPreview(URL.createObjectURL(file));
    }
  };

  const removeNewQR = () => {
    if (newQRPreview) URL.revokeObjectURL(newQRPreview);
    setNewQRFile(null);
    setNewQRPreview(null);
  };

  // ── Poster handlers ────────────────────────────────────────────────────────

  const existingPosterCount = tournament?.posters?.length || 0;

  const handlePosterSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const total = existingPosterCount + newPosterFiles.length + files.length;
    if (total > 5) {
      showMsg('error', `Max 5 posters. Currently ${existingPosterCount} saved, ${newPosterFiles.length} queued.`);
      return;
    }

    const validFiles = [];
    const validPreviews = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) { showMsg('error', `${file.name} is not an image`); continue; }
      if (file.size > 10 * 1024 * 1024) { showMsg('error', `${file.name} exceeds 10MB`); continue; }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setNewPosterFiles(prev => [...prev, ...validFiles]);
    setNewPosterPreviews(prev => [...prev, ...validPreviews]);
    // reset input so same file can be reselected
    e.target.value = '';
  };

  const removeQueuedPoster = (idx) => {
    URL.revokeObjectURL(newPosterPreviews[idx]);
    setNewPosterFiles(prev => prev.filter((_, i) => i !== idx));
    setNewPosterPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUploadPosters = async () => {
    if (!newPosterFiles.length) return;
    setUploadingPosters(true);
    setError(null);
    try {
      // Compress images client-side before upload.
      // Vercel serverless functions have a 4.5 MB request-body limit.
      // Compression keeps each image ≤1.5 MB so even 3 posters at once
      // fit comfortably within that limit.
      const compressed = await Promise.all(newPosterFiles.map(compressImage));
      await tournamentAPI.uploadPosters(id, compressed);
      // revoke object-URL previews
      newPosterPreviews.forEach(URL.revokeObjectURL);
      setNewPosterFiles([]);
      setNewPosterPreviews([]);
      showMsg('success', 'Posters uploaded!');
      fetchTournament();
    } catch (err) {
      showMsg('error', getErrorMessage(err, 'Failed to upload posters'));
    } finally {
      setUploadingPosters(false);
    }
  };

  const handleDeletePoster = async (posterId) => {
    setDeletingPosterId(posterId);
    setError(null);
    try {
      await tournamentAPI.deletePoster(id, posterId);
      showMsg('success', 'Poster removed');
      fetchTournament();
    } catch (err) {
      showMsg('error', getErrorMessage(err, 'Failed to delete poster'));
    } finally {
      setDeletingPosterId(null);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

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

  if (loadError || (!loading && !tournament)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: B.bg }}>
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <AlertTriangle className="w-8 h-8" style={{ color: '#fbbf24' }} />
          </div>
          <p className="text-white font-black text-lg mb-1">Couldn't load tournament</p>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Check your connection and try again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setLoadError(false); setLoading(true); fetchTournament(); }}
              className="px-5 py-2.5 rounded-xl text-sm font-black"
              style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.3),rgba(124,58,237,0.2))', border: '1px solid rgba(168,85,247,0.4)', color: '#c084fc' }}>
              Try Again
            </button>
            <button onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputStyle = {
    background: B.input,
    border: `1.5px solid ${B.inputBorder}`,
    outline: 'none',
    colorScheme: 'dark',
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: B.bg }}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Header */}
        <button onClick={() => navigate(`/organizer/tournaments/${id}`)} className="flex items-center gap-1.5 mb-5 text-sm font-bold"
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
            style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.22)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
            <p className="text-xs font-semibold flex-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{error}</p>
            <button onClick={() => setError(null)} style={{ opacity: 0.5 }}><X className="w-4 h-4 text-white" /></button>
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

          {/* ── Tournament Info ──────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(168,85,247,0.04)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <Info className="w-4 h-4" style={{ color: B.purple }} />
              </div>
              <h2 className="text-sm font-black text-white">Tournament Details</h2>
            </div>
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Tournament Name</label>
                <input type="text" value={infoData.name}
                  onChange={e => setInfoData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-3 rounded-xl text-white text-sm" style={inputStyle} />
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Description</label>
                <textarea rows={3} value={infoData.description}
                  onChange={e => setInfoData(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-3 rounded-xl text-white text-sm resize-none"
                  style={inputStyle} />
              </div>
              {/* Venue */}
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Venue / Hall Name</label>
                <input type="text" value={infoData.venue}
                  onChange={e => setInfoData(p => ({ ...p, venue: e.target.value }))}
                  className="w-full px-3 py-3 rounded-xl text-white text-sm" style={inputStyle} />
              </div>
              {/* Address */}
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Address</label>
                <input type="text" value={infoData.address}
                  onChange={e => setInfoData(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-3 rounded-xl text-white text-sm" style={inputStyle} />
              </div>
              {/* City + State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>City</label>
                  <input type="text" value={infoData.city}
                    onChange={e => setInfoData(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl text-white text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>State</label>
                  <input type="text" value={infoData.state}
                    onChange={e => setInfoData(p => ({ ...p, state: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl text-white text-sm" style={inputStyle} />
                </div>
              </div>
              {/* Pincode + Zone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Pincode</label>
                  <input type="text" value={infoData.pincode}
                    onChange={e => setInfoData(p => ({ ...p, pincode: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl text-white text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Zone</label>
                  <select value={infoData.zone}
                    onChange={e => setInfoData(p => ({ ...p, zone: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl text-white text-sm" style={selectStyle}>
                    <option value="" style={{ background: '#1a1a2e' }}>Select Zone</option>
                    {ZONES.map(z => <option key={z} value={z} style={{ background: '#1a1a2e' }}>{z}</option>)}
                  </select>
                </div>
              </div>
              {/* Format + Privacy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Format</label>
                  <select value={infoData.format}
                    onChange={e => setInfoData(p => ({ ...p, format: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl text-white text-sm capitalize" style={selectStyle}>
                    {FORMATS.map(f => <option key={f} value={f} style={{ background: '#1a1a2e' }} className="capitalize">{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Visibility</label>
                  <select value={infoData.privacy}
                    onChange={e => setInfoData(p => ({ ...p, privacy: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl text-white text-sm capitalize" style={selectStyle}>
                    {PRIVACY.map(p => <option key={p} value={p} style={{ background: '#1a1a2e' }} className="capitalize">{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <p className="text-xs font-black text-white mb-0.5">Contact Information</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Optional — visible to players on the tournament page</p>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(168,85,247,0.9)' }}>📞 Contact Phone</label>
                  <div className="flex overflow-hidden rounded-xl" style={{ border: '1.5px solid rgba(168,85,247,0.3)' }}>
                    <span className="flex items-center px-3 text-sm font-bold flex-shrink-0"
                      style={{ background: 'rgba(168,85,247,0.12)', borderRight: '1px solid rgba(168,85,247,0.25)', color: 'rgba(168,85,247,0.9)' }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={(infoData.contactPhone || '').replace(/^\+?91/, '')}
                      onChange={e => setInfoData(p => ({ ...p, contactPhone: '+91' + e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="9876543210"
                      className="flex-1 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                      style={{ background: B.input }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'rgba(37,211,102,0.9)' }}>💬 WhatsApp Number</label>
                  <div className="flex overflow-hidden rounded-xl" style={{ border: '1.5px solid rgba(37,211,102,0.3)' }}>
                    <span className="flex items-center px-3 text-sm font-bold flex-shrink-0"
                      style={{ background: 'rgba(37,211,102,0.1)', borderRight: '1px solid rgba(37,211,102,0.2)', color: 'rgba(37,211,102,0.9)' }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={(infoData.whatsappNumber || '').replace(/^\+?91/, '')}
                      onChange={e => setInfoData(p => ({ ...p, whatsappNumber: '+91' + e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="9876543210 (leave blank if same as above)"
                      className="flex-1 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none"
                      style={{ background: B.input }}
                    />
                  </div>
                </div>
              </div>

              <button onClick={handleSaveInfo} disabled={saving}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.9),rgba(124,58,237,1))', color: '#fff', boxShadow: '0 4px 15px rgba(168,85,247,0.3)' }}>
                {saving
                  ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#fff transparent transparent transparent' }} />
                  : <Save className="w-4 h-4" />}
                Save Details
              </button>
            </div>
          </div>

          {/* ── Tournament Dates ─────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
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
                  <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</label>
                  <input type="datetime-local" value={dateData[field]}
                    onChange={e => setDateData(p => ({ ...p, [field]: e.target.value }))}
                    className="w-full px-3 py-3 rounded-xl text-white text-sm" style={inputStyle} />
                </div>
              ))}
              <button onClick={handleSaveDates} disabled={saving}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', color: '#07071a', boxShadow: '0 4px 15px rgba(0,255,136,0.35)' }}>
                {saving
                  ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#07071a transparent transparent transparent' }} />
                  : <Save className="w-4 h-4" />}
                Save Dates
              </button>
            </div>
          </div>

          {/* ── Tournament Posters ───────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(251,191,36,0.04)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <Image className="w-4 h-4" style={{ color: B.amber }} />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-black text-white">Tournament Posters</h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {existingPosterCount}/5 uploaded
                </p>
              </div>
            </div>
            <div className="p-4 space-y-4">

              {/* Existing posters grid */}
              {tournament.posters?.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Current Posters</p>
                  <div className="grid grid-cols-3 gap-2">
                    {tournament.posters.map((poster) => (
                      <div key={poster.id} className="relative rounded-xl overflow-hidden aspect-[3/4]"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={getImageUrl(poster.imageUrl)} alt="poster"
                          className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleDeletePoster(poster.id)}
                          disabled={deletingPosterId === poster.id}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: deletingPosterId === poster.id ? 'rgba(0,0,0,0.6)' : '#ef4444' }}>
                          {deletingPosterId === poster.id
                            ? <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#fff transparent transparent transparent' }} />
                            : <X className="w-3 h-3 text-white" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Queued new posters */}
              {newPosterPreviews.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: B.amber }}>Ready to Upload ({newPosterPreviews.length})</p>
                  <div className="grid grid-cols-3 gap-2">
                    {newPosterPreviews.map((src, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden aspect-[3/4]"
                        style={{ border: `1px solid ${B.amber}44` }}>
                        <img src={src} alt="new poster" className="w-full h-full object-cover" />
                        <button onClick={() => removeQueuedPoster(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: '#ef4444' }}>
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No posters state */}
              {existingPosterCount === 0 && newPosterPreviews.length === 0 && (
                <div className="flex flex-col items-center py-8 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <Image className="w-10 h-10 mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>No posters uploaded yet</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Posters appear on the tournament page</p>
                </div>
              )}

              {/* Upload button — only if under 5 */}
              {existingPosterCount + newPosterPreviews.length < 5 && (
                <button onClick={() => posterInputRef.current?.click()}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'rgba(251,191,36,0.08)', border: `1px solid rgba(251,191,36,0.25)`, color: B.amber }}>
                  <Upload className="h-4 w-4" />
                  Add Poster{existingPosterCount + newPosterPreviews.length > 0 ? 's' : ''} ({5 - existingPosterCount - newPosterPreviews.length} remaining)
                </button>
              )}
              <input ref={posterInputRef} type="file" accept="image/*" multiple onChange={handlePosterSelect} className="hidden" />

              {/* Save posters button */}
              {newPosterFiles.length > 0 && (
                <button onClick={handleUploadPosters} disabled={uploadingPosters}
                  className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg,${B.amber},#f59e0b)`, color: '#07071a', boxShadow: '0 4px 15px rgba(251,191,36,0.3)' }}>
                  {uploadingPosters
                    ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#07071a transparent transparent transparent' }} />
                    : <Upload className="w-4 h-4" />}
                  Upload {newPosterFiles.length} Poster{newPosterFiles.length > 1 ? 's' : ''}
                </button>
              )}
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

              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: B.cyan }}>
                <Upload className="h-4 w-4" />
                {tournament.paymentQRUrl ? 'Change QR Code' : 'Upload QR Code'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleQRFileSelect} className="hidden" />

              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>UPI ID</label>
                <input type="text" value={paymentData.upiId}
                  onChange={e => setPaymentData(p => ({ ...p, upiId: e.target.value }))}
                  placeholder="yourname@upi"
                  className="w-full px-3 py-3 rounded-xl text-white text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>Account Holder Name</label>
                <input type="text" value={paymentData.accountHolderName}
                  onChange={e => setPaymentData(p => ({ ...p, accountHolderName: e.target.value }))}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-3 rounded-xl text-white text-sm" style={inputStyle} />
              </div>

              <button onClick={handleSavePaymentInfo} disabled={saving}
                className="w-full py-3.5 rounded-xl font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.8),rgba(0,150,200,0.9))', color: '#07071a', boxShadow: '0 4px 15px rgba(0,212,255,0.25)' }}>
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
                <button onClick={() => navigate(`/tournaments/${id}/categories`)}
                  className="flex-1 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.8),rgba(124,58,237,0.9))', color: '#fff', boxShadow: '0 4px 15px rgba(168,85,247,0.3)' }}>
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
