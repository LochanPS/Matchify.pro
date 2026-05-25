import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import CategoryForm from '../CategoryForm';
import { getGenderLabel } from '../../../utils/genderLabel';

const CategoriesStep = ({ formData, updateFormData, onNext, onPrev }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [alertModal, setAlertModal] = useState(null);

  const handleAddCategory = (category) => {
    if (editingIndex !== null) {
      // Edit existing category
      const newCategories = [...formData.categories];
      newCategories[editingIndex] = category;
      updateFormData('categories', newCategories);
      setEditingIndex(null);
    } else {
      // Add new category
      updateFormData('categories', [...formData.categories, category]);
    }
    setShowForm(false);
  };

  const handleEditCategory = (index) => {
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDeleteCategory = (index) => {
    setDeleteModal({ index, name: formData.categories[index].name });
  };

  const confirmDelete = () => {
    if (deleteModal) {
      const newCategories = formData.categories.filter((_, i) => i !== deleteModal.index);
      updateFormData('categories', newCategories);
      setDeleteModal(null);
    }
  };

  const handleNext = () => {
    if (formData.categories.length === 0) {
      setAlertModal({ type: 'error', message: 'Please add at least one category' });
      return;
    }
    onNext();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 
          className="text-lg font-black mb-2"
          style={{
            background: 'linear-gradient(135deg, #D97706, #F59E0B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Tournament Categories
        </h2>
        <p className="text-gray-400 text-xs">Define categories for players</p>
      </div>

      {!showForm ? (
        <>
          {/* Add Category Button */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed rounded-xl p-4 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2 text-gray-400 hover:text-emerald-400"
            style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)' }}
          >
            <PlusIcon className="h-5 w-5" />
            <span className="font-bold text-sm">Add Category</span>
          </button>

          {/* Categories List */}
          {formData.categories.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm">
                Added Categories ({formData.categories.length})
              </h3>
              
              {formData.categories.map((category, index) => (
                <div
                  key={index}
                  className="rounded-xl p-3 hover:border-emerald-500/30 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-white mb-2 text-sm">
                        {category.name}
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <div>
                          <span className="font-bold text-gray-300">Format:</span> {category.format}
                        </div>
                        <div>
                          <span className="font-bold text-gray-300">Gender:</span> {getGenderLabel(category.gender)}
                        </div>
                        {category.ageGroup && (
                          <div>
                            <span className="font-bold text-gray-300">Age:</span> {category.ageGroup}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-gray-300">Fee:</span> ₹{category.entryFee}
                        </div>
                        {category.maxParticipants && (
                          <div>
                            <span className="font-bold text-gray-300">Max:</span> {category.maxParticipants}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-gray-300">Scoring:</span> {category.scoringFormat}
                        </div>
                      </div>
                      
                      {/* Prize Info */}
                      {(category.prizeWinner || category.prizeRunnerUp || category.prizeSemiFinalist) && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-amber-400 text-xs">✨</span>
                            <span className="text-xs font-bold text-amber-400">Cash Prize</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {category.prizeWinner && (
                              <span className="text-amber-400">🥇 ₹{category.prizeWinner}</span>
                            )}
                            {category.prizeRunnerUp && (
                              <span style={{ color: 'rgba(255,255,255,0.65)' }}>🥈 ₹{category.prizeRunnerUp}</span>
                            )}
                            {category.prizeSemiFinalist && (
                              <span className="text-orange-400">🥉 ₹{category.prizeSemiFinalist}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-3">
                      <button
                        onClick={() => handleEditCategory(index)}
                        className="p-1.5 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(index)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.1)', border: '1.5px solid rgba(168,85,247,0.3)' }}>
            <h4 className="font-bold text-purple-300 mb-1.5 text-xs">Category Guidelines:</h4>
            <ul className="text-xs text-gray-400 space-y-0.5">
              <li>• Separate categories for singles/doubles</li>
              <li>• Consider age groups (U-15, U-19, Open, 35+)</li>
              <li>• Set appropriate entry fees</li>
              <li>• Add more categories later if needed</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-white/10">
            <button
              onClick={onPrev}
              className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{ background: 'rgba(100,116,139,0.5)', color: '#d1d5db' }}
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={formData.categories.length === 0}
              className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
                color: '#ffffff',
                boxShadow: '0 6px 20px rgba(168,85,247,0.4)'
              }}
            >
              Next: Payment QR →
            </button>
          </div>
        </>
      ) : (
        <CategoryForm
          initialData={editingIndex !== null ? formData.categories[editingIndex] : null}
          onSave={handleAddCategory}
          onCancel={handleCancelForm}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Delete Category</h3>
                  </div>
                  <button onClick={() => setDeleteModal(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-gray-300">
                  Are you sure you want to delete the category <span className="font-semibold text-white">"{deleteModal.name}"</span>?
                </p>
                <p className="text-sm text-gray-400">
                  This action cannot be undone.
                </p>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm">
            <div className={`absolute -inset-2 bg-gradient-to-r ${alertModal.type === 'success' ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500'} rounded-3xl blur-xl opacity-50`}></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${alertModal.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  {alertModal.type === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <h3 className={`text-lg font-semibold ${alertModal.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {alertModal.type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className="text-gray-300 mt-2">{alertModal.message}</p>
              </div>
              <div className="p-4 bg-slate-900/50 border-t border-white/10">
                <button
                  onClick={() => setAlertModal(null)}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-colors ${
                    alertModal.type === 'success'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesStep;

