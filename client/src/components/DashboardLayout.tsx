import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  School,
  CalendarDays,
  ArrowRightLeft,
  Megaphone,
  Bell,
  MessageSquare,
  BarChart3,
  Shield,
  Building2,
  GraduationCap,
  Settings,
  ChevronRight,
  UserCheck,
  ClipboardList,
  BookOpen,
  Award,
  DollarSign,
  Receipt,
  Banknote,
  ShoppingCart,
  ClipboardCheck,
  Target,
  Trophy,
  FileText,
  UserRound,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { trpc } from "@/lib/trpc";
import { ROLE_DISPLAY_NAMES } from "@shared/permissions";
import type { ZeoRole } from "../../../drizzle/schema";
import { hasPermission, PERMISSIONS } from "@shared/permissions";

// ─── Navigation Structure ────────────────────────────────────────────────────
interface NavItem {
  icon: any;
  label: string;
  path: string;
  requiredPermission?: string;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    ],
  },
  {
    label: "Human Resources",
    items: [
      { icon: Users, label: "Staff Directory", path: "/staff", requiredPermission: PERMISSIONS.STAFF_VIEW_ALL },
      { icon: CalendarDays, label: "Leave Management", path: "/leave" },
      { icon: ArrowRightLeft, label: "Transfers", path: "/transfers" },
      { icon: GraduationCap, label: "Development", path: "/professional-dev", requiredPermission: PERMISSIONS.SERVICE_VIEW },
    ],
  },
  {
    label: "Organization",
    items: [
      { icon: School, label: "Schools", path: "/schools", requiredPermission: PERMISSIONS.SCHOOLS_VIEW },
      { icon: Building2, label: "Departments", path: "/departments", requiredPermission: PERMISSIONS.DEPARTMENTS_VIEW },
    ],
  },
  {
    label: "Student Information",
    items: [
      { icon: UserCheck, label: "Students", path: "/students", requiredPermission: PERMISSIONS.STUDENT_VIEW },
      { icon: ClipboardList, label: "Attendance", path: "/attendance", requiredPermission: PERMISSIONS.ATTENDANCE_MARK },
      { icon: BookOpen, label: "Grades", path: "/grades", requiredPermission: PERMISSIONS.GRADE_VIEW },
      { icon: FileText, label: "Report Cards", path: "/report-cards", requiredPermission: PERMISSIONS.GRADE_VIEW },
      { icon: Award, label: "Scholarships", path: "/scholarships", requiredPermission: PERMISSIONS.SCHOLARSHIP_VIEW },
      { icon: UserRound, label: "Parent Portal", path: "/parent-portal", requiredPermission: PERMISSIONS.STUDENT_VIEW },
    ],
  },
  {
    label: "Finance & Procurement",
    items: [
      { icon: DollarSign, label: "Budgets", path: "/budgets", requiredPermission: PERMISSIONS.BUDGET_VIEW },
      { icon: Receipt, label: "Transactions", path: "/transactions", requiredPermission: PERMISSIONS.TRANSACTION_VIEW },
      { icon: Banknote, label: "Payroll", path: "/payroll", requiredPermission: PERMISSIONS.SALARY_VIEW },
      { icon: ShoppingCart, label: "Procurement", path: "/procurement", requiredPermission: PERMISSIONS.PROCUREMENT_VIEW },
    ],
  },
  {
    label: "Supervision & QA",
    items: [
      { icon: ClipboardCheck, label: "Inspections", path: "/inspections", requiredPermission: PERMISSIONS.INSPECTION_VIEW },
      { icon: Target, label: "Improvement Plans", path: "/improvement-plans", requiredPermission: PERMISSIONS.IMPROVEMENT_VIEW },
      { icon: Trophy, label: "Scorecards", path: "/scorecards", requiredPermission: PERMISSIONS.SCORECARD_VIEW },
    ],
  },
  {
    label: "Communication",
    items: [
      { icon: Megaphone, label: "Announcements", path: "/announcements" },
      { icon: MessageSquare, label: "Messages", path: "/messages" },
      { icon: Bell, label: "Notifications", path: "/notifications" },
    ],
  },
  {
    label: "Administration",
    items: [
      { icon: BarChart3, label: "Analytics", path: "/analytics", requiredPermission: PERMISSIONS.ANALYTICS_VIEW_ZONE },
      { icon: Shield, label: "Audit Log", path: "/audit", requiredPermission: PERMISSIONS.AUDIT_VIEW },
      { icon: Settings, label: "User Management", path: "/user-management", requiredPermission: PERMISSIONS.USERS_MANAGE },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mb-2">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              ZEO Embilipitiya
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Zonal Education Office Digital Platform. Sign in to access the system.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full"
          >
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const userRole = (user?.role ?? "user") as ZeoRole;
  const unreadCount = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Filter nav items by permission
  const filteredGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasPermission(userRole, item.requiredPermission as any);
    }),
  })).filter((group) => group.items.length > 0);

  // Find active label
  const activeItem = filteredGroups.flatMap((g) => g.items).find((item) => {
    if (item.path === "/") return location === "/";
    return location.startsWith(item.path);
  });

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground/70" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded bg-primary flex items-center justify-center shrink-0">
                    <GraduationCap className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold tracking-tight truncate text-sidebar-foreground text-sm">
                    ZEO Embilipitiya
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-2">
            {filteredGroups.map((group) => (
              <SidebarGroup key={group.label} className="px-0 py-0 pt-4 pb-1 first:pt-1 shrink-0">
                <SidebarGroupLabel className="text-sidebar-foreground/50 text-[10px] uppercase tracking-widest font-medium h-6 mb-1 px-2">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => {
                    const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
                    const showBadge = item.path === "/announcements" && (unreadCount.data ?? 0) > 0;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          size="sm"
                          className="h-8 transition-all font-normal text-[13px]"
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                          <span className="flex-1">{item.label}</span>
                          {showBadge && (
                            <Badge variant="destructive" className="h-5 min-w-5 text-[10px] px-1">
                              {unreadCount.data}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                      {user?.name || "User"}
                    </p>
                    <p className="text-[11px] text-sidebar-foreground/60 truncate mt-1">
                      {ROLE_DISPLAY_NAMES[userRole] ?? userRole}
                    </p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {/* Top bar with notification bell */}
        <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-2">
            {isMobile && (
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
            )}
            <h2 className="text-sm font-medium text-foreground">
              {activeItem?.label ?? "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button
              onClick={() => setLocation("/notifications")}
              className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {(unreadCount.data ?? 0) > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>
          </div>
        </div>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
