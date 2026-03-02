# ZEO Platform: Student Information System (SIS) Module

**Document ID:** ZEO-PLAN-MOD-SIS
**Version:** 1.0

---

### 1. Module Overview

The Student Information System (SIS) is a comprehensive module designed to manage all aspects of a student's academic journey. It will provide a secure and centralized repository for student data, accessible to authorized users based on their roles.

### 2. Key Features & User Stories

| Feature | User Stories |
| :--- | :--- |
| **Student Profiles** | - As an Admin, I can manage a detailed profile for every student, including demographic data, parent/guardian information, health records, and enrollment history.<br>- As a Parent, I can view my child's profile. |
| **Enrollment & Admissions** | - As a Parent, I can submit a new student admission application online.<br>- As a School Admin, I can manage the admission process, from application review to enrollment and class assignment. |
| **Attendance Tracking** | - As a Teacher, I can take daily attendance for my classes using a mobile device, even when offline.<br>- As a Principal, I can view real-time attendance dashboards for my school.<br>- As a Parent, I can receive notifications if my child is marked absent. |
| **Grade & Exam Management** | - As a Teacher, I can enter student grades and assessment results.<br>- As a School Admin, I can manage school-wide examination schedules and generate report cards.<br>- As a Student/Parent, I can view grades and report cards online. |
| **Scholarship & Grants** | - As an Admin, I can manage scholarship programs and track the distribution of funds to eligible students.<br>- As a Student/Parent, I can apply for available scholarships. |
| **Parent & Student Portal** | - As a Parent, I can access a secure portal to view my child's attendance, grades, and school announcements.<br>- As a Student, I can access my own academic information and learning resources. |

### 3. Data Model (High-Level)

*   **`StudentProfile`**: `student_id`, `full_name`, `date_of_birth`, `gender`, `address`, `parent_guardian_info` (JSONB), `emergency_contact`, `health_records` (JSONB), `enrollment_date`.
*   **`Enrollment`**: `enrollment_id`, `student_id`, `school_id`, `academic_year`, `grade`, `class_id`.
*   **`AttendanceRecord`**: `record_id`, `student_id`, `date`, `status` (
'PRESENT', 'ABSENT', 'LATE'), `teacher_id`.
*   **`Grade`**: `grade_id`, `student_id`, `subject`, `assessment_type`, `score`, `teacher_id`.
*   **`ReportCard`**: `report_card_id`, `student_id`, `academic_term`, `overall_grade`, `comments`, `generated_pdf_url`.

### 4. Workflows

*   **Online Admission Workflow:** A parent submits an application, which is then reviewed by the school administration. If accepted, the student is automatically enrolled, and a student profile is created.
*   **Report Card Generation:** At the end of each term, the system automatically compiles all grades for each student and generates a PDF report card, which is then made available on the parent/student portal.

### 5. Integration Points

*   **HRM Module:** To link students to their teachers.
*   **Finance Module:** For managing school fees and scholarship payments.
*   **Communication Module:** To send attendance alerts and school announcements to parents.
