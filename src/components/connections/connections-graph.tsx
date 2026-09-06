"use client";

import "@xyflow/react/dist/style.css";

import { Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import { useMemo, useState } from "react";

type GraphPerson = {
  id: string;
  publicId: string;
  fullName: string;
};

type GraphRelationship = {
  id: string;
  publicId: string;
  personAId: string;
  personBId: string;
  relationshipType: string;
};

type ConnectionsGraphProps = {
  people: GraphPerson[];
  relationships: GraphRelationship[];
};

export function ConnectionsGraph({ people, relationships }: ConnectionsGraphProps) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [minDegree, setMinDegree] = useState(0);
  const [centerId, setCenterId] = useState("all");
  const [depth, setDepth] = useState(1);

  const relationshipTypes = useMemo(
    () => Array.from(new Set(relationships.map((item) => item.relationshipType))).sort(),
    [relationships],
  );

  const graph = useMemo(() => {
    const degrees = new Map<string, number>();
    for (const person of people) {
      degrees.set(person.id, 0);
    }

    for (const rel of relationships) {
      degrees.set(rel.personAId, (degrees.get(rel.personAId) ?? 0) + 1);
      degrees.set(rel.personBId, (degrees.get(rel.personBId) ?? 0) + 1);
    }

    const lowered = query.trim().toLowerCase();
    const filteredPeople = people.filter((person) => {
      const matchQuery =
        lowered.length === 0 ||
        person.fullName.toLowerCase().includes(lowered) ||
        person.publicId.toLowerCase().includes(lowered);
      const degree = degrees.get(person.id) ?? 0;
      const matchDegree = degree >= minDegree;
      return matchQuery && matchDegree;
    });

    const filteredByType = relationships.filter((rel) => {
      const typeMatch = typeFilter === "all" || rel.relationshipType === typeFilter;
      return typeMatch;
    });

    const allowed = new Set(filteredPeople.map((person) => person.id));
    const baseRelationships = filteredByType.filter(
      (rel) => allowed.has(rel.personAId) && allowed.has(rel.personBId),
    );

    let filteredRelationships = baseRelationships;
    let centerReachable = new Set<string>();

    if (centerId !== "all" && allowed.has(centerId)) {
      const adjacency = new Map<string, string[]>();
      for (const person of filteredPeople) {
        adjacency.set(person.id, []);
      }
      for (const rel of baseRelationships) {
        adjacency.get(rel.personAId)?.push(rel.personBId);
        adjacency.get(rel.personBId)?.push(rel.personAId);
      }

      const queue: Array<{ id: string; depth: number }> = [{ id: centerId, depth: 0 }];
      centerReachable = new Set([centerId]);

      while (queue.length > 0) {
        const current = queue.shift();
        if (!current || current.depth >= depth) {
          continue;
        }

        for (const neighbor of adjacency.get(current.id) ?? []) {
          if (centerReachable.has(neighbor)) {
            continue;
          }

          centerReachable.add(neighbor);
          queue.push({ id: neighbor, depth: current.depth + 1 });
        }
      }

      filteredRelationships = baseRelationships.filter(
        (rel) => centerReachable.has(rel.personAId) && centerReachable.has(rel.personBId),
      );
    }

    const linked = new Set<string>();
    for (const rel of filteredRelationships) {
      linked.add(rel.personAId);
      linked.add(rel.personBId);
    }

    const displayPeople = filteredPeople.filter((person) => {
      if (!linked.has(person.id)) {
        return false;
      }
      if (centerId === "all") {
        return true;
      }
      return centerReachable.has(person.id);
    });

    const nodes = displayPeople.map((person, index) => {
      const columns = Math.max(1, Math.ceil(Math.sqrt(displayPeople.length || 1)));
      const row = Math.floor(index / columns);
      const col = index % columns;
      return {
        id: person.id,
        position: { x: col * 240, y: row * 170 },
        data: {
          label: `${person.fullName} (${degrees.get(person.id) ?? 0})`,
        },
        style: {
          background: "var(--surface)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "12px 16px",
          width: 200,
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
        },
      };
    });

    const edges = filteredRelationships.map((rel) => ({
      id: rel.id,
      source: rel.personAId,
      target: rel.personBId,
      label: rel.relationshipType,
      animated: false,
    }));

    return {
      nodes,
      edges,
      visiblePeopleCount: displayPeople.length,
      visibleRelationshipCount: filteredRelationships.length,
    };
  }, [centerId, depth, minDegree, people, query, relationships, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search person or public ID"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="all">All relationship types</option>
          {relationshipTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
          Min degree
          <input
            type="range"
            min={0}
            max={10}
            value={minDegree}
            onChange={(event) => setMinDegree(Number(event.target.value))}
            className="w-full accent-slate-700 dark:accent-slate-200"
          />
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{minDegree}</span>
        </label>
        <select
          value={centerId}
          onChange={(event) => setCenterId(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="all">Traversal center: full graph</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.fullName}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
          Depth
          <input
            type="range"
            min={1}
            max={5}
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
            className="w-full accent-slate-700 disabled:opacity-50 dark:accent-slate-200"
            disabled={centerId === "all"}
          />
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{depth}</span>
        </label>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
          <p>Visible people: {graph.visiblePeopleCount}</p>
          <p>Visible relationships: {graph.visibleRelationshipCount}</p>
        </div>
      </div>

      <div className="h-[72vh] min-h-[500px] overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
        <ReactFlow
          fitView
          nodes={graph.nodes}
          edges={graph.edges}
          className="connections-flow"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <Background color="var(--border)" bgColor="var(--surface)" />
          <MiniMap
            pannable
            zoomable
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
            nodeColor="var(--foreground)"
            maskColor="rgba(15, 23, 42, 0.08)"
          />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
