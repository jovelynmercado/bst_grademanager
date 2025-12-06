import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Binary, Play, RotateCcw, Search, ArrowRight, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import type { BSTVisualizationData, BSTOperation, BSTNode } from "@shared/schema";

type KeyType = "studentId" | "grade" | "score";
type TraversalType = "inorder" | "preorder" | "postorder";

interface BSTResponse {
  visualization: BSTVisualizationData;
  operations: BSTOperation[];
}

export default function BSTVisualizer() {
  const [keyType, setKeyType] = useState<KeyType>("grade");
  const [traversalType, setTraversalType] = useState<TraversalType>("inorder");
  const [searchValue, setSearchValue] = useState("");
  const [zoom, setZoom] = useState(1);
  const [operations, setOperations] = useState<BSTOperation[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const { data: bstData, isLoading, refetch } = useQuery<BSTResponse>({
    queryKey: ["/api/bst", keyType],
    enabled: false,
  });

  const buildMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bst/build", { keyType });
      return res.json();
    },
    onSuccess: (data: BSTResponse) => {
      setOperations(data.operations || []);
      setCurrentStep(0);
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (value: string) => {
      const res = await apiRequest("POST", "/api/bst/search", { keyType, value });
      return res.json();
    },
    onSuccess: (data: { operation: BSTOperation }) => {
      setOperations(prev => [...prev, data.operation]);
    },
  });

  const traverseMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/bst/traverse", { keyType, traversalType });
      return res.json();
    },
    onSuccess: (data: { operation: BSTOperation; order: string[] }) => {
      setOperations(prev => [...prev, data.operation]);
    },
  });

  const handleBuildTree = () => {
    buildMutation.mutate();
  };

  const handleSearch = () => {
    if (searchValue.trim()) {
      searchMutation.mutate(searchValue);
    }
  };

  const handleTraverse = () => {
    traverseMutation.mutate();
  };

  const handleReset = () => {
    setOperations([]);
    setCurrentStep(0);
    setSearchValue("");
  };

  const renderBSTNode = useCallback((
    node: BSTNode<any> | null,
    x: number,
    y: number,
    level: number,
    maxWidth: number
  ): JSX.Element | null => {
    if (!node) return null;

    const nodeRadius = 24;
    const verticalSpacing = 80;
    const horizontalOffset = maxWidth / Math.pow(2, level + 1);

    const leftChildX = x - horizontalOffset;
    const rightChildX = x + horizontalOffset;
    const childY = y + verticalSpacing;

    return (
      <g key={`node-${node.key}`}>
        {node.left && (
          <line
            x1={x}
            y1={y + nodeRadius}
            x2={leftChildX}
            y2={childY - nodeRadius}
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
        )}
        {node.right && (
          <line
            x1={x}
            y1={y + nodeRadius}
            x2={rightChildX}
            y2={childY - nodeRadius}
            stroke="hsl(var(--border))"
            strokeWidth="2"
          />
        )}
        
        <circle
          cx={x}
          cy={y}
          r={nodeRadius}
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-border))"
          strokeWidth="2"
        />
        <text
          x={x}
          y={y + 5}
          textAnchor="middle"
          fill="hsl(var(--primary-foreground))"
          fontSize="12"
          fontFamily="var(--font-mono)"
          fontWeight="500"
        >
          {typeof node.key === 'number' ? node.key.toFixed(1) : node.key}
        </text>

        {node.left && renderBSTNode(node.left, leftChildX, childY, level + 1, maxWidth)}
        {node.right && renderBSTNode(node.right, rightChildX, childY, level + 1, maxWidth)}
      </g>
    );
  }, []);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Binary className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No Tree Built</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        Select a key type and click "Build Tree" to visualize the Binary Search Tree structure.
      </p>
      <Button onClick={handleBuildTree} disabled={buildMutation.isPending}>
        <Play className="h-4 w-4 mr-2" />
        Build Tree
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-4rem)]">
      <PageHeader
        title="BST Visualizer"
        description="Visualize Binary Search Tree operations with real student data."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-6rem)]">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Key Type</label>
              <Select value={keyType} onValueChange={(v) => setKeyType(v as KeyType)}>
                <SelectTrigger data-testid="select-key-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="studentId">Student ID</SelectItem>
                  <SelectItem value="grade">Final Grade</SelectItem>
                  <SelectItem value="score">Assessment Score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleBuildTree}
              disabled={buildMutation.isPending}
              data-testid="button-build-tree"
            >
              <Play className="h-4 w-4 mr-2" />
              {buildMutation.isPending ? "Building..." : "Build Tree"}
            </Button>

            <Separator />

            <div className="space-y-3">
              <label className="text-sm font-medium">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter value..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  data-testid="input-search-value"
                />
                <Button
                  size="icon"
                  onClick={handleSearch}
                  disabled={!searchValue || searchMutation.isPending}
                  data-testid="button-search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <label className="text-sm font-medium">Traversal</label>
              <Select value={traversalType} onValueChange={(v) => setTraversalType(v as TraversalType)}>
                <SelectTrigger data-testid="select-traversal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inorder">In-Order</SelectItem>
                  <SelectItem value="preorder">Pre-Order</SelectItem>
                  <SelectItem value="postorder">Post-Order</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleTraverse}
                disabled={traverseMutation.isPending}
                data-testid="button-traverse"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {traverseMutation.isPending ? "Traversing..." : "Traverse"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <label className="text-sm font-medium">Zoom</label>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                  data-testid="button-zoom-out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center font-mono text-sm">
                  {(zoom * 100).toFixed(0)}%
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                  data-testid="button-zoom-in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleReset}
              data-testid="button-reset"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-4 flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg font-medium">Visualization</CardTitle>
            {buildMutation.data && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  Nodes: {buildMutation.data.visualization?.nodeCount || 0}
                </Badge>
                <Badge variant="outline" className="font-mono">
                  Height: {buildMutation.data.visualization?.height || 0}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent className="h-[calc(100%-5rem)] p-0">
            {!buildMutation.data ? (
              renderEmptyState()
            ) : (
              <div className="w-full h-full overflow-auto bg-muted/20 flex items-center justify-center">
                <svg
                  ref={svgRef}
                  width={800 * zoom}
                  height={600 * zoom}
                  viewBox="0 0 800 600"
                  className="max-w-full"
                >
                  <g transform="translate(400, 50)">
                    {buildMutation.data.visualization?.root &&
                      renderBSTNode(buildMutation.data.visualization.root, 0, 0, 0, 350)}
                  </g>
                </svg>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">Operation Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-22rem)]">
              {operations.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No operations recorded yet. Build a tree or perform a search to see the log.
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  {operations.map((op, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                    >
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              op.type === "insert" ? "bg-chart-2/20 text-chart-2" :
                              op.type === "search" ? "bg-chart-1/20 text-chart-1" :
                              op.type === "traverse" ? "bg-chart-3/20" :
                              "bg-chart-5/20 text-chart-5"
                            }`}
                          >
                            {op.type.toUpperCase()}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">
                            Key: {op.key}
                          </span>
                        </div>
                        {op.comparisons && op.comparisons.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Path: {op.path.join(" → ")}
                          </p>
                        )}
                        <Badge
                          variant={op.result === "found" || op.result === "inserted" ? "default" : "secondary"}
                          className="mt-1 text-xs"
                        >
                          {op.result}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
