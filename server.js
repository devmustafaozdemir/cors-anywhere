const express = require('express');
const cors_proxy = require('./lib/cors-anywhere');

// .env'den gelenler
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 8080;

// ENV listesi
function parseEnvList(env) {
  if (!env) return [];
  return env.split(',');
}

const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

const checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

// ✅ Express sunucusu oluştur
const app = express();

// ✅ Sağlık kontrolü endpoint
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// ✅ Tüm diğer istekler proxy olarak yönlendirilir
app.use('/', (req, res) => {
  cors_proxy.createServer({
    originBlacklist,
    originWhitelist,
    requireHeader: ['origin', 'x-requested-with'],
    checkRateLimit,
    removeHeaders: [
      'cookie',
      'cookie2',
      'x-request-start',
      'x-request-id',
      'via',
      'connect-time',
      'total-route-time'
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
      xfwd: false,
    },
  })(req, res);
});

// ✅ Dinlemeye başla
app.listen(port, host, () => {
  console.log(`Running custom CORS Anywhere on ${host}:${port}`);
});
