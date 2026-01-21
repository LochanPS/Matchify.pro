import { useEffect, useState } from 'react';

const ResponsiveContainer = ({ children, className = '' }) => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDimensions({ width, height });
      
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 768) {
        setScreenSize('mobile-lg');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else if (width < 1280) {
        setScreenSize('laptop');
      } else {
        setScreenSize('desktop');
      }
    };

    // Initial check
    updateScreenSize();

    // Listen for resize events
    window.addEventListener('resize', updateScreenSize);
    
    // Listen for orientation change (mobile)
    window.addEventListener('orientationchange', () => {
      setTimeout(updateScreenSize, 100);
    });

    return () => {
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
    };
  }, []);

  // Add screen size classes to body for global styling
  useEffect(() => {
    document.body.className = document.body.className.replace(/screen-\w+/g, '');
    document.body.classList.add(`screen-${screenSize}`);
    
    // Add mobile-specific classes
    if (screenSize === 'mobile' || screenSize === 'mobile-lg') {
      document.body.classList.add('is-mobile');
    } else {
      document.body.classList.remove('is-mobile');
    }
    
    // Add TV-specific classes
    if (screenSize === 'desktop' && dimensions.width >= 1920) {
      document.body.classList.add('is-tv');
    } else {
      document.body.classList.remove('is-tv');
    }
  }, [screenSize, dimensions]);

  const getResponsiveClasses = () => {
    const baseClasses = 'w-full overflow-x-hidden';
    
    switch (screenSize) {
      case 'mobile':
        return `${baseClasses} px-3 py-2 mobile-container`;
      case 'mobile-lg':
        return `${baseClasses} px-4 py-3 mobile-lg-container`;
      case 'tablet':
        return `${baseClasses} px-6 py-4 tablet-container`;
      case 'laptop':
        return `${baseClasses} px-8 py-6 laptop-container`;
      case 'desktop':
        return `${baseClasses} px-12 py-8 desktop-container`;
      default:
        return baseClasses;
    }
  };

  return (
    <div 
      className={`${getResponsiveClasses()} ${className}`}
      data-screen-size={screenSize}
      data-width={dimensions.width}
      data-height={dimensions.height}
    >
      {children}
    </div>
  );
};

// Hook to get current screen size
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isTV, setIsTV] = useState(false);

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      
      let size = 'desktop';
      if (width < 640) {
        size = 'mobile';
      } else if (width < 768) {
        size = 'mobile-lg';
      } else if (width < 1024) {
        size = 'tablet';
      } else if (width < 1280) {
        size = 'laptop';
      } else {
        size = 'desktop';
      }
      
      setScreenSize(size);
      setIsMobile(size === 'mobile' || size === 'mobile-lg');
      setIsTablet(size === 'tablet');
      setIsDesktop(size === 'laptop' || size === 'desktop');
      setIsTV(size === 'desktop' && width >= 1920);
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateScreenSize, 100);
    });

    return () => {
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
    };
  }, []);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isTV,
    width: window.innerWidth,
    height: window.innerHeight
  };
};

// Responsive Grid Component
export const ResponsiveGrid = ({ children, className = '' }) => {
  const { isMobile, isTablet, isDesktop } = useScreenSize();
  
  const getGridClasses = () => {
    if (isMobile) {
      return 'grid grid-cols-1 gap-4';
    } else if (isTablet) {
      return 'grid grid-cols-2 gap-6';
    } else {
      return 'grid grid-cols-3 lg:grid-cols-4 gap-6';
    }
  };
  
  return (
    <div className={`${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Text Component
export const ResponsiveText = ({ children, className = '', size = 'base' }) => {
  const { isMobile, isTV } = useScreenSize();
  
  const getTextClasses = () => {
    const sizeMap = {
      xs: isMobile ? 'text-xs' : isTV ? 'text-sm' : 'text-xs',
      sm: isMobile ? 'text-sm' : isTV ? 'text-base' : 'text-sm',
      base: isMobile ? 'text-base' : isTV ? 'text-lg' : 'text-base',
      lg: isMobile ? 'text-lg' : isTV ? 'text-xl' : 'text-lg',
      xl: isMobile ? 'text-xl' : isTV ? 'text-2xl' : 'text-xl',
      '2xl': isMobile ? 'text-xl' : isTV ? 'text-3xl' : 'text-2xl',
      '3xl': isMobile ? 'text-2xl' : isTV ? 'text-4xl' : 'text-3xl',
    };
    
    return sizeMap[size] || sizeMap.base;
  };
  
  return (
    <span className={`${getTextClasses()} ${className}`}>
      {children}
    </span>
  );
};

// Responsive Button Component
export const ResponsiveButton = ({ children, className = '', ...props }) => {
  const { isMobile, isTV } = useScreenSize();
  
  const getButtonClasses = () => {
    if (isMobile) {
      return 'w-full py-3 px-4 text-base min-h-[44px]';
    } else if (isTV) {
      return 'py-4 px-8 text-lg min-h-[60px]';
    } else {
      return 'py-2 px-6 text-base';
    }
  };
  
  return (
    <button 
      className={`${getButtonClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ResponsiveContainer;