# ZEO Platform: Human Resource Management (HRM) Module

**Document ID:** ZEO-PLAN-MOD-HRM
**Version:** 1.0

---

### 1. Module Overview

The Human Resource Management (HRM) module is the cornerstone of the ZEO platform, designed to manage the complete lifecycle of all educational staff within the zone. It will serve as the single source of truth for all teacher and staff data, automating and streamlining all HR processes.

### 2. Key Features & User Stories

| Feature | User Stories |
| :--- | :--- |
| **Centralized Staff Database** | - As an Admin, I can view and manage a comprehensive profile for every teacher and staff member, including personal details, service history, qualifications, and contact information.<br>- As a Teacher, I can view and request updates to my own profile. |
| **Recruitment & Deployment** | - As an HR Officer, I can manage teacher recruitment campaigns, track applications, and manage the deployment of new teachers to schools based on vacancies.<br>- As a Principal, I can submit teacher vacancy requests. |
| **Transfers & Promotions** | - As a Teacher, I can submit a transfer request through a digital form.<br>- As an HR Officer, I can manage the entire transfer process, from application to approval and placement, based on defined policies.<br>- As an Admin, I can manage promotion cycles and track career progression for all staff. |
| **Leave Management** | - As a Teacher, I can apply for leave through a mobile-friendly form.<br>- As a Principal, I can approve or reject leave requests for my staff.<br>- As an HR Officer, I can track leave balances and generate reports on staff attendance. |
| **Service Record Management** | - As an Admin, I can maintain a complete, digitized service record for every employee, including all appointments, transfers, and promotions.<br>- As a Teacher, I can view my own service history. |
| **Professional Development** | - As an Admin, I can track teacher participation in professional development programs.<br>- As a Teacher, I can view available training programs and register for them. |
| **Performance Evaluation** | - As a Principal or ISA, I can conduct and record teacher performance evaluations using standardized digital forms.<br>- As a Teacher, I can view my evaluation history. |

### 3. Data Model (High-Level)

*   **`StaffProfile`**: `staff_id`, `full_name`, `nic`, `date_of_birth`, `gender`, `contact_info`, `address`, `qualifications` (JSONB), `service_start_date`, `current_school_id`, `current_role`, `profile_picture_url`.
*   **`ServiceHistory`**: `history_id`, `staff_id`, `event_type` (e.g., 'APPOINTMENT', 'TRANSFER', 'PROMOTION'), `effective_date`, `details` (JSONB), `document_scan_url`.
*   **`LeaveRequest`**: `request_id`, `staff_id`, `leave_type`, `start_date`, `end_date`, `reason`, `status` (e.g., 'PENDING', 'APPROVED', 'REJECTED'), `approver_id`.
*   **`Vacancy`**: `vacancy_id`, `school_id`, `subject`, `grade`, `required_qualifications`, `status`.
*   **`TransferRequest`**: `transfer_id`, `staff_id`, `current_school_id`, `requested_school_id`, `reason`, `status`, `workflow_state`.

### 4. Workflows

*   **Teacher Transfer Workflow:** A multi-step approval process modeled in the BPMN engine. The request is initiated by the teacher, routed to the current principal for recommendation, then to the HR department for eligibility checks, and finally to the Zonal Director for approval.
*   **Leave Approval Workflow:** A simple workflow where a teacher's leave request is routed to their direct supervisor (Principal) for approval. Approved requests automatically update the teacher's leave balance.

### 5. Integration Points

*   **SIS Module:** To link teachers to their assigned classes and students.
*   **Finance Module:** To provide salary and payroll information.
*   **Supervision Module:** To link performance evaluations to school supervision reports.
