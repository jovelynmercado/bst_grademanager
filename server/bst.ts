import type { BSTNode, BSTOperation, BSTVisualizationData } from "@shared/schema";

class BinarySearchTreeNode<T> {
  value: T;
  key: number | string;
  left: BinarySearchTreeNode<T> | null = null;
  right: BinarySearchTreeNode<T> | null = null;

  constructor(key: number | string, value: T) {
    this.key = key;
    this.value = value;
  }
}

export class BinarySearchTree<T> {
  private root: BinarySearchTreeNode<T> | null = null;
  private operations: BSTOperation[] = [];

  private compare(a: number | string, b: number | string): number {
    if (typeof a === "number" && typeof b === "number") {
      return a - b;
    }
    return String(a).localeCompare(String(b));
  }

  insert(key: number | string, value: T): BSTOperation {
    const path: (number | string)[] = [];
    const comparisons: string[] = [];

    const insertNode = (
      node: BinarySearchTreeNode<T> | null,
      key: number | string,
      value: T
    ): BinarySearchTreeNode<T> => {
      if (node === null) {
        return new BinarySearchTreeNode(key, value);
      }

      path.push(node.key);
      const cmp = this.compare(key, node.key);

      if (cmp < 0) {
        comparisons.push(`${key} < ${node.key}, go left`);
        node.left = insertNode(node.left, key, value);
      } else if (cmp > 0) {
        comparisons.push(`${key} > ${node.key}, go right`);
        node.right = insertNode(node.right, key, value);
      } else {
        comparisons.push(`${key} = ${node.key}, update value`);
        node.value = value;
      }

      return node;
    };

    this.root = insertNode(this.root, key, value);

    const operation: BSTOperation = {
      type: "insert",
      key,
      path,
      comparisons,
      result: "inserted",
    };

    this.operations.push(operation);
    return operation;
  }

  search(key: number | string): { node: T | null; operation: BSTOperation } {
    const path: (number | string)[] = [];
    const comparisons: string[] = [];
    let result: T | null = null;

    const searchNode = (
      node: BinarySearchTreeNode<T> | null,
      key: number | string
    ): T | null => {
      if (node === null) {
        return null;
      }

      path.push(node.key);
      const cmp = this.compare(key, node.key);

      if (cmp < 0) {
        comparisons.push(`${key} < ${node.key}, go left`);
        return searchNode(node.left, key);
      } else if (cmp > 0) {
        comparisons.push(`${key} > ${node.key}, go right`);
        return searchNode(node.right, key);
      } else {
        comparisons.push(`${key} = ${node.key}, found!`);
        return node.value;
      }
    };

    result = searchNode(this.root, key);

    const operation: BSTOperation = {
      type: "search",
      key,
      path,
      comparisons,
      result: result !== null ? "found" : "not_found",
    };

    this.operations.push(operation);
    return { node: result, operation };
  }

  delete(key: number | string): BSTOperation {
    const path: (number | string)[] = [];
    const comparisons: string[] = [];
    let deleted = false;

    const findMin = (node: BinarySearchTreeNode<T>): BinarySearchTreeNode<T> => {
      while (node.left !== null) {
        node = node.left;
      }
      return node;
    };

    const deleteNode = (
      node: BinarySearchTreeNode<T> | null,
      key: number | string
    ): BinarySearchTreeNode<T> | null => {
      if (node === null) {
        return null;
      }

      path.push(node.key);
      const cmp = this.compare(key, node.key);

      if (cmp < 0) {
        comparisons.push(`${key} < ${node.key}, go left`);
        node.left = deleteNode(node.left, key);
      } else if (cmp > 0) {
        comparisons.push(`${key} > ${node.key}, go right`);
        node.right = deleteNode(node.right, key);
      } else {
        deleted = true;
        comparisons.push(`${key} = ${node.key}, deleting...`);

        if (node.left === null && node.right === null) {
          comparisons.push("Node is a leaf, remove it");
          return null;
        }

        if (node.left === null) {
          comparisons.push("Node has only right child, replace with it");
          return node.right;
        }

        if (node.right === null) {
          comparisons.push("Node has only left child, replace with it");
          return node.left;
        }

        const successor = findMin(node.right);
        comparisons.push(`Node has two children, replace with successor ${successor.key}`);
        node.key = successor.key;
        node.value = successor.value;
        node.right = deleteNode(node.right, successor.key);
      }

      return node;
    };

    this.root = deleteNode(this.root, key);

    const operation: BSTOperation = {
      type: "delete",
      key,
      path,
      comparisons,
      result: deleted ? "deleted" : "not_found",
    };

    this.operations.push(operation);
    return operation;
  }

