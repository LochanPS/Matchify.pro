import { Link, useParams } from 'react-router-dom';

const MatchManagementNav = ({ tournamentId, currentPage }) => {
  const navItems = [
    {
      id: 'draw',
      label: 'Tournament Draw',
      path: `/tournament/${tournamentId}/draw`,
      icon: '🏆',
      description: 'View and manage tournament brackets'
    },
    {
      id: 'results',
      label: 'Match Results',
      path: `/tournament/${tournamentId}/results`,
      icon: '📊',
      description: 'View completed match results and history'
    },
    {
      id: 'live',
      label: 'Live Matches',
      path: `/tournament/${tournamentId}/live`,
      icon: '🔴',
      description: 'Monitor ongoing matches'
    }
  ];

  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-4">Match Management</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`p-4 rounded-lg border-2 transition hover:shadow-lg ${
              currentPage === item.id
                ? 'border-teal-500 bg-teal-900/30 shadow-teal-500/20'
                : 'border-slate-600 bg-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{item.icon}</div>
              <h4 className="text-white font-medium mb-1">{item.label}</h4>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MatchManagementNav;