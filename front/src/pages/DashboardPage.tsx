import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Plus, Trash2, BarChart3, X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { AppShell } from '../components/AppShell';
import { Button, Badge, Spinner } from '../components/ui';

interface ConnectedApp { _id: string; name: string; logoUrl?: string; website?: string; clientId: string; }
interface Announcement { _id: string; title: string; message: string; type: 'info' | 'warning' | 'success' | 'error'; }

const annIcon: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
  success: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/user/connected-apps').then(({ data }) => setApps(data.connectedApps)),
      api.get('/api/user/announcements').then(({ data }) => setAnnouncements(data.announcements)),
    ]).finally(() => setLoading(false));
  }, []);

  const revokeApp = async (clientId: string) => {
    setRevoking(clientId);
    try {
      await api.delete(`/api/user/connected-apps/${clientId}`);
      setApps(prev => prev.filter(a => a.clientId !== clientId));
    } finally { setRevoking(null); }
  };

  const visible = announcements.filter(a => !dismissed.has(a._id));

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Announcements */}
        {visible.map(a => (
          <div key={a._id} className={`flex items-start gap-3 p-3.5 rounded-lg border mb-3 text-sm
            ${a.type === 'info' ? 'bg-[var(--c-blue-lt)] border-[var(--c-blue-mid)]' :
              a.type === 'warning' ? 'bg-[var(--c-amber-lt)] border-amber-200' :
              a.type === 'success' ? 'bg-[var(--c-green-lt)] border-green-200' :
              'bg-[var(--c-red-lt)] border-red-200'}`}>
            {annIcon[a.type]}
            <div className="flex-1">
              <span className="font-medium text-[var(--c-text)]">{a.title}</span>
              {a.message && <span className="text-[var(--c-text2)] ml-1.5">{a.message}</span>}
            </div>
            <button onClick={() => setDismissed(p => new Set([...p, a._id]))} className="p-0.5 text-[var(--c-text3)] hover:text-[var(--c-text)]"><X className="w-4 h-4" /></button>
          </div>
        ))}

        {/* Page header */}
        <div className="page-header">
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">{user?.email}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Connected apps', value: apps.length.toString() },
            { label: 'Account status', value: user?.isVerified !== false ? 'Verified' : 'Unverified', tag: user?.isVerified !== false ? 'green' : 'amber' },
            { label: '2FA', value: user?.twoFactorEnabled ? 'Enabled' : 'Disabled', tag: user?.twoFactorEnabled ? 'green' : 'amber' },
            { label: 'Role', value: user?.role === 'admin' ? 'Admin' : 'User', tag: user?.role === 'admin' ? 'purple' : 'gray' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="stat-label">{s.label}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {s.tag ? <Badge variant={s.tag as any}>{s.value}</Badge> : <p className="stat-value text-xl">{s.value}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Connected apps */}
        <div className="card">
          <div className="card-header">
            <div>
              <p className="card-title">Connected Applications</p>
              <p className="card-desc">Apps you've authorized with your account</p>
            </div>
            <span className="badge badge-gray">{apps.length} app{apps.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : apps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Plus className="w-5 h-5" /></div>
              <p className="text-sm font-medium text-[var(--c-text)]">No connected apps yet</p>
              <p className="text-xs text-[var(--c-text3)]">Apps you authorize via OAuth will appear here</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Application</th>
                    <th>Website</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map(app => (
                    <tr key={app.clientId}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-[var(--c-surface2)] border border-[var(--c-border)] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {app.logoUrl ? <img src={app.logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-[var(--c-text3)]">{app.name[0]}</span>}
                          </div>
                          <span className="font-medium text-[var(--c-text)] text-sm">{app.name}</span>
                        </div>
                      </td>
                      <td>
                        {app.website ? (
                          <a href={app.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[var(--c-blue)] hover:underline text-sm">
                            {app.website.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span className="text-[var(--c-text3)]">—</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/app-monitoring/${app.clientId}`)} leftIcon={<BarChart3 className="w-3.5 h-3.5" />}>
                            Monitoring
                          </Button>
                          <Button variant="danger" size="sm" isLoading={revoking === app.clientId} onClick={() => revokeApp(app.clientId)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                            Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
