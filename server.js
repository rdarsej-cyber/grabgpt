'use strict';

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const PUBLIC_DIR = path.join(__dirname, 'public');

function serveStatic(req, res) {
  const parsedUrl = url.parse(req.url);
  let filePath = path.join(PUBLIC_DIR, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);

  // Prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function handleHealth(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}

function handleProxy(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }

    const { url: targetUrl, headers } = parsed;

    if (!targetUrl || !targetUrl.startsWith('https://chatgpt.com/')) {
      res.writeHead(400, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ error: 'url must start with https://chatgpt.com/' }));
      return;
    }

    const parsedTarget = url.parse(targetUrl);
    const options = {
      hostname: parsedTarget.hostname,
      port: parsedTarget.port || 443,
      path: parsedTarget.path,
      method: 'GET',
      headers: headers || {},
    };

    const proxyReq = https.request(options, (proxyRes) => {
      const responseHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': proxyRes.headers['content-type'] || 'application/octet-stream',
      };
      if (proxyRes.headers['retry-after']) {
        responseHeaders['retry-after'] = proxyRes.headers['retry-after'];
      }
      res.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(502, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ error: 'Proxy error' }));
      }
    });

    proxyReq.end();
  });
}

function handleOptions(req, res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  });
  res.end();
}

function createServer() {
  return http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;

    if (req.method === 'OPTIONS') {
      return handleOptions(req, res);
    }

    if (req.method === 'GET' && pathname === '/api/health') {
      return handleHealth(req, res);
    }

    if (req.method === 'POST' && pathname === '/api/proxy') {
      return handleProxy(req, res);
    }

    if (req.method === 'GET') {
      return serveStatic(req, res);
    }

    res.writeHead(405);
    res.end('Method Not Allowed');
  });
}

module.exports = { createServer };
