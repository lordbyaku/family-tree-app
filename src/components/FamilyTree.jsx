import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow,
    ReactFlowProvider,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useFamily } from '../context/FamilyContext';
import CustomNode from './CustomNode';
import MarriageNode from './MarriageNode';
import { filterMembers } from '../utils/familyFilter';

const nodeTypes = {
    member: CustomNode,
    marriage: MarriageNode,
};

const getLayoutedElements = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 260; // 256px + margin
    const nodeHeight = 100;

    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 });

    nodes.forEach((node) => {
        if (node.type === 'member') {
            dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
        } else {
            // Marriage nodes are small
            dagreGraph.setNode(node.id, { width: 40, height: 40 });
        }
    });

    edges.forEach((edge) => {
        // Dagre needs to know about parent-child hierarchy to rank nodes correctly
        // We use the original relationship logic for Dagre even if rendering is different
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        const isMember = node.type === 'member';
        const w = isMember ? nodeWidth : 40;
        const h = isMember ? nodeHeight : 40;

        return {
            ...node,
            position: {
                x: nodeWithPosition.x - w / 2,
                y: nodeWithPosition.y - h / 2,
            },
            targetPosition: 'top',
            sourcePosition: 'bottom',
        };
    });

    return { nodes: layoutedNodes, edges };
};

