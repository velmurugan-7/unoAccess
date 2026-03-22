// import { useState } from 'react';
// import { Link, useNavigate, useSearchParams } from 'react-router-dom';
// import { Eye, EyeOff, ArrowRight } from 'lucide-react';
// import { useAuthStore } from '../store/authStore';
// import { Input, Button, Alert, Logo } from '../components/ui';

// export default function LoginPage() {
//   const [params] = useSearchParams();
//   const navigate = useNavigate();
//   const { login } = useAuthStore();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPw, setShowPw] = useState(false);
//   const [twoFaCode, setTwoFaCode] = useState('');
//   const [needsTwoFa, setNeedsTwoFa] = useState(false);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const redirect = params.get('redirect') || '/dashboard';

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(''); setLoading(true);
//     try {
//       await login(email, password, twoFaCode || undefined);
//       navigate(redirect, { replace: true });
//     } catch (err: any) {
//       const msg = err?.response?.data?.message || 'Sign in failed';
//       if (msg.toLowerCase().includes('two-factor') || msg.toLowerCase().includes('2fa')) {
//         setNeedsTwoFa(true); setError('');
//       } else {
//         setError(msg);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-shell">
//       <div className="w-full max-w-[380px]">
//         <div className="text-center mb-7">
//           <div className='flex justify-center w-full'><Link to="/" className=''><Logo size="lg" /></Link></div>
//           <h1 className="text-2xl font-bold mt-5 tracking-tight text-[var(--c-text)]">Welcome back</h1>
//           <p className="text-[var(--c-text3)] text-sm mt-1.5">Sign in to your account</p>
//         </div>

//         <div className="auth-card">
//           {error && <Alert type="error" message={error} className="mb-4" />}

//           <form onSubmit={submit} className="space-y-4">
//             {!needsTwoFa ? (
//               <>
//                 <Input
//                   label="Email address" id="email" type="email" autoComplete="email"
//                   placeholder="you@company.com" value={email}
//                   onChange={e => setEmail(e.target.value)} required autoFocus
//                 />
//                 <div>
//                   <div className="flex items-center justify-between mb-1.5">
//                     <label className="label mb-0" htmlFor="pw">Password</label>
//                     <Link to="/forgot-password" className="text-xs text-[var(--c-blue)] hover:underline">Forgot password?</Link>
//                   </div>
//                   <div className="relative">
//                     <input
//                       id="pw" type={showPw ? 'text' : 'password'} autoComplete="current-password"
//                       placeholder="••••••••" value={password}
//                       onChange={e => setPassword(e.target.value)} required
//                       className="input pr-10"
//                     />
//                     <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text3)] hover:text-[var(--c-text)]" onClick={() => setShowPw(v => !v)}>
//                       {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                     </button>
//                   </div>
//                 </div>
//               </>
//             ) : (
//               <div>
//                 <div className="text-center py-2 mb-3">
//                   <p className="text-sm font-medium text-[var(--c-text)]">Two-factor authentication</p>
//                   <p className="text-xs text-[var(--c-text3)] mt-1">Enter the 6-digit code from your authenticator app</p>
//                 </div>
//                 <Input
//                   label="Authentication code" id="code" type="text"
//                   placeholder="000000" maxLength={6} pattern="[0-9]{6}"
//                   value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} autoFocus required
//                 />
//               </div>
//             )}

//             <Button type="submit" variant="primary" className="w-full" size="md" isLoading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}>
//               {needsTwoFa ? 'Verify' : 'Sign in'}
//             </Button>
//           </form>
//         </div>

//         <p className="text-center text-sm text-[var(--c-text3)] mt-5">
//           Don't have an account?{' '}
//           <Link to="/signup" className="text-[var(--c-blue)] font-medium hover:underline">Create one</Link>
//         </p>
//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Input, Button, Alert, Logo } from '../components/ui';

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // Issue 1 fix: backend passes ?email=xxx when coming from account chooser
  // so we pre-fill it and auto-focus the password field instead
  const prefillEmail = params.get('email') || '';

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [needsTwoFa, setNeedsTwoFa] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = params.get('redirect') || '/dashboard';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password, twoFaCode || undefined);

      // Issue 2 fix: /oauth/authorize is a backend route — React Router cannot
      // handle it. Using navigate() causes a 404 because there's no frontend
      // route for /oauth/authorize. Use window.location.href for all OAuth
      // redirects so the browser makes a real HTTP request to the backend.
      if (redirect.startsWith('/oauth/') || redirect.includes('/oauth/')) {
        window.location.href = redirect;
      } else {
        navigate(redirect, { replace: true });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Sign in failed';
      if (msg.toLowerCase().includes('two-factor') || msg.toLowerCase().includes('2fa')) {
        setNeedsTwoFa(true); setError('');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // If email was pre-filled from account chooser, show a pill so user
  // knows which account they're signing into, and skip to password field
  const isEmailLocked = Boolean(prefillEmail);

  return (
    <div className="auth-shell">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-7">
          <Link to="/"><Logo size="lg" /></Link>
          <h1 className="text-2xl font-bold mt-5 tracking-tight text-[var(--c-text)]">Welcome back</h1>
          <p className="text-[var(--c-text3)] text-sm mt-1.5">Sign in to your account</p>
        </div>

        <div className="auth-card">
          {error && <Alert type="error" message={error} className="mb-4" />}

          <form onSubmit={submit} className="space-y-4">
            {!needsTwoFa ? (
              <>
                {/* Email field — locked (read-only pill) when coming from account chooser */}
                {isEmailLocked ? (
                  <div>
                    <label className="label">Email address</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--c-surface2)] border border-[var(--c-border)] rounded-[var(--r-md)]">
                      {/* Colored initial avatar */}
                      <div className="w-6 h-6 rounded-full bg-[var(--c-blue)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {email[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm text-[var(--c-text)] flex-1 truncate">{email}</span>
                      {/* Allow switching account */}
                      <button
                        type="button"
                        onClick={() => { setEmail(''); window.history.back(); }}
                        className="text-xs text-[var(--c-blue)] hover:underline flex-shrink-0"
                      >
                        Switch
                      </button>
                    </div>
                  </div>
                ) : (
                  <Input
                    label="Email address" id="email" type="email" autoComplete="email"
                    placeholder="you@company.com" value={email}
                    onChange={e => setEmail(e.target.value)} required autoFocus
                  />
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="label mb-0" htmlFor="pw">Password</label>
                    <Link to="/forgot-password" className="text-xs text-[var(--c-blue)] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="pw" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                      placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)} required
                      // auto-focus password when email is pre-filled
                      autoFocus={isEmailLocked}
                      className="input pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text3)] hover:text-[var(--c-text)]"
                      onClick={() => setShowPw(v => !v)}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="text-center py-2 mb-3">
                  <p className="text-sm font-medium text-[var(--c-text)]">Two-factor authentication</p>
                  <p className="text-xs text-[var(--c-text3)] mt-1">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
                <Input
                  label="Authentication code" id="code" type="text"
                  placeholder="000000" maxLength={6} pattern="[0-9]{6}"
                  value={twoFaCode} onChange={e => setTwoFaCode(e.target.value)} autoFocus required
                />
              </div>
            )}

            <Button
              type="submit" variant="primary" className="w-full" size="md"
              isLoading={loading} rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {needsTwoFa ? 'Verify' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--c-text3)] mt-5">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[var(--c-blue)] font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}