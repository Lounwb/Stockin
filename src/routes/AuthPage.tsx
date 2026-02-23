import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

type Step = 'inputPhone' | 'verifyOtp';

export function AuthPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('inputPhone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
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
        phone,
        options: {
          channel: 'sms'
        }
      });
      if (sendError) {
        setError(sendError.message);
      } else {
        setStep('verifyOtp');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      });
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      if (data.session) {
        const from = location.state?.from?.pathname ?? '/items';
        navigate(from, { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="px-4 pt-10 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stockin 库存管理</h1>
        <p className="mt-2 text-sm text-slate-400">使用手机号登录，随时掌握库存。</p>
      </header>

      <main className="flex-1 px-4">
        {step === 'inputPhone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">
              手机号
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="例如：+86 13800000000"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-emerald-500"
                required
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
            >
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </form>
        )}

        {step === 'verifyOtp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-slate-300">
              验证码已发送至 <span className="font-mono">{phone}</span>
            </p>
            <label className="block text-sm font-medium text-slate-200">
              验证码
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6 位数字"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm outline-none ring-2 ring-transparent focus:ring-emerald-500"
                required
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
            >
              {loading ? '登录中...' : '验证并登录'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

