import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  // If already authenticated, redirect to the appropriate panel
  useEffect(() => {
    if (!isAuthenticated) return;
    const role = user?.role;
    if (role === "student") navigate("/my-grades");
    else navigate("/");
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: "Success", description: "Logged in successfully" });
        // Refresh auth user query so app state updates
        try {
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        } catch (e) {
          // ignore
        }
        const freshUser = queryClient.getQueryData<any>(["/api/auth/user"]) || {};
        const role = freshUser?.role || data?.role;
        if (role === "student") {
          navigate("/my-grades");
        } else {
          navigate("/");
        }
      } else {
        toast({
          title: "Error",
          description: "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">GradeTree</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access GradeTree
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email or Student ID</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin@gmail.com or S2025001"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t space-y-3 text-xs text-muted-foreground">
              <p className="font-semibold">Demo Credentials:</p>
              <div>
                <p className="font-medium text-foreground">Admin:</p>
                <p>Email: admin@gmail.com</p>
                <p>Password: admin123</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Student:</p>
                <p>Email: student1@hcdc.edu.ph</p>
                <p>Password: student123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
