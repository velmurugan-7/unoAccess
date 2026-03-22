import { useEffect, useState } from 'react';
import {
  Plus, Trash2, RefreshCw, Copy, Check, Eye, EyeOff,
  ExternalLink, Globe, BarChart3, AlertTriangle, Pencil, X, Save,
} from 'lucide-react';
import api from '../lib/api';
import { AppShell } from '../components/AppShell';
import { Button, Input, Badge, Modal, Alert, Card, CardHeader, Spinner } from '../components/ui';

interface OAuthApp {
  _id: string;
  name: string;
  clientId: string;
  redirectUris: string[];
  scopes: string[];
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

// ── Redirect URI list editor ───────────────────────────────────────────────────
function RedirectUriEditor({
  uris, onChange,
}: { uris: string[]; onChange: (u: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    setErr('');
    try { new URL(draft); } catch { setErr('Enter a valid URL'); return; }
    if (uris.includes(draft)) { setErr('Already added'); return; }
    onChange([...uris, draft]);
    setDraft('');
  };

  return (
    <div>
      <label className="label">Redirect URIs</label>
      <div className="space-y-1.5 mb-2">
        {uris.map((uri) => (
          <div key={uri} className="flex items-center gap-2 bg-[var(--c-surface2)] border border-[var(--c-border)] rounded-md px-3 py-1.5">
            <span className="flex-1 text-xs font-mono text-[var(--c-text2)] truncate">{uri}</span>
            <button
              type="button"
              onClick={() => onChange(uris.filter((u) => u !== uri))}
              className="text-[var(--c-text3)] hover:text-[var(--c-red)] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input text-sm flex-1"
          placeholder="https://yourapp.com/callback"
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setErr(''); }}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Add
        </Button>
      </div>
      {err && <p className="error-msg">{err}</p>}
      <p className="helper">Must be exact HTTPS URLs (or http://localhost for dev).</p>
    </div>
  );
}

// ── Secret reveal row ─────────────────────────────────────────────────────────
function SecretReveal({ secret, onDismiss }: { secret: string; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Eye className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-green-800 mb-0.5">Copy your client secret now</p>
          <p className="text-xs text-green-700 mb-3">This is the only time it will be shown. Store it somewhere safe.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-green-200 rounded px-3 py-2 font-mono break-all">
              {visible ? secret : '•'.repeat(secret.length)}
            </code>
            <button
              onClick={() => setVisible((v) => !v)}
              className="p-2 text-green-700 hover:bg-green-100 rounded-md transition-colors"
            >
              {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={copy}
              className="p-2 text-green-700 hover:bg-green-100 rounded-md transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-green-600 hover:text-green-800 text-xs font-medium flex-shrink-0">
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyAppPage() {
  const [app, setApp] = useState<OAuthApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', website: '', redirectUris: [''] });
  const [createErr, setCreateErr] = useState('');

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', website: '', redirectUris: [''] });
  const [saving, setSaving] = useState(false);
  const [editErr, setEditErr] = useState('');

  // Delete / rotate confirm
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    api.get('/api/user/apps')
      .then(({ data }) => setApp(data.app))
      .catch(() => setError('Failed to load app data.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErr('');
    const uris = createForm.redirectUris.filter(Boolean);
    if (!createForm.name.trim()) { setCreateErr('App name is required'); return; }
    if (uris.length === 0) { setCreateErr('Add at least one redirect URI'); return; }

    setCreating(true);
    try {
      const { data } = await api.post('/api/user/apps', {
        name: createForm.name.trim(),
        redirectUris: uris,
        website: createForm.website || undefined,
      });
      setApp(data.app);
      setRevealedSecret(data.app.clientSecret); // raw secret returned once
      setShowCreate(false);
      setCreateForm({ name: '', website: '', redirectUris: [''] });
    } catch (err: any) {
      setCreateErr(err?.response?.data?.message || 'Failed to create app.');
    } finally {
      setCreating(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = () => {
    if (!app) return;
    setEditForm({ name: app.name, website: app.website || '', redirectUris: [...app.redirectUris] });
    setEditErr('');
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErr('');
    const uris = editForm.redirectUris.filter(Boolean);
    if (!editForm.name.trim()) { setEditErr('App name is required'); return; }
    if (uris.length === 0) { setEditErr('Add at least one redirect URI'); return; }

    setSaving(true);
    try {
      const { data } = await api.put('/api/user/apps', {
        name: editForm.name.trim(),
        redirectUris: uris,
        website: editForm.website || undefined,
      });
      setApp(data.app);
      setEditing(false);
    } catch (err: any) {
      setEditErr(err?.response?.data?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  // ── Rotate secret ─────────────────────────────────────────────────────────
  const handleRotate = async () => {
    if (!confirm('Rotate the client secret? Your existing integrations will stop working until you update them.')) return;
    setRotating(true);
    try {
      const { data } = await api.post('/api/user/apps/rotate-secret');
      setRevealedSecret(data.clientSecret);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to rotate secret.');
    } finally {
      setRotating(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/api/user/apps');
      setApp(null);
      setRevealedSecret(null);
      setShowDelete(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete app.');
    } finally {
      setDeleting(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Page header */}
        <div className="page-header flex items-start justify-between">
          <div>
            <h1 className="page-title">My App</h1>
            <p className="page-subtitle">
              Register your application to use UnoAccess as an identity provider.
              <span className="ml-1 inline-flex items-center gap-1">
                <Badge variant="gray">1 app limit</Badge>
              </span>
            </p>
          </div>
          {!app && !loading && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreate(true)}
            >
              Register app
            </Button>
          )}
        </div>

        {error && <Alert type="error" message={error} className="mb-5" />}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty state */}
        {!loading && !app && (
          <Card className="card-p text-center py-14">
            <div className="w-14 h-14 rounded-xl bg-[var(--c-blue-lt)] flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-[var(--c-blue)]" />
            </div>
            <p className="font-semibold text-[var(--c-text)] mb-1">No app registered yet</p>
            <p className="text-sm text-[var(--c-text3)] mb-5 max-w-xs mx-auto">
              Register your application to get a <code className="code-inline">clientId</code> and{' '}
              <code className="code-inline">clientSecret</code> for OAuth integration.
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreate(true)}
            >
              Register your app
            </Button>
          </Card>
        )}

        {/* App exists */}
        {!loading && app && (
          <div className="space-y-4">
            {/* Revealed secret banner */}
            {revealedSecret && (
              <SecretReveal secret={revealedSecret} onDismiss={() => setRevealedSecret(null)} />
            )}

            {/* App card */}
            <Card>
              <CardHeader
                title={app.name}
                subtitle={`Registered ${fmt(app.createdAt)}`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge variant={app.isActive ? 'green' : 'gray'} dot>
                      {app.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {!editing && (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Pencil className="w-3.5 h-3.5" />}
                        onClick={startEdit}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                }
              />

              {!editing ? (
                /* ── View mode ── */
                <div className="card-p pt-4 space-y-5">
                  {/* Credentials */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="label mb-1.5">Client ID</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 code-inline text-xs py-2 px-3 rounded-md block truncate">
                          {app.clientId}
                        </code>
                        <button
                          className="p-1.5 text-[var(--c-text3)] hover:text-[var(--c-text)] hover:bg-[var(--c-surface2)] rounded-md transition-colors"
                          onClick={() => navigator.clipboard.writeText(app.clientId)}
                          title="Copy client ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="label mb-1.5">Client Secret</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 code-inline text-xs py-2 px-3 rounded-md block">
                          {'•'.repeat(24)}
                        </code>
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={rotating}
                          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                          onClick={handleRotate}
                          title="Rotate secret"
                        >
                          Rotate
                        </Button>
                      </div>
                      <p className="helper">Rotate your secret if you haven't stored yours</p>
                    </div>
                  </div>

                  <hr className="divider" />

                  {/* Details */}
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="label mb-1">Scopes</p>
                      <div className="flex flex-wrap gap-1">
                        {app.scopes.map((s) => (
                          <Badge key={s} variant="blue">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    {app.website && (
                      <div>
                        <p className="label mb-1">Website</p>
                        <a
                          href={app.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[var(--c-blue)] hover:underline text-sm"
                        >
                          {app.website.replace(/^https?:\/\//, '')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="label mb-1.5">Redirect URIs</p>
                    <div className="space-y-1">
                      {app.redirectUris.map((uri) => (
                        <code
                          key={uri}
                          className="block text-xs font-mono bg-[var(--c-surface2)] border border-[var(--c-border)] rounded-md px-3 py-1.5 text-[var(--c-text2)] truncate"
                        >
                          {uri}
                        </code>
                      ))}
                    </div>
                  </div>

                  <hr className="divider" />

                  {/* Quick links */}
                  <div className="flex items-center gap-3">
                    <a
                      href={`/app-monitoring/${app.clientId}`}
                      className="btn btn-secondary btn-sm gap-1.5"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> View monitoring
                    </a>
                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setShowDelete(true)}
                    >
                      Delete app
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Edit mode ── */
                <form onSubmit={handleSave} className="card-p pt-4 space-y-4">
                  {editErr && <Alert type="error" message={editErr} />}
                  <Input
                    label="App name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                  <Input
                    label="Website (optional)"
                    type="url"
                    placeholder="https://yourapp.com"
                    value={editForm.website}
                    onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                  />
                  <RedirectUriEditor
                    uris={editForm.redirectUris.filter(Boolean)}
                    onChange={(uris) => setEditForm((p) => ({ ...p, redirectUris: uris }))}
                  />
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" variant="primary" size="sm" isLoading={saving} leftIcon={<Save className="w-3.5 h-3.5" />}>
                      Save changes
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </Card>

            {/* Integration guide */}
            <Card>
              <CardHeader title="Integration guide" subtitle="How to use your credentials" />
              <div className="card-p pt-3 space-y-3">
                <p className="text-sm text-[var(--c-text3)]">
                  Use the authorization code flow to authenticate users with UnoAccess:
                </p>
                <div className="code-block text-xs leading-relaxed">
                  <span className="text-[#94a3b8]"># 1. Redirect users to authorize</span>{'\n'}
                  GET /oauth/authorize?{'\n'}
                  {'  '}response_type=code{'\n'}
                  {'  '}&amp;client_id=<span className="text-[#86efac]">{app.clientId}</span>{'\n'}
                  {'  '}&amp;redirect_uri=<span className="text-[#86efac]">{app.redirectUris[0] || 'YOUR_REDIRECT_URI'}</span>{'\n'}
                  {'  '}&amp;scope=openid+profile+email{'\n'}
                  {'  '}&amp;state=random_csrf_token{'\n\n'}
                  <span className="text-[#94a3b8]"># 2. Exchange code for tokens</span>{'\n'}
                  POST /oauth/token{'\n'}
                  {'  '}grant_type=authorization_code{'\n'}
                  {'  '}&amp;code=AUTH_CODE{'\n'}
                  {'  '}&amp;client_id=<span className="text-[#86efac]">{app.clientId}</span>{'\n'}
                  {'  '}&amp;client_secret=<span className="text-[#fbbf24]">YOUR_SECRET</span>{'\n'}
                  {'  '}&amp;redirect_uri=<span className="text-[#86efac]">{app.redirectUris[0] || 'YOUR_REDIRECT_URI'}</span>
                </div>
                <a href="/docs/oauth" className="text-sm text-[var(--c-blue)] hover:underline flex items-center gap-1">
                  Read the full OAuth docs <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          </div>
        )}

        {/* ── Create modal ── */}
        <Modal
          open={showCreate}
          onClose={() => { setShowCreate(false); setCreateErr(''); }}
          title="Register your app"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" size="sm" isLoading={creating} onClick={handleCreate as any}>
                Register app
              </Button>
            </>
          }
        >
          {createErr && <Alert type="error" message={createErr} className="mb-4" />}
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="App name"
              id="cname"
              placeholder="My Awesome App"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <Input
              label="Website (optional)"
              id="cwebsite"
              type="url"
              placeholder="https://yourapp.com"
              value={createForm.website}
              onChange={(e) => setCreateForm((p) => ({ ...p, website: e.target.value }))}
            />
            <RedirectUriEditor
              uris={createForm.redirectUris.filter(Boolean)}
              onChange={(uris) => setCreateForm((p) => ({ ...p, redirectUris: uris }))}
            />
            <div className="alert alert-info text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>You can register <strong>1 app</strong> per account. Your <code className="code-inline">clientSecret</code> is shown only once after creation.</span>
            </div>
          </form>
        </Modal>

        {/* ── Delete confirm modal ── */}
        <Modal
          open={showDelete}
          onClose={() => setShowDelete(false)}
          title="Delete app"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setShowDelete(false)}>Cancel</Button>
              <Button variant="danger" size="sm" isLoading={deleting} onClick={handleDelete} leftIcon={<Trash2 className="w-3.5 h-3.5" />}>
                Yes, delete it
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-[var(--c-text2)]">
              Are you sure you want to delete <strong className="text-[var(--c-text)]">{app?.name}</strong>?
            </p>
            <p className="text-sm text-[var(--c-text3)]">
              This will permanently delete the OAuth client and revoke all active tokens issued by it. Users will be logged out of your app immediately.
            </p>
            <div className="alert alert-error text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>This action cannot be undone.</span>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}