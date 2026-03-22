// import { useEffect, useState } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { User, Plus } from 'lucide-react';
// import { Logo } from '../components/ui';

// /**
//  * AccountChooserPage
//  * Displayed when prompt=select_account is used in the OAuth flow.
//  * Shows up to 5 previously-used accounts plus an "Use another account" option.
//  */
// export default function AccountChooserPage() {
//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();

//   const [accounts, setAccounts] = useState<string[]>([]);
//   const [oauthParams, setOauthParams] = useState<Record<string, string>>({});

//   useEffect(() => {
//     // Parse accounts from query string (set by backend)
//     const rawAccounts = searchParams.get('accounts');
//     try {
//       const parsed = JSON.parse(decodeURIComponent(rawAccounts || '[]'));
//       if (Array.isArray(parsed)) setAccounts(parsed.slice(0, 5));
//     } catch {
//       setAccounts([]);
//     }

//     // Preserve all other OAuth params to forward after selection
//     const params: Record<string, string> = {};
//     for (const [key, val] of searchParams.entries()) {
//       if (key !== 'accounts') params[key] = val;
//     }
//     setOauthParams(params);
//   }, [searchParams]);

//   const handleSelectAccount = (email: string) => {
//     // Redirect back to /oauth/authorize with login_hint and WITHOUT prompt=select_account
//     const params = new URLSearchParams(oauthParams);
//     params.delete('prompt');
//     params.set('login_hint', email);
//     // The authorize endpoint is a backend route
//     window.location.href = `/oauth/authorize?${params.toString()}`;
//   };

//   const handleUseAnother = () => {
//     // Go to login page without any hint, preserving the OAuth params for redirect
//     const params = new URLSearchParams(oauthParams);
//     params.delete('prompt');
//     const redirectTarget = `/oauth/authorize?${params.toString()}`;
//     navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
//   };

//   const clientName = oauthParams.client_name || 'an application';
//   const clientLogo = oauthParams.client_logo;

//   return (
//     <div className="auth-shell">
//       {/* Background orbs */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
//       </div>

//       <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12">
//         {/* Logo */}
//         <div className="flex justify-center mb-8">
//           <Logo size="lg" />
//         </div>

//         <div className="auth-card p-8">
//           {/* Client info */}
//           <div className="text-center mb-6">
//             {clientLogo && (
//               <img src={clientLogo} alt={clientName} className="w-12 h-12 object-contain mx-auto mb-3 rounded-lg" />
//             )}
//             <h1 className="text-2xl font-bold text-white mb-1">Choose an account</h1>
//             <p className="text-[var(--c-text3)] text-sm">to continue to <span className="text-[var(--c-text2)]">{clientName}</span></p>
//           </div>

//           {/* Account cards */}
//           <div className="space-y-2 mb-4">
//             {accounts.map((email) => (
//               <button
//                 key={email}
//                 onClick={() => handleSelectAccount(email)}
//                 className="w-full flex items-center gap-4 p-4 bg-[var(--c-surface2)] hover:bg-[var(--c-surface2)] rounded-xl transition-all text-left group"
//               >
//                 <div className="w-10 h-10 bg-indigo-300/40 rounded-full flex items-center justify-center flex-shrink-0">
//                   <User className="w-5 h-5 text-indigo-600" />
//                 </div>
//                 <span className="text-indigo-600/40 group-hover:text-black/40 transition-colors truncate flex-1">
//                   {email}
//                 </span>
//                 {/* <ChevronRight className="w-4 h-4 text-[var(--c-text3)] group-hover:text-[var(--c-text2)] flex-shrink-0 transition-colors" /> */}
//               </button>
//             ))}
//           </div>

//           {/* Use another account */}
//           <button
//             onClick={handleUseAnother}
//             className="w-full flex items-center gap-4 p-4 bg-[var(--c-surface2)] hover:bg-[var(--c-surface2)] rounded-xl transition-all text-left group"
//           >
//             <div className="w-10 h-10 bg-[var(--c-surface2)] rounded-full flex items-center justify-center flex-shrink-0">
//               <Plus className="w-5 h-5 text-[var(--c-text3)]" />
//             </div>
//             <span className="text-[var(--c-text2)] group-hover:text-indigo-600/40 transition-colors">
//               Use another account
//             </span>
//             {/* <ChevronRight className="w-4 h-4 text-[var(--c-text3)] group-hover:text-[var(--c-text2)] flex-shrink-0 transition-colors" /> */}
//           </button>

//           <p className="text-center text-[var(--c-text3)] text-xs mt-6">
//             To sign in, UnoAccess will share your name, email address, and profile picture with {clientName}.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import { Logo } from '../components/ui';
import { useAuthStore } from '../store/authStore';

