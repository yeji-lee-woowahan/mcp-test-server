import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod/v4';
import { textResult } from './common.js';

export function registerSecureModule(server: McpServer) {
  server.registerTool(
    'get_my_info',
    {
      description: 'Hub가 전달한 헤더(사용자 식별/토큰)가 서버까지 도달하는지 검증용'
    },
    async extra => {
      const headers = extra.requestInfo?.headers ?? {};
      const pick = {
        userId: headers['x-user-id'],
        userRole: headers['x-user-role'],
        hasAuthorization: Boolean(headers['authorization'] ?? headers['Authorization'])
      };
      return textResult(JSON.stringify({ receivedHeaders: pick, raw: headers }, null, 2));
    }
  );

  server.registerTool(
    'get_salary_info',
    {
      description: 'HR_MANAGER 권한이 없으면 에러를 반환(Post-check)하는 검증용',
      inputSchema: { employeeId: z.string() }
    },
    async ({ employeeId }, extra) => {
      const headers = extra.requestInfo?.headers ?? {};
      const userRole = (headers['x-user-role'] ?? '') as string | string[] | undefined;
      const role = Array.isArray(userRole) ? userRole[0] : userRole;

      if (role !== 'HR_MANAGER') {
        throw new McpError(ErrorCode.InvalidRequest, 'Access Denied: HR Manager only', {
          required_role: 'HR_MANAGER',
          current_role: role
        });
      }

      return textResult(`Employee ${employeeId}: Salary $100,000`);
    }
  );

  server.registerTool(
    'external_api_call',
    {
      description: 'External MCP 연동 시 Personal Key 주입/프록시 동작 검증용',
      inputSchema: { service: z.enum(['jira', 'slack', 'google']) }
    },
    async ({ service }, extra) => {
      const headers = extra.requestInfo?.headers ?? {};
      const keyHeader = `x-personal-${service}-key`;
      const personalKey = headers[keyHeader] as string | string[] | undefined;
      const key = Array.isArray(personalKey) ? personalKey[0] : personalKey;

      if (!key) {
        throw new McpError(ErrorCode.InvalidRequest, `${service} Personal Key not found`, {
          action: 'register_key',
          service
        });
      }

      return textResult(`${service} API 호출 성공 (Key: ${key.slice(0, 4)}****)`);
    }
  );

  server.registerTool(
    'get_customer_info',
    {
      description: '민감정보 포함 원본 응답(마스킹 정책 논의/검증용)',
      inputSchema: { customerId: z.string() }
    },
    async ({ customerId }) => {
      return textResult(
        JSON.stringify(
          {
            id: customerId,
            name: '홍길동',
            phone: '010-1234-5678',
            email: 'hong@example.com',
            ssn: '900101-1234567'
          },
          null,
          2
        )
      );
    }
  );
}

