/**
 * Movie graph algorithms: cycle detection and rewatch ordering.
 *
 * Implements:
 * 1. Directed cycle detection using Depth-First Search (DFS) with 3-color state.
 * 2. Prerequisite-first topological ordering for rewatch plans using DFS with a visited set.
 *
 * Graph representation:
 * Adjacency list (Map<string, string[]>) where:
 * - Each key is a movie ID.
 * - The array of values are the prerequisite movie IDs that must be watched first.
 * - An edge u -> v means movie u requires prerequisite v.
 */

/**
 * DFS node visit state:
 * - UNVISITED (0): Not yet encountered during search.
 * - VISITING (1): Currently on the recursion stack (active exploration path).
 * - VISITED (2): Fully explored along all descendants.
 */
const UNVISITED = 0;
const VISITING = 1;
const VISITED = 2;

/**
 * Detects whether the proposed movie prerequisite graph contains any direct or indirect cycles.
 *
 * Approach:
 * - Iterates over all vertices in the graph to ensure all connected components are checked.
 * - Uses a standard DFS recursion stack (color-state).
 * - If a neighbor is encountered that is currently in the VISITING state, a back-edge is found,
 *   proving the existence of a circular dependency.
 *
 * Time Complexity: O(V + E) where V is the number of vertices and E is the number of edges.
 * Space Complexity: O(V) for the state map and recursion stack.
 *
 * @param graph Adjacency list mapping movie ID to array of prerequisite IDs.
 * @returns true if a cycle is detected, false otherwise.
 */
export function hasCycle(graph: Map<string, string[]>): boolean {
  const state = new Map<string, number>();

  function dfs(nodeId: string): boolean {
    state.set(nodeId, VISITING);

    const prerequisites = graph.get(nodeId) || [];
    for (const prereqId of prerequisites) {
      const neighborState = state.get(prereqId) || UNVISITED;

      // Encountering a node currently on the recursion stack indicates a back-edge (cycle)
      if (neighborState === VISITING) {
        return true;
      }

      if (neighborState === UNVISITED) {
        if (dfs(prereqId)) {
          return true;
        }
      }
    }

    state.set(nodeId, VISITED);
    return false;
  }

  for (const nodeId of graph.keys()) {
    if ((state.get(nodeId) || UNVISITED) === UNVISITED) {
      if (dfs(nodeId)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Computes a prerequisite-first topological ordering of all transitive prerequisites
 * for a target movie using DFS with a visited set.
 *
 * Requirements:
 * - Every transitive prerequisite appears exactly once.
 * - The target movie itself is excluded from the returned order.
 * - Prerequisite-first ordering: every prerequisite appears before any movie that depends on it.
 * - Shared prerequisites are deduplicated and placed before all dependent movies.
 *
 * Approach:
 * - Performs post-order DFS traversal starting from the target movie.
 * - Visits each prerequisite's own prerequisites before adding the prerequisite to the result.
 * - Maintains a `visited` set to ensure shared dependencies are traversed only once.
 *
 * Time Complexity: O(V + E) for the reachable portion of the dependency graph.
 * Space Complexity: O(V) for the visited set, recursion stack, and result array.
 *
 * @param targetId The ID of the target movie.
 * @param graph Adjacency list mapping movie ID to array of prerequisite IDs.
 * @returns Array of movie IDs in prerequisite-first order, excluding targetId.
 */
export function getPrerequisiteOrder(targetId: string, graph: Map<string, string[]>): string[] {
  const visited = new Set<string>();
  const order: string[] = [];

  function dfs(nodeId: string): void {
    if (visited.has(nodeId)) {
      return;
    }
    visited.add(nodeId);

    const prerequisites = graph.get(nodeId) || [];
    for (const prereqId of prerequisites) {
      dfs(prereqId);
    }

    // Append to result list after all of its prerequisites have been processed.
    // Exclude the target movie itself.
    if (nodeId !== targetId) {
      order.push(nodeId);
    }
  }

  dfs(targetId);

  return order;
}
