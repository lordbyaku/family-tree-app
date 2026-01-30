
// Relationship Finder Utility with Path Visualization
export const getDetailedRelationship = (members, startId, endId) => {
    if (startId === endId) return { type: "Diri Sendiri", path: [] };

    // Build Adjacency Graph with labels
    const graph = {};
    try {
        members.forEach(m => {
            if (!m || !m.id) return;
            if (!graph[m.id]) graph[m.id] = [];

            // Parents
            (m.parents || []).forEach(p => {
                if (!p) return;
                const pId = typeof p === 'string' ? p : p.id;
                if (!pId) return;
                const isStep = typeof p === 'object' && p.type === 'step';

                graph[m.id].push({ id: pId, rel: isStep ? 'step-parent' : 'parent', label: isStep ? 'Orang Tua Tiri' : 'Orang Tua' });
                if (!graph[pId]) graph[pId] = [];
                graph[pId].push({ id: m.id, rel: isStep ? 'step-child' : 'child', label: isStep ? 'Anak Tiri' : 'Anak' });
            });

            // Spouses
            (m.spouses || []).forEach(sId => {
                if (!sId) return;
                const id = typeof sId === 'string' ? sId : sId.id;
                if (!id) return;
                graph[m.id].push({ id, rel: 'spouse', label: 'Pasangan' });
            });
        });
    } catch (e) {
        console.error("Error building relationship graph:", e);
        return { type: "Tidak dapat menganalisis hubungan", path: [] };
    }

    // BFS to find the path
    const queue = [{ id: startId, path: [] }];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const { id, path } = queue.shift();

        if (id === endId) {
            return {
                type: interpretPath(path.map(p => p.rel), members, startId), // Use startId to describe A
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

const interpretPath = (path, members, startId) => {
    const startMember = members.find(m => m.id === startId);
    const gender = startMember?.gender || 'male';
    const isMale = gender === 'male';

    const isStep = path.some(p => p.startsWith('step-'));

    // INVERT THE PATH: To describe A relative to B
    // If A -> B is 'parent', then A is 'child' of B
    const invertedPath = path.map(p => {
        if (p === 'parent') return 'child';
        if (p === 'child') return 'parent';
        if (p === 'step-parent') return 'step-child';
        if (p === 'step-child') return 'step-parent';
        return p; // spouse stays spouse
    });

    const normalizedPath = invertedPath.map(p => p.replace('step-', ''));
    const pathStr = normalizedPath.join('-');

    // Detect generation hierarchy
    let upCount = 0;
    let downCount = 0;
    let spouseCount = 0;

    normalizedPath.forEach(step => {
        if (step === 'parent') upCount++;
        if (step === 'child') downCount++;
        if (step === 'spouse') spouseCount++;
    });

    const result = (() => {
        // Direct Vertical Line Up (Leluhur)
        if (downCount === 0 && spouseCount === 0) {
            if (upCount === 1) return isMale ? 'Ayah' : 'Ibu';
            if (upCount === 2) return isMale ? 'Kakek' : 'Nenek';
            if (upCount === 3) return 'Buyut';
            if (upCount === 4) return 'Canggah';
            if (upCount === 5) return 'Wareng';
            if (upCount === 6) return 'Udheg-udheg';
            return `Leluhur G-${upCount}`;
        }

        // Direct Vertical Line Down (Keturunan)
        if (upCount === 0 && spouseCount === 0) {
            if (downCount === 1) return isMale ? 'Anak (L)' : 'Anak (P)';
            if (downCount === 2) return 'Cucu (Putu)';
            if (downCount === 3) return 'Cicit (Buyut)';
            if (downCount === 4) return 'Piut';
            if (downCount === 5) return 'Anggas';
            return `Keturunan G-${downCount}`;
        }

        // Horizontal (Spouse)
        if (upCount === 0 && downCount === 0 && spouseCount === 1) {
            return isMale ? 'Suami' : 'Istri';
        }

        // Same Generation (Siblings)
        if (upCount === 1 && downCount === 1 && spouseCount === 0) {
            return isMale ? 'Saudara (L)' : 'Saudara (P)';
        }

        // Collateral Up (Paman/Bibi & Ancestor's Siblings)
        if (downCount === 1 && spouseCount === 0) {
            if (upCount === 2) return isMale ? 'Paman' : 'Bibi';
            if (upCount === 3) return isMale ? 'Kakek Sepupu' : 'Nenek Sepupu';
            if (upCount === 4) return 'Buyut Sepupu';
        }

        // Collateral Down (Keponakan)
        if (upCount === 1 && spouseCount === 0) {
            if (downCount === 2) return 'Keponakan';
            if (downCount === 3) return 'Cucu Keponakan';
            if (downCount === 4) return 'Cicit Keponakan';
        }

        // Cousins (Up X, then Down X)
        if (upCount === downCount && upCount > 1 && spouseCount === 0) {
            if (upCount === 2) return 'Sepupu';
            if (upCount === 3) return 'Sepupu Dua Kali';
            return `Sepupu G-${upCount - 1}`;
        }

        // In-laws
        if (pathStr === 'spouse-parent') return 'Mertua';
        if (pathStr === 'child-spouse') return 'Menantu';
        if (pathStr === 'parent-child-spouse' || pathStr === 'spouse-parent-child') return 'Ipar';

        // Generic Fallback
        if (spouseCount > 0) return "Kerabat (Besan/Ipar)";
        if (upCount > downCount) return "Kerabat (Jalur Atas)";
        if (downCount > upCount) return "Kerabat (Jalur Bawah)";

        return "Kerabat";
    })();

    return isStep ? `${result} (Tiri/Angkat)` : result;
};
