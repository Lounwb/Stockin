import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(window.location.href);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        if (data.session) {
          navigate('/items', { replace: true });
        } else {
          navigate('/auth', { replace: true });
        }
      } catch (e) {
        setError((e as Error).message);
      }
    };
    void run();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="px-4 pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">正在登录中...</h1>
        <p className="mt-2 text-sm text-slate-400">
          正在验证邮箱登录链接，请稍候。
        </p>
      </header>
      <main className="flex-1 px-4">
        {error && <p className="text-sm text-red-400">{error}</p>}
      </main>
    </div>
  );
}

