'use strict';

const BOUNDS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
const requests = new Map();   // "method|route|status" -> compteur
const errors = new Map();     // "method|route|status" -> compteur (status >= 500)
const latency = new Map();    // "method|route" -> { buckets[], sum, count }

const esc = (v) => String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
const inc = (map, key) => map.set(key, (map.get(key) || 0) + 1);

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') return next();
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = req.route ? (req.baseUrl || '') + req.route.path : 'unmatched';
    const status = res.statusCode;
    inc(requests, `${req.method}|${route}|${status}`);
    if (status >= 500) inc(errors, `${req.method}|${route}|${status}`);
    const lk = `${req.method}|${route}`;
    let h = latency.get(lk);
    if (!h) {
      h = { buckets: BOUNDS.map(() => 0), sum: 0, count: 0 };
      latency.set(lk, h);
    }
    BOUNDS.forEach((b, i) => { if (seconds <= b) h.buckets[i] += 1; });
    h.sum += seconds;
    h.count += 1;
  });
  next();
}

function render() {
  const out = [];
  out.push('# HELP http_requests_total Nombre total de requetes HTTP.');
  out.push('# TYPE http_requests_total counter');
  for (const [k, v] of requests) {
    const [m, r, s] = k.split('|');
    out.push(`http_requests_total{method="${esc(m)}",route="${esc(r)}",status="${s}"} ${v}`);
  }
  out.push('# HELP http_request_errors_total Nombre de reponses HTTP en erreur (5xx).');
  out.push('# TYPE http_request_errors_total counter');
  for (const [k, v] of errors) {
    const [m, r, s] = k.split('|');
    out.push(`http_request_errors_total{method="${esc(m)}",route="${esc(r)}",status="${s}"} ${v}`);
  }
  out.push('# HELP http_request_duration_seconds Latence des requetes HTTP en secondes.');
  out.push('# TYPE http_request_duration_seconds histogram');
  for (const [k, h] of latency) {
    const [m, r] = k.split('|');
    const lbl = `method="${esc(m)}",route="${esc(r)}"`;
    BOUNDS.forEach((b, i) => out.push(`http_request_duration_seconds_bucket{${lbl},le="${b}"} ${h.buckets[i]}`));
    out.push(`http_request_duration_seconds_bucket{${lbl},le="+Inf"} ${h.count}`);
    out.push(`http_request_duration_seconds_sum{${lbl}} ${h.sum}`);
    out.push(`http_request_duration_seconds_count{${lbl}} ${h.count}`);
  }
  return out.join('\n') + '\n';
}

function metricsHandler(req, res) {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(render());
}

module.exports = { metricsMiddleware, metricsHandler };
