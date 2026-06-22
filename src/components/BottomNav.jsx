import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, TrendingUp, CreditCard, NotebookPen, Settings, ShoppingBag } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', Icon: LayoutDashboard },
  { to: '/bills', label: 'Bills', Icon: Receipt },
  { to: '/purchases', label: 'Spending', Icon: ShoppingBag },
  { to: '/income', label: 'Income', Icon: TrendingUp },
  { to: '/debts', label: 'Debts', Icon: CreditCard },
  { to: '/notes', label: 'Notes', Icon: NotebookPen },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[640px] z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch px-1">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex-1 min-w-0 flex flex-col items-center gap-1 pt-2 pb-1.5"
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex items-center justify-center rounded-xl w-full max-w-[44px] py-1.5 transition-colors ${
                    isActive ? 'bg-indigo-500/15 text-indigo-400' : 'text-slate-500'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                </div>
                <span className={`text-[9px] font-medium leading-none truncate w-full text-center ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
