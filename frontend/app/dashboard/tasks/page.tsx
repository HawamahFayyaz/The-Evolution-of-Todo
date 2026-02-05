/**
 * Tasks page - DoNext Premium.
 *
 * Main task management page with full CRUD functionality.
 */

import { TaskList } from "@/components/tasks/task-list";

export const metadata = {
  title: "My Tasks - DoNext",
  description: "Manage your tasks and stay productive",
};

export default function TasksPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
        <p className="mt-1 text-gray-600">
          Create, organize, and complete your tasks
        </p>
      </div>
      <TaskList />
    </div>
  );
}
