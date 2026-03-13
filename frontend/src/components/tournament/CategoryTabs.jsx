import React from 'react';

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 bg-white shadow-sm">
      <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Categories">
        {categories.map((category) => {
          const isActive = activeCategory?.id === category.id;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="flex items-center gap-2">
                {category.name}
                
                {/* Draw status badge */}
                {category.drawGenerated ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                    Draw Ready
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    Pending
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CategoryTabs;
