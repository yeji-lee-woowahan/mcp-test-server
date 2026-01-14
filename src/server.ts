#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { registerAll } from './register.js';

type Mode = 'stdio' | 'http';

function parseArgs(argv: string[]) {
  const mode: Mode = argv.includes('--http') ? 'http' : 'stdio';
  const portIdx = argv.indexOf('--port');
  const port = portIdx !== -1 ? Number(argv[portIdx + 1]) : 3333;
  const storePath = process.env.MCPHUB_TEST_STORE_PATH ?? '.mcphub-test-store.json';
  const assetsDir = process.env.MCPHUB_TEST_ASSETS_DIR ?? '.mcphub-test-assets';
  const host = process.env.MCPHUB_TEST_HOST ?? '127.0.0.1';
  const allowedHosts = (process.env.MCPHUB_TEST_ALLOWED_HOSTS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return { mode, port, storePath, assetsDir, host, allowedHosts };
}

function buildAuthInfoFromRequest(req: { headers?: Record<string, unknown> }): AuthInfo | undefined {
  // 명세 기반 구현 시점에 실제 AuthInfo 주입 정책을 확정한다.
  // 현재는 헤더 패스스루 케이스를 위해 requestInfo.headers를 사용하는 방식이 주 경로라, authInfo는 비워둔다.
  void req;
  return undefined;
}

function createServer() {
  return new McpServer(
    {
      name: 'mcphub-test-server',
      version: '0.1.0'
    },
    {
      capabilities: { logging: {} }
    }
  );
}

async function startStdio(storePath: string, assetsDir: string) {
  const server = createServer();
  void storePath;
  void assetsDir;
  registerAll(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('mcphub-test-server (stdio) running');
}

async function startHttp(host: string, port: number, storePath: string, assetsDir: string, allowedHosts: string[]) {
  const app =
    allowedHosts.length > 0
      ? createMcpExpressApp({ host, allowedHosts })
      : createMcpExpressApp({ host });

  // Stateless per-request server (허브/게이트웨이 테스트에 단순함이 중요해서 이 방식 채택)
  app.post('/mcp', async (req: any, res: any) => {
    const server = createServer();
    void storePath;
    void assetsDir;
    registerAll(server);

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
      });

      // attach auth info for handlers (extra.authInfo)
      (req as unknown as { auth?: AuthInfo }).auth = buildAuthInfoFromRequest(req);

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);

      res.on('close', () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null
        });
      }
    }
  });

  app.get('/mcp', async (_req: any, res: any) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null
      })
    );
  });

  app.delete('/mcp', async (_req: any, res: any) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null
      })
    );
  });

  app.get('/', async (_req: any, res: any) => {
    res.status(200).send(
      [
        'mandao-mcp-study',
        '',
        '- POST /mcp',
        '- Authorization: Bearer user=<id>;role=<role>;scopes=<...>'
      ].join('\n')
    );
  });

  app.get('/health', async (_req: any, res: any) => {
    res.status(200).json({ ok: true, ts: new Date().toISOString() });
  });

  app.listen(port, (error?: unknown) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to start server:', error);
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.log(`mcphub-test-server (http) listening on http://${host}:${port}`);
  });

  process.on('SIGINT', async () => {
    process.exit(0);
  });
}

async function main() {
  const { mode, port, storePath, assetsDir, host, allowedHosts } = parseArgs(process.argv.slice(2));
  if (mode === 'http') {
    await startHttp(host, port, storePath, assetsDir, allowedHosts);
  } else {
    await startStdio(storePath, assetsDir);
  }
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.error('Server error:', error);
  process.exit(1);
});

