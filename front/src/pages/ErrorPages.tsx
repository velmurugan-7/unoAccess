import { Link } from 'react-router-dom';
import { Home, ArrowLeft, ShieldOff, AlertTriangle } from 'lucide-react';
import { Logo } from '../components/ui';

function ErrorShell({ code, title, desc, icon }: { code: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex flex-col">
      <header className="bg-[var(--c-surface)] border-b border-[var(--c-border)] h-14 flex items-center px-4 sm:px-6">
        <Link to="/"><Logo size="sm" /></Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-[var(--c-surface2)] border border-[var(--c-border)] flex items-center justify-center mx-auto mb-6 text-[var(--c-text3)]">
            {icon}
          </div>
          <p className="text-6xl font-bold text-[var(--c-border2)] mb-4">{code}</p>
          <h1 className="text-xl font-bold text-[var(--c-text)] mb-2">{title}</h1>
          <p className="text-sm text-[var(--c-text3)] mb-8 leading-relaxed">{desc}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => window.history.back()} className="btn btn-secondary btn-sm gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Go back
            </button>
            <Link to="/dashboard" className="btn btn-primary btn-sm gap-1.5">
              <Home className="w-3.5 h-3.5" /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return <ErrorShell code="404" title="Page not found" desc="The page you're looking for doesn't exist or may have been moved. Check the URL or head back home." icon={<AlertTriangle className="w-7 h-7" />} />;
}

export function ForbiddenPage() {
  return <ErrorShell code="403" title="Access denied" desc="You don't have permission to view this page. Contact your administrator if you think this is an error." icon={<ShieldOff className="w-7 h-7" />} />;
}

export function ServerErrorPage() {
  return <ErrorShell code="500" title="Something went wrong" desc="We encountered an unexpected error on our end. Our team has been notified. Please try again in a moment." icon={<AlertTriangle className="w-7 h-7" />} />;
}
