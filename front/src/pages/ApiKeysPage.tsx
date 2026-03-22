import { useEffect, useState } from 'react';
import { Key, Plus, Trash2, Copy, Check, Eye } from 'lucide-react';
import api from '../lib/api';
import { AppShell } from '../components/AppShell';
import { Button, Badge, Modal, Input, Select, Alert } from '../components/ui';

interface ApiKey {
  _id: string; name: string; keyPrefix: string;
  scopes: string[]; expiresAt?: string; lastUsedAt?: string; createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', expiresInDays: '' });

  useEffect(() => {
    api.get('/api/user/api-keys')
      .then(({ data }) => setKeys(data.apiKeys))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setCreating(true);
    try {
      const { data } = await api.post('/api/user/api-keys', {
        name: form.name,
        expiresInDays: form.expiresInDays ? parseInt(form.expiresInDays) : undefined,
      });
      setKeys(prev => [data.apiKey, ...prev]);
      setNewKey(data.rawKey);
      setForm({ name: '', expiresInDays: '' });
      setShowModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create key');
    } finally { setCreating(false); }
  };

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    await api.delete(`/api/user/api-keys/${id}`);
    setKeys(prev => prev.filter(k => k._id !== id));
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="page-header flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h1 className="page-title">API Keys</h1>
            <p className="page-subtitle">Personal access tokens for programmatic API access</p>
          </div>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            Create key
          </Button>
        </div>

        {/* New key reveal banner */}
        {newKey && (
          <div className="card card-p mb-5 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <Eye className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800 mb-1">Your new API key — copy it now</p>
                <p className="text-xs text-green-700 mb-2">This key will not be shown again. Store it securely.</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="flex-1 text-xs bg-white border border-green-200 rounded px-3 py-2 font-mono break-all">{newKey}</code>
                  <Button variant="secondary" size="sm" onClick={() => copy(newKey)} leftIcon={copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              <button onClick={() => setNewKey(null)} className="text-green-600 hover:text-green-800 text-xs font-medium">Dismiss</button>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <p className="card-title">Your API Keys</p>
            <Badge variant="gray">{keys.length} / 20</Badge>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-[var(--c-text3)]"><span className="text-sm">Loading…</span></div>
          ) : keys.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Key className="w-5 h-5" /></div>
              <p className="text-sm font-medium text-[var(--c-text)]">No API keys yet</p>
              <p className="text-xs text-[var(--c-text3)]">Create a key to authenticate API requests programmatically</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Key prefix</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Last used</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map(k => (
                    <tr key={k._id}>
                      <td><span className="font-medium text-[var(--c-text)] text-sm">{k.name}</span></td>
                      <td><code className="code-inline">{k.keyPrefix}…</code></td>
                      <td>{fmt(k.createdAt)}</td>
                      <td>
                        {k.expiresAt ? (
                          <span className={new Date(k.expiresAt) < new Date() ? 'text-red-500' : 'text-[var(--c-text2)]'}>
                            {fmt(k.expiresAt)}
                          </span>
                        ) : <Badge variant="green">Never</Badge>}
                      </td>
                      <td>{fmt(k.lastUsedAt)}</td>
                      <td>
                        <Button variant="danger" size="sm" onClick={() => revokeKey(k._id)} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                          Revoke
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Usage docs */}
        <div className="card card-p mt-5">
          <p className="text-sm font-semibold text-[var(--c-text)] mb-3">Using your API key</p>
          <p className="text-xs text-[var(--c-text3)] mb-3">Pass the key in the <code className="code-inline">Authorization</code> header:</p>
          <div className="code-block text-xs">
            curl https://your-instance.com/api/user/profile \{'\n'}
            {'  '}-H "Authorization: Bearer ua_your_key_here"
          </div>
        </div>

        {/* Create modal */}
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Create API Key"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" isLoading={creating} onClick={createKey as any} type="submit">Create key</Button>
            </>
          }
        >
          {error && <Alert type="error" message={error} className="mb-4" />}
          <form onSubmit={createKey} className="space-y-4">
            <Input label="Key name" id="kname" placeholder="e.g. CI/CD Pipeline" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required />
            <Select label="Expiration" id="exp" value={form.expiresInDays} onChange={e => setForm(p => ({...p, expiresInDays: e.target.value}))}>
              <option value="">Never expires</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
            </Select>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
