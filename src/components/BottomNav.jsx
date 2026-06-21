import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, CreditCard, NotebookPen, Settings } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/bills', label: 'Bills', Icon: Receipt },
  { to: '/income', label: 'Income', Icon: TrendingUp },
  { to: '/debts', label: 'Debts', Icon: CreditCard },
  { to: '/notes', label: 'Notes', Icon: NotebookPen },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 max-w-[640px] mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`rounded-xl px-2.5 py-1 transition-all ${isActive ? 'bg-indigo-500/15' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
