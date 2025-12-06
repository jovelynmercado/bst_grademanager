import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Binary,
  BarChart3,
  GraduationCap,
  Settings,
  LogOut,
  ChevronUp,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";

const adminMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: Users },
  { title: "Subjects", url: "/subjects", icon: BookOpen },
  { title: "Assessments", url: "/assessments", icon: ClipboardList },
  { title: "Grades", url: "/grades", icon: FileText },
  { title: "BST Visualizer", url: "/bst", icon: Binary },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const teacherMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Subjects", url: "/subjects", icon: BookOpen },
  { title: "Assessments", url: "/assessments", icon: ClipboardList },
  { title: "Grades", url: "/grades", icon: FileText },
  { title: "BST Visualizer", url: "/bst", icon: Binary },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const studentMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Grades", url: "/my-grades", icon: FileText },
  { title: "Subjects", url: "/my-subjects", icon: BookOpen },
  { title: "BST Demo", url: "/bst", icon: Binary },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getMenuItems = () => {
    switch (user?.role) {
      case "admin":
      case "teacher":
        // Treat teacher same as admin
        return adminMenuItems;
      case "student":
        return studentMenuItems;
      default:
        return adminMenuItems;
    }
  };

  const menuItems = getMenuItems();

  const getRoleLabel = () => {
    switch (user?.role) {
      case "admin":
      case "teacher":
        return "Administrator";
      case "student":
        return "Student";
      default:
        return "User";
    }
  };

  const getInitials = (user: User | null | undefined) => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">GradeTree</span>
              <span className="text-xs text-muted-foreground">{getRoleLabel()}</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`sidebar-item-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-2"
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">{getInitials(user)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left flex-1 min-w-0">
                <span className="text-sm font-medium truncate w-full">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate w-full">
                  {user?.email}
                </span>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild data-testid="menu-item-settings">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="menu-item-logout">
              <a href="/api/logout" className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
