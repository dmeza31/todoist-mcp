/**
 * tools/ping.ts
 *
 * Placeholder ping tool — useful for verifying the server is reachable
 * from Claude Desktop before adding real Todoist tools.
 *
 * Transport-agnostic: no imports from src/index.ts or any transport layer.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPingTool(server: McpServer): void {
  server.registerTool(
    "ping",
    {
      description:
        "Returns 'pong'. Use this to verify the Todoist MCP server is running and reachable.",
      inputSchema: z.object({}),
    },
    async () => {
      return {
        content: [{ type: "text" as const, text: "pong" }],
      };
    }
  );
}
