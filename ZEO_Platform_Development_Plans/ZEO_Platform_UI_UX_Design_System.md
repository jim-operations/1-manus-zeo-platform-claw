# ZEO Platform: UI/UX Design System & Wireframe Specifications

**Document ID:** ZEO-PLAN-MOD-UIUX
**Version:** 1.0

---

### 1. Introduction & Design Philosophy

This document outlines the UI/UX design system for the ZEO Embilipitiya digital platform. Our design philosophy is centered on **clarity, efficiency, and accessibility**. The platform must be intuitive for all users, from tech-savvy administrators to teachers and parents with limited digital experience. The design will be clean, professional, and trustworthy, reflecting its status as an official government platform.

### 2. Branding & Visual Identity

*   **Logo:** A simple, modern logo incorporating the Sri Lankan government emblem and the ZEO name.
*   **Color Palette:**
    *   **Primary:** A deep blue (`#003366`), conveying trust and professionalism.
    *   **Secondary:** A light grey (`#F0F2F5`) for backgrounds and secondary elements.
    *   **Accent:** A vibrant teal (`#00A99D`) for buttons, links, and highlights.
    *   **Status Colors:** Green (`#28A745`) for success, Red (`#DC3545`) for errors, Yellow (`#FFC107`) for warnings.
*   **Typography:**
    *   **Primary Font:** **Inter**, a clean and highly legible sans-serif font, will be used for all UI text.
    *   **Headings:** Noto Sans Sinhala, Noto Sans Tamil.
    *   **Body Text:** Noto Sans Sinhala, Noto Sans Tamil.

### 3. Component Library

To ensure consistency and accelerate development, the platform will use a pre-built, accessible component library. **Shadcn/UI** is recommended. It is a collection of reusable UI components built with Radix UI and Tailwind CSS, offering excellent accessibility and customizability.

Key components will include:

*   **Buttons:** Primary, secondary, and destructive actions.
*   **Forms:** Accessible and mobile-friendly input fields, dropdowns, checkboxes, and radio buttons.
*   **Tables:** Sortable, filterable, and paginated tables for displaying large datasets.
*   **Modals & Dialogs:** For confirmations, alerts, and focused tasks.
*   **Navigation:** Top-level navigation bar, collapsible side-menu, and breadcrumbs.
*   **Dashboards:** A set of reusable card and chart components for building analytics dashboards.

### 4. Layout & Responsive Grid

The platform will use a **12-column responsive grid system** based on Tailwind CSS. The layout will be mobile-first, ensuring a seamless experience on all devices, from smartphones to large desktop monitors.

*   **Mobile:** A single-column layout with a hamburger menu for navigation.
*   **Tablet:** A two-column layout for dashboards and data-heavy screens.
*   **Desktop:** A three-column layout, with a persistent side-menu for navigation.

### 5. High-Level Wireframes (Descriptions)

#### 5.1. Main Dashboard (Principal View)

*   **Layout:** A two-column layout.
*   **Left Column:** A series of key KPI cards (e.g., "Student Attendance Today", "Staff on Leave", "Pending Approvals").
*   **Right Column:** A large line chart showing student attendance trends over the past 30 days, and a bar chart showing exam pass rates by subject.
*   **Header:** The school name, a search bar, and a user profile dropdown.
*   **Navigation:** A collapsible side-menu with links to all school-level modules (Students, Staff, Finance, etc.).

#### 5.2. Teacher Transfer Application Form (Teacher View)

*   **Layout:** A single-column, multi-step form.
*   **Step 1: Personal Details:** Pre-filled with the teacher's information from the HRM module.
*   **Step 2: Transfer Request:** Dropdowns to select the requested new school and a text area for the reason for transfer.
*   **Step 3: Supporting Documents:** A file upload component to attach any required documents.
*   **Step 4: Review & Submit:** A summary of all entered information with a final "Submit Application" button.
*   **Progress Bar:** A visual indicator at the top of the form shows the user's progress through the steps.

#### 5.3. School Supervision Report (ISA View)

*   **Layout:** A mobile-first, single-column form optimized for tablets.
*   **Header:** The school name, date of visit, and supervisor's name.
*   **Sections:** A series of collapsible sections corresponding to the inspection template (e.g., "Curriculum Implementation", "Classroom Environment", "Infrastructure").
*   **Input Fields:** A mix of rating scales (1-5), checklists, and text areas for comments and recommendations.
*   **Media Upload:** A component to upload photos or videos as evidence.
*   **Footer:** A "Save as Draft" and "Submit Report" button.

