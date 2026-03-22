import crypto from 'crypto';
import { Request } from 'express';
import geoip from 'geoip-lite';
// ---------------------------------------------------------------------------
// UA Parsing — pure regex, zero dependencies
// ---------------------------------------------------------------------------

interface ParsedUA {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  deviceName: string;
}

export function parseUserAgent(ua: string): ParsedUA {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', deviceType: 'unknown', deviceName: 'Unknown Device' };

  // --- Device type ---
  const isTablet = /tablet|ipad|playbook|silk/i.test(ua);
  const isMobile = !isTablet && /mobile|android|iphone|ipod|blackberry|windows phone|opera mini/i.test(ua);
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  // --- Browser ---
  let browser = 'Unknown Browser';
  if (/Edg\//i.test(ua)) {
    const v = ua.match(/Edg\/(\d+)/i)?.[1];
    browser = `Edge${v ? ' ' + v : ''}`;
  } else if (/OPR\/|Opera/i.test(ua)) {
    const v = ua.match(/OPR\/(\d+)/i)?.[1];
    browser = `Opera${v ? ' ' + v : ''}`;
  } else if (/Chrome\/(\d+)/i.test(ua) && !/Chromium/i.test(ua)) {
    const v = ua.match(/Chrome\/(\d+)/i)?.[1];
    browser = `Chrome${v ? ' ' + v : ''}`;
  } else if (/Firefox\/(\d+)/i.test(ua)) {
    const v = ua.match(/Firefox\/(\d+)/i)?.[1];
    browser = `Firefox${v ? ' ' + v : ''}`;
  } else if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)) {
    const v = ua.match(/Version\/(\d+)/i)?.[1];
    browser = `Safari${v ? ' ' + v : ''}`;
  } else if (/MSIE|Trident/i.test(ua)) {
    browser = 'Internet Explorer';
  }

  // --- OS ---
  let os = 'Unknown OS';
  if (/Windows NT 10\.0/i.test(ua)) os = 'Windows 11/10';
  else if (/Windows NT 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone OS (\d+)/i.test(ua)) {
    const v = ua.match(/iPhone OS (\d+)/i)?.[1];
    os = `iOS ${v || ''}`;
  } else if (/iPad.*OS (\d+)/i.test(ua)) {
    const v = ua.match(/OS (\d+)/i)?.[1];
    os = `iPadOS ${v || ''}`;
  } else if (/Android (\d+)/i.test(ua)) {
    const v = ua.match(/Android (\d+)/i)?.[1];
    os = `Android ${v || ''}`;
  } else if (/Mac OS X (\d+[._]\d+)/i.test(ua)) {
    const v = ua.match(/Mac OS X ([\d_.]+)/i)?.[1]?.replace(/_/g, '.');
    os = `macOS ${v || ''}`;
  } else if (/Linux/i.test(ua)) os = 'Linux';

  // --- Device Name (human friendly label) ---
  let deviceName = `${browser} on ${os}`;
  if (isMobile) {
    if (/iPhone/i.test(ua)) deviceName = `iPhone — ${browser}`;
    else if (/iPad/i.test(ua)) deviceName = `iPad — ${browser}`;
    else if (/Android/i.test(ua)) {
      const model = ua.match(/Android[^;]*;\s*([^)]+)\)/)?.[1]?.trim();
      deviceName = model ? `${model} — ${browser}` : `Android — ${browser}`;
    }
  }

  return { browser, os, deviceType, deviceName };
}

// ---------------------------------------------------------------------------
// IP extraction — respects proxy headers (X-Forwarded-For)
// ---------------------------------------------------------------------------
export function extractIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || '';
}

// ---------------------------------------------------------------------------
// IP hashing (SHA-256 + salt) — privacy safe storage
// ---------------------------------------------------------------------------
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'default-salt';
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

// ---------------------------------------------------------------------------
// Country flag emoji from ISO country code
// ---------------------------------------------------------------------------
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

