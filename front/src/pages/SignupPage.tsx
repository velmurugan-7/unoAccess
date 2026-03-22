// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { Eye, EyeOff, ArrowRight } from 'lucide-react';
// import api from '../lib/api';
// import { Input, Button, Alert, Logo, PasswordStrength } from '../components/ui';

// export default function SignupPage() {
//   const navigate = useNavigate();
//   const [form, setForm] = useState({ name: '', email: '', password: '' });
//   const [showPw, setShowPw] = useState(false);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault(); setError(''); setLoading(true);
//     try {
//       await api.post('/api/auth/register', form);
//       navigate('/login?registered=1');
//     } catch (err: any) {
//       setError(err?.response?.data?.message || 'Registration failed');
//     } finally { setLoading(false); }
//   };

//   return (
//     <div className="auth-shell">
//       <div className="w-full max-w-[380px]">
//         <div className="text-center mb-7">
//           <Link to="/"><Logo size="lg" /></Link>
//           <h1 className="text-2xl font-bold mt-5 tracking-tight text-[var(--c-text)]">Create your account</h1>
//           <p className="text-[var(--c-text3)] text-sm mt-1.5">Start for free — no credit card required</p>
//         </div>
//         <div className="auth-card">
//           {error && <Alert type="error" message={error} className="mb-4" />}
//           <form onSubmit={submit} className="space-y-4">
//             <Input label="Full name" id="name" type="text" placeholder="Ada Lovelace" value={form.name} onChange={set('name')} required autoFocus />
//             <Input label="Email address" id="email" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
//             <div>
//               <label className="label" htmlFor="pw">Password</label>
//               <div className="relative">
//                 <input id="pw" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required minLength={8} className="input pr-10" />
//                 <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text3)] hover:text-[var(--c-text)]" onClick={() => setShowPw(v => !v)}>
//                   {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                 </button>
//               </div>
//               <PasswordStrength password={form.password} />
//             </div>
            
//             <Button type="submit" variant="primary" className="w-full" isLoading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
//               Create account
//             </Button>
//           </form>
//           <p className="text-xs text-[var(--c-text3)] text-center mt-4">
//             By creating an account you agree to our <a href="/docs/terms" className="text-[var(--c-blue)] hover:underline">Terms of Service</a>
//           </p>
//         </div>
//         <p className="text-center text-sm text-[var(--c-text3)] mt-5">
//           Already have an account?{' '}
//           <Link to="/login" className="text-[var(--c-blue)] font-medium hover:underline">Sign in</Link>
//         </p>
//       </div>
//     </div>
//   );
// }
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import { Input, Button, Alert, Logo, PasswordStrength } from '../components/ui';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); 

    // Client-side password match check
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', form);
      navigate('/login?registered=1');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-shell">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-7">
          <Link to="/"><Logo size="lg" /></Link>
          <h1 className="text-2xl font-bold mt-5 tracking-tight text-[var(--c-text)]">Create your account</h1>
          <p className="text-[var(--c-text3)] text-sm mt-1.5">Start for free — no credit card required</p>
        </div>
        <div className="auth-card">
          {error && <Alert type="error" message={error} className="mb-4" />}
          <form onSubmit={submit} className="space-y-4">
            <Input label="Full name" id="name" type="text" placeholder="Ada Lovelace" value={form.name} onChange={set('name')} required autoFocus />
            <Input label="Email address" id="email" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />

            {/* Password */}
            <div>
              <label className="label" htmlFor="pw">Password</label>
              <div className="relative">
                <input id="pw" type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} className="input pr-10" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text3)] hover:text-[var(--c-text)]" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label" htmlFor="confirm-pw">Confirm password</label>
              <div className="relative">
                <input
                  id="confirm-pw"
                  type={showConfirmPw ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  minLength={8}
                  className={`input pr-10 ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? 'input-error'
                      : ''
                  }`}
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text3)] hover:text-[var(--c-text)]" onClick={() => setShowConfirmPw(v => !v)}>
                  {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Inline mismatch hint */}
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="error-msg">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" variant="primary" className="w-full" isLoading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Create account
            </Button>
          </form>
          <p className="text-xs text-[var(--c-text3)] text-center mt-4">
            By creating an account you agree to our <a href="/docs/terms" className="text-[var(--c-blue)] hover:underline">Terms of Service</a>
          </p>
        </div>
        <p className="text-center text-sm text-[var(--c-text3)] mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--c-blue)] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}