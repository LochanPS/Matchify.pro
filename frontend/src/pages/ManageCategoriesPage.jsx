import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon, PencilIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { tournamentAPI } from '../api/tournament';
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
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/tournaments/${id}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();
      
      if (data.success) {
        setCategories([...categories, data.category]);
        setShowForm(false);
        setEditingCategory(null);
      } else {
        alert(data.errors?.join(', ') || data.error || 'Failed to add category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategory = async (categoryData) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/tournaments/${id}/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });

      const data = await response.json();
      
      if (data.success) {
        setCategories(categories.map(c => c.id === editingCategory.id ? data.category : c));
        setShowForm(false);
        setEditingCategory(null);
      } else {
        alert(data.error || 'Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/tournaments/${id}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setCategories(categories.filter(c => c.id !== categoryId));
      } else {
        alert(data.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Tournament not found'}</p>
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <button
          onClick={() => navigate(`/tournaments/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Tournament
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
          <p className="text-gray-600 mt-1">{tournament.name}</p>
        </div>

        {!showForm ? (
          <div className="space-y-6">
            {/* Add Category Button */}
            <button
              onClick={() => { setShowForm(true); setEditingCategory(null); }}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <PlusIcon className="h-6 w-6" />
              <span className="font-medium">Add Category</span>
            </button>

            {/* Categories List */}
            {categories.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">
                  Categories ({categories.length})
                </h3>
                
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors shadow-sm"
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
                            <span className="font-medium">Registered:</span> {category.registrationCount || 0}
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
                          onClick={() => { setEditingCategory(category); setShowForm(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit category"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete category"
                          disabled={category.registrationCount > 0}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border p-8 text-center">
                <p className="text-gray-500">No categories added yet</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <CategoryForm
              initialData={editingCategory}
              onSave={handleSaveCategory}
              onCancel={() => { setShowForm(false); setEditingCategory(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCategoriesPage;
