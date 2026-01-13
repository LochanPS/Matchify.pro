import { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import CategoryForm from '../CategoryForm';

const CategoriesStep = ({ formData, updateFormData, onNext, onPrev }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

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
    if (confirm('Are you sure you want to delete this category?')) {
      const newCategories = formData.categories.filter((_, i) => i !== index);
      updateFormData('categories', newCategories);
    }
  };

  const handleNext = () => {
    if (formData.categories.length === 0) {
      alert('Please add at least one category');
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
    </div>
  );
};

export default CategoriesStep;
