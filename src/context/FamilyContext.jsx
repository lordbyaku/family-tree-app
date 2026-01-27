
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
    const [selectedSlugs, setSelectedSlugs] = useState([]);
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
                // If in gabungan but no slugs selected, fetch all
                query = query.not('id', 'is', null);
            } else if (treeSlug === 'default' || !treeSlug) {
                // For default, include legacy records (null slug) or 'default'
                query = query.or('tree_slug.ilike.default,tree_slug.is.null');
            } else {
                // Case-insensitive filtering for other families
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

            // Deduplication Logic for 'gabungan' mode
            if (treeSlug === 'gabungan') {
                const masterMap = new Map(); // key -> masterMember
                const idToMasterId = new Map(); // oldId -> finalMasterId

                // 1. First Pass: Identify the best "Master" for each unique identity (Name + BirthDate)
                mappedData.forEach(member => {
                    const nameKey = member.name?.toLowerCase().trim();
                    if (!nameKey) return; // Skip members without names

                    const key = `${nameKey}|${member.birthDate || 'unknown'}`;
                    const currentConnections = (member.parents?.length || 0) + (member.children?.length || 0) + (member.spouses?.length || 0);

                    if (!masterMap.has(key)) {
                        masterMap.set(key, member);
                    } else {
                        const existingMaster = masterMap.get(key);
                        const existingConnections = (existingMaster.parents?.length || 0) + (existingMaster.children?.length || 0) + (existingMaster.spouses?.length || 0);

                        if (currentConnections > existingConnections) {
                            masterMap.set(key, member);
                        }
                    }
                });

                // 2. Second Pass: Map ALL duplicate IDs to their final Master ID
                mappedData.forEach(member => {
                    const nameKey = member.name?.toLowerCase().trim();
                    if (!nameKey) {
                        idToMasterId.set(member.id, member.id);
                        return;
                    }
                    const key = `${nameKey}|${member.birthDate || 'unknown'}`;
                    const finalMaster = masterMap.get(key);
                    idToMasterId.set(member.id, finalMaster.id);
                });

                // 3. Rewrite all relationships and filter to keep only Masters
                const finalMembers = Array.from(masterMap.values()).map(member => {
                    const rewriteId = (id) => idToMasterId.get(id) || id;

                    // Helper to unique-ify IDs after rewrite (to prevent multiple refs to same master)
                    const uniqueIds = (ids) => [...new Set(ids)];

                    return {
                        ...member,
                        parents: (member.parents || [])
                            .map(p => (typeof p === 'string' ? { id: rewriteId(p), type: 'biological' } : { ...p, id: rewriteId(p.id) }))
                            .filter((p, index, self) => index === self.findIndex(t => t.id === p.id)), // Unique parents
                        children: uniqueIds((member.children || []).map(rewriteId)),
                        spouses: (member.spouses || [])
                            .map(s => (typeof s === 'string' ? { id: rewriteId(s), status: 'married' } : { ...s, id: rewriteId(s.id) }))
                            .filter(s => s.id !== member.id) // No self-marriage
                            .filter((s, index, self) => index === self.findIndex(t => t.id === s.id)) // Unique spouses
                    };
                });

                mappedData = finalMembers;
            }

            setMembers(mappedData);
        } catch (error) {
            console.error("Gagal mengambil data dari Supabase:", error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (treeSlug !== 'gabungan' || selectedSlugs.length > 0) {
            fetchMembers();
        }
    }, [treeSlug, selectedSlugs]);

    const addMember = async (member) => {
        const id = crypto.randomUUID();
        const newMember = {
            ...member,
            id,
            children: [],
            spouses: [],
            parents: member.parents || []
        };

        try {
            const dbMember = {
                ...newMember,
                tree_slug: treeSlug,
                birth_date: newMember.birthDate,
                death_date: newMember.deathDate,
                is_deceased: newMember.isDeceased
            };
            delete dbMember.birthDate;
            delete dbMember.deathDate;
            delete dbMember.isDeceased;

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

                        const updatedSpouse = {
                            ...m,
                            spouses: [...(m.spouses || []).filter(s => (typeof s === 'string' ? s !== id : s.id !== id)), { id, status }]
                        };
                        modifiedMembers.push(updatedSpouse);
                        return updatedSpouse;
                    }
                    return m;
                });
            }

            const dbUpsertList = modifiedMembers.map(m => {
                const dbM = {
                    ...m,
                    tree_slug: treeSlug,
                    birth_date: m.birthDate || null,
                    death_date: m.deathDate || null,
                    is_deceased: m.isDeceased || false
                };
                delete dbM.birthDate;
                delete dbM.deathDate;
                delete dbM.isDeceased;
                return dbM;
            });

            const { error } = await supabase.from('members').upsert(dbUpsertList);
            if (error) throw error;

            // Audit Log - Wrapped in try/catch to prevent blocking if table missing
            try {
                await supabase.from('audit_logs').insert({
                    tree_slug: treeSlug,
                    action: 'ADD_MEMBER',
                    details: { name: newMember.name, id: newMember.id },
                    performed_by: 'Admin'
                });
            } catch (auditErr) {
                console.warn("Audit log failed:", auditErr.message);
            }

            setMembers(updatedList);
            setLastAction(`Tambah Anggota: ${newMember.name}`);
        } catch (error) {
            console.error("Gagal tambah anggota ke Supabase:", error.message);
            throw error;
        }
    };

    const updateMember = async (id, updatedData) => {
        try {
            const member = members.find(m => m.id === id);
            const updatedMember = { ...member, ...updatedData };

            let updatedList = members.map((m) => (m.id === id ? updatedMember : m));
            const modifiedMembers = [updatedMember];

            // Sync spouses back-and-forth
            if (updatedData.spouses) {
                const oldSpouseIds = (member.spouses || []).map(s => typeof s === 'string' ? s : s.id);
                const newSpouseIds = updatedData.spouses.map(s => typeof s === 'string' ? s : s.id);

                // 1. Members who are no longer spouses
                const removedIds = oldSpouseIds.filter(sid => !newSpouseIds.includes(sid));
                // 2. Members who are still spouses (to update status if changed)
                const keptIds = newSpouseIds;

                updatedList = updatedList.map(m => {
                    if (removedIds.includes(m.id)) {
                        const updatedSpouse = {
                            ...m,
                            spouses: (m.spouses || []).filter(s => (typeof s === 'string' ? s !== id : s.id !== id))
                        };
                        modifiedMembers.push(updatedSpouse);
                        return updatedSpouse;
                    }
                    if (keptIds.includes(m.id)) {
                        const spouseObjInNew = updatedData.spouses.find(s => (typeof s === 'string' ? s === m.id : s.id === m.id));
                        const status = typeof spouseObjInNew === 'object' ? spouseObjInNew.status : 'married';

                        const updatedSpouse = {
                            ...m,
                            spouses: [
                                ...(m.spouses || []).filter(s => (typeof s === 'string' ? s !== id : s.id !== id)),
                                { id, status }
                            ]
                        };
                        modifiedMembers.push(updatedSpouse);
                        return updatedSpouse;
                    }
                    return m;
                });
            }

            const dbUpsertList = modifiedMembers.map(m => {
                const dbM = {
                    ...m,
                    tree_slug: treeSlug,
                    birth_date: m.birthDate || null,
                    death_date: m.deathDate || null,
                    is_deceased: m.isDeceased || false
                };
                delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
                return dbM;
            });

            const { error } = await supabase.from('members').upsert(dbUpsertList);
            if (error) throw error;

            // Audit Log - Wrapped in try/catch
            try {
                await supabase.from('audit_logs').insert({
                    tree_slug: treeSlug,
                    action: 'UPDATE_MEMBER',
                    details: { name: member?.name || id, id: id, changes: updatedData },
                    performed_by: 'Admin'
                });
            } catch (auditErr) {
                console.warn("Audit log failed:", auditErr.message);
            }

            setMembers(updatedList);
            setLastAction(`Update Anggota: ${member?.name || id}`);
        } catch (error) {
            console.error("Gagal update anggota ke Supabase:", error.message);
            throw error;
        }
    };

    const deleteMember = async (id) => {
        try {
            const memberToDelete = members.find(m => m.id === id);
            if (!memberToDelete) return;

            const modifiedMembers = [];
            const updatedList = members.filter((m) => m.id !== id).map(m => {
                let updatedMember = { ...m };
                let modified = false;

                if (m.children?.includes(id)) {
                    updatedMember.children = updatedMember.children.filter(childId => childId !== id);
                    modified = true;
                }
                if (m.parents?.some(p => (typeof p === 'string' ? p : p.id) === id)) {
                    updatedMember.parents = updatedMember.parents.filter(p => (typeof p === 'string' ? p : p.id) !== id);
                    modified = true;
                }
                if (m.spouses?.some(s => (typeof s === 'string' ? s === id : s.id === id))) {
                    updatedMember.spouses = updatedMember.spouses.filter(s => (typeof s === 'string' ? s !== id : s.id !== id));
                    modified = true;
                }

                if (modified) {
                    modifiedMembers.push(updatedMember);
                    return updatedMember;
                }
                return m;
            });

            const { error: delError } = await supabase.from('members').delete().eq('id', id);
            if (delError) throw delError;

            if (modifiedMembers.length > 0) {
                const dbUpsertList = modifiedMembers.map(m => {
                    const dbM = {
                        ...m,
                        tree_slug: treeSlug,
                        birth_date: m.birthDate || null,
                        death_date: m.deathDate || null,
                        is_deceased: m.isDeceased || false
                    };
                    delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
                    return dbM;
                });

                const { error: upError } = await supabase.from('members').upsert(dbUpsertList);
                if (upError) throw upError;
            }

            // Audit Log - Wrapped in try/catch
            try {
                await supabase.from('audit_logs').insert({
                    tree_slug: treeSlug,
                    action: 'DELETE_MEMBER',
                    details: { name: memberToDelete.name, id: id },
                    performed_by: 'Admin'
                });
            } catch (auditErr) {
                console.warn("Audit log failed:", auditErr.message);
            }

            setMembers(updatedList);
            setLastAction(`Hapus Anggota: ${memberToDelete.name}`);
        } catch (error) {
            console.error("Gagal hapus anggota dari Supabase:", error.message);
            throw error;
        }
    };

    useEffect(() => {
        if (treeSlug && members.length > 0) {
            localStorage.setItem(`family_data_${treeSlug}`, JSON.stringify(members));
        }
    }, [members, treeSlug]);

    const migrateFromLocal = async () => {
        let localData = localStorage.getItem(`family_data_${treeSlug}`);
        if (!localData && treeSlug === 'default') {
            localData = localStorage.getItem('family-tree-data');
        }

        if (!localData) return { success: false, message: `Tidak ada data lokal ditemukan untuk ${treeSlug}.` };

        try {
            const localMembers = JSON.parse(localData);
            if (!Array.isArray(localMembers) || localMembers.length === 0) {
                return { success: false, message: "Data lokal kosong atau tidak valid." };
            }

            const sanitizedData = localMembers.map(m => ({
                id: m.id,
                tree_slug: treeSlug,
                name: m.name,
                gender: m.gender,
                birth_date: m.birthDate || m.birth_date || null,
                death_date: m.deathDate || m.death_date || null,
                is_deceased: !!(m.isDeceased ?? m.is_deceased),
                occupation: m.occupation || '',
                address: m.address || '',
                biography: m.biography || '',
                photo: m.photo || null,
                phone: m.phone || '',
                parents: Array.isArray(m.parents) ? m.parents : [],
                children: Array.isArray(m.children) ? m.children : [],
                spouses: Array.isArray(m.spouses) ? m.spouses : []
            }));

            const { error } = await supabase.from('members').upsert(sanitizedData);
            if (error) throw error;

            await fetchMembers();
            return { success: true, message: `Berhasil migrasi ${sanitizedData.length} anggota ke Cloud(${treeSlug})!` };
        } catch (error) {
            console.error("Migration Error:", error);
            return { success: false, message: error.message };
        }
    };

    const importData = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const jsonObj = JSON.parse(event.target.result);
                    if (!Array.isArray(jsonObj)) {
                        return reject(new Error("Format file tidak valid."));
                    }

                    const sanitizedData = jsonObj.map(m => ({
                        id: m.id,
                        tree_slug: treeSlug,
                        name: m.name,
                        gender: m.gender,
                        birth_date: m.birthDate || m.birth_date || null,
                        death_date: m.deathDate || m.death_date || null,
                        is_deceased: !!(m.isDeceased ?? m.is_deceased),
                        occupation: m.occupation || '',
                        address: m.address || '',
                        biography: m.biography || '',
                        photo: m.photo || null,
                        phone: m.phone || '',
                        parents: Array.isArray(m.parents) ? m.parents : [],
                        children: Array.isArray(m.children) ? m.children : [],
                        spouses: Array.isArray(m.spouses) ? m.spouses : []
                    }));

                    const { error } = await supabase.from('members').upsert(sanitizedData);
                    if (error) throw error;

                    await fetchMembers();
                    setLastAction('Import Data JSON');
                    resolve(true);
                } catch (e) {
                    console.error("Import Error:", e);
                    reject(e);
                }
            };
            reader.readAsText(file);
        });
    };

    const importFromExcel = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(sheet);

                    if (jsonData.length === 0) {
                        return reject(new Error("File Excel kosong atau tidak terbaca."));
                    }

                    const nameToId = new Map();
                    const newMembers = jsonData.map(row => {
                        const id = crypto.randomUUID();
                        const rawName = (row['Name'] || row['Nama'] || '').toString().trim();
                        nameToId.set(rawName.toLowerCase(), id);
                        return {
                            id: id,
                            name: rawName || 'Tanpa Nama',
                            gender: (row['Gender'] || row['Jenis Kelamin'] || '').toString().toLowerCase().startsWith('l') || (row['Gender'] || '').toString().toLowerCase().startsWith('m') ? 'male' : 'female',
                            birthDate: row['BirthDate'] || row['Tanggal Lahir'] || '',
                            phone: row['Telepon'] || row['Phone'] || '',
                            photo: null, children: [], spouses: [], parents: [],
                            _father: row['Father'] || row['Ayah'], _mother: row['Mother'] || row['Ibu'], _spouse: row['Spouse'] || row['Pasangan']
                        };
                    });

                    newMembers.forEach(m => {
                        if (m._father) {
                            const fName = m._father.toString().trim().toLowerCase();
                            if (nameToId.has(fName)) {
                                const fId = nameToId.get(fName);
                                m.parents.push({ id: fId, type: 'biological' });
                                newMembers.find(fm => fm.id === fId)?.children.push(m.id);
                            }
                        }
                        if (m._mother) {
                            const mName = m._mother.toString().trim().toLowerCase();
                            if (nameToId.has(mName)) {
                                const mId = nameToId.get(mName);
                                m.parents.push({ id: mId, type: 'biological' });
                                newMembers.find(mm => mm.id === mId)?.children.push(m.id);
                            }
                        }
                        if (m._spouse) {
                            const sName = m._spouse.toString().trim().toLowerCase();
                            if (nameToId.has(sName)) {
                                const sId = nameToId.get(sName);
                                m.spouses.push(sId);
                                newMembers.find(sm => sm.id === sId)?.spouses.push(m.id);
                            }
                        }
                        delete m._father; delete m._mother; delete m._spouse;
                    });

                    const updatedList = [...members, ...newMembers];
                    const dbList = newMembers.map(m => {
                        const dbM = {
                            ...m,
                            tree_slug: treeSlug,
                            birth_date: m.birthDate || null,
                            death_date: m.death_date || null,
                            is_deceased: m.isDeceased || false
                        };
                        delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
                        return dbM;
                    });

                    const { error } = await supabase.from('members').upsert(dbList);
                    if (error) throw error;

                    setMembers(updatedList);
                    setLastAction(`Import Excel: ${newMembers.length} anggota`);
                    resolve(true);
                } catch (err) { reject(err); }
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const createSnapshot = async (note = '') => {
        try {
            const { error } = await supabase.from('backups').insert({
                tree_slug: treeSlug,
                data: members,
                note: note
            });
            if (error) throw error;
            setLastAction(`Buat Snapshot: ${note || new Date().toLocaleString()}`);
            return { success: true };
        } catch (error) {
            console.error("Gagal membuat snapshot:", error.message);
            return { success: false, message: error.message };
        }
    };

    const listSnapshots = async () => {
        try {
            const { data, error } = await supabase
                .from('backups')
                .select('id, created_at, note')
                .eq('tree_slug', treeSlug)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Gagal mengambil daftar snapshot:", error.message);
            return [];
        }
    };

    const restoreSnapshot = async (snapshotId) => {
        try {
            const { data, error } = await supabase
                .from('backups')
                .select('data')
                .eq('id', snapshotId)
                .single();
            if (error) throw error;

            const backupData = data.data;

            const { error: delError } = await supabase
                .from('members')
                .delete()
                .eq('tree_slug', treeSlug);
            if (delError) throw delError;

            const dbList = backupData.map(m => {
                const dbM = {
                    ...m,
                    tree_slug: treeSlug,
                    birth_date: m.birthDate || m.birth_date || null,
                    death_date: m.deathDate || m.death_date || null,
                    is_deceased: !!(m.isDeceased ?? m.is_deceased)
                };
                delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
                return dbM;
            });

            const { error: insError } = await supabase.from('members').insert(dbList);
            if (insError) throw insError;

            await fetchMembers();
            setLastAction(`Snapshot di-restore`);
            return { success: true };
        } catch (error) {
            console.error("Gagal restore snapshot:", error.message);
            return { success: false, message: error.message };
        }
    };

    const exportData = () => {
        const dataStr = JSON.stringify(members, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `family-tree-${treeSlug}-${new Date().toISOString().slice(0, 10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        setLastAction('Export Data JSON');
    };

    const exportToExcel = (options = {}) => {
        const workbook = generateExcelBook(members, options);
        XLSX.writeFile(workbook, `family-tree-${treeSlug}-${new Date().toISOString().slice(0, 10)}.xlsx`);
        setLastAction('Export Excel');
    };

    const exportToCSV = () => {
        const workbook = generateExcelBook(members, { includeStats: false });
        XLSX.writeFile(workbook, `family-tree-${treeSlug}-${new Date().toISOString().slice(0, 10)}.csv`, { bookType: 'csv' });
        setLastAction('Export CSV');
    };

    const exportToHTML = (options = {}) => {
        const html = generateHTMLBook(members, options);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `buku-keluarga-${treeSlug}.html`;
        link.click();
        URL.revokeObjectURL(url);
        setLastAction('Export HTML');
    };

    const listAllSlugs = async () => {
        try {
            const { data, error } = await supabase.from('members').select('tree_slug');
            if (error) throw error;
            const slugs = [...new Set(data.filter(m => m.tree_slug).map(m => m.tree_slug))];
            if (!slugs.includes('default')) slugs.push('default');
            return slugs;
        } catch (error) {
            console.error("Gagal mengambil daftar slug:", error.message);
            return [];
        }
    };

    return (
        <FamilyContext.Provider value={{
            members, treeSlug, setTreeSlug, selectedSlugs, setSelectedSlugs, addMember, updateMember, deleteMember,
            exportData, importData, importFromExcel, exportToExcel, exportToCSV, exportToHTML,
            undo, redo, canUndo, canRedo, lastAction,
            isLoading, migrateFromLocal, fetchMembers, listAllSlugs,
            createSnapshot, listSnapshots, restoreSnapshot
        }}>
            {children}
        </FamilyContext.Provider>
    );
};
