import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import CategoryForm from '../CategoryForm';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Tournament Categories</h2>
        <p className="text-gray-400 mt-1">Define the categories players can register for</p>
      </div>

      {!showForm ? (
        <>
          {/* Add Category Button */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-white/20 rounded-xl p-6 hover:border-purple-500/50 hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-2 text-gray-400 hover:text-purple-400"
          >
            <PlusIcon className="h-6 w-6" />
            <span className="font-medium">Add Category</span>
          </button>

          {/* Categories List */}
          {formData.categories.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-white">
                Added Categories ({formData.categories.length})
              </h3>
              
              {formData.categories.map((category, index) => (
                <div
                  key={index}
                  className="border border-white/10 bg-slate-700/30 rounded-xl p-4 hover:border-purple-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">
                        {category.name}
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-400">
                        <div>
                          <span className="font-medium text-gray-300">Format:</span> {category.format}
                        </div>
                        <div>
                          <span className="font-medium text-gray-300">Gender:</span> {category.gender}
                        </div>
                        {category.ageGroup && (
                          <div>
                            <span className="font-medium text-gray-300">Age:</span> {category.ageGroup}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-300">Entry Fee:</span> ₹{category.entryFee}
                        </div>
                        {category.maxParticipants && (
                          <div>
                            <span className="font-medium text-gray-300">Max Players:</span> {category.maxParticipants}
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-300">Scoring:</span> {category.scoringFormat}
                        </div>
                      </div>
                      
                      {/* Prize Info */}
                      {(category.prizeWinner || category.prizeRunnerUp || category.prizeSemiFinalist) && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-amber-400">✨</span>
                            <span className="text-xs font-semibold text-amber-400">Cash Prize</span>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm">
                            {category.prizeWinner && (
                              <span className="text-amber-400">🥇 Winner: ₹{category.prizeWinner}</span>
                            )}
                            {category.prizeRunnerUp && (
                              <span className="text-blue-400">🥈 Runner-up: ₹{category.prizeRunnerUp}</span>
                            )}
                            {category.prizeSemiFinalist && (
                              <span className="text-orange-400">🥉 Semi-finalist: ₹{category.prizeSemiFinalist}</span>
                            )}
                          </div>
                          {category.prizeDescription && (
                            <p className="text-xs text-gray-500 mt-1">{category.prizeDescription}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditCategory(index)}
                        className="p-2 text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(index)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <h4 className="font-medium text-purple-300 mb-2">Category Guidelines:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Create separate categories for different formats (singles/doubles)</li>
              <li>• Consider age groups (U-15, U-19, Open, 35+, etc.)</li>
              <li>• Set appropriate entry fees for each category</li>
              <li>• You can add more categories later from the tournament dashboard</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-white/10">
            <button
              onClick={onPrev}
              className="px-6 py-3 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors font-medium"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={formData.categories.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
