import React from 'react';

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div style={{ borderBottom: '1px solid rgba(6,182,212,0.15)', background: 'rgba(7,7,26,0.8)' }}>
      <nav className="flex space-x-6 px-4 overflow-x-auto" aria-label="Categories">
        {categories.map((category) => {
          const isActive = activeCategory?.id === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category)}
              className="py-3 px-1 border-b-2 font-semibold text-sm whitespace-nowrap transition-all"
              style={{
                borderBottomColor: isActive ? '#22d3ee' : 'transparent',
                color: isActive ? '#22d3ee' : 'rgba(255,255,255,0.5)',
              }}
            >
              <span className="flex items-center gap-2">
                {category.name}

                {category.drawGenerated ? (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.3)' }}
                  >
                    Draw Ready
                  </span>
                ) : (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
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