export default function AccountChooserPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Fetch profile on mount — this page is outside ProtectedRoute so
  // the store may not have loaded yet even if the user has a session cookie.
  const { user, fetchProfile } = useAuthStore();
  useEffect(() => {
    fetchProfile();
  }, []);

  const [accounts, setAccounts] = useState<string[]>([]);
  const [oauthParams, setOauthParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const rawAccounts = searchParams.get('accounts');
    try {
      const parsed = JSON.parse(decodeURIComponent(rawAccounts || '[]'));
      if (Array.isArray(parsed)) setAccounts(parsed.slice(0, 5));
    } catch {
      setAccounts([]);
    }

    const params: Record<string, string> = {};
    for (const [key, val] of searchParams.entries()) {
      if (key !== 'accounts') params[key] = val;
    }
    setOauthParams(params);
  }, [searchParams]);

  const handleSelectAccount = (email: string) => {
    const params = new URLSearchParams(oauthParams);
    params.delete('prompt');
    params.set('login_hint', email);
    window.location.href = `/oauth/authorize?${params.toString()}`;
  };

  const handleUseAnother = () => {
    const params = new URLSearchParams(oauthParams);
    params.delete('prompt');
    const redirectTarget = `/oauth/authorize?${params.toString()}`;
    navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
  };

  const clientName = oauthParams.client_name || 'an application';
  const clientLogo = oauthParams.client_logo;

  // Generate a consistent background color from any string (email/name)
  const colorFromString = (str: string) => {
    const colors = [
      '#2563eb', '#7c3aed', '#db2777', '#dc2626',
      '#d97706', '#16a34a', '#0891b2', '#9333ea',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // Avatar for each account row
  const AccountAvatar = ({ email }: { email: string }) => {
    const isCurrentUser = user?.email === email;

    // Current user with a real avatar photo
    if (isCurrentUser && user?.avatarUrl) {
      return (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-[var(--c-blue-mid)]"
        />
      );
    }

    // Current user — show their name initial with blue highlight
    if (isCurrentUser && user?.name) {
      return (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold ring-2 ring-[var(--c-blue-mid)]"
          style={{ background: colorFromString(user.name) }}
        >
          {user.name[0].toUpperCase()}
        </div>
      );
    }

    // Other past accounts — derive initial from email
    const initial = email[0].toUpperCase();
    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold"
        style={{ background: colorFromString(email) }}
      >
        {initial}
      </div>
    );
  };

  return (
    <div className="auth-shell">
      <div className="w-full max-w-md mx-auto px-4 py-12">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="auth-card">
          {/* Client info */}
          <div className="text-center mb-6">
            {clientLogo && (
              <img
                src={clientLogo}
                alt={clientName}
                className="w-12 h-12 object-contain mx-auto mb-3 rounded-lg border border-[var(--c-border)]"
              />
            )}
            <h1 className="text-xl font-bold text-[var(--c-text)] mb-1">Choose an account</h1>
            <p className="text-[var(--c-text3)] text-sm">
              to continue to{' '}
              <span className="font-medium text-[var(--c-text2)]">{clientName}</span>
            </p>
          </div>

          {/* Account list */}
          <div className="space-y-2 mb-3">
            {accounts.map((email) => {
              const isCurrentUser = user?.email === email;
              return (
                <button
                  key={email}
                  onClick={() => handleSelectAccount(email)}
                  className="w-full flex items-center gap-3 p-3.5 bg-[var(--c-surface2)] hover:bg-[var(--c-border)] rounded-xl transition-colors text-left group"
                >
                  <AccountAvatar email={email} />
                  <div className="flex-1 min-w-0">
                    {/* Show real name for current user */}
                    {isCurrentUser && user?.name && (
                      <p className="text-sm font-medium text-[var(--c-text)] truncate">
                        {user.name}
                      </p>
                    )}
                    <p className={`truncate ${isCurrentUser && user?.name ? 'text-xs text-[var(--c-text3)]' : 'text-sm text-[var(--c-text2)]'}`}>
                      {email}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--c-text3)] group-hover:text-[var(--c-text2)] flex-shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Use another account */}
          <button
            onClick={handleUseAnother}
            className="w-full flex items-center gap-3 p-3.5 bg-[var(--c-surface2)] hover:bg-[var(--c-border)] rounded-xl transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-[var(--c-border2)] flex items-center justify-center flex-shrink-0">
              <Plus className="w-4 h-4 text-[var(--c-text3)]" />
            </div>
            <span className="text-sm text-[var(--c-text2)] group-hover:text-[var(--c-text)] transition-colors">
              Use another account
            </span>
            <ChevronRight className="w-4 h-4 text-[var(--c-text3)] group-hover:text-[var(--c-text2)] ml-auto flex-shrink-0 transition-colors" />
          </button>

          <p className="text-center text-[var(--c-text3)] text-xs mt-5 leading-relaxed">
            UnoAccess will share your name, email, and profile picture with {clientName}.
          </p>
        </div>
      </div>
    </div>
  );
}