# Frontend Context - Next.js Todo Application

## Overview
Next.js 16+ frontend for the Phase II todo application. Uses App Router with Better Auth for authentication.

## Tech Stack
- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with Indigo Dream design system
- **Authentication**: Better Auth (email/password)
- **Icons**: Heroicons
- **API**: Fetch-based client with JWT token injection

## Project Structure
```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page (/)
│   ├── globals.css             # Tailwind + design system
│   ├── (auth)/
│   │   ├── layout.tsx          # Auth pages layout
│   │   ├── login/page.tsx      # Login page
│   │   └── signup/page.tsx     # Signup page
│   ├── dashboard/
│   │   ├── layout.tsx          # Protected dashboard layout
│   │   ├── page.tsx            # Dashboard overview
│   │   └── tasks/page.tsx      # Task management
│   └── api/
│       └── auth/[...all]/route.ts  # Better Auth handler
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   ├── task-card.tsx           # Task display component
│   ├── task-form.tsx           # Task create/edit form
│   └── task-list.tsx           # Task list with empty state
├── lib/
│   ├── auth.ts                 # Better Auth server config
│   ├── auth-client.ts          # Better Auth client hooks
│   └── api/
│       ├── client.ts           # Base fetch wrapper
│       └── tasks.ts            # Task API functions
└── types/
    └── index.ts                # TypeScript types
```

## Key Patterns

### Server vs Client Components
```typescript
// Server Component (default) - data fetching
export default async function DashboardPage() {
  const tasks = await fetchTasks();
  return <TaskList tasks={tasks} />;
}

// Client Component - interactivity
"use client";
export function TaskForm() {
  const [title, setTitle] = useState("");
  // Interactive form logic
}
```

### Protected Routes
```typescript
// app/dashboard/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const session = await auth.api.getSession();
  if (!session) redirect("/login");
  return <>{children}</>;
}
```

### API Client Pattern
```typescript
// lib/api/client.ts
export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!response.ok) throw new ApiError(response);
  return response.json();
}
```

## Design System: Indigo Dream

### Colors (Tailwind classes)
- Primary: `bg-indigo-600`, `text-indigo-600`, `hover:bg-indigo-700`
- Success: `bg-emerald-500`, `text-emerald-500`
- Warning: `bg-amber-500`, `text-amber-500`
- Danger: `bg-red-500`, `text-red-500`
- Surface: `bg-gray-50`
- Border: `border-gray-200`

### Component Patterns
```jsx
// Primary Button
<button className="bg-indigo-600 hover:bg-indigo-700 text-white
  font-medium px-4 py-2 rounded-lg shadow-sm transition-colors">

// Card
<div className="bg-white rounded-xl shadow p-4 border border-gray-200">

// Input
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg
  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
```

## Environment Variables
- `NEXT_PUBLIC_APP_URL`: Frontend URL
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `BETTER_AUTH_SECRET`: JWT secret (must match backend)
- `DATABASE_URL`: PostgreSQL connection for Better Auth

## Running Locally
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your credentials
npm run dev
```

## Important Notes
- Always use `"use client"` directive for interactive components
- In Next.js 16+, `params` and `searchParams` are Promises
- Never expose BETTER_AUTH_SECRET to client (no NEXT_PUBLIC_ prefix)
- Clear task cache on logout to prevent data leakage
