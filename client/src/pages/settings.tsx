import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { User, Bell, Moon, Sun, Shield, Database, LogOut } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const getInitials = () => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "U";
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case "admin":
        return "Administrator";
      case "teacher":
        return "Teacher";
      case "student":
        return "Student";
      default:
        return "User";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Manage your account preferences and settings."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold" data-testid="text-user-name">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || "User"}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-user-email">
                {user?.email}
              </p>
              <Badge variant="secondary" data-testid="text-user-role">
                {getRoleLabel()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              data-testid="switch-dark-mode"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive updates about grades and announcements
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-email-notifications" />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Grade Alerts</p>
              <p className="text-xs text-muted-foreground">
                Get notified when new grades are posted
              </p>
            </div>
            <Switch defaultChecked data-testid="switch-grade-alerts" />
          </div>
        </CardContent>
      </Card>

      {user?.role === "admin" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-enable-2fa">
                  Enable
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Database and backup options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Export All Data</p>
                  <p className="text-xs text-muted-foreground">
                    Download all student grades and records as CSV
                  </p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-export-data">
                  Export
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Backup Database</p>
                  <p className="text-xs text-muted-foreground">
                    Create a backup of the entire database
                  </p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-backup">
                  Backup
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <LogOut className="h-5 w-5" />
            Sign Out
          </CardTitle>
          <CardDescription>End your current session</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" asChild data-testid="button-sign-out">
            <a href="/api/logout">Sign Out</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
