import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { Input, Button, Alert, Logo, PasswordStrength } from '../components/ui';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true); setError('');
    try {
      await api.post(`/api/auth/reset-password/${token}`, { password, confirmPassword });
      setSuccess('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Reset failed. The link may be expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="w-full max-w-md">
        <div className="auth-card p-8 shadow-2xl">
          <div className="flex justify-center mb-8"><Logo /></div>
          <h1 className="text-2xl font-bold text-center mb-2">Reset password</h1>
          <p className="text-[var(--c-text3)] text-center text-sm mb-8">Enter your new password below</p>

          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}
          {success && <div className="mb-4"><Alert type="success" message={success} /></div>}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  id="password"
                  type="password"
                  label="New password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <PasswordStrength password={password} />
              </div>
              <Input
                id="confirmPassword"
                type="password"
                label="Confirm new password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" isLoading={isLoading}>Reset password</Button>
            </form>
          )}

          <p className="text-center text-[var(--c-text3)] text-sm mt-6">
            <Link to="/login" className="text-[var(--c-blue)] hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
