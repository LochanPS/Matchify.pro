import { getErrorMessage } from '../utils/errorMessage';
import { getGenderLabel } from '../utils/genderLabel';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import {
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  Trophy,
  Users,
  AlertTriangle,
  X,
  CheckCircle,
  Layers,
} from 'lucide-react';
import { tournamentAPI } from '../api/tournament';
import api from '../utils/api';
import CategoryForm from '../components/tournament/CategoryForm';

const B = {
  bg: '#040810',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#F59E0B',
  cyan: '#FCD34D',
  purple: '#8B5CF6',
  red: '#f87171',
};

const ManageCategoriesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await tournamentAPI.getTournament(id);
      setTournament(response.data);
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Error fetching tournament:', err);
      setError('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (categoryData) => {
    try {
      setSaving(true);
      const response = await api.post(`/tournaments/${id}/categories`, categoryData);
      if (response.data.success) {
        setCategories([...categories, response.data.category]);
        setShowForm(false);
        setEditingCategory(null);
        setSuccessMessage('Category added successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.data.errors?.join(', ') || response.data.error || 'Failed to add category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async (categoryData) => {
    try {
      setSaving(true);
      const response = await api.put(`/tournaments/${id}/categories/${editingCategory.id}`, categoryData);
      if (response.data.success) {
        setCategories(categories.map(c => c.id === editingCategory.id ? response.data.category : c));
        setShowForm(false);
        setEditingCategory(null);
        setSuccessMessage('Category updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        if (response.data.feeLocked) {
          setError(`Entry fee cannot be changed: ${response.data.details}`);
        } else {
          setError(response.data.error || 'Failed to update category');
        }
      }
    } catch (err) {
      console.error('Error updating category:', err);
      if (err.response?.data?.feeLocked) {
        setError(`Entry fee is locked: ${err.response.data.details}`);
      } else {
        setError(getErrorMessage(err, 'Failed to update category'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const response = await api.delete(`/tournaments/${id}/categories/${categoryId}`);
      if (response.data.success) {
        setCategories(categories.filter(c => c.id !== categoryId));
        setConfirmModal(null);
        setSuccessMessage('Category deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.data.error || 'Failed to delete category');
        setConfirmModal(null);
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
      setConfirmModal(null);
    }
  };

  const handleSaveCategory = (categoryData) => {
    if (editingCategory) {
      handleUpdateCategory(categoryData);
    } else {
      handleAddCategory(categoryData);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingScreen message="Loading categories…" />;
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: B.bg }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: B.red }} />
          <p className="text-white font-bold mb-4">{error || 'Tournament not found'}</p>
          <button
            onClick={() => navigate('/dashboard?role=ORGANIZER')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: B.bg }}>
      <div className="max-w-lg mx-auto px-4 pt-6">

        {/* Back */}
        <button
          onClick={() => navigate(`/organizer/tournaments/${id}`)}
          className="flex items-center gap-1.5 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tournament
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.3),rgba(124,58,237,0.2))', border: '1px solid rgba(168,85,247,0.4)' }}>
            <Trophy className="w-5 h-5" style={{ color: B.purple }} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Manage Categories</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{tournament?.name}</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: B.red }} />
            <p className="text-xs font-semibold flex-1" style={{ color: B.red }}>{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4" style={{ color: B.red }} /></button>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: B.green }} />
            <p className="text-xs font-semibold flex-1" style={{ color: B.green }}>{successMessage}</p>
          </div>
        )}

        {!showForm ? (
          <div className="space-y-4">
            {/* Add Category Button */}
            <button
              onClick={() => { setShowForm(true); setEditingCategory(null); }}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all"
              style={{
                background: 'rgba(168,85,247,0.06)',
                border: '2px dashed rgba(168,85,247,0.35)',
                color: B.purple,
              }}
            >
              <Plus className="h-5 w-5" />
              Add Category
            </button>

            {/* Section label */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2 px-1">
                <Users className="w-4 h-4" style={{ color: B.purple }} />
                <span className="text-sm font-bold text-white">Categories ({categories.length})</span>
              </div>
            )}

            {/* Category cards */}
            {categories.length > 0 ? (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-2xl overflow-hidden"
                    style={{ background: B.card, border: `1px solid ${B.border}` }}
                  >
                    {/* Card header */}
                    <div className="px-4 py-3 flex items-center justify-between"
                      style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(168,85,247,0.04)' }}>
                      <h4 className="font-black text-white">{category.name}</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingCategory(category); setShowForm(true); }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                          style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" style={{ color: B.cyan }} />
                        </button>
                        <button
                          onClick={() => !category.registrationCount && setConfirmModal(category)}
                          disabled={category.registrationCount > 0}
                          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
                          title={category.registrationCount > 0 ? 'Cannot delete — has registrations' : 'Delete'}
                        >
                          <Trash2 className="h-3.5 w-3.5" style={{ color: B.red }} />
                        </button>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Format', value: category.format },
                          { label: 'Gender', value: getGenderLabel(category.gender) },
                          category.ageGroup && { label: 'Age Group', value: category.ageGroup },
                          { label: 'Registered', value: category.registrationCount || 0, color: B.cyan },
                        ].filter(Boolean).map(({ label, value, color }) => (
                          <div key={label} className="rounded-xl px-3 py-2.5"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                            <p className="text-sm font-bold" style={{ color: color || 'white' }}>{value}</p>
                          </div>
                        ))}

                        {/* Entry fee — full width */}
                        <div className="col-span-2 rounded-xl px-3 py-2.5 flex items-center justify-between"
                          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                          <div>
                            <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Entry Fee</p>
                            <p className="text-sm font-black" style={{ color: B.green }}>₹{category.entryFee}</p>
                          </div>
                          {category.registrationCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#fbbf24' }} />
                              <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>Locked</span>
                            </div>
                          )}
                        </div>

                        {category.maxParticipants && (
                          <div className="rounded-xl px-3 py-2.5"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Max Players</p>
                            <p className="text-sm font-bold text-white">{category.maxParticipants}</p>
                          </div>
                        )}
                      </div>

                      {/* Prize info */}
                      {(category.prizeWinner || category.prizeRunnerUp || category.prizeSemiFinalist) && (
                        <div className="mt-3 pt-3 rounded-xl px-3 py-2.5"
                          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                          <p className="text-xs font-bold mb-2" style={{ color: '#fbbf24' }}>✨ Cash Prizes</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            {category.prizeWinner && (
                              <span style={{ color: '#fbbf24' }}>🥇 ₹{category.prizeWinner}</span>
                            )}
                            {category.prizeRunnerUp && (
                              <span style={{ color: 'rgba(255,255,255,0.7)' }}>🥈 ₹{category.prizeRunnerUp}</span>
                            )}
                            {category.prizeSemiFinalist && (
                              <span style={{ color: '#fb923c' }}>🥉 ₹{category.prizeSemiFinalist}</span>
                            )}
                          </div>
                          {category.prizeDescription && (
                            <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{category.prizeDescription}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl p-12 text-center"
                style={{ background: B.card, border: `1px solid ${B.border}` }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.2)' }}>
                  <Trophy className="w-7 h-7" style={{ color: B.purple }} />
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No categories added yet</p>
              </div>
            )}
          </div>
        ) : (
          /* ── Category Form ── */
          <div className="rounded-2xl overflow-hidden"
            style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: `1px solid ${B.border}`, background: editingCategory ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.04)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: editingCategory ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.15)',
                  border: `1px solid ${editingCategory ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.3)'}`,
                }}>
                {editingCategory
                  ? <Pencil className="w-4 h-4" style={{ color: B.cyan }} />
                  : <Plus className="w-4 h-4" style={{ color: B.green }} />}
              </div>
              <h3 className="text-sm font-black text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
            </div>
            <div className="p-4">
              <CategoryForm
                initialData={editingCategory}
                onSave={handleSaveCategory}
                onCancel={() => { setShowForm(false); setEditingCategory(null); }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {confirmModal && (
        <div
          className="fixed inset-0 flex items-end justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: '#0d1025', border: '1px solid rgba(239,68,68,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-5 pt-5 pb-4 text-center"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.3),rgba(220,38,38,0.2))', border: '1px solid rgba(239,68,68,0.4)' }}>
                <Trash2 className="w-6 h-6" style={{ color: B.red }} />
              </div>
              <h3 className="text-base font-black text-white mb-1">Delete Category?</h3>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Delete <span style={{ color: B.red }}>{confirmModal.name}</span>? This cannot be undone.
              </p>
            </div>

            {/* Modal actions */}
            <div className="p-4 flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(confirmModal.id)}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', boxShadow: '0 4px 15px rgba(239,68,68,0.35)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCategoriesPage;


