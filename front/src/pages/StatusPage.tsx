import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';
import { Logo, Spinner } from '../components/ui';
import { Link } from 'react-router-dom';

interface Component { id: string; name: string; status: string; }
interface IncidentUpdate { status: string; message: string; createdAt: string; }
interface Incident { _id: string; title: string; impact: string; status: string; affectedComponents: string[]; updates: IncidentUpdate[]; createdAt: string; resolvedAt?: string; }
interface StatusData { overallStatus: string; components: Component[]; activeIncidents: Incident[]; recentIncidents: Incident[]; }

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  operational:     { label: 'Operational',    color: 'var(--c-green)', icon: <CheckCircle className="w-4 h-4" /> },
  degraded:        { label: 'Degraded',       color: 'var(--c-amber)', icon: <AlertTriangle className="w-4 h-4" /> },
  partial_outage:  { label: 'Partial outage', color: 'var(--c-amber)', icon: <AlertTriangle className="w-4 h-4" /> },
  major_outage:    { label: 'Major outage',   color: 'var(--c-red)',   icon: <XCircle className="w-4 h-4" /> },
};

const overallBanner: Record<string, { bg: string; text: string; sub: string }> = {
  operational:    { bg: '#f0fdf4', text: 'All systems operational', sub: 'No incidents reported' },
  degraded:       { bg: '#fffbeb', text: 'Some systems degraded',  sub: 'We are investigating' },
  partial_outage: { bg: '#fffbeb', text: 'Partial outage',         sub: 'Some services affected' },
  major_outage:   { bg: '#fef2f2', text: 'Major outage',           sub: 'All hands on deck' },
};

function IncidentCard({ incident }: { incident: Incident }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card card-p">
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge ${incident.impact === 'critical' || incident.impact === 'major' ? 'badge-red' : 'badge-amber'}`}>{incident.impact}</span>
            <span className="badge badge-gray">{incident.status}</span>
          </div>
          <p className="font-semibold text-[var(--c-text)] text-sm">{incident.title}</p>
          <p className="text-xs text-[var(--c-text3)] mt-0.5">{new Date(incident.createdAt).toLocaleString()}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[var(--c-text3)] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--c-text3)] flex-shrink-0" />}
      </div>
      {expanded && (
        <div className="mt-4 border-t border-[var(--c-border)] pt-4 space-y-3">
          {incident.updates.slice().reverse().map((u, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-[var(--c-blue)] mt-1.5" />
                {i < incident.updates.length - 1 && <div className="w-px flex-1 bg-[var(--c-border)] mt-1" />}
              </div>
              <div className="pb-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[var(--c-text)]">{u.status}</span>
                  <span className="text-[10px] text-[var(--c-text3)]">{new Date(u.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-[var(--c-text2)]">{u.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const { data: res } = await api.get('/api/status');
      setData(res);
    } catch {}
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const overall = data?.overallStatus || 'operational';
  const banner = overallBanner[overall];

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <header className="bg-[var(--c-surface)] border-b border-[var(--c-border)] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/"><Logo size="sm" /></Link>
          <button onClick={refresh} className="btn btn-secondary btn-sm" disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'spinner' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Overall status */}
            <div className="rounded-xl p-6 mb-8 text-center" style={{ background: banner.bg }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className={`status-dot ${overall === 'operational' ? 'green' : overall === 'major_outage' ? 'red' : 'amber'}`} />
                <h1 className="text-xl font-bold text-[var(--c-text)]">{banner.text}</h1>
              </div>
              <p className="text-sm text-[var(--c-text3)]">{banner.sub}</p>
              <p className="text-xs text-[var(--c-text3)] mt-2">Updated {new Date().toLocaleTimeString()}</p>
            </div>

            {/* Components */}
            <div className="card mb-8">
              <div className="card-header"><p className="card-title">System Components</p></div>
              {data?.components.map(comp => {
                const cfg = statusConfig[comp.status] || statusConfig.operational;
                return (
                  <div key={comp.id} className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--c-border)] last:border-b-0">
                    <span className="text-sm font-medium text-[var(--c-text)]">{comp.name}</span>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: cfg.color }}>
                      {cfg.icon}{cfg.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active incidents */}
            {data && data.activeIncidents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-base font-semibold text-[var(--c-text)] mb-3">Active Incidents</h2>
                <div className="space-y-3">
                  {data.activeIncidents.map(i => <IncidentCard key={i._id} incident={i} />)}
                </div>
              </div>
            )}

            {/* Recent resolved */}
            <div>
              <h2 className="text-base font-semibold text-[var(--c-text)] mb-3">Past Incidents (7 days)</h2>
              {data && data.recentIncidents.length > 0 ? (
                <div className="space-y-3">
                  {data.recentIncidents.map(i => <IncidentCard key={i._id} incident={i} />)}
                </div>
              ) : (
                <div className="card card-p text-center py-8">
                  <CheckCircle className="w-8 h-8 text-[var(--c-green)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--c-text3)]">No incidents in the last 7 days</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
