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
    getNodesBounds,
    getViewportForBounds,
} from 'reactflow';
import { toPng } from 'html-to-image';
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

    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 200, nodesep: 200, edgesep: 100 });

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

    let layoutedNodes = nodes.map((node) => {
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
            width: w,
            height: h
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

    // Highlight State
    const [highlightedNodeId, setHighlightedNodeId] = React.useState(null);

    const onNodeClick = useCallback((event, node) => {
        if (node.type === 'member') {
            setHighlightedNodeId(node.id);
        } else {
            setHighlightedNodeId(null);
        }
    }, []);

    const onPaneClick = useCallback(() => {
        setHighlightedNodeId(null);
    }, []);

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

                            // Find marriage status if it exists in spouse object
                            let status = 'married';
                            if (m.spouses && Array.isArray(m.spouses)) {
                                const spouseObj = m.spouses.find(s => (typeof s === 'object' && s.id === sid));
                                if (spouseObj && spouseObj.status) status = spouseObj.status;
                            }

                            marriages.push({ id: mId, p1: pair[0], p2: pair[1], status });
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
                    tree_slug: m.tree_slug,
                    onEdit: props.onEdit,
                    onView: props.onView,
                    onFilterRequest: props.onFilterRequest,
                    isHighlighted: m.id === highlightedNodeId,
                    isDarkMode: props.isDarkMode
                },
                position: { x: 0, y: 0 },
            })),
            ...marriages.map(m => ({
                id: m.id,
                type: 'marriage',
                data: { status: m.status },
                position: { x: 0, y: 0 }
            }))
        ];

        // 3. Build Edges (For Dagre Layout)
        // Group children by marriage to sort them by birth date
        const dagreEdges = [];
        const childrenByMarriage = new Map(); // key: marriageId or parentId, value: array of members

        displayMembers.forEach(m => {
            if (m.parents && m.parents.length > 0) {
                const parentIds = m.parents.map(p => typeof p === 'string' ? p : p.id).filter(pid => displayedIds.has(pid));

                let mId = null;
                if (parentIds.length >= 2) {
                    // Try to find a marriage node that matches ANY pair of these parents
                    // but preferentially a pair that includes both a male and female (traditional)
                    // or just any pair we have a marriage node for.
                    const uniqueParents = [...new Set(parentIds)];
                    if (uniqueParents.length >= 2) {
                        for (let i = 0; i < uniqueParents.length; i++) {
                            for (let j = i + 1; j < uniqueParents.length; j++) {
                                const pair = [uniqueParents[i], uniqueParents[j]].sort();
                                const key = pair.join('__');
                                if (marriageMap.has(key)) {
                                    mId = marriageMap.get(key);
                                    break;
                                }
                            }
                            if (mId) break;
                        }
                    }
                }

                if (mId) {
                    if (!childrenByMarriage.has(mId)) childrenByMarriage.set(mId, []);
                    childrenByMarriage.get(mId).push(m);
                } else {
                    // Single parent or no marriage node found for parent pairs
                    parentIds.forEach(pid => {
                        if (!childrenByMarriage.has(pid)) childrenByMarriage.set(pid, []);
                        childrenByMarriage.get(pid).push(m);
                    });
                }
            }
        });

        // Marriage connections for Dagre
        marriages.forEach(m => {
            if (displayedIds.has(m.p1) && displayedIds.has(m.p2)) {
                dagreEdges.push({ id: `de-${m.p1}-${m.id}`, source: m.p1, target: m.id });
                dagreEdges.push({ id: `de-${m.p2}-${m.id}`, source: m.p2, target: m.id });
            }
        });

        // Children connections for Dagre
        childrenByMarriage.forEach((children, parentId) => {
            children.forEach(child => {
                const childId = child.id;
                // Double check both exist in layout
                const sourceExists = parentId.startsWith('marriage-')
                    ? marriages.some(m => m.id === parentId)
                    : displayedIds.has(parentId);

                if (sourceExists && displayedIds.has(childId)) {
                    dagreEdges.push({ id: `de-${parentId}-${childId}`, source: parentId, target: childId });
                }
            });
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
                // Determine target handles on marriage node (Left and Right sides of heart)
                const p1Target = p1.position.x < p2.position.x ? 'left' : 'right';
                const p2Target = p2.position.x < p1.position.x ? 'left' : 'right';

                const isHighlighted = m.p1 === highlightedNodeId || m.p2 === highlightedNodeId;

                finalEdges.push({
                    id: `e-${m.p1}-${m.id}`,
                    source: m.p1,
                    target: m.id,
                    type: 'smoothstep', // U-shape connector
                    sourceHandle: 'bottom',
                    targetHandle: p1Target,
                    animated: isHighlighted,
                    style: {
                        stroke: isHighlighted
                            ? (props.isDarkMode ? '#fbbf24' : '#f59e0b')
                            : (highlightedNodeId ? (props.isDarkMode ? '#1e293b' : '#e2e8f0') : (props.isDarkMode ? '#db2777' : '#ec4899')),
                        strokeWidth: isHighlighted ? 6 : 3,
                        opacity: highlightedNodeId && !isHighlighted ? 0.3 : 1,
                        transition: 'all 0.3s ease'
                    }
                });

                finalEdges.push({
                    id: `e-${m.p2}-${m.id}`,
                    source: m.p2,
                    target: m.id,
                    type: 'smoothstep',
                    sourceHandle: 'bottom',
                    targetHandle: p2Target,
                    animated: isHighlighted,
                    style: {
                        stroke: isHighlighted
                            ? (props.isDarkMode ? '#fbbf24' : '#f59e0b')
                            : (highlightedNodeId ? (props.isDarkMode ? '#1e293b' : '#e2e8f0') : (props.isDarkMode ? '#db2777' : '#ec4899')),
                        strokeWidth: isHighlighted ? 6 : 3,
                        opacity: highlightedNodeId && !isHighlighted ? 0.3 : 1,
                        transition: 'all 0.3s ease'
                    }
                });
            }
        });

        childrenByMarriage.forEach((children, parentId) => {
            const sortedChildren = [...children].sort((a, b) => {
                const dateA = a.birthDate ? new Date(a.birthDate) : new Date(0);
                const dateB = b.birthDate ? new Date(b.birthDate) : new Date(0);
                return dateB - dateA;
            });

            sortedChildren.forEach(m => {
                const pObj = m.parents?.find(p => {
                    const pid = typeof p === 'string' ? p : p.id;
                    if (parentId.startsWith('marriage-')) return parentId.includes(pid);
                    return pid === parentId;
                });
                const isStepChild = pObj && typeof pObj === 'object' && pObj.type === 'step';

                // Highlighting logic for Parent -> Child edge
                let isHighlighted = false;
                if (highlightedNodeId) {
                    // 1. Is the child the highlighted node? (Show connection to parents)
                    if (m.id === highlightedNodeId) isHighlighted = true;
                    // 2. Is the parent (or marriage node) involving the highlighted node? (Show connection to children)
                    if (parentId.startsWith('marriage-')) {
                        if (parentId.includes(highlightedNodeId)) isHighlighted = true;
                    } else {
                        if (parentId === highlightedNodeId) isHighlighted = true;
                    }
                }

                finalEdges.push({
                    id: `e-${parentId}-${m.id}`,
                    source: parentId,
                    target: m.id,
                    type: 'smoothstep',
                    sourceHandle: 'bottom',
                    targetHandle: 'top',
                    borderRadius: 20,
                    animated: isHighlighted || (!isStepChild && parentId.startsWith('marriage-') && !highlightedNodeId),
                    style: {
                        stroke: isHighlighted
                            ? (props.isDarkMode ? '#60a5fa' : '#3b82f6')
                            : (highlightedNodeId
                                ? (props.isDarkMode ? '#1e293b' : '#e2e8f0')
                                : (isStepChild ? (props.isDarkMode ? '#94a3b8' : '#cbd5e1') : (props.isDarkMode ? '#3b82f6' : '#2563eb'))),
                        strokeWidth: isHighlighted ? 6 : (isStepChild ? 2 : 3),
                        strokeDasharray: isStepChild ? '5,5' : '0',
                        opacity: highlightedNodeId && !isHighlighted ? 0.3 : 1,
                        transition: 'all 0.3s ease'
                    },
                });
            });
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
    }, [members, setNodes, setEdges, props.onEdit, props.onView, props.isDarkMode, props.filterMode, props.filterRootId, props.onFilterRequest, props.layoutMode, DYNAMIC_LAYOUT_KEY, highlightedNodeId]); // added highlightedNodeId dependency

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

    // EXPORT IMAGE HANDLER (Full Tree)
    useEffect(() => {
        const handleExportImage = async () => {
            if (nodes.length === 0) return;

            // 1. Calculate the bounding box of ALL nodes
            const nodesBounds = getNodesBounds(nodes);

            // 2. Define image dimensions (adding padding) rather than fitting to view
            const padding = 50;
            const imageWidth = nodesBounds.width + (padding * 2);
            const imageHeight = nodesBounds.height + (padding * 2);

            // 3. Find the viewport element (the container of the nodes)
            // We target .react-flow__viewport to capture the content directly
            const element = document.querySelector('.react-flow__viewport');
            if (!element) return;

            try {
                // 4. Calculate the transform to shift the bounds to (padding, padding)
                const transformX = -nodesBounds.x + padding;
                const transformY = -nodesBounds.y + padding;

                const dataUrl = await toPng(element, {
                    backgroundColor: props.isDarkMode ? '#0f172a' : '#f8fafc',
                    width: imageWidth,
                    height: imageHeight,
                    style: {
                        width: `${imageWidth}px`,
                        height: `${imageHeight}px`,
                        transform: `translate(${transformX}px, ${transformY}px) scale(1)`,
                        transformOrigin: 'top left',
                    },
                    pixelRatio: 2,
                    quality: 1,
                    // Filter out some problematic elements if needed
                    filter: (node) => {
                        if (node.classList?.contains('react-flow__controls')) return false;
                        if (node.classList?.contains('react-flow__minimap')) return false;
                        return true;
                    }
                });

                const link = document.createElement('a');
                link.download = `silsilah-keluarga-${treeSlug}-${new Date().toISOString().slice(0, 10)}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error("Gagal export gambar:", err);
            }
        };

        window.addEventListener('request-export-image', handleExportImage);
        return () => window.removeEventListener('request-export-image', handleExportImage);
    }, [nodes, props.isDarkMode, treeSlug]);

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
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
