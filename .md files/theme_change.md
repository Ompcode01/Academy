# UI/UX Standardization Brief & Master Design System

## 1. Design System & Theme Tokens

### Color Palette

- **Primary / Header Bar:** Very Dark Navy Blue (`#0B132B` / `#0D1117`)
- **Secondary / Accent / Buttons:** Crimson Red (`#C82333` / `#D9534F`)
- **Page / Main Canvas Background:** Soft Ice Blue / Cyan Tint (`#EBF5F8` / `#EAF3F7`)
- **Card & Panel Background:** Pure White (`#FFFFFF`)
- **Sidebar / Panel Background:** Cool Light Gray / Ice Blue (`#F4F7F9`)
- **Text Colors:**
  - Dark Charcoal / Body Text: `#212529`
  - Muted / Meta Text: `#6C757D`
  - Inverted Text (Header Bar): `#FFFFFF`

### Typography & Structure

- **Font Family:** Clean sans-serif (e.g., `Inter`, `Roboto`, or System Sans-Serif)
- **Borders & Shadows:**
  - Cards: Thin subtle border (`#E0E6ED`), slight border radius (`4px` - `6px`), minimal shadow.
- **Layout Grid:**
  - Dual-column layout: **Main Content Area (75% width)** + **Right Collapsible Sidebar (25% width)**.

---

## 2. Layout & Architecture Guidelines

### Top Navigation Bar (Fixed Header)

- **Background:** Dark Navy Blue.
- **Left Section:** Company / Platform Logo ("Harbinger Group") + Tagline ("Elevate... Go Beyond").
- **Right Section:** Branding ("CapDev"), Search Icon, User Profile Avatar with Initials, and Profile Name ("Omprakash Pandey").

### Secondary Navigation Bar

- **Background:** Light off-white/blush tint with subtle bottom border.
- **Left Links:** Dashboard, Courses, Events (with associated icons).
- **Right Control:** View switcher ("Standard view").

### Main Content Area (Left/Center Canvas)

- Divided into stacked horizontal sections with distinct section headers (e.g., "Recently accessed Programs", "Recently Added Programs", "Capabilities Developed", "Calendar").
- Each section header features a hamburger/list icon (`≡`) or relevant icon.
- **Program Cards:** Horizontal scroll or grid layout. Clean image thumbnail top, bold title text on white background below.
- **Action Callouts:** Primary Red for critical interactive buttons (e.g., `New event`).

### Right Sidebar Panel

- **Background:** Slightly shaded light gray/ice blue to separate from the main canvas.
- **Sections:**
  - Skill Cloud
  - Navigation Tree (Hierarchical collapsible menu: Dashboard, Site Home, My Courses, etc.)
  - Latest Badges
  - Online Users list
- Top-right collapse toggle button (`✕`).

---

## 3. Standardization Rules for All Roles & Pages

1. **Role Consistency:** Admin, Instructor, Manager, and Student dashboards MUST maintain this exact structural skeleton: Dark Navy header, Ice Blue canvas background, White card containers, and Crimson Red primary action buttons.
2. **Page Consistency:** All inner pages (Course Details, Quiz Pages, Analytics, Settings) must keep the top dual navigation headers intact.
3. **Component Reusability:** Apply the exact same side-navigation tree structure across all views to ensure uniform user navigation.