  inorderTraversal(): { order: (number | string)[]; operation: BSTOperation } {
    const order: (number | string)[] = [];
    const comparisons: string[] = [];

    const traverse = (node: BinarySearchTreeNode<T> | null): void => {
      if (node === null) return;
      traverse(node.left);
      order.push(node.key);
      comparisons.push(`Visit ${node.key}`);
      traverse(node.right);
    };

    traverse(this.root);

    const operation: BSTOperation = {
      type: "traverse",
      key: "inorder",
      path: order,
      comparisons,
      result: "traversed",
    };

    this.operations.push(operation);
    return { order, operation };
  }

  preorderTraversal(): { order: (number | string)[]; operation: BSTOperation } {
    const order: (number | string)[] = [];
    const comparisons: string[] = [];

    const traverse = (node: BinarySearchTreeNode<T> | null): void => {
      if (node === null) return;
      order.push(node.key);
      comparisons.push(`Visit ${node.key}`);
      traverse(node.left);
      traverse(node.right);
    };

    traverse(this.root);

    const operation: BSTOperation = {
      type: "traverse",
      key: "preorder",
      path: order,
      comparisons,
      result: "traversed",
    };

    this.operations.push(operation);
    return { order, operation };
  }

  postorderTraversal(): { order: (number | string)[]; operation: BSTOperation } {
    const order: (number | string)[] = [];
    const comparisons: string[] = [];

    const traverse = (node: BinarySearchTreeNode<T> | null): void => {
      if (node === null) return;
      traverse(node.left);
      traverse(node.right);
      order.push(node.key);
      comparisons.push(`Visit ${node.key}`);
    };

    traverse(this.root);

    const operation: BSTOperation = {
      type: "traverse",
      key: "postorder",
      path: order,
      comparisons,
      result: "traversed",
    };

    this.operations.push(operation);
    return { order, operation };
  }

  getHeight(): number {
    const height = (node: BinarySearchTreeNode<T> | null): number => {
      if (node === null) return 0;
      return 1 + Math.max(height(node.left), height(node.right));
    };
    return height(this.root);
  }

  getNodeCount(): number {
    const count = (node: BinarySearchTreeNode<T> | null): number => {
      if (node === null) return 0;
      return 1 + count(node.left) + count(node.right);
    };
    return count(this.root);
  }

  toVisualizationData(): BSTVisualizationData {
    const convertNode = (
      node: BinarySearchTreeNode<T> | null,
      depth: number,
      x: number,
      width: number
    ): BSTNode<T> | null => {
      if (node === null) return null;

      const bstNode: BSTNode<T> = {
        value: node.value,
        key: node.key,
        depth,
        position: { x, y: depth * 80 + 40 },
        left: convertNode(node.left, depth + 1, x - width / 2, width / 2),
        right: convertNode(node.right, depth + 1, x + width / 2, width / 2),
      };

      return bstNode;
    };

    const height = this.getHeight();
    const initialWidth = Math.pow(2, height) * 40;

    return {
      root: convertNode(this.root, 0, initialWidth / 2, initialWidth / 2),
      operations: [...this.operations],
      traversalOrder: [],
      nodeCount: this.getNodeCount(),
      height,
    };
  }

  getOperations(): BSTOperation[] {
    return [...this.operations];
  }

  clearOperations(): void {
    this.operations = [];
  }

  clear(): void {
    this.root = null;
    this.operations = [];
  }
}

export function buildBSTFromGrades(
  grades: Array<{ key: number | string; value: any }>
): BinarySearchTree<any> {
  const bst = new BinarySearchTree<any>();
  for (const grade of grades) {
    bst.insert(grade.key, grade.value);
  }
  return bst;
}

export function buildBSTFromStudents(
  students: Array<{ id: string; studentId: string; firstName: string; lastName: string }>,
  keyType: "studentId" | "name" | "id" = "studentId"
): BinarySearchTree<any> {
  const bst = new BinarySearchTree<any>();
  
  for (const student of students) {
    let key: number | string;
    switch (keyType) {
      case "studentId":
        key = student.studentId;
        break;
      case "name":
        key = `${student.lastName}, ${student.firstName}`;
        break;
      case "id":
        key = student.id;
        break;
      default:
        key = student.studentId;
    }
    bst.insert(key, student);
  }
  
  return bst;
}
