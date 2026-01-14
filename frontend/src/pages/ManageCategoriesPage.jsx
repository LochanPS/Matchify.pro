import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  ArrowLeft, 
  Trophy, 
  Users, 
  AlertTriangle,
  X,
  CheckCircle
} from 'lucide-react';
import { tournamentAPI } from '../api/tournament';
import api from '../utils/api';
import CategoryForm from '../components/tournament/CategoryForm';

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
        setError(response.data.error || 'Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
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
        setError(data.error || 'Failed to delete category');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative text-center">
          <div className="spinner-premium mx-auto mb-4"></div>
          <p className="text-gray-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="glass-card-dark p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg mb-4">{error || 'Tournament not found'}</p>
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="btn-premium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Back to Tournament
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            Manage Categories
          </h1>
          <p className="text-gray-400 mt-1">{tournament?.name}</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 alert-error flex items-center gap-3 animate-fade-in-up">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 alert-success flex items-center gap-3 animate-fade-in-up">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {!showForm ? (
          <div className="space-y-6">
            {/* Add Category Button */}
            <button
              onClick={() => { setShowForm(true); setEditingCategory(null); }}
              className="w-full border-2 border-dashed border-white/20 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-blue-400 group"
            >
              <Plus className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add Category</span>
            </button>

            {/* Categories List */}
            {categories.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Categories ({categories.length})
                </h3>
                
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="glass-card-dark p-5 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-lg mb-3">
                          {category.name}
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="bg-white/5 rounded-lg p-2">
                            <span className="text-gray-500 text-xs">Format</span>
                            <p className="text-white font-medium">{category.format}</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2">
                            <span className="text-gray-500 text-xs">Gender</span>
                            <p className="text-white font-medium">{category.gender}</p>
                          </div>
                          {category.ageGroup && (
                            <div className="bg-white/5 rounded-lg p-2">
                              <span className="text-gray-500 text-xs">Age Group</span>
                              <p className="text-white font-medium">{category.ageGroup}</p>
                            </div>
                          )}
                          <div className="bg-white/5 rounded-lg p-2">
                            <span className="text-gray-500 text-xs">Entry Fee</span>
                            <p className="text-emerald-400 font-bold">₹{category.entryFee}</p>
                          </div>
                          {category.maxParticipants && (
                            <div className="bg-white/5 rounded-lg p-2">
                              <span className="text-gray-500 text-xs">Max Players</span>
                              <p className="text-white font-medium">{category.maxParticipants}</p>
                            </div>
                          )}
                          <div className="bg-white/5 rounded-lg p-2">
                            <span className="text-gray-500 text-xs">Registered</span>
                            <p className="text-blue-400 font-medium">{category.registrationCount || 0}</p>
                          </div>
                        </div>
                        
                        {/* Prize Info */}
                        {(category.prizeWinner || category.prizeRunnerUp || category.prizeSemiFinalist) && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-amber-400">✨</span>
                              <span className="text-xs font-semibold text-amber-400">Cash Prize</span>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm">
                              {category.prizeWinner && (
                                <span className="text-amber-400">🥇 Winner: ₹{category.prizeWinner}</span>
                              )}
                              {category.prizeRunnerUp && (
                                <span className="text-gray-300">🥈 Runner-up: ₹{category.prizeRunnerUp}</span>
                              )}
                              {category.prizeSemiFinalist && (
                                <span className="text-orange-400">🥉 Semi-finalist: ₹{category.prizeSemiFinalist}</span>
                              )}
                            </div>
                            {category.prizeDescription && (
                              <p className="text-xs text-gray-500 mt-2">{category.prizeDescription}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => { setEditingCategory(category); setShowForm(true); }}
                          className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          title="Edit category"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setConfirmModal(category)}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete category"
                          disabled={category.registrationCount > 0}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card-dark p-12 text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400">No categories added yet</p>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card-dark p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              {editingCategory ? (
                <>
                  <Pencil className="w-5 h-5 text-blue-400" />
                  Edit Category
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-emerald-400" />
                  Add New Category
                </>
              )}
            </h3>
            <CategoryForm
              initialData={editingCategory}
              onSave={handleSaveCategory}
              onCancel={() => { setShowForm(false); setEditingCategory(null); }}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div 
            className="modal-content max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Category?</h3>
              <p className="text-gray-400">
                Are you sure you want to delete <span className="text-red-400 font-medium">{confirmModal.name}</span>?
              </p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-300">
                This action cannot be undone. The category will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCategory(confirmModal.id)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold"
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
