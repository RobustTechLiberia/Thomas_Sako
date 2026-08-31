import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function DashboardLayout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { label: 'Dashboard', path: '/', icon: '📊' },
    { label: 'Polls', path: '/polls', icon: '📋' },
    { label: 'Podcasts', path: '/podcasts', icon: '🎙️' },
    { label: 'Cartoons', path: '/cartoons', icon: '🎨' },
    { label: 'Mingle', path: '/mingle', icon: '👥' },
    { label: 'Playlists', path: '/playlists', icon: '🎵' },
    { label: 'Leads', path: '/leads', icon: '📧' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-2xl font-bold">Liberty</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded"
          >
            {sidebarOpen ? '◄' : '►'}
          </button>
        </div>

        <nav className="mt-8">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-3 transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600 border-l-4 border-blue-400'
                  : 'hover:bg-gray-800'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-6">
          <button
            onClick={onLogout}
            className="w-full btn-danger text-center"
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
