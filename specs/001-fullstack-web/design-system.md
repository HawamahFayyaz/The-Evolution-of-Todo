# Design System: DoNext Premium Web Application

**Feature**: 001-fullstack-web
**Created**: 2026-01-15
**Updated**: 2026-01-23
**Status**: Active
**Version**: 2.0.0

## Overview

This document defines the premium visual design system for the DoNext web application. It establishes consistent patterns for branding, colors, typography, spacing, components, interactions, and accessibility. The design philosophy is **premium, modern, and professional** - inspired by Linear, Notion, and Vercel.

---

## Branding

### App Identity

| Property | Value |
|----------|-------|
| **App Name** | DoNext |
| **Tagline** | "Do what matters, next." |
| **Design Philosophy** | Premium, modern, professional |

### Logo Design: DN Monogram

```
┌──────────────┐
│              │
│     DN       │  ← White text, font-bold, text-xl
│              │
└──────────────┘
   ↑ Gradient background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
   ↑ Rounded square (rounded-lg)
   ↑ Shadow: shadow-lg for depth
```

### Logo Sizes

| Context | Size | Usage |
|---------|------|-------|
| Landing page | 48x48px | Top-left header |
| Dashboard | 40x40px | Top-left navigation |
| Auth pages | 64x64px | Center above form |
| Favicon | 32x32px | Browser tab |

### Logo Component

```tsx
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg"
      style={{ width: size, height: size }}
    >
      <span style={{ fontSize: size * 0.4 }}>DN</span>
    </div>
  );
}
```

---

## Color Palette: "Indigo Dream"

### Primary Brand Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Brand | `#4F46E5` | `indigo-600` | Main buttons, links, active states |
| Brand Light | `#6366F1` | `indigo-500` | Hover states, gradients |
| Brand Dark | `#4338CA` | `indigo-700` | Pressed states |
| Accent | `#764ba2` | Custom | Gradient endpoints |

### Semantic Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Success | `#10B981` | `emerald-500` | Completed tasks, success messages |
| Warning | `#F59E0B` | `amber-500` | Pending tasks, warnings |
| Danger | `#EF4444` | `red-500` | Overdue, delete actions, errors |
| Info | `#3B82F6` | `blue-500` | Information, low priority |

### Neutral Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Background | `#F9FAFB` | `gray-50` | Page background |
| Surface | `#FFFFFF` | `white` | Card backgrounds |
| Elevated | `#F3F4F6` | `gray-100` | Hover states |
| Border | `#E5E7EB` | `gray-200` | Dividers, input borders |
| Border Hover | `#D1D5DB` | `gray-300` | Interactive borders |
| Text Primary | `#111827` | `gray-900` | Headings, important text |
| Text Secondary | `#6B7280` | `gray-500` | Body text, descriptions |
| Text Muted | `#9CA3AF` | `gray-400` | Helper text, timestamps |

### Shadows

| Name | Value | Tailwind | Usage |
|------|-------|----------|-------|
| Card | `0 1px 2px rgba(0,0,0,0.05)` | `shadow-sm` | Default card state |
| Card Hover | `0 4px 6px rgba(0,0,0,0.1)` | `shadow-md` | Hovered cards |
| Modal | `0 20px 25px rgba(0,0,0,0.1)` | `shadow-xl` | Modal dialogs |
| Glow | `0 10px 30px rgba(79,70,229,0.3)` | Custom | Primary button glow |

### Gradients

