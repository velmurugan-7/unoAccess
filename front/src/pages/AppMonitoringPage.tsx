// import { useEffect, useState, useCallback } from 'react';
// import { useParams } from 'react-router-dom';
// import { Activity, Clock, AlertTriangle, BarChart2, Users } from 'lucide-react';
// import {
//   LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
//   Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
// } from 'recharts';
// import api from '../lib/api';
// import { AppShell, AppSubNav } from '../components/AppShell';
// import { Badge, PageLoader } from '../components/ui';

// type TimeRange = '1h' | '24h' | '7d';

// interface Summary { totalRequests: number; avgResponseTime: number; maxResponseTime: number; errorRate: number; p95: number; p99: number; }
// interface TimePoint { timestamp: string; avgResponseTime: number; count: number; errorRate: number; }
// interface EndpointStat { endpoint: string; method: string; count: number; avgResponseTime: number; p50: number; p95: number; maxResponseTime: number; errorCount: number; }
// interface StatusCodeItem { _id: string; count: number; }
// interface UserStat { email?: string; name?: string; count: number; avgResponseTime: number; }
// interface StatsResponse {
//   client: { clientId: string; name: string; logoUrl?: string };
//   summary: Summary; timeSeries: TimePoint[]; endpoints: EndpointStat[];
//   statusCodes: StatusCodeItem[]; userBreakdown: UserStat[];
// }

// const RANGES: { label: string; value: TimeRange }[] = [
//   { label: 'Last hour', value: '1h' },
//   { label: 'Last 24h', value: '24h' },
//   { label: 'Last 7d', value: '7d' },
// ];

// const STATUS_COLORS: Record<string, string> = { '2xx': '#16a34a', '4xx': '#d97706', '5xx': '#dc2626', other: '#9ca3af' };

// const METHOD_BADGE: Record<string, string> = {
//   GET: 'badge-green', POST: 'badge-blue', DELETE: 'badge-red', PUT: 'badge-amber', PATCH: 'badge-purple',
// };

// const tt = { contentStyle: { background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12, color: 'var(--c-text)' } };

// export default function AppMonitoringPage() {
//   const { clientId } = useParams<{ clientId: string }>();
//   const [range, setRange] = useState<TimeRange>('24h');
//   const [data, setData] = useState<StatsResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const fetchStats = useCallback(async () => {
//     if (!clientId) return;
//     setLoading(true); setError('');
//     try {
//       const { data: res } = await api.get(`/api/monitoring/${clientId}/stats?range=${range}`);
//       setData(res);
//     } catch { setError('Failed to load monitoring data.'); }
//     finally { setLoading(false); }
//   }, [clientId, range]);

//   useEffect(() => { fetchStats(); }, [fetchStats]);

//   const fmtTime = (ts: string) => {
//     const d = new Date(ts);
//     return range === '7d'
//       ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
//       : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
//   };

//   const statusPieData = data?.statusCodes.map(i => ({
//     name: i._id, value: i.count, color: STATUS_COLORS[i._id] || '#94a3b8',
//   })) || [];

//   if (loading) return <AppShell><PageLoader /></AppShell>;

//   return (
//     <AppShell>
//       <AppSubNav clientId={clientId!} appName={data?.client.name} />
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-3">
//           <div className="page-header mb-0">
//             <h1 className="page-title">{data?.client.name || 'Monitoring'}</h1>
//             <p className="page-subtitle">Performance overview · {clientId}</p>
//           </div>
//           <div className="tab-bar">
//             {RANGES.map(r => (
//               <button key={r.value} className={`tab-btn ${range === r.value ? 'active' : ''}`} onClick={() => setRange(r.value)}>
//                 {r.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {error && <div className="alert alert-error mb-6">{error}</div>}

//         {!data ? (
//           <div className="card card-p text-center py-16 text-[var(--c-text3)]">No data yet. Ingest logs via the SDK to start monitoring.</div>
//         ) : (
//           <>
//             {/* Summary stats */}
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-5 sm:mb-6">
//               {[
//                 { label: 'Requests', value: data.summary.totalRequests.toLocaleString(), icon: <Activity className="w-4 h-4" /> },
//                 { label: 'Avg response', value: `${data.summary.avgResponseTime}ms`, icon: <Clock className="w-4 h-4" /> },
//                 { label: 'P95', value: `${data.summary.p95 ?? '—'}ms`, icon: <BarChart2 className="w-4 h-4" /> },
//                 { label: 'P99', value: `${data.summary.p99 ?? '—'}ms`, icon: <BarChart2 className="w-4 h-4" /> },
//                 { label: 'Max response', value: `${data.summary.maxResponseTime}ms`, icon: <Clock className="w-4 h-4" /> },
//                 { label: 'Error rate', value: `${data.summary.errorRate}%`, icon: <AlertTriangle className="w-4 h-4" />, danger: data.summary.errorRate > 5 },
//               ].map(s => (
//                 <div key={s.label} className={`stat-card ${s.danger ? 'ring-1 ring-red-200' : ''}`}>
//                   <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${s.danger ? 'bg-red-50 text-[var(--c-red)]' : 'bg-[var(--c-blue-lt)] text-[var(--c-blue)]'}`}>{s.icon}</div>
//                   <p className={`stat-value text-xl ${s.danger ? 'text-[var(--c-red)]' : ''}`}>{s.value}</p>
//                   <p className="stat-label">{s.label}</p>
//                 </div>
//               ))}
//             </div>

//             {/* Response time chart */}
//             <div className="card mb-5">
//               <div className="card-header"><p className="card-title">Response Time (avg ms)</p></div>
//               <div className="p-5">
//                 <ResponsiveContainer width="100%" height={200}>
//                   <LineChart data={data.timeSeries} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
//                     <XAxis dataKey="timestamp" tickFormatter={fmtTime} tick={{ fill: 'var(--c-text3)', fontSize: 11 }} />
//                     <YAxis tick={{ fill: 'var(--c-text3)', fontSize: 11 }} unit="ms" width={45} />
//                     <Tooltip {...tt} formatter={(v: number) => [`${v}ms`, 'Avg response']} labelFormatter={fmtTime} />
//                     <Line type="monotone" dataKey="avgResponseTime" stroke="var(--c-blue)" strokeWidth={2} dot={false} name="Avg (ms)" />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Volume + Error rate + Status codes */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-5">
//               <div className="card md:col-span-1">
//                 <div className="card-header"><p className="card-title">Request Volume</p></div>
//                 <div className="p-5">
//                   <ResponsiveContainer width="100%" height={160}>
//                     <BarChart data={data.timeSeries} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
//                       <XAxis dataKey="timestamp" tickFormatter={fmtTime} tick={{ fill: 'var(--c-text3)', fontSize: 10 }} />
//                       <YAxis tick={{ fill: 'var(--c-text3)', fontSize: 10 }} width={35} />
//                       <Tooltip {...tt} />
//                       <Bar dataKey="count" fill="var(--c-blue)" radius={[3, 3, 0, 0]} name="Requests" />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//               <div className="card md:col-span-1">
//                 <div className="card-header"><p className="card-title">Error Rate</p></div>
//                 <div className="p-5">
//                   <ResponsiveContainer width="100%" height={160}>
//                     <LineChart data={data.timeSeries} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
//                       <XAxis dataKey="timestamp" tickFormatter={fmtTime} tick={{ fill: 'var(--c-text3)', fontSize: 10 }} />
//                       <YAxis tick={{ fill: 'var(--c-text3)', fontSize: 10 }} unit="%" width={35} />
//                       <Tooltip {...tt} formatter={(v: number) => [`${v}%`, 'Error rate']} labelFormatter={fmtTime} />
//                       <Line type="monotone" dataKey="errorRate" stroke="var(--c-red)" strokeWidth={2} dot={false} />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>
//               <div className="card md:col-span-1">
//                 <div className="card-header"><p className="card-title">Status Codes</p></div>
//                 <div className="p-5 flex flex-col items-center">
//                   {statusPieData.length > 0 ? (
//                     <>
//                       <PieChart width={140} height={140}>
//                         <Pie data={statusPieData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
//                           {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
//                         </Pie>
//                         <Tooltip {...tt} formatter={(v: number, name: string) => [v.toLocaleString(), name]} />
//                       </PieChart>
//                       <div className="flex flex-wrap gap-2 mt-2 justify-center">
//                         {statusPieData.map(d => (
//                           <span key={d.name} className="flex items-center gap-1 text-xs text-[var(--c-text2)]">
//                             <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: d.color }} />{d.name}
//                           </span>
//                         ))}
//                       </div>
//                     </>
//                   ) : <p className="text-xs text-[var(--c-text3)] py-8">No data</p>}
//                 </div>
//               </div>
//             </div>

//             {/* Endpoint breakdown */}
//             <div className="card mb-5">
//               <div className="card-header"><p className="card-title">Endpoint Breakdown</p><Badge variant="gray">{data.endpoints.length} endpoints</Badge></div>
//               {data.endpoints.length === 0 ? (
//                 <div className="empty-state"><p className="text-sm text-[var(--c-text3)]">No endpoint data available</p></div>
//               ) : (
//                 <div className="table-wrap">
//                   <table className="table">
//                     <thead>
//                       <tr>{['Method', 'Endpoint', 'Requests', 'Avg', 'P50', 'P95', 'Max', 'Errors'].map(h => <th key={h}>{h}</th>)}</tr>
//                     </thead>
//                     <tbody>
//                       {data.endpoints.map((ep, i) => (
//                         <tr key={i}>
//                           <td><span className={`badge ${METHOD_BADGE[ep.method] || 'badge-gray'}`}>{ep.method}</span></td>
//                           <td><code className="text-xs font-mono text-[var(--c-text)] max-w-xs truncate block">{ep.endpoint}</code></td>
//                           <td>{ep.count.toLocaleString()}</td>
//                           <td>{ep.avgResponseTime}ms</td>
//                           <td>{ep.p50 ?? '—'}ms</td>
//                           <td>{ep.p95 ?? '—'}ms</td>
//                           <td>{ep.maxResponseTime}ms</td>
//                           <td><span className={ep.errorCount > 0 ? 'text-[var(--c-red)] font-medium' : 'text-[var(--c-text3)]'}>{ep.errorCount}</span></td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>

//             {/* Top users */}
//             {data.userBreakdown.length > 0 && (
//               <div className="card">
//                 <div className="card-header"><p className="card-title">Top Users</p><Users className="w-4 h-4 text-[var(--c-text3)]" /></div>
//                 <div className="divide-y divide-[var(--c-border)]">
//                   {data.userBreakdown.map((u, i) => (
//                     <div key={i} className="flex items-center gap-3 px-5 py-3">
//                       <div className="w-8 h-8 rounded-full bg-[var(--c-blue-lt)] text-[var(--c-blue)] text-xs font-bold flex items-center justify-center flex-shrink-0">
//                         {(u.name || u.email || '?')[0].toUpperCase()}
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <p className="text-sm font-medium text-[var(--c-text)] truncate">{u.name || u.email || 'Unknown'}</p>
//                         {u.name && u.email && <p className="text-xs text-[var(--c-text3)] truncate">{u.email}</p>}
//                       </div>
//                       <div className="text-right">
//                         <p className="text-sm font-medium text-[var(--c-text)]">{u.count.toLocaleString()} req</p>
//                         <p className="text-xs text-[var(--c-text3)]">{u.avgResponseTime}ms avg</p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </AppShell>
//   );
// }

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, Clock, AlertTriangle, BarChart2, Users } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import api from '../lib/api';
import { AppShell, AppSubNav } from '../components/AppShell';
import { Badge, PageLoader } from '../components/ui';

type TimeRange = '1h' | '24h' | '7d';

interface Summary { totalRequests: number; avgResponseTime: number; maxResponseTime: number; errorRate: number; p95: number; p99: number; }
interface TimePoint { timestamp: string; avgResponseTime: number; count: number; errorRate: number; }
interface EndpointStat { endpoint: string; method: string; count: number; avgResponseTime: number; p50: number; p95: number; maxResponseTime: number; errorCount: number; }
interface StatusCodeItem { _id: string; count: number; }
interface UserStat { email?: string; name?: string; count: number; avgResponseTime: number; }
interface StatsResponse {
  client: { clientId: string; name: string; logoUrl?: string };
  summary: Summary; timeSeries: TimePoint[]; endpoints: EndpointStat[];
  statusCodes: StatusCodeItem[]; userBreakdown: UserStat[];
}

const RANGES: { label: string; value: TimeRange }[] = [
  { label: 'Last hour', value: '1h' },
  { label: 'Last 24h', value: '24h' },
  { label: 'Last 7d', value: '7d' },
];

const STATUS_COLORS: Record<string, string> = { '2xx': '#16a34a', '4xx': '#d97706', '5xx': '#dc2626', other: '#9ca3af' };

const METHOD_BADGE: Record<string, string> = {
  GET: 'badge-green', POST: 'badge-blue', DELETE: 'badge-red', PUT: 'badge-amber', PATCH: 'badge-purple',
};

const tt = { contentStyle: { background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8, fontSize: 12, color: 'var(--c-text)' } };

export default function AppMonitoringPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [range, setRange] = useState<TimeRange>('24h');
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    if (!clientId) return;
    setLoading(true); setError('');
    try {
      const { data: res } = await api.get(`/api/monitoring/${clientId}/stats?range=${range}`);
      setData(res);
    } catch { setError('Failed to load monitoring data.'); }
    finally { setLoading(false); }
  }, [clientId, range]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const fmtTime = (ts: string) => {
    const d = new Date(ts);
    return range === '7d'
      ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const statusPieData = data?.statusCodes.map(i => ({
    name: i._id, value: i.count, color: STATUS_COLORS[i._id] || '#94a3b8',
  })) || [];

  if (loading) return <AppShell><PageLoader /></AppShell>;

  return (
    <AppShell>
      <AppSubNav clientId={clientId!} appName={data?.client.name} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-6 gap-3">
          <div className="page-header mb-0">
            <h1 className="page-title">{data?.client.name || 'Monitoring'}</h1>
            <p className="page-subtitle">Performance overview · {clientId}</p>
          </div>
          <div className="tab-bar">
            {RANGES.map(r => (
              <button key={r.value} className={`tab-btn ${range === r.value ? 'active' : ''}`} onClick={() => setRange(r.value)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error mb-6">{error}</div>}

        {!data ? (
          <div className="card card-p text-center py-16 text-[var(--c-text3)]">No data yet. Ingest logs via the SDK to start monitoring.</div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-5 sm:mb-6">
              {[
                { label: 'Requests', value: data.summary.totalRequests.toLocaleString(), icon: <Activity className="w-4 h-4" /> },
                { label: 'Avg response', value: `${data.summary.avgResponseTime}ms`, icon: <Clock className="w-4 h-4" /> },
                { label: 'P95', value: `${data.summary.p95 ?? '—'}ms`, icon: <BarChart2 className="w-4 h-4" /> },
                { label: 'P99', value: `${data.summary.p99 ?? '—'}ms`, icon: <BarChart2 className="w-4 h-4" /> },
                { label: 'Max response', value: `${data.summary.maxResponseTime}ms`, icon: <Clock className="w-4 h-4" /> },
                { label: 'Error rate', value: `${data.summary.errorRate}%`, icon: <AlertTriangle className="w-4 h-4" />, danger: data.summary.errorRate > 5 },
              ].map(s => (
                <div key={s.label} className={`stat-card ${s.danger ? 'ring-1 ring-red-200' : ''}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${s.danger ? 'bg-red-50 text-[var(--c-red)]' : 'bg-[var(--c-blue-lt)] text-[var(--c-blue)]'}`}>{s.icon}</div>
                  <p className={`stat-value text-xl ${s.danger ? 'text-[var(--c-red)]' : ''}`}>{s.value}</p>
                  <p className="stat-label">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Response time chart */}
            <div className="card mb-5">
              <div className="card-header"><p className="card-title">Response Time (avg ms)</p></div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.timeSeries} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                    <XAxis dataKey="timestamp" tickFormatter={fmtTime} tick={{ fill: 'var(--c-text3)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--c-text3)', fontSize: 11 }} unit="ms" width={45} />
                    <Tooltip {...tt} formatter={(v: number) => [`${v}ms`, 'Avg response']} labelFormatter={fmtTime} />
                    <Line type="monotone" dataKey="avgResponseTime" stroke="var(--c-blue)" strokeWidth={2} dot={false} name="Avg (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Volume + Error rate + Status codes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-5">
              <div className="card md:col-span-1">
                <div className="card-header"><p className="card-title">Request Volume</p></div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data.timeSeries} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                      <XAxis dataKey="timestamp" tickFormatter={fmtTime} tick={{ fill: 'var(--c-text3)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'var(--c-text3)', fontSize: 10 }} width={35} />
                      <Tooltip {...tt} />
                      <Bar dataKey="count" fill="var(--c-blue)" radius={[3, 3, 0, 0]} name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card md:col-span-1">
                <div className="card-header"><p className="card-title">Error Rate</p></div>
                <div className="p-5">
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={data.timeSeries} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                      <XAxis dataKey="timestamp" tickFormatter={fmtTime} tick={{ fill: 'var(--c-text3)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'var(--c-text3)', fontSize: 10 }} unit="%" width={35} />
                      <Tooltip {...tt} formatter={(v: number) => [`${v}%`, 'Error rate']} labelFormatter={fmtTime} />
                      <Line type="monotone" dataKey="errorRate" stroke="var(--c-red)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card md:col-span-1">
                <div className="card-header"><p className="card-title">Status Codes</p></div>
                <div className="p-5 flex flex-col items-center">
                  {statusPieData.length > 0 ? (
                    <>
                      <PieChart width={140} height={140}>
                        <Pie data={statusPieData} cx={65} cy={65} innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                          {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip {...tt} formatter={(v: number, name: string) => [v.toLocaleString(), name]} />
                      </PieChart>
                      <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {statusPieData.map(d => (
                          <span key={d.name} className="flex items-center gap-1 text-xs text-[var(--c-text2)]">
                            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: d.color }} />{d.name}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : <p className="text-xs text-[var(--c-text3)] py-8">No data</p>}
                </div>
              </div>
            </div>

            {/* Endpoint breakdown */}
            <div className="card mb-5">
              <div className="card-header"><p className="card-title">Endpoint Breakdown</p><Badge variant="gray">{data.endpoints.length} endpoints</Badge></div>
              {data.endpoints.length === 0 ? (
                <div className="empty-state"><p className="text-sm text-[var(--c-text3)]">No endpoint data available</p></div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>{['Method', 'Endpoint', 'Requests', 'Avg', 'P50', 'P95', 'Max', 'Errors'].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {data.endpoints.map((ep, i) => (
                        <tr key={i}>
                          <td><span className={`badge ${METHOD_BADGE[ep.method] || 'badge-gray'}`}>{ep.method}</span></td>
                          <td><code className="text-xs font-mono text-[var(--c-text)] max-w-xs truncate block">{ep.endpoint}</code></td>
                          <td>{ep.count.toLocaleString()}</td>
                          <td>{ep.avgResponseTime}ms</td>
                          <td>{ep.p50 ?? '—'}ms</td>
                          <td>{ep.p95 ?? '—'}ms</td>
                          <td>{ep.maxResponseTime}ms</td>
                          <td><span className={ep.errorCount > 0 ? 'text-[var(--c-red)] font-medium' : 'text-[var(--c-text3)]'}>{ep.errorCount}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top users */}
            {data.userBreakdown.length > 0 && (
              <div className="card">
                <div className="card-header"><p className="card-title">Top Users</p><Users className="w-4 h-4 text-[var(--c-text3)]" /></div>
                <div className="divide-y divide-[var(--c-border)]">
                  {data.userBreakdown.map((u, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--c-blue-lt)] text-[var(--c-blue)] text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {(u.name || u.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--c-text)] truncate">{u.name || u.email || 'Unknown'}</p>
                        {u.name && u.email && <p className="text-xs text-[var(--c-text3)] truncate">{u.email}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[var(--c-text)]">{u.count.toLocaleString()} req</p>
                        <p className="text-xs text-[var(--c-text3)]">{u.avgResponseTime}ms avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RUM (Real User Monitoring) — appended below, existing code untouched
// Route: /app/:clientId/rum
// Tab:   AppSubNav → "RUM" link
// ─────────────────────────────────────────────────────────────────────────────

interface RumSummaryMetric { avg: number | null; p75: number | null; count: number; }
interface RumSummary {
  lcp: RumSummaryMetric; cls: RumSummaryMetric; inp: RumSummaryMetric;
  fcp: RumSummaryMetric; ttfb: RumSummaryMetric;
}
interface RumRatingBreakdown { good: number; 'needs-improvement': number; poor: number; }
interface RumData {
  totalSessions: number;
  summary: RumSummary;
  ratingBreakdown: Record<string, RumRatingBreakdown>;
  topPages: { url: string; count: number; avgLcp: number | null }[];
  timeSeries: { timestamp: string; count: number; avgLcp: number | null; avgCls: number | null }[];
  deviceBreakdown: { type: string; count: number }[];
}

// Google Web Vitals thresholds
const rumRatingColor = { good: '#16a34a', 'needs-improvement': '#d97706', poor: '#dc2626' };
const rumRatingLabel = { good: 'Good', 'needs-improvement': 'Needs work', poor: 'Poor' };

function vitalsRating(metric: string, value: number | null): 'good' | 'needs-improvement' | 'poor' | null {
  if (value == null) return null;
  const thresholds: Record<string, [number, number]> = {
    lcp:  [2500, 4000],
    cls:  [0.1,  0.25],
    inp:  [200,  500],
    fcp:  [1800, 3000],
    ttfb: [800,  1800],
  };
  const [good, poor] = thresholds[metric] || [0, 0];
  return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
}

function VitalsCard({ label, metric, value, unit = 'ms', description }: {
  label: string; metric: string; value: number | null; unit?: string; description: string;
}) {
  const rating = vitalsRating(metric, value);
  const color = rating ? rumRatingColor[rating] : 'var(--c-text3)';
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-[var(--c-text3)] uppercase tracking-wider">{label}</p>
          <p className="text-xs text-[var(--c-text3)] mt-0.5">{description}</p>
        </div>
        {rating && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
          >
            {rumRatingLabel[rating]}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-3" style={{ color: value != null ? color : 'var(--c-text3)' }}>
        {value != null
          ? `${metric === 'cls' ? value.toFixed(3) : Math.round(value)}${unit}`
          : '—'}
      </p>
    </div>
  );
}

function RatingBar({ breakdown }: { breakdown: RumRatingBreakdown }) {
  const total = (breakdown.good || 0) + (breakdown['needs-improvement'] || 0) + (breakdown.poor || 0);
  if (total === 0) return <div className="h-2 bg-[var(--c-surface2)] rounded-full" />;
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
      {breakdown.good > 0 && (
        <div style={{ width: `${pct(breakdown.good)}%`, background: rumRatingColor.good }} />
      )}
      {breakdown['needs-improvement'] > 0 && (
        <div style={{ width: `${pct(breakdown['needs-improvement'])}%`, background: rumRatingColor['needs-improvement'] }} />
      )}
      {breakdown.poor > 0 && (
        <div style={{ width: `${pct(breakdown.poor)}%`, background: rumRatingColor.poor }} />
      )}
    </div>
  );
}

export function RumTab({ clientId }: { clientId: string }) {
  const [range, setRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [data, setData] = useState<RumData | null>(null);
  const [loadingRum, setLoadingRum] = useState(true);
  const [snippet, setSnippet] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSnippet, setShowSnippet] = useState(false);

  const RUM_RANGES = [
    { label: 'Last hour', value: '1h'  as const },
    { label: 'Last 24h', value: '24h' as const },
    { label: 'Last 7d',  value: '7d'  as const },
    { label: 'Last 30d', value: '30d' as const },
  ];

  useEffect(() => {
    setLoadingRum(true);
    api.get(`/api/monitoring/${clientId}/rum?range=${range}`)
      .then(({ data: res }) => setData(res))
      .catch(() => {})
      .finally(() => setLoadingRum(false));
  }, [clientId, range]);

  const loadSnippet = async () => {
    if (snippet) { setShowSnippet(true); return; }
    try {
      const { data: res } = await api.get(`/api/monitoring/${clientId}/rum-snippet`);
      setSnippet(res.snippet);
      setShowSnippet(true);
    } catch {}
  };

  const copy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rumTt = {
    contentStyle: {
      background: 'var(--c-surface)',
      border: '1px solid var(--c-border)',
      borderRadius: 8,
      fontSize: 12,
    },
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="tab-bar">
          {RUM_RANGES.map(r => (
            <button
              key={r.value}
              className={`tab-btn ${range === r.value ? 'active' : ''}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm gap-1.5" onClick={loadSnippet}>
          {/* Code icon */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          Add to your app
        </button>
      </div>

      {/* Snippet panel */}
      {showSnippet && snippet && (
        <div className="card mb-5">
          <div className="card-header">
            <div>
              <p className="card-title">RUM Snippet</p>
              <p className="card-desc">Paste inside the &lt;head&gt; tag of your HTML page</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm gap-1" onClick={copy}>
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSnippet(false)}>✕</button>
            </div>
          </div>
          <div className="p-4">
            <pre className="code-block text-xs overflow-x-auto whitespace-pre-wrap break-words">{snippet}</pre>
            <div className="mt-3 flex items-start gap-2 text-xs text-[var(--c-text3)]">
              <svg className="w-3.5 h-3.5 text-[var(--c-blue)] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              No cookies set. Query params stripped from URLs for privacy. No client secret exposed.
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loadingRum ? (
        <div className="flex justify-center py-20">
          <svg className="w-7 h-7 spinner text-[var(--c-blue)]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>

      ) : !data || data.totalSessions === 0 ? (
        /* Empty state */
        <div className="card card-p text-center py-16">
          <svg className="w-10 h-10 text-[var(--c-text3)] mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 19V6l12-3v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="15" r="3"/>
          </svg>
          <p className="font-medium text-[var(--c-text)]">No RUM data yet</p>
          <p className="text-sm text-[var(--c-text3)] mt-1 mb-4">
            Add the snippet to your app to start collecting Core Web Vitals
          </p>
          <button className="btn btn-primary btn-sm" onClick={loadSnippet}>
            Get the snippet
          </button>
        </div>

      ) : (
        <>
          {/* Session count badge */}
          <div className="mb-4">
            <span className="badge badge-blue">
              {data.totalSessions.toLocaleString()} real user sessions
            </span>
          </div>

          {/* Core Web Vitals cards — p75 (Google standard) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            <VitalsCard label="LCP"  metric="lcp"  value={data.summary.lcp?.p75  ?? null} description="Largest Contentful Paint" />
            <VitalsCard label="CLS"  metric="cls"  value={data.summary.cls?.p75  ?? null} unit="" description="Cumulative Layout Shift" />
            <VitalsCard label="INP"  metric="inp"  value={data.summary.inp?.p75  ?? null} description="Interaction to Next Paint" />
            <VitalsCard label="FCP"  metric="fcp"  value={data.summary.fcp?.p75  ?? null} description="First Contentful Paint" />
            <VitalsCard label="TTFB" metric="ttfb" value={data.summary.ttfb?.p75 ?? null} description="Time to First Byte" />
          </div>

          {/* Rating breakdown bars */}
          {Object.keys(data.ratingBreakdown).length > 0 && (
            <div className="card mb-5">
              <div className="card-header">
                <p className="card-title">Vitals breakdown</p>
                <span className="text-xs text-[var(--c-text3)]">at p75 — Google standard</span>
              </div>
              <div className="p-5 space-y-4">
                {['lcp', 'cls', 'inp', 'fcp', 'ttfb'].map(m => {
                  const bd = data.ratingBreakdown[m];
                  if (!bd) return null;
                  const total = (bd.good || 0) + (bd['needs-improvement'] || 0) + (bd.poor || 0);
                  if (total === 0) return null;
                  return (
                    <div key={m}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-[var(--c-text)] uppercase tracking-wider">
                          {m.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-[var(--c-text3)]">
                          <span style={{ color: rumRatingColor.good }}>✓ {bd.good} good</span>
                          <span style={{ color: rumRatingColor['needs-improvement'] }}>~ {bd['needs-improvement']} fair</span>
                          <span style={{ color: rumRatingColor.poor }}>✗ {bd.poor} poor</span>
                        </div>
                      </div>
                      <RatingBar breakdown={bd} />
                    </div>
                  );
                })}
                {/* Legend */}
                <div className="flex items-center gap-5 pt-1">
                  {Object.entries(rumRatingColor).map(([k, c]) => (
                    <span key={k} className="flex items-center gap-1.5 text-xs text-[var(--c-text3)]">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c }} />
                      {rumRatingLabel[k as keyof typeof rumRatingLabel]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LCP over time */}
          {data.timeSeries.length > 1 && (
            <div className="card mb-5">
              <div className="card-header"><p className="card-title">LCP over time</p></div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data.timeSeries} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                    <XAxis
                      dataKey="timestamp"
                      tick={{ fontSize: 10, fill: 'var(--c-text3)' }}
                      tickFormatter={ts =>
                        new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      }
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--c-text3)' }} unit="ms" width={45} />
                    <Tooltip
                      {...rumTt}
                      formatter={(v: number) => [`${Math.round(v)}ms`, 'Avg LCP']}
                    />
                    <Line type="monotone" dataKey="avgLcp" stroke="var(--c-blue)" strokeWidth={2} dot={false} name="LCP" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-2 flex items-center gap-3 text-xs text-[var(--c-text3)]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-5 border-t-2 border-green-500 border-dashed" />
                    Good ≤ 2500ms
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-5 border-t-2 border-amber-500 border-dashed" />
                    Needs work ≤ 4000ms
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Top pages + Device breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
            {data.topPages.length > 0 && (
              <div className="card">
                <div className="card-header"><p className="card-title">Top pages</p></div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Page</th><th>Sessions</th><th>Avg LCP</th></tr>
                    </thead>
                    <tbody>
                      {data.topPages.map((p, i) => {
                        const lcpRat = p.avgLcp != null ? vitalsRating('lcp', p.avgLcp) : null;
                        return (
                          <tr key={i}>
                            <td>
                              <code className="text-xs font-mono text-[var(--c-text)] truncate block max-w-[180px]">
                                {p.url}
                              </code>
                            </td>
                            <td>{p.count}</td>
                            <td>
                              {p.avgLcp != null ? (
                                <span style={{
                                  color: lcpRat ? rumRatingColor[lcpRat] : 'var(--c-text2)',
                                  fontWeight: 500, fontSize: 13,
                                }}>
                                  {Math.round(p.avgLcp)}ms
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {data.deviceBreakdown.length > 0 && (
              <div className="card">
                <div className="card-header"><p className="card-title">Device breakdown</p></div>
                <div className="p-5 space-y-3">
                  {data.deviceBreakdown.map((d, i) => {
                    const total = data.deviceBreakdown.reduce((s, x) => s + x.count, 0);
                    const pct = Math.round((d.count / total) * 100);
                    const devColors: Record<string, string> = {
                      mobile: '#2563eb', desktop: '#7c3aed', tablet: '#16a34a', unknown: '#9ca3af',
                    };
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="capitalize text-[var(--c-text2)] font-medium">{d.type}</span>
                          <span className="text-[var(--c-text3)]">{d.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-[var(--c-surface2)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: devColors[d.type] || '#9ca3af' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Standalone page wrapper — route: /app/:clientId/rum ───────────────────────
export function RumPageWrapper() {
  const { clientId } = useParams<{ clientId: string }>();
  return (
    <AppShell>
      <AppSubNav clientId={clientId!} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10">
        <div className="page-header">
          <h1 className="page-title">Real User Monitoring</h1>
          <p className="page-subtitle">
            Core Web Vitals from real browsers — LCP, CLS, INP, FCP, TTFB
          </p>
        </div>
        <RumTab clientId={clientId!} />
      </div>
    </AppShell>
  );
}