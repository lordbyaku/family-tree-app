
import { createContext, useContext, useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
const { utils, write } = XLSX;
import useUndo from 'use-undo';
import { generateExcelBook, generateHTMLBook, generateExcelTemplate } from '../utils/familyBook';
import { generatePDFBook } from '../utils/pdfExport';
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
                isDeceased: !!m.is_deceased,
                parents: m.parents || [],
                children: m.children || [],
                spouses: m.spouses || []
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

            // Collect all members that need to be updated in DB
            const modifiedMembersMap = new Map();
            modifiedMembersMap.set(id, updatedMember);

            // 1. Sync Spouses
            if (updatedData.spouses) {
                const oldSpouseIds = (member.spouses || []).map(s => typeof s === 'string' ? s : s.id);
                const newSpouseIds = updatedData.spouses.map(s => typeof s === 'string' ? s : s.id);

                // Removed spouses
                oldSpouseIds.filter(sid => !newSpouseIds.includes(sid)).forEach(sid => {
                    const spouse = members.find(m => m.id === sid);
                    if (spouse) {
                        const updatedSpouse = { ...spouse, spouses: (spouse.spouses || []).filter(s => (typeof s === 'string' ? s !== id : s.id !== id)) };
                        modifiedMembersMap.set(sid, updatedSpouse);
                    }
                });

                // Added/Modified spouses
                newSpouseIds.forEach(sid => {
                    const spouse = members.find(m => m.id === sid);
                    if (spouse) {
                        const spouseObjInNew = updatedData.spouses.find(s => (typeof s === 'string' ? s === sid : s.id === sid));
                        const status = typeof spouseObjInNew === 'object' ? spouseObjInNew.status : 'married';
                        const updatedSpouse = { ...spouse, spouses: [...(spouse.spouses || []).filter(s => (typeof s === 'string' ? s !== id : s.id !== id)), { id, status }] };
                        modifiedMembersMap.set(sid, updatedSpouse);
                    }
                });
            }

            // 2. Sync Parents (Update their children arrays)
            if (updatedData.parents) {
                const oldParentIds = (member.parents || []).map(p => typeof p === 'string' ? p : p.id);
                const newParentIds = updatedData.parents.map(p => typeof p === 'string' ? p : p.id);

                // Removed parents
                oldParentIds.filter(pid => !newParentIds.includes(pid)).forEach(pid => {
                    const parent = members.find(m => m.id === pid);
                    if (parent) {
                        const updatedParent = { ...parent, children: (parent.children || []).filter(cid => cid !== id) };
                        modifiedMembersMap.set(pid, updatedParent);
                    }
                });

                // Added parents
                newParentIds.filter(pid => !oldParentIds.includes(pid)).forEach(pid => {
                    const parent = members.find(m => m.id === pid);
                    if (parent) {
                        const updatedParent = { ...parent, children: [...new Set([...(parent.children || []), id])] };
                        modifiedMembersMap.set(pid, updatedParent);
                    }
                });
            }

            const finalModifiedList = Array.from(modifiedMembersMap.values());
            const dbUpsertList = finalModifiedList.map(m => {
                const dbM = {
                    ...m,
                    tree_slug: m.tree_slug || treeSlug,
                    birth_date: m.birthDate || null,
                    death_date: m.deathDate || null,
                    is_deceased: m.isDeceased || false
                };
                delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
                return dbM;
            });

            const { error } = await supabase.from('members').upsert(dbUpsertList);
            if (error) throw error;

            // Update local state
            const updatedList = members.map(m => modifiedMembersMap.get(m.id) || m);
            setMembers(updatedList);
            setLastAction(`Update Anggota: ${member?.name || id}`);
        } catch (error) {
            console.error("Gagal update anggota:", error.message);
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

    const migrateFromLocal = async () => {
        try {
            const localData = localStorage.getItem('family-tree-data') || localStorage.getItem(`family_data_${treeSlug}`);
            if (!localData) return { success: false, message: "Tidak ada data lokal untuk dimigrasi." };

            const parsed = JSON.parse(localData);
            const { error } = await supabase.from('members').upsert(
                parsed.map(m => ({
                    ...m,
                    tree_slug: treeSlug,
                    birth_date: m.birthDate || null,
                    death_date: m.deathDate || null,
                    is_deceased: m.isDeceased || false
                }))
            );

            if (error) throw error;
            localStorage.removeItem(`family_data_${treeSlug}`);
            fetchMembers();
            return { success: true, message: "Migrasi berhasil!" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const importData = async (file) => {
        const text = await file.text();
        const data = JSON.parse(text);

        const upsertData = data.map(m => {
            const dbM = { ...m, tree_slug: treeSlug, birth_date: m.birthDate || null, death_date: m.deathDate || null, is_deceased: m.isDeceased || false };
            delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
            return dbM;
        });

        const { error } = await supabase.from('members').upsert(upsertData);
        if (error) throw error;
        fetchMembers();
    };

    const importFromExcel = async (file) => {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet);

        // Helper function to convert Excel date serial to YYYY-MM-DD
        const excelDateToString = (excelDate) => {
            if (!excelDate) return null;
            // If already a string in DD/MM/YYYY format
            if (typeof excelDate === 'string' && excelDate.includes('/')) {
                const parts = excelDate.split('/');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            // If Excel serial number
            if (typeof excelDate === 'number') {
                const date = new Date((excelDate - 25569) * 86400 * 1000);
                return date.toISOString().split('T')[0];
            }
            // If already YYYY-MM-DD
            if (typeof excelDate === 'string' && excelDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return excelDate;
            }
            return null;
        };

        // First pass: create all members without relationships
        // Don't generate ID yet - let Supabase auto-generate to avoid collision
        const membersMap = new Map();
        const mappedData = jsonData
            .filter(row => {
                // Skip rows without name
                const name = row['Nama'] || row['name'] || '';
                return name.trim().length > 0;
            })
            .map(row => {
                const member = {
                    name: row['Nama'] || row['name'] || '',
                    gender: (row['Jenis Kelamin'] === 'Laki-laki' || row['gender'] === 'male') ? 'male' : 'female',
                    birth_date: excelDateToString(row['Tanggal Lahir'] || row['birthDate']),
                    death_date: excelDateToString(row['Tanggal Wafat'] || row['deathDate']),
                    is_deceased: row['Status'] === 'Meninggal' || row['isDeceased'] || false,
                    phone: row['Telepon'] || row['phone'] || '',
                    occupation: row['Pekerjaan'] || row['occupation'] || '',
                    address: row['Domisili'] || row['address'] || '',
                    biography: row['Biografi'] || row['biography'] || '',
                    tree_slug: treeSlug, // Set tree_slug immediately
                    parentNames: row['Orang Tua'] || '',
                    spouseNames: row['Pasangan'] || '',
                    children: [],
                    parents: [],
                    spouses: []
                };
                membersMap.set(member.name.toLowerCase().trim(), member);
                return member;
            });

        // Insert all members first (without relationships)
        const insertData = mappedData.map(m => {
            const dbM = { ...m };
            delete dbM.parentNames;
            delete dbM.spouseNames;
            return dbM;
        });
        console.log("Data to be inserted:", insertData);

        let insertedMembers;
        try {
            const { data, error } = await supabase
                .from('members')
                .insert(insertData)
                .select();

            if (error) {
                console.error("Error inserting initial members:", error.message);
                throw error;
            }
            insertedMembers = data;
        } catch (insertError) {
            console.error("Failed to insert initial members from Excel:", insertError.message);
            throw new Error("Gagal memasukkan anggota awal dari Excel: " + insertError.message);
        }

        // Create a map of name -> inserted member (with ID)
        const nameToMemberMap = new Map();
        insertedMembers.forEach(m => {
            nameToMemberMap.set(m.name.toLowerCase().trim(), m);
        });

        // Second pass: resolve relationships by name and update
        const updates = [];
        mappedData.forEach((member, index) => {
            const insertedMember = nameToMemberMap.get(member.name.toLowerCase().trim());
            if (!insertedMember) return;

            let hasChanges = false;
            // Sertakan 'name' untuk menghindari error NOT NULL constraint saat upsert
            const updateData = {
                id: insertedMember.id,
                name: insertedMember.name
            };

            // Parse parent names and convert to IDs
            if (member.parentNames) {
                const parentNamesList = member.parentNames.split(',').map(n => n.trim().toLowerCase()).filter(Boolean);
                const parentIds = [];

                parentNamesList.forEach(parentName => {
                    const parent = nameToMemberMap.get(parentName);
                    if (parent) {
                        parentIds.push({ id: parent.id, type: 'biological' });
                    }
                });

                if (parentIds.length > 0) {
                    updateData.parents = parentIds;
                    hasChanges = true;
                }
            }

            // Parse spouse names and convert to IDs
            if (member.spouseNames) {
                const spouseNamesList = member.spouseNames.split(',').map(n => n.trim().toLowerCase()).filter(Boolean);
                const spouseIds = [];

                spouseNamesList.forEach(spouseName => {
                    const spouse = nameToMemberMap.get(spouseName);
                    if (spouse) {
                        spouseIds.push({ id: spouse.id, status: 'married' });
                    }
                });

                if (spouseIds.length > 0) {
                    updateData.spouses = spouseIds;
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                updates.push(updateData);
            }
        });

        // Update relationships if any
        if (updates.length > 0) {
            const { error: updateError } = await supabase
                .from('members')
                .upsert(updates);

            if (updateError) throw updateError;
        }

        // Third pass: Update children relationships based on parents
        // Only work with members in THIS tree_slug
        const { data: allMembers, error: fetchError } = await supabase
            .from('members')
            .select('*')
            .eq('tree_slug', treeSlug);

        if (fetchError) throw fetchError;

        const childrenUpdates = [];
        const processedParents = new Set();

        allMembers.forEach(member => {
            const parents = member.parents || [];
            if (parents.length > 0) {
                parents.forEach(p => {
                    const parentId = typeof p === 'string' ? p : p.id;

                    // Skip if already processed to avoid duplicates
                    if (processedParents.has(parentId)) return;

                    const parent = allMembers.find(m => m.id === parentId);
                    if (parent) {
                        // Find all children of this parent
                        const childrenOfParent = allMembers
                            .filter(m => {
                                const ps = m.parents || [];
                                return ps.some(pObj => {
                                    const pid = typeof pObj === 'string' ? pObj : pObj.id;
                                    return pid === parentId;
                                });
                            })
                            .map(m => m.id);

                        if (childrenOfParent.length > 0) {
                            childrenUpdates.push({
                                id: parentId,
                                name: parent.name, // Sertakan name untuk memuaskan constraint
                                children: childrenOfParent
                            });
                            processedParents.add(parentId);
                        }
                    }
                });
            }
        });

        // Update children
        if (childrenUpdates.length > 0) {
            const { error: childrenError } = await supabase
                .from('members')
                .upsert(childrenUpdates);

            if (childrenError) throw childrenError;
        }

        fetchMembers();
    };

    const listAllSlugs = async () => {
        try {
            const { data, error } = await supabase.from('members').select('tree_slug');
            if (error) throw error;
            const slugs = [...new Set(data.filter(m => m.tree_slug).map(m => m.tree_slug))];
            if (!slugs.includes('default')) slugs.push('default');
            return slugs;
        } catch (error) { return []; }
    };

    const exportData = () => {
        const dataStr = JSON.stringify(members, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `family-tree-${treeSlug}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        // Cleanup memory leak
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const exportToExcel = async (options = {}) => {
        const workbook = generateExcelBook(members, options);
        const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `buku-keluarga-${treeSlug}-${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        // Cleanup memory leak
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const exportToCSV = () => {
        const workbook = generateExcelBook(members, { includeStats: false });
        const csv = utils.sheet_to_csv(workbook.Sheets['Direktori Anggota']);
        const data = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `data-keluarga-${treeSlug}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        // Cleanup memory leak
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const exportToHTML = (options = {}) => {
        const html = generateHTMLBook(members, options);
        const data = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `buku-keluarga-${treeSlug}-${new Date().toISOString().split('T')[0]}.html`;
        link.click();
        // Cleanup memory leak
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    const exportToPDF = async (options = {}) => {
        try {
            const doc = await generatePDFBook(members, options);
            doc.save(`buku-keluarga-${treeSlug}-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("Gagal generate PDF:", error);
            throw error;
        }
    };

    const exportToPDFCall = async (options = {}) => {
        await exportToPDF(members, options);
    };

    const createSnapshot = async (note = '') => {
        try {
            const { error } = await supabase.from('backups').insert([{
                tree_slug: treeSlug,
                note: note,
                data: members,
                created_at: new Date().toISOString()
            }]);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const listSnapshots = async () => {
        try {
            const { data, error } = await supabase
                .from('backups')
                .select('*')
                .eq('tree_slug', treeSlug)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Gagal list snapshots:", error.message);
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

            const snapshotData = data.data;
            // 1. Delete current members of this slug
            const { error: delError } = await supabase
                .from('members')
                .delete()
                .eq('tree_slug', treeSlug);
            if (delError) throw delError;

            // 2. Insert snapshot data
            const upsertData = snapshotData.map(m => {
                const dbM = { ...m, tree_slug: treeSlug, birth_date: m.birthDate || null, death_date: m.deathDate || null, is_deceased: m.isDeceased || false };
                delete dbM.birthDate; delete dbM.deathDate; delete dbM.isDeceased;
                return dbM;
            });

            const { error: insError } = await supabase.from('members').upsert(upsertData);
            if (insError) throw insError;

            fetchMembers();
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const downloadExcelTemplate = () => {
        const workbook = generateExcelTemplate();
        const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `template-import-keluarga.xlsx`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };

    return (
        <FamilyContext.Provider value={{
            members, treeSlug, setTreeSlug, prevTreeSlug, selectedSlugs, setSelectedSlugs,
            treeMetadata, updateTreeMetadata, fetchTreeMetadata,
            addMember, updateMember, deleteMember,
            exportData, importData, undo, redo, canUndo, canRedo, lastAction,
            isLoading, listAllSlugs, fetchMembers,
            createSnapshot, listSnapshots, restoreSnapshot,
            exportToExcel, exportToCSV, exportToHTML, exportToPDF, migrateFromLocal,
            importFromExcel, downloadExcelTemplate
        }}>
            {children}
        </FamilyContext.Provider>
    );
};
