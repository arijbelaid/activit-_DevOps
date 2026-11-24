'use strict';

const { AsyncLocalStorage } = require('node:async_hooks');
const { randomUUID } = require('node:crypto');

const HEADER = 'x-correlation-id';
const VALID = /^[A-Za-z0-9_-]{8,64}$/;
const storage = new AsyncLocalStorage();

// Console d'origine, utilisee pour la ligne de log de requete (pas de double prefixe).
const rawLog = console.log.bind(console);

// Tous les console.* de l'API portent l'identifiant de la requete en cours.
for (const level of ['log', 'info', 'warn', 'error']) {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    const store = storage.getStore();
    original(...(store ? [`[cid=${store.id}]`, ...args] : args));
  };
}

function correlationMiddleware(req, res, next) {
  if (req.path === '/metrics') return next();

  const incoming = req.get(HEADER);
  const fromFrontend = Boolean(incoming && VALID.test(incoming));
  const id = fromFrontend ? incoming : randomUUID();

  req.correlationId = id;
  res.set('X-Correlation-ID', id);

  storage.run({ id }, () => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      rawLog(
        JSON.stringify({
          msg: 'request',
          correlationId: id,
          source: fromFrontend ? 'frontend' : 'generated',
          method: req.method,
          path: req.originalUrl.split('?')[0],
          status: res.statusCode,
          durationMs: Math.round((Number(process.hrtime.bigint() - start) / 1e6) * 10) / 10,
        })
      );
    });
    next();
  });
}

module.exports = { correlationMiddleware };