| Name | Value | Usage |
|------|-------|-------|
| Brand Gradient | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` | Logo, hero text, premium badges |
| Button Gradient | `bg-gradient-to-r from-indigo-600 to-purple-600` | Primary buttons |
| Card Border | `linear-gradient(135deg, #667eea, #764ba2)` | Stat card hover borders |

---

## Typography

### Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Import via Google Fonts:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
```

### Type Scale

| Name | Size | Line Height | Weight | Tailwind | Usage |
|------|------|-------------|--------|----------|-------|
| Display | 48px | 1.1 | 800 | `text-5xl font-extrabold` | Hero headings |
| H1 | 36px | 1.2 | 700 | `text-4xl font-bold` | Page titles |
| H2 | 30px | 1.25 | 700 | `text-3xl font-bold` | Major sections |
| H3 | 24px | 1.3 | 600 | `text-2xl font-semibold` | Section headers |
| H4 | 20px | 1.4 | 600 | `text-xl font-semibold` | Card titles |
| Body | 16px | 1.5 | 400 | `text-base` | Default text |
| Body SM | 14px | 1.5 | 500 | `text-sm font-medium` | Labels |
| Caption | 12px | 1.4 | 400 | `text-xs` | Timestamps, helper text |

### Font Weights

| Weight | Tailwind | Usage |
|--------|----------|-------|
| 300 | `font-light` | Large display text |
| 400 | `font-normal` | Body text |
| 500 | `font-medium` | Labels, navigation |
| 600 | `font-semibold` | Card titles, buttons |
| 700 | `font-bold` | Page titles |
| 800 | `font-extrabold` | Hero text |

---

## Spacing System

Based on 4px grid using Tailwind scale:

| Name | Value | Tailwind | Usage |
|------|-------|----------|-------|
| xs | 4px | `gap-1` | Icon gaps |
| sm | 8px | `gap-2` | Button padding |
| md | 16px | `gap-4` | Form field gaps, card padding |
| lg | 24px | `gap-6` | Section padding |
| xl | 32px | `gap-8` | Section gaps |
| 2xl | 48px | `gap-12` | Large separations |

### Container Widths

| Name | Width | Tailwind | Usage |
|------|-------|----------|-------|
| sm | 384px | `max-w-sm` | Auth forms |
| md | 448px | `max-w-md` | Modals |
| 2xl | 672px | `max-w-2xl` | Content areas |
| 4xl | 896px | `max-w-4xl` | Chat interface |
| 7xl | 1280px | `max-w-7xl` | Main layout |

---

## Component Patterns

### Buttons

#### Primary Button (Premium Gradient)

```jsx
<button className="bg-gradient-to-r from-indigo-600 to-purple-600
  hover:from-indigo-700 hover:to-purple-700
  text-white font-semibold px-4 py-2 rounded-lg
  shadow-lg hover:shadow-xl
  transform hover:-translate-y-0.5
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
  Button Text
</button>
```

#### Secondary Button

```jsx
<button className="bg-white border border-gray-300
  hover:bg-gray-50 hover:border-gray-400
  text-gray-700 font-medium px-4 py-2 rounded-lg
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
  Secondary
</button>
```

#### Danger Button

```jsx
<button className="bg-red-600 hover:bg-red-700
  text-white font-semibold px-4 py-2 rounded-lg
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
  Delete
</button>
```

#### Ghost Button

```jsx
<button className="text-indigo-600 hover:text-indigo-700
  hover:bg-indigo-50
  font-medium px-3 py-1.5 rounded-lg
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-indigo-500">
  Link Button
</button>
```

#### Button Sizes

| Size | Padding | Font | Tailwind |
|------|---------|------|----------|
| Small | 6px 12px | 14px | `px-3 py-1.5 text-sm` |
| Medium | 8px 16px | 16px | `px-4 py-2 text-base` |
| Large | 12px 24px | 18px | `px-6 py-3 text-lg` |

### Cards

#### Basic Card (Enhanced)

```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6
  hover:shadow-md hover:-translate-y-1 hover:border-indigo-200
  transition-all duration-300">
  {/* Card content */}
</div>
```

#### Stat Card (Premium with Gradient Border)

```jsx
<div className="bg-white rounded-xl p-6 border-2 border-transparent
  hover:border-indigo-500
  transition-all duration-300 cursor-pointer
  relative overflow-hidden gradient-border">
  <div className="text-3xl mb-2">📋</div>
  <div className="text-4xl font-bold text-gray-900">24</div>
  <div className="text-sm text-gray-600 uppercase tracking-wide">Total Tasks</div>
  <div className="text-sm font-semibold text-emerald-600 mt-2">↑ 12%</div>
</div>
```

#### Task Card (Enhanced)

```jsx
<div className="bg-white rounded-lg p-5 border border-gray-200
  hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5
  transition-all duration-200 cursor-pointer">
  <div className="flex items-start gap-4">
    {/* Custom checkbox */}
    <div className="w-6 h-6 border-2 border-gray-300 rounded-md
      hover:border-indigo-500 transition-all cursor-pointer
      flex items-center justify-center">
      {/* Checkmark when checked */}
    </div>

    <div className="flex-1">
      <h3 className="text-lg font-semibold text-gray-900">Task Title</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mt-1">Description...</p>

      {/* Metadata row */}
      <div className="flex items-center gap-3 mt-3">
        <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-red-200">
          High
        </span>
        <span className="text-xs text-gray-500">📅 Due tomorrow</span>
      </div>
    </div>

    {/* Actions menu */}
    <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100">
      ⋮
    </button>
  </div>
</div>
```

### Form Inputs

#### Text Input (Enhanced)

```jsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Email
  </label>
  <input type="email"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg
      placeholder:text-gray-400
      focus:ring-2 focus:ring-indigo-500 focus:border-transparent
      transition-all duration-200"
    placeholder="you@example.com" />
</div>
```

#### Input with Error

```jsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
    Email <span className="text-red-500">⚠</span>
  </label>
  <input type="email"
    className="w-full px-3 py-2 border border-red-500 rounded-lg
      focus:ring-2 focus:ring-red-500 focus:border-transparent
      text-red-900 transition-all"
    placeholder="you@example.com" />
  <p className="text-sm text-red-600 flex items-center gap-1">
    Please enter a valid email address
  </p>
</div>
```

### Custom Checkbox (Premium)

```jsx
{/* Unchecked */}
<div className="w-6 h-6 border-2 border-gray-300 rounded-md
  cursor-pointer hover:border-indigo-500
  transition-all duration-200">
</div>

{/* Checked */}
<div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600
  border-indigo-500 rounded-md
  flex items-center justify-center
  transform scale-105 transition-all duration-200">
  <span className="text-white font-bold text-sm">✓</span>
</div>
```

### Badges

#### Priority Badges (Enhanced with ring)

```jsx
{/* High Priority */}
<span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full
  text-xs font-semibold ring-1 ring-red-200">
  High
</span>

{/* Medium Priority */}
<span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full
  text-xs font-semibold ring-1 ring-amber-200">
  Medium
</span>

{/* Low Priority */}
<span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full
  text-xs font-semibold ring-1 ring-blue-200">
  Low
</span>
```

#### Status Badges

```jsx
{/* Completed */}
<span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full
  text-xs font-medium">
  Completed
</span>

{/* Pending */}
<span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full
  text-xs font-medium">
  Pending
</span>
```

#### Animated Hero Badge (Premium)

```jsx
<span className="bg-gradient-to-r from-indigo-500 to-purple-600
  text-white px-4 py-2 rounded-full
  text-xs font-bold uppercase tracking-wide
  shadow-lg animate-float">
  🎯 SMART TODO MANAGEMENT
</span>
```

### Progress Bar (Enhanced)

```jsx
<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600
    rounded-full transition-all duration-500"
    style={{ width: '65%' }}>
  </div>
</div>
```

### Tab Navigation (Premium)

```jsx
<div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
  <button className="px-4 py-2 rounded-md font-semibold
    bg-white text-indigo-600 shadow-sm">
    All (24)
  </button>
  <button className="px-4 py-2 rounded-md font-medium
    text-gray-600 hover:text-gray-900 hover:bg-gray-50
    transition-all cursor-pointer">
    Active (12)
  </button>
  <button className="px-4 py-2 rounded-md font-medium
    text-gray-600 hover:text-gray-900 hover:bg-gray-50
    transition-all cursor-pointer">
    Completed (12)
  </button>
</div>
```

### Toast Notifications (Premium)

```jsx
{/* Success Toast */}
<div className="fixed top-4 right-4 z-50
  bg-emerald-50 border border-emerald-200 text-emerald-800
  px-4 py-3 rounded-lg shadow-lg
  flex items-center gap-2
  animate-slide-in-right">
  <span>✓</span>
  Task completed successfully
  <button className="ml-2 text-emerald-600 hover:text-emerald-800">✕</button>
</div>

{/* Error Toast */}
<div className="fixed top-4 right-4 z-50
  bg-red-50 border border-red-200 text-red-800
  px-4 py-3 rounded-lg shadow-lg
  flex items-center gap-2
  animate-slide-in-right">
  <span>✕</span>
  Failed to save task
  <button className="ml-2 text-red-600 hover:text-red-800">✕</button>
</div>
```

---

## Page Layouts

### Landing Page (/) - Premium

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [DN] DoNext          Features   Pricing   About    [Sign In] [Get Started]  │  ← Fixed header with glassmorphism
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                     🎯 SMART TODO MANAGEMENT                            │  ← Animated gradient badge
│                          (floating animation)                           │
│                                                                         │
│                   Do What Matters, Next                                 │  ← Gradient text (text-5xl font-extrabold)
│                                                                         │
│           AI-powered task management that adapts to your workflow       │  ← text-xl text-gray-600
│                                                                         │
│                [Start for free]  [Watch demo →]                         │  ← Gradient button + ghost button
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │  ← Feature cards with hover lift
│    │       💬        │  │       📊        │  │       🔔        │       │
│    │    AI Chat      │  │   Analytics     │  │ Smart Reminders │       │
│    │   Natural       │  │   Track your    │  │   Never miss    │       │
│    │   language      │  │   productivity  │  │   important     │       │
│    │   task mgmt     │  │   and progress  │  │   deadlines     │       │
│    └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│             About · Privacy · Terms · Contact                           │  ← Footer (bg-gray-50)
│                  © 2025 DoNext. All rights reserved.                    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Header Styling:**
```jsx
<header className="fixed top-0 w-full z-50
  bg-white/80 backdrop-blur-lg shadow-sm">
  <nav className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
    {/* Logo + Nav + Actions */}
  </nav>
</header>
```

### Auth Pages (/signup, /login) - Enhanced

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                                                                         │
│                            ┌──────────┐                                 │
│                            │    DN    │  ← 64x64px logo                 │
│                            └──────────┘                                 │
│                                                                         │
│                 ┌─────────────────────────────────────┐                 │
│                 │                                     │                 │  ← Card: bg-white rounded-2xl
│                 │         Create an account           │                 │     shadow-xl border-gray-100 p-8
│                 │    Start organizing your tasks      │                 │
│                 │                                     │                 │
│                 │    Name                             │                 │
│                 │    ┌─────────────────────────────┐  │                 │
│                 │    │ John Doe                    │  │                 │
│                 │    └─────────────────────────────┘  │                 │
│                 │                                     │                 │
│                 │    Email                            │                 │
│                 │    ┌─────────────────────────────┐  │                 │
│                 │    │ john@example.com            │  │                 │
│                 │    └─────────────────────────────┘  │                 │
│                 │                                     │                 │
│                 │    Password                         │                 │
│                 │    ┌─────────────────────────────┐  │                 │
│                 │    │ ••••••••                    │  │                 │
│                 │    └─────────────────────────────┘  │                 │
│                 │                                     │                 │
│                 │    ┌─────────────────────────────┐  │                 │
│                 │    │      Create account         │  │  ← Gradient button, full width
│                 │    └─────────────────────────────┘  │                 │
│                 │                                     │                 │
│                 │    Already have an account? Sign in │                 │
│                 │                                     │                 │
│                 └─────────────────────────────────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dashboard (/dashboard) - Premium

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [DN] Dashboard    Tasks         [Avatar] John ▼  [Logout]              │  ← Sticky header with shadow-sm
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Good morning, John! 👋                                                 │  ← text-2xl font-bold
│  You have 4 tasks pending today                                         │  ← text-gray-600
│                                                                         │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │  ← Stat cards with gradient borders
│  │ 📋                │  │ ✅                │  │ ⏰                │   │
│  │                   │  │                   │  │                   │   │
│  │     24            │  │     18            │  │      6            │   │  ← text-4xl font-bold
│  │  Total Tasks      │  │   Completed       │  │    Pending        │   │  ← text-sm uppercase tracking-wide
│  │  ↑ 12%            │  │   ↑ 8%            │  │    ↓ 3%           │   │  ← Trend indicators
│  └───────────────────┘  └───────────────────┘  └───────────────────┘   │
│                                                                         │
│  🔥 Today's Focus                                         View All →   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ○ Review pull request                              High │ 10am   │   │
│  │ ○ Update documentation                          Medium │ 2pm    │   │
│  │ ○ Team standup meeting                             Low │ 4pm    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [+ New Task]                                                           │  ← Ghost button
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tasks Page (/dashboard/tasks) - Premium

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [DN] Dashboard    Tasks         [Avatar] John ▼  [Logout]              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  My Tasks                                       🔍 [Search...]          │
│                                                                         │
│  ┌──────────────────────────────────────┐                               │
│  │ [All (24)] │ Active (12) │ Completed (12) │  ← Premium tab navigation │
│  └──────────────────────────────────────┘                               │
│                                                                         │
│  [+ New Task]                              [Filter ▼] [Sort ▼]          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │  ← Task cards with hover effects
│  │ ○  Buy groceries                                           [⋮]  │   │
│  │    Pick up milk and eggs                                        │   │
│  │    🔴 High  │  📅 Due tomorrow  │  💬 2                         │   │
│  │    ████████████████░░░░░░  65%                                  │   │  ← Progress bar
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✓  Review pull request                                     [⋮]  │   │  ← Completed state (opacity-75, line-through)
│  │    Check the new feature implementation                         │   │
│  │    ✅ Completed  │  📅 Completed today                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Showing 2 of 24 tasks                              [Load More]         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```jsx
<div className="text-center py-12">
  <div className="text-6xl text-gray-300 mb-4">📋</div>
  <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
  <p className="text-gray-500 mb-6">Create your first task to get started</p>
  <button className="bg-gradient-to-r from-indigo-600 to-purple-600 ...">
    + New Task
  </button>
</div>
```

---

## Interactions & Animations

### Hover Effects

| Element | Effect | Duration |
|---------|--------|----------|
| Buttons | Darken + lift (-translate-y-0.5) + glow increase | 200ms |
| Cards | Lift (-translate-y-1) + shadow increase + border color | 300ms |
| Links | Underline fade-in + color shift | 150ms |
| Checkboxes | Scale (105%) + border color change | 200ms |

### Focus States

All interactive elements:
```css
focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
```

### Micro-interactions (Premium)

| Action | Animation | Duration |
|--------|-----------|----------|
| Checkbox toggle | Scale 105% + color fade + checkmark draw | 200ms |
| Button click | Scale 95% on press, return on release | 100ms |
| Card hover | Scale 101% + shadow expansion | 200ms |
| Badge (urgent) | Pulse animation | 2s infinite |
| Input focus | Ring smooth expansion | 200ms |
| Toast appear | Slide-in from right + fade | 300ms |
| Toast dismiss | Slide-out right + fade | 200ms |

### Loading States

#### Skeleton Loading
```jsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

#### Button Loading
```jsx
<button disabled className="... opacity-75 cursor-not-allowed">
  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
    {/* Spinner */}
  </svg>
  Loading...
</button>
```

### Transition Defaults

```css
/* Default transition */
transition-all duration-200 ease-in-out

/* Complex animations (cards, modals) */
duration-300

/* Instant feedback */
duration-100
```

---

## Responsive Design

### Breakpoints

| Name | Min Width | Tailwind | Target |
|------|-----------|----------|--------|
| Mobile | 0 | (default) | Phones |
| Tablet | 640px | `sm:` | Tablets, small laptops |
| Desktop | 1024px | `lg:` | Laptops, desktops |
| Wide | 1280px | `xl:` | Large monitors |

### Mobile Adaptations (< 640px)

- Header: Hamburger menu, logo only
- Stats cards: `grid-cols-1` (stacked)
- Feature cards: `grid-cols-1`
- Task cards: Simplified, hide secondary metadata
- Buttons: Full width on forms
- Padding: Reduced to `px-4`
- Hero text: `text-3xl` instead of `text-5xl`

### Tablet Adaptations (640px - 1024px)

- Stats cards: `grid-cols-2` (third on new row)
- Feature cards: `grid-cols-2`
- Task cards: Full width, all metadata visible
- Navigation: Compact menu

### Desktop (> 1024px)

- Full layout as designed
- Max width containers (max-w-7xl centered)
- Hover states fully active
- Optimal spacing and typography

---

## Accessibility Requirements

### ARIA Labels

- All interactive elements have accessible names
- Icons have `aria-label` or `sr-only` text
- Form inputs have associated labels
- Buttons have descriptive labels

### Color Contrast

| Element | Foreground | Background | Ratio | WCAG |
|---------|------------|------------|-------|------|
| Primary text | #111827 | #FFFFFF | 15.9:1 | AAA |
| Secondary text | #6B7280 | #FFFFFF | 5.4:1 | AA |
| Button text | #FFFFFF | #4F46E5 | 6.3:1 | AA |
| Error text | #EF4444 | #FFFFFF | 4.5:1 | AA |

### Keyboard Navigation

- Tab order follows logical reading order
- All interactive elements reachable via keyboard
- Escape closes modals and dropdowns
- Enter activates buttons and links
- Space toggles checkboxes
- Arrow keys navigate within components

### Focus Management

- Logical tab order throughout app
- Focus trap in modals and dropdowns
- Return focus to trigger after modal close
- Focus first input on page load (auth forms)
- Skip to main content link (hidden, visible on focus)

### Screen Reader Support

- Semantic HTML (`<main>`, `<nav>`, `<header>`, etc.)
- ARIA landmarks for major sections
- Live regions for dynamic content
- Status messages announced for form submissions

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Optimizations

### Images

- Use Next.js Image component
- Lazy loading by default
- WebP format with fallbacks
- Blur placeholder for loading

### Animations

- Use `transform` and `opacity` (GPU accelerated)
- Avoid animating `width`, `height`, `margin`, `padding`
- Use `will-change` for complex animations

### Fonts

- `font-display: swap` for Google Fonts
- Preload critical fonts
- Subset to Latin characters only

### Code Splitting

- Next.js automatic code splitting
- Lazy load heavy components
- Dynamic imports for route components

---

## Custom CSS Utilities

Add to `globals.css`:

```css
/* Gradient Text Effect */
.gradient-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Glassmorphism Effect */
.glass {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Float Animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Slide In Right Animation */
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

/* Gradient Border (for stat cards) */
.gradient-border {
  position: relative;
  background: white;
  border-radius: 1rem;
}

.gradient-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  padding: 2px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}

.gradient-border:hover::before {
  opacity: 1;
}
```

---

## Icon Library

**Using**: Heroicons (by Tailwind CSS team)

```bash
npm install @heroicons/react
```

### Common Icons

| Icon | Component | Usage |
|------|-----------|-------|
| Check | `CheckIcon` | Task completion |
| Plus | `PlusIcon` | Add new task |
| Trash | `TrashIcon` | Delete task |
| Pencil | `PencilIcon` | Edit task |
| Ellipsis | `EllipsisVerticalIcon` | More options |
| X | `XMarkIcon` | Close/dismiss |
| Arrow Right | `ArrowRightOnRectangleIcon` | Logout |
| User | `UserCircleIcon` | User profile |
| Search | `MagnifyingGlassIcon` | Search |
| Calendar | `CalendarIcon` | Due date |
| Chat | `ChatBubbleLeftIcon` | Comments |

---

## Implementation Checklist

1. [ ] Update all page titles to "DoNext"
2. [ ] Implement Logo component with gradient
3. [ ] Update favicon to DN monogram
4. [ ] Add Inter font import to layout
5. [ ] Add custom CSS utilities to globals.css
6. [ ] Implement gradient primary buttons
7. [ ] Update all cards with hover effects
8. [ ] Add custom checkbox component
9. [ ] Implement enhanced badges with rings
10. [ ] Add premium stat cards with gradient borders
11. [ ] Implement tab navigation component
12. [ ] Add toast notification system
13. [ ] Update landing page hero with animations
14. [ ] Ensure all focus states are visible
15. [ ] Test keyboard navigation
16. [ ] Verify color contrast ratios
17. [ ] Add reduced motion support
18. [ ] Test responsive breakpoints
