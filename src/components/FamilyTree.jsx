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
import { filterMembers } from '../utils/familyFilter';

const nodeTypes = {
    member: CustomNode,
};

const getLayoutedElements = (nodes, edges) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodeWidth = 260; // 256px + margin
    const nodeHeight = 100;

    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    // Only add non-spouse edges to Dagre to affect layout
    edges.forEach((edge) => {
        if (!edge.data?.isSpouse) {
            dagreGraph.setEdge(edge.source, edge.target);
        }
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        // Dagre returns center coordinates, React Flow needs top-left
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
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

    // Constant for layout key
    const LAYOUT_KEY = 'family-tree-custom-layout';

    // Handle focus on specific node (Search)
    useEffect(() => {
        if (props.focusNodeId && nodes.length > 0) {
            const node = nodes.find(n => n.id === props.focusNodeId);
            if (node) {
                const x = node.position.x + node.width / 2;
                const y = node.position.y + node.height / 2;
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

        // Convert members to nodes
        const initialNodes = displayMembers.map((m) => ({
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
        }));

        // Convert relationships to edges (only for displayed members)
        let initialEdges = [];
        const displayedIds = new Set(displayMembers.map(m => m.id));

        displayMembers.forEach((m) => {
            // Parent edges
            if (m.parents && m.parents.length > 0) {
                m.parents.forEach((p) => {
                    const parentId = typeof p === 'string' ? p : p.id;
                    const isStep = typeof p === 'object' && p.type === 'step';

                    initialEdges.push({
                        id: `e${parentId}-${m.id}`,
                        source: parentId,
                        target: m.id,
                        type: 'smoothstep',
                        sourceHandle: 'bottom',
                        targetHandle: 'top',
                        animated: !isStep, // Animate biological, static-ish for step? Or vice-versa.
                        style: {
                            stroke: isStep
                                ? (props.isDarkMode ? '#94a3b8' : '#cbd5e1') // Lighter for step
                                : (props.isDarkMode ? '#3b82f6' : '#2563eb'), // Primary for biological
                            strokeWidth: isStep ? 1.5 : 2.5,
                            strokeDasharray: isStep ? '5,5' : '0'
                        },
                        label: isStep ? 'Tiri' : '',
                        labelStyle: { fill: props.isDarkMode ? '#94a3b8' : '#718096', fontSize: '10px', fontWeight: 600 }
                    });
                });
            }

            // Spouse edges
            if (m.spouses && m.spouses.length > 0) {
                m.spouses.forEach((spouseId) => {
                    // Prevent duplicate edges (A->B and B->A)
                    if (m.id < spouseId) {
                        initialEdges.push({
                            id: `e${m.id}-${spouseId}`,
                            source: m.id,
                            target: spouseId,
                            type: 'straight',
                            data: { isSpouse: true }, // Marker for layout exclusion
                            style: { stroke: props.isDarkMode ? '#db2777' : '#ec4899', strokeWidth: 2, strokeDasharray: '5,5' },
                            label: '❤️',
                            labelStyle: { fill: props.isDarkMode ? '#db2777' : '#ec4899', fontWeight: 700 }
                        });
                    }
                });
            }
        });

        // 1. Calculate Layout (ignoring spouse edges)
        const { nodes: layoutedNodes } = getLayoutedElements(
            initialNodes,
            initialEdges
        );

        // 2. Now Update Spouse Edges with Correct Handles based on Position
        const finalEdges = initialEdges.map(edge => {
            if (edge.data?.isSpouse) {
                const sourceNode = layoutedNodes.find(n => n.id === edge.source);
                const targetNode = layoutedNodes.find(n => n.id === edge.target);

                if (sourceNode && targetNode) {
                    if (sourceNode.position.x < targetNode.position.x) {
                        // Source is Left, Target is Right
                        return {
                            ...edge,
                            sourceHandle: 'right',
                            targetHandle: 'left'
                        };
                    } else {
                        // Source is Right, Target is Left
                        return {
                            ...edge,
                            sourceHandle: 'left',
                            targetHandle: 'right'
                        };
                    }
                }
            }
            return edge;
        });

        // 3. Merge with Custom Positions if in Manual Mode
        const finalNodes = layoutedNodes.map(node => {
            if (props.layoutMode === 'manual') {
                try {
                    const savedLayout = localStorage.getItem(LAYOUT_KEY);
                    if (savedLayout) {
                        const { positions } = JSON.parse(savedLayout);
                        if (positions && positions[node.id]) {
                            return {
                                ...node,
                                position: positions[node.id]
                            };
                        }
                    }
                } catch (e) {
                    console.error("Failed to load custom layout", e);
                }
            }
            return node;
        });

        setNodes(finalNodes);
        setEdges(finalEdges);
    }, [members, setNodes, setEdges, props.onEdit, props.onView, props.isDarkMode, props.filterMode, props.filterRootId, props.onFilterRequest, props.layoutMode]);

    const onNodeDragStop = useCallback((event, node) => {
        if (props.layoutMode !== 'manual') return;

        try {
            const savedLayout = localStorage.getItem(LAYOUT_KEY);
            let layout = { positions: {} };
            if (savedLayout) {
                layout = JSON.parse(savedLayout);
            }

            layout.positions[node.id] = node.position;
            localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
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
