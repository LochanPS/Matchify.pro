import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, XCircle, Eye, MapPin, Phone, Mail, Image, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';

const AcademyApprovalsPage = () => {
  const navigate = useNavigate();
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAcademy, setSelectedAcademy] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingAcademies();
  }, []);

  const fetchPendingAcademies = async () => {
    try {
      setLoading(true);
      const response = await api.get('/academies/admin/pending');
      if (response.data.success) {
        setAcademies(response.data.data.academies || []);
      }
    } catch (error) {
      console.error('Error fetching academies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await api.post(`/academies/admin/${id}/approve`);
      setAcademies(prev => prev.filter(a => a.id !== id));
      setShowModal(false);
      setSelectedAcademy(null);
    } catch (error) {
      console.error('Error approving academy:', error);
      alert('Failed to approve academy');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(true);
      await api.post(`/academies/admin/${id}/reject`, { reason: rejectReason });
      setAcademies(prev => prev.filter(a => a.id !== id));
      setShowModal(false);
      setSelectedAcademy(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting academy:', error);
      alert('Failed to reject academy');
    } finally {
      setActionLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-teal-400 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back</span>
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-purple-400" />
            Academy Approvals
          </h1>
          <p className="text-gray-400 mt-1">Review and approve academy submissions</p>
        </div>
        <div className="bg-purple-500/20 px-4 py-2 rounded-xl">
          <span className="text-purple-400 font-semibold">{academies.length} Pending</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : academies.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-white/10">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Pending Academies</h3>
          <p className="text-gray-400">All academy submissions have been reviewed</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {academies.map(academy => (
            <div key={academy.id} className="bg-slate-800/50 rounded-xl border border-white/10 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{academy.name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {academy.city}, {academy.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {academy.phone}
                    </span>
                    {academy.submittedByEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {academy.submittedByEmail}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {academy.sports?.map(sport => (
                      <span key={sport} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg">
                        {sport}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedAcademy(academy); setShowModal(true); }}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleApprove(academy.id)}
                    className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                    title="Approve"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setSelectedAcademy(academy); setShowModal(true); }}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Reject"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Detail Modal */}
      {showModal && selectedAcademy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">{selectedAcademy.name}</h2>
              <p className="text-gray-400">{selectedAcademy.city}, {selectedAcademy.state}</p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Payment Screenshot */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Payment Screenshot (₹200)</h3>
                <img 
                  src={selectedAcademy.paymentScreenshot} 
                  alt="Payment Screenshot"
                  className="w-full max-h-80 object-contain bg-slate-700 rounded-xl"
                />
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Address:</span>
                  <p className="text-white">{selectedAcademy.address}</p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="text-white">{selectedAcademy.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="text-white">{selectedAcademy.email || selectedAcademy.submittedByEmail || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Website:</span>
                  <p className="text-white">{selectedAcademy.website || '-'}</p>
                </div>
              </div>

              {/* Sports & Facilities */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Sports & Facilities</h3>
                <div className="space-y-2">
                  {selectedAcademy.sports?.map(sport => (
                    <div key={sport} className="flex justify-between bg-slate-700/50 px-3 py-2 rounded-lg">
                      <span className="text-purple-300">{sport}</span>
                      <span className="text-white">{selectedAcademy.sportDetails?.[sport] || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academy Photos */}
              {selectedAcademy.photos?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Academy Photos</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedAcademy.photos.map((photo, i) => (
                      <img key={i} src={photo} alt={`Photo ${i+1}`} className="w-full h-24 object-cover rounded-lg" />
                    ))}
                  </div>
                </div>
              )}

              {/* Reject Reason */}
              <div>
                <label className="text-sm font-semibold text-gray-400 mb-2 block">Rejection Reason (if rejecting)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-xl border border-gray-600 focus:outline-none focus:border-red-500 resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => { setShowModal(false); setSelectedAcademy(null); setRejectReason(''); }}
                className="flex-1 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <div className="relative group flex-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
                <button
                  onClick={() => handleReject(selectedAcademy.id)}
                  disabled={actionLoading}
                  className="relative w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                  Decline Payment
                </button>
              </div>
              <div className="relative group flex-1">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition duration-300"></div>
                <button
                  onClick={() => handleApprove(selectedAcademy.id)}
                  disabled={actionLoading}
                  className="relative w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Approve Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademyApprovalsPage;