// import { useState } from 'react';
// import { Link } from 'react-router-dom';
// import {
//   Search, Book, Code, Zap, Shield, Key, Bell, BarChart3,
//   ChevronRight, Copy, Check, Terminal, AlertCircle, Lightbulb,
//   ArrowRight, Settings, Globe, Play,
// } from 'lucide-react';
// import { Logo, Badge } from '../components/ui';

// // ─── Primitives ───────────────────────────────────────────────────────────────

// function CopyBtn({ text }: { text: string }) {
//   const [ok, setOk] = useState(false);
//   const go = () => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); };
//   return (
//     <button onClick={go} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all">
//       {ok ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
//       {ok ? 'Copied' : 'Copy'}
//     </button>
//   );
// }

// function Block({ code, title, lang = 'bash' }: { code: string; title?: string; lang?: string }) {
//   return (
//     <div className="rounded-xl overflow-hidden border border-[#1e293b] my-4">
//       {title && (
//         <div className="bg-[#0f172a] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Terminal className="w-3.5 h-3.5 text-[#475569]" />
//             <span className="text-xs text-[#475569] font-mono">{title}</span>
//           </div>
//           <CopyBtn text={code} />
//         </div>
//       )}
//       <div className="bg-[#0f172a] flex">
//         <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-[#e2e8f0] flex-1">{code}</pre>
//         {!title && <div className="p-3 flex-shrink-0"><CopyBtn text={code} /></div>}
//       </div>
//     </div>
//   );
// }

// function Note({ type = 'tip', children }: { type?: 'tip' | 'warn' | 'info'; children: React.ReactNode }) {
//   const cfg = {
//     tip:  { bg: 'bg-green-50',  border: 'border-green-200',                    icon: <Lightbulb  className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />, lbl: 'Tip',  lc: 'text-green-700'  },
//     warn: { bg: 'bg-amber-50',  border: 'border-amber-200',                    icon: <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />, lbl: 'Note', lc: 'text-amber-700'  },
//     info: { bg: 'bg-[var(--c-blue-lt)]', border: 'border-[var(--c-blue-mid)]', icon: <AlertCircle className="w-4 h-4 text-[var(--c-blue)] flex-shrink-0 mt-0.5" />, lbl: 'Info', lc: 'text-[var(--c-blue)]' },
//   }[type];
//   return (
//     <div className={`flex gap-3 p-4 rounded-lg border ${cfg.bg} ${cfg.border} my-4`}>
//       {cfg.icon}
//       <div>
//         <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${cfg.lc}`}>{cfg.lbl}</p>
//         <div className="text-sm text-[var(--c-text2)] leading-relaxed">{children}</div>
//       </div>
//     </div>
//   );
// }

// function IC({ c }: { c: string }) {
//   return <code className="code-inline">{c}</code>;
// }

// function Step({ n, title, children, last }: { n: number; title: string; children: React.ReactNode; last?: boolean }) {
//   return (
//     <div className="flex gap-5">
//       <div className="flex flex-col items-center">
//         <div className="w-8 h-8 rounded-full bg-[var(--c-blue)] text-white text-sm font-bold flex items-center justify-center flex-shrink-0 z-10">{n}</div>
//         {!last && <div className="w-px flex-1 bg-[var(--c-border)] mt-2 mb-0" style={{ minHeight: 32 }} />}
//       </div>
//       <div className="flex-1 min-w-0 pt-1 pb-10">
//         <h3 className="text-base font-semibold text-[var(--c-text)] mb-3">{title}</h3>
//         {children}
//       </div>
//     </div>
//   );
// }

// // ─── Stack-aware code ─────────────────────────────────────────────────────────
// const STACKS = ['Express.js', 'Next.js', 'Fastify', 'NestJS'] as const;
// type Stack = typeof STACKS[number];

// const CALLBACK: Record<Stack, { file: string; code: string }> = {
//   'Express.js': {
//     file: 'routes/auth.js',
//     code: `const router = require('express').Router();
// const axios  = require('axios');

// // Redirect user to UnoAccess login page
// router.get('/auth/login', (req, res) => {
//   const q = new URLSearchParams({
//     response_type: 'code',
//     client_id:     process.env.UA_CLIENT_ID,
//     redirect_uri:  process.env.UA_REDIRECT_URI,
//     scope:         'openid profile email',
//     state:         'csrf_token',
//   });
//   res.redirect(\`\${process.env.UA_URL}/oauth/authorize?\${q}\`);
// });

// // UnoAccess sends the user back here with ?code=...
// router.get('/auth/callback', async (req, res) => {
//   const { code } = req.query;

//   // 1. Exchange the code for tokens
//   const { data: tokens } = await axios.post(
//     \`\${process.env.UA_URL}/oauth/token\`,
//     new URLSearchParams({
//       grant_type:    'authorization_code',
//       code,
//       redirect_uri:  process.env.UA_REDIRECT_URI,
//       client_id:     process.env.UA_CLIENT_ID,
//       client_secret: process.env.UA_CLIENT_SECRET,
//     }),
//     { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
//   );

//   // 2. Fetch the user's profile
//   const { data: user } = await axios.get(
//     \`\${process.env.UA_URL}/oauth/userinfo\`,
//     { headers: { Authorization: \`Bearer \${tokens.access_token}\` } }
//   );

//   // 3. Store in session and redirect
//   req.session.user         = user;
//   req.session.access_token = tokens.access_token;
//   res.redirect('/dashboard');
// });

// module.exports = router;`,
//   },
//   'Next.js': {
//     file: 'app/api/auth/callback/route.ts',
//     code: `import { NextRequest, NextResponse } from 'next/server';
// import { cookies } from 'next/headers';

// export async function GET(req: NextRequest) {
//   const code = req.nextUrl.searchParams.get('code');
//   if (!code) return NextResponse.redirect('/login?error=no_code');

//   // 1. Exchange code for tokens
//   const tokenRes = await fetch(\`\${process.env.UA_URL}/oauth/token\`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//     body: new URLSearchParams({
//       grant_type:    'authorization_code',
//       code,
//       redirect_uri:  process.env.UA_REDIRECT_URI!,
//       client_id:     process.env.UA_CLIENT_ID!,
//       client_secret: process.env.UA_CLIENT_SECRET!,
//     }),
//   });
//   const tokens = await tokenRes.json();

//   // 2. Fetch user profile
//   const userRes = await fetch(\`\${process.env.UA_URL}/oauth/userinfo\`, {
//     headers: { Authorization: \`Bearer \${tokens.access_token}\` },
//   });
//   const user = await userRes.json();

//   // 3. Store token in httpOnly cookie
//   const cookieStore = cookies();
//   cookieStore.set('access_token', tokens.access_token, {
//     httpOnly: true, secure: true, maxAge: 900,
//   });
//   cookieStore.set('user', JSON.stringify(user), {
//     httpOnly: true, secure: true, maxAge: 3600 * 24 * 7,
//   });

//   return NextResponse.redirect(new URL('/dashboard', req.url));
// }`,
//   },
//   'Fastify': {
//     file: 'routes/auth.ts',
//     code: `import { FastifyInstance } from 'fastify';
// import axios from 'axios';

// export async function authRoutes(app: FastifyInstance) {

//   // Redirect to UnoAccess
//   app.get('/auth/login', (req, reply) => {
//     const q = new URLSearchParams({
//       response_type: 'code',
//       client_id:     process.env.UA_CLIENT_ID!,
//       redirect_uri:  process.env.UA_REDIRECT_URI!,
//       scope:         'openid profile email',
//       state:         'csrf_token',
//     });
//     reply.redirect(\`\${process.env.UA_URL}/oauth/authorize?\${q}\`);
//   });

//   // Callback handler
//   app.get<{ Querystring: { code: string } }>(
//     '/auth/callback',
//     async (req, reply) => {
//       const { code } = req.query;

//       // Exchange code for tokens
//       const { data: tokens } = await axios.post(
//         \`\${process.env.UA_URL}/oauth/token\`,
//         new URLSearchParams({
//           grant_type:    'authorization_code',
//           code,
//           redirect_uri:  process.env.UA_REDIRECT_URI!,
//           client_id:     process.env.UA_CLIENT_ID!,
//           client_secret: process.env.UA_CLIENT_SECRET!,
//         }),
//         { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
//       );

//       // Fetch user profile
//       const { data: user } = await axios.get(
//         \`\${process.env.UA_URL}/oauth/userinfo\`,
//         { headers: { Authorization: \`Bearer \${tokens.access_token}\` } }
//       );

//       req.session.set('user', user);
//       reply.redirect('/dashboard');
//     }
//   );
// }`,
//   },
//   'NestJS': {
//     file: 'auth/auth.controller.ts',
//     code: `import { Controller, Get, Query, Req, Res } from '@nestjs/common';
// import { Request, Response } from 'express';
// import axios from 'axios';

// @Controller('auth')
// export class AuthController {

//   @Get('login')
//   login(@Res() res: Response) {
//     const q = new URLSearchParams({
//       response_type: 'code',
//       client_id:     process.env.UA_CLIENT_ID,
//       redirect_uri:  process.env.UA_REDIRECT_URI,
//       scope:         'openid profile email',
//       state:         'csrf_token',
//     });
//     res.redirect(\`\${process.env.UA_URL}/oauth/authorize?\${q}\`);
//   }

//   @Get('callback')
//   async callback(
//     @Query('code') code: string,
//     @Req()  req: Request,
//     @Res()  res: Response,
//   ) {
//     // Exchange code for tokens
//     const { data: tokens } = await axios.post(
//       \`\${process.env.UA_URL}/oauth/token\`,
//       new URLSearchParams({
//         grant_type:    'authorization_code',
//         code,
//         redirect_uri:  process.env.UA_REDIRECT_URI,
//         client_id:     process.env.UA_CLIENT_ID,
//         client_secret: process.env.UA_CLIENT_SECRET,
//       }),
//       { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
//     );

//     // Fetch user profile
//     const { data: user } = await axios.get(
//       \`\${process.env.UA_URL}/oauth/userinfo\`,
//       { headers: { Authorization: \`Bearer \${tokens.access_token}\` } }
//     );

//     (req.session as any).user = user;
//     res.redirect('/dashboard');
//   }
// }`,
//   },
// };

// const GUARD: Record<Stack, { file: string; code: string }> = {
//   'Express.js': {
//     file: 'middleware/requireAuth.js',
//     code: `// Middleware — drop this before any protected route
// module.exports = function requireAuth(req, res, next) {
//   if (!req.session?.user) {
//     return res.redirect('/auth/login');
//   }
//   next();
// };

// // Usage:
// // const requireAuth = require('../middleware/requireAuth');
// // router.get('/dashboard', requireAuth, handler);`,
//   },
//   'Next.js': {
//     file: 'middleware.ts',
//     code: `import { NextRequest, NextResponse } from 'next/server';

// export function middleware(req: NextRequest) {
//   const token = req.cookies.get('access_token')?.value;
//   const isProtected = req.nextUrl.pathname.startsWith('/dashboard')
//     || req.nextUrl.pathname.startsWith('/account');

//   if (!token && isProtected) {
//     return NextResponse.redirect(new URL('/auth/login', req.url));
//   }
//   return NextResponse.next();
// }

// export const config = {
//   matcher: ['/dashboard/:path*', '/account/:path*'],
// };`,
//   },
//   'Fastify': {
//     file: 'hooks/requireAuth.ts',
//     code: `import { FastifyRequest, FastifyReply } from 'fastify';

// export async function requireAuth(
//   req: FastifyRequest,
//   reply: FastifyReply
// ) {
//   if (!req.session.get('user')) {
//     reply.redirect('/auth/login');
//   }
// }

// // Usage on a route:
// // app.get('/dashboard', { preHandler: [requireAuth] }, handler);`,
//   },
//   'NestJS': {
//     file: 'auth/auth.guard.ts',
//     code: `import {
//   Injectable, CanActivate, ExecutionContext
// } from '@nestjs/common';

// @Injectable()
// export class AuthGuard implements CanActivate {
//   canActivate(ctx: ExecutionContext): boolean {
//     const req = ctx.switchToHttp().getRequest();
//     return !!req.session?.user;
//   }
// }

// // Protect a controller or route:
// // @UseGuards(AuthGuard)
// // @Get('dashboard')
// // dashboard(@Req() req) { return req.session.user; }`,
//   },
// };

// // ─── Quick Start ──────────────────────────────────────────────────────────────
// function QuickStart() {
//   const [stack, setStack] = useState<Stack>('Express.js');

//   const StackTabs = () => (
//     <div className="flex flex-wrap gap-1.5 mb-0">
//       {STACKS.map(s => (
//         <button key={s} onClick={() => setStack(s)}
//           className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
//             stack === s
//               ? 'bg-[var(--c-blue)] text-white border-[var(--c-blue)]'
//               : 'bg-[var(--c-surface)] text-[var(--c-text2)] border-[var(--c-border2)] hover:border-[var(--c-blue)] hover:text-[var(--c-blue)]'
//           }`}>{s}
//         </button>
//       ))}
//     </div>
//   );

//   return (
//     <div>
//       {/* Intro banner */}
//       <div className="flex items-center gap-3 p-4 bg-[var(--c-blue-lt)] border border-[var(--c-blue-mid)] rounded-lg mb-8">
//         <Shield className="w-5 h-5 text-[var(--c-blue)] flex-shrink-0" />
//         <p className="text-sm text-[var(--c-blue)]">
//           This guide walks you through adding <strong>UnoAccess login</strong> to your existing backend — pick your framework and follow along.
//           Estimated time: <strong>~15 minutes</strong>.
//         </p>
//       </div>

//       {/* Step 1 */}
//       <Step n={1} title="Deploy UnoAccess (or use a hosted instance)">
//         <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-3">
//           Clone the repo, install deps, copy the env files, and start the two dev servers.
//           If you already have a hosted UnoAccess instance, jump straight to Step 2.
//         </p>
//         <Block lang="bash" title="terminal" code={`git clone https://github.com/your-org/unoaccess
// cd unoaccess

// # Install backend and frontend dependencies
// cd back  && npm install && cd ..
// cd front && npm install && cd ..

// # Copy environment templates
// cp back/.env.example  back/.env
// cp front/.env.example front/.env`} />
//         <Note type="warn">
//           Open <IC c="back/.env" /> and set <IC c="MONGODB_URI" />, <IC c="JWT_ACCESS_SECRET" />,{' '}
//           <IC c="JWT_REFRESH_SECRET" />, and <IC c="ENCRYPTION_KEY" /> before starting. All four are required.
//         </Note>
//         <Block lang="bash" title="terminal" code={`# Terminal 1 — backend (port 5000)
// cd back && npm run dev

// # Terminal 2 — frontend (port 5173)
// cd front && npm run dev`} />
//         <Note type="tip">
//           In production run <IC c="npm run build" /> in both folders. Deploy <IC c="back/dist/server.js" />{' '}
//           on Render / Railway and <IC c="front/dist/" /> on Vercel or any static host.
//         </Note>
//       </Step>

//       {/* Step 2 */}
//       <Step n={2} title="Create an admin account and register your first OAuth client">
//         <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-3">
//           Register at <IC c="/signup" />, then use the MongoDB shell to give your account admin rights so you can access the Admin Panel.
//         </p>
//         <Block lang="bash" title="mongosh" code={`db.users.updateOne(
//   { email: "you@example.com" },
//   { $set: { role: "admin" } }
// )`} />
//         <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-3">
//           Go to <strong>/admin → OAuth Clients → Create Client</strong>. Use these values:
//         </p>
//         <div className="rounded-lg border border-[var(--c-border)] overflow-hidden mb-4">
//           {[
//             { f: 'Name',         v: 'My App',                                    note: '' },
//             { f: 'Redirect URI', v: 'http://localhost:3000/auth/callback',        note: 'must match exactly' },
//             { f: 'Scopes',       v: 'openid profile email',                       note: '' },
//           ].map((r, i) => (
//             <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < 2 ? 'border-b border-[var(--c-border)]' : ''}`}>
//               <span className="text-xs font-medium text-[var(--c-text3)] w-24 flex-shrink-0">{r.f}</span>
//               <code className="text-sm font-mono text-[var(--c-text)]">{r.v}</code>
//               {r.note && <span className="text-xs text-[var(--c-text3)] ml-auto">{r.note}</span>}
//             </div>
//           ))}
//         </div>
//         <Note type="warn">
//           The <strong>client secret is displayed only once</strong> when you create the client. Copy it immediately — you will not be able to retrieve it again.
//         </Note>
//       </Step>

//       {/* Step 3 */}
//       <Step n={3} title="Add UnoAccess credentials to your app's environment">
//         <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-3">
//           Add four variables to your application's <IC c=".env" /> file using the values from Step 2.
//         </p>
//         <Block lang="bash" title="your-app/.env" code={`# UnoAccess server URL
// UA_URL=http://localhost:5000

// # From Admin Panel → OAuth Clients
// UA_CLIENT_ID=ua_your_client_id_here
// UA_CLIENT_SECRET=your_client_secret_here

// # Must match exactly what you entered in the Admin Panel
// UA_REDIRECT_URI=http://localhost:3000/auth/callback`} />
//       </Step>

//       {/* Step 4 */}
//       <Step n={4} title="Add the login redirect and OAuth callback routes">
//         <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-4">
//           You need two routes: a <strong>login route</strong> that sends the user to UnoAccess, and a <strong>callback route</strong> that receives the authorization code, exchanges it for tokens, and fetches the user's profile.
//         </p>
//         <StackTabs />
//         <div className="rounded-xl overflow-hidden border border-[#1e293b] mt-3">
//           <div className="bg-[#0f172a] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Terminal className="w-3.5 h-3.5 text-[#475569]" />
//               <span className="text-xs text-[#475569] font-mono">{CALLBACK[stack].file}</span>
//               <Badge variant="gray" className="ml-1 !text-[10px]">{stack}</Badge>
//             </div>
//             <CopyBtn text={CALLBACK[stack].code} />
//           </div>
//           <pre className="bg-[#0f172a] p-5 overflow-x-auto text-xs font-mono leading-relaxed text-[#e2e8f0]">
//             {CALLBACK[stack].code}
//           </pre>
//         </div>
//         <Note type="info">
//           <strong>How it works:</strong> The login route redirects to <IC c="/oauth/authorize" />.
//           After the user signs in, UnoAccess redirects back to your callback with a one-time <IC c="code" />.
//           Your callback exchanges that code for an access token and fetches the user profile from <IC c="/oauth/userinfo" />.
//         </Note>
//       </Step>

//       {/* Step 5 */}
//       <Step n={5} title="Protect your routes — block unauthenticated users">
//         <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-4">
//           Add an auth guard so only logged-in users can access protected pages.
//         </p>
//         <StackTabs />
//         <div className="rounded-xl overflow-hidden border border-[#1e293b] mt-3">
//           <div className="bg-[#0f172a] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <Terminal className="w-3.5 h-3.5 text-[#475569]" />
//               <span className="text-xs text-[#475569] font-mono">{GUARD[stack].file}</span>
//             </div>
//             <CopyBtn text={GUARD[stack].code} />
//           </div>
//           <pre className="bg-[#0f172a] p-5 overflow-x-auto text-xs font-mono leading-relaxed text-[#e2e8f0]">
//             {GUARD[stack].code}
//           </pre>
//         </div>
//       </Step>

//       {/* Step 6 */}
//       <Step n={6} title="Add the login button to your frontend">
//         <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-3">
//           No frontend SDK needed — just link to your backend's <IC c="/auth/login" /> route.
//         </p>
//         <Block lang="ts" title="Any frontend framework" code={`// React
// <a href="/auth/login" className="btn btn-primary">
//   Sign in with UnoAccess
// </a>

// // Vanilla HTML
// // <a href="/auth/login">Sign in</a>

// // To read the logged-in user on the frontend,
// // expose a /api/me endpoint in your backend:
// // app.get('/api/me', requireAuth, (req, res) =>
// //   res.json(req.session.user)
// // );

// // Logout — hit UnoAccess then clear your session
// async function logout() {
//   await fetch(\`\${UA_URL}/api/auth/logout\`, {
//     method: 'POST', credentials: 'include',
//   });
//   window.location.href = '/';
// }`} />
//       </Step>

//       {/* Step 7 — Monitoring */}
//       <Step n={7} title="(Optional) Add performance monitoring to your app">
//         <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-3">
//           Add the SDK to your backend to see response times, error rates, and p95 latency in the UnoAccess dashboard — live.
//         </p>
//         <Block lang="bash" title="terminal" code={`npm install unoaccess-monitor`} />
//         <Block lang="ts" title="your-app/src/index.ts" code={`import { monitor } from 'unoaccess-monitor';
// import express from 'express';

// const app = express();

// // 1. Initialise once at startup
// monitor.init({
//   clientId:      process.env.UA_CLIENT_ID,
//   clientSecret:  process.env.UA_CLIENT_SECRET,
//   endpoint:      process.env.UA_URL,
//   flushInterval: 10_000,   // flush every 10 seconds
// });

// // 2. Auto-track every HTTP request
// app.use(monitor.middleware());

// // 3. Capture unhandled errors
// app.use((err, req, res, next) => {
//   monitor.captureError(err, {
//     service: 'api',
//     userId:  req.session?.user?.sub,
//   });
//   next(err);
// });

// // 4. Trace custom metrics (e.g. database query time)
// async function getUser(id: string) {
//   const t0 = Date.now();
//   const user = await db.users.findById(id);

//   monitor.trace('db.query', {
//     service: 'postgres',
//     table:   'users',
//     value:   Date.now() - t0,   // duration in ms
//   });

//   return user;
// }`} />
//         <Note type="tip">
//           Once logs are flowing, open <strong>Dashboard → your app → Monitoring</strong> to see live charts.
//           Set up <strong>Alert Rules</strong> from the sidebar to get notified when error rates spike.
//         </Note>
//       </Step>

//       {/* Done */}
//       <div className="flex gap-5">
//         <div className="w-8 h-8 rounded-full bg-[var(--c-green)] text-white flex items-center justify-center flex-shrink-0">
//           <Check className="w-4 h-4" />
//         </div>
//         <div className="flex-1 pt-1">
//           <h3 className="text-base font-semibold text-[var(--c-text)] mb-4">You're live 🎉</h3>
//           <div className="grid sm:grid-cols-2 gap-3">
//             {[
//               { icon: <Globe className="w-4 h-4" />,    label: 'Open your dashboard',      href: '/dashboard' },
//               { icon: <Settings className="w-4 h-4" />, label: 'Manage OAuth clients',      href: '/admin' },
//               { icon: <BarChart3 className="w-4 h-4" />,label: 'View monitoring docs',       href: '/docs#sdk' },
//               { icon: <Bell className="w-4 h-4" />,     label: 'Set up alert rules',         href: '/alerts' },
//             ].map(a => (
//               <Link key={a.label} to={a.href}
//                 className="flex items-center gap-2.5 px-4 py-3 card hover:shadow-md transition-shadow text-sm text-[var(--c-text2)] hover:text-[var(--c-blue)] group">
//                 <span className="text-[var(--c-text3)] group-hover:text-[var(--c-blue)] transition-colors">{a.icon}</span>
//                 {a.label}
//                 <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
//               </Link>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Markdown renderer (for other sections) ───────────────────────────────────
// function MD({ text }: { text: string }) {
//   const lines = text.trim().split('\n');
//   const out: React.ReactNode[] = [];
//   let i = 0, cLines: string[] | null = null, ck = 0;
//   const inl = (s: string) => s.replace(/`([^`]+)`/g, '<code class="code-inline">$1</code>');

//   while (i < lines.length) {
//     const l = lines[i];
//     if (l.startsWith('```')) {
//       if (!cLines) cLines = [];
//       else { out.push(<pre key={`c${ck++}`} className="code-block text-xs my-4 overflow-x-auto">{cLines.join('\n')}</pre>); cLines = null; }
//     } else if (cLines !== null) {
//       cLines.push(l);
//     } else if (l.startsWith('## ')) {
//       out.push(<h2 key={i} className="text-base font-semibold text-[var(--c-text)] mt-7 mb-2 pt-5 border-t border-[var(--c-border)]">{l.slice(3)}</h2>);
//     } else if (l.startsWith('### ')) {
//       out.push(<h3 key={i} className="text-sm font-semibold text-[var(--c-text)] mt-5 mb-2">{l.slice(4)}</h3>);
//     } else if (l.startsWith('| ')) {
//       const rows: string[][] = []; let j = i;
//       while (j < lines.length && lines[j].startsWith('|')) {
//         if (!lines[j].includes('---')) rows.push(lines[j].split('|').slice(1,-1).map(c=>c.trim()));
//         j++;
//       }
//       if (rows.length > 0) out.push(<div key={i} className="table-wrap my-4"><table className="table"><thead><tr>{rows[0].map((h,hi)=><th key={hi}>{h}</th>)}</tr></thead><tbody>{rows.slice(1).map((r,ri)=><tr key={ri}>{r.map((c,ci)=><td key={ci} dangerouslySetInnerHTML={{__html:inl(c)}}/>)}</tr>)}</tbody></table></div>);
//       i = j - 1;
//     } else if (l.startsWith('- ')) {
//       out.push(<li key={i} className="text-sm text-[var(--c-text2)] ml-5 mb-1.5 list-disc" dangerouslySetInnerHTML={{__html:inl(l.slice(2))}} />);
//     } else if (l.trim()) {
//       out.push(<p key={i} className="text-sm text-[var(--c-text2)] mb-3 leading-relaxed" dangerouslySetInnerHTML={{__html:inl(l)}} />);
//     }
//     i++;
//   }
//   return <>{out}</>;
// }

// // ─── Sections registry ────────────────────────────────────────────────────────
// const SECTIONS = [
//   { id: 'quickstart', label: 'Quick Start',      icon: <Zap       className="w-4 h-4" />, custom: true },
//   { id: 'sdk',        label: 'Monitoring SDK',   icon: <BarChart3 className="w-4 h-4" />, title: 'Monitoring SDK',             sub: 'Drop-in SDK for Node.js apps.',         body: `
// ## Install\n\n\`\`\`bash\nnpm install unoaccess-monitor\n\`\`\`\n\n## Init\n\n\`\`\`typescript\nmonitor.init({ clientId, clientSecret, endpoint });\n\`\`\`\n\n## Middleware\n\n\`\`\`typescript\napp.use(monitor.middleware());\n\`\`\`\n\n## Custom events\n\n\`\`\`typescript\nmonitor.trace('db.query', { service: 'postgres', value: 42 });\n\`\`\`\n\n## Error capture\n\n\`\`\`typescript\ntry { await op(); } catch(e) { monitor.captureError(e, { service: 'api' }); throw e; }\n\`\`\`` },
//   { id: 'oauth',      label: 'OAuth 2.0 / OIDC', icon: <Shield    className="w-4 h-4" />, title: 'OAuth 2.0 / OIDC',           sub: 'Full flow reference.',                  body: `
// ## Authorization Code Flow\n\n### 1. Redirect\n\n\`\`\`\nGET /oauth/authorize\n  ?response_type=code\n  &client_id=ua_...\n  &redirect_uri=https://app.com/auth/callback\n  &scope=openid profile email\n  &state=csrf_token\n\`\`\`\n\n### 2. Exchange code for tokens\n\n\`\`\`bash\nPOST /oauth/token\ngrant_type=authorization_code\n&code=AUTH_CODE\n&redirect_uri=...\n&client_id=ua_...\n&client_secret=...\n\`\`\`\n\n### 3. Get user info\n\n\`\`\`bash\nGET /oauth/userinfo\nAuthorization: Bearer ACCESS_TOKEN\n\`\`\`\n\n## Refresh\n\n\`\`\`bash\nPOST /oauth/token\ngrant_type=refresh_token&refresh_token=...&client_id=...&client_secret=...\n\`\`\`` },
//   { id: 'api-keys',   label: 'API Keys',          icon: <Key       className="w-4 h-4" />, title: 'Personal Access Tokens',     sub: 'Auth without user sessions.',           body: `\n## Create\n\nGo to **Account → API Keys → Create key**. The key is shown once — store it immediately.\n\n## Use\n\n\`\`\`bash\ncurl https://your-instance.com/api/user/profile \\\\\n  -H "Authorization: Bearer ua_your_key"\n\`\`\`\n\n## Security\n\n- Keys are stored as SHA-256 hashes\n- Set expiry dates for CI/CD keys\n- Revoke unused keys regularly` },
//   { id: 'alerts',     label: 'Alerts',            icon: <Bell      className="w-4 h-4" />, title: 'Real-time Alerts',           sub: 'Notify when metrics cross thresholds.',  body: `\n## Metrics\n\n| Metric | Description |\n|--------|-------------|\n| \`error_rate\` | % requests with status ≥ 400 |\n| \`response_time_p95\` | 95th percentile (ms) |\n| \`response_time_avg\` | Average response time (ms) |\n| \`request_count\` | Total requests in window |\n\n## Webhook payload\n\n\`\`\`json\n{\n  "type": "alert.triggered",\n  "ruleName": "High error rate",\n  "metric": "error_rate",\n  "actualValue": 8.3,\n  "threshold": 5\n}\n\`\`\`` },
//   { id: 'api-ref',    label: 'API Reference',     icon: <Code      className="w-4 h-4" />, title: 'API Reference',              sub: 'All endpoints.',                         body: `\n## Auth\n\n| Method | Path | Description |\n|--------|------|-------------|\n| POST | \`/api/auth/register\` | Register |\n| POST | \`/api/auth/login\` | Login |\n| POST | \`/api/auth/logout\` | Logout |\n| POST | \`/api/auth/refresh\` | Refresh token |\n\n## User\n\n| Method | Path | Description |\n|--------|------|-------------|\n| GET | \`/api/user/profile\` | Get profile |\n| GET | \`/api/user/api-keys\` | List keys |\n| POST | \`/api/user/api-keys\` | Create key |\n| GET | \`/api/user/audit-log/export\` | Export logs |\n\n## Monitoring\n\n| Method | Path | Description |\n|--------|------|-------------|\n| POST | \`/api/monitoring/logs\` | Ingest logs |\n| POST | \`/api/monitoring/events\` | Custom events |\n| POST | \`/api/monitoring/errors\` | Capture errors |\n| GET | \`/api/monitoring/:id/stats\` | App stats |` },
// ];

// // ─── Page ─────────────────────────────────────────────────────────────────────
// export default function DocsPage() {
//   const [active, setActive] = useState('quickstart');
//   const [q, setQ] = useState('');

//   const filtered = SECTIONS.filter(s => s.label.toLowerCase().includes(q.toLowerCase()));
//   const cur = SECTIONS.find(s => s.id === active) || SECTIONS[0];

//   return (
//     <div className="min-h-screen bg-[var(--c-bg)]">
//       {/* Header */}
//       <header className="bg-[var(--c-surface)] border-b border-[var(--c-border)] sticky top-0 z-40">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <Link to="/"><Logo size="sm" /></Link>
//             <span className="text-[var(--c-border2)]">|</span>
//             <span className="text-sm font-medium text-[var(--c-text2)]">Documentation</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <a href="https://github.com" target="_blank" rel="noopener noreferrer"
//               className="btn btn-ghost btn-sm text-[var(--c-text3)] hidden sm:flex">GitHub</a>
//             <Link to="/dashboard" className="btn btn-secondary btn-sm">Go to app</Link>
//           </div>
//         </div>
//       </header>

//       <div className="max-w-6xl mx-auto flex min-h-[calc(100vh-56px)]">
//         {/* Sidebar */}
//         <aside className="hidden md:block w-56 flex-shrink-0 border-r border-[var(--c-border)] bg-[var(--c-surface)] py-5 px-3 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
//           <div className="relative mb-4">
//             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--c-text3)]" />
//             <input className="input input-sm pl-8 text-xs" placeholder="Search docs…" value={q} onChange={e => setQ(e.target.value)} />
//           </div>
//           <nav className="space-y-0.5">
//             <p className="nav-section">Guides</p>
//             {filtered.map(s => (
//               <button key={s.id} onClick={() => setActive(s.id)}
//                 className={`nav-link w-full text-left ${active === s.id ? 'active' : ''}`}>
//                 {s.icon}{s.label}
//               </button>
//             ))}
//           </nav>

//           {active === 'quickstart' && (
//             <div className="mt-6 px-1">
//               <div className="flex items-center gap-2 text-xs text-[var(--c-text3)] bg-[var(--c-surface2)] rounded-lg px-3 py-2.5 mb-3">
//                 <Play className="w-3 h-3 text-[var(--c-blue)]" />
//                 <span>~15 min to complete</span>
//               </div>
//               <div className="space-y-1.5">
//                 {['Deploy UnoAccess','Create OAuth client','Configure env vars','Add login routes','Protect routes','Add login button','Add monitoring'].map((s, i) => (
//                   <div key={i} className="flex items-center gap-2 text-xs text-[var(--c-text3)] px-1">
//                     <span className="w-4.5 h-4.5 rounded-full bg-[var(--c-surface2)] border border-[var(--c-border)] text-[10px] font-bold flex items-center justify-center text-[var(--c-text3)] flex-shrink-0" style={{width:18,height:18}}>{i+1}</span>
//                     {s}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </aside>

//         {/* Content */}
//         <main className="flex-1 min-w-0 py-6 px-4 sm:px-8 md:px-10 overflow-y-auto">
//           <div className="max-w-2xl">
//             <div className="flex items-center gap-1.5 text-xs text-[var(--c-text3)] mb-5">
//               <Book className="w-3 h-3" />
//               <span>Docs</span>
//               <ChevronRight className="w-3 h-3" />
//               <span className="text-[var(--c-text)] font-medium">{cur.label}</span>
//             </div>

//             <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)] mb-1">
//               {cur.id === 'quickstart' ? 'Integration Guide' : (cur as any).title}
//             </h1>
//             <p className="text-[var(--c-text3)] text-sm mb-8">
//               {cur.id === 'quickstart' ? 'Add UnoAccess authentication to your existing app — step by step.' : (cur as any).sub}
//             </p>

//             {cur.id === 'quickstart'
//               ? <QuickStart />
//               : <MD text={(cur as any).body || ''} />}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Book, Code, Zap, Shield, Key, Bell, BarChart3,
  ChevronRight, Copy, Check, Terminal, AlertCircle, Lightbulb,
  ArrowRight, Settings, Globe, Play,
} from 'lucide-react';
import { Logo, Badge } from '../components/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const go = () => {
    navigator.clipboard.writeText(text);
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };
  return (
    <button
      onClick={go}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
    >
      {ok ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

function Block({ code, title }: { code: string; title?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#1e293b] my-4">
      {title && (
        <div className="bg-[#0f172a] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#475569]" />
            <span className="text-xs text-[#475569] font-mono">{title}</span>
          </div>
          <CopyBtn text={code} />
        </div>
      )}
      <div className="bg-[#0f172a] flex">
        <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-[#e2e8f0] flex-1 whitespace-pre">{code}</pre>
        {!title && (
          <div className="p-3 flex-shrink-0">
            <CopyBtn text={code} />
          </div>
        )}
      </div>
    </div>
  );
}

function Note({ type = 'tip', children }: { type?: 'tip' | 'warn' | 'info'; children: React.ReactNode }) {
  const cfg = {
    tip:  { bg: 'bg-green-50',           border: 'border-green-200',            icon: <Lightbulb   className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />, lbl: 'Tip',  lc: 'text-green-700' },
    warn: { bg: 'bg-amber-50',           border: 'border-amber-200',            icon: <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />, lbl: 'Note', lc: 'text-amber-700' },
    info: { bg: 'bg-[var(--c-blue-lt)]', border: 'border-[var(--c-blue-mid)]', icon: <AlertCircle className="w-4 h-4 text-[var(--c-blue)] flex-shrink-0 mt-0.5" />, lbl: 'Info', lc: 'text-[var(--c-blue)]' },
  }[type];
  return (
    <div className={`flex gap-3 p-4 rounded-lg border ${cfg.bg} ${cfg.border} my-4`}>
      {cfg.icon}
      <div>
        <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${cfg.lc}`}>{cfg.lbl}</p>
        <div className="text-sm text-[var(--c-text2)] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function IC({ c }: { c: string }) {
  return <code className="code-inline">{c}</code>;
}

function Step({ n, title, children, last }: {
  n: number; title: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-[var(--c-blue)] text-white text-sm font-bold flex items-center justify-center flex-shrink-0 z-10">
          {n}
        </div>
        {!last && <div className="w-px flex-1 bg-[var(--c-border)] mt-2" style={{ minHeight: 32 }} />}
      </div>
      <div className="flex-1 min-w-0 pt-1 pb-10">
        <h3 className="text-base font-semibold text-[var(--c-text)] mb-3">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stack types
// ─────────────────────────────────────────────────────────────────────────────
const STACKS = ['Vanilla HTML', 'Express.js', 'Next.js', 'Fastify'] as const;
type Stack = typeof STACKS[number];

function StackTabs({ stack, onChange }: { stack: Stack; onChange: (s: Stack) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {STACKS.map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
            stack === s
              ? 'bg-[var(--c-blue)] text-white border-[var(--c-blue)]'
              : 'bg-[var(--c-surface)] text-[var(--c-text2)] border-[var(--c-border2)] hover:border-[var(--c-blue)] hover:text-[var(--c-blue)]'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Verified working server code per stack
// ─────────────────────────────────────────────────────────────────────────────
const SERVER_CODE: Record<Stack, { file: string; code: string }> = {
  'Vanilla HTML': {
    file: 'server.js',
    code: `import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { UnoAccessMonitor } from 'unoaccess-monitor';

const app  = express();
const port = 3001; // change to any free port

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 1. CSP header — must be the first middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' http://localhost:5000;"
    // In production replace http://localhost:5000 with your UnoAccess URL
  );
  next();
});

// 2. Monitoring SDK — replace with your real credentials
const monitor = new UnoAccessMonitor({
  clientId:      'ua_YOUR_CLIENT_ID',
  clientSecret:  'YOUR_CLIENT_SECRET',
  endpoint:      'http://localhost:5000/api/monitoring/logs',
  sampleRate:    1.0,
  batchSize:     5,
  flushInterval: 5000,
  includeIp:     false,
});
app.use(monitor.expressMiddleware());

// 3. Serve your HTML/CSS/JS from public/
app.use(express.static(path.join(__dirname, 'public')));

// 4. OAuth callback route — serves index.html
//    The frontend JS in index.html reads ?code= and exchanges it for tokens
app.get('/callback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log('App running at http://localhost:' + port);
});`,
  },
  'Express.js': {
    file: 'server.js',
    code: `import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import { UnoAccessMonitor } from 'unoaccess-monitor';

const app  = express();
const port = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// 1. Session store
app.use(session({
  secret:            'change-me-to-a-random-string',
  resave:            false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 },
}));

// 2. Monitoring SDK
const monitor = new UnoAccessMonitor({
  clientId:      'ua_YOUR_CLIENT_ID',
  clientSecret:  'YOUR_CLIENT_SECRET',
  endpoint:      'http://localhost:5000/api/monitoring/logs',
  flushInterval: 5000,
});
app.use(monitor.expressMiddleware());

// 3. Auth guard — add to any route you want to protect
function requireAuth(req, res, next) {
  if (!req.session?.user) return res.redirect('/auth/login');
  next();
}

// ── OAuth config ──────────────────────────────────────────────────────────────
const UA_URL           = 'http://localhost:5000';
const UA_CLIENT_ID     = 'ua_YOUR_CLIENT_ID';
const UA_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const UA_REDIRECT_URI  = 'http://localhost:3001/callback';

// Step 1 — redirect user to UnoAccess login
app.get('/auth/login', (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     UA_CLIENT_ID,
    redirect_uri:  UA_REDIRECT_URI,
    scope:         'openid profile email',
    state:         'csrf_' + Math.random().toString(36).slice(2),
    prompt:        'select_account',
  });
  res.redirect(UA_URL + '/oauth/authorize?' + params);
});

// Step 2 — UnoAccess sends user back here with ?code=
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/auth/login');

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(UA_URL + '/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  UA_REDIRECT_URI,
        client_id:     UA_CLIENT_ID,
        client_secret: UA_CLIENT_SECRET,
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('No access token');

    // Fetch user profile
    const userRes = await fetch(UA_URL + '/oauth/userinfo', {
      headers: { Authorization: 'Bearer ' + tokens.access_token },
    });
    const user = await userRes.json();

    req.session.user         = user;
    req.session.access_token = tokens.access_token;
    res.redirect('/dashboard');
  } catch (err) {
    console.error('OAuth error:', err);
    res.redirect('/auth/login?error=callback_failed');
  }
});

// Logout — clear session and UnoAccess cookie
app.post('/auth/logout', async (req, res) => {
  try { await fetch(UA_URL + '/api/auth/logout', { method: 'POST' }); } catch {}
  req.session.destroy(() => res.redirect('/'));
});

// Protected route example
app.get('/dashboard', requireAuth, (req, res) => {
  res.json({ message: 'Hello!', user: req.session.user });
});

// Expose user to your frontend JS
app.get('/api/me', requireAuth, (req, res) => {
  res.json(req.session.user);
});

app.use(express.static(path.join(__dirname, 'public')));
app.listen(port, () => console.log('App running at http://localhost:' + port));`,
  },
  'Next.js': {
    file: 'app/api/auth — 3 route files + middleware',
    code: `// ── app/api/auth/login/route.ts ─────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     process.env.UA_CLIENT_ID!,
    redirect_uri:  process.env.UA_REDIRECT_URI!,
    scope:         'openid profile email',
    state:         'csrf_' + Math.random().toString(36).slice(2),
    prompt:        'select_account',
  });
  return NextResponse.redirect(process.env.UA_URL + '/oauth/authorize?' + params);
}


// ── app/api/auth/callback/route.ts ──────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/api/auth/login', req.url));

  const tokenRes = await fetch(process.env.UA_URL + '/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  process.env.UA_REDIRECT_URI!,
      client_id:     process.env.UA_CLIENT_ID!,
      client_secret: process.env.UA_CLIENT_SECRET!,
    }),
  });
  const tokens = await tokenRes.json();

  const userRes = await fetch(process.env.UA_URL + '/oauth/userinfo', {
    headers: { Authorization: 'Bearer ' + tokens.access_token },
  });
  const user = await userRes.json();

  const cookieStore = cookies();
  cookieStore.set('ua_token', tokens.access_token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   900,
    path:     '/',
  });
  cookieStore.set('ua_user', JSON.stringify(user), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  });

  return NextResponse.redirect(new URL('/dashboard', req.url));
}


// ── app/api/auth/logout/route.ts ─────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  await fetch(process.env.UA_URL + '/api/auth/logout', { method: 'POST' }).catch(() => {});
  const cookieStore = cookies();
  cookieStore.delete('ua_token');
  cookieStore.delete('ua_user');
  return NextResponse.redirect(new URL('/', process.env.UA_REDIRECT_URI!));
}


// ── middleware.ts (root of project) ─────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token      = req.cookies.get('ua_token')?.value;
  const isProtected = req.nextUrl.pathname.startsWith('/dashboard');
  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/api/auth/login', req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*'] };`,
  },
  'Fastify': {
    file: 'server.ts',
    code: `import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyStatic from '@fastify/static';
import { UnoAccessMonitor } from 'unoaccess-monitor';
import path from 'path';
import { fileURLToPath } from 'url';

const app = Fastify({ logger: false });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UA_URL           = 'http://localhost:5000';
const UA_CLIENT_ID     = 'ua_YOUR_CLIENT_ID';
const UA_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const UA_REDIRECT_URI  = 'http://localhost:3001/callback';

await app.register(fastifyCookie);
await app.register(fastifySession, {
  secret: 'change-me-at-least-32-chars-long!!',
  cookie: { secure: false },
});
await app.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
});

// Monitoring SDK
const monitor = new UnoAccessMonitor({
  clientId:      UA_CLIENT_ID,
  clientSecret:  UA_CLIENT_SECRET,
  endpoint:      UA_URL + '/api/monitoring/logs',
  flushInterval: 5000,
});
app.addHook('onRequest', (req, reply, done) => {
  monitor.expressMiddleware()(req.raw, reply.raw, done);
});

// Auth guard
async function requireAuth(req: any, reply: any) {
  if (!req.session.user) reply.redirect('/auth/login');
}

// Login redirect
app.get('/auth/login', (req, reply) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     UA_CLIENT_ID,
    redirect_uri:  UA_REDIRECT_URI,
    scope:         'openid profile email',
    state:         'csrf_' + Math.random().toString(36).slice(2),
    prompt:        'select_account',
  });
  reply.redirect(UA_URL + '/oauth/authorize?' + params);
});

// OAuth callback
app.get<{ Querystring: { code?: string } }>('/callback', async (req, reply) => {
  const { code } = req.query;
  if (!code) return reply.redirect('/auth/login');

  const tokenRes = await fetch(UA_URL + '/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  UA_REDIRECT_URI,
      client_id:     UA_CLIENT_ID,
      client_secret: UA_CLIENT_SECRET,
    }),
  });
  const tokens: any = await tokenRes.json();

  const userRes = await fetch(UA_URL + '/oauth/userinfo', {
    headers: { Authorization: 'Bearer ' + tokens.access_token },
  });
  const user: any = await userRes.json();

  req.session.user = user;
  reply.redirect('/dashboard');
});

app.post('/auth/logout', async (req, reply) => {
  await fetch(UA_URL + '/api/auth/logout', { method: 'POST' }).catch(() => {});
  req.session.destroy();
  reply.redirect('/');
});

app.get('/dashboard', { preHandler: [requireAuth] }, (req: any, reply) => {
  reply.send({ user: req.session.user });
});

app.get('/api/me', { preHandler: [requireAuth] }, (req: any, reply) => {
  reply.send(req.session.user);
});

await app.listen({ port: 3001 });
console.log('App running at http://localhost:3001');`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Verified working HTML frontend per stack
// ─────────────────────────────────────────────────────────────────────────────
const HTML_CODE: Record<Stack, { file: string; code: string }> = {
  'Vanilla HTML': {
    file: 'public/index.html',
    code: `<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
  <!--
    RUM snippet — get the personalised version from
    Dashboard > Your App > Monitoring > RUM tab > "Add to your app"
    Replace ua_YOUR_CLIENT_ID with your real client ID
  -->
  <script>
  (function(w,d,c,e){
    w.__UA_RUM_CLIENT=c;
    w.__UA_RUM_ENDPOINT=e;
    (function(){
      var CI=window.__UA_RUM_CLIENT||'',EP=window.__UA_RUM_ENDPOINT||'';
      if(!CI||!EP)return;
      var SID=sessionStorage.getItem('__ua_sid')||(function(){
        var id=Math.random().toString(36).slice(2)+Date.now().toString(36);
        sessionStorage.setItem('__ua_sid',id);return id;
      })();
      var vitals={},sent=false;
      var W=window.screen.width,dt=W<768?'mobile':W<1024?'tablet':'desktop';
      var conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
      var ct=conn?(conn.effectiveType||conn.type||'unknown'):'unknown';
      var sp=location.pathname.slice(0,500);
      function send(){if(sent)return;sent=true;try{var p=JSON.stringify({clientId:CI,sessionId:SID,url:sp,deviceType:dt,connectionType:ct,vitals:vitals});if(navigator.sendBeacon){navigator.sendBeacon(EP,new Blob([p],{type:'application/json'}));}else{fetch(EP,{method:'POST',headers:{'Content-Type':'application/json'},body:p,keepalive:true});}}catch(e){}}
      function obs(t,cb){try{if(!PerformanceObserver.supportedEntryTypes.includes(t))return;new PerformanceObserver(function(l){l.getEntries().forEach(cb);}).observe({type:t,buffered:true});}catch(e){}}
      obs('largest-contentful-paint',function(e){vitals.lcp=Math.round(e.startTime);});
      var cls=0;obs('layout-shift',function(e){if(!e.hadRecentInput){cls+=e.value;vitals.cls=Math.round(cls*10000)/10000;}});
      var inp=0;obs('event',function(e){if(e.processingStart&&e.startTime){var d=e.processingStart-e.startTime+(e.duration||0);if(d>inp){inp=d;vitals.inp=Math.round(inp);}}});
      obs('paint',function(e){if(e.name==='first-contentful-paint')vitals.fcp=Math.round(e.startTime);});
      try{var n=performance.getEntriesByType('navigation')[0];if(n)vitals.ttfb=Math.round(n.responseStart-n.requestStart);}catch(e){}
      document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')send();});
      window.addEventListener('pagehide',send);setTimeout(send,5000);
    })();
  })(window,document,'ua_YOUR_CLIENT_ID','http://localhost:5000/api/monitoring/rum');
  </script>
</head>
<body>
  <h1>My App</h1>

  <div id="login-section">
    <button onclick="login()">Login with UnoAccess</button>
  </div>

  <div id="user-section" style="display:none;">
    <button onclick="logout()">Logout</button>
    <pre id="result"></pre>
  </div>

  <script>
    const CLIENT_ID     = 'ua_YOUR_CLIENT_ID';              // from My App page
    const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';              // from My App page
    const REDIRECT_URI  = 'http://localhost:3001/callback';  // must match exactly
    const UA_URL        = 'http://localhost:5000';            // your UnoAccess URL

    // On page load: restore session or handle OAuth callback
    const storedTokens = localStorage.getItem('ua_tokens');
    const storedUser   = localStorage.getItem('ua_user');

    if (storedTokens && storedUser) {
      showUser(JSON.parse(storedTokens), JSON.parse(storedUser));
    } else {
      const params     = new URLSearchParams(location.search);
      const code       = params.get('code');
      const state      = params.get('state');
      const savedState = sessionStorage.getItem('ua_state');

      if (code && state && state === savedState) {
        window.history.replaceState({}, document.title, '/');
        exchangeCode(code);
      }
    }

    function login() {
      const state = Math.random().toString(36).slice(2);
      sessionStorage.setItem('ua_state', state);
      window.location.href = UA_URL + '/oauth/authorize?' + new URLSearchParams({
        response_type: 'code',
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        scope:         'openid profile email',
        state,
        prompt:        'select_account',
      });
    }

    function exchangeCode(code) {
      document.getElementById('result').textContent = 'Signing you in...';

      fetch(UA_URL + '/oauth/token', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: new URLSearchParams({
          grant_type:    'authorization_code',
          code,
          redirect_uri:  REDIRECT_URI,
          client_id:     CLIENT_ID,
          client_secret: CLIENT_SECRET,
        }),
      })
      .then(r => {
        if (!r.ok) return r.json().then(e => { throw new Error(e.error_description || 'Token exchange failed'); });
        return r.json();
      })
      .then(tokens => {
        localStorage.setItem('ua_tokens', JSON.stringify(tokens));
        return fetch(UA_URL + '/oauth/userinfo', {
          headers:     { Authorization: 'Bearer ' + tokens.access_token },
          credentials: 'include',
        })
        .then(r => r.json())
        .then(user => {
          localStorage.setItem('ua_user', JSON.stringify(user));
          showUser(tokens, user);
        });
      })
      .catch(err => {
        document.getElementById('result').textContent = 'Error: ' + err.message;
      });
    }

    function showUser(tokens, user) {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('user-section').style.display  = 'block';
      document.getElementById('result').textContent =
        'Tokens:\\n' + JSON.stringify(tokens, null, 2) +
        '\\n\\nUser Info:\\n' + JSON.stringify(user, null, 2);
    }

    function logout() {
      fetch(UA_URL + '/api/auth/logout', { method: 'POST', credentials: 'include' })
        .finally(() => {
          localStorage.removeItem('ua_tokens');
          localStorage.removeItem('ua_user');
          document.getElementById('login-section').style.display = 'block';
          document.getElementById('user-section').style.display  = 'none';
          document.getElementById('result').textContent = '';
        });
    }
  </script>
</body>
</html>`,
  },
  'Express.js': {
    file: 'public/index.html',
    code: `<!DOCTYPE html>
<html>
<head><title>My App</title></head>
<body>
  <h1>My App</h1>

  <div id="login-section">
    <a href="/auth/login"><button>Login with UnoAccess</button></a>
  </div>

  <div id="user-section" style="display:none;">
    <form action="/auth/logout" method="POST" style="display:inline;">
      <button type="submit">Logout</button>
    </form>
    <pre id="result"></pre>
  </div>

  <script>
    // Check if user is already logged in via the server session
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (!user) return;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('user-section').style.display  = 'block';
        document.getElementById('result').textContent = JSON.stringify(user, null, 2);
      });
  </script>
</body>
</html>`,
  },
  'Next.js': {
    file: 'app/dashboard/page.tsx',
    code: `// app/dashboard/page.tsx — server component
import { cookies } from 'next/headers';
import { redirect }  from 'next/navigation';

export default function DashboardPage() {
  const cookieStore = cookies();
  const userCookie  = cookieStore.get('ua_user')?.value;

  // Middleware handles this redirect, but double-check here too
  if (!userCookie) redirect('/api/auth/login');

  const user = JSON.parse(userCookie);

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>

      <form action="/api/auth/logout" method="POST">
        <button type="submit">Logout</button>
      </form>

      <pre style={{ fontSize: 12 }}>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}`,
  },
  'Fastify': {
    file: 'public/index.html',
    code: `<!DOCTYPE html>
<html>
<head><title>My App (Fastify)</title></head>
<body>
  <h1>My App</h1>

  <div id="login-section">
    <a href="/auth/login"><button>Login with UnoAccess</button></a>
  </div>

  <div id="user-section" style="display:none;">
    <form action="/auth/logout" method="POST" style="display:inline;">
      <button type="submit">Logout</button>
    </form>
    <pre id="result"></pre>
  </div>

  <script>
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(user => {
        if (!user) return;
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('user-section').style.display  = 'block';
        document.getElementById('result').textContent = JSON.stringify(user, null, 2);
      });
  </script>
</body>
</html>`,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Env files per stack
// ─────────────────────────────────────────────────────────────────────────────
const ENV_CODE: Record<Stack, string> = {
  'Vanilla HTML': `# No .env needed for Vanilla HTML
# Credentials go directly in index.html (development only)
# For production use Express.js or Next.js so secrets stay on the server`,

  'Express.js': `# your-app/.env
UA_URL=http://localhost:5000
UA_CLIENT_ID=ua_YOUR_CLIENT_ID
UA_CLIENT_SECRET=YOUR_CLIENT_SECRET
UA_REDIRECT_URI=http://localhost:3001/callback

SESSION_SECRET=change-me-to-a-long-random-string`,

  'Next.js': `# your-app/.env.local
UA_URL=http://localhost:5000
UA_CLIENT_ID=ua_YOUR_CLIENT_ID
UA_CLIENT_SECRET=YOUR_CLIENT_SECRET
UA_REDIRECT_URI=http://localhost:3000/api/auth/callback`,

  'Fastify': `# your-app/.env
UA_URL=http://localhost:5000
UA_CLIENT_ID=ua_YOUR_CLIENT_ID
UA_CLIENT_SECRET=YOUR_CLIENT_SECRET
UA_REDIRECT_URI=http://localhost:3001/callback

SESSION_SECRET=change-me-to-a-long-random-string`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Quick Start page
// ─────────────────────────────────────────────────────────────────────────────
function QuickStart() {
  const [stack, setStack] = useState<Stack>('Vanilla HTML');

  return (
    <div>
      {/* Intro */}
      <div className="flex items-center gap-3 p-4 bg-[var(--c-blue-lt)] border border-[var(--c-blue-mid)] rounded-lg mb-8">
        <Shield className="w-5 h-5 text-[var(--c-blue)] flex-shrink-0" />
        <p className="text-sm text-[var(--c-blue)]">
          All code here is <strong>tested and verified</strong> to work with UnoAccess.
          Pick your framework and follow each step. Estimated time: <strong>~15 minutes</strong>.
        </p>
      </div>

      {/* Step 1 */}
      <Step n={1} title="Start UnoAccess">
        <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-3">
          If you already have UnoAccess running, skip to Step 2.
        </p>
        <Block title="terminal" code={`git clone https://github.com/your-org/unoaccess
cd unoaccess

cd back  && npm install && cd ..
cd front && npm install && cd ..

cp back/.env.example  back/.env
cp front/.env.example front/.env`} />
        <Block title="terminal — 2 separate windows" code={`# Window 1 — backend
cd back && npm run dev    # http://localhost:5000

# Window 2 — frontend
cd front && npm run dev   # http://localhost:5173`} />
        <Note type="warn">
          Fill in <IC c="MONGODB_URI" />, <IC c="JWT_ACCESS_SECRET" />,{' '}
          <IC c="JWT_REFRESH_SECRET" />, and <IC c="ENCRYPTION_KEY" /> in{' '}
          <IC c="back/.env" /> before starting. All four are required.
        </Note>
      </Step>

      {/* Step 2 */}
      <Step n={2} title="Register your OAuth client">
        <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-3">
          Two ways to get a client — pick the one that matches your situation:
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="card card-p">
            <p className="text-xs font-semibold text-[var(--c-text)] mb-1">Regular user</p>
            <p className="text-xs text-[var(--c-text3)] leading-relaxed">
              Go to <IC c="/account/app" /> → Register app.<br />
              1 app per account, no admin needed.
            </p>
          </div>
          <div className="card card-p">
            <p className="text-xs font-semibold text-[var(--c-text)] mb-1">Admin</p>
            <p className="text-xs text-[var(--c-text3)] leading-relaxed">
              Go to Admin Panel → OAuth Clients → Create Client.<br />
              Unlimited apps, full control.
            </p>
          </div>
        </div>

        <p className="text-sm text-[var(--c-text2)] mb-3">Use these exact values when registering:</p>
        <div className="rounded-lg border border-[var(--c-border)] overflow-hidden mb-4">
          {[
            { f: 'Name',         v: 'My Test App' },
            { f: 'Redirect URI', v: 'http://localhost:PORT/callback', note: 'replace PORT with your app port' },
            { f: 'Scopes',       v: 'openid profile email' },
          ].map((r, i, arr) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-[var(--c-border)]' : ''}`}>
              <span className="text-xs font-medium text-[var(--c-text3)] w-24 flex-shrink-0">{r.f}</span>
              <code className="text-sm font-mono text-[var(--c-text)]">{r.v}</code>
              {r.note && <span className="text-xs text-[var(--c-text3)] ml-auto italic">{r.note}</span>}
            </div>
          ))}
        </div>
        <Note type="warn">
          The <strong>client secret is displayed only once</strong> when created.
          Copy it immediately. If you lose it, delete the app and create a new one.
        </Note>
      </Step>

      {/* Step 3 */}
      <Step n={3} title="Add credentials to your app's .env file">
        <StackTabs stack={stack} onChange={setStack} />
        <Block title=".env" code={ENV_CODE[stack]} />
        <Note type="tip">
          Add <IC c=".env" /> to your <IC c=".gitignore" /> now — never commit secrets to Git.
        </Note>
      </Step>

      {/* Step 4 */}
      <Step n={4} title="Set up your server with login, callback, and logout routes">
        <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-4">
          Copy the complete, working server file below. It includes the login redirect,
          OAuth callback, logout, and monitoring SDK already configured.
        </p>
        <StackTabs stack={stack} onChange={setStack} />

        {stack === 'Vanilla HTML' && (
          <Note type="info">
            <strong>Vanilla HTML</strong> — the token exchange happens in the browser (index.html).
            The server only needs to serve your files and handle the <IC c="/callback" /> route.
            This is fine for learning and demos. For production, use Express.js or Next.js
            so your client secret stays on the server.
          </Note>
        )}

        <div className="rounded-xl overflow-hidden border border-[#1e293b] mt-3">
          <div className="bg-[#0f172a] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#475569]" />
              <span className="text-xs text-[#475569] font-mono">{SERVER_CODE[stack].file}</span>
              <Badge variant="gray" className="ml-1 !text-[10px]">{stack}</Badge>
            </div>
            <CopyBtn text={SERVER_CODE[stack].code} />
          </div>
          <pre className="bg-[#0f172a] p-5 overflow-x-auto text-xs font-mono leading-relaxed text-[#e2e8f0] whitespace-pre">
            {SERVER_CODE[stack].code}
          </pre>
        </div>

        <Note type="warn">
          Replace <IC c="ua_YOUR_CLIENT_ID" /> and <IC c="YOUR_CLIENT_SECRET" /> with your real
          values from Step 2. The redirect URI must match the registered value <strong>exactly</strong> —
          including the port number and the <IC c="/callback" /> path.
        </Note>
      </Step>

      {/* Step 5 */}
      <Step n={5} title="Create your frontend page with the login button">
        <StackTabs stack={stack} onChange={setStack} />
        <div className="rounded-xl overflow-hidden border border-[#1e293b] mt-3">
          <div className="bg-[#0f172a] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#475569]" />
              <span className="text-xs text-[#475569] font-mono">{HTML_CODE[stack].file}</span>
            </div>
            <CopyBtn text={HTML_CODE[stack].code} />
          </div>
          <pre className="bg-[#0f172a] p-5 overflow-x-auto text-xs font-mono leading-relaxed text-[#e2e8f0] whitespace-pre">
            {HTML_CODE[stack].code}
          </pre>
        </div>
      </Step>

      {/* Step 6 */}
      <Step n={6} title="Test the full login flow end to end">
        <div className="space-y-2 mb-4">
          {[
            'Open your app — you should see "Login with UnoAccess" button',
            'Click login — redirected to UnoAccess account chooser',
            'Select your account, enter password — redirected back to your app',
            'Tokens received, user profile displayed on page',
            'Click logout — session cleared, back to login screen',
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-[var(--c-surface2)] rounded-lg">
              <span className="w-5 h-5 rounded-full bg-[var(--c-blue)] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-[var(--c-text2)]">{t}</p>
            </div>
          ))}
        </div>
        <Note type="warn">
          <strong>Common errors and fixes:</strong><br />
          • <IC c="redirect_uri_mismatch" /> — the URI in your request doesn't match what's registered. Check port and path match exactly.<br />
          • <IC c="Invalid client credentials" /> — wrong clientId or secret. Re-copy from My App page.<br />
          • <IC c="Cannot GET /callback" /> — you're missing the /callback route. Add it to your server (Step 4).<br />
          • State mismatch / CSRF error — clear sessionStorage and try again. Make sure state is saved before redirect.
        </Note>
      </Step>

      {/* Step 7 */}
      <Step n={7} title="(Optional) Add RUM to measure browser performance" last>
        <p className="text-sm text-[var(--c-text2)] leading-relaxed mb-3">
          Get your personalised snippet from{' '}
          <strong>Monitoring dashboard → RUM tab → "Add to your app"</strong>.
          Paste it in <IC c="{'<'}head{'>'}" /> of your HTML.
        </p>
        <Block title="public/index.html — paste inside <head>" code={`<script>
(function(w,d,c,e){
  w.__UA_RUM_CLIENT=c;
  w.__UA_RUM_ENDPOINT=e;
  /* Full snippet copied from Dashboard > Your App > RUM > Add to your app */
})(window,document,'ua_YOUR_CLIENT_ID','http://localhost:5000/api/monitoring/rum');
</script>`} />
        <Note type="tip">
          After adding the snippet, browse your app for 5 seconds. LCP, CLS, INP, FCP and TTFB
          vitals appear automatically in the RUM dashboard.
        </Note>
      </Step>

      {/* Done */}
      <div className="flex gap-5">
        <div className="w-8 h-8 rounded-full bg-[var(--c-green)] text-white flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <div className="flex-1 pt-1">
          <h3 className="text-base font-semibold text-[var(--c-text)] mb-4">Integration complete!</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: <Globe     className="w-4 h-4" />, label: 'Open your dashboard',  href: '/dashboard' },
              { icon: <Settings  className="w-4 h-4" />, label: 'Manage OAuth clients', href: '/admin' },
              { icon: <BarChart3 className="w-4 h-4" />, label: 'View monitoring',       href: '/dashboard' },
              { icon: <Bell      className="w-4 h-4" />, label: 'Set up alert rules',    href: '/alerts' },
            ].map(a => (
              <Link key={a.label} to={a.href}
                className="flex items-center gap-2.5 px-4 py-3 card hover:shadow-md transition-shadow text-sm text-[var(--c-text2)] hover:text-[var(--c-blue)] group">
                <span className="text-[var(--c-text3)] group-hover:text-[var(--c-blue)] transition-colors">{a.icon}</span>
                {a.label}
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown renderer for other sections
// ─────────────────────────────────────────────────────────────────────────────
function MD({ text }: { text: string }) {
  const lines = text.trim().split('\n');
  const out: React.ReactNode[] = [];
  let i = 0, cLines: string[] | null = null, ck = 0;
  const inl = (s: string) =>
    s.replace(/`([^`]+)`/g, '<code class="code-inline">$1</code>');

  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('```')) {
      if (!cLines) cLines = [];
      else {
        out.push(<pre key={'c' + ck++} className="code-block text-xs my-4 overflow-x-auto whitespace-pre">{cLines.join('\n')}</pre>);
        cLines = null;
      }
    } else if (cLines !== null) {
      cLines.push(l);
    } else if (l.startsWith('## ')) {
      out.push(<h2 key={i} className="text-base font-semibold text-[var(--c-text)] mt-7 mb-2 pt-5 border-t border-[var(--c-border)]">{l.slice(3)}</h2>);
    } else if (l.startsWith('### ')) {
      out.push(<h3 key={i} className="text-sm font-semibold text-[var(--c-text)] mt-5 mb-2">{l.slice(4)}</h3>);
    } else if (l.startsWith('| ')) {
      const rows: string[][] = []; let j = i;
      while (j < lines.length && lines[j].startsWith('|')) {
        if (!lines[j].includes('---')) rows.push(lines[j].split('|').slice(1,-1).map(c=>c.trim()));
        j++;
      }
      if (rows.length > 0) out.push(
        <div key={i} className="table-wrap my-4"><table className="table">
          <thead><tr>{rows[0].map((h,hi)=><th key={hi}>{h}</th>)}</tr></thead>
          <tbody>{rows.slice(1).map((r,ri)=><tr key={ri}>{r.map((c,ci)=><td key={ci} dangerouslySetInnerHTML={{__html:inl(c)}}/>)}</tr>)}</tbody>
        </table></div>
      );
      i = j - 1;
    } else if (l.startsWith('- ')) {
      out.push(<li key={i} className="text-sm text-[var(--c-text2)] ml-5 mb-1.5 list-disc" dangerouslySetInnerHTML={{__html:inl(l.slice(2))}} />);
    } else if (l.trim()) {
      out.push(<p key={i} className="text-sm text-[var(--c-text2)] mb-3 leading-relaxed" dangerouslySetInnerHTML={{__html:inl(l)}} />);
    }
    i++;
  }
  return <>{out}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'quickstart', label: 'Quick Start',      icon: <Zap       className="w-4 h-4" />, custom: true },
  { id: 'sdk',        label: 'Monitoring SDK',   icon: <BarChart3 className="w-4 h-4" />, title: 'Monitoring SDK',        sub: 'Drop-in Node.js performance tracking.',
    body: `\n## Install\n\n\`\`\`bash\nnpm install unoaccess-monitor\n\`\`\`\n\n## Initialize\n\n\`\`\`typescript\nimport { UnoAccessMonitor } from 'unoaccess-monitor';\n\nconst monitor = new UnoAccessMonitor({\n  clientId:      'ua_YOUR_CLIENT_ID',\n  clientSecret:  'YOUR_CLIENT_SECRET',\n  endpoint:      'http://localhost:5000/api/monitoring/logs',\n  sampleRate:    1.0,\n  batchSize:     5,\n  flushInterval: 5000,\n  includeIp:     false,\n});\n\`\`\`\n\n## Auto-track all routes\n\n\`\`\`typescript\napp.use(monitor.expressMiddleware());\n\`\`\`\n\n## Custom events\n\n\`\`\`typescript\nmonitor.trace('db.query', {\n  service: 'postgres',\n  table:   'users',\n  value:   42, // ms\n});\n\`\`\`\n\n## Capture errors\n\n\`\`\`typescript\ntry {\n  await riskyOperation();\n} catch (err) {\n  monitor.captureError(err, {\n    service: 'payment',\n    userId:  req.session?.user?.sub,\n  });\n  throw err;\n}\n\`\`\`` },
  { id: 'oauth',      label: 'OAuth 2.0 / OIDC', icon: <Shield    className="w-4 h-4" />, title: 'OAuth 2.0 / OIDC',      sub: 'Complete authorization flow reference.',
    body: `\n## 1. Redirect to UnoAccess\n\n\`\`\`\nGET http://localhost:5000/oauth/authorize\n  ?response_type=code\n  &client_id=ua_YOUR_CLIENT_ID\n  &redirect_uri=http://localhost:3001/callback\n  &scope=openid profile email\n  &state=random_csrf_token\n  &prompt=select_account\n\`\`\`\n\n## 2. Exchange code for tokens\n\n\`\`\`bash\nPOST http://localhost:5000/oauth/token\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code\n&code=AUTH_CODE\n&redirect_uri=http://localhost:3001/callback\n&client_id=ua_YOUR_CLIENT_ID\n&client_secret=YOUR_CLIENT_SECRET\n\`\`\`\n\n## 3. Fetch user profile\n\n\`\`\`bash\nGET http://localhost:5000/oauth/userinfo\nAuthorization: Bearer ACCESS_TOKEN\n\`\`\`\n\n## Refresh expired token\n\n\`\`\`bash\nPOST http://localhost:5000/oauth/token\ngrant_type=refresh_token\n&refresh_token=REFRESH_TOKEN\n&client_id=ua_YOUR_CLIENT_ID\n&client_secret=YOUR_CLIENT_SECRET\n\`\`\`\n\n## Logout\n\n\`\`\`bash\nPOST http://localhost:5000/api/auth/logout\n# Send with credentials: include to clear the UnoAccess session cookie\n\`\`\`` },
  { id: 'api-keys',   label: 'API Keys',          icon: <Key       className="w-4 h-4" />, title: 'Personal Access Tokens', sub: 'Auth without user sessions.',
    body: `\n## Create a key\n\nGo to **Account → API Keys → Create key**. The key is shown once — store it immediately.\n\n## Use it\n\n\`\`\`bash\ncurl http://localhost:5000/api/user/profile \\\\\n  -H "Authorization: Bearer ua_your_key_here"\n\`\`\`\n\n## Revoke\n\nGo to **Account → API Keys** and click **Revoke**. Immediate.\n\n## Security\n\n- Stored as SHA-256 hashes — cannot be recovered if lost\n- Set expiry dates for CI/CD keys\n- Revoke unused keys regularly` },
  { id: 'alerts',     label: 'Alerts',            icon: <Bell      className="w-4 h-4" />, title: 'Real-time Alerts',      sub: 'Get notified when metrics cross thresholds.',
    body: `\n## Supported metrics\n\n| Metric | Description |\n|--------|-------------|\n| \`error_rate\` | % requests with status >= 400 |\n| \`response_time_p95\` | 95th percentile response time (ms) |\n| \`response_time_avg\` | Average response time (ms) |\n| \`request_count\` | Total requests in window |\n\n## Notification channels\n\n- **Email** — sent to your account email\n- **Webhook** — POST to any URL\n\n## Webhook payload\n\n\`\`\`json\n{\n  "type": "alert.triggered",\n  "ruleName": "High error rate",\n  "metric": "error_rate",\n  "threshold": 5,\n  "actualValue": 8.3,\n  "condition": "greater_than",\n  "timestamp": "2024-01-15T10:30:00.000Z"\n}\n\`\`\`` },
  { id: 'api-ref',    label: 'API Reference',     icon: <Code      className="w-4 h-4" />, title: 'API Reference',         sub: 'All endpoints.',
    body: `\n## Auth\n\n| Method | Path | Description |\n|--------|------|-------------|\n| POST | \`/api/auth/register\` | Create account |\n| POST | \`/api/auth/login\` | Login |\n| POST | \`/api/auth/logout\` | Logout |\n| POST | \`/api/auth/refresh\` | Refresh token |\n\n## OAuth\n\n| Method | Path | Description |\n|--------|------|-------------|\n| GET | \`/oauth/authorize\` | Start auth flow |\n| POST | \`/oauth/token\` | Exchange code or refresh |\n| GET | \`/oauth/userinfo\` | Get user profile |\n\n## User\n\n| Method | Path | Description |\n|--------|------|-------------|\n| GET | \`/api/user/profile\` | Get current user |\n| GET | \`/api/user/sessions\` | List sessions |\n| GET | \`/api/user/api-keys\` | List API keys |\n| POST | \`/api/user/api-keys\` | Create API key |\n| DELETE | \`/api/user/api-keys/:id\` | Revoke key |\n| GET | \`/api/user/audit-log/export\` | Export logs |\n\n## Monitoring\n\n| Method | Path | Description |\n|--------|------|-------------|\n| POST | \`/api/monitoring/logs\` | Ingest logs (SDK) |\n| POST | \`/api/monitoring/events\` | Custom events |\n| POST | \`/api/monitoring/errors\` | Capture errors |\n| POST | \`/api/monitoring/rum\` | Browser vitals |\n| GET | \`/api/monitoring/:id/stats\` | App stats |\n| GET | \`/api/monitoring/:id/rum\` | RUM stats |` },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function DocsPage() {
  const [active, setActive] = useState('quickstart');
  const [q, setQ] = useState('');

  const filtered = SECTIONS.filter(s => s.label.toLowerCase().includes(q.toLowerCase()));
  const cur = SECTIONS.find(s => s.id === active) || SECTIONS[0];

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      <header className="bg-[var(--c-surface)] border-b border-[var(--c-border)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><Logo size="sm" /></Link>
            <span className="text-[var(--c-border2)]">|</span>
            <span className="text-sm font-medium text-[var(--c-text2)]">Documentation</span>
          </div>
          <Link to="/dashboard" className="btn btn-secondary btn-sm">Go to app</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex min-h-[calc(100vh-56px)]">
        <aside className="hidden md:block w-56 flex-shrink-0 border-r border-[var(--c-border)] bg-[var(--c-surface)] py-5 px-3 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--c-text3)]" />
            <input className="input input-sm pl-8 text-xs" placeholder="Search docs..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <nav className="space-y-0.5">
            <p className="nav-section">Guides</p>
            {filtered.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={'nav-link w-full text-left ' + (active === s.id ? 'active' : '')}>
                {s.icon}{s.label}
              </button>
            ))}
          </nav>
          {active === 'quickstart' && (
            <div className="mt-6 px-1">
              <div className="flex items-center gap-2 text-xs text-[var(--c-text3)] bg-[var(--c-surface2)] rounded-lg px-3 py-2.5 mb-3">
                <Play className="w-3 h-3 text-[var(--c-blue)]" />
                <span>~15 min to complete</span>
              </div>
              <div className="space-y-2">
                {['Start UnoAccess','Register OAuth client','Configure env vars','Add server routes','Create frontend','Test login flow','Add RUM snippet'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[var(--c-text3)] px-1">
                    <span className="rounded-full bg-[var(--c-surface2)] border border-[var(--c-border)] text-[10px] font-bold flex items-center justify-center text-[var(--c-text3)] flex-shrink-0" style={{width:18,height:18}}>{i+1}</span>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 py-6 px-4 sm:px-8 md:px-10 overflow-y-auto">
          <div className="max-w-2xl">
            <div className="flex items-center gap-1.5 text-xs text-[var(--c-text3)] mb-5">
              <Book className="w-3 h-3" />
              <span>Docs</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[var(--c-text)] font-medium">{cur.label}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)] mb-1">
              {cur.id === 'quickstart' ? 'Integration Guide' : (cur as any).title}
            </h1>
            <p className="text-[var(--c-text3)] text-sm mb-8">
              {cur.id === 'quickstart'
                ? 'Add UnoAccess login to your app — verified, working code for every stack.'
                : (cur as any).sub}
            </p>
            {cur.id === 'quickstart' ? <QuickStart /> : <MD text={(cur as any).body || ''} />}
          </div>
        </main>
      </div>
    </div>
  );
}