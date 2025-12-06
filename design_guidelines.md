# BST Student Grade Management System - Design Guidelines

## Design Approach

**Selected System**: Material Design principles adapted for educational SaaS applications, drawing inspiration from modern data-heavy platforms like Linear, Notion, and Google Classroom for clean, efficient information architecture.

**Justification**: This is a utility-focused, information-dense application requiring stability, efficiency, and clear data hierarchy. Material Design provides excellent patterns for data tables, forms, and complex UI states while maintaining accessibility.

---

## Typography System

**Font Stack**: 
- Primary: Inter (Google Fonts) - UI, tables, forms, body text
- Monospace: JetBrains Mono (Google Fonts) - Student IDs, codes, BST node values

**Hierarchy**:
- Page Titles: text-3xl, font-semibold
- Section Headers: text-xl, font-semibold  
- Card/Panel Titles: text-lg, font-medium
- Body/Table Content: text-sm, font-normal
- Labels: text-xs, font-medium, uppercase, tracking-wide
- Data Values: text-base, font-medium (for grades, scores)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 8, 12, 16** (e.g., p-4, gap-8, space-y-12)

**Dashboard Layout**:
- Sidebar: Fixed width (w-64), full height, navigation hierarchy
- Main Content: Fluid width with max-w-7xl container, px-8, py-6
- Top Bar: h-16, sticky positioning, user profile and notifications
- Card Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6

**Page Structure**:
- Page Header: mb-8 with title, breadcrumbs, and primary actions
- Content Sections: space-y-8 for vertical rhythm
- Cards/Panels: p-6, rounded-lg, shadow-sm

---

## Component Library

### Navigation
- **Sidebar Navigation**: Vertical menu with icon + label, nested items indented by pl-8, active states with left border accent
- **Top Navigation**: Horizontal tabs for sub-sections (border-b-2 for active state)
- **Breadcrumbs**: text-sm with separator icons

### Data Display
- **Tables**: Striped rows, hover states, sticky headers, sortable columns with arrow icons (Heroicons), pagination footer
- **Data Cards**: Compact card grid for dashboard widgets (student count, grade averages), large numeric values with text-3xl
- **Grade Display**: Badge-style components for letter grades (A, B, C), pill shape with rounded-full
- **BST Visualization Panel**: Full-width canvas area with side panel controls (w-1/4), zoom controls, legend

### Forms & Inputs
- **Text Inputs**: h-10, px-3, border, rounded-md, focus ring
- **Select Dropdowns**: Native styling with custom arrow icon
- **File Upload**: Dashed border zone for CSV drag-and-drop with upload icon
- **Inline Editing**: Table cells transform to inputs on click, confirm/cancel icons
- **Multi-step Forms**: Progress indicators at top, numbered steps

### Data Visualization
- **Charts**: Card-based containers (p-6) with title, subtitle for metrics, Recharts components for bar/line graphs
- **BST Diagram**: SVG-based tree with connecting lines, circular nodes, values centered in nodes, color-coded operation paths
- **Distribution Graphs**: Histogram style with labeled axes

### Action Components
- **Primary Buttons**: px-4, py-2, rounded-md, font-medium
- **Icon Buttons**: Square (w-10, h-10), rounded-md, single icon centered
- **Dropdown Menus**: Absolute positioned, shadow-lg, rounded-md, py-1
- **Floating Action Button**: Fixed bottom-right for quick "Add" actions (mobile/tablet)

### Feedback & States
- **Loading States**: Skeleton loaders for tables/cards, spinner for buttons
- **Empty States**: Centered icon + message + call-to-action button
- **Error States**: Alert banners with icon, dismissible
- **Success Toast**: Top-right corner, auto-dismiss, slide-in animation

### Role-Based Dashboards
- **Admin Dashboard**: 4-column metric grid, activity feed, quick action cards
- **Teacher Dashboard**: Subject cards with grade entry shortcuts, student roster table
- **Student Dashboard**: Personal grade summary cards, subject enrollment list, download buttons

---

## Key Design Patterns

**BST Visualizer Screen**:
- Split layout: Controls sidebar (w-1/4) on left, visualization canvas (flex-1) on right
- Controls: Dropdown for key type, build button, traversal type selector, step-through controls
- Canvas: Centered tree diagram with pan/zoom, step annotations overlay
- Bottom panel: Traversal log table with operation steps

**Grade Entry Interface**:
- Assessment header with name, weight, max score display
- Student roster table with inline grade inputs
- Bulk actions toolbar above table
- Validation indicators (red border for invalid, green checkmark for saved)
- Auto-save indicator in header

**Student Profile**:
- Tab navigation: Summary | Grades | BST View | History
- Summary tab: 2-column grid with personal info + enrolled subjects
- Grades tab: Accordion by subject, expandable assessment breakdown
- BST View: Interactive tree showing student's position in grade distribution

**Reports Screen**:
- Filter panel (fixed left, w-72): Subject, date range, student group selectors
- Main area: Preview of report with export buttons (CSV, PDF) at top-right
- Chart area: Full-width grade distribution, top performers list below

---

## Accessibility Standards

- Focus indicators: ring-2 ring-offset-2 on all interactive elements
- Proper heading hierarchy (h1 → h6) throughout
- ARIA labels for icon-only buttons
- Table headers with proper scope attributes
- Form labels explicitly associated with inputs
- Keyboard navigation for BST visualization (arrow keys to traverse)
- Color contrast ratio minimum 4.5:1 for text

---

## Images

**Hero/Landing**: Not applicable - this is an authenticated dashboard application

**Illustrations**:
- Empty state illustrations: Simple line-art style for "No students enrolled," "No assessments created"
- BST educational diagrams: Sidebar helper images showing tree structure concepts (small, 200x200px)
- User avatars: Circle-cropped, 40x40px in navigation, 80x80px in profiles

**Icons**: Heroicons (outline style for navigation, solid style for buttons/badges)

---

## Animation Guidelines

Use sparingly:
- Page transitions: Fade-in only (duration-200)
- BST operations: Smooth node insertion/deletion paths (duration-500)
- Table row hover: None - instant state change
- Dropdown menus: Slide-down (duration-150)
- Toast notifications: Slide-in from right (duration-300)

Avoid: Scroll-triggered animations, parallax, complex transforms