import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bug, CheckCircle, ChevronDown, ChevronUp, Users } from 'lucide-react';
import api from '../lib/api';
import { AppShell, AppSubNav } from '../components/AppShell';
import { Button, Badge, PageLoader } from '../components/ui';

interface CapturedError {
  _id: string; message: string; stack?: string; count: number;
  firstSeenAt: string; lastSeenAt: string; service?: string;
  affectedUsers: string[]; isResolved: boolean; fingerprint: string;
}

export default function ErrorsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [errors, setErrors] = useState<CapturedError[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [includeResolved, setIncludeResolved] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/api/monitoring/${clientId}/errors?includeResolved=${includeResolved}`)
      .then(({ data }) => setErrors(data.errors))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [clientId, includeResolved]);

  const resolve = async (id: string) => {
    setResolving(id);
    try {
      await api.patch(`/api/monitoring/${clientId}/errors/${id}/resolve`);
      setErrors(prev => prev.map(e => e._id === id ? { ...e, isResolved: true } : e));
    } finally { setResolving(null); }
  };

  const fmt = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) return <AppShell><PageLoader /></AppShell>;

  return (
    <AppShell>
      <AppSubNav clientId={clientId!} />
      <div className="max-w-5xl mx-auto px-6 pb-10">
        <div className="page-header flex items-start justify-between">
          <div>
            <h1 className="page-title">Error Tracking</h1>
            <p className="page-subtitle">{errors.length} unique error{errors.length !== 1 ? 's' : ''} grouped by message</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--c-text2)] cursor-pointer">
            <input type="checkbox" checked={includeResolved} onChange={e => setIncludeResolved(e.target.checked)} className="rounded border-[var(--c-border2)]" />
            Show resolved
          </label>
        </div>

        {errors.length === 0 ? (
          <div className="card card-p text-center py-16">
            <Bug className="w-10 h-10 text-[var(--c-green)] mx-auto mb-3" />
            <p className="font-medium text-[var(--c-text)]">No errors captured</p>
            <p className="text-sm text-[var(--c-text3)] mt-1">Use <code className="code-inline">monitor.captureError(error)</code> in your SDK to track exceptions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {errors.map(err => (
              <div key={err._id} className={`card ${err.isResolved ? 'opacity-60' : ''}`}>
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer"
                  onClick={() => setExpanded(prev => prev === err._id ? null : err._id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {err.isResolved ? <Badge variant="green">Resolved</Badge> : <Badge variant="red" dot>Active</Badge>}
                      {err.service && <Badge variant="purple">{err.service}</Badge>}
                      <span className="badge badge-gray">{err.count}×</span>
                    </div>
                    <p className="text-sm font-mono font-medium text-[var(--c-text)] truncate">{err.message}</p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--c-text3)]">
                      <span>First: {fmt(err.firstSeenAt)}</span>
                      <span>Last: {fmt(err.lastSeenAt)}</span>
                      {err.affectedUsers.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />{err.affectedUsers.length} user{err.affectedUsers.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!err.isResolved && (
                      <Button variant="secondary" size="sm" isLoading={resolving === err._id} leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                        onClick={e => { e.stopPropagation(); resolve(err._id); }}>
                        Resolve
                      </Button>
                    )}
                    {expanded === err._id ? <ChevronUp className="w-4 h-4 text-[var(--c-text3)]" /> : <ChevronDown className="w-4 h-4 text-[var(--c-text3)]" />}
                  </div>
                </div>

                {expanded === err._id && err.stack && (
                  <div className="border-t border-[var(--c-border)]">
                    <div className="p-4">
                      <p className="text-xs font-medium text-[var(--c-text3)] mb-2">Stack trace</p>
                      <pre className="code-block text-xs overflow-x-auto whitespace-pre-wrap break-words">{err.stack}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
