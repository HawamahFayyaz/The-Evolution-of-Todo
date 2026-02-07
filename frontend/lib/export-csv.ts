import type { Task } from "@/types";

export function exportTasksCSV(tasks: Task[]) {
  const headers = ["Title", "Description", "Priority", "Status", "Due Date", "Created"];
  const rows = tasks.map((t) => [
    `"${t.title.replace(/"/g, '""')}"`,
    `"${(t.description || "").replace(/"/g, '""')}"`,
    t.priority,
    t.completed ? "Completed" : "Pending",
    t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "",
    new Date(t.createdAt).toLocaleDateString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `donext-tasks-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
