import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BarChart3, Binary, Users, BookOpen, Award } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">GradeTree</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">
              Features
            </a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">
              About
            </a>
          </nav>
          <Button asChild data-testid="button-login">
            <a href="/login">Sign In</a>
          </Button>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32">
          <div className="container px-4 md:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                  Student Grade Management
                  <span className="block text-primary">Powered by BST</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  A modern, structured digital grading workflow system with real-time Binary Search Tree visualization for optimized searching and academic demonstration.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" asChild data-testid="button-get-started">
                  <a href="/login">Get Started</a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                  <a href="#features">Learn More</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 bg-muted/30">
          <div className="container px-4 md:px-8">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-semibold">Powerful Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need for comprehensive grade management with advanced data structure visualization.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-0 bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Student Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Add, edit, and manage students with bulk CSV uploads. Track enrollments and academic history.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Subject & Assessments</h3>
                  <p className="text-sm text-muted-foreground">
                    Create subjects with configurable assessments. Set weights, max scores, and categories.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Grade Entry</h3>
                  <p className="text-sm text-muted-foreground">
                    Record grades individually or via bulk CSV. Automatic weighted grade computation.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Binary className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">BST Visualization</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time visual BST representation with step-by-step operations for educational purposes.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Analytics & Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Grade distribution graphs, performance summaries, and exportable CSV/PDF reports.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Role-Based Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Separate dashboards for admins, teachers, and students with appropriate permissions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="about" className="py-20">
          <div className="container px-4 md:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-4xl font-semibold">About GradeTree</h2>
              <p className="text-muted-foreground">
                GradeTree is designed to demonstrate the practical application of Binary Search Trees in educational data management. 
                It combines efficient data structures with a modern, user-friendly interface to provide both functionality and learning opportunities.
              </p>
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="space-y-2">
                  <p className="text-3xl font-semibold text-primary" data-testid="text-stat-operations">O(log n)</p>
                  <p className="text-sm text-muted-foreground">Search Time</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-semibold text-primary" data-testid="text-stat-traversals">3 Types</p>
                  <p className="text-sm text-muted-foreground">Traversals</p>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-semibold text-primary" data-testid="text-stat-roles">3 Roles</p>
                  <p className="text-sm text-muted-foreground">User Types</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">GradeTree - BST Grade Management System</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with PostgreSQL and Binary Search Trees
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
