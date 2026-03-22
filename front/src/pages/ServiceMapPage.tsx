import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { GitBranch, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import { AppShell, AppSubNav } from '../components/AppShell';
import { Button, Badge, PageLoader } from '../components/ui';

interface ServiceNode {
  id: string; label: string; eventCount: number; errorCount: number; eventTypes: string[];
  x?: number; y?: number; vx?: number; vy?: number;
}
interface ServiceEdge { source: string; target: string; weight: number; }
interface MapData { nodes: ServiceNode[]; edges: ServiceEdge[]; }

function ServiceMapCanvas({ data }: { data: MapData }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<ServiceNode[]>([]);
  const [selected, setSelected] = useState<ServiceNode | null>(null);

  useEffect(() => {
    const W = 640, H = 420;
    // Simple force-directed layout simulation
    const ns: ServiceNode[] = data.nodes.map((n, i) => ({
      ...n,
      x: W / 2 + Math.cos((2 * Math.PI * i) / data.nodes.length) * 150,
      y: H / 2 + Math.sin((2 * Math.PI * i) / data.nodes.length) * 150,
      vx: 0, vy: 0,
    }));

    for (let iter = 0; iter < 200; iter++) {
      // Repulsion
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = (ns[j].x! - ns[i].x!) || 0.01;
          const dy = (ns[j].y! - ns[i].y!) || 0.01;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 5000 / (dist * dist);
          ns[i].vx! -= (dx / dist) * force;
          ns[i].vy! -= (dy / dist) * force;
          ns[j].vx! += (dx / dist) * force;
          ns[j].vy! += (dy / dist) * force;
        }
      }
      // Attraction (edges)
      for (const e of data.edges) {
        const s = ns.find(n => n.id === e.source);
        const t = ns.find(n => n.id === e.target);
        if (!s || !t) continue;
        const dx = t.x! - s.x!;
        const dy = t.y! - s.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.01;
        s.vx! += (dx / dist) * force;
        s.vy! += (dy / dist) * force;
        t.vx! -= (dx / dist) * force;
        t.vy! -= (dy / dist) * force;
      }
      // Center gravity
      for (const n of ns) {
        n.vx! += (W / 2 - n.x!) * 0.002;
        n.vy! += (H / 2 - n.y!) * 0.002;
        n.x! += n.vx! * 0.3;
        n.y! += n.vy! * 0.3;
        n.vx! *= 0.85; n.vy! *= 0.85;
        n.x! = Math.max(40, Math.min(W - 40, n.x!));
        n.y! = Math.max(40, Math.min(H - 40, n.y!));
      }
    }
    setNodes(ns);
  }, [data]);

  if (nodes.length === 0) return null;

  return (
    <div className="relative">
      <svg ref={svgRef} viewBox="0 0 640 420" className="w-full rounded-lg bg-[var(--c-surface2)] border border-[var(--c-border)]" style={{ minHeight: 360 }}>
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="var(--c-border2)" />
          </marker>
        </defs>
        {/* Edges */}
        {data.edges.map((e, i) => {
          const s = nodes.find(n => n.id === e.source);
          const t = nodes.find(n => n.id === e.target);
          if (!s || !t) return null;
          return (
            <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke="var(--c-border2)" strokeWidth={Math.max(1, e.weight)}
              strokeOpacity={0.6} markerEnd="url(#arrow)" />
          );
        })}
        {/* Nodes */}
        {nodes.map(n => {
          const isError = n.errorCount > 0;
          const isSelected = selected?.id === n.id;
          return (
            <g key={n.id} onClick={() => setSelected(isSelected ? null : n)} style={{ cursor: 'pointer' }}>
              <circle cx={n.x} cy={n.y} r={isSelected ? 28 : 24}
                fill={isError ? '#fef2f2' : 'var(--c-blue-lt)'}
                stroke={isError ? 'var(--c-red)' : isSelected ? 'var(--c-blue)' : 'var(--c-blue-mid)'}
                strokeWidth={isSelected ? 2 : 1.5}
              />
              {isError && <circle cx={n.x! + 18} cy={n.y! - 18} r={8} fill="var(--c-red)" />}
              {isError && <text x={n.x! + 18} y={n.y! - 14} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">{n.errorCount}</text>}
              <text x={n.x} y={n.y! + 4} textAnchor="middle" fontSize={11} fontWeight="500" fill={isError ? 'var(--c-red)' : 'var(--c-blue)'}>
                {n.label.length > 12 ? n.label.slice(0, 10) + '…' : n.label}
              </text>
              <text x={n.x} y={n.y! + 42} textAnchor="middle" fontSize={9} fill="var(--c-text3)">
                {n.eventCount} events
              </text>
            </g>
          );
        })}
      </svg>

      {selected && (
        <div className="absolute top-3 right-3 card card-p w-56 text-sm">
          <p className="font-semibold text-[var(--c-text)] mb-2">{selected.label}</p>
          <div className="space-y-1 text-xs text-[var(--c-text2)]">
            <div className="flex justify-between"><span>Events</span><Badge variant="blue">{selected.eventCount}</Badge></div>
            <div className="flex justify-between"><span>Errors</span><Badge variant={selected.errorCount > 0 ? 'red' : 'green'}>{selected.errorCount}</Badge></div>
          </div>
          {selected.eventTypes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--c-border)]">
              <p className="text-xs text-[var(--c-text3)] mb-1">Event types</p>
              <div className="flex flex-wrap gap-1">
                {selected.eventTypes.map(t => <Badge key={t} variant="gray">{t}</Badge>)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServiceMapPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [data, setData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(`/api/monitoring/${clientId}/service-map`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [clientId]);

  if (loading) return <AppShell><PageLoader /></AppShell>;

  return (
    <AppShell>
      <AppSubNav clientId={clientId!} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-10">
        <div className="page-header flex items-start justify-between">
          <div>
            <h1 className="page-title">Service Map</h1>
            <p className="page-subtitle">Dependency graph built from SDK service tags</p>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={load}>Refresh</Button>
        </div>

        {data && data.nodes.length > 0 ? (
          <>
            <div className="mb-4 flex flex-wrap gap-3">
              {data.nodes.map(n => (
                <div key={n.id} className="flex items-center gap-1.5 text-xs text-[var(--c-text2)]">
                  <div className="w-3 h-3 rounded-full" style={{ background: n.errorCount > 0 ? 'var(--c-red)' : 'var(--c-blue)' }} />
                  {n.label}
                </div>
              ))}
            </div>
            <ServiceMapCanvas data={data} />
            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--c-text3)]">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[var(--c-blue-lt)] border border-[var(--c-blue-mid)]" />Healthy service</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-50 border border-red-200" />Service with errors</span>
              <span>Click a node to see details</span>
            </div>
          </>
        ) : (
          <div className="card card-p text-center py-16">
            <GitBranch className="w-10 h-10 text-[var(--c-text3)] mx-auto mb-3" />
            <p className="font-medium text-[var(--c-text)]">No service data yet</p>
            <p className="text-sm text-[var(--c-text3)] mt-1 mb-2">Tag your events with a <code className="code-inline">service</code> property to build the map:</p>
            <code className="code-inline text-xs">monitor.trace('db.query', {'{'} service: 'postgres', value: 12 {'}'})</code>
          </div>
        )}
      </div>
    </AppShell>
  );
}
