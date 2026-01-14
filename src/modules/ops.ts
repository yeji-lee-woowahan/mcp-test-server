import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod/v4';
import { textResult } from './common.js';

let serverStatus: 'active' | 'inactive' = 'active';
let activeRequests = 0;
let maxConcurrent = 0;

export function registerOpsModule(server: McpServer) {
  server.registerTool(
    'set_server_status',
    {
      description: '테스트를 위해 서버 상태를 active/inactive로 변경',
      inputSchema: { status: z.enum(['active', 'inactive']) }
    },
    async ({ status }) => {
      serverStatus = status;
      return textResult(JSON.stringify({ status: serverStatus }, null, 2));
    }
  );

  server.registerTool(
    'status_aware_tool',
    {
      description: '서버 상태가 inactive면 호출을 에러로 차단'
    },
    async () => {
      if (serverStatus !== 'active') {
        throw new McpError(ErrorCode.InvalidRequest, 'Server is inactive', { status: serverStatus });
      }
      return textResult(`서버 정상 동작 중 - ${new Date().toISOString()}`);
    }
  );

  server.registerTool(
    'concurrent_test',
    {
      description: '동시 호출 처리/격리 검증용',
      inputSchema: { delay: z.number() }
    },
    async ({ delay }) => {
      activeRequests++;
      maxConcurrent = Math.max(maxConcurrent, activeRequests);

      await new Promise(resolve => setTimeout(resolve, delay * 1000));

      const result = {
        activeRequests,
        maxConcurrent,
        timestamp: new Date().toISOString()
      };

      activeRequests--;
      return textResult(JSON.stringify(result, null, 2));
    }
  );
}

