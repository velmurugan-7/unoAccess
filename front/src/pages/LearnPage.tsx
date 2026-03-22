import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, BookOpen, Shield, Lock, Zap, Bell, Globe, ChevronRight,
  ChevronDown, CheckCircle, XCircle, Clock, Star, ArrowLeft, BarChart3,
  RefreshCw, Key, Wifi, AlertTriangle, Award,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface Article {
  id: string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readTime: number; // minutes
  summary: string;
  content: ArticleSection[];
  keyTakeaway: string;
  quiz?: QuizQuestion[];
  related?: string[]; // article ids
}

interface ArticleSection {
  type: 'text' | 'diagram' | 'code' | 'tip' | 'warning' | 'list' | 'compare';
  heading?: string;
  body?: string;
  items?: string[];
  language?: string;
  diagram?: DiagramDef;
}

interface DiagramDef {
  type: 'flow' | 'compare' | 'layers';
  data: Record<string, unknown>;
}

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES: Category[] = [
  { id: 'auth', label: 'Authentication Fundamentals', icon: <Key className="w-5 h-5" />, color: '#2563eb', description: 'SSO, OAuth, JWT, tokens and how they work together' },
  { id: 'security', label: 'Security Concepts', icon: <Shield className="w-5 h-5" />, color: '#7c3aed', description: '2FA, sessions, CSRF, encryption and attack prevention' },
  { id: 'unoaccess', label: 'UnoAccess Specific', icon: <Lock className="w-5 h-5" />, color: '#0891b2', description: 'Everything about using and integrating UnoAccess' },
  { id: 'monitoring', label: 'Performance Monitoring', icon: <BarChart3 className="w-5 h-5" />, color: '#16a34a', description: 'SDK, latency, error rates, SLOs and service maps' },
  { id: 'alerts', label: 'Alerts & Reliability', icon: <Bell className="w-5 h-5" />, color: '#d97706', description: 'Alert rules, uptime, incidents and reliability engineering' },
  { id: 'web', label: 'Web & API Concepts', icon: <Globe className="w-5 h-5" />, color: '#dc2626', description: 'REST, webhooks, CORS, cookies and HTTP fundamentals' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Articles data
// ─────────────────────────────────────────────────────────────────────────────
const ARTICLES: Article[] = [
  // ── Authentication Fundamentals ──────────────────────────────────────────
  {
    id: 'what-is-sso',
    title: 'What is SSO (Single Sign-On)?',
    category: 'auth',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'SSO lets users log in once and access multiple apps without re-entering credentials.',
    keyTakeaway: 'SSO = one login, many apps. The identity provider authenticates once; all connected apps trust that authentication.',
    related: ['oauth-vs-sso', 'what-is-oauth', 'what-is-unoaccess'],
    content: [
      {
        type: 'text',
        heading: 'The problem SSO solves',
        body: 'Imagine having 10 work apps — email, project management, CRM, HR portal. Without SSO you need 10 usernames and 10 passwords. You forget some, reuse others (dangerous), and spend minutes every day just logging in.',
      },
      {
        type: 'diagram',
        diagram: {
          type: 'flow',
          data: {
            steps: [
              { label: 'User visits App A', icon: '👤' },
              { label: 'Redirected to Identity Provider', icon: '🔐' },
              { label: 'User logs in once', icon: '✅' },
              { label: 'Token issued', icon: '🎟️' },
              { label: 'App A, B, C all accept token', icon: '🚀' },
            ],
          },
        },
      },
      {
        type: 'text',
        heading: 'How it works',
        body: 'SSO uses a central Identity Provider (IdP) — like UnoAccess — that all your apps trust. When a user visits any connected app, they are redirected to the IdP. If already logged in, the IdP issues a token immediately. If not, they log in once. The token travels back to the app, which validates it and lets the user in.',
      },
      {
        type: 'list',
        heading: 'Benefits of SSO',
        items: [
          'One password to remember — reduces password fatigue',
          'IT can revoke access to all apps in one click',
          'Centralized audit log of who accessed what and when',
          'Enables stronger security — easier to enforce 2FA in one place',
          'Better user experience — login once, work everywhere',
        ],
      },
      { type: 'tip', body: 'SSO is not just for enterprises. Any product with multiple apps or a developer platform benefits from it.' },
    ],
    quiz: [
      {
        question: 'What does SSO stand for?',
        options: ['Secure Session Object', 'Single Sign-On', 'Server Side OAuth', 'Simple Secure Operation'],
        correct: 1,
        explanation: 'SSO stands for Single Sign-On — one login that gives access to multiple applications.',
      },
      {
        question: 'In an SSO system, who authenticates the user?',
        options: ['Each individual app', 'The browser', 'The Identity Provider (IdP)', 'The database'],
        correct: 2,
        explanation: 'The Identity Provider (IdP) — like UnoAccess — is the central authority that authenticates the user. All apps trust the IdP.',
      },
    ],
  },
  {
    id: 'what-is-oauth',
    title: 'What is OAuth 2.0?',
    category: 'auth',
    difficulty: 'Beginner',
    readTime: 4,
    summary: 'OAuth 2.0 is an authorization framework that lets apps access resources on behalf of users without sharing passwords.',
    keyTakeaway: 'OAuth 2.0 is about authorization (what can this app access?), not authentication (who is this person?).',
    related: ['what-is-oidc', 'oauth-vs-sso', 'what-is-jwt'],
    content: [
      {
        type: 'text',
        heading: 'The real-world analogy',
        body: 'Think of OAuth like a hotel key card. The hotel (Authorization Server) gives you a key card (access token) that opens specific doors (resources). You never give the master key (your password) to a visitor — you give them a limited key card that only opens what they need.',
      },
      {
        type: 'diagram',
        diagram: {
          type: 'flow',
          data: {
            steps: [
              { label: 'App requests access', icon: '📱' },
              { label: 'User sees permission screen', icon: '👁️' },
              { label: 'User approves', icon: '✅' },
              { label: 'Authorization code issued', icon: '📋' },
              { label: 'App exchanges code for token', icon: '🔄' },
              { label: 'App uses token to access resources', icon: '🔓' },
            ],
          },
        },
      },
      {
        type: 'list',
        heading: 'Key OAuth 2.0 terms',
        items: [
          'Resource Owner — the user who owns the data',
          'Client — the app requesting access',
          'Authorization Server — issues tokens (UnoAccess is this)',
          'Resource Server — the API that has the user\'s data',
          'Access Token — short-lived credential to access resources',
          'Scope — what permissions the token has (e.g. read:profile)',
        ],
      },
      { type: 'warning', body: 'OAuth 2.0 alone does NOT tell you who the user is. For that you need OpenID Connect (OIDC) on top of OAuth.' },
    ],
    quiz: [
      {
        question: 'OAuth 2.0 is primarily about:',
        options: ['Authentication — proving who you are', 'Authorization — granting access to resources', 'Encryption — securing data in transit', 'Hashing — storing passwords safely'],
        correct: 1,
        explanation: 'OAuth 2.0 is an authorization framework. It controls what an app can access, not who the user is.',
      },
    ],
  },
  {
    id: 'what-is-oidc',
    title: 'What is OpenID Connect (OIDC)?',
    category: 'auth',
    difficulty: 'Intermediate',
    readTime: 3,
    summary: 'OIDC is an identity layer on top of OAuth 2.0 that lets apps verify who the user is.',
    keyTakeaway: 'OIDC = OAuth 2.0 + identity. It adds an ID Token (JWT) that tells you WHO the user is, not just what they can access.',
    related: ['what-is-oauth', 'what-is-jwt', 'oauth-vs-sso'],
    content: [
      {
        type: 'text',
        heading: 'Why OIDC was needed',
        body: 'OAuth 2.0 lets apps access resources but doesn\'t tell the app who the user is. Developers kept building their own identity layers on top of OAuth in incompatible ways. OIDC standardized this by adding an ID Token.',
      },
      {
        type: 'compare',
        heading: 'OAuth 2.0 vs OIDC',
      },
      {
        type: 'list',
        heading: 'What OIDC adds to OAuth',
        items: [
          'ID Token — a JWT containing user identity (name, email, sub)',
          'UserInfo endpoint — /oauth/userinfo returns user profile',
          'Standardized scopes — openid, profile, email',
          'Nonce — prevents replay attacks',
          'Standard claims — sub, name, email, picture, etc.',
        ],
      },
      { type: 'tip', body: 'UnoAccess implements full OIDC. When your app requests the "openid" scope you get an ID Token with the user\'s identity.' },
    ],
    quiz: [
      {
        question: 'What does OIDC add on top of OAuth 2.0?',
        options: ['Faster token exchange', 'An identity layer with ID Tokens', 'Better encryption', 'Webhook support'],
        correct: 1,
        explanation: 'OIDC adds an identity layer — specifically the ID Token (a JWT) that tells the app who the user is.',
      },
    ],
  },
  {
    id: 'oauth-vs-sso',
    title: 'OAuth vs SSO — what\'s the difference?',
    category: 'auth',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'OAuth and SSO are related but different. SSO is the user experience; OAuth is one of the protocols that powers it.',
    keyTakeaway: 'SSO is the goal (login once, access many). OAuth + OIDC is the technical standard used to achieve that goal.',
    related: ['what-is-sso', 'what-is-oauth', 'what-is-oidc'],
    content: [
      {
        type: 'text',
        heading: 'They are not the same thing',
        body: 'This is one of the most common confusions in auth. SSO is a user experience pattern — "log in once, access everything." OAuth 2.0 is a protocol — a technical standard for authorization. You can build SSO using OAuth+OIDC, SAML, or even custom tokens.',
      },
      {
        type: 'list',
        heading: 'Quick comparison',
        items: [
          'SSO — a concept/goal, not a protocol',
          'OAuth 2.0 — a protocol for authorization',
          'OIDC — a protocol for authentication built on OAuth',
          'UnoAccess uses OAuth 2.0 + OIDC to deliver SSO',
          'SAML is another protocol that can also deliver SSO (older, XML-based)',
        ],
      },
      { type: 'tip', body: 'When someone says "login with Google" — that\'s SSO powered by Google\'s OAuth 2.0 + OIDC implementation.' },
    ],
    quiz: [
      {
        question: 'Which of these is a protocol (not a concept)?',
        options: ['SSO', 'Single Sign-On', 'OAuth 2.0', 'Federated Identity'],
        correct: 2,
        explanation: 'OAuth 2.0 is a technical protocol with a specification. SSO and Federated Identity are concepts/patterns that can be implemented using various protocols.',
      },
    ],
  },
  {
    id: 'what-is-jwt',
    title: 'What is a JWT (JSON Web Token)?',
    category: 'auth',
    difficulty: 'Beginner',
    readTime: 4,
    summary: 'JWT is a compact, self-contained token that carries user information and can be verified without a database lookup.',
    keyTakeaway: 'A JWT is like a signed ID card. Anyone who has the public key can verify it\'s real without calling the issuer.',
    related: ['what-is-oauth', 'what-is-oidc', 'access-vs-refresh'],
    content: [
      {
        type: 'text',
        heading: 'Structure of a JWT',
        body: 'A JWT has 3 parts separated by dots: header.payload.signature. Each part is Base64URL encoded.',
      },
      {
        type: 'code',
        language: 'text',
        body: `// A JWT looks like this:
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImV4cCI6MTcwMDAwMDAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

// Decoded:
// Header:  { "alg": "HS256", "typ": "JWT" }
// Payload: { "sub": "user_123", "email": "test@test.com", "exp": 1700000000 }
// Signature: HMAC-SHA256(header + "." + payload, secret)`,
      },
      {
        type: 'list',
        heading: 'Common JWT claims',
        items: [
          'sub — subject (user ID)',
          'email — user\'s email address',
          'name — user\'s display name',
          'exp — expiry timestamp (when the token expires)',
          'iat — issued at timestamp',
          'role — user\'s role (e.g. admin, user)',
        ],
      },
      { type: 'warning', body: 'Never store sensitive data (passwords, credit cards) in a JWT payload. The payload is Base64 encoded — not encrypted — so anyone can decode it.' },
    ],
    quiz: [
      {
        question: 'How many parts does a JWT have?',
        options: ['1', '2', '3', '4'],
        correct: 2,
        explanation: 'A JWT has 3 parts: Header, Payload, and Signature — separated by dots.',
      },
      {
        question: 'Is the JWT payload encrypted by default?',
        options: ['Yes, always', 'No, it is only Base64 encoded', 'Only if you use HTTPS', 'Yes, with AES-256'],
        correct: 1,
        explanation: 'JWT payload is Base64URL encoded, NOT encrypted. Anyone can decode it. Never put secrets in it.',
      },
    ],
  },
  {
    id: 'access-vs-refresh',
    title: 'Access Token vs Refresh Token',
    category: 'auth',
    difficulty: 'Intermediate',
    readTime: 3,
    summary: 'Access tokens are short-lived API credentials. Refresh tokens are long-lived and used to get new access tokens.',
    keyTakeaway: 'Access token = short-lived (15 min), used for API calls. Refresh token = long-lived (7 days), used to get new access tokens silently.',
    related: ['what-is-jwt', 'what-is-oauth'],
    content: [
      {
        type: 'text',
        heading: 'Why two tokens?',
        body: 'If access tokens never expired, a stolen token would give an attacker permanent access. Making them short-lived (15 min) limits damage. But you don\'t want users to log in every 15 minutes. The refresh token solves this — it lives longer and silently fetches new access tokens.',
      },
      {
        type: 'list',
        heading: 'Access Token',
        items: [
          'Short-lived — typically 15 minutes in UnoAccess',
          'Sent with every API request in Authorization header',
          'If stolen, attacker has access for at most 15 minutes',
          'Stateless — verified by signature, no DB lookup needed',
        ],
      },
      {
        type: 'list',
        heading: 'Refresh Token',
        items: [
          'Long-lived — typically 7 days in UnoAccess',
          'Stored in httpOnly cookie — JavaScript cannot access it',
          'Used only to get a new access token when old one expires',
          'Stored in database so it can be revoked (logout, security)',
        ],
      },
      { type: 'tip', body: 'UnoAccess stores refresh tokens in the database. When you revoke a session, the refresh token is marked invalid — the attacker\'s access token expires in 15 min and cannot be renewed.' },
    ],
    quiz: [
      {
        question: 'Why are access tokens short-lived?',
        options: [
          'To save database space',
          'To limit damage if a token is stolen',
          'Because JWTs cannot be long-lived',
          'To improve performance',
        ],
        correct: 1,
        explanation: 'Short-lived access tokens limit the window of damage if stolen. An attacker can only use a stolen token for the short duration before it expires.',
      },
    ],
  },

  // ── Security Concepts ─────────────────────────────────────────────────────
  {
    id: 'what-is-2fa',
    title: 'What is 2FA (Two-Factor Authentication)?',
    category: 'security',
    difficulty: 'Beginner',
    readTime: 3,
    summary: '2FA adds a second verification step beyond your password, making accounts much harder to compromise.',
    keyTakeaway: '2FA = something you know (password) + something you have (phone/app). Both are needed to log in.',
    related: ['totp-vs-sms', 'what-is-sso'],
    content: [
      {
        type: 'text',
        heading: 'The problem with passwords alone',
        body: 'Passwords get stolen through phishing, data breaches, and brute force. If an attacker has your password, they have your account. 2FA means they also need physical access to your phone or authenticator app — dramatically raising the bar.',
      },
      {
        type: 'list',
        heading: 'Types of 2FA',
        items: [
          'TOTP app (Google Authenticator, Authy) — generates a 6-digit code every 30 seconds',
          'SMS code — code sent to your phone number (less secure)',
          'Hardware key (YubiKey) — physical USB device',
          'Push notification — tap approve on your phone',
          'Backup codes — one-time use codes for emergencies',
        ],
      },
      { type: 'tip', body: 'UnoAccess uses TOTP (Time-based One-Time Password) — the same standard used by Google, GitHub, and AWS. No SMS dependency means no SIM-swap attacks.' },
    ],
    quiz: [
      {
        question: 'What does "something you have" refer to in 2FA?',
        options: ['Your email address', 'Your password', 'Your authenticator app or phone', 'Your username'],
        correct: 2,
        explanation: '2FA combines something you know (password) with something you have (authenticator app, hardware key, or phone).',
      },
    ],
  },
  {
    id: 'totp-vs-sms',
    title: 'TOTP vs SMS — which is safer?',
    category: 'security',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'TOTP apps are significantly more secure than SMS codes. Here\'s why SMS 2FA can still be beaten.',
    keyTakeaway: 'TOTP apps (Authenticator) are safer than SMS. SMS can be intercepted via SIM-swapping. Always prefer TOTP.',
    related: ['what-is-2fa'],
    content: [
      {
        type: 'list',
        heading: 'SMS weaknesses',
        items: [
          'SIM swapping — attacker convinces carrier to transfer your number to their SIM',
          'SS7 vulnerabilities — telecom protocol flaws allow SMS interception',
          'Phishing — attacker tricks you into entering the SMS code on a fake site',
          'Phone theft — access to your phone means access to SMS',
        ],
      },
      {
        type: 'list',
        heading: 'Why TOTP is better',
        items: [
          'Works offline — no network dependency',
          'Not tied to a phone number that can be stolen',
          'Time-based — code is invalid after 30 seconds',
          'No interception risk — code never travels over telecom network',
          'Works even if phone has no signal',
        ],
      },
      { type: 'warning', body: 'SMS 2FA is much better than no 2FA. But if you have the choice, always use a TOTP app like Google Authenticator or Authy.' },
    ],
    quiz: [
      {
        question: 'What is a SIM swap attack?',
        options: [
          'Swapping two SIM cards in the same phone',
          'An attacker convincing your carrier to transfer your number to their SIM',
          'Physically stealing someone\'s SIM card',
          'A type of phishing attack on email',
        ],
        correct: 1,
        explanation: 'SIM swapping is when an attacker convinces your mobile carrier to transfer your phone number to a SIM they control — giving them your SMS codes.',
      },
    ],
  },
  {
    id: 'what-is-csrf',
    title: 'What is CSRF and how do we prevent it?',
    category: 'security',
    difficulty: 'Intermediate',
    readTime: 4,
    summary: 'CSRF tricks your browser into making unauthorized requests to a site you are logged into.',
    keyTakeaway: 'CSRF exploits the fact that browsers automatically send cookies. Prevention: use SameSite cookies, CSRF tokens, or check the Origin header.',
    related: ['what-is-session'],
    content: [
      {
        type: 'text',
        heading: 'How a CSRF attack works',
        body: 'You are logged into your bank. You visit an evil website. That website has a hidden form that submits a money transfer to your bank. Your browser automatically sends your bank cookies with the request. The bank thinks it\'s you. Money transferred.',
      },
      {
        type: 'list',
        heading: 'Prevention methods',
        items: [
          'SameSite=Strict cookies — browser only sends cookie to the same site that set it',
          'SameSite=Lax cookies — cookies sent on top-level navigations only',
          'CSRF tokens — random token in forms that attacker cannot know',
          'Check Origin/Referer header — reject requests from unexpected origins',
          'Double submit cookie pattern — send token in both cookie and request body',
        ],
      },
      { type: 'tip', body: 'UnoAccess uses SameSite=Lax cookies by default. The OAuth state parameter also acts as a CSRF protection for the OAuth flow.' },
    ],
    quiz: [
      {
        question: 'What makes CSRF attacks possible?',
        options: [
          'Weak passwords',
          'Browsers automatically sending cookies with cross-site requests',
          'Unencrypted HTTPS connections',
          'Outdated browsers',
        ],
        correct: 1,
        explanation: 'CSRF works because browsers automatically attach cookies to requests, even when initiated by a different website.',
      },
    ],
  },
  {
    id: 'what-is-session',
    title: 'What is a session and how does it work?',
    category: 'security',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'A session is how a server remembers who you are between HTTP requests, since HTTP itself is stateless.',
    keyTakeaway: 'HTTP is stateless. Sessions give it memory. Your session token (cookie) proves to the server that you already authenticated.',
    related: ['access-vs-refresh', 'what-is-csrf'],
    content: [
      {
        type: 'text',
        heading: 'Why sessions exist',
        body: 'HTTP is stateless — each request is independent. The server has no memory of previous requests. Without sessions, you would need to send your username and password with every single request. Sessions solve this by issuing a token after login.',
      },
      {
        type: 'list',
        heading: 'Session lifecycle',
        items: [
          '1. User logs in with credentials',
          '2. Server validates and creates a session record',
          '3. Session ID (or JWT) sent to browser as a cookie',
          '4. Browser sends cookie with every subsequent request',
          '5. Server reads cookie, looks up session, knows who you are',
          '6. On logout, session is invalidated on the server',
        ],
      },
      { type: 'tip', body: 'UnoAccess uses JWT-based sessions (stateless access tokens) combined with database-backed refresh tokens. This gives both performance (no DB lookup per request) and revocability (logout invalidates refresh token).' },
    ],
    quiz: [
      {
        question: 'Why does HTTP need sessions?',
        options: [
          'HTTP is too slow without them',
          'HTTP is stateless — it has no memory between requests',
          'Sessions improve encryption',
          'Sessions are required by the OAuth standard',
        ],
        correct: 1,
        explanation: 'HTTP is a stateless protocol — each request is independent. Sessions give it memory by issuing a token after login.',
      },
    ],
  },
  {
    id: 'what-is-ip-hashing',
    title: 'What is IP hashing and why do we hash IPs?',
    category: 'security',
    difficulty: 'Intermediate',
    readTime: 3,
    summary: 'IP hashing converts IP addresses into irreversible hashes for privacy-safe storage and analysis.',
    keyTakeaway: 'Hashing IPs with SHA-256 + salt lets you detect suspicious patterns without storing identifiable personal data. GDPR friendly.',
    related: ['what-is-session', 'what-is-hmac'],
    content: [
      {
        type: 'text',
        heading: 'Why not just store the raw IP?',
        body: 'An IP address is personal data under GDPR in many cases. Storing raw IPs creates compliance obligations. Hashing the IP with a secret salt lets you detect "same IP used multiple times" patterns without storing the actual IP.',
      },
      {
        type: 'code',
        language: 'typescript',
        body: `// UnoAccess IP hashing (from session.ts)
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'default-salt';
  return crypto
    .createHash('sha256')
    .update(ip + salt)  // salt prevents rainbow table attacks
    .digest('hex')
    .slice(0, 16);      // truncate for storage efficiency
}`,
      },
      { type: 'warning', body: 'Hashing without a salt is reversible via rainbow tables. Always use a secret salt so the hash cannot be reversed even if the algorithm is known.' },
    ],
    quiz: [
      {
        question: 'Why do we add a salt when hashing IPs?',
        options: [
          'To make the hash longer',
          'To prevent rainbow table attacks and make hashes irreversible',
          'To improve performance',
          'Salting is required by the SHA-256 algorithm',
        ],
        correct: 1,
        explanation: 'A salt is a secret added before hashing. Without it, an attacker could pre-compute SHA-256 hashes of all known IPs (rainbow table) and reverse your hashes.',
      },
    ],
  },

  // ── UnoAccess Specific ────────────────────────────────────────────────────
  {
    id: 'what-is-unoaccess',
    title: 'What is UnoAccess?',
    category: 'unoaccess',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'UnoAccess is a self-hosted SSO platform with OAuth 2.0/OIDC, performance monitoring, audit logs, and developer tools.',
    keyTakeaway: 'UnoAccess = your own identity provider. You own the code, the data, and the infrastructure. No vendor lock-in.',
    related: ['what-is-sso', 'what-is-client-id-secret', 'what-is-sdk'],
    content: [
      {
        type: 'list',
        heading: 'What UnoAccess includes',
        items: [
          'OAuth 2.0 / OpenID Connect — industry standard auth protocol',
          'Multi-account chooser — switch between accounts seamlessly',
          'Two-factor authentication — TOTP-based with backup codes',
          'Performance monitoring SDK — drop-in response time tracking',
          'Admin panel — manage users, apps, announcements',
          'User dashboard — sessions, connected apps, API keys',
          'Webhooks — real-time event delivery to your apps',
          'Audit logs — full history of every security event',
          'Alert rules — get notified when metrics breach thresholds',
          'SLO tracking — define and monitor service level objectives',
        ],
      },
      { type: 'tip', body: 'UnoAccess is open source. You run it on your own server (Render, Railway, Fly.io) or on-premise. Your users\' data never leaves your infrastructure.' },
    ],
    quiz: [
      {
        question: 'What type of auth protocol does UnoAccess implement?',
        options: ['SAML 2.0', 'OAuth 2.0 + OpenID Connect', 'WS-Federation', 'Kerberos'],
        correct: 1,
        explanation: 'UnoAccess implements OAuth 2.0 + OpenID Connect (OIDC) — the modern, industry-standard protocols used by Google, GitHub, and Microsoft.',
      },
    ],
  },
  {
    id: 'what-is-client-id-secret',
    title: 'What is a Client ID and Client Secret?',
    category: 'unoaccess',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'Client ID is public — it identifies your app. Client Secret is private — it proves your app is who it says it is.',
    keyTakeaway: 'Client ID = your app\'s username. Client Secret = your app\'s password. Never expose the secret in frontend code.',
    related: ['what-is-unoaccess', 'what-is-redirect-uri', 'what-is-oauth'],
    content: [
      {
        type: 'list',
        heading: 'Client ID',
        items: [
          'Public — safe to include in frontend code and URLs',
          'Uniquely identifies your app to UnoAccess',
          'Looks like: ua_aba046b6c5d9401c8f441320971a8a21',
          'Used in the /oauth/authorize URL',
          'Does not prove anything — anyone can use your Client ID',
        ],
      },
      {
        type: 'list',
        heading: 'Client Secret',
        items: [
          'Private — must NEVER be in frontend/browser code',
          'Proves to UnoAccess that the token exchange request is from your server',
          'Shown only once when you create the app — store it immediately',
          'Used only in server-to-server calls (token exchange)',
          'If leaked, rotate it immediately from the My App page',
        ],
      },
      { type: 'warning', body: 'If your Client Secret is in your frontend JavaScript, anyone can open DevTools and steal it. Always keep it on the server side.' },
    ],
    quiz: [
      {
        question: 'Which of these is safe to include in your frontend JavaScript?',
        options: ['Client Secret', 'Client ID', 'Both', 'Neither'],
        correct: 1,
        explanation: 'Client ID is public and safe in frontend code. Client Secret must NEVER be in frontend code — it must stay on your server.',
      },
    ],
  },
  {
    id: 'what-is-redirect-uri',
    title: 'What is a Redirect URI and why must it match exactly?',
    category: 'unoaccess',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'The redirect URI is where UnoAccess sends the user back after login. Exact matching prevents authorization code theft.',
    keyTakeaway: 'Redirect URI must match exactly — including port, path, and protocol. This prevents attackers from hijacking your auth codes.',
    related: ['what-is-client-id-secret', 'what-is-oauth'],
    content: [
      {
        type: 'text',
        heading: 'Why exact matching?',
        body: 'Imagine an attacker sets up a phishing site at http://evil.com. If UnoAccess allowed partial matching (like "must start with http://yourapp.com"), the attacker could register http://yourapp.com.evil.com as a redirect and steal your users\' auth codes.',
      },
      {
        type: 'list',
        heading: 'Common mistakes',
        items: [
          'Using http:// in production instead of https://',
          'Including a trailing slash in one place but not the other',
          'Wrong port — registered 3000 but app runs on 3001',
          'Missing /callback path — registered / but sending /callback',
          'Using localhost vs 127.0.0.1 (these are different strings)',
        ],
      },
      { type: 'tip', body: 'For local development, register http://localhost:PORT/callback. For production, use https://yourdomain.com/callback. Register both if you need both environments.' },
    ],
    quiz: [
      {
        question: 'Why does the redirect URI need to match exactly?',
        options: [
          'To improve performance',
          'To prevent attackers from redirecting auth codes to their own servers',
          'Because the OAuth spec requires it for encryption',
          'To make debugging easier',
        ],
        correct: 1,
        explanation: 'Exact URI matching prevents authorization code theft — attackers cannot register a similar-looking URI to intercept your users\' auth codes.',
      },
    ],
  },
  {
    id: 'what-is-scope',
    title: 'What are OAuth Scopes?',
    category: 'unoaccess',
    difficulty: 'Beginner',
    readTime: 2,
    summary: 'Scopes define what permissions an app is requesting. Users see and approve exactly what an app can access.',
    keyTakeaway: 'Scopes = permissions. Request only what you need. The consent screen shows users exactly what your app will access.',
    related: ['what-is-oauth', 'what-is-oidc', 'what-is-client-id-secret'],
    content: [
      {
        type: 'list',
        heading: 'UnoAccess default scopes',
        items: [
          'openid — enables OIDC, returns an ID Token',
          'profile — access to name and display picture',
          'email — access to email address',
        ],
      },
      { type: 'tip', body: 'Always request the minimum scopes your app needs. Requesting unnecessary scopes reduces user trust and consent rates.' },
    ],
    quiz: [
      {
        question: 'Which scope must you include to get an ID Token (OIDC)?',
        options: ['profile', 'email', 'openid', 'identity'],
        correct: 2,
        explanation: 'The "openid" scope is required to enable OIDC and receive an ID Token. Without it you get OAuth 2.0 authorization only.',
      },
    ],
  },
  {
    id: 'what-is-api-key',
    title: 'What are Personal Access Tokens (API Keys)?',
    category: 'unoaccess',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'API Keys let you authenticate API requests from scripts, CI/CD pipelines, and other automated tools without user interaction.',
    keyTakeaway: 'API keys are for machines. OAuth tokens are for users. Use API keys for scripts and automation; OAuth for user-facing apps.',
    related: ['what-is-client-id-secret', 'what-is-oauth'],
    content: [
      {
        type: 'list',
        heading: 'When to use API keys vs OAuth',
        items: [
          'API keys — CI/CD pipelines, cron jobs, scripts, server-to-server calls',
          'OAuth tokens — when a human user needs to grant permission',
          'API keys — when you need programmatic access to your own account',
          'OAuth — when a third-party app needs access to a user\'s data',
        ],
      },
      {
        type: 'code',
        language: 'bash',
        body: `# Using a UnoAccess API key
curl https://your-instance.com/api/user/profile \\
  -H "Authorization: Bearer ua_your_api_key_here"`,
      },
      { type: 'warning', body: 'API keys are shown only once when created. Store them immediately in a password manager or secrets vault. If lost, you must revoke and generate a new one.' },
    ],
    quiz: [
      {
        question: 'When should you use an API key instead of OAuth?',
        options: [
          'When a user needs to grant permission',
          'For automated scripts and CI/CD pipelines',
          'When building a mobile app',
          'API keys and OAuth are interchangeable',
        ],
        correct: 1,
        explanation: 'API keys are designed for machine-to-machine access — scripts, automation, and server-side tools where there is no human user flow.',
      },
    ],
  },

  // ── Performance Monitoring ─────────────────────────────────────────────────
  {
    id: 'what-is-sdk',
    title: 'What is the UnoAccess Monitor SDK?',
    category: 'monitoring',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'The UnoAccess Monitor SDK is a drop-in npm package that automatically tracks performance data from your Express.js app.',
    keyTakeaway: 'Add 3 lines of code and get automatic tracking of response times, error rates, and endpoint performance. No configuration files.',
    related: ['what-is-response-time', 'what-is-error-rate', 'what-is-slo'],
    content: [
      {
        type: 'code',
        language: 'typescript',
        body: `import { UnoAccessMonitor } from 'unoaccess-monitor';

const monitor = new UnoAccessMonitor({
  clientId: 'ua_your_client_id',
  clientSecret: 'your_secret',
  endpoint: 'http://localhost:5000/api/monitoring/logs',
});

// Drop this middleware into your Express app
app.use(monitor.expressMiddleware());

// That's it — all routes are now tracked automatically`,
      },
      {
        type: 'list',
        heading: 'What gets tracked automatically',
        items: [
          'Response time for every request (in milliseconds)',
          'HTTP status code (200, 404, 500 etc.)',
          'Endpoint path and HTTP method',
          'User ID (if authenticated)',
          'User agent (browser/device)',
          'Timestamps for time-series charts',
        ],
      },
      {
        type: 'list',
        heading: 'Additional SDK methods',
        items: [
          'monitor.trace(name, props) — track custom events (e.g. db query time)',
          'monitor.captureError(error, meta) — capture and group exceptions',
        ],
      },
    ],
    quiz: [
      {
        question: 'What does monitor.expressMiddleware() do?',
        options: [
          'It replaces your Express router',
          'It automatically tracks all HTTP requests passing through your app',
          'It adds authentication to your routes',
          'It compresses responses',
        ],
        correct: 1,
        explanation: 'The Express middleware intercepts every request and response, measuring response time and collecting metrics automatically.',
      },
    ],
  },
  {
    id: 'what-is-response-time',
    title: 'What is response time / latency?',
    category: 'monitoring',
    difficulty: 'Beginner',
    readTime: 2,
    summary: 'Response time is how long it takes your server to respond to a request — from request received to response sent.',
    keyTakeaway: 'Under 200ms = fast. 200-500ms = acceptable. Over 500ms = users notice. Over 1000ms = users leave.',
    related: ['what-is-p95-p99', 'what-is-slo', 'what-is-sdk'],
    content: [
      {
        type: 'list',
        heading: 'Response time benchmarks',
        items: [
          '< 100ms — instant, users feel no delay',
          '100–200ms — fast, imperceptible delay',
          '200–500ms — acceptable for most web apps',
          '500ms–1s — noticeable delay, some users frustrated',
          '1–3s — significant delay, bounce rate increases',
          '> 3s — most users abandon the page',
        ],
      },
      { type: 'tip', body: 'UnoAccess Monitor tracks both average and percentile (p95, p99) response times. Average alone can be misleading — a few slow requests bring the average up, hiding that most requests are fast.' },
    ],
    quiz: [
      {
        question: 'At what response time do most users start noticing a delay?',
        options: ['< 100ms', '100-200ms', '500ms+', '3 seconds'],
        correct: 2,
        explanation: 'Users typically start to notice delays around 500ms. Below that, the experience feels responsive.',
      },
    ],
  },
  {
    id: 'what-is-p95-p99',
    title: 'What is p95 and p99 latency?',
    category: 'monitoring',
    difficulty: 'Intermediate',
    readTime: 3,
    summary: 'p95 means 95% of requests are faster than this value. p99 captures your slowest 1% of requests — often the most important.',
    keyTakeaway: 'Don\'t just watch average latency. p95 and p99 show you what your slowest users experience, which matters most for retention.',
    related: ['what-is-response-time', 'what-is-slo'],
    content: [
      {
        type: 'text',
        heading: 'Why averages lie',
        body: 'If 99 requests take 100ms and 1 request takes 10,000ms, the average is 199ms — looks fine. But one user waited 10 seconds. Percentiles expose these outliers.',
      },
      {
        type: 'list',
        heading: 'Reading percentiles',
        items: [
          'p50 (median) — half of requests are faster than this',
          'p95 — 95% of requests are faster, 5% are slower',
          'p99 — 99% faster, 1% slower (your worst-case users)',
          'p99.9 — 99.9% faster — used for high-reliability systems',
        ],
      },
      { type: 'tip', body: 'Set your SLO targets on p95, not average. "p95 < 500ms" means 95% of users get a fast experience, and you\'ll know when edge cases are slowing down.' },
    ],
    quiz: [
      {
        question: 'If p95 latency is 800ms, what does that mean?',
        options: [
          '95% of requests take 800ms',
          '95% of requests are faster than 800ms',
          'The average request takes 800ms',
          'The slowest request takes 800ms',
        ],
        correct: 1,
        explanation: 'p95 = 800ms means 95% of requests complete in under 800ms. The remaining 5% are slower than 800ms.',
      },
    ],
  },
  {
    id: 'what-is-error-rate',
    title: 'What is Error Rate?',
    category: 'monitoring',
    difficulty: 'Beginner',
    readTime: 2,
    summary: 'Error rate is the percentage of requests that result in an error (HTTP 4xx or 5xx status codes).',
    keyTakeaway: 'Error rate = (error requests / total requests) × 100. An error rate above 1% usually needs immediate investigation.',
    related: ['what-is-response-time', 'what-is-slo', 'what-is-alert-rule'],
    content: [
      {
        type: 'list',
        heading: 'Error rate thresholds',
        items: [
          '0% — perfect (rare in practice)',
          '< 0.1% — excellent, normal background noise',
          '0.1–1% — acceptable, monitor closely',
          '1–5% — warning zone, investigate',
          '> 5% — critical, likely broken feature or outage',
        ],
      },
      {
        type: 'list',
        heading: 'What counts as an error',
        items: [
          '4xx errors — client errors (bad request, unauthorized, not found)',
          '5xx errors — server errors (internal server error, gateway timeout)',
          'Note: 4xx caused by bots/bad clients may not reflect your app quality',
        ],
      },
      { type: 'tip', body: 'Set a UnoAccess alert rule: "error_rate > 5% for 5 minutes → send email". This catches outages before users start complaining.' },
    ],
    quiz: [
      {
        question: 'If 1000 requests come in and 15 return 500 errors, what is the error rate?',
        options: ['0.15%', '1.5%', '15%', '150%'],
        correct: 1,
        explanation: '15 / 1000 × 100 = 1.5% error rate.',
      },
    ],
  },
  {
    id: 'what-is-slo',
    title: 'What is an SLO (Service Level Objective)?',
    category: 'monitoring',
    difficulty: 'Intermediate',
    readTime: 4,
    summary: 'An SLO is a target reliability metric — a commitment you make to yourself about how your service should perform.',
    keyTakeaway: 'SLO = a specific measurable target (e.g. "p95 < 500ms" or "error rate < 1%"). Track it over time and get alerts when you miss it.',
    related: ['what-is-p95-p99', 'what-is-error-rate', 'what-is-alert-rule'],
    content: [
      {
        type: 'list',
        heading: 'SLO vs SLA vs SLI',
        items: [
          'SLI (Service Level Indicator) — the metric you measure (e.g. p95 latency)',
          'SLO (Service Level Objective) — your internal target (p95 < 500ms)',
          'SLA (Service Level Agreement) — a contractual promise to customers (usually softer than SLO)',
          'Rule of thumb: your SLO should be stricter than your SLA',
        ],
      },
      {
        type: 'list',
        heading: 'Common SLO examples',
        items: [
          'p95 latency < 500ms over a 30-day window',
          'Error rate < 1% over a 7-day window',
          'Availability > 99.9% over a 30-day window',
          'p99 latency < 2000ms for payment endpoints',
        ],
      },
      { type: 'tip', body: 'Start with just 1-2 SLOs. "Error rate < 1%" and "p95 < 500ms" cover 90% of reliability concerns for most apps.' },
    ],
    quiz: [
      {
        question: 'What is the difference between an SLO and an SLA?',
        options: [
          'They are the same thing',
          'SLO is internal target, SLA is external contractual promise',
          'SLA is internal, SLO is what you tell customers',
          'SLO is for latency, SLA is for availability',
        ],
        correct: 1,
        explanation: 'SLO is your internal reliability target. SLA is a contractual promise to customers. Your SLO should be stricter so you have a buffer before breaking the SLA.',
      },
    ],
  },

  // ── Alerts & Reliability ──────────────────────────────────────────────────
  {
    id: 'what-is-alert-rule',
    title: 'What are real-time alert rules?',
    category: 'alerts',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'Alert rules watch your metrics and notify you when something crosses a threshold — before users start complaining.',
    keyTakeaway: 'Set alerts on error rate and latency. Get notified via email or webhook. Fix issues before users file bug reports.',
    related: ['what-is-error-rate', 'what-is-slo', 'what-is-webhook'],
    content: [
      {
        type: 'list',
        heading: 'How UnoAccess alerts work',
        items: [
          '1. You define a rule: metric + condition + threshold + window',
          '2. The alert worker checks every 60 seconds',
          '3. If the rule is breached, a notification is sent',
          '4. A cooldown prevents spam — one alert per breach window',
          '5. When metrics recover, the alert is marked resolved',
        ],
      },
      {
        type: 'list',
        heading: 'Recommended starter alerts',
        items: [
          'Error rate > 5% for 5 minutes → email',
          'p95 response time > 1000ms for 5 minutes → email',
          'Error rate > 20% for 1 minute → webhook (critical)',
        ],
      },
      { type: 'tip', body: 'Start with loose thresholds (e.g. error rate > 5%) and tighten them over time as you understand your normal baseline.' },
    ],
    quiz: [
      {
        question: 'How often does the UnoAccess alert worker check rules?',
        options: ['Every second', 'Every 60 seconds', 'Every 5 minutes', 'Every hour'],
        correct: 1,
        explanation: 'The UnoAccess alert worker runs every 60 seconds, checking all active rules against recent metrics.',
      },
    ],
  },
  {
    id: 'what-is-uptime',
    title: 'What is uptime and availability?',
    category: 'alerts',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'Uptime is the percentage of time your service is operational. 99.9% uptime still allows 8.7 hours of downtime per year.',
    keyTakeaway: 'The "nines" matter: 99.9% = 8.7h downtime/year. 99.99% = 52 minutes. 99.999% = 5 minutes.',
    related: ['what-is-slo', 'what-is-alert-rule', 'what-is-incident'],
    content: [
      {
        type: 'list',
        heading: 'The nines — what they really mean per year',
        items: [
          '99% (two nines) — 87.6 hours downtime',
          '99.9% (three nines) — 8.7 hours downtime',
          '99.95% — 4.4 hours downtime',
          '99.99% (four nines) — 52 minutes downtime',
          '99.999% (five nines) — 5.3 minutes downtime',
        ],
      },
      { type: 'tip', body: 'For most startups and indie products, 99.9% is a realistic and acceptable target. Five nines requires enormous infrastructure investment.' },
    ],
    quiz: [
      {
        question: 'How much downtime does 99.9% uptime allow per year?',
        options: ['About 1 hour', 'About 8.7 hours', 'About 24 hours', 'About 87 hours'],
        correct: 1,
        explanation: '99.9% uptime = 0.1% downtime = 8.76 hours of allowed downtime per year.',
      },
    ],
  },
  {
    id: 'what-is-incident',
    title: 'What is an incident?',
    category: 'alerts',
    difficulty: 'Beginner',
    readTime: 2,
    summary: 'An incident is any unplanned event that disrupts or degrades your service. How you handle it defines your reliability culture.',
    keyTakeaway: 'Incidents happen to everyone. What matters is how fast you detect, communicate, and resolve them.',
    related: ['what-is-uptime', 'what-is-alert-rule'],
    content: [
      {
        type: 'list',
        heading: 'Incident severity levels',
        items: [
          'Critical — complete outage, all users affected',
          'Major — significant degradation, many users affected',
          'Minor — partial degradation, some users affected',
          'None — internal issue, no user impact',
        ],
      },
      {
        type: 'list',
        heading: 'Incident response steps',
        items: [
          '1. Detect — alert fires or user reports',
          '2. Acknowledge — someone owns it',
          '3. Communicate — post status update immediately',
          '4. Investigate — find root cause',
          '5. Resolve — fix and verify',
          '6. Post-mortem — document what happened and why',
        ],
      },
      { type: 'tip', body: 'The UnoAccess status page lets you post incident updates in real time so users know what\'s happening instead of wondering if the site is broken.' },
    ],
    quiz: [
      {
        question: 'What should you do FIRST when an incident occurs?',
        options: [
          'Fix the bug immediately',
          'Blame someone',
          'Detect and acknowledge — then communicate to users',
          'Wait to see if it resolves itself',
        ],
        correct: 2,
        explanation: 'Fast detection and communication matter most. Users are forgiving of outages if you communicate. They are not forgiving of silence.',
      },
    ],
  },

  // ── Web & API Concepts ────────────────────────────────────────────────────
  {
    id: 'what-is-webhook',
    title: 'What is a Webhook?',
    category: 'web',
    difficulty: 'Beginner',
    readTime: 3,
    summary: 'A webhook is an HTTP callback — your server sends a POST request to a URL whenever a specific event happens.',
    keyTakeaway: 'Webhooks = event-driven push notifications for servers. Instead of polling "did anything happen?", UnoAccess pushes to you immediately.',
    related: ['what-is-hmac', 'what-is-alert-rule'],
    content: [
      {
        type: 'text',
        heading: 'Polling vs Webhooks',
        body: 'Without webhooks you have to constantly ask "did anything change?" (polling). With webhooks, UnoAccess calls your server the moment something happens. More efficient, lower latency, less server load.',
      },
      {
        type: 'list',
        heading: 'UnoAccess webhook events',
        items: [
          'user.login — user signed in',
          'user.register — new user created',
          'user.logout — user signed out',
          'token.revoked — access revoked',
          'oauth.consent_granted — user approved your app',
          'oauth.access_revoked — user removed your app',
        ],
      },
      {
        type: 'code',
        language: 'typescript',
        body: `// Verify a webhook in your Express app
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-unoaccess-signature'];
  const body = req.body.toString();
  const expected = 'sha256=' + crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expected) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(body);
  console.log('Event received:', event.type);
  res.json({ received: true });
});`,
      },
    ],
    quiz: [
      {
        question: 'What is the main advantage of webhooks over polling?',
        options: [
          'Webhooks are more secure',
          'Webhooks push events immediately — no constant requests needed',
          'Webhooks work without HTTP',
          'Webhooks don\'t need authentication',
        ],
        correct: 1,
        explanation: 'Webhooks push data to you the moment an event occurs. Polling requires repeatedly asking "anything new?" which wastes resources and adds latency.',
      },
    ],
  },
  {
    id: 'what-is-hmac',
    title: 'What is HMAC signing?',
    category: 'web',
    difficulty: 'Intermediate',
    readTime: 3,
    summary: 'HMAC signs messages with a shared secret so the receiver can verify they came from a trusted sender and weren\'t tampered with.',
    keyTakeaway: 'HMAC = Hash + Secret Key. UnoAccess signs all webhooks with HMAC-SHA256. Always verify the signature before processing.',
    related: ['what-is-webhook', 'what-is-ip-hashing'],
    content: [
      {
        type: 'text',
        heading: 'Why HMAC is needed',
        body: 'Anyone could POST fake data to your webhook endpoint. HMAC proves the request came from UnoAccess. UnoAccess computes HMAC-SHA256(body, secret) and sends it in a header. You compute the same thing with your secret and compare. If they match — it\'s genuine.',
      },
      {
        type: 'code',
        language: 'typescript',
        body: `// HMAC-SHA256 in Node.js
import crypto from 'crypto';

const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(requestBody)
  .digest('hex');

// UnoAccess sends: X-UnoAccess-Signature: sha256=<signature>`,
      },
      { type: 'warning', body: 'Use a constant-time comparison (crypto.timingSafeEqual) to compare HMAC values. A normal === comparison leaks timing information that attackers can use.' },
    ],
    quiz: [
      {
        question: 'What does HMAC verification protect against?',
        options: [
          'Stolen webhook secrets',
          'Fake or tampered webhook requests from unauthorized senders',
          'DDoS attacks',
          'Man-in-the-middle attacks on HTTPS',
        ],
        correct: 1,
        explanation: 'HMAC verification proves the request came from UnoAccess (the only party with the shared secret) and that the body was not tampered with.',
      },
    ],
  },
  {
    id: 'what-is-cors',
    title: 'What is CORS?',
    category: 'web',
    difficulty: 'Intermediate',
    readTime: 3,
    summary: 'CORS (Cross-Origin Resource Sharing) is a browser security feature that controls which domains can make requests to your API.',
    keyTakeaway: 'CORS is enforced by the browser, not the server. It protects users, not your API. Anyone can call your API directly — only browsers are restricted.',
    related: ['what-is-csrf', 'what-is-csp'],
    content: [
      {
        type: 'text',
        heading: 'The same-origin policy',
        body: 'By default, browsers block JavaScript from making requests to a different domain. This is the "same-origin policy". CORS is the mechanism that lets servers selectively allow specific origins.',
      },
      {
        type: 'list',
        heading: 'Important CORS headers',
        items: [
          'Access-Control-Allow-Origin — which domains are allowed',
          'Access-Control-Allow-Methods — which HTTP methods (GET, POST, etc.)',
          'Access-Control-Allow-Headers — which request headers',
          'Access-Control-Allow-Credentials — whether cookies are included',
          'Access-Control-Max-Age — how long to cache the preflight response',
        ],
      },
      { type: 'warning', body: 'Never set Access-Control-Allow-Origin: * when using credentials (cookies). The browser will reject it. You must specify exact origins.' },
    ],
    quiz: [
      {
        question: 'CORS is enforced by:',
        options: ['The server', 'The database', 'The browser', 'The DNS'],
        correct: 2,
        explanation: 'CORS is a browser security feature. The server sends CORS headers, but the browser decides whether to allow the response to reach the JavaScript code.',
      },
    ],
  },
  {
    id: 'what-is-csp',
    title: 'What is CSP (Content Security Policy)?',
    category: 'web',
    difficulty: 'Intermediate',
    readTime: 3,
    summary: 'CSP is an HTTP header that tells the browser what resources it is allowed to load — preventing XSS attacks.',
    keyTakeaway: 'CSP = a whitelist of what your page is allowed to load. A strict CSP stops XSS even if an attacker injects malicious scripts.',
    related: ['what-is-cors', 'what-is-csrf'],
    content: [
      {
        type: 'text',
        heading: 'The problem CSP solves',
        body: 'XSS (Cross-Site Scripting) lets attackers inject malicious JavaScript into your page. Even if they succeed, a strict CSP prevents the malicious script from loading external resources, making most XSS attacks useless.',
      },
      {
        type: 'code',
        language: 'text',
        body: `// UnoAccess default CSP
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' http://localhost:5173;`,
      },
      { type: 'tip', body: 'The Chrome DevTools error you see about CSP blocking requests to /.well-known/ is your CSP working correctly — it\'s blocking Chrome\'s own devtools requests, not your app.' },
    ],
    quiz: [
      {
        question: 'What type of attack does CSP primarily defend against?',
        options: ['CSRF', 'Brute force', 'XSS (Cross-Site Scripting)', 'SQL injection'],
        correct: 2,
        explanation: 'CSP primarily defends against XSS by restricting which scripts, styles, and resources the browser is allowed to load.',
      },
    ],
  },
  {
    id: 'auth-vs-authz',
    title: 'Difference between Authentication and Authorization',
    category: 'web',
    difficulty: 'Beginner',
    readTime: 2,
    summary: 'Authentication = who are you? Authorization = what are you allowed to do? They are different and both essential.',
    keyTakeaway: 'AuthN = identity (login). AuthZ = permissions (access control). You must authenticate before you can be authorized.',
    related: ['what-is-oauth', 'what-is-sso', 'what-is-scope'],
    content: [
      {
        type: 'list',
        heading: 'Authentication (AuthN)',
        items: [
          'Answers: "Who are you?"',
          'Involves: passwords, 2FA, biometrics, OAuth login',
          'Result: a verified identity (user ID, email)',
          'Example: Logging into UnoAccess with email + password',
        ],
      },
      {
        type: 'list',
        heading: 'Authorization (AuthZ)',
        items: [
          'Answers: "What are you allowed to do?"',
          'Involves: roles, permissions, scopes',
          'Result: access granted or denied to a resource',
          'Example: Admin can see all users, regular user cannot',
        ],
      },
      { type: 'tip', body: 'OAuth 2.0 is primarily an authorization framework. OIDC adds authentication on top. This is why they are often used together.' },
    ],
    quiz: [
      {
        question: 'A user logs in and then tries to access an admin page. Which process determines if they can see it?',
        options: ['Authentication', 'Authorization', 'Both simultaneously', 'Neither — it is determined by the database'],
        correct: 1,
        explanation: 'Login is authentication (who are you). Checking if you have permission to see the admin page is authorization (what can you do).',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Diagram renderers
// ─────────────────────────────────────────────────────────────────────────────
function FlowDiagram({ steps }: { steps: { label: string; icon: string }[] }) {
  return (
    <div className="my-4 p-4 bg-[var(--c-blue-lt)] border border-[var(--c-blue-mid)] rounded-xl overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 text-center px-3">
              <div className="w-10 h-10 rounded-full bg-[var(--c-blue)] text-white flex items-center justify-center text-lg shadow-sm">
                {step.icon}
              </div>
              <span className="text-xs text-[var(--c-text2)] font-medium max-w-[90px] leading-tight">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-[var(--c-blue)] flex-shrink-0 mx-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quiz component
// ─────────────────────────────────────────────────────────────────────────────
function QuizBlock({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : 0;

  return (
    <div className="mt-6 border-t border-[var(--c-border)] pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-4 h-4 text-[var(--c-amber)]" />
        <p className="text-sm font-semibold text-[var(--c-text)]">Quick Quiz</p>
        {submitted && (
          <span className={`badge ml-auto ${score === questions.length ? 'badge-green' : score > 0 ? 'badge-amber' : 'badge-red'}`}>
            {score}/{questions.length} correct
          </span>
        )}
      </div>

      <div className="space-y-5">
        {questions.map((q, qi) => (
          <div key={qi}>
            <p className="text-sm font-medium text-[var(--c-text)] mb-2">{q.question}</p>
            <div className="space-y-1.5">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                const isCorrect = oi === q.correct;
                let cls = 'border border-[var(--c-border)] text-[var(--c-text2)]';
                if (submitted) {
                  if (isCorrect) cls = 'border-green-300 bg-green-50 text-green-800';
                  else if (selected && !isCorrect) cls = 'border-red-300 bg-red-50 text-red-700';
                } else if (selected) {
                  cls = 'border-[var(--c-blue)] bg-[var(--c-blue-lt)] text-[var(--c-blue)]';
                }

                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => !submitted && setAnswers(p => ({ ...p, [qi]: oi }))}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors hover:bg-[var(--c-surface2)] ${cls}`}
                  >
                    <span className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    {opt}
                    {submitted && isCorrect && <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />}
                    {submitted && selected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-2 px-3 py-2 bg-[var(--c-surface2)] rounded-lg text-xs text-[var(--c-text3)]">
                💡 {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="btn btn-primary btn-sm mt-4"
        >
          Submit answers
        </button>
      ) : (
        <button
          onClick={() => { setAnswers({}); setSubmitted(false); }}
          className="btn btn-secondary btn-sm mt-4 gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Article viewer
// ─────────────────────────────────────────────────────────────────────────────
function ArticleView({ article, onBack, allArticles }: {
  article: Article; onBack: () => void; allArticles: Article[];
}) {
  const cat = CATEGORIES.find(c => c.id === article.category);
  const related = allArticles.filter(a => article.related?.includes(a.id));

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[var(--c-text3)] hover:text-[var(--c-text)] mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Learn
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="badge" style={{ background: `${cat?.color}18`, color: cat?.color, borderColor: `${cat?.color}30` }}>
            {cat?.label}
          </span>
          <span className={`badge ${article.difficulty === 'Beginner' ? 'badge-green' : article.difficulty === 'Intermediate' ? 'badge-amber' : 'badge-red'}`}>
            {article.difficulty}
          </span>
          <span className="flex items-center gap-1 text-xs text-[var(--c-text3)]">
            <Clock className="w-3 h-3" /> {article.readTime} min read
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--c-text)] mb-2">{article.title}</h1>
        <p className="text-[var(--c-text3)] text-sm leading-relaxed">{article.summary}</p>
      </div>

      {/* Key takeaway */}
      <div className="bg-[var(--c-blue-lt)] border border-[var(--c-blue-mid)] rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5">
        <Star className="w-4 h-4 text-[var(--c-blue)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--c-blue)] font-medium">{article.keyTakeaway}</p>
      </div>

      {/* Content sections */}
      <div className="space-y-4">
        {article.content.map((section, i) => {
          if (section.type === 'text') return (
            <div key={i}>
              {section.heading && <h2 className="text-base font-semibold text-[var(--c-text)] mb-2">{section.heading}</h2>}
              <p className="text-sm text-[var(--c-text2)] leading-relaxed">{section.body}</p>
            </div>
          );

          if (section.type === 'list') return (
            <div key={i}>
              {section.heading && <h2 className="text-base font-semibold text-[var(--c-text)] mb-2">{section.heading}</h2>}
              <ul className="space-y-1.5">
                {section.items?.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-2 text-sm text-[var(--c-text2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-blue)] flex-shrink-0 mt-1.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );

          if (section.type === 'code') return (
            <div key={i}>
              {section.heading && <h2 className="text-base font-semibold text-[var(--c-text)] mb-2">{section.heading}</h2>}
              <pre className="code-block text-xs overflow-x-auto whitespace-pre leading-relaxed">{section.body}</pre>
            </div>
          );

          if (section.type === 'tip') return (
            <div key={i} className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <Zap className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{section.body}</p>
            </div>
          );

          if (section.type === 'warning') return (
            <div key={i} className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{section.body}</p>
            </div>
          );

          if (section.type === 'diagram' && section.diagram?.type === 'flow') {
            const steps = (section.diagram.data as { steps: { label: string; icon: string }[] }).steps;
            return <FlowDiagram key={i} steps={steps} />;
          }

                    if (section.type === 'compare') return (
            <div key={i}>
              {section.heading && <h2 className="text-base font-semibold text-[var(--c-text)] mb-3">{section.heading}</h2>}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[var(--c-blue-lt)] border border-[var(--c-blue-mid)]">
                  <p className="text-xs font-bold text-[var(--c-blue)] uppercase tracking-wider mb-2">OAuth 2.0</p>
                  <ul className="space-y-1.5 text-xs text-[var(--c-text2)]">
                    <li>• Authorization only</li>
                    <li>• Issues access tokens</li>
                    <li>• Doesn't tell you WHO the user is</li>
                    <li>• Use for: API access, permissions</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-[var(--c-purple-lt)] border border-[#ddd6fe]">
                  <p className="text-xs font-bold text-[var(--c-purple)] uppercase tracking-wider mb-2">OAuth 2.0 + OIDC</p>
                  <ul className="space-y-1.5 text-xs text-[var(--c-text2)]">
                    <li>• Authorization + Authentication</li>
                    <li>• Issues access token + ID token</li>
                    <li>• Tells you WHO the user is</li>
                    <li>• Use for: login, identity, SSO</li>
                  </ul>
                </div>
              </div>
            </div>
          );

          return null;
        })}
      </div>

      {/* Quiz */}
      {article.quiz && article.quiz.length > 0 && (
        <QuizBlock questions={article.quiz} />
      )}

      {/* Related articles */}
      {related.length > 0 && (
        <div className="mt-8 border-t border-[var(--c-border)] pt-6">
          <p className="text-sm font-semibold text-[var(--c-text)] mb-3">Related articles</p>
          <div className="space-y-2">
            {related.map(r => (
              <button
                key={r.id}
                onClick={() => { onBack(); }}
                className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg hover:bg-[var(--c-surface2)] transition-colors group"
              >
                <BookOpen className="w-4 h-4 text-[var(--c-text3)] flex-shrink-0" />
                <span className="text-sm text-[var(--c-blue)] group-hover:underline flex-1 truncate">{r.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--c-text3)]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main LearnPage
// ─────────────────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [openArticle, setOpenArticle] = useState<Article | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['auth']));

  const filtered = useMemo(() => {
    let list = ARTICLES;
    if (selectedCategory) list = list.filter(a => a.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.keyTakeaway.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, selectedCategory]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Article view
  if (openArticle) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          <ArticleView
            article={openArticle}
            onBack={() => setOpenArticle(null)}
            allArticles={ARTICLES}
          />
        </div>
      </AppShell>
    );
  }

  // Browse view
  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Page header */}
        <div className="page-header">
          <h1 className="page-title">Learn</h1>
          <p className="page-subtitle">
            {ARTICLES.length} articles across {CATEGORIES.length} topics — from SSO basics to advanced reliability engineering
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--c-text3)]" />
          <input
            className="input pl-10 text-sm"
            placeholder="Search articles… (e.g. JWT, OAuth, p95, webhook)"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedCategory(null); }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text3)] hover:text-[var(--c-text)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search results */}
        {search.trim() ? (
          <div>
            <p className="text-sm text-[var(--c-text3)] mb-3">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
            </p>
            {filtered.length === 0 ? (
              <div className="card card-p text-center py-12">
                <Search className="w-8 h-8 text-[var(--c-text3)] mx-auto mb-2" />
                <p className="font-medium text-[var(--c-text)]">No articles found</p>
                <p className="text-sm text-[var(--c-text3)] mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map(article => (
                  <ArticleCard key={article.id} article={article} onClick={() => setOpenArticle(article)} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`badge cursor-pointer transition-colors ${!selectedCategory ? 'badge-blue' : 'badge-gray hover:badge-blue'}`}
              >
                All ({ARTICLES.length})
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className="badge cursor-pointer transition-colors"
                  style={selectedCategory === cat.id
                    ? { background: `${cat.color}18`, color: cat.color, borderColor: `${cat.color}40` }
                    : { background: 'var(--c-surface2)', color: 'var(--c-text3)', borderColor: 'var(--c-border)' }
                  }
                >
                  {cat.label} ({ARTICLES.filter(a => a.category === cat.id).length})
                </button>
              ))}
            </div>

            {/* Filtered by category */}
            {selectedCategory ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map(article => (
                  <ArticleCard key={article.id} article={article} onClick={() => setOpenArticle(article)} />
                ))}
              </div>
            ) : (
              /* Full category view */
              <div className="space-y-4">
                {CATEGORIES.map(cat => {
                  const catArticles = ARTICLES.filter(a => a.category === cat.id);
                  const isExpanded = expandedCategories.has(cat.id);
                  return (
                    <div key={cat.id} className="card overflow-hidden">
                      {/* Category header */}
                      <button
                        className="w-full card-header hover:bg-[var(--c-surface2)] transition-colors text-left"
                        onClick={() => toggleCategory(cat.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${cat.color}15`, color: cat.color }}>
                            {cat.icon}
                          </div>
                          <div>
                            <p className="card-title">{cat.label}</p>
                            <p className="card-desc">{cat.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="badge badge-gray">{catArticles.length} articles</span>
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-[var(--c-text3)]" />
                            : <ChevronRight className="w-4 h-4 text-[var(--c-text3)]" />}
                        </div>
                      </button>

                      {/* Articles grid */}
                      {isExpanded && (
                        <div className="p-4 grid sm:grid-cols-2 gap-3 border-t border-[var(--c-border)]">
                          {catArticles.map(article => (
                            <ArticleCard key={article.id} article={article} onClick={() => setOpenArticle(article)} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Article card
// ─────────────────────────────────────────────────────────────────────────────
function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  const cat = CATEGORIES.find(c => c.id === article.category);
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] hover:shadow-md hover:border-[var(--c-border2)] transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-[var(--c-text)] group-hover:text-[var(--c-blue)] transition-colors leading-snug">
          {article.title}
        </p>
        <ChevronRight className="w-4 h-4 text-[var(--c-text3)] flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
      <p className="text-xs text-[var(--c-text3)] leading-relaxed mb-3 line-clamp-2">{article.summary}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="badge text-[10px]"
          style={{ background: `${cat?.color}15`, color: cat?.color, borderColor: `${cat?.color}25` }}
        >
          {cat?.label}
        </span>
        <span className={`badge text-[10px] ${
          article.difficulty === 'Beginner' ? 'badge-green' :
          article.difficulty === 'Intermediate' ? 'badge-amber' : 'badge-red'
        }`}>
          {article.difficulty}
        </span>
        <span className="flex items-center gap-0.5 text-[10px] text-[var(--c-text3)] ml-auto">
          <Clock className="w-2.5 h-2.5" /> {article.readTime}m
        </span>
        {article.quiz && (
          <span className="flex items-center gap-0.5 text-[10px] text-[var(--c-amber)]">
            <Award className="w-2.5 h-2.5" /> Quiz
          </span>
        )}
      </div>
    </button>
  );
}