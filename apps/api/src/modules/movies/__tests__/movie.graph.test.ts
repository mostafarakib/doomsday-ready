import { describe, it, expect } from 'vitest';
import { hasCycle, getPrerequisiteOrder } from '../movie.graph.js';

describe('Movie Graph Algorithms (Unit Tests)', () => {
  describe('hasCycle — DFS Cycle Detection', () => {
    it('returns false for an empty graph', () => {
      const graph = new Map<string, string[]>();
      expect(hasCycle(graph)).toBe(false);
    });

    it('returns false for independent nodes with no edges', () => {
      const graph = new Map<string, string[]>([
        ['A', []],
        ['B', []],
        ['C', []],
      ]);
      expect(hasCycle(graph)).toBe(false);
    });

    it('returns false for a valid linear DAG (A -> B -> C)', () => {
      const graph = new Map<string, string[]>([
        ['A', ['B']],
        ['B', ['C']],
        ['C', []],
      ]);
      expect(hasCycle(graph)).toBe(false);
    });

    it('returns false for a diamond DAG with shared prerequisites', () => {
      // D depends on B and C; both B and C depend on A; A has no prerequisites
      const graph = new Map<string, string[]>([
        ['D', ['B', 'C']],
        ['B', ['A']],
        ['C', ['A']],
        ['A', []],
      ]);
      expect(hasCycle(graph)).toBe(false);
    });

    it('detects a direct self-cycle (A -> A)', () => {
      const graph = new Map<string, string[]>([['A', ['A']]]);
      expect(hasCycle(graph)).toBe(true);
    });

    it('detects a 2-node cycle (A -> B and B -> A)', () => {
      const graph = new Map<string, string[]>([
        ['A', ['B']],
        ['B', ['A']],
      ]);
      expect(hasCycle(graph)).toBe(true);
    });

    it('detects an indirect cycle in a larger graph (A -> B -> C -> A)', () => {
      const graph = new Map<string, string[]>([
        ['A', ['B']],
        ['B', ['C']],
        ['C', ['A']],
        ['D', ['C']], // Disconnected branch pointing to cycle
      ]);
      expect(hasCycle(graph)).toBe(true);
    });

    it('detects a cycle in a disconnected component', () => {
      const graph = new Map<string, string[]>([
        ['A', ['B']],
        ['B', []],
        // Disconnected component with a cycle
        ['X', ['Y']],
        ['Y', ['Z']],
        ['Z', ['X']],
      ]);
      expect(hasCycle(graph)).toBe(true);
    });
  });

  describe('getPrerequisiteOrder — Prerequisite-First Topological Order', () => {
    it('returns empty array when target movie has no prerequisites', () => {
      const graph = new Map<string, string[]>([['A', []]]);
      const order = getPrerequisiteOrder('A', graph);
      expect(order).toEqual([]);
    });

    it('returns prerequisites in prerequisite-first order for a simple chain', () => {
      // C depends on B, B depends on A
      // To watch C, user must watch A first, then B
      const graph = new Map<string, string[]>([
        ['C', ['B']],
        ['B', ['A']],
        ['A', []],
      ]);
      const order = getPrerequisiteOrder('C', graph);
      expect(order).toEqual(['A', 'B']);
      expect(order).not.toContain('C'); // Target excluded
    });

    it('handles diamond DAG with shared dependencies, including shared node only once', () => {
      // D requires B and C; both B and C require A
      const graph = new Map<string, string[]>([
        ['D', ['B', 'C']],
        ['B', ['A']],
        ['C', ['A']],
        ['A', []],
      ]);
      const order = getPrerequisiteOrder('D', graph);

      // A must appear before B and before C
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
      expect(order.indexOf('A')).toBeLessThan(order.indexOf('C'));
      // A appears exactly once
      expect(order.filter((id) => id === 'A')).toHaveLength(1);
      // Total 3 prerequisites
      expect(order).toHaveLength(3);
      expect(order).not.toContain('D');
    });

    it('excludes target movie even with multiple prerequisite branches', () => {
      const graph = new Map<string, string[]>([
        ['Endgame', ['InfinityWar', 'CivilWar']],
        ['InfinityWar', ['CivilWar', 'Ragnarok']],
        ['CivilWar', ['Avengers', 'FirstAvenger']],
        ['Ragnarok', ['Avengers']],
        ['Avengers', ['IronMan']],
        ['FirstAvenger', []],
        ['IronMan', []],
      ]);

      const order = getPrerequisiteOrder('Endgame', graph);

      expect(order).not.toContain('Endgame');
      // IronMan must appear before Avengers
      expect(order.indexOf('IronMan')).toBeLessThan(order.indexOf('Avengers'));
      // Avengers must appear before CivilWar and Ragnarok
      expect(order.indexOf('Avengers')).toBeLessThan(order.indexOf('CivilWar'));
      expect(order.indexOf('Avengers')).toBeLessThan(order.indexOf('Ragnarok'));
      // CivilWar and Ragnarok must appear before InfinityWar
      expect(order.indexOf('CivilWar')).toBeLessThan(order.indexOf('InfinityWar'));
      expect(order.indexOf('Ragnarok')).toBeLessThan(order.indexOf('InfinityWar'));
      // Each movie appears once
      const uniqueMovies = new Set(order);
      expect(uniqueMovies.size).toBe(order.length);
    });
  });
});
