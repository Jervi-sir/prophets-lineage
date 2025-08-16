'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { PersonSheet, prefetchPerson } from './person-sheet';
import { PersonType } from '../generated/prisma';

type ApiNode = { id: string; data: { label: string; slug: string; type?: PersonType }; position: { x: number; y: number } };
type ApiEdge = { id: string; source: string; target: string; type?: string };

const nodeWidth = 180;
const nodeHeight = 80;
const DIRECTION: 'TB' | 'LR' = 'TB';

function layout(nodes: Node[], edges: Edge[], direction: 'LR' | 'TB' = 'TB') {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  // More spacing for vertical tree
  g.setGraph({
    rankdir: direction,
    nodesep: 40,       // space between siblings
    ranksep: 90,       // vertical distance between generations
    marginx: 20,
    marginy: 20,
    ranker: 'tight-tree' // nice for trees
  });

  nodes.forEach((n) => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id);
      return {
        ...n,
        position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
        // For tree, links come from the bottom of parent to top of child
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      };
    }),
    edges,
  };
}

export default function LineagePage() {
  const [rawNodes, setRawNodes] = useState<ApiNode[]>([]);
  const [rawEdges, setRawEdges] = useState<ApiEdge[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/lineage'); // or ?rootSlug=...
      const data = await res.json();
      setRawNodes(data.nodes || []);
      setRawEdges(data.edges || []);
    })();
  }, []);

  const { laidNodes, laidEdges } = useMemo(() => {
    const ns: Node[] = rawNodes.map((n) => {
      const t = (n.data as any)?.type as PersonType | undefined;
      const gender = (n.data as any)?.gender;
      // determine background color based on person type
      let bg = '#ffffff'; // PERSON / شخص
      switch (t) {
        case 'PROPHET': bg = '#c8e6c9'; break; // green
        case 'MESSENGER': bg = '#bbdefb'; break; // blue
        case 'MESSENGER_PROPHET': bg = '#ffe0b2'; break; // orange
      }
      // Convert enum to display text
      const typeLabel =
        t === 'PROPHET' ? 'نبي' :
          t === 'MESSENGER' ? 'رسول' :
            t === 'MESSENGER_PROPHET' ? 'نبي\\رسول' :
              'شخص';
      // Gender symbol or label
      const genderLabel = gender === 'male' ? 'ذكر' : gender === 'female' ? 'أنثى' : '—';

      return {
        id: n.id,
        data: {
          label: (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 12 }}>
              <strong>{n.data.label}</strong>
              <span style={{ fontSize: 11, color: '#555' }}>{genderLabel}</span>
              <span style={{ fontSize: 11, fontWeight: 'bold' }}>{typeLabel}</span>
            </div>
          ),
          slug: n.data.slug,
        },
        position: { x: 0, y: 0 },
        style: {
          width: nodeWidth,
          height: nodeHeight,
          borderRadius: 12,
          padding: 8,
          border: '1px solid #cfd8dc',
          background: bg,
          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          fontSize: 13,
          cursor: 'pointer',
        },
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
      };
    });


    const es: Edge[] = rawEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      // Step edges look best for vertical trees (right-angle elbows)
      type: 'step',
      animated: false,
    }));

    const { nodes: LNodes, edges: LEdges } = layout(ns, es, DIRECTION);
    return { laidNodes: LNodes, laidEdges: LEdges };
  }, [rawNodes, rawEdges]);

  useEffect(() => {
    setNodes(laidNodes);
    setEdges(laidEdges);
  }, [laidNodes, laidEdges, setNodes, setEdges]);

  const onNodeClick = (_: any, node: Node) => {
    const s = (node.data as any)?.slug;
    if (!s) return;
    setSlug(s);
    setOpen(true);
  };

  const onNodeMouseEnter = (_: any, node: Node) => {
    const s = (node.data as any)?.slug;
    if (s) prefetchPerson(s);
  };

  return (
    <>
      <div style={{ height: '100vh', width: '100%', }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          panOnScroll
          zoomOnPinch
        >
          <Background />
          <MiniMap 
            nodeColor={(n) => (n.style as any)?.backgroundColor || '#eee'} 
            
          />
          <Controls />
        </ReactFlow>
      </div>

      <PersonSheet
        open={open}
        slug={slug}
        onOpenChange={setOpen}
        onRequestSlugChange={(next) => setSlug(next)}
        side="left"
      />
    </>
  );
}
