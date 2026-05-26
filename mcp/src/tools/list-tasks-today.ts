/**
 * tools/list-tasks-today.ts
 *
 * Tool: list_tasks_today
 * Fetches all tasks due today from Todoist and returns them as structured JSON.
 *
 * Transport-agnostic: no imports from src/index.ts or any transport layer.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { todoistClient } from "../todoist-client.js";

/** Fetch ALL pages of a paginated Todoist endpoint. */
async function fetchAllTaskPages(query: string): Promise<import("@doist/todoist-api-typescript").Task[]> {
  const tasks: import("@doist/todoist-api-typescript").Task[] = [];
  let cursor: string | null = null;

  do {
    const response = await todoistClient.getTasksByFilter({
      query,
      cursor,
      limit: 200,
    });
    tasks.push(...response.results);
    cursor = response.nextCursor;
  } while (cursor);

  return tasks;
}

/** Build a project-id → name lookup map (fetches all pages). */
async function buildProjectMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let cursor: string | null = null;

  do {
    const response = await todoistClient.getProjects({ cursor, limit: 200 });
    for (const project of response.results) {
      map.set(project.id, project.name);
    }
    cursor = response.nextCursor;
  } while (cursor);

  return map;
}

export function registerListTasksTodayTool(server: McpServer): void {
  server.registerTool(
    "list_tasks_today",
    {
      description:
        "Fetch all Todoist tasks due today. Returns task id, content, due date/time, " +
        "priority (1=normal … 4=urgent), project name, and labels. " +
        "Call this first when the user asks what's on their plate today.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const [tasks, projectMap] = await Promise.all([
          fetchAllTaskPages("today"),
          buildProjectMap(),
        ]);

        const result = tasks.map((task) => ({
          id: task.id,
          content: task.content,
          description: task.description || undefined,
          due_date: task.due?.date ?? null,
          due_datetime: task.due?.datetime ?? null,
          due_string: task.due?.string ?? null,
          is_recurring: task.due?.isRecurring ?? false,
          priority: task.priority, // 1=normal, 2=medium, 3=high, 4=urgent
          project_id: task.projectId,
          project_name: projectMap.get(task.projectId) ?? "Unknown Project",
          labels: task.labels,
          parent_id: task.parentId ?? null,
        }));

        // Sort: highest priority first, then alphabetically by content
        result.sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return a.content.localeCompare(b.content);
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  date: new Date().toISOString().split("T")[0],
                  count: result.length,
                  tasks: result,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: true,
                message,
                hint: "Check that TODOIST_API_TOKEN is set correctly and your network is reachable.",
              }),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
