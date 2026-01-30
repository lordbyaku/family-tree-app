
// Helper to find path and calculate relationship
export const findRelationship = (members, startId, endId) => {
    if (startId === endId) return "Diri Sendiri";

    // Build Adjacency Graph
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
        return "Tidak dapat menganalisis hubungan karena data tidak lengkap.";
    }

    // BFS to find shortest path
    const queue = [{ id: startId, path: [] }];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const { id, path } = queue.shift();

        if (id === endId) {
            return interpretPath(path, members, endId);
        }

        const neighbors = graph[id] || [];
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor.id)) {
                visited.add(neighbor.id);
                queue.push({
                    id: neighbor.id,
                    path: [...path, neighbor.rel]
                });
            }
        }
    }

    return "Tidak ada hubungan keluarga langsung";
};

const interpretPath = (path, members, endId) => {
    const endMember = members.find(m => m.id === endId);
    const gender = endMember?.gender || 'male';
    const isMale = gender === 'male';

    const isStep = path.some(p => p.startsWith('step-'));
    const normalizedPath = path.map(p => p.replace('step-', ''));
    const pathStr = normalizedPath.join('-');

    const result = (() => {
        // Direct Line
        if (pathStr === 'parent') return isMale ? 'Ayah' : 'Ibu';
        if (pathStr === 'child') return isMale ? 'Anak Laki-laki' : 'Anak Perempuan';
        if (pathStr === 'spouse') return isMale ? 'Suami' : 'Istri';

        // Grandparents
        if (pathStr === 'parent-parent') return isMale ? 'Kakek' : 'Nenek';
        if (pathStr === 'child-child') return 'Cucu';

        // Great-Grandparents
        if (pathStr === 'parent-parent-parent') return isMale ? 'Buyut (L)' : 'Buyut (P)';

        // Siblings
        if (pathStr === 'parent-child') return isMale ? 'Saudara Laki-laki' : 'Saudara Perempuan';

        // Uncles/Aunts (Parent -> Sibling)
        if (pathStr === 'parent-parent-child') return isMale ? 'Paman' : 'Bibi';

        // Nephew/Niece (Sibling -> Child)
        if (pathStr === 'parent-child-child') return 'Keponakan';

        // Cousins (Parent -> Sibling -> Child)
        if (pathStr === 'parent-parent-child-child') return 'Sepupu';

        // In-Laws
        if (pathStr === 'spouse-parent') return isMale ? 'Mertua (L)' : 'Mertua (P)';
        if (pathStr === 'child-spouse') return 'Menantu';
        if (pathStr === 'parent-child-spouse') return 'Ipar'; // Sibling's spouse
        if (pathStr === 'spouse-parent-child') return 'Ipar'; // Spouse's sibling

        // Generic Fallback
        let up = 0;
        let down = 0;
        let spouse = 0;

        normalizedPath.forEach(step => {
            if (step === 'parent') up++;
            if (step === 'child') down++;
            if (step === 'spouse') spouse++;
        });

        if (spouse > 0) return "Kerabat Jauh (Ipar/Besan)";

        const ascendingTerms = ["", "Bapak/Ibu", "Simbah", "Buyut", "Canggah", "Wareng", "Udheg-udheg", "Gantung Siwur", "Gropak Senthul", "Debog Bosok", "Galih Asem"];
        const descendingTerms = ["", "Anak", "Putu", "Buyut", "Canggah", "Wareng", "Udheg-udheg", "Gantung Siwur", "Gropak Senthul", "Debog Bosok", "Galih Asem"];

        if (up > 0 && down === 0) {
            return ascendingTerms[up] || `Leluhur (${up} generasi)`;
        }
        if (down > 0 && up === 0) {
            return descendingTerms[down] || `Keturunan (${down} generasi)`;
        }

        return "Kerabat Jauh";
    })();

    return isStep ? `${result} Tiri/Angkat` : result;
};
