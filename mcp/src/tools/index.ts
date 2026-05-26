/**
 * tools/index.ts
 *
 * Central registry: import all tool modules and call their register functions.
 * The entrypoint (src/index.ts) calls registerTools(server) once at startup.
 *
 * To add a new tool:
 *   1. Create src/tools/<your-tool>.ts and export a register<YourTool>Tool(server) function.
 *   2. Import and call it here.
 *
 * Transport-agnostic: no imports from src/index.ts or any transport layer.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPingTool } from "./ping.js";

export function registerTools(server: McpServer): void {
  registerPingTool(server);
}
