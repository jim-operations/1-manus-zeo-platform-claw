# ZEO Platform: Finance & Procurement Module

**Document ID:** ZEO-PLAN-MOD-FIN
**Version:** 1.0

---

### 1. Module Overview

The Finance & Procurement module provides a comprehensive solution for managing all financial and procurement activities within the ZEO and its schools. It will ensure transparency, accountability, and compliance with government financial regulations.

### 2. Key Features & User Stories

| Feature | User Stories |
| :--- | :--- |
| **Budget Management** | - As a Finance Officer, I can prepare the annual budget for the zone and its schools.<br>- As a Principal, I can view and manage my school's budget. |
| **Expenditure Tracking** | - As a Finance Officer, I can track all expenditures against the budget in real-time.<br>- As an Admin, I can generate detailed expenditure reports. |
| **Salary & Payroll** | - As a Finance Officer, I can process monthly salaries for all staff, integrated with the HRM module.<br>- As a Teacher, I can view my payslips online. |
| **Procurement Workflow** | - As a School Admin, I can submit a purchase requisition through a digital form.<br>- As a Procurement Officer, I can manage the entire procurement lifecycle, from bid invitation and evaluation to contract award, following government guidelines.<br>- As an Admin, I can track the status of all procurement requests. |
| **Audit Trail** | - As an Auditor, I can view a complete, immutable audit trail for all financial transactions. |

### 3. Data Model (High-Level)

*   **`Budget`**: `budget_id`, `academic_year`, `school_id`, `total_allocation`, `remaining_balance`.
*   **`Transaction`**: `transaction_id`, `date`, `amount`, `type` ('INCOME', 'EXPENDITURE'), `description`, `related_document_url`.
*   **`Salary`**: `salary_id`, `staff_id`, `month`, `year`, `gross_pay`, `deductions`, `net_pay`, `payslip_url`.
*   **`PurchaseRequisition`**: `requisition_id`, `school_id`, `item_description`, `quantity`, `estimated_cost`, `status`, `workflow_state`.
*   **`Contract`**: `contract_id`, `vendor_id`, `requisition_id`, `amount`, `start_date`, `end_date`, `contract_document_url`.

### 4. Workflows

*   **Procurement Workflow:** A multi-step process that follows government procurement guidelines. A purchase requisition is created, approved, and then converted into a bid invitation. Bids are evaluated, and a contract is awarded to the selected vendor.
*   **Budget Approval Workflow:** The annual budget is prepared by the finance department and then routed to the Zonal Director for approval.

### 5. Integration Points

*   **HRM Module:** For salary and payroll processing.
*   **SIS Module:** For managing school fees and other student-related payments.
*   **External Systems:** Integration with the government's central financial system (CIGAS).
