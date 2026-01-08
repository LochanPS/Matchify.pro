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
        <h2 className="text-2xl font-bold text-gray-900">Tournament Categories</h2>
        <p className="text-gray-600 mt-1">Define the categories players can register for</p>
      </div>

      {!showForm ? (
        <>
          {/* Add Category Button */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
          >
            <PlusIcon className="h-6 w-6" />
            <span className="font-medium">Add Category</span>
          </button>

          {/* Categories List */}
          {formData.categories.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">
                Added Categories ({formData.categories.length})
              </h3>
              
              {formData.categories.map((category, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {category.name}
                      </h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Format:</span> {category.format}
                        </div>
                        <div>
                          <span className="font-medium">Gender:</span> {category.gender}
                        </div>
                        {category.ageGroup && (
                          <div>
                            <span className="font-medium">Age:</span> {category.ageGroup}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Entry Fee:</span> ₹{category.entryFee}
                        </div>
                        {category.maxParticipants && (
                          <div>
                            <span className="font-medium">Max Players:</span> {category.maxParticipants}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Scoring:</span> {category.scoringFormat}
                        </div>
                      </div>
                      
                      {/* Prize Info */}
                      {(category.prizeWinner || category.prizeRunnerUp || category.prizeSemiFinalist) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">💰 Cash Prize</span>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm">
                            {category.prizeWinner && (
                              <span className="text-green-600">🥇 Winner: ₹{category.prizeWinner}</span>
                            )}
                            {category.prizeRunnerUp && (
                              <span className="text-blue-600">🥈 Runner-up: ₹{category.prizeRunnerUp}</span>
                            )}
                            {category.prizeSemiFinalist && (
                              <span className="text-orange-600">🥉 Semi-finalist: ₹{category.prizeSemiFinalist}</span>
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
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit category"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Category Guidelines:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Create separate categories for different formats (singles/doubles)</li>
              <li>• Consider age groups (U-15, U-19, Open, 35+, etc.)</li>
              <li>• Set appropriate entry fees for each category</li>
              <li>• You can add more categories later from the tournament dashboard</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={onPrev}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              ← Back
            </button>
            <button
              onClick={handleNext}
              disabled={formData.categories.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next: Review →
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
