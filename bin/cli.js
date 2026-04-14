#!/usr/bin/env node

const { createServer } = require('../server');
const { execFile } = require('child_process');
const net = require('net');

const DEFAULT_PORT = 3000;

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      server.close(() => resolve(startPort));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execFile('open', [url]);
    } else if (platform === 'win32') {
      execFile('cmd', ['/c', 'start', '', url]);
    } else {
      execFile('xdg-open', [url]);
    }
  } catch {
    console.log('  Open your browser to: ' + url);
  }
}

async function main() {
  const port = await findAvailablePort(DEFAULT_PORT);
  const server = createServer();

  server.listen(port, '127.0.0.1', () => {
    const url = 'http://localhost:' + port;
    console.log('\n  GrabGPT running at ' + url + '\n');
    console.log('  Press Ctrl+C to stop.\n');
    openBrowser(url);
  });

  process.on('SIGINT', () => {
    console.log('\n  Shutting down...');
    server.close(() => process.exit(0));
  });
}

main();
