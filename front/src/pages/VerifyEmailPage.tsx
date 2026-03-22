// import { useEffect, useState, useRef } from "react";
// import { Link, useSearchParams, useNavigate } from "react-router-dom";
// import api from "../lib/api";
// import { Logo, Alert } from "../components/ui";
// import { CheckCircle, XCircle } from "lucide-react";

// // Mini confetti
// const Confetti = () => (
//   <div className="fixed inset-0 pointer-events-none overflow-hidden">
//     {[...Array(30)].map((_, i) => (
//       <div
//         key={i}
//         className="absolute w-2 h-2 rounded-sm animate-bounce"
//         style={{
//           left: `${Math.random() * 100}%`,
//           top: `${Math.random() * 60}%`,
//           backgroundColor: [
//             "#6366f1",
//             "#a855f7",
//             "#ec4899",
//             "#f59e0b",
//             "#10b981",
//           ][i % 5],
//           animationDelay: `${Math.random() * 2}s`,
//           animationDuration: `${1 + Math.random()}s`,
//           transform: `rotate(${Math.random() * 360}deg)`,
//         }}
//       />
//     ))}
//   </div>
// );

// export default function VerifyEmailPage() {
//   const [params] = useSearchParams();
//   const token = params.get("token") || "";
//   const [status, setStatus] = useState<"loading" | "success" | "error">(
//     "loading",
//   );
//   const [resendLoading, setResendLoading] = useState(false);
//   const hasRun = useRef(false);
//   const [message, setMessage] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (!token) {
//       setStatus("error");
//       setMessage("No verification token provided.");
//       return;
//     }
//     if (hasRun.current) return; // 👈 prevent second run
//     hasRun.current = true;
//     api
//       .get(`/api/auth/verify-email/${token}`)
//       .then(({ data }) => {
//         setStatus("success");
//         setMessage(data.message);
//         if (data.message.includes("log in manually")) {
//           // Don't auto‑redirect; user will click the button
//         } else {
//           // Auto‑redirect after 2 seconds
//           setTimeout(() => navigate("/dashboard"), 2000);
//         }
//       })
//       .catch((err) => {
//         setStatus("error");
//         setMessage(err.response?.data?.message || "Verification failed.");
//       });
//   }, [token, navigate]);

//   const resend = async () => {
//     // Simple prompt – replace with a proper form if you like
//     const email = window.prompt(
//       "Please enter your email address to resend verification:",
//     );
//     if (!email) return;

//     setResendLoading(true);
//     try {
//       await api.post("/api/auth/resend-verification", { email });
//       alert("Verification email sent! Please check your inbox.");
//       // Optionally redirect to login or show success message
//     } catch (err: any) {
//       alert(
//         err.response?.data?.message || "Failed to resend verification email",
//       );
//     } finally {
//       setResendLoading(false);
//     }
//   };

//   return (
//     <div className="auth-shell">
//       {status === "success" && <Confetti />}
//       <div className="w-full max-w-md relative z-10">
//         <div className="auth-card p-8 shadow-2xl text-center">
//           <div className="flex justify-center mb-8">
//             <Logo />
//           </div>

//           {status === "loading" && (
//             <div className="flex flex-col items-center gap-4">
//               <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
//               <p className="text-[var(--c-text3)]">Verifying your email...</p>
//             </div>
//           )}

//           {status === "success" && (
//             <div className="flex flex-col items-center gap-4">
//               <CheckCircle className="w-16 h-16 text-green-400" />
//               <h1 className="text-2xl font-bold">Email Verified!</h1>
//               <p className="text-[var(--c-text2)]">{message}</p>
//               <Link
//                 to="/login"
//                 className="btn-primary w-full flex items-center justify-center mt-2"
//               >
//                 Go to Login
//               </Link>
//             </div>
//           )}

//           {status === "error" && (
//             <div className="flex flex-col items-center gap-4">
//               <XCircle className="w-16 h-16 text-red-400" />
//               <h1 className="text-2xl font-bold">Verification Failed</h1>
//               <Alert type="error" message={message} />
//               <button
//                 onClick={resend}
//                 className="btn-secondary w-full"
//                 disabled={resendLoading}
//               >
//                 {resendLoading ? "Sending..." : "Resend verification email"}
//               </button>
//               <Link to="/login" className="link text-sm">
//                 Back to login
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Logo, Alert, Input, Button } from '../components/ui';
import { CheckCircle, XCircle } from 'lucide-react';

// Mini confetti (unchanged)
const Confetti = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {[...Array(30)].map((_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 rounded-sm animate-bounce"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 60}%`,
          backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'][i % 5],
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${1 + Math.random()}s`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }}
      />
    ))}
  </div>
);

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const hasRun = useRef(false);

  // Resend state
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    if (hasRun.current) return;
    hasRun.current = true;

    api
      .get(`/api/auth/verify-email/${token}`)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message);
        if (!data.message.includes('log in manually')) {
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, [token, navigate]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendSuccess('');
    setResendError('');

    try {
      await api.post('/api/auth/resend-verification', { email: resendEmail });
      setResendSuccess('Verification email sent! Please check your inbox.');
      setResendEmail(''); // optional: clear after success
    } catch (err: any) {
      setResendError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {status === 'success' && <Confetti />}
      <div className="w-full max-w-md relative z-10">
        <div className="auth-card p-8 shadow-2xl text-center">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full" />
              <p className="text-[var(--c-text3)]">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-green-400" />
              <h1 className="text-2xl font-bold">Email Verified!</h1>
              <p className="text-[var(--c-text2)]">{message}</p>
              <Link to="/login" className="btn-primary w-full flex items-center justify-center mt-2">
                Go to Login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-16 h-16 text-red-400" />
              <h1 className="text-2xl font-bold">Verification Failed</h1>
              <Alert type="error" message={message} />

              {/* Resend form */}
              <div className="w-full mt-4 pt-4 border-t border-white/10">
                <p className="text-[var(--c-text2)] text-sm mb-4">
                  Didn't receive the email, or it expired? Enter your email to resend.
                </p>
                <form onSubmit={handleResend} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    disabled={resendLoading}
                  />
                  <Button
                    type="submit"
                    isLoading={resendLoading}
                    disabled={resendLoading}
                    className="w-full"
                  >
                    Resend verification email
                  </Button>
                </form>

                {resendSuccess && (
                  <div className="mt-3">
                    <Alert type="success" message={resendSuccess} />
                  </div>
                )}
                {resendError && (
                  <div className="mt-3">
                    <Alert type="error" message={resendError} />
                  </div>
                )}
              </div>

              <Link to="/login" className="link text-sm mt-2">
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}