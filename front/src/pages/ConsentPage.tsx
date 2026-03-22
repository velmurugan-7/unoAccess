// import { useEffect, useState } from 'react';
// import { useSearchParams, useNavigate } from 'react-router-dom';
// import api from '../lib/api';
// import { Logo, Button } from '../components/ui';
// import { Shield, CheckCircle } from 'lucide-react';

// interface ConsentData {
//   clientName: string;
//   clientLogo?: string;
//   website?: string;
//   scopes: string[];
//   clientId: string;
//   redirectUri: string;
//   state?: string;
// }

// const SCOPE_DESCRIPTIONS: Record<string, string> = {
//   openid: 'Verify your identity',
//   profile: 'Access your name and profile info',
//   email: 'Access your email address',
// };

// export default function ConsentPage() {
//   const [params] = useSearchParams();
//   const navigate = useNavigate();
//   const [consent, setConsent] = useState<ConsentData | null>(null);
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     const query = params.toString();
//     api.get(`/oauth/authorize?${query}`)
//       .then(({ data }) => setConsent(data.consent))
//       .catch((err) => {
//         if (err.response?.status === 401) navigate(`/login?redirect=/oauth/authorize?${query}`);
//         else setError(err.response?.data?.message || 'Failed to load authorization request');
//       });
//   }, []);

//   const handleDecision = async (approved: boolean) => {
//     if (!consent) return;
//     setIsLoading(true);
//     try {
//       const { data } = await api.post('/oauth/authorize', {
//         client_id: consent.clientId,
//         redirect_uri: consent.redirectUri,
//         scope: consent.scopes.join(' '),
//         state: consent.state,
//         approved,
//       });
//       window.location.href = data.redirectUrl;
//     } catch {
//       setError('Authorization failed');
//       setIsLoading(false);
//     }
//   };

//   if (error) return (
//     <div className="auth-shell">
//       <div className="auth-card p-8 max-w-md w-full text-center">
//         <p className="text-red-400">{error}</p>
//       </div>
//     </div>
//   );

//   if (!consent) return (
//     <div className="auth-shell">
//       <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
//     </div>
//   );

//   return (
//     <div className="auth-shell">
//       <div className="w-full max-w-md">
//         <div className="auth-card p-8 shadow-2xl">
//           <div className="flex justify-center mb-6"><Logo /></div>

//           <div className="text-center mb-6">
//             <div className="w-16 h-16 bg-indigo-600/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
//               {consent.clientLogo
//                 ? <img src={consent.clientLogo} alt={consent.clientName} className="w-12 h-12 object-contain" />
//                 : consent.clientName[0]}
//             </div>
//             <h1 className="text-xl font-bold">{consent.clientName}</h1>
//             {consent.website && <p className="text-[var(--c-text3)] text-sm">{consent.website}</p>}
//           </div>

//           <div className="glass-dark p-4 mb-6">
//             <p className="text-sm text-[var(--c-text2)] mb-3 flex items-center gap-2">
//               <Shield className="w-4 h-4 text-indigo-400" />
//               This app is requesting access to:
//             </p>
//             <ul className="space-y-2">
//               {consent.scopes.map((scope) => (
//                 <li key={scope} className="flex items-center gap-3 text-sm">
//                   <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
//                   <span>{SCOPE_DESCRIPTIONS[scope] || scope}</span>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           <div className="flex gap-3">
//             <Button variant="secondary" onClick={() => handleDecision(false)} disabled={isLoading} className="flex-1">
//               Deny
//             </Button>
//             <Button onClick={() => handleDecision(true)} isLoading={isLoading} className="flex-1">
//               Allow
//             </Button>
//           </div>

//           <p className="text-[var(--c-text3)] text-xs text-center mt-4">
//             You can revoke this access anytime from your dashboard.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useSearchParams } from 'react-router-dom';
// import { useState } from 'react';
// import api from '../lib/api';
// import { Logo, Button } from '../components/ui';
// import { Shield, CheckCircle } from 'lucide-react';

// const SCOPE_DESCRIPTIONS: Record<string, string> = {
//   openid: 'Verify your identity',
//   profile: 'Access your name and profile info',
//   email: 'Access your email address',
// };

// export default function ConsentPage() {
//   const [params] = useSearchParams();
//   // const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');

//   // Extract all parameters from URL (sent by backend)
//   const clientName = params.get('client_name') || 'Unknown App';
//   const clientLogo = params.get('client_logo') || '';
//   const website = params.get('website') || '';
//   const scopes = (params.get('scope') || '').split(' ');
//   const clientId = params.get('client_id') || '';
//   const redirectUri = params.get('redirect_uri') || '';
//   const state = params.get('state') || '';
//   const responseType = params.get('response_type') || 'code';

//   const handleDecision = async (approved: boolean) => {
//     setIsLoading(true);
//     try {
//       const { data } = await api.post('/oauth/authorize', {
//         client_id: clientId,
//         redirect_uri: redirectUri,
//         scope: scopes.join(' '),
//         state,
//         response_type: responseType,
//         approved,
//       });
//       // Backend should return a redirect URL to the client's callback
//       window.location.href = data.redirectUrl;
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Authorization failed');
//       setIsLoading(false);
//     }
//   };

//   if (error) {
//     return (
//       <div className="auth-shell">
//         <div className="auth-card p-8 max-w-md w-full text-center">
//           <p className="text-red-400">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="auth-shell">
//       <div className="w-full max-w-md">
//         <div className="auth-card p-8 shadow-2xl">
//           <div className="flex justify-center mb-6"><Logo /></div>

//           <div className="text-center mb-6">
//             <div className="w-16 h-16 bg-indigo-600/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
//               {clientLogo ? (
//                 <img src={clientLogo} alt={clientName} className="w-12 h-12 object-contain" />
//               ) : (
//                 clientName[0]
//               )}
//             </div>
//             <h1 className="text-xl font-bold">{clientName}</h1>
//             {website && <p className="text-[var(--c-text3)] text-sm">{website}</p>}
//           </div>

//           <div className="glass-dark p-4 mb-6">
//             <p className="text-sm text-[var(--c-text2)] mb-3 flex items-center gap-2">
//               <Shield className="w-4 h-4 text-indigo-400" />
//               This app is requesting access to:
//             </p>
//             <ul className="space-y-2">
//               {scopes.map((scope) => (
//                 <li key={scope} className="flex items-center gap-3 text-sm">
//                   <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
//                   <span>{SCOPE_DESCRIPTIONS[scope] || scope}</span>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           <div className="flex gap-3">
//             <Button
//               variant="secondary"
//               onClick={() => handleDecision(false)}
//               disabled={isLoading}
//               className="flex-1"
//             >
//               Deny
//             </Button>
//             <Button
//               onClick={() => handleDecision(true)}
//               isLoading={isLoading}
//               className="flex-1"
//             >
//               Allow
//             </Button>
//           </div>

//           <p className="text-[var(--c-text3)] text-xs text-center mt-4">
//             You can revoke this access anytime from your dashboard.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }