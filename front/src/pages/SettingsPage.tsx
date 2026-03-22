import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import { Input, Button, Alert, Badge } from "../components/ui";
import { AppShell } from "../components/AppShell";
import {
  User,
  Lock,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  MapPin,
  Clock,
  Trash2,
  LogOut,
  Bell,
  Camera,
  Shield,
  CheckCircle,
  XCircle,
  Loader,
  Download,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Tab = "profile" | "security" | "2fa" | "sessions" | "notifications";

interface Session {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  country: string;
  city: string;
  flag: string;
  lat: number;
  lng: number; // ← new
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}
interface AuditEntry {
  _id: string;
  action: string;
  timestamp: string;
  ip?: string;
  success: boolean;
}

function DeviceIcon({ type, className }: { type: string; className?: string }) {
  if (type === "mobile") return <Smartphone className={className} />;
  if (type === "tablet") return <Tablet className={className} />;
  return <Monitor className={className} />;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days < 30 ? `${days}d ago` : new Date(d).toLocaleDateString();
}

// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, fetchProfile, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatarUrl || null,
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [positione, setPositione] = useState([20.593683, 78.962883]);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      await updateProfile({ name });
      setMsg({ type: "success", text: "Profile updated." });
    } catch {
      setMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMsg({ type: "error", text: "Avatar must be under 2MB." });
      return;
    }
    const form = new FormData();
    form.append("avatar", file);
    setUploadingAvatar(true);
    try {
      const { data } = await api.post("/api/user/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatarPreview(data.avatarUrl);
      await fetchProfile();
      setMsg({ type: "success", text: "Avatar updated." });
    } catch {
      setMsg({ type: "error", text: "Failed to upload avatar." });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-xl bg-[var(--c-blue)] text-white text-xl font-bold flex items-center justify-center overflow-hidden">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-[var(--c-blue)] rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-sm">
            {uploadingAvatar ? (
              <Loader className="w-3 h-3 text-white spinner" />
            ) : (
              <Camera className="w-3 h-3 text-white" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
            />
          </label>
        </div>
        <div>
          <p className="font-semibold text-[var(--c-text)]">{user?.name}</p>
          <p className="text-sm text-[var(--c-text3)]">{user?.email}</p>
          <p className="text-xs text-[var(--c-text3)] mt-0.5">
            JPG or PNG, max 2MB
          </p>
        </div>
      </div>
      {msg && <Alert type={msg.type} message={msg.text} />}
      <form onSubmit={handleSave} className="space-y-4 max-w-md">
        <Input
          label="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email address"
          value={user?.email || ""}
          disabled
          type="email"
          helper="Contact support to change your email."
        />
        <Button type="submit" variant="primary" size="sm" isLoading={loading}>
          Save changes
        </Button>
      </form>
    </div>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────────
function SecurityTab() {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [conf, setConf] = useState("");
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api
      .get("/api/user/audit-log?limit=8")
      .then(({ data }) => setLogs(data.logs))
      .catch(() => {});
  }, []);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (nw !== conf) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      await api.put("/api/user/change-password", {
        currentPassword: cur,
        newPassword: nw,
        confirmPassword: conf,
      });
      setMsg({ type: "success", text: "Password changed successfully." });
      setCur("");
      setNw("");
      setConf("");
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async (format: "csv" | "json") => {
    setExporting(true);
    try {
      const res = await api.get(`/api/user/audit-log/export?format=${format}`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
    } finally {
      setExporting(false);
    }
  };

  const actionLabel = (a: string) => a.replace(/\./g, " › ").replace(/_/g, " ");

  return (
    <div className="space-y-8">
      <div className="max-w-md">
        <h3 className="text-sm font-semibold text-[var(--c-text)] mb-4">
          Change password
        </h3>
        {msg && <Alert type={msg.type} message={msg.text} className="mb-4" />}
        <form onSubmit={handleChange} className="space-y-3">
          <Input
            label="Current password"
            type="password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            required
          />
          <Input
            label="New password"
            type="password"
            value={nw}
            onChange={(e) => setNw(e.target.value)}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            value={conf}
            onChange={(e) => setConf(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            Update password
          </Button>
        </form>
      </div>
      <hr className="divider" />
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--c-text)]">
            Recent activity
          </h3>
          <div className="flex gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              isLoading={exporting}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => exportLogs("csv")}
            >
              CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              isLoading={exporting}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => exportLogs("json")}
            >
              JSON
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          {logs.length === 0 ? (
            <p className="text-sm text-[var(--c-text3)]">No activity yet.</p>
          ) : (
            logs.map((l) => (
              <div
                key={l._id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[var(--c-surface2)] text-sm"
              >
                {l.success ? (
                  <CheckCircle className="w-4 h-4 text-[var(--c-green)] flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[var(--c-red)] flex-shrink-0" />
                )}
                <span className="flex-1 text-[var(--c-text2)] capitalize">
                  {actionLabel(l.action)}
                </span>
                {l.ip && (
                  <span className="text-xs text-[var(--c-text3)] font-mono hidden sm:block">
                    {l.ip}
                  </span>
                )}
                <span className="text-xs text-[var(--c-text3)]">
                  {timeAgo(l.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── 2FA Tab ────────────────────────────────────────────────────────────────────
function TwoFATab() {
  const { user, fetchProfile } = useAuthStore();
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const startSetup = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.post("/api/auth/2fa/setup");
      setQr(data.qrDataUrl);
      setSecret(data.secret);
    } catch {
      setMsg({ type: "error", text: "Failed to start 2FA setup." });
    } finally {
      setLoading(false);
    }
  };

  const confirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { data } = await api.post("/api/auth/2fa/verify", { token: code });
      setBackupCodes(data.backupCodes);
      await fetchProfile();
      setMsg({ type: "success", text: "2FA enabled! Save your backup codes." });
      setQr("");
      setSecret("");
      setCode("");
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Invalid code.",
      });
    } finally {
      setLoading(false);
    }
  };

  const disableFA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await api.delete("/api/auth/2fa", { data: { password } });
      await fetchProfile();
      setMsg({ type: "success", text: "2FA disabled." });
      setPassword("");
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="card card-p flex items-center gap-3">
        <Shield
          className={`w-8 h-8 flex-shrink-0 ${user?.twoFactorEnabled ? "text-[var(--c-green)]" : "text-[var(--c-text3)]"}`}
        />
        <div>
          <p className="font-medium text-[var(--c-text)] text-sm">
            Two-factor authentication
          </p>
          <p className="text-xs text-[var(--c-text3)] mt-0.5">
            {user?.twoFactorEnabled
              ? "✓ Enabled — your account has an extra layer of protection"
              : "Not enabled — add an extra layer of security"}
          </p>
        </div>
        <Badge
          variant={user?.twoFactorEnabled ? "green" : "gray"}
          className="ml-auto"
        >
          {user?.twoFactorEnabled ? "On" : "Off"}
        </Badge>
      </div>
      {msg && <Alert type={msg.type} message={msg.text} />}
      {backupCodes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-semibold text-sm mb-2">
            Save these backup codes
          </p>
          <div className="grid grid-cols-2 gap-1">
            {backupCodes.map((c) => (
              <code
                key={c}
                className="text-xs text-amber-900 font-mono bg-amber-100 px-2 py-1 rounded"
              >
                {c}
              </code>
            ))}
          </div>
        </div>
      )}
      {!user?.twoFactorEnabled ? (
        !qr ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={startSetup}
            isLoading={loading}
          >
            Set up 2FA
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="text-center p-4 bg-[var(--c-surface2)] rounded-lg">
              <p className="text-xs text-[var(--c-text3)] mb-3">
                Scan with Google Authenticator or Authy
              </p>
              <img
                src={qr}
                alt="QR Code"
                className="mx-auto w-40 h-40 rounded-lg"
              />
              <p className="text-xs text-[var(--c-text3)] mt-2">
                Manual: <code className="code-inline text-xs">{secret}</code>
              </p>
            </div>
            <form onSubmit={confirmEnable} className="space-y-3">
              <Input
                label="6-digit verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                placeholder="000000"
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={loading}
              >
                Verify and enable
              </Button>
            </form>
          </div>
        )
      ) : (
        <form onSubmit={disableFA} className="space-y-3">
          <Input
            label="Enter your password to disable 2FA"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="danger" size="sm" isLoading={loading}>
            Disable 2FA
          </Button>
        </form>
      )}
    </div>
  );
}

// ── Google Maps login locations ────────────────────────────────────────────────
// Uses the Google Maps JS API — no npm install needed, loaded dynamically
declare global {
  interface Window {
    google: any;
    __googleMapsLoaded?: boolean;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.__googleMapsLoaded && window.google?.maps) {
      resolve();
      return;
    }
    // Script already in DOM (loading)
    if (document.querySelector("#gmap-script")) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(check);
          window.__googleMapsLoaded = true;
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,marker&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.__googleMapsLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
}

// Your Google Maps API key
const GMAP_API_KEY = "AIzaSyAMgSR9OKtMQzrm9zxoYTNS9rdGl3dgv1Y";

function LoginWorldMap({ sessions }: { sessions: Session[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [gmapError, setGmapError] = useState("");

  // Add useRef import — we need it here
  const located = sessions.filter((s) => s.lat !== 0 || s.lng !== 0);
  const unlocated = sessions.filter((s) => s.lat === 0 && s.lng === 0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadGoogleMaps(GMAP_API_KEY);
        if (cancelled || !mapRef.current) return;

        const { Map } = await window.google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } =
          await window.google.maps.importLibrary("marker");

        // Default center — world view
        const center =
          located.length > 0
            ? { lat: located[0].lat, lng: located[0].lng }
            : { lat: 20, lng: 0 };

        const map = new Map(mapRef.current, {
          zoom: located.length === 1 ? 6 : 2,
          center,
          mapId: "DEMO_MAP_ID",
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;

        // Clear old markers
        markersRef.current.forEach((m) => (m.map = null));
        markersRef.current = [];

        // Add a marker for each session
        // located.forEach(session => {
        //   // Colored dot element
        //   const dot = document.createElement('div');
        //   dot.style.cssText = `
        //     width: 14px; height: 14px; border-radius: 50%;
        //     background: ${session.isCurrent ? '#2563eb' : '#64748b'};
        //     border: 2.5px solid white;
        //     box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        //     cursor: pointer;
        //   `;
        //   if (session.isCurrent) {
        //     dot.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.2), 0 1px 4px rgba(0,0,0,0.4)';
        //   }

        //   const marker = new AdvancedMarkerElement({
        //     map,
        //     position: { lat: session.lat, lng: session.lng },
        //     content: dot,
        //     title: `${session.flag} ${session.city}${session.city && session.country ? ', ' : ''}${session.country}`,
        //   });

        //   // Info window on click
        //   const infoWindow = new window.google.maps.InfoWindow({
        //     content: `
        //       <div style="font-family: DM Sans, system-ui, sans-serif; font-size: 13px; line-height: 1.6; padding: 2px 4px; min-width: 160px;">
        //         <p style="font-weight: 600; margin: 0 0 4px 0; color: #0f1117;">
        //           ${session.flag} ${session.city}${session.city && session.country ? ', ' : ''}${session.country || 'Unknown'}
        //         </p>
        //         <p style="margin: 0; color: #6b7280; font-size: 12px;">${session.deviceName || `${session.browser} on ${session.os}`}</p>
        //         <p style="margin: 4px 0 0 0; font-size: 11px; color: ${session.isCurrent ? '#2563eb' : '#9ca3af'}; font-weight: 500;">
        //           ${session.isCurrent ? '● Current session' : 'Last active ' + new Date(session.lastActiveAt).toLocaleDateString()}
        //         </p>
        //       </div>
        //     `,
        //   });

        //   marker.addListener('click', () => {
        //     infoWindow.open({ anchor: marker, map });
        //   });

        //   markersRef.current.push(marker);
        // });
        // Group sessions by lat/lng to detect overlaps
        const coordKey = (s: Session) =>
          `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`;
        const coordGroups: Record<string, Session[]> = {};
        located.forEach((s) => {
          const key = coordKey(s);
          if (!coordGroups[key]) coordGroups[key] = [];
          coordGroups[key].push(s);
        });

        // Offset angle for sessions at the same location so they don't overlap
        const OFFSET_RADIUS = 0.008; // ~800m offset — invisible at zoom 2, visible at zoom 10+
        located.forEach((session) => {
          const key = coordKey(session);
          const group = coordGroups[key];
          const indexInGroup = group.indexOf(session);
          const total = group.length;

          // If only 1 session at this location — no offset needed
          // If multiple — spread them in a circle around the point
          let lat = session.lat;
          let lng = session.lng;
          if (total > 1) {
            const angle = (2 * Math.PI * indexInGroup) / total;
            lat = session.lat + OFFSET_RADIUS * Math.cos(angle);
            lng = session.lng + OFFSET_RADIUS * Math.sin(angle);
          }

          // Colored dot element
          const dot = document.createElement("div");
          dot.style.cssText = `
    width: 14px; height: 14px; border-radius: 50%;
    background: ${session.isCurrent ? "#2563eb" : "#64748b"};
    border: 2.5px solid white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    cursor: pointer;
  `;
          if (session.isCurrent) {
            dot.style.boxShadow =
              "0 0 0 4px rgba(37,99,235,0.2), 0 1px 4px rgba(0,0,0,0.4)";
          }

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat, lng },
            content: dot,
            title: `${session.flag} ${session.city}${session.city && session.country ? ", " : ""}${session.country}`,
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
      <div style="font-family: DM Sans, system-ui, sans-serif; font-size: 13px; line-height: 1.6; padding: 2px 4px; min-width: 160px;">
        <p style="font-weight: 600; margin: 0 0 4px 0; color: #0f1117;">
          ${session.flag} ${session.city}${session.city && session.country ? ", " : ""}${session.country || "Unknown"}
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 12px;">${session.deviceName || `${session.browser} on ${session.os}`}</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: ${session.isCurrent ? "#2563eb" : "#9ca3af"}; font-weight: 500;">
          ${session.isCurrent ? "● Current session" : "Last active " + new Date(session.lastActiveAt).toLocaleDateString()}
        </p>
      </div>
    `,
          });

          marker.addListener("click", () => {
            infoWindow.open({ anchor: marker, map });
          });

          markersRef.current.push(marker);
        });

        // Auto-fit bounds if multiple sessions
        if (located.length > 1) {
          const bounds = new window.google.maps.LatLngBounds();
          located.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
          map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
        }
      } catch (err) {
        if (!cancelled) setGmapError("Map could not load.");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [sessions]);

  return (
    <div className="card mb-4 overflow-hidden">
      <div className="card-header">
        <p className="card-title">Login locations</p>
        <span className="text-xs text-[var(--c-text3)]">
          Approximate — based on IP address
        </span>
      </div>

      {gmapError ? (
        <div className="p-6 text-center text-sm text-[var(--c-text3)]">
          {gmapError}
        </div>
      ) : (
        <>
          {/* Google Map container */}
          <div ref={mapRef} style={{ height: 280, width: "100%" }} />

          {/* Legend */}
          <div className="px-4 py-3 border-t border-[var(--c-border)] flex items-center gap-5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-[var(--c-text3)]">
              <span className="w-3 h-3 rounded-full bg-[var(--c-blue)] border-2 border-white shadow-sm inline-block" />
              Current session
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[var(--c-text3)]">
              <span className="w-3 h-3 rounded-full bg-slate-500 border-2 border-white shadow-sm inline-block" />
              Other sessions
            </span>
            <span className="text-xs text-[var(--c-text3)] ml-auto">
              Click a marker for details
            </span>
            {located.length === 0 && unlocated.length > 0 && (
              <span className="text-xs text-[var(--c-text3)]">
                {unlocated.length} session{unlocated.length !== 1 ? "s" : ""}{" "}
                location pending — log out and back in to refresh
              </span>
            )}
            {located.length === 0 && unlocated.length === 0 && (
              <span className="text-xs text-[var(--c-text3)]">
                No location data yet — new logins will appear here
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
// ── Sessions Tab ───────────────────────────────────────────────────────────────
function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/user/sessions");
      setSessions(data.sessions);
    } catch {
      setMsg({ type: "error", text: "Failed to load sessions." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    setMsg(null);
    try {
      await api.delete(`/api/user/sessions/${id}`);
      setSessions((p) => p.filter((s) => s.id !== id));
      setMsg({ type: "success", text: "Session signed out." });
    } catch {
      setMsg({ type: "error", text: "Failed to revoke session." });
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    setMsg(null);
    try {
      await api.delete("/api/user/sessions");
      await fetchSessions();
      setMsg({ type: "success", text: "All other sessions signed out." });
    } catch {
      setMsg({ type: "error", text: "Failed." });
    } finally {
      setRevokingAll(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-5 h-5 spinner text-[var(--c-blue)]" />
      </div>
    );

  return (
    <div className="space-y-4">
      {msg && <Alert type={msg.type} message={msg.text} />}
      <LoginWorldMap sessions={sessions} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--c-text3)]">
          {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
        </p>
        {sessions.filter((s) => !s.isCurrent).length > 0 && (
          <Button
            variant="danger"
            size="sm"
            isLoading={revokingAll}
            onClick={handleRevokeAll}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign out all others
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`card p-4 ${s.isCurrent ? "ring-1 ring-[var(--c-blue-mid)]" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[var(--c-surface2)] rounded-lg flex-shrink-0">
                <DeviceIcon
                  type={s.deviceType}
                  className="w-4 h-4 text-[var(--c-text3)]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--c-text)] truncate">
                    {s.deviceName || `${s.browser} on ${s.os}`}
                  </p>
                  {s.isCurrent && <Badge variant="blue">Current</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  {(s.city || s.country) && (
                    <span className="text-xs text-[var(--c-text3)] flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[s.flag, s.city, s.country].filter(Boolean).join(" ")}
                    </span>
                  )}
                  <span className="text-xs text-[var(--c-text3)] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(s.lastActiveAt)}
                  </span>
                  <span className="text-xs text-[var(--c-text3)]">
                    <Globe className="w-3 h-3 inline mr-0.5" />
                    Since {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {!s.isCurrent && (
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={revoking === s.id}
                  onClick={() => handleRevoke(s.id)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Revoke
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────────────────
function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    securityAlerts: true,
    loginNotifications: true,
    productUpdates: true,
    weeklyDigest: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    api
      .get("/api/user/email-preferences")
      .then(({ data }) => {
        setPrefs(data.preferences);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api.put("/api/user/email-preferences", prefs);
      setMsg({ type: "success", text: "Preferences saved." });
    } catch {
      setMsg({ type: "error", text: "Failed to save preferences." });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const items = [
    {
      key: "securityAlerts" as const,
      label: "Security alerts",
      desc: "Critical notifications about your account",
    },
    {
      key: "loginNotifications" as const,
      label: "New device sign-in",
      desc: "When a new device or location logs in",
    },
    {
      key: "productUpdates" as const,
      label: "Product updates",
      desc: "New features and improvements",
    },
    {
      key: "weeklyDigest" as const,
      label: "Weekly digest",
      desc: "Summary of your account activity",
    },
  ];

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-5 h-5 spinner text-[var(--c-blue)]" />
      </div>
    );

  return (
    <div className="space-y-4 max-w-lg">
      {msg && <Alert type={msg.type} message={msg.text} />}
      <p className="text-sm text-[var(--c-text3)]">
        Choose which emails you'd like to receive.
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.key}
            className="card p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--c-surface2)]"
            onClick={() => toggle(item.key)}
          >
            <div>
              <p className="text-sm font-medium text-[var(--c-text)]">
                {item.label}
              </p>
              <p className="text-xs text-[var(--c-text3)] mt-0.5">
                {item.desc}
              </p>
            </div>
            <div
              className={`w-10 h-5.5 rounded-full relative transition-colors flex-shrink-0 ml-4 ${prefs[item.key] ? "bg-[var(--c-blue)]" : "bg-[var(--c-border2)]"}`}
              style={{ height: 22 }}
            >
              <div
                className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform ${prefs[item.key] ? "translate-x-4" : "translate-x-0.5"}`}
                style={{ width: 18, height: 18 }}
              />
            </div>
          </div>
        ))}
      </div>
      <Button variant="primary" size="sm" onClick={save} isLoading={saving}>
        Save preferences
      </Button>
    </div>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = (searchParams.get("tab") as Tab) || "profile";
  const [tab, setTab] = useState<Tab>(initial);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
    {
      id: "2fa",
      label: "Two-factor auth",
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: <Monitor className="w-4 h-4" />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-4 h-4" />,
    },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Manage your account, security, and preferences
          </p>
        </div>
        {/* ── Tabs: horizontal scroll on mobile, vertical sidebar on md+ ── */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <aside className="md:w-44 flex-shrink-0">
            {/* Mobile: horizontal scrolling tab strip */}
            <div className="flex md:hidden overflow-x-auto gap-1 pb-1 -mx-1 px-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setSearchParams({ tab: t.id }); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                    tab === t.id
                      ? 'bg-[var(--c-blue-lt)] text-[var(--c-blue)]'
                      : 'bg-[var(--c-surface2)] text-[var(--c-text3)]'
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            {/* Desktop: vertical nav */}
            <nav className="hidden md:block space-y-0.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setSearchParams({ tab: t.id }); }}
                  className={`nav-link w-full text-left ${tab === t.id ? 'active' : ''}`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="card card-p">
              {tab === "profile" && <ProfileTab />}
              {tab === "security" && <SecurityTab />}
              {tab === "2fa" && <TwoFATab />}
              {tab === "sessions" && <SessionsTab />}
              {tab === "notifications" && <NotificationsTab />}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
