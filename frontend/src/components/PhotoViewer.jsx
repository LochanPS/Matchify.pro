import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { useState } from 'react';

export default function PhotoViewer({ isOpen, onClose, photoUrl, userName }) {
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `${userName || 'profile'}-photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      setZoom(1);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      style={{ 
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
      onClick={handleBackdropClick}
    >
      {/* Animated Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(168,85,247,0.6), transparent)',
            animation: 'glow 4s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(245,158,11,0.6), transparent)',
            animation: 'glow 4s ease-in-out infinite reverse'
          }}
        />
      </div>

      {/* Close Button */}
      <button
        onClick={() => {
          onClose();
          setZoom(1);
        }}
        className="absolute top-4 right-4 z-10 p-3 rounded-full transition-all group"
        style={{ 
          background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.2))',
          border: '2px solid rgba(239,68,68,0.5)',
          boxShadow: '0 4px 15px rgba(239,68,68,0.3)'
        }}
      >
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(239,68,68,0.2)' }}
        />
        <X className="w-6 h-6 text-red-300 relative z-10" />
      </button>

      {/* Zoom Controls */}
      <div 
        className="absolute top-4 left-4 z-10 flex gap-2"
      >
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="p-3 rounded-full transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ 
            background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(37,99,235,0.2))',
            border: '2px solid rgba(245,158,11,0.5)',
            boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
          }}
        >
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(245,158,11,0.2)' }}
          />
          <ZoomOut className="w-6 h-6 text-amber-300 relative z-10" />
        </button>
        
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="p-3 rounded-full transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ 
            background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(37,99,235,0.2))',
            border: '2px solid rgba(245,158,11,0.5)',
            boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
          }}
        >
          <div 
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(245,158,11,0.2)' }}
          />
          <ZoomIn className="w-6 h-6 text-amber-300 relative z-10" />
        </button>

        <div 
          className="px-4 py-3 rounded-full flex items-center justify-center min-w-[80px]"
          style={{ 
            background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(37,99,235,0.2))',
            border: '2px solid rgba(245,158,11,0.5)',
            boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
          }}
        >
          <span className="text-amber-300 font-bold text-sm">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-5 py-3 rounded-full transition-all group"
        style={{ 
          background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.2))',
          border: '2px solid rgba(245,158,11,0.5)',
          boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
        }}
      >
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'rgba(245,158,11,0.2)' }}
        />
        <Download className="w-5 h-5 text-emerald-300 relative z-10" />
        <span className="text-emerald-300 font-bold text-sm relative z-10">Download</span>
      </button>

      {/* User Name */}
      {userName && (
        <div 
          className="absolute bottom-4 left-4 z-10 px-5 py-3 rounded-full"
          style={{ 
            background: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(139,92,246,0.2))',
            border: '2px solid rgba(168,85,247,0.5)',
            boxShadow: '0 4px 15px rgba(168,85,247,0.3)'
          }}
        >
          <span className="text-purple-300 font-bold text-sm">{userName}</span>
        </div>
      )}

      {/* Photo Container */}
      <div 
        className="relative max-w-4xl max-h-[80vh] overflow-auto rounded-2xl"
        style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <img 
          src={photoUrl} 
          alt={userName || 'Profile Photo'} 
          className="w-full h-full object-contain transition-transform duration-300"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            maxHeight: '80vh'
          }}
        />
      </div>

      {/* Instructions */}
      <div 
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 px-5 py-2 rounded-full"
        style={{ 
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
        }}
      >
        <span className="text-gray-300 text-xs font-medium">Click outside to close</span>
      </div>

      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.2; filter: brightness(1); }
          50% { opacity: 0.4; filter: brightness(1.3); }
        }
      `}</style>
    </div>
  );
}


