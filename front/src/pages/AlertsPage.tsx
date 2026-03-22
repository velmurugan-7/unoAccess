import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, Pause, Play, Clock } from 'lucide-react';
import api from '../lib/api';
import { AppShell } from '../components/AppShell';
import { Button, Badge, Modal, Input, Select, Alert } from '../components/ui';

interface AlertRule {
  _id: string; name: string;
  clientId: { name: string; clientId: string } | string;
  metric: string; condition: string; threshold: number;
  windowMinutes: number; channel: string; status: string;
  lastTriggeredAt?: string;
}
interface AlertHistory {
  _id: string;
  ruleId: { name: string; metric: string };
  clientId: { name: string; clientId: string };
  actualValue: number; threshold: number;
  triggeredAt: string; resolvedAt?: string;
}
interface OAuthClient { _id: string; name: string; clientId: string; }

const metricLabels: Record<string, string> = {
  error_rate: 'Error rate (%)',
  response_time_p95: 'p95 response time (ms)',
  response_time_avg: 'Avg response time (ms)',
  request_count: 'Request count',
};

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [clients, setClients] = useState<OAuthClient[]>([]);
  const [tab, setTab] = useState<'rules' | 'history'>('rules');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    clientId: '', name: '', metric: 'error_rate', condition: 'greater_than',
    threshold: '5', windowMinutes: '5', channel: 'email', webhookUrl: '',
  });

  useEffect(() => {
    api.get('/api/user/alerts').then(({ data }) => setRules(data.rules)).catch(() => {});
    api.get('/api/user/alerts/history').then(({ data }) => setHistory(data.history)).catch(() => {});
    api.get('/api/admin/clients').then(({ data }) => setClients(data.clients)).catch(() => {});
  }, []);

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const { data } = await api.post('/api/user/alerts', {
        ...form,
        threshold: parseFloat(form.threshold),
        windowMinutes: parseInt(form.windowMinutes),
      });
      setRules(prev => [data.rule, ...prev]);
      setShowModal(false);
      setForm({ clientId: '', name: '', metric: 'error_rate', condition: 'greater_than', threshold: '5', windowMinutes: '5', channel: 'email', webhookUrl: '' });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create alert');
    } finally { setSaving(false); }
  };

  const toggleStatus = async (rule: AlertRule) => {
    const status = rule.status === 'active' ? 'paused' : 'active';
    await api.put(`/api/user/alerts/${rule._id}`, { status });
    setRules(prev => prev.map(r => r._id === rule._id ? { ...r, status } : r));
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this alert rule?')) return;
    await api.delete(`/api/user/alerts/${id}`);
    setRules(prev => prev.filter(r => r._id !== id));
  };

  const clientName = (c: AlertRule['clientId']) => typeof c === 'string' ? c : c?.name || '—';
  const fmt = (d?: string) => d ? new Date(d).toLocaleString() : '—';

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="page-header flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="page-title">Alerts</h1>
            <p className="page-subtitle">Get notified when your app metrics breach thresholds</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            New rule
          </Button>
        </div>

        {/* Tabs */}
        <div className="tab-bar mb-6">
          <button className={`tab-btn ${tab === 'rules' ? 'active' : ''}`} onClick={() => setTab('rules')}>
            Rules <span className="ml-1 text-[10px]">({rules.length})</span>
          </button>
          <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            History <span className="ml-1 text-[10px]">({history.length})</span>
          </button>
        </div>

        {tab === 'rules' && (
          <div className="card">
            {rules.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Bell className="w-5 h-5" /></div>
                <p className="text-sm font-medium text-[var(--c-text)]">No alert rules</p>
                <p className="text-xs text-[var(--c-text3)]">Create rules to get notified when metrics cross thresholds</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Name</th><th>App</th><th>Condition</th><th>Channel</th><th>Status</th><th>Last triggered</th><th></th></tr>
                  </thead>
                  <tbody>
                    {rules.map(r => (
                      <tr key={r._id}>
                        <td><span className="font-medium text-[var(--c-text)] text-sm">{r.name}</span></td>
                        <td><span className="text-sm">{clientName(r.clientId)}</span></td>
                        <td>
                          <span className="text-xs text-[var(--c-text2)]">
                            {metricLabels[r.metric] || r.metric} {r.condition === 'greater_than' ? '>' : '<'} {r.threshold}
                          </span>
                        </td>
                        <td><Badge variant={r.channel === 'email' ? 'blue' : 'purple'}>{r.channel}</Badge></td>
                        <td><Badge variant={r.status === 'active' ? 'green' : 'gray'} dot>{r.status}</Badge></td>
                        <td className="text-xs text-[var(--c-text3)]">{r.lastTriggeredAt ? fmt(r.lastTriggeredAt) : 'Never'}</td>
                        <td>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => toggleStatus(r)} leftIcon={r.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}>
                              {r.status === 'active' ? 'Pause' : 'Resume'}
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => deleteRule(r._id)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="card">
            {history.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Clock className="w-5 h-5" /></div>
                <p className="text-sm font-medium text-[var(--c-text)]">No alert history</p>
                <p className="text-xs text-[var(--c-text3)]">Triggered alerts will appear here</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Rule</th><th>App</th><th>Value</th><th>Triggered</th><th>Resolved</th></tr>
                  </thead>
                  <tbody>
                    {history.map(h => (
                      <tr key={h._id}>
                        <td><span className="text-sm font-medium text-[var(--c-text)]">{h.ruleId?.name || '—'}</span></td>
                        <td><span className="text-sm">{typeof h.clientId === 'object' ? h.clientId?.name : '—'}</span></td>
                        <td>
                          <span className="text-red-600 font-medium text-sm">{h.actualValue.toFixed(2)}</span>
                          <span className="text-[var(--c-text3)] text-xs ml-1">(threshold: {h.threshold})</span>
                        </td>
                        <td className="text-xs text-[var(--c-text3)]">{fmt(h.triggeredAt)}</td>
                        <td>{h.resolvedAt ? <Badge variant="green">Resolved</Badge> : <Badge variant="red" dot>Active</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create modal */}
        <Modal open={showModal} onClose={() => setShowModal(false)} title="New Alert Rule"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" isLoading={saving} onClick={createRule as any}>Create rule</Button>
            </>
          }
        >
          {error && <Alert type="error" message={error} className="mb-4" />}
          <form onSubmit={createRule} className="space-y-4">
            <Input label="Rule name" id="rname" placeholder="e.g. High error rate" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
            <Select label="Application" id="rclient" value={form.clientId} onChange={e => setForm(p => ({...p, clientId: e.target.value}))} required>
              <option value="">Select an app…</option>
              {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.name}</option>)}
            </Select>
            <Select label="Metric" id="rmetric" value={form.metric} onChange={e => setForm(p => ({...p, metric: e.target.value}))}>
              {Object.entries(metricLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Condition" id="rcond" value={form.condition} onChange={e => setForm(p => ({...p, condition: e.target.value}))}>
                <option value="greater_than">Greater than</option>
                <option value="less_than">Less than</option>
              </Select>
              <Input label="Threshold" id="rthresh" type="number" step="0.1" value={form.threshold} onChange={e => setForm(p => ({...p, threshold: e.target.value}))} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select label="Window" id="rwindow" value={form.windowMinutes} onChange={e => setForm(p => ({...p, windowMinutes: e.target.value}))}>
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="60">1 hour</option>
              </Select>
              <Select label="Notify via" id="rchannel" value={form.channel} onChange={e => setForm(p => ({...p, channel: e.target.value}))}>
                <option value="email">Email</option>
                <option value="webhook">Webhook</option>
              </Select>
            </div>
            {form.channel === 'webhook' && (
              <Input label="Webhook URL" id="rwurl" type="url" placeholder="https://hooks.example.com/…" value={form.webhookUrl} onChange={e => setForm(p => ({...p, webhookUrl: e.target.value}))} />
            )}
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
