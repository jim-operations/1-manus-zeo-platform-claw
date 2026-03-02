import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const NotFound = lazy(() => import("./pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));

// HRM
const StaffDirectory = lazy(() => import("./pages/StaffDirectory"));
const StaffDetail = lazy(() => import("./pages/StaffDetail"));
const LeaveManagement = lazy(() => import("./pages/LeaveManagement"));
const Transfers = lazy(() => import("./pages/Transfers"));
const Schools = lazy(() => import("./pages/Schools"));
const Departments = lazy(() => import("./pages/Departments"));
const ProfessionalDev = lazy(() => import("./pages/ProfessionalDev"));

// Communication
const Announcements = lazy(() => import("./pages/Announcements"));
const AnnouncementDetail = lazy(() => import("./pages/AnnouncementDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const Notifications = lazy(() => import("./pages/Notifications"));

// Admin
const Analytics = lazy(() => import("./pages/Analytics"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const UserManagement = lazy(() => import("./pages/UserManagement"));

// SIS
const StudentDirectory = lazy(() => import("./pages/StudentDirectory"));
const StudentProfile = lazy(() => import("./pages/StudentProfile"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Grades = lazy(() => import("./pages/Grades"));
const Scholarships = lazy(() => import("./pages/Scholarships"));
const ReportCards = lazy(() => import("./pages/ReportCards"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));

// Finance & Procurement
const BudgetManagement = lazy(() => import("./pages/BudgetManagement"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Payroll = lazy(() => import("./pages/Payroll"));
const Procurement = lazy(() => import("./pages/Procurement"));

// Supervision & Quality Assurance
const Inspections = lazy(() => import("./pages/Inspections"));
const ImprovementPlans = lazy(() => import("./pages/ImprovementPlans"));
const QualityScorecards = lazy(() => import("./pages/QualityScorecards"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* HRM */}
      <Route path="/staff" component={StaffDirectory} />
      <Route path="/staff/:id" component={StaffDetail} />
      <Route path="/leave" component={LeaveManagement} />
      <Route path="/transfers" component={Transfers} />
      <Route path="/schools" component={Schools} />
      <Route path="/departments" component={Departments} />
      <Route path="/professional-dev" component={ProfessionalDev} />
      {/* SIS */}
      <Route path="/students" component={StudentDirectory} />
      <Route path="/students/:id" component={StudentProfile} />
      <Route path="/attendance" component={Attendance} />
      <Route path="/grades" component={Grades} />
      <Route path="/scholarships" component={Scholarships} />
      <Route path="/report-cards" component={ReportCards} />
      <Route path="/parent-portal" component={ParentPortal} />
      {/* Finance & Procurement */}
      <Route path="/budgets" component={BudgetManagement} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/payroll" component={Payroll} />
      <Route path="/procurement" component={Procurement} />
      {/* Supervision & Quality Assurance */}
      <Route path="/inspections" component={Inspections} />
      <Route path="/improvement-plans" component={ImprovementPlans} />
      <Route path="/scorecards" component={QualityScorecards} />
      {/* Communication */}
      <Route path="/announcements" component={Announcements} />
      <Route path="/announcements/:id" component={AnnouncementDetail} />
      <Route path="/messages" component={Messages} />
      <Route path="/notifications" component={Notifications} />
      {/* Admin */}
      <Route path="/analytics" component={Analytics} />
      <Route path="/audit" component={AuditLog} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<AppFallback />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
