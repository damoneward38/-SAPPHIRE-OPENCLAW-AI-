#!/usr/bin/env node
/**
 * ====================================================================
 * FIREFLY LOCAL COMPUTER BRIDGE (Node.js)
 * Full Autonomy & Remote Execution Daemon for Damone's Computer
 * ====================================================================
 * Zero npm dependencies required - uses native Node.js core modules.
 *
 * HOW TO RUN:
 *   node firefly-bridge.js
 *   node firefly-bridge.js --autonomous   (skip "say okay" confirmation)
 *   node firefly-bridge.js --port 8765
 * ====================================================================
 */

const http = require('http');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Parse CLI arguments
const args = process.argv.slice(2);
let PORT = 8765;
let MODE = 'say_okay_gate'; // 'say_okay_gate' | 'full_autonomous'

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    PORT = parseInt(args[i + 1], 10) || 8765;
  }
  if (args[i] === '--autonomous') {
    MODE = 'full_autonomous';
  }
}

// Pending command awaiting "Say Okay" confirmation
let pendingAction = null;

// Readline interface for terminal operator interactive approval
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (line) => {
  const trimmed = line.trim().toLowerCase();
  if (pendingAction) {
    if (trimmed === 'y' || trimmed === 'yes' || trimmed === 'ok' || trimmed === 'okay' || trimmed === '') {
      console.log(`\n\x1b[32m✔ Terminal Operator Confirmed "OKAY" - Executing now...\x1b[0m`);
      executePendingAction();
    } else if (trimmed === 'n' || trimmed === 'no' || trimmed === 'cancel') {
      console.log(`\n\x1b[31m✖ Action Rejected by Terminal Operator.\x1b[0m`);
      if (pendingAction.reject) {
        pendingAction.reject(new Error('Rejected by operator in terminal'));
      }
      pendingAction = null;
    }
  }
});

