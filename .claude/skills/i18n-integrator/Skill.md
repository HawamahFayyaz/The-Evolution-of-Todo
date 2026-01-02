---
name: i18n-integrator
description: Add multi-language support (English + Urdu) to Next.js application with RTL support
---

# I18n Integrator Skill

## Purpose
Add internationalization (i18n) to support multiple languages, specifically English and Urdu, with proper right-to-left (RTL) text rendering for Urdu.

## Core Principles
1. **No Hardcoded Strings**: All UI text through translation keys
2. **RTL Support**: Proper text direction for Urdu
3. **Fallback Language**: English as default
4. **Type Safety**: TypeScript types for translation keys
5. **Easy to Extend**: Add new languages easily

## When to Use
- Phase II+: Adding Urdu support (+100 bonus points)
- Supporting international users
- Building accessible applications
- Meeting localization requirements

## Install next-intl
```bash
cd frontend
npm install next-intl
```

## Configuration

### 1. Create i18n Config
```typescript
// i18n/config.ts
export const locales = ['en', 'ur'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ur: 'اردو'
};
```

### 2. Create Translation Files
```json
// messages/en.json
{
  "common": {
    "app_name": "Todo App",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout",
    "signup": "Sign Up",
    "email": "Email",
    "password": "Password",
    "forgot_password": "Forgot Password?",
    "no_account": "Don't have an account?",
    "have_account": "Already have an account?"
  },
  "tasks": {
    "title": "Tasks",
    "add_task": "Add Task",
    "task_title": "Task Title",
    "task_description": "Description",
    "mark_complete": "Mark Complete",
    "delete_task": "Delete",
    "edit_task": "Edit",
    "due_date": "Due Date",
    "status": "Status",
    "pending": "Pending",
    "completed": "Completed",
    "no_tasks": "No tasks yet. Add one to get started!",
    "task_created": "Task created successfully",
    "task_updated": "Task updated successfully",
    "task_deleted": "Task deleted successfully"
  },
  "filters": {
    "all": "All",
    "active": "Active",
    "completed": "Completed",
    "filter_by": "Filter by"
  },
  "errors": {
    "required_field": "This field is required",
    "invalid_email": "Invalid email address",
    "password_too_short": "Password must be at least 8 characters",
    "network_error": "Network error. Please try again.",
    "unauthorized": "Please log in to continue"
  }
}
```
```json
// messages/ur.json
{
  "common": {
    "app_name": "ٹوڈو ایپ",
    "loading": "لوڈ ہو رہا ہے...",
    "error": "خرابی",
    "success": "کامیابی"
  },
  "auth": {
    "login": "لاگ ان",
    "logout": "لاگ آؤٹ",
    "signup": "سائن اپ",
    "email": "ای میل",
    "password": "پاس ورڈ",
    "forgot_password": "پاس ورڈ بھول گئے؟",
    "no_account": "اکاؤنٹ نہیں ہے؟",
    "have_account": "پہلے سے اکاؤنٹ ہے؟"
  },
  "tasks": {
    "title": "کام",
    "add_task": "کام شامل کریں",
    "task_title": "کام کا عنوان",
    "task_description": "تفصیل",
    "mark_complete": "مکمل کریں",
    "delete_task": "حذف کریں",
    "edit_task": "ترمیم کریں",
    "due_date": "آخری تاریخ",
    "status": "حیثیت",
    "pending": "زیر التواء",
    "completed": "مکمل",
    "no_tasks": "ابھی تک کوئی کام نہیں۔ شروع کرنے کے لیے ایک شامل کریں!",
    "task_created": "کام کامیابی سے بنایا گیا",
    "task_updated": "کام کامیابی سے اپ ڈیٹ ہوا",
    "task_deleted": "کام کامیابی سے حذف ہوا"
  },
  "filters": {
    "all": "تمام",
    "active": "فعال",
    "completed": "مکمل",
    "filter_by": "فلٹر کریں"
  },
  "errors": {
    "required_field": "یہ فیلڈ ضروری ہے",
    "invalid_email": "غلط ای میل ایڈریس",
    "password_too_short": "پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے",
    "network_error": "نیٹ ورک خرابی۔ دوبارہ کوشش کریں۔",
    "unauthorized": "جاری رکھنے کے لیے لاگ ان کریں"
  }
}
```

### 3. Next.js Configuration
```typescript
// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other config
};

export default withNextIntl(nextConfig);
```

### 4. i18n Request Configuration
```typescript
// i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookie or default to 'en'
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

### 5. Root Layout with i18n Provider
```tsx
// app/layout.tsx
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {cookies} from 'next/headers';

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ur' ? 'rtl' : 'ltr'}>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## Language Switcher Component
```tsx
// components/LanguageSwitcher.tsx
"use client";

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Cookies from 'js-cookie';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('common');

  function switchLocale(newLocale: string) {
    startTransition(() => {
      // Set cookie
      Cookies.set('NEXT_LOCALE', newLocale, { expires: 365 });

      // Refresh to apply new locale
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => switchLocale('en')}
        disabled={locale === 'en' || isPending}
        className={`px-3 py-1 rounded ${
          locale === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        English
      </button>
      <button
        onClick={() => switchLocale('ur')}
        disabled={locale === 'ur' || isPending}
        className={`px-3 py-1 rounded ${
          locale === 'ur'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        اردو
      </button>
    </div>
  );
}
```

## Using Translations in Components
```tsx
// components/TaskList.tsx
"use client";

import { useTranslations } from 'next-intl';

export function TaskList({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('tasks');

  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {t('no_tasks')}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t('title')}</h2>
      {tasks.map((task) => (
        <div key={task.id} className="border p-4 rounded mb-2">
          <h3 className="font-semibold">{task.title}</h3>
          <p className="text-gray-600">{task.description}</p>
          <div className="mt-2 flex gap-2">
            <button className="text-blue-600">
              {t('edit_task')}
            </button>
            <button className="text-red-600">
              {t('delete_task')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## RTL Styling for Urdu
```css
/* globals.css */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .flex {
  flex-direction: row-reverse;
}

[dir="rtl"] .ml-2 {
  margin-left: 0;
  margin-right: 0.5rem;
}

[dir="rtl"] .mr-2 {
  margin-right: 0;
  margin-left: 0.5rem;
}

/* Urdu font */
[lang="ur"] {
  font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
}
```

## Tailwind CSS RTL Plugin
```bash
npm install tailwindcss-rtl
```
```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
```

## Common Mistakes ❌

| Mistake | Fix |
|---------|-----|
| ❌ Hardcoded strings in JSX | ✅ Use `t('key')` for all text |
| ❌ No RTL support | ✅ Set `dir="rtl"` for Urdu |
| ❌ Missing translations | ✅ Ensure all keys exist in both en.json and ur.json |
| ❌ Incorrect Urdu font | ✅ Use Nastaliq font for Urdu |
| ❌ Not handling plurals | ✅ Use next-intl's plural support |

## Usage Instructions

### Set Up i18n
@.claude/skills/i18n-integrator/Skill.md
Set up next-intl for English and Urdu support.
Include:

Configuration files
Translation JSON files (en.json, ur.json)
Language switcher component
RTL CSS for Urdu
Root layout with i18n provider

Save to: frontend/
