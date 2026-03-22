import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Input, Button, Alert, Logo } from '../components/ui';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSuccess('If that email exists, a reset link has been sent. Check your inbox.');
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-indigo-400/40 rounded-full animate-bounce"
            style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 2) * 60}%`, animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="auth-card p-8 shadow-2xl">
          <div className="flex justify-center mb-8"><Logo /></div>

          <div className="w-16 h-16 bg-indigo-600/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-indigo-300" />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Forgot password?</h1>
          <p className="text-[var(--c-text3)] text-center text-sm mb-8">Enter your email and we'll send you a reset link</p>

          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
          {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" isLoading={isLoading}>Send reset link</Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="link text-sm flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
