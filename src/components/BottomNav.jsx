import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, NotebookPen, ShoppingBag, Briefcase } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', Icon: LayoutDashboard },
  { to: '/bills', label: 'Bills', Icon: Receipt },
  { to: '/purchases', label: 'Spending', Icon: ShoppingBag },
  { to: '/income', label: 'Income', Icon: TrendingUp },
  { to: '/work', label: 'Work', Icon: Briefcase },
  { to: '/notes', label: 'Notes', Icon: NotebookPen },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[640px] z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Card-style nav with shadow */}
      <div className="mx-3 mb-3 bg-slate-900/98 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40">
        <div className="flex items-stretch px-1 py-1">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex-1 min-w-0"
            >
              {({ isActive }) => (
                <div className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-colors ${isActive ? '' : 'hover:bg-slate-800/50'}`}>
                  <div className={`flex items-center justify-center rounded-xl w-10 h-9 transition-all ${
                    isActive
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'text-slate-500'
                  }`}>
                    <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                  </div>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
