import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, NotebookPen, Settings } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/bills', label: 'Bills', Icon: Receipt },
  { to: '/income', label: 'Income', Icon: TrendingUp },
  { to: '/notes', label: 'Notes', Icon: NotebookPen },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 max-w-[640px] mx-auto">
      <div className="flex">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
