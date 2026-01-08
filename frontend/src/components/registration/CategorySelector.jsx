import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { CircleIcon } from 'lucide-react';

export default function CategorySelector({ categories, selectedCategories, onSelectionChange }) {
  const handleToggle = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      onSelectionChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onSelectionChange([...selectedCategories, categoryId]);
    }
  };

  const getFormatBadge = (format) => {
    const colors = {
      singles: 'bg-blue-100 text-blue-800',
      doubles: 'bg-purple-100 text-purple-800',
    };
    return colors[format] || 'bg-gray-100 text-gray-800';
  };

  const getGenderBadge = (gender) => {
    const colors = {
      men: 'bg-cyan-100 text-cyan-800',
      women: 'bg-pink-100 text-pink-800',
      mixed: 'bg-green-100 text-green-800',
    };
    return colors[gender] || 'bg-gray-100 text-gray-800';
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No categories available for this tournament
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Select Categories
      </h3>
      
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        
        return (
          <div
            key={category.id}
            onClick={() => handleToggle(category.id)}
            className={`
              relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all
              ${isSelected 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center h-5">
              {isSelected ? (
                <CheckCircleIcon className="h-6 w-6 text-primary-600" />
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
              )}
            </div>
            
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900 cursor-pointer">
                    {category.name}
                  </label>
                  {category.ageGroup && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({category.ageGroup})
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ₹{category.entryFee}
                  </div>
                </div>
              </div>
              
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormatBadge(category.format)}`}>
                  {category.format}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGenderBadge(category.gender)}`}>
                  {category.gender}
                </span>
                {category.maxParticipants && (
                  <span className="text-xs text-gray-500">
                    Max: {category.maxParticipants} players
                  </span>
                )}
              </div>
              
              {category.format === 'doubles' && isSelected && (
                <div className="mt-2 text-sm text-primary-600 font-medium">
                  ⚠️ Partner email required for doubles category
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {selectedCategories.length === 0 && (
        <p className="text-sm text-gray-500 text-center mt-4">
          Select at least one category to continue
        </p>
      )}
    </div>
  );
}
