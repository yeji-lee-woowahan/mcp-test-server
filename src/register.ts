import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerProtocolModule } from './modules/protocol.js';
import { registerFaultyModule } from './modules/faulty.js';
import { registerSecureModule } from './modules/secure.js';
import { registerOpsModule } from './modules/ops.js';
import { registerPromptsModule } from './modules/prompts.js';

export function registerAll(server: McpServer) {
  registerProtocolModule(server);
  registerFaultyModule(server);
  registerSecureModule(server);
  registerOpsModule(server);
  registerPromptsModule(server);
}

