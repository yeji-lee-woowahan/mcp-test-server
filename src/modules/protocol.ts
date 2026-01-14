import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { textResult } from './common.js';

export function registerProtocolModule(server: McpServer) {
  // 1) provision_cloud_resource (complex JSON schema / dynamic UI)
  const CloudProvider = z.enum(['aws', 'gcp', 'azure']);
  const ResourceType = z.enum(['vm', 'storage', 'database']);

  server.registerTool(
    'provision_cloud_resource',
    {
      description: '복잡한 JSON Schema(ENUM/ARRAY/NESTED)를 프론트까지 전달하는지 검증용',
      inputSchema: {
        provider: CloudProvider.describe('클라우드 제공자 선택'),
        resourceType: ResourceType.describe('생성할 리소스 유형'),
        tags: z.array(z.string()).describe('리소스에 적용할 태그 목록'),
        options: z
          .object({
            region: z.string().describe('배포 리전'),
            autoScaling: z.boolean().describe('오토스케일링 활성화 여부')
          })
          .describe('상세 옵션')
      }
    },
    async args => {
      const result = {
        success: true,
        message: `${args.provider} ${args.resourceType} 리소스 프로비저닝 요청 완료`,
        request: args
      };
      return textResult(JSON.stringify(result, null, 2));
    }
  );

  // 2) get_server_metrics_chart (binary/image content)
  server.registerTool(
    'get_server_metrics_chart',
    {
      description: '이미지(base64 png) + 텍스트 content 혼합 전달 검증용',
      inputSchema: {
        serverId: z.string()
      }
    },
    async ({ serverId }) => {
      // 1x1 투명 PNG
      const base64Png =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6q3h0AAAAASUVORK5CYII=';

      return {
        content: [
          { type: 'image', data: base64Png, mimeType: 'image/png' },
          { type: 'text', text: `서버 ${serverId}의 메트릭 차트입니다. (CPU: 45%, Memory: 62%, Disk: 38%)` }
        ]
      };
    }
  );
}

