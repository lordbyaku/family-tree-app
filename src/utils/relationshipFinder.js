
// Relationship Finder Utility with Path Visualization
export const getDetailedRelationship = (members, startId, endId) => {
    if (startId === endId) return { type: "Diri Sendiri", path: [] };

    // Build Adjacency Graph with labels
    const graph = {};
    members.forEach(m => {
        if (!graph[m.id]) graph[m.id] = [];

        // Parents
        m.parents.forEach(p => {
            const pId = typeof p === 'string' ? p : p.id;
            const isStep = typeof p === 'object' && p.type === 'step';

            graph[m.id].push({ id: pId, rel: isStep ? 'step-parent' : 'parent', label: isStep ? 'Orang Tua Tiri' : 'Orang Tua' });
            if (!graph[pId]) graph[pId] = [];
            graph[pId].push({ id: m.id, rel: isStep ? 'step-child' : 'child', label: isStep ? 'Anak Tiri' : 'Anak' });
        });

        // Spouses
        m.spouses.forEach(sId => {
            graph[m.id].push({ id: sId, rel: 'spouse', label: 'Pasangan' });
        });
    });

    // BFS to find the path
    const queue = [{ id: startId, path: [] }];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const { id, path } = queue.shift();

        if (id === endId) {
            return {
                type: interpretPath(path.map(p => p.rel), members, endId),
                path: path // Array of { id, rel, label }
            };
        }

        const neighbors = graph[id] || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id)) {
                visited.add(neighbor.id);
                queue.push({
                    id: neighbor.id,
                    path: [...path, { ...neighbor }]
                });
            }
        }
    }

    return { type: "Tidak ada hubungan langsung", path: [] };
};

const interpretPath = (path, members, endId) => {
    const endMember = members.find(m => m.id === endId);
    const gender = endMember?.gender || 'male';
    const isMale = gender === 'male';

    const isStep = path.some(p => p.startsWith('step-'));
    const normalizedPath = path.map(p => p.replace('step-', ''));
    const pathStr = normalizedPath.join('-');

    const result = (() => {
        if (pathStr === 'parent') return isMale ? 'Ayah' : 'Ibu';
        if (pathStr === 'child') return isMale ? 'Anak (L)' : 'Anak (P)';
        if (pathStr === 'spouse') return isMale ? 'Suami' : 'Istri';
        if (pathStr === 'parent-parent') return isMale ? 'Kakek' : 'Nenek';
        if (pathStr === 'child-child') return 'Cucu';
        if (pathStr === 'parent-child') return isMale ? 'Saudara (L)' : 'Saudara (P)';
        if (pathStr === 'parent-parent-child') return isMale ? 'Paman' : 'Bibi';
        if (pathStr === 'parent-child-child') return 'Keponakan';
        if (pathStr === 'parent-parent-child-child') return 'Sepupu';
        if (pathStr === 'spouse-parent') return 'Mertua';
        if (pathStr === 'child-spouse') return 'Menantu';
        if (pathStr === 'parent-child-spouse') return 'Ipar';
        if (pathStr === 'spouse-parent-child') return 'Ipar';

        return "Kerabat";
    })();

    return isStep ? `${result} (Tiri/Angkat)` : result;
};
