import { PropsWithChildren } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type AppShellProps = PropsWithChildren<{
  title?: string;
  rightSlot?: React.ReactNode;
}>;

export function AppShell({ title, rightSlot, children }: AppShellProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true, state: { from: location } });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="flex items-center gap-3 px-4 pt-10 pb-4">
        <h1 className="flex-1 text-lg font-semibold tracking-tight">
          {title ?? 'Stockin 库存'}
        </h1>
        {rightSlot}
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300"
        >
          退出
        </button>
      </header>
      <main className="flex-1 px-4 pb-6">{children}</main>
    </div>
  );
}

