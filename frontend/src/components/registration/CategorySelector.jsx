import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { CheckCheck } from 'lucide-react';
import { getGenderLabel } from '../../utils/genderLabel';

export default function CategorySelector({ categories, selectedCategories, onSelectionChange, alreadyRegisteredCategories = [] }) {
  const handleToggle = (categoryId) => {
    if (alreadyRegisteredCategories.includes(categoryId)) return;
    if (selectedCategories.includes(categoryId)) {
      onSelectionChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      onSelectionChange([...selectedCategories, categoryId]);
    }
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
        No categories available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-black text-white mb-3">Select Categories</h3>

      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        const isAlreadyRegistered = alreadyRegisteredCategories.includes(category.id);

        let borderColor, bgColor;
        if (isAlreadyRegistered) {
          borderColor = 'rgba(0,255,136,0.35)';
          bgColor = 'rgba(0,255,136,0.06)';
        } else if (isSelected) {
          borderColor = '#a855f7';
          bgColor = 'rgba(168,85,247,0.1)';
        } else {
          borderColor = 'rgba(255,255,255,0.1)';
          bgColor = 'rgba(255,255,255,0.03)';
        }

        return (
          <div
            key={category.id}
            onClick={() => handleToggle(category.id)}
            className="relative flex items-start p-4 rounded-2xl transition-all"
            style={{
              border: `2px solid ${borderColor}`,
              background: bgColor,
              cursor: isAlreadyRegistered ? 'not-allowed' : 'pointer',
              boxShadow: isSelected ? '0 4px 20px rgba(168,85,247,0.2)' : 'none',
            }}
          >
            {/* Checkbox */}
            <div className="flex items-center flex-shrink-0 mt-0.5">
              {isAlreadyRegistered ? (
                <CheckCheck className="h-5 w-5" style={{ color: '#00ff88' }} />
              ) : isSelected ? (
                <CheckCircleIcon className="h-5 w-5" style={{ color: '#a855f7' }} />
              ) : (
                <div className="h-5 w-5 rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.25)' }} />
              )}
            </div>

            <div className="ml-3 flex-1 min-w-0">
              {/* Name + Fee row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-black text-sm text-white">
                    {category.name}
                  </span>
                  {category.ageGroup && (
                    <span className="ml-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      ({category.ageGroup})
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {isAlreadyRegistered ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
                      style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
                      <CheckCheck className="w-3 h-3" /> Registered
                    </span>
                  ) : (
                    <span className="text-base font-black text-white">₹{category.entryFee}</span>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: category.format === 'doubles' ? 'rgba(168,85,247,0.15)' : 'rgba(0,212,255,0.12)',
                    color: category.format === 'doubles' ? '#c084fc' : '#00d4ff',
                    border: `1px solid ${category.format === 'doubles' ? 'rgba(168,85,247,0.3)' : 'rgba(0,212,255,0.25)'}`,
                  }}>
                  {category.format}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: category.gender === 'women' ? 'rgba(236,72,153,0.12)' : category.gender === 'mixed' ? 'rgba(0,255,136,0.1)' : 'rgba(0,212,255,0.1)',
                    color: category.gender === 'women' ? '#f472b6' : category.gender === 'mixed' ? '#00ff88' : '#00d4ff',
                    border: `1px solid ${category.gender === 'women' ? 'rgba(236,72,153,0.25)' : category.gender === 'mixed' ? 'rgba(0,255,136,0.2)' : 'rgba(0,212,255,0.2)'}`,
                  }}>
                  {getGenderLabel(category.gender)}
                </span>
                {category.maxParticipants && (
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    max {category.maxParticipants}
                  </span>
                )}
              </div>

              {/* Doubles partner notice */}
              {category.format === 'doubles' && isSelected && !isAlreadyRegistered && (
                <div className="mt-2.5 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                  ⚠️ Partner Matchify.pro ID required
                </div>
              )}
            </div>
          </div>
        );
      })}

      {selectedCategories.length === 0 && (
        <p className="text-xs text-center pt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Select at least one category to continue
        </p>
      )}
    </div>
  );
}