function executePendingAction() {
  if (!pendingAction) return;
  const act = pendingAction;
  pendingAction = null;
  act.resolve();
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-firefly-token');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function getSystemTelemetry() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname(),
    username: os.userInfo ? os.userInfo().username : process.env.USER || process.env.USERNAME || 'unknown',
    homeDir: os.homedir(),
    cpuCount: os.cpus().length,
    freeMemMb: Math.round(os.freemem() / (1024 * 1024)),
    totalMemMb: Math.round(os.totalmem() / (1024 * 1024)),
    uptimeSeconds: Math.round(os.uptime()),
    nodeVersion: process.version,
    bridgeUptime: Math.round(process.uptime())
  };
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health & Status
  if (pathname === '/health' || pathname === '/status' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      agent: 'Firefly Local Computer Bridge',
      version: '1.0.0',
      mode: MODE,
      hasPendingAction: !!pendingAction,
      pendingCommand: pendingAction ? pendingAction.command : null,
      telemetry: getSystemTelemetry(),
      ollamaProxyAvailable: true,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 1B. Ollama 3.2 Local Terminal Proxy (/ollama/* -> http://127.0.0.1:11434/*)
  if (pathname.startsWith('/ollama')) {
    const targetPath = pathname.replace(/^\/ollama/, '') || '/';
    const ollamaReq = http.request({
      hostname: '127.0.0.1',
      port: 11434,
      path: targetPath + (parsedUrl.search || ''),
      method: req.method,
      headers: {
        ...req.headers,
        host: '127.0.0.1:11434'
      }
    }, (ollamaRes) => {
      setCorsHeaders(res);
      res.writeHead(ollamaRes.statusCode, ollamaRes.headers);
      ollamaRes.pipe(res);
    });
    ollamaReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Ollama 3.2 local terminal daemon not reachable on port 11434.',
        details: err.message,
        tip: 'Run "ollama serve" or "ollama run llama3.2" in your terminal.'
      }));
    });
    req.pipe(ollamaReq);
    return;
  }

  // Helper to read JSON request body
  const readBody = () => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });

  // 2. Say Okay Confirmation Endpoint
  if (pathname === '/auth/say-okay' && req.method === 'POST') {
    try {
      const data = await readBody();
      if (!pendingAction) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'No pending action awaiting confirmation.' }));
        return;
      }

      console.log(`\n\x1b[32m✔ Voice / Browser Handshake Received "OKAY" - Executing: "${pendingAction.command}"\x1b[0m`);
      executePendingAction();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Say Okay authorization accepted! Command executing.' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 3. Mode Toggle (say_okay_gate vs full_autonomous)
  if (pathname === '/mode' && req.method === 'POST') {
    try {
      const data = await readBody();
      if (data.mode === 'full_autonomous' || data.mode === 'say_okay_gate') {
        MODE = data.mode;
        console.log(`\n\x1b[33m⚡ Firefly Bridge Mode Updated to: ${MODE.toUpperCase()}\x1b[0m`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, mode: MODE }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid mode' }));
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4. Command Execution on Local Computer
  if (pathname === '/exec' && req.method === 'POST') {
    try {
      const data = await readBody();
      const command = (data.command || '').trim();
      const cwd = data.cwd || os.homedir();
      const bypassOkay = Boolean(data.bypassOkay || data.authorized || MODE === 'full_autonomous');

      if (!command) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Command string required' }));
        return;
      }

      // If Gate Mode requires confirmation and not bypassed
      if (!bypassOkay) {
        console.log(`\n======================================================`);
        console.log(`\x1b[36m⚡ FIREFLY AUTONOMOUS REQUEST FOR DAMONE'S COMPUTER\x1b[0m`);
        console.log(`Command:  \x1b[33m${command}\x1b[0m`);
        console.log(`Directory: \x1b[90m${cwd}\x1b[0m`);
        console.log(`Status:   \x1b[35mAwaiting "Say Okay" confirmation via Voice or [ENTER] in terminal\x1b[0m`);
        console.log(`======================================================\n`);

        const confirmationPromise = new Promise((resolve, reject) => {
          pendingAction = { command, cwd, resolve, reject };
          // Auto-timeout after 90 seconds
          setTimeout(() => {
            if (pendingAction && pendingAction.command === command) {
              pendingAction = null;
              reject(new Error('Timed out waiting for "Say Okay" authorization'));
            }
          }, 90000);
        });

        // Wait for "Okay" confirmation
        try {
          await confirmationPromise;
        } catch (approvalErr) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            rejected: true,
            error: approvalErr.message
          }));
          return;
        }
      }

      // Execute on local system
      console.log(`\x1b[32m▶ Running: ${command}\x1b[0m`);
      const startTime = Date.now();

      exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        const exitCode = error ? (error.code || 1) : 0;

        console.log(`\x1b[90m✔ Finished in ${durationMs}ms with code ${exitCode}\x1b[0m`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: exitCode === 0,
          command,
          exitCode,
          stdout: stdout || '',
          stderr: stderr || (error ? error.message : ''),
          durationMs,
          timestamp: new Date().toISOString()
        }));
      });

    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 5. Open Application / File / URL
  if (pathname === '/open' && req.method === 'POST') {
    try {
      const data = await readBody();
      const target = (data.target || '').trim();
      if (!target) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Target path or app required' }));
        return;
      }

      let openCmd = '';
      const p = os.platform();
      if (p === 'darwin') {
        openCmd = `open "${target}"`;
      } else if (p === 'win32') {
        openCmd = `start "" "${target}"`;
      } else {
        openCmd = `xdg-open "${target}"`;
      }

      console.log(`\x1b[36m▶ Opening on host: ${openCmd}\x1b[0m`);
      exec(openCmd, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: `Opened: ${target}` }));
        }
      });
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 6. Local File Directory Listing
  if (pathname === '/files/list' && req.method === 'POST') {
    try {
      const data = await readBody();
      const dirPath = data.path || os.homedir();
      const resolved = path.resolve(dirPath);

      fs.readdir(resolved, { withFileTypes: true }, (err, entries) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        } else {
          const files = entries.map(e => ({
            name: e.name,
            isDirectory: e.isDirectory(),
            isFile: e.isFile()
          }));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ path: resolved, files }));
        }
      });
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.clear();
  console.log(`\x1b[36m
  ███████╗██╗██████╗ ███████╗███████╗██╗  ██╗   ██╗
  ██╔════╝██║██╔══██╗██╔════╝██╔════╝██║  ╚██╗ ██╔╝
  █████╗  ██║██████╔╝█████╗  █████╗  ██║   ╚████╔╝ 
  ██╔══╝  ██║██╔══██╗██╔══╝  ██╔══╝  ██║    ╚██╔╝  
  ██║     ██║██║  ██║███████╗██║     ███████╗██║   
  ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝   
  \x1b[0m`);
  console.log(`\x1b[1m\x1b[32m⚡ FIREFLY LOCAL COMPUTER BRIDGE ACTIVE\x1b[0m`);
  console.log(`\x1b[90m--------------------------------------------------\x1b[0m`);
  console.log(`  Local Endpoint:  \x1b[33mhttp://127.0.0.1:${PORT}\x1b[0m or \x1b[33mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  Target Host:     \x1b[37m${os.hostname()} (${os.platform()} ${os.arch()})\x1b[0m`);
  console.log(`  User Account:    \x1b[37m${os.userInfo ? os.userInfo().username : 'damone'}\x1b[0m`);
  console.log(`  Authorization:   \x1b[35m${MODE === 'say_okay_gate' ? 'Say "Okay" Confirmation Gate (Active)' : 'Full Autonomous Mode'}\x1b[0m`);
  console.log(`\x1b[90m--------------------------------------------------\x1b[0m`);
  console.log(`\x1b[32m✔ Ready for Firefly in your browser.\x1b[0m Say commands into your microphone:`);
  console.log(`  • "Hey Firefly, turn to OpenClaw"`);
  console.log(`  • "Hey Firefly, run on my computer whoami" (then say "Okay")`);
  console.log(`  • "Hey Firefly, open Visual Studio Code on my computer"\n`);
});
