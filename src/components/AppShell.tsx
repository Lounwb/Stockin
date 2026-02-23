import { PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type AppShellProps = PropsWithChildren<{
  title?: string;
  rightSlot?: React.ReactNode;
  backTo?: string;
}>;

export function AppShell({ title, rightSlot, backTo, children }: AppShellProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true, state: { from: location } });
  };

  return (
    <div className="flex min-h-screen justify-center px-3 py-6 text-slate-50">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--stockin-border-subtle)] bg-gradient-to-b from-slate-900/80 to-slate-950/90 shadow-[0_18px_60px_rgba(15,23,42,0.8)]">
        <header className="flex items-center gap-3 px-4 pt-6 pb-3">
          {backTo ? (
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="flex-shrink-0 rounded-full border border-slate-700/70 px-2.5 py-1 text-[11px] text-slate-300"
            >
              ← 返回
            </button>
          ) : (
            <div className="flex-shrink-0 rounded-full border border-emerald-500/40 bg-[var(--stockin-accent-soft)] px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              Stockin
            </div>
          )}
          <h1 className="flex-1 truncate text-base font-semibold tracking-tight">
            {title ?? '库存面板'}
          </h1>
          {rightSlot}
          <button
            type="button"
            onClick={handleSignOut}
            className="ml-1 rounded-full border border-slate-700/70 px-2.5 py-1 text-[11px] text-slate-300"
          >
            退出
          </button>
        </header>
        <main className="flex-1 px-4 pb-5 pt-1">{children}</main>
      </div>
    </div>
  );
}

