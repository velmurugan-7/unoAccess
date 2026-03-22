import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Logo, Button, Input, Alert } from '../components/ui';
import { AppShell } from '../components/AppShell';
import {
  Plus, Trash2, Edit, RefreshCw, ArrowLeft, Search, Copy,
  BarChart2, Users, Activity, Shield, Bell, ChevronRight,
  CheckCircle, XCircle, Loader, TrendingUp, Globe, UserCheck,
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type AdminTab = 'dashboard' | 'clients' | 'users' | 'announcements' | 'audit';

interface OAuthClient { _id: string; name: string; clientId: string; redirectUris: string[]; scopes: string[]; isActive: boolean; website?: string; }
interface UserRecord { _id: string; name: string; email: string; role: string; isVerified: boolean; isSuspended: boolean; createdAt: string; }
interface DashStats { users: { total: number; verified: number; suspended: number; newToday: number; newThisWeek: number }; clients: { total: number; active: number }; sessions: { active: number }; loginsToday: number; }
interface AuditEntry { _id: string; action: string; timestamp: string; userId?: { name: string; email: string }; actorId?: { name: string; email: string }; success: boolean; ip?: string; }
interface Announcement { _id: string; title: string; message: string; type: string; isActive: boolean; expiresAt?: string; }

// ── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardTab() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [signupTrend, setSignupTrend] = useState<{ _id: string; count: number }[]>([]);
  const [loginTrend, setLoginTrend] = useState<{ _id: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/dashboard').then(({ data }) => {
      setStats(data.stats); setSignupTrend(data.signupTrend); setLoginTrend(data.loginTrend);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center"><Loader className="w-6 h-6 mx-auto animate-spin text-[var(--c-text3)]" /></div>;
  if (!stats) return <p className="text-[var(--c-text3)]">Failed to load stats.</p>;

  const cards = [
    { label: 'Total Users', value: stats.users.total, sub: `+${stats.users.newToday} today`, icon: <Users className="w-5 h-5" />, color: 'indigo' },
    { label: 'Active Sessions', value: stats.sessions.active, sub: `${stats.loginsToday} logins today`, icon: <Activity className="w-5 h-5" />, color: 'green' },
    { label: 'OAuth Clients', value: stats.clients.active, sub: `${stats.clients.total} total`, icon: <Globe className="w-5 h-5" />, color: 'purple' },
    { label: 'Verified Users', value: stats.users.verified, sub: `${stats.users.suspended} suspended`, icon: <UserCheck className="w-5 h-5" />, color: 'blue' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div className="p-2 bg-[var(--c-blue-lt)] rounded-lg inline-block mb-3 text-[var(--c-blue)]">{c.icon}</div>
            <p className="stat-value">{c.value.toLocaleString()}</p>
            <p className="text-[var(--c-text3)] text-xs mt-0.5">{c.label}</p>
            <p className="text-[var(--c-text3)] text-xs">{c.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-5">
          <p className="text-sm font-semibold text-[var(--c-text)] mb-4">Signups (30 days)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={signupTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="_id" tick={{ fill: 'var(--c-text3)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: 'var(--c-text3)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12, color: 'var(--c-text)' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} name="Signups" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <p className="text-sm font-semibold text-[var(--c-text)] mb-4">Logins (7 days)</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={loginTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="_id" tick={{ fill: 'var(--c-text3)', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: 'var(--c-text3)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12, color: 'var(--c-text)' }} />
              <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={false} name="Logins" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Clients ───────────────────────────────────────────────────────────────────
function ClientsTab() {
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', redirectUris: '', website: '' });
  const [newSecret, setNewSecret] = useState<{ clientId: string; secret: string } | null>(null);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const fetch = () => api.get('/api/admin/clients').then(({ data }) => setClients(data.clients));
  useEffect(() => { fetch(); }, []);
  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.clientId.includes(search));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMsg(null);
    try {
      const { data } = await api.post('/api/admin/clients', {
        name: form.name,
        redirectUris: form.redirectUris.split('\n').map(u => u.trim()).filter(Boolean),
        website: form.website
      });
      setNewSecret({ clientId: data.client.clientId, secret: data.client.clientSecret });
      setForm({ name: '', redirectUris: '', website: '' });
      setShowForm(false);
      fetch();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await api.put(`/api/admin/clients/${id}`, { isActive: !isActive });
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this client? This action cannot be undone.')) return;
    await api.delete(`/api/admin/clients/${id}`);
    fetch();
  };

  const handleRotate = async (client: OAuthClient) => {
    const { data } = await api.post(`/api/admin/clients/${client._id}/rotate-secret`);
    setNewSecret({ clientId: client.clientId, secret: data.clientSecret });
  };

  return (
    <div className="space-y-4">
      {msg && <Alert type={msg.type} message={msg.text} />}

      {/* New secret popup – shows both client ID and secret */}
      {newSecret && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 space-y-2">
          <p className="text-yellow-400 font-semibold mb-2">⚠️ Save these credentials — shown only once</p>
          <div className="grid gap-1">
            <p className="text-[var(--c-text3)] text-xs">Client ID:</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-[var(--c-text2)] bg-black/30 p-1 rounded flex-1 break-all">{newSecret.clientId}</code>
              <button onClick={() => navigator.clipboard.writeText(newSecret.clientId)} className="text-yellow-400 hover:text-yellow-300">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[var(--c-text3)] text-xs mt-2">Client Secret:</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-[var(--c-text2)] bg-black/30 p-1 rounded flex-1 break-all">{newSecret.secret}</code>
              <button onClick={() => navigator.clipboard.writeText(newSecret.secret)} className="text-yellow-400 hover:text-yellow-300">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button onClick={() => setNewSecret(null)} className="text-xs text-[var(--c-text3)] hover:text-[var(--c-text2)] mt-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Search and create button */}
      <div className="flex flex-col justify-end sm:flex-row gap-3">
        {/* <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-text3)]" />
          <input
            className="input-field pl-9 w-full"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div> */}
        <Button onClick={() => setShowForm(!showForm)} className="w-auto px-4">
          <Plus className="w-4 h-4" />New Client
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 space-y-3">
          <Input label="App name" value={form.name} onChange={set('name')} required />
          <div>
            <label className="label">Redirect URIs (one per line)</label>
            <textarea className="input-field w-full h-20" value={form.redirectUris} onChange={set('redirectUris')} />
          </div>
          <Input label="Website (optional)" value={form.website} onChange={set('website')} />
          <Button type="submit" isLoading={loading}>Create</Button>
        </form>
      )}

      {/* Client table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--c-border)] text-[var(--c-text3)]">
              <th className="px-4 py-3 text-left font-medium">App</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Client ID</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-[var(--c-text3)]">No clients found</td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c._id} className="border-b border-white/5 hover:bg-[var(--c-surface2)]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-black/40">{c.name}</p>
                    {c.website && <p className="text-[var(--c-text3)] text-xs">{c.website}</p>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <code className="text-xs text-[var(--c-blue)] bg-indigo-600/20 px-2 py-1 rounded">{c.clientId.slice(0, 18)}…</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/app-monitoring/${c.clientId}`} className="p-1.5 hover:hover:bg-[var(--c-surface2)] rounded-lg" title="Monitoring">
                        <BarChart2 className="w-4 h-4 text-[var(--c-blue)]" />
                      </Link>
                      <button onClick={() => handleToggle(c._id, c.isActive)} className="p-1.5 hover:hover:bg-[var(--c-surface2)] rounded-lg" title="Toggle">
                        <Edit className="w-4 h-4 text-[var(--c-text3)]" />
                      </button>
                      <button onClick={() => handleRotate(c)} className="p-1.5 hover:hover:bg-[var(--c-surface2)] rounded-lg" title="Rotate secret">
                        <RefreshCw className="w-4 h-4 text-yellow-400" />
                      </button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 hover:hover:bg-[var(--c-surface2)] rounded-lg" title="Delete">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/admin/users?search=${search}&page=${page}&limit=15`);
      setUsers(data.users); setTotal(data.pagination.total);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const action = async (id: string, endpoint: string) => {
    setActionLoading(id + endpoint);
    try { await api.post(`/api/admin/users/${id}/${endpoint}`); await fetchUsers(); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-4">
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-text3)]" /><input className="input-field pl-9 w-full" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[var(--c-border)] text-[var(--c-text3)]">{['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="py-10 text-center"><Loader className="w-5 h-5 mx-auto animate-spin text-[var(--c-text3)]" /></td></tr>
              : users.length === 0 ? <tr><td colSpan={5} className="py-10 text-center text-[var(--c-text3)]">No users found</td></tr>
              : users.map(u => (
                <tr key={u._id} className="border-b border-white/5 hover:bg-[var(--c-surface2)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[var(--c-blue-lt)] rounded-full flex items-center justify-center text-[var(--c-blue)] font-bold text-sm flex-shrink-0">{u.name[0]?.toUpperCase()}</div>
                      <div><p className="text-white font-medium">{u.name}</p><p className="text-[var(--c-text3)] text-xs">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-[var(--c-surface2)] text-[var(--c-text3)]'}`}>{u.role}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs flex items-center gap-1 ${u.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>{u.isVerified ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{u.isVerified ? 'Verified' : 'Unverified'}</span>
                      {u.isSuspended && <span className="text-xs text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" />Suspended</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--c-text3)] text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {!u.isVerified && <button onClick={() => action(u._id, 'verify')} disabled={!!actionLoading} className="text-xs text-green-400 hover:text-green-300 px-2 py-1 border border-green-400/30 rounded-lg">Verify</button>}
                      {!u.isSuspended ? <button onClick={() => action(u._id, 'suspend')} disabled={!!actionLoading} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 border border-red-400/30 rounded-lg">Suspend</button>
                        : <button onClick={() => action(u._id, 'unsuspend')} disabled={!!actionLoading} className="text-xs text-yellow-400 hover:text-yellow-300 px-2 py-1 border border-yellow-400/30 rounded-lg">Unsuspend</button>}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {total > 15 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm bg-[var(--c-surface2)] hover:hover:bg-[var(--c-surface2)] rounded-lg disabled:opacity-40">Prev</button>
          <span className="px-3 py-1.5 text-sm text-[var(--c-text3)]">Page {page} of {Math.ceil(total / 15)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 15)} className="px-3 py-1.5 text-sm bg-[var(--c-surface2)] hover:hover:bg-[var(--c-surface2)] rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

// ── Announcements ─────────────────────────────────────────────────────────────
function AnnouncementsTab() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', expiresAt: '' });
  const [showForm, setShowForm] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  const fetch = () => api.get('/api/admin/announcements').then(({ data }) => setItems(data.announcements));
  useEffect(() => { fetch(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/api/admin/announcements', form);
    setForm({ title: '', message: '', type: 'info', expiresAt: '' }); setShowForm(false); fetch();
  };

  const toggle = async (id: string, isActive: boolean) => { await api.put(`/api/admin/announcements/${id}`, { isActive: !isActive }); fetch(); };
  const del = async (id: string) => { await api.delete(`/api/admin/announcements/${id}`); fetch(); };

  const typeColors: Record<string, string> = { info: 'text-blue-400', warning: 'text-yellow-400', success: 'text-green-400', error: 'text-red-400' };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="w-auto px-4"><Plus className="w-4 h-4" />New Announcement</Button>
      {showForm && (
        <form onSubmit={create} className="card p-5 space-y-3">
          <Input label="Title" value={form.title} onChange={set('title')} required />
          <div><label className="label">Message</label><textarea className="input-field w-full h-20" value={form.message} onChange={set('message')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type</label><select className="input-field w-full" value={form.type} onChange={set('type')}><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option><option value="error">Error</option></select></div>
            <Input label="Expires at (optional)" type="datetime-local" value={form.expiresAt} onChange={set('expiresAt')} />
          </div>
          <Button type="submit">Create</Button>
        </form>
      )}
      <div className="space-y-3">
        {items.length === 0 ? <p className="text-[var(--c-text3)] text-sm">No announcements.</p>
          : items.map(a => (
            <div key={a._id} className="glass p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold uppercase ${typeColors[a.type] || 'text-[var(--c-text3)]'}`}>{a.type}</span>
                  {!a.isActive && <span className="text-xs text-[var(--c-text3)] bg-[var(--c-surface2)] px-2 py-0.5 rounded-full">Inactive</span>}
                  {a.expiresAt && <span className="text-xs text-[var(--c-text3)]">Expires {new Date(a.expiresAt).toLocaleDateString()}</span>}
                </div>
                <p className="text-white font-medium mt-1">{a.title}</p>
                <p className="text-[var(--c-text3)] text-sm mt-0.5">{a.message}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => toggle(a._id, a.isActive)} className="text-xs text-[var(--c-blue)] hover:text-[var(--c-blue)] px-2 py-1 border border-indigo-400/30 rounded-lg">{a.isActive ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => del(a._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Audit Log ─────────────────────────────────────────────────────────────────
function AuditTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/admin/audit-log?page=${page}&limit=20`).then(({ data }) => { setLogs(data.logs); setTotal(data.pagination.total); }).finally(() => setLoading(false));
  }, [page]);

  const actionLabel = (a: string) => a.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-3">
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-[var(--c-border)] text-[var(--c-text3)]">{['Action', 'User', 'Actor', 'Time', 'Status'].map(h => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="py-10 text-center"><Loader className="w-5 h-5 mx-auto animate-spin text-[var(--c-text3)]" /></td></tr>
              : logs.map(l => (
                <tr key={l._id} className="border-b border-white/5 hover:bg-[var(--c-surface2)]">
                  <td className="px-4 py-3 text-[var(--c-text2)]">{actionLabel(l.action)}</td>
                  <td className="px-4 py-3 text-[var(--c-text3)] text-xs">{l.userId?.email || '—'}</td>
                  <td className="px-4 py-3 text-[var(--c-text3)] text-xs">{l.actorId?.email || '—'}</td>
                  <td className="px-4 py-3 text-[var(--c-text3)] text-xs">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">{l.success ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm bg-[var(--c-surface2)] hover:hover:bg-[var(--c-surface2)] rounded-lg disabled:opacity-40">Prev</button>
          <span className="px-3 py-1.5 text-sm text-[var(--c-text3)]">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-3 py-1.5 text-sm bg-[var(--c-surface2)] hover:hover:bg-[var(--c-surface2)] rounded-lg disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const tabs = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'clients' as AdminTab, label: 'OAuth Clients', icon: <Globe className="w-4 h-4" /> },
    { id: 'users' as AdminTab, label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'announcements' as AdminTab, label: 'Announcements', icon: <Bell className="w-4 h-4" /> },
    { id: 'audit' as AdminTab, label: 'Audit Log', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="page-header">
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage OAuth clients, users, and system configuration</p>
        </div>
        <div className="card overflow-hidden">
          <div className="flex overflow-x-auto border-b border-[var(--c-border)]">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${tab === t.id ? 'border-[var(--c-blue)] text-[var(--c-blue)]' : 'border-transparent text-[var(--c-text3)] hover:text-[var(--c-text)]'}`}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {tab === 'dashboard' && <DashboardTab />}
            {tab === 'clients' && <ClientsTab />}
            {tab === 'users' && <UsersTab />}
            {tab === 'announcements' && <AnnouncementsTab />}
            {tab === 'audit' && <AuditTab />}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
