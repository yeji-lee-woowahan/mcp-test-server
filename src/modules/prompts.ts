import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';

export function registerPromptsModule(server: McpServer) {
  server.registerPrompt(
    'code_review',
    {
      description: '코드 리뷰 요청용 프롬프트 템플릿',
      argsSchema: {
        language: z.string().describe('프로그래밍 언어'),
        code: z.string().describe('리뷰할 코드')
      }
    },
    async ({ language, code }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `다음 ${language} 코드를 리뷰해주세요:\n\n\`\`\`${language}\n${code}\n\`\`\``
            }
          }
        ]
      };
    }
  );
}

