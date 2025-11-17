# 📘 Frontend UI Design Guide

**Purpose:** Provide a consistent, scalable, high-quality UI foundation for all screens, components, and interactions of the product.

---

## 1. 🎨 Brand Foundations

### 1.1 Color System

Use a minimal, modern palette with clearly defined roles.

#### Primary
- **#4F46E5** – Indigo 600 (main actions, highlights)

#### Secondary
- **#6366F1** – Indigo 500 (cards, accents)

#### Neutrals
- **#0F172A** – Slate 900 (headline text)
- **#334155** – Slate 700 (body text)
- **#E2E8F0** – Slate 200 (strokes, borders)
- **#F8FAFC** – Slate 50 (background)

#### Feedback Colors
- **Success:** #16A34A
- **Warning:** #FACC15
- **Error:** #DC2626
- **Info:** #0EA5E9

#### Rules
- Primary color is ONLY used for actions (CTA buttons, toggles, links)
- Keep clean whitespace → Do not overload UI with colors

---

## 2. ✍ Typography Guide

### Font Family
Use **Inter** (or system-ui fallback)

### Font Roles
- **H1:** 32–40px / bold
- **H2:** 24–30px / semibold
- **H3:** 20–22px / semibold
- **Body:** 16px / regular
- **Small:** 14px / regular
- **Caption:** 12px / medium

### Rules
- Headings always use semibold or bold
- Use max 2 font sizes per screen for hierarchy clarity

---

## 3. 🧩 Component Design System

### 3.1 Buttons

**Base Style (Tailwind reference):**
```
px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50
```

**Primary Button:**
- Background: primary color (#4F46E5)
- Text: white
- Subtle shadow
- Hover: darken 5%

**Secondary Button:**
- Background: white
- Border: 1.5px solid slate-200
- Text: slate-900
- Hover: tinted slate background

**Icon Buttons:**
- rounded-lg
- 40x40
- Center icon with 20px size

---

### 3.2 Input Fields

- Rounded-xl
- 14–16px padding
- Border: 1.5px solid slate-200
- Focus: 1.5px primary border + soft glow
- Label: 14px, slate-700
- Error: red-600 text + red border

---

### 3.3 Cards

- Rounded-2xl
- Soft shadow (2–4%)
- Padding: 20–28px
- Gap: 12–16px between items
- Optional divider lines (slate-100)

---

### 3.4 Avatars

**Sizes:** 24, 32, 40, 48, 64

- Rounded-full
- Border optional: 2px white for overlapping avatars

---

### 3.5 Navigation

**Top Nav:**
- Height: 64–72px
- Blur background (backdrop-blur-md)
- Max-width: 1280px
- Sticky to top

**Sidebar:**
- 260–300px
- Collapsible to 80px
- Active state uses primary tint

---

## 4. 📐 Layout & Spacing Rules

### 4.1 Spacing Scale (Tailwind Spacing)
Use: **4, 6, 8, 12, 16, 24, 32, 48**

Spacing between sections: **24–40px**

### 4.2 Container Widths
- Desktop max width: **1280px**
- Tablet: **720px**
- Mobile: **100%**

### 4.3 Grid
- Use 12-column grid on desktop
- 4-column grid on mobile

### 4.4 White Space Philosophy
- Clean, airy, minimal
- Never stack elements with less than 12px spacing

---

## 5. 🌙 Dark Mode Standards

### Backgrounds
- **Dark 1:** #0B0F19
- **Dark 2:** #111827

### Text
- Use #F3F4F6 and #9CA3AF for secondary

### Components
- Cards: #1F2937
- Borders: #374151
- Primary buttons keep same color

---

## 6. 🧭 UX Interaction Rules

### 6.1 Microinteractions
- All clickable elements: `active:scale-95`
- Hover: slightly brighter background
- Buttons: smooth 150–200ms transitions
- Tabs & menu items: underline slide animation
- Input focus: subtle glow

### 6.2 Motion Guidelines
- Duration: 150–300ms
- Motion uses ease-out, never bounce
- Keep animations purposeful, not decorative

---

## 7. 🦾 Accessibility Standards
- Minimum contrast: 4.5:1
- All icons must have aria-label
- Focus rings must be visible
- Click targets: **44x44px**
- Avoid color-only indicators

---

## 8. 🧱 Code Structure (For Development)

### Use
- React + TailwindCSS
- Framer Motion for animations
- Shadcn/UI for components
- Lucide icons

### File Architecture
```
/components
  /ui
  /layouts
  /sections
/pages
/hooks
/utils
```

---

## 9. 📄 Output Requirements

Every screen/component built **must include:**
- ✅ Responsive layout
- ✅ Dark mode support
- ✅ Proper spacing
- ✅ Correct colors/typography
- ✅ Modular reusable components
- ✅ Semantic HTML
- ✅ Accessibility attributes

---

## 10. 🖼 Screen Composition Rules

### Section Titles
- Large, bold, minimal
- Use consistent spacing above/below

### Hero Sections
- Max two CTAs
- Use grid or two-column layout
- Illustration or subtle background blob allowed

### Forms
- Group fields logically
- Avoid more than 2 fields per row
- Always include success/error states

### Lists & Tables
- Use zebra stripes in tables
- Hover state: slight background tint

---

## 11. 📌 Final Principles

- **Minimal** – Remove clutter
- **Consistent** – Unified design patterns
- **Scalable** – Works across all screen sizes
- **Reusable** – Component-driven architecture
- **Elegant** – Refined and polished
- **Accessible** – Inclusive for all users
- **Responsive** – Optimized for all devices
