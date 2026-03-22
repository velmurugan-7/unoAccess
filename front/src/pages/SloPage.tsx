import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, Download, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../lib/api';
import { AppShell, AppSubNav } from '../components/AppShell';
import { Button, Badge, Modal, Input, Select, Alert, PageLoader } from '../components/ui';

interface SloResult {
  slo: { _id: string; name: string; metricType: string; targetValue: number; windowDays: number; description?: string };
  compliance: number | null;
  currentValue: number | null;
  dataPoints: { date: string; value: number | null; met: boolean | null }[];
}

const metricLabels: Record<string, string> = {
  p95_latency: 'p95 Latency (ms)', p99_latency: 'p99 Latency (ms)',
  avg_latency: 'Avg Latency (ms)', error_rate: 'Error Rate (%)', availability: 'Availability (%)',
};

export default function SloPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [report, setReport] = useState<{ client: { name: string }; report: SloResult[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', metricType: 'p95_latency', targetValue: '500', windowDays: '30', description: '' });

  const loadReport = () => {
    if (!clientId) return;
    setLoading(true);
    api.get(`/api/user/slo/${clientId}/report`)
      .then(({ data }) => setReport(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReport(); }, [clientId]);

  const createSlo = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.post('/api/user/slo', { clientId, ...form, targetValue: parseFloat(form.targetValue), windowDays: parseInt(form.windowDays) });
      setShowModal(false);
      loadReport();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteSlo = async (id: string) => {
    if (!confirm('Delete this SLO?')) return;
    await api.delete(`/api/user/slo/${id}`);
    loadReport();
  };

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `slo-report-${clientId}.json`;
    a.click();
  };

  if (loading) return <AppShell><PageLoader /></AppShell>;

  return (
    <AppShell>
      <AppSubNav clientId={clientId!} appName={report?.client?.name} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
        <div className="page-header flex items-start justify-between">
          <div>
            <h1 className="page-title">SLO Dashboard</h1>
            <p className="page-subtitle">Service Level Objectives for {report?.client?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={downloadReport}>Export JSON</Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add SLO</Button>
          </div>
        </div>

        {report?.report.length === 0 ? (
          <div className="card card-p text-center py-16">
            <TrendingUp className="w-10 h-10 text-[var(--c-text3)] mx-auto mb-3" />
            <p className="font-medium text-[var(--c-text)]">No SLOs defined</p>
            <p className="text-sm text-[var(--c-text3)] mt-1 mb-4">Define service level objectives to track compliance over time</p>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add your first SLO</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {report?.report.map(({ slo, compliance, currentValue, dataPoints }) => (
              <div key={slo._id} className="card">
                <div className="card-header">
                  <div>
                    <p className="card-title">{slo.name}</p>
                    <p className="card-desc">{metricLabels[slo.metricType]} · Target: {slo.targetValue} · {slo.windowDays}d window</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {compliance !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: compliance >= 99 ? 'var(--c-green)' : compliance >= 95 ? 'var(--c-amber)' : 'var(--c-red)' }}>
                          {compliance.toFixed(1)}%
                        </p>
                        <p className="text-xs text-[var(--c-text3)]">compliance</p>
                      </div>
                    )}
                    {currentValue !== null && (
                      <div className="text-right">
                        <p className="text-lg font-semibold text-[var(--c-text)]">{currentValue.toFixed(1)}</p>
                        <p className="text-xs text-[var(--c-text3)]">current</p>
                      </div>
                    )}
                    <Badge variant={compliance === null ? 'gray' : compliance >= 99 ? 'green' : compliance >= 95 ? 'amber' : 'red'}>
                      {compliance === null ? 'No data' : compliance >= 99 ? 'On track' : compliance >= 95 ? 'At risk' : 'Breached'}
                    </Badge>
                    <Button variant="danger" size="sm" onClick={() => deleteSlo(slo._id)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>Delete</Button>
                  </div>
                </div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={dataPoints.filter(d => d.value !== null)} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--c-text3)' }} tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--c-text3)' }} />
                      <Tooltip
                        contentStyle={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => [v.toFixed(2), metricLabels[slo.metricType]]}
                      />
                      <ReferenceLine y={slo.targetValue} stroke="var(--c-red)" strokeDasharray="4 4" label={{ value: 'Target', fontSize: 10, fill: 'var(--c-red)' }} />
                      <Line type="monotone" dataKey="value" stroke="var(--c-blue)" strokeWidth={2} dot={(props) => {
                        const d = dataPoints.find(p => p.date === props.payload?.date);
                        return <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill={d?.met ? 'var(--c-green)' : 'var(--c-red)'} stroke="none" />;
                      }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal open={showModal} onClose={() => setShowModal(false)} title="New SLO"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" isLoading={saving} onClick={createSlo as any}>Create SLO</Button>
            </>
          }
        >
          {error && <Alert type="error" message={error} className="mb-4" />}
          <form onSubmit={createSlo} className="space-y-4">
            <Input label="SLO name" id="sname" placeholder="e.g. API p95 latency" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
            <Select label="Metric type" id="smtype" value={form.metricType} onChange={e => setForm(p => ({...p, metricType: e.target.value}))}>
              {Object.entries(metricLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Target value" id="starget" type="number" step="0.01" value={form.targetValue} onChange={e => setForm(p => ({...p, targetValue: e.target.value}))} required />
              <Select label="Window" id="swindow" value={form.windowDays} onChange={e => setForm(p => ({...p, windowDays: e.target.value}))}>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </Select>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
