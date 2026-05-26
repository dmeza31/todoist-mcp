/**
 * todoist-client.ts
 *
 * Initializes and exports the Todoist API client singleton.
 * This module is transport-agnostic: safe to import from any entrypoint
 * (stdio, HTTP, Cloudflare Workers, etc.) without pulling in transport code.
 */

import { TodoistApi } from "@doist/todoist-api-typescript";

function createTodoistClient(): TodoistApi {
  const token = process.env.TODOIST_API_TOKEN;
  if (!token) {
    throw new Error(
      "TODOIST_API_TOKEN environment variable is not set. " +
        "Add it to your .env file or pass it via the environment."
    );
  }
  return new TodoistApi(token);
}

export const todoistClient = createTodoistClient();
