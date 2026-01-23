/**
 * Family Filter Utilities
 * Provides functions to filter family tree members by ancestors or descendants
 */

/**
 * Get all ancestors of a given member
 * @param {Array} members - All family members
 * @param {string} rootId - ID of the member to find ancestors for
 * @returns {Set} Set of ancestor member IDs (including the root)
 */
export const getAncestors = (members, rootId) => {
    const ancestors = new Set([rootId]);
    const queue = [rootId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        const current = members.find(m => m.id === currentId);

        if (current && current.parents) {
            current.parents.forEach(p => {
                const parentId = typeof p === 'string' ? p : p.id;
                if (parentId && !ancestors.has(parentId)) {
                    ancestors.add(parentId);
                    queue.push(parentId);
                }
            });
        }
    }

    return ancestors;
};

/**
 * Get all descendants of a given member
 * @param {Array} members - All family members
 * @param {string} rootId - ID of the member to find descendants for
 * @returns {Set} Set of descendant member IDs (including the root)
 */
export const getDescendants = (members, rootId) => {
    const descendants = new Set([rootId]);
    const queue = [rootId];

    while (queue.length > 0) {
        const currentId = queue.shift();
        const current = members.find(m => m.id === currentId);

        if (current && current.children) {
            current.children.forEach(childId => {
                const cid = typeof childId === 'string' ? childId : childId.id;
                if (cid && !descendants.has(cid)) {
                    descendants.add(cid);
                    queue.push(cid);
                }
            });
        }
    }

    return descendants;
};

/**
 * Filter members based on filter mode
 * @param {Array} members - All family members
 * @param {string} filterMode - 'ancestors' | 'descendants' | null
 * @param {string} filterRootId - ID of the root member for filtering
 * @returns {Array} Filtered array of members
 */
export const filterMembers = (members, filterMode, filterRootId) => {
    if (!filterMode || !filterRootId) {
        return members;
    }

    let allowedIds;

    if (filterMode === 'ancestors') {
        allowedIds = getAncestors(members, filterRootId);
    } else if (filterMode === 'descendants') {
        allowedIds = getDescendants(members, filterRootId);
    } else {
        return members;
    }

    return members.filter(m => allowedIds.has(m.id));
};