const FamilyTree = (props) => {
    const { members } = useFamily();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { setCenter } = useReactFlow();

    // Constant for layout key (Slug separated)
    const LAYOUT_KEY = `family-tree-layout-${members[0]?.tree_slug || 'default'}`;
    // Ideally we use treeSlug from context, let's grab it properly
    const { treeSlug } = useFamily();
    const DYNAMIC_LAYOUT_KEY = `family_layout_${treeSlug}`;

    // Handle focus on specific node (Search)
    useEffect(() => {
        if (props.focusNodeId && nodes.length > 0) {
            const node = nodes.find(n => n.id === props.focusNodeId);
            if (node) {
                const x = node.position.x + (node.width || 260) / 2;
                const y = node.position.y + (node.height || 100) / 2;
                const zoom = 1.5;

                setCenter(x, y, { zoom, duration: 1000 });
            }
        }
    }, [props.focusNodeId, nodes, setCenter]);

    useEffect(() => {
        if (members.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }

        // Apply filter if active
        const displayMembers = filterMembers(members, props.filterMode, props.filterRootId);
        const displayedIds = new Set(displayMembers.map(m => m.id));

        // 1. Identify Marriages (Unique pairs)
        const marriages = [];
        const marriageMap = new Map(); // key: sorted_p1_p2, value: marriageNodeId

        displayMembers.forEach(m => {
            if (m.spouses && m.spouses.length > 0) {
                m.spouses.forEach(spouseId => {
                    const sid = typeof spouseId === 'string' ? spouseId : spouseId.id;
                    if (displayedIds.has(sid)) {
                        const pair = [m.id, sid].sort();
                        const key = pair.join('__');
                        if (!marriageMap.has(key)) {
                            const mId = `marriage-${key}`;
                            marriageMap.set(key, mId);
                            marriages.push({ id: mId, p1: pair[0], p2: pair[1] });
                        }
                    }
                });
            }
        });

        // 2. Build Nodes
        const initialNodes = [
            ...displayMembers.map((m) => ({
                id: m.id,
                type: 'member',
                data: {
                    name: m.name,
                    gender: m.gender,
                    birthDate: m.birthDate,
                    deathDate: m.deathDate,
                    isDeceased: m.isDeceased,
                    photo: m.photo,
                    onEdit: props.onEdit,
                    onView: props.onView,
                    onFilterRequest: props.onFilterRequest
                },
                position: { x: 0, y: 0 },
            })),
            ...marriages.map(m => ({
                id: m.id,
                type: 'marriage',
                data: {},
                position: { x: 0, y: 0 }
            }))
        ];

        // 3. Build Edges (For Dagre Layout)
        // To keep Dagre happy and structure correct, we connect Member -> Marriage and Marriage -> Member
        const dagreEdges = [];

        // Marriage connections
        marriages.forEach(m => {
            dagreEdges.push({ id: `de-${m.p1}-${m.id}`, source: m.p1, target: m.id });
            dagreEdges.push({ id: `de-${m.p2}-${m.id}`, source: m.p2, target: m.id });
        });

        // Children connections
        displayMembers.forEach(m => {
            if (m.parents && m.parents.length > 0) {
                const parentIds = m.parents.map(p => typeof p === 'string' ? p : p.id).filter(pid => displayedIds.has(pid));

                if (parentIds.length >= 2) {
                    const key = [...parentIds].sort().join('__');
                    const mId = marriageMap.get(key);
                    if (mId) {
                        // Connect child to marriage node
                        dagreEdges.push({ id: `de-${mId}-${m.id}`, source: mId, target: m.id });
                    } else {
                        // Fallback to single parents if marriage not found
                        parentIds.forEach(pid => {
                            dagreEdges.push({ id: `de-${pid}-${m.id}`, source: pid, target: m.id });
                        });
                    }
                } else {
                    // Single parent
                    parentIds.forEach(pid => {
                        dagreEdges.push({ id: `de-${pid}-${m.id}`, source: pid, target: m.id });
                    });
                }
            }
        });

        // 4. Run Layout
        const { nodes: layoutedNodes } = getLayoutedElements(initialNodes, dagreEdges);

        // 5. Build Final Edges for Rendering with proper styling
        const finalEdges = [];

        // Spouse -> Marriage Edges
        marriages.forEach(m => {
            const p1 = layoutedNodes.find(n => n.id === m.p1);
            const p2 = layoutedNodes.find(n => n.id === m.p2);
            const mNode = layoutedNodes.find(n => n.id === m.id);

            if (p1 && p2 && mNode) {
                // Adjust handles for visual flow
                const p1Side = p1.position.x < p2.position.x ? 'right' : 'left';
                const p2Side = p2.position.x < p1.position.x ? 'right' : 'left';

                finalEdges.push({
                    id: `e-${m.p1}-${m.id}`,
                    source: m.p1,
                    target: m.id,
                    type: 'straight',
                    sourceHandle: `${p1Side}-source`,
                    targetHandle: p1Side === 'right' ? 'left' : 'right',
                    style: { stroke: props.isDarkMode ? '#db2777' : '#ec4899', strokeWidth: 3 }
                });

                finalEdges.push({
                    id: `e-${m.p2}-${m.id}`,
                    source: m.p2,
                    target: m.id,
                    type: 'straight',
                    sourceHandle: `${p2Side}-source`,
                    targetHandle: p2Side === 'right' ? 'left' : 'right',
                    style: { stroke: props.isDarkMode ? '#db2777' : '#ec4899', strokeWidth: 3 }
                });
            }
        });

        // Marriage/Parent -> Child Edges
        displayMembers.forEach(m => {
            if (m.parents && m.parents.length > 0) {
                const parentIds = m.parents.map(p => typeof p === 'string' ? p : p.id).filter(pid => displayedIds.has(pid));
                const isStep = m.parents.some(p => typeof p === 'object' && p.type === 'step');

                let mId = null;
                if (parentIds.length >= 2) {
                    const key = [...parentIds].sort().join('__');
                    mId = marriageMap.get(key);
                }

                if (mId) {
                    finalEdges.push({
                        id: `e-${mId}-${m.id}`,
                        source: mId,
                        target: m.id,
                        type: 'smoothstep',
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                        animated: true,
                        style: { stroke: props.isDarkMode ? '#3b82f6' : '#2563eb', strokeWidth: 2.5 }
                    });
                } else {
                    parentIds.forEach(pid => {
                        finalEdges.push({
                            id: `e-${pid}-${m.id}`,
                            source: pid,
                            target: m.id,
                            type: 'smoothstep',
                            sourceHandle: 'bottom',
                            targetHandle: 'top',
                            animated: !isStep,
                            style: {
                                stroke: isStep
                                    ? (props.isDarkMode ? '#94a3b8' : '#cbd5e1')
                                    : (props.isDarkMode ? '#3b82f6' : '#2563eb'),
                                strokeWidth: isStep ? 1.5 : 2.5,
                                strokeDasharray: isStep ? '5,5' : '0'
                            },
                        });
                    });
                }
            }
        });

        // 6. Manual Layout adjustment if needed
        const finalNodes = layoutedNodes.map(node => {
            if (props.layoutMode === 'manual') {
                try {
                    const savedLayout = localStorage.getItem(DYNAMIC_LAYOUT_KEY);
                    if (savedLayout) {
                        const { positions } = JSON.parse(savedLayout);
                        if (positions && positions[node.id]) {
                            return { ...node, position: positions[node.id] };
                        }
                    }
                } catch (e) { }
            }
            return node;
        });

        setNodes(finalNodes);
        setEdges(finalEdges);
    }, [members, setNodes, setEdges, props.onEdit, props.onView, props.isDarkMode, props.filterMode, props.filterRootId, props.onFilterRequest, props.layoutMode, DYNAMIC_LAYOUT_KEY]); // added dependency

    const onNodeDragStop = useCallback((event, node) => {
        if (props.layoutMode !== 'manual') return;

        try {
            const savedLayout = localStorage.getItem(DYNAMIC_LAYOUT_KEY);
            let layout = { positions: {} };
            if (savedLayout) {
                layout = JSON.parse(savedLayout);
            }

            layout.positions[node.id] = node.position;
            localStorage.setItem(DYNAMIC_LAYOUT_KEY, JSON.stringify(layout));
        } catch (e) {
            console.error("Failed to save custom layout", e);
        }
    }, [props.layoutMode]);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                nodeTypes={nodeTypes}
                nodesDraggable={props.layoutMode === 'manual'}
                fitView
                className="bg-slate-50 dark:bg-slate-900 transition-colors duration-300"
            >
                <Background color={props.isDarkMode ? '#334155' : '#cbd5e1'} gap={20} />
                <Controls className="bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden [&>button]:!bg-white dark:[&>button]:!bg-slate-800 [&>button]:!text-slate-600 dark:[&>button]:!text-slate-300 [&>button:hover]:!bg-slate-50 dark:[&>button:hover]:!bg-slate-700" />
                {props.showMiniMap && (
                    <MiniMap
                        nodeColor={(node) => {
                            if (node.data.isDeceased) return props.isDarkMode ? '#475569' : '#94a3b8';
                            return node.data.gender === 'male' ? '#3b82f6' : '#ec4899';
                        }}
                        maskColor={props.isDarkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.4)'}
                        className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !rounded-lg !shadow-xl"
                        position="bottom-right"
                        pannable
                        zoomable
                    />
                )}
            </ReactFlow>
        </div>
    );
};


// Wrapper to provide ReactFlow context
const FamilyTreeWrapper = (props) => (
    <ReactFlowProvider>
        <FamilyTree {...props} />
    </ReactFlowProvider>
);

export default FamilyTreeWrapper;
