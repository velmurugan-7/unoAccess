export const RUM_SNIPPET = `
(function() {
  var CLIENT_ID = window.__UA_RUM_CLIENT || '';
  var ENDPOINT  = window.__UA_RUM_ENDPOINT || '';
  if (!CLIENT_ID || !ENDPOINT) return;

  var SESSION_ID = (sessionStorage.getItem('__ua_sid') || (function() {
    var id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('__ua_sid', id);
    return id;
  })());

  var vitals = {};
  var sent = false;

  var W = window.screen.width;
  var deviceType = W < 768 ? 'mobile' : W < 1024 ? 'tablet' : 'desktop';

  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var connectionType = conn ? (conn.effectiveType || conn.type || 'unknown') : 'unknown';

  var safePath = location.pathname.slice(0, 500);

  function send() {
    if (sent) return;
    sent = true;
    try {
      var payload = JSON.stringify({
        clientId: CLIENT_ID,
        sessionId: SESSION_ID,
        url: safePath,
        deviceType: deviceType,
        connectionType: connectionType,
        vitals: vitals
      });
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(ENDPOINT, blob);
      } else {
        fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true });
      }
    } catch(e) {}
  }

  function observe(type, cb) {
    try {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
      new PerformanceObserver(function(list) {
        list.getEntries().forEach(cb);
      }).observe({ type: type, buffered: true });
    } catch(e) {}
  }

  observe('largest-contentful-paint', function(e) {
    vitals.lcp = Math.round(e.startTime);
  });

  var clsValue = 0;
  observe('layout-shift', function(e) {
    if (!e.hadRecentInput) {
      clsValue += e.value;
      vitals.cls = Math.round(clsValue * 10000) / 10000;
    }
  });

  var inpValue = 0;
  observe('event', function(e) {
    if (e.processingStart && e.startTime) {
      var duration = e.processingStart - e.startTime + (e.duration || 0);
      if (duration > inpValue) {
        inpValue = duration;
        vitals.inp = Math.round(inpValue);
      }
    }
  });

  observe('paint', function(e) {
    if (e.name === 'first-contentful-paint') {
      vitals.fcp = Math.round(e.startTime);
    }
  });

  try {
    var navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) {
      vitals.ttfb = Math.round(navEntry.responseStart - navEntry.requestStart);
    }
  } catch(e) {}

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') send();
  });
  window.addEventListener('pagehide', send);
  setTimeout(send, 5000);
})();
`.trim();

export function getRumHtmlSnippet(clientId: string, endpoint: string): string {
  return `<script>
  (function(w,d,c,e){
    w.__UA_RUM_CLIENT=c;
    w.__UA_RUM_ENDPOINT=e;
    /* UnoAccess RUM — tracks Core Web Vitals (LCP, CLS, INP, FCP, TTFB) */
    ${RUM_SNIPPET}
  })(window,document,'${clientId}','${endpoint}/api/monitoring/rum');
</script>`.trim();
}