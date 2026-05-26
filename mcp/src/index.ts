/**
 * src/index.ts
 *
 * Entrypoint for the local stdio transport.
 *
 * This file is the ONLY place that knows about stdio transport.
 * Tool implementations live in src/tools/ and src/todoist-client.ts,
 * which are transport-agnostic and can be reused verbatim when porting
 * to Cloudflare Workers (just swap this file for an HTTP entrypoint).
 *
 * Startup order:
 *   1. Load .env
 *   2. Validate TODOIST_API_TOKEN exists (fails fast, clear error)
 *   3. Create McpServer
 *   4. Register all tools
 *   5. Connect stdio transport
 */

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";

// Validate token early so the error message is clear in MCP logs
if (!process.env.TODOIST_API_TOKEN) {
  console.error(
    "[todoist-mcp] FATAL: TODOIST_API_TOKEN is not set. " +
      "Add TODOIST_API_TOKEN=<your_token> to mcp/.env and restart."
  );
  process.exit(1);
}

const server = new McpServer({
  name: "todoist-mcp",
  version: "1.0.0",
});

// Register all tools (transport-agnostic layer)
registerTools(server);

// Top-level error handler: surface uncaught exceptions as a structured message
// rather than silently crashing the process.
process.on("uncaughtException", (err) => {
  console.error("[todoist-mcp] Uncaught exception:", err);
  // Don't exit — keep the server alive so Claude Desktop gets a proper error
  // response on the next call rather than a dead process.
});

process.on("unhandledRejection", (reason) => {
  console.error("[todoist-mcp] Unhandled rejection:", reason);
});

// Connect stdio transport and start listening
const transport = new StdioServerTransport();
await server.connect(transport);

console.error("[todoist-mcp] Server started (stdio transport). Waiting for requests.");
