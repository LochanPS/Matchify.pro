import React from 'react';

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(4,8,16,0.85)',
      backdropFilter: 'blur(8px)'
    }}>
      <nav
        style={{ display: 'flex', gap: 0, padding: '0 12px', overflowX: 'auto', scrollbarWidth: 'none' }}
        aria-label="Categories"
      >
        {categories.map((category) => {
          const isActive = activeCategory?.id === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category)}
              style={{
                padding: '12px 14px',
                border: 'none',
                borderBottom: isActive ? '2px solid #F59E0B' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? '#FCD34D' : 'rgba(255,255,255,0.45)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                flexShrink: 0
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
            >
              {category.name}
              {category.drawGenerated ? (
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700,
                  background: isActive ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.1)',
                  color: isActive ? '#FCD34D' : '#34D399',
                  border: isActive ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(16,185,129,0.25)'
                }}>
                  Draw Ready
                </span>
              ) : (
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600,
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  Pending
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CategoryTabs;
