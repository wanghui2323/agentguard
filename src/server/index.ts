import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { SecurityScanner } from '../core/scanner';
import { AutoFixer } from '../core/fixer';
import { AgentController } from '../core/controller';

const PORT = 3000;
const scanner = new SecurityScanner();
const fixer = new AutoFixer();
const controller = new AgentController();

// MIME types
const mimeTypes: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml'
};

function serveStaticFile(filePath: string, res: http.ServerResponse) {
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'text/plain';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

async function handleApiRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = req.url || '';

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    if (url === '/api/scan' && req.method === 'GET') {
      // Scan all agents
      const report = await scanner.scanAll();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(report));
    } else if (url.startsWith('/api/fix/') && req.method === 'POST') {
      // Fix specific agent
      const agentId = url.split('/')[3];
      const report = await scanner.scanAll();
      const agentResult = report.agents.find(a => a.agent.id === agentId);

      if (!agentResult) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Agent not found' }));
        return;
      }

      const detector = (scanner as any)['detectors'].find((d: { id: string }) => d.id === agentId);
      const fixResults = [];

      for (const issue of agentResult.issues) {
        if (issue.autoFixable) {
          const result = await fixer.fixIssue(issue, detector);
          fixResults.push(result);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, fixes: fixResults }));
    } else if (url.startsWith('/api/stop/') && req.method === 'POST') {
      // Stop agent
      const agentId = url.split('/')[3];
      await controller.stop(agentId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else if (url.startsWith('/api/restart/') && req.method === 'POST') {
      // Restart agent
      const agentId = url.split('/')[3];
      await controller.restart(agentId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else if (url === '/api/status' && req.method === 'GET') {
      // Get status of all agents
      const statuses = await controller.getStatus();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(statuses));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
  } catch (error: any) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url.startsWith('/api/')) {
    handleApiRequest(req, res);
  } else {
    // Serve static files
    let filePath = path.join(__dirname, '../../web', url === '/' ? 'index.html' : url);
    serveStaticFile(filePath, res);
  }
});

server.listen(PORT, () => {
  console.log(`╔═══════════════════════════════════════════════╗`);
  console.log(`║                                               ║`);
  console.log(`║   🛡️  AgentGuard Web UI 已启动               ║`);
  console.log(`║                                               ║`);
  console.log(`║   访问: http://localhost:${PORT}               ║`);
  console.log(`║                                               ║`);
  console.log(`╚═══════════════════════════════════════════════╝`);
});

export { server };
