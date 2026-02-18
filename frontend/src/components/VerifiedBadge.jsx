import { ShieldCheckIcon } from '@heroicons/react/24/solid';

const VerifiedBadge = ({ type = 'player', size = 'md', showText = false, className = '' }) => {
  const colors = {
    player: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      icon: 'text-blue-400',
      label: 'Verified Player'
    },
    organizer: {
      bg: 'bg-green-500/20',
      border: 'border-green-500/50',
      text: 'text-green-400',
      icon: 'text-green-400',
      label: 'Verified Organizer'
    },
    umpire: {
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/50',
      text: 'text-purple-400',
      icon: 'text-purple-400',
      label: 'Verified Umpire'
    }
  };

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const color = colors[type] || colors.player;
  const iconSize = sizes[size] || sizes.md;

  if (showText) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${color.bg} border ${color.border} rounded-full ${className}`}>
        <ShieldCheckIcon className={`${iconSize} ${color.icon}`} />
        <span className={`text-sm font-medium ${color.text}`}>{color.label}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`} title={color.label}>
      <ShieldCheckIcon className={`${iconSize} ${color.icon} drop-shadow-lg`} />
    </div>
  );
};

export default VerifiedBadge;
