import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import StaffDirectory from "./pages/StaffDirectory";
import StaffDetail from "./pages/StaffDetail";
import LeaveManagement from "./pages/LeaveManagement";
import Transfers from "./pages/Transfers";
import Schools from "./pages/Schools";
import Departments from "./pages/Departments";
import ProfessionalDev from "./pages/ProfessionalDev";
import Announcements from "./pages/Announcements";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";
import Analytics from "./pages/Analytics";
import AuditLog from "./pages/AuditLog";
import UserManagement from "./pages/UserManagement";
import StudentDirectory from "./pages/StudentDirectory";
import StudentProfile from "./pages/StudentProfile";
import Attendance from "./pages/Attendance";
import Grades from "./pages/Grades";
import Scholarships from "./pages/Scholarships";
import ReportCards from "./pages/ReportCards";
import ParentPortal from "./pages/ParentPortal";
// Finance & Procurement
import BudgetManagement from "./pages/BudgetManagement";
import Transactions from "./pages/Transactions";
import Payroll from "./pages/Payroll";
import Procurement from "./pages/Procurement";
// Supervision & Quality Assurance
import Inspections from "./pages/Inspections";
import ImprovementPlans from "./pages/ImprovementPlans";
import QualityScorecards from "./pages/QualityScorecards";

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

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
