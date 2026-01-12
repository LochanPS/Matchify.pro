import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { CircleIcon, CheckCheck } from 'lucide-react';

export default function CategorySelector({ categories, selectedCategories, onSelectionChange, alreadyRegisteredCategories = [] }) {
  const handleToggle = (categoryId) => {
    // Don't allow toggling already registered categories
    if (alreadyRegisteredCategories.includes(categoryId)) {
      return;
    }
    
    if (selectedCategories.includes(categoryId)) {
      onSelectionChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onSelectionChange([...selectedCategories, categoryId]);
    }
  };

  const getFormatBadge = (format) => {
    const colors = {
      singles: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      doubles: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    };
    return colors[format] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  const getGenderBadge = (gender) => {
    const colors = {
      men: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
      women: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
      mixed: 'bg-green-500/20 text-green-300 border border-green-500/30',
    };
    return colors[gender] || 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No categories available for this tournament
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white mb-4">
        Select Categories
      </h3>
      
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        const isAlreadyRegistered = alreadyRegisteredCategories.includes(category.id);
        
        return (
          <div
            key={category.id}
            onClick={() => handleToggle(category.id)}
            className={`
              relative flex items-start p-4 border-2 rounded-xl transition-all
              ${isAlreadyRegistered 
                ? 'border-green-500/50 bg-green-500/10 cursor-not-allowed opacity-75' 
                : isSelected 
                  ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20 cursor-pointer' 
                  : 'border-white/10 bg-slate-700/50 hover:border-white/20 cursor-pointer'
              }
            `}
          >
            <div className="flex items-center h-5">
              {isAlreadyRegistered ? (
                <CheckCheck className="h-6 w-6 text-green-400" />
              ) : isSelected ? (
                <CheckCircleIcon className="h-6 w-6 text-purple-400" />
              ) : (
                <div className="h-6 w-6 rounded-full border-2 border-gray-500" />
              )}
            </div>
            
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <label className={`font-medium cursor-pointer ${isAlreadyRegistered ? 'text-green-300' : 'text-white'}`}>
                    {category.name}
                  </label>
                  {category.ageGroup && (
                    <span className="ml-2 text-sm text-gray-400">
                      ({category.ageGroup})
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {isAlreadyRegistered ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold border border-green-500/30">
                      <CheckCheck className="w-4 h-4" />
                      Already Registered
                    </span>
                  ) : (
                    <div className="text-lg font-bold text-white">
                      ₹{category.entryFee}
                    </div>
                  )}
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
                  <span className="text-xs text-gray-400">
                    Max: {category.maxParticipants} players
                  </span>
                )}
              </div>
              
              {category.format === 'doubles' && isSelected && !isAlreadyRegistered && (
                <div className="mt-2 text-sm text-purple-400 font-medium">
                  ⚠️ Partner email required for doubles category
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {selectedCategories.length === 0 && (
        <p className="text-sm text-gray-400 text-center mt-4">
          Select at least one category to continue
        </p>
      )}
    </div>
  );
}
