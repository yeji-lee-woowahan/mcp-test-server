import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod/v4';
import { textResult } from './common.js';

export function registerFaultyModule(server: McpServer) {
  server.registerTool(
    'simulate_api_error',
    {
      description: 'JSON-RPC 에러 전파/구조 보존 검증용 (soft_fail/hard_500/timeout/auth_fail)',
      inputSchema: {
        type: z.enum(['soft_fail', 'hard_500', 'timeout', 'auth_fail'])
      }
    },
    async ({ type }) => {
      if (type === 'soft_fail') {
        return { content: [{ type: 'text', text: '검색 결과가 0건입니다.' }], isError: false };
      }
      if (type === 'hard_500') {
        throw new McpError(ErrorCode.InternalError, 'Backend API Service is down (503)', {
          retry_after: 30,
          retryable: true
        });
      }
      if (type === 'auth_fail') {
        throw new McpError(ErrorCode.InvalidRequest, 'Authentication failed', {
          reason: 'token_expired',
          action: 'refresh_token'
        });
      }
      // timeout: intentionally hang (Hub timeout policy test)
      await new Promise(() => {});
      return textResult('unreachable');
    }
  );

  server.registerTool(
    'slow_operation',
    {
      description: '지정된 시간 후 완료(허브 타임아웃/취소 정책 검증용)',
      inputSchema: { seconds: z.number() }
    },
    async ({ seconds }) => {
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
      return textResult(`${seconds}초 후 완료`);
    }
  );
}

