import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

type Step =
  | 'main'
  | 'magic'
  | 'password'
  | 'register'
  | 'checkEmail';

export function AuthPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };

  useEffect(() => {
    if (user) {
      navigate('/items', { replace: true });
    }
  }, [user, navigate]);

  const goBack = () => {
    setStep('main');
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSendMagicLink = async (e: FormEvent) => {
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

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError) {
        // Supabase 开启「邮箱确认」时，未点确认链接会报 Invalid login credentials
        const msg =
          signInError.message === 'Invalid login credentials'
            ? '邮箱或密码错误，或账号尚未完成邮箱验证。若刚注册，请先到邮箱点击确认链接后再登录。'
            : signInError.message;
        setError(msg);
        return;
      }
      const from = location.state?.from?.pathname ?? '/items';
      navigate(from, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      // 若 Supabase 开启了 Confirm email，注册后不会有 session，需先点邮件里的确认链接才能用密码登录
      const needConfirm = data.user && !data.session;
      setSuccessMessage(
        needConfirm
          ? '注册成功。请到邮箱点击确认链接完成验证后，再使用账号密码登录。'
          : '注册成功，可直接使用上面的邮箱和密码登录。'
      );
      setStep('password');
      setPassword('');
      setConfirmPassword('');
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
            {step === 'main' && '进入库存'}
            {step === 'magic' && '邮箱链接登录'}
            {step === 'password' && '账号密码登录'}
            {step === 'register' && '注册账号'}
            {step === 'checkEmail' && '查收邮件'}
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            {step === 'main' &&
              '匿名即可使用，无需注册；邮箱登录可多设备同步。'}
            {step === 'magic' && '输入邮箱，我们将发送登录链接。'}
            {step === 'password' && '使用已注册的邮箱和密码登录。'}
            {step === 'register' && '注册后可使用账号密码登录。'}
            {step === 'checkEmail' && '请打开邮箱点击链接完成登录。'}
          </p>
        </header>

        <main>
          {step === 'main' && (
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
                  或使用邮箱登录 / 注册，多设备同步
                </p>
              </div>

              <div className="mt-5 space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
                <button
                  type="button"
                  onClick={() => setStep('magic')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200"
                >
                  邮箱魔法链接登录
                </button>
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200"
                >
                  账号密码登录
                </button>
                <button
                  type="button"
                  onClick={() => setStep('register')}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200"
                >
                  注册新账号
                </button>
              </div>
            </>
          )}

          {step === 'magic' && (
            <form
              onSubmit={handleSendMagicLink}
              className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4"
            >
              <button
                type="button"
                onClick={goBack}
                className="text-xs text-slate-500 underline"
              >
                ← 返回
              </button>
              <label className="block text-xs font-medium text-slate-200">
                邮箱地址
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
          )}

          {step === 'password' && (
            <form
              onSubmit={handlePasswordLogin}
              className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4"
            >
              <button
                type="button"
                onClick={goBack}
                className="text-xs text-slate-500 underline"
              >
                ← 返回
              </button>
              {successMessage && (
                <p className="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200">
                  {successMessage}
                </p>
              )}
              <label className="block text-xs font-medium text-slate-200">
                邮箱
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2.5 text-sm outline-none ring-2 ring-transparent placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-emerald-500/40"
                  required
                />
              </label>
              <label className="block text-xs font-medium text-slate-200">
                密码
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  className="mt-2 w-full rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2.5 text-sm outline-none ring-2 ring-transparent placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-emerald-500/40"
                  required
                  minLength={6}
                />
              </label>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? '登录中...' : '登录'}
              </button>
              <p className="text-center text-[11px] text-slate-500">
                还没有账号？{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStep('register');
                    setError(null);
                  }}
                  className="text-emerald-400 underline"
                >
                  注册
                </button>
              </p>
            </form>
          )}

          {step === 'register' && (
            <form
              onSubmit={handleRegister}
              className="space-y-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4"
            >
              <button
                type="button"
                onClick={goBack}
                className="text-xs text-slate-500 underline"
              >
                ← 返回
              </button>
              <label className="block text-xs font-medium text-slate-200">
                邮箱
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2.5 text-sm outline-none ring-2 ring-transparent placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-emerald-500/40"
                  required
                />
              </label>
              <label className="block text-xs font-medium text-slate-200">
                密码（至少 6 位）
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 位以上"
                  className="mt-2 w-full rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2.5 text-sm outline-none ring-2 ring-transparent placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-emerald-500/40"
                  required
                  minLength={6}
                />
              </label>
              <label className="block text-xs font-medium text-slate-200">
                确认密码
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再输入一次"
                  className="mt-2 w-full rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2.5 text-sm outline-none ring-2 ring-transparent placeholder:text-slate-600 focus:border-emerald-500/60 focus:ring-emerald-500/40"
                  required
                  minLength={6}
                />
              </label>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? '注册中...' : '注册'}
              </button>
              <p className="text-center text-[11px] text-slate-500">
                已有账号？{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStep('password');
                    setError(null);
                  }}
                  className="text-emerald-400 underline"
                >
                  去登录
                </button>
              </p>
            </form>
          )}

          {step === 'checkEmail' && (
            <div className="space-y-3 text-sm">
              <button
                type="button"
                onClick={goBack}
                className="text-xs text-slate-500 underline"
              >
                ← 返回
              </button>
              <p className="text-slate-200">
                登录链接已发送至 <span className="font-mono">{email}</span>。
              </p>
              <p className="text-xs text-slate-400">
                请在 5 分钟内打开邮箱，点击邮件中的链接完成登录。
              </p>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
