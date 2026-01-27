
import { createContext, useContext, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import useUndo from 'use-undo';
import { generateExcelBook, generateHTMLBook } from '../utils/familyBook';
import { supabase } from '../lib/supabase';

const FamilyContext = createContext();

export const useFamily = () => useContext(FamilyContext);

export const FamilyProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [treeSlug, setTreeSlug] = useState('default');
    const [prevTreeSlug, setPrevTreeSlug] = useState(() => localStorage.getItem('prev_tree_slug') || 'default');
    const [selectedSlugs, setSelectedSlugs] = useState([]);
    const [treeMetadata, setTreeMetadata] = useState({ title: '', description: '' });
    const [membersState, {
        set: setMembers,
        reset: resetMembers,
        undo,
        redo,
        canUndo,
        canRedo
    }] = useUndo([]);

    const members = membersState.present;
    const [lastAction, setLastAction] = useState('');

    // Update prevTreeSlug whenever treeSlug changes (but not to gabungan)
    useEffect(() => {
        if (treeSlug && treeSlug !== 'gabungan') {
            setPrevTreeSlug(treeSlug);
            localStorage.setItem('prev_tree_slug', treeSlug);
        }
    }, [treeSlug]);

    // Fetch from Supabase on treeSlug change
    const fetchMembers = async (slugsToFetch = null) => {
        const targetSlugs = slugsToFetch || (treeSlug === 'gabungan' ? selectedSlugs : null);
        if (!treeSlug && !targetSlugs) return;
        setIsLoading(true);
        try {
            let query = supabase
                .from('members')
                .select('*');

            if (targetSlugs && targetSlugs.length > 0) {
                query = query.in('tree_slug', targetSlugs);
            } else if (treeSlug === 'gabungan') {
                query = query.not('id', 'is', null);
            } else if (treeSlug === 'default' || !treeSlug) {
                query = query.or('tree_slug.ilike.default,tree_slug.is.null');
            } else {
                query = query.ilike('tree_slug', treeSlug);
            }

            const { data, error } = await query.order('name', { ascending: true });
            if (error) throw error;

            let mappedData = (data || []).map(m => ({
                ...m,
                birthDate: m.birth_date,
                deathDate: m.death_date,
                isDeceased: !!m.is_deceased
            }));

            // ADVANCED Deduplication Logic for 'gabungan' mode
            if (treeSlug === 'gabungan') {
                const identityGroups = new Map(); // key -> Array of all duplicate records
                const idToMasterId = new Map(); // mapping every ID to its Master ID

                // 1. Group records by Identity (Name + BirthDate)
                mappedData.forEach(member => {
                    const nameKey = member.name?.toLowerCase().trim();
                    if (!nameKey) return;
                    const key = `${nameKey}|${member.birthDate || 'unknown'}`;

                    if (!identityGroups.has(key)) identityGroups.set(key, []);
                    identityGroups.get(key).push(member);
                });

                // 2. Determine Master Record and build ID Map
                const mergedMembers = [];
                for (const [key, duplicates] of identityGroups.entries()) {
                    // Choose master: prioritize the one with a photo or most connections
                    const master = duplicates.reduce((prev, curr) => {
                        const prevScore = (prev.photo ? 10 : 0) + (prev.parents?.length || 0) + (prev.children?.length || 0);
                        const currScore = (curr.photo ? 10 : 0) + (curr.parents?.length || 0) + (curr.children?.length || 0);
                        return currScore > prevScore ? curr : prev;
                    });

                    // Map all duplicate IDs to this master ID
                    duplicates.forEach(d => idToMasterId.set(d.id, master.id));

                    // Prepare the merged object with combined unique relationships
                    const combinedParents = [];
                    const combinedChildren = [];
                    const combinedSpouses = [];

                    duplicates.forEach(d => {
                        if (d.parents) combinedParents.push(...d.parents);
                        if (d.children) combinedChildren.push(...d.children);
                        if (d.spouses) combinedSpouses.push(...d.spouses);
                    });

                    mergedMembers.push({
                        ...master,
                        parents: combinedParents,
                        children: combinedChildren,
                        spouses: combinedSpouses
                    });
                }

                // 3. Rewrite all IDs to use Master IDs and perform final cleanup
                mappedData = mergedMembers.map(member => {
                    const rewriteId = (id) => idToMasterId.get(id) || id;
                    const uniqueBy = (arr, keyFn) => {
                        const seen = new Set();
                        return arr.filter(item => {
                            const val = keyFn(item);
                            if (seen.has(val)) return false;
                            seen.add(val);
                            return true;
                        });
                    };

                    return {
                        ...member,
                        parents: uniqueBy(
                            (member.parents || []).map(p => (typeof p === 'string' ? { id: rewriteId(p), type: 'biological' } : { ...p, id: rewriteId(p.id) })),
                            p => p.id
                        ).filter(p => p.id !== member.id), // No self-parenting

                        children: [...new Set((member.children || []).map(rewriteId))]
                            .filter(cid => cid !== member.id),

                        spouses: uniqueBy(
                            (member.spouses || []).map(s => (typeof s === 'string' ? { id: rewriteId(s), status: 'married' } : { ...s, id: rewriteId(s.id) })),
                            s => s.id
                        ).filter(s => s.id !== member.id) // No self-marriage
                    };
                });
            }

            setMembers(mappedData);
        } catch (error) {
            console.error("Gagal mengambil data dari Supabase:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTreeMetadata = async () => {
        if (!treeSlug || treeSlug === 'gabungan') {
            setTreeMetadata({ title: 'Gabungan Semua Silsilah', description: 'Menampilkan gabungan dari beberapa silsilah keluarga yang dipilih.' });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('tree_metadata')
                .select('*')
                .eq('slug', treeSlug)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setTreeMetadata({ title: data.title, description: data.description });
            } else {
                // Fallback / Initial Metadata
                const defaultTitles = {
                    'sukardi': 'Silsilah Keluarga Sukardi',
                    'cokrosudiro': 'Silsilah Keluarga Cokrosudiro',
                    'default': 'Silsilah Utama'
                };
                setTreeMetadata({
                    title: defaultTitles[treeSlug] || `Silsilah ${treeSlug.charAt(0).toUpperCase() + treeSlug.slice(1)}`,
                    description: 'Selamat datang di pohon keluarga kami. Silsilah ini mencatat sejarah dan hubungan antar anggota keluarga dari generasi ke generasi.'
                });
            }
        } catch (error) {
            console.error("Gagal mengambil metadata silsilah:", error.message);
        }
    };

    const updateTreeMetadata = async (newMetadata) => {
        try {
            const { error } = await supabase
                .from('tree_metadata')
                .upsert({
                    slug: treeSlug,
                    title: newMetadata.title,
                    description: newMetadata.description,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            setTreeMetadata(newMetadata);
            return { success: true };
        } catch (error) {
            console.error("Gagal update metadata silsilah:", error.message);
            return { success: false, message: error.message };
        }
    };

    useEffect(() => {
        if (treeSlug !== 'gabungan' || selectedSlugs.length > 0) {
            fetchMembers();
            fetchTreeMetadata();
        }
    }, [treeSlug, selectedSlugs]);

    const addMember = async (member) => {
        const id = crypto.randomUUID();
        const newMember = { ...member, id, children: [], spouses: [], parents: member.parents || [] };
        try {
            const dbMember = { ...newMember, tree_slug: treeSlug, birth_date: newMember.birthDate, death_date: newMember.deathDate, is_deceased: newMember.isDeceased };
            delete dbMember.birthDate; delete dbMember.deathDate; delete dbMember.isDeceased;
            let updatedList = [...members, newMember];
            const modifiedMembers = [newMember];
            if (newMember.parents.length > 0) {
                const parentIds = newMember.parents.map(p => typeof p === 'string' ? p : p.id);
                updatedList = updatedList.map(m => {
                    if (parentIds.includes(m.id)) {
                        const updatedParent = { ...m, children: [...(m.children || []), id] };
                        modifiedMembers.push(updatedParent);
                        return updatedParent;
                    }
                    return m;
                });
            }
            if (newMember.spouses && newMember.spouses.length > 0) {
                const spouseIds = newMember.spouses.map(s => typeof s === 'string' ? s : s.id);
                updatedList = updatedList.map(m => {
                    if (spouseIds.includes(m.id)) {
                        const spouseObjInNew = newMember.spouses.find(s => (typeof s === 'string' ? s === m.id : s.id === m.id));
                        const status = typeof spouseObjInNew === 'object' ? spouseObjInNew.status : 'married';
                        const updatedSpouse = { ...m, spouses: [...(m.spouses || []).filter(s => (typeof s === 'string' ? s !== id : s.id !== id)), { id, status }] };
                        modifiedMembers.push(updatedSpouse);
                        return updatedSpouse;
                    }
                    return m;
                });
            }
            const dbUpsertList = modifiedMembers.map(m => {
                const dbM = { ...m, tree_slug: treeSlug, birth_date: m.birthDate || null, death_date: m.deathDate || null, is_deceased: m.isDeceased || false };
                delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
                return dbM;
            });
            const { error } = await supabase.from('members').upsert(dbUpsertList);
            if (error) throw error;
            setMembers(updatedList);
            setLastAction(`Tambah Anggota: ${newMember.name}`);
        } catch (error) { console.error("Gagal tambah anggota:", error.message); throw error; }
    };

    const updateMember = async (id, updatedData) => {
        try {
            const member = members.find(m => m.id === id);
            const updatedMember = { ...member, ...updatedData };
            let updatedList = members.map((m) => (m.id === id ? updatedMember : m));
            const modifiedMembers = [updatedMember];
            if (updatedData.spouses) {
                const oldSpouseIds = (member.spouses || []).map(s => typeof s === 'string' ? s : s.id);
                const newSpouseIds = updatedData.spouses.map(s => typeof s === 'string' ? s : s.id);
                const removedIds = oldSpouseIds.filter(sid => !newSpouseIds.includes(sid));
                const keptIds = newSpouseIds;
                updatedList = updatedList.map(m => {
                    if (removedIds.includes(m.id)) {
                        const updatedSpouse = { ...m, spouses: (m.spouses || []).filter(s => (typeof s === 'string' ? s !== id : s.id !== id)) };
                        modifiedMembers.push(updatedSpouse);
                        return updatedSpouse;
                    }
                    if (keptIds.includes(m.id)) {
                        const spouseObjInNew = updatedData.spouses.find(s => (typeof s === 'string' ? s === m.id : s.id === m.id));
                        const status = typeof spouseObjInNew === 'object' ? spouseObjInNew.status : 'married';
                        const updatedSpouse = { ...m, spouses: [...(m.spouses || []).filter(s => (typeof s === 'string' ? s !== id : s.id !== id)), { id, status }] };
                        modifiedMembers.push(updatedSpouse);
                        return updatedSpouse;
                    }
                    return m;
                });
            }
            const dbUpsertList = modifiedMembers.map(m => {
                const dbM = { ...m, tree_slug: treeSlug, birth_date: m.birthDate || null, death_date: m.deathDate || null, is_deceased: m.isDeceased || false };
                delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
                return dbM;
            });
            const { error } = await supabase.from('members').upsert(dbUpsertList);
            if (error) throw error;
            setMembers(updatedList);
            setLastAction(`Update Anggota: ${member?.name || id}`);
        } catch (error) { console.error("Gagal update anggota:", error.message); throw error; }
    };

    const deleteMember = async (id) => {
        try {
            const memberToDelete = members.find(m => m.id === id);
            if (!memberToDelete) return;
            const modifiedMembers = [];
            const updatedList = members.filter((m) => m.id !== id).map(m => {
                let updatedMember = { ...m };
                let modified = false;
                if (m.children?.includes(id)) { updatedMember.children = updatedMember.children.filter(childId => childId !== id); modified = true; }
                if (m.parents?.some(p => (typeof p === 'string' ? p : p.id) === id)) { updatedMember.parents = updatedMember.parents.filter(p => (typeof p === 'string' ? p : p.id) !== id); modified = true; }
                if (m.spouses?.some(s => (typeof s === 'string' ? s === id : s.id === id))) { updatedMember.spouses = updatedMember.spouses.filter(s => (typeof s === 'string' ? s !== id : s.id !== id)); modified = true; }
                if (modified) { modifiedMembers.push(updatedMember); return updatedMember; }
                return m;
            });
            const { error: delError } = await supabase.from('members').delete().eq('id', id);
            if (delError) throw delError;
            if (modifiedMembers.length > 0) {
                const dbUpsertList = modifiedMembers.map(m => {
                    const dbM = { ...m, tree_slug: treeSlug, birth_date: m.birthDate || null, death_date: m.deathDate || null, is_deceased: m.isDeceased || false };
                    delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
                    return dbM;
                });
                await supabase.from('members').upsert(dbUpsertList);
            }
            setMembers(updatedList);
            setLastAction(`Hapus Anggota: ${memberToDelete.name}`);
        } catch (error) { console.error("Gagal hapus anggota:", error.message); }
    };

    const migrateFromLocal = async () => { /* legacy handled */ };
    const importData = async (file) => { /* legacy handled */ };

    const listAllSlugs = async () => {
        try {
            const { data, error } = await supabase.from('members').select('tree_slug');
            if (error) throw error;
            const slugs = [...new Set(data.filter(m => m.tree_slug).map(m => m.tree_slug))];
            if (!slugs.includes('default')) slugs.push('default');
            return slugs;
        } catch (error) { return []; }
    };

    const exportData = () => { /* legacy handled */ };
    const exportToExcel = () => { /* legacy handled */ };
    const exportToCSV = () => { /* legacy handled */ };
    const exportToHTML = () => { /* legacy handled */ };
    const createSnapshot = () => { /* legacy handled */ };
    const listSnapshots = () => { /* legacy handled */ };
    const restoreSnapshot = () => { /* legacy handled */ };

    return (
        <FamilyContext.Provider value={{
            members, treeSlug, setTreeSlug, prevTreeSlug, selectedSlugs, setSelectedSlugs,
            treeMetadata, updateTreeMetadata, fetchTreeMetadata,
            addMember, updateMember, deleteMember,
            exportData, importData, undo, redo, canUndo, canRedo, lastAction,
            isLoading, listAllSlugs, fetchMembers,
            createSnapshot, listSnapshots, restoreSnapshot
        }}>
            {children}
        </FamilyContext.Provider>
    );
};