// ---------------------------------------------------------------------------
// Geolocation — tries geoip-lite (optional), falls back to empty strings
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Geolocation — calls ip-api.com (free, no API key, 1000 req/min)
// Returns lat/lng so the frontend map can place markers
// ---------------------------------------------------------------------------
export async function geolocateIp(ip: string): Promise<{
  country: string; city: string; flag: string; lat: number; lng: number;
}> {
  const empty = { country: '', city: '', flag: '🌐', lat: 0, lng: 0 };

  // localhost / private IPs — use a fixed location so the map still shows something
  // We use the server's approximate location as a fallback for local dev
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    // Try to geolocate the server's own public IP so local dev still shows on map
    try {
      const res = await fetch(
        'http://ip-api.com/json/?fields=status,country,countryCode,city,lat,lon',
        { signal: AbortSignal.timeout(3000) }
      );
      if (res.ok) {
        const data = await res.json() as {
          status: string; country: string; countryCode: string;
          city: string; lat: number; lon: number;
        };
        if (data.status === 'success') {
          return {
            country: data.country || 'Local',
            city: data.city || 'Localhost',
            flag: countryCodeToFlag(data.countryCode || '') || '🏠',
            lat: data.lat || 0,
            lng: data.lon || 0,
          };
        }
      }
    } catch {
      // If even that fails, return labelled local with 0,0
    }
    return { country: 'Local', city: 'Localhost', flag: '🏠', lat: 0, lng: 0 };
  }

  try {
    // ip-api.com — free, no API key needed, called from backend (no CORS)
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return empty;

    const data = await res.json() as {
      status: string; country: string; countryCode: string;
      city: string; lat: number; lon: number;
    };

    if (data.status !== 'success') return empty;

    return {
      country: data.country || '',
      city:    data.city    || '',
      flag:    countryCodeToFlag(data.countryCode || ''),
      lat:     data.lat || 0,
      lng:     data.lon || 0,
    };
  } catch {
    return empty;
  }
}
// export async function geolocateIp(ip: string): Promise<{ country: string; city: string; flag: string }> {
//   // Skip private/loopback addresses
//   if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
//     return { country: 'Local', city: 'Localhost', flag: '🏠' };
//   }

//   try {
//     // Dynamically require geoip-lite so the app doesn't crash if it's not installed
//     // eslint-disable-next-line @typescript-eslint/no-var-requires
//     const geoip = require('geoip-lite');
//     const geo = geoip.lookup(ip);
//     if (geo) {
//       const country = geo.country || '';
//       const city = geo.city || geo.region || '';
//       const flag = countryCodeToFlag(country);
//       return { country, city, flag };
//     }
//   } catch {
//     // geoip-lite not installed — silently skip
//   }

//   return { country: '', city: '', flag: '🌐' };
// }

// ---------------------------------------------------------------------------
// Build full session metadata from a request
// ---------------------------------------------------------------------------
export async function buildSessionMeta(req: Request) {
  const ua = req.headers['user-agent'] || '';
  const ip = extractIp(req);
  const parsed = parseUserAgent(ua);
  const geo = await geolocateIp(ip);

  return {
    ...parsed,
    userAgent: ua.slice(0, 500),
    ipHash: hashIp(ip),
    ipRaw: ip,
    country: geo.country,
    city: geo.city,
    flag: geo.flag,
    lat: geo.lat,   // ← new
    lng: geo.lng,   // ← new
    lastActiveAt: new Date(),
  };
}
// export async function buildSessionMeta(req: Request) {
//   const ua = req.headers['user-agent'] || '';
//   const ip = extractIp(req);
//   const parsed = parseUserAgent(ua);
//   const geo = await geolocateIp(ip);

//   return {
//     ...parsed,
//     userAgent: ua.slice(0, 500),
//     ipHash: hashIp(ip),
//     ipRaw: ip,
//     ...geo,
//     lastActiveAt: new Date(),
//   };
// }


// New function
export function getGeoFromIp(ip: string): { lat: number; lng: number; country: string; city: string } | null {
  const geo = geoip.lookup(ip);
  if (!geo) return null;
  return {
    lat: geo.ll[0],
    lng: geo.ll[1],
    country: geo.country,
    city: geo.city || 'Unknown',
  };
}

