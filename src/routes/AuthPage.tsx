import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

type Step = 'inputEmail' | 'checkEmail';

export function AuthPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('inputEmail');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };

  // 已登录用户访问 /auth 时直接跳转到列表
  useEffect(() => {
    if (user) {
      navigate('/items', { replace: true });
    }
  }, [user, navigate]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: sendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (sendError) {
        setError(sendError.message);
      } else {
        setStep('checkEmail');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnonLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) {
        setError(anonError.message);
        return;
      }
      if (data.user) {
        const from = location.state?.from?.pathname ?? '/items';
        navigate(from, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm rounded-3xl border border-[var(--stockin-border-subtle)] bg-[var(--stockin-bg-soft)]/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.85)]">
        <header className="pb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-[var(--stockin-accent-soft)] px-3 py-1 text-[11px] font-medium text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Stockin · 我的库存抽屉
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            进入库存
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            匿名即可使用，无需注册；邮箱登录可多设备同步。
          </p>
        </header>

        <main>
          {step === 'inputEmail' && (
            <>
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleAnonLogin}
                  className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-medium text-slate-950 shadow-[0_14px_30px_rgba(16,185,129,0.35)] disabled:opacity-60"
                >
                  {loading ? '进入中...' : '匿名进入（推荐先体验）'}
                </button>
                <p className="text-center text-[11px] text-slate-500">
                  或使用邮箱登录，多设备同步
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="mt-5 space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
                <label className="block text-xs font-medium text-slate-200">
                  邮箱地址
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="例如：you@example.com"
                    className="mt-2 w-full rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2.5 text-sm outline-none ring-2 ring-transparent placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-emerald-500/40"
                    required
                  />
                </label>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-100 disabled:opacity-60"
                >
                  {loading ? '发送中...' : '发送登录链接'}
                </button>
              </form>
            </>
          )}

          {step === 'checkEmail' && (
            <div className="space-y-3 text-sm">
              <p className="text-slate-200">
                登录链接已发送至 <span className="font-mono">{email}</span>。
              </p>
              <p className="text-xs text-slate-400">
                请在 5 分钟内打开邮箱，点击邮件中的链接完成登录。完成后本页会自动识别你的登录状态。
              </p>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

