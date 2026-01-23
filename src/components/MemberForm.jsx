import { useState, useRef, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { X, Upload, Loader2, Camera } from 'lucide-react';
import { compressImage } from '../utils/image';
import { supabase } from '../lib/supabase';
import MemberBasicInfo from './MemberBasicInfo';
import MemberRelationshipInfo from './MemberRelationshipInfo';
import MemberBiographicalInfo from './MemberBiographicalInfo';


const MemberForm = ({ onClose, initialData = null }) => {
    const { addMember, updateMember, deleteMember, members } = useFamily();
    const [isUploading, setIsUploading] = useState(false);

    // Schema: parents: Array<{ id, type: 'biological' | 'step' }>
    // Legacy support: convert array of IDs to objects
    const formatParents = (parents) => {
        if (!parents) return [];
        return parents.map(p => typeof p === 'string' ? { id: p, type: 'biological' } : p);
    };

    const [formData, setFormData] = useState(initialData ? {
        name: initialData.name,
        birthDate: initialData.birthDate,
        deathDate: initialData.deathDate || '',
        isDeceased: initialData.isDeceased || false,
        occupation: initialData.occupation || '',
        address: initialData.address || '',
        biography: initialData.biography || '',
        gender: initialData.gender,
        photo: initialData.photo || '',
        phone: initialData.phone || '', // Added phone field
        parents: formatParents(initialData.parents),
        spouses: initialData.spouses || []
    } : {
        name: '',
        birthDate: '',
        deathDate: '',
        isDeceased: false,
        occupation: '',
        address: '',
        biography: '',
        gender: 'male',
        photo: '',
        phone: '', // Added phone field
        parents: [],
        spouses: []
    });

    const isEditing = !!initialData;
    const [error, setError] = useState('');

    const isDescendant = (potentialParentId, targetMemberId, visited = new Set()) => {
        if (potentialParentId === targetMemberId) return true;
        if (visited.has(targetMemberId)) return false;
        visited.add(targetMemberId);

        const targetMember = members.find(m => m.id === targetMemberId);
        if (!targetMember || !targetMember.children) return false;

        return targetMember.children.some(childId => isDescendant(potentialParentId, childId, visited));
    };

    const validate = () => {
        if (formData.birthDate && formData.isDeceased && formData.deathDate) {
            if (new Date(formData.deathDate) < new Date(formData.birthDate)) {
                return 'Tanggal wafat tidak boleh sebelum tanggal lahir.';
            }
        }

        if (formData.parents.length > 0) {
            const parentIds = formData.parents.map(p => p.id);
            if (initialData && parentIds.includes(initialData.id)) {
                return 'Tidak bisa menjadi orang tua dari diri sendiri.';
            }

            if (initialData) {
                for (const pid of parentIds) {
                    if (isDescendant(pid, initialData.id)) {
                        const parent = members.find(m => m.id === pid);
                        return `Hubungan tidak valid: ${parent.name} adalah keturunan dari ${initialData.name}. Tidak bisa menjadi orang tua.`;
                    }
                }
            }

            // Standard logic: Parent must be older
            for (const pObj of formData.parents) {
                const parent = members.find(m => m.id === pObj.id);
                // Only enforce strict age for biological parents
                if (parent && parent.birthDate && formData.birthDate && pObj.type === 'biological') {
                    const parentDob = new Date(parent.birthDate);
                    const childDob = new Date(formData.birthDate);

                    if (parentDob >= childDob) {
                        return `Data tidak valid: Orang tua kandung (${parent.name}) lahir setelah atau bersamaan dengan anak.`;
                    }

                    const minParentAge = new Date(parentDob);
                    minParentAge.setFullYear(minParentAge.getFullYear() + 10);
                    if (minParentAge > childDob) {
                        return `Data tidak valid: Umur orang tua kandung (${parent.name}) terlalu muda (< 10 tahun) saat anak lahir.`;
                    }
                }
            }
        }

        return '';
    };

    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isUploading) {
            setError('Sedang mengunggah foto, mohon tunggu...');
            return;
        }

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            if (isEditing) {
                await updateMember(initialData.id, formData);
                toast.success("Data berhasil diperbarui!");
            } else {
                await addMember(formData);
                toast.success("Anggota berhasil ditambahkan!");
            }
            onClose();
        } catch (err) {
            setError(err.message || "Gagal menyimpan data.");
            toast.error("Gagal menyimpan data.");
        }
    };

    const confirm = useConfirm();

    const handleDelete = () => {
        confirm({
            title: 'Hapus Anggota?',
            message: `Apakah Anda yakin ingin menghapus ${initialData.name}? Tindakan ini tidak dapat dibatalkan.`,
            type: 'danger',
            onConfirm: () => {
                deleteMember(initialData.id);
                toast.success("Anggota berhasil dihapus!");
                onClose();
            }
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setError('');

        try {
            const compressedBlob = await compressImage(file, 800, 0.7);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedBlob, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, photo: publicUrl }));
            toast.success("Foto berhasil diunggah!");
        } catch (err) {
            console.error("Upload error:", err);
            setError("Gagal mengunggah foto. Pastikan koneksi stabil.");
            toast.error("Gagal mengunggah foto.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleParentAdd = (selectedId) => {
        if (formData.parents.length < 4) {
            setFormData(prev => ({
                ...prev,
                parents: [...prev.parents, { id: selectedId, type: 'biological' }]
            }));
        }
    };

    const toggleParentType = (id) => {
        setFormData(prev => ({
            ...prev,
            parents: prev.parents.map(p => p.id === id
                ? { ...p, type: p.type === 'biological' ? 'step' : 'biological' }
                : p
            )
        }));
    };

    const removeParent = (id) => {
        setFormData(prev => ({ ...prev, parents: prev.parents.filter(p => p.id !== id) }));
    };

    const handleSpouseAdd = (selectedId) => {
        setFormData(prev => ({ ...prev, spouses: [...prev.spouses, selectedId] }));
    };

    const removeSpouse = (id) => {
        setFormData(prev => ({ ...prev, spouses: prev.spouses.filter(s => s !== id) }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {isEditing ? 'Edit Profil' : 'Tambah Anggota'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/40 border border-red-100 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                        <span className="mt-0.5">⚠️</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto no-scrollbar">
                    <MemberBasicInfo
                        formData={formData}
                        handleChange={handleChange}
                        setFormData={setFormData}
                    />

                    {/* Photo upload section stays in Main Form as it uses refs and local states for uploading */}
                    <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm">
                                {isUploading ? (
                                    <Loader2 size={24} className="text-blue-500 animate-spin" />
                                ) : formData.photo ? (
                                    <img src={formData.photo} className="w-full h-full object-cover" />
                                ) : (
                                    <Camera size={24} className="text-slate-400" />
                                )}
                            </div>
                            {formData.photo && !isUploading && (
                                <button type="button" onClick={() => setFormData(p => ({ ...p, photo: '' }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110">
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <label className="inline-block text-sm font-bold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                {isUploading ? 'Mengunggah...' : 'Pilih Foto Profil'}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isUploading} />
                            </label>
                            <p className="text-[10px] text-slate-400 mt-1 truncate">Maks. 5MB. Otomatis kompresi.</p>
                        </div>
                    </div>

                    <MemberBiographicalInfo
                        formData={formData}
                        handleChange={handleChange}
                    />

                    <MemberRelationshipInfo
                        formData={formData}
                        members={members}
                        initialData={initialData}
                        handleParentAdd={handleParentAdd}
                        toggleParentType={toggleParentType}
                        removeParent={removeParent}
                        handleSpouseAdd={handleSpouseAdd}
                        removeSpouse={removeSpouse}
                    />

                    {/* Actions */}
                    <div className="pt-6 flex gap-4 mt-auto">
                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                            {isEditing ? 'Simpan Perubahan' : 'Tambah Anggota'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={handleDelete} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                <span className="rotate-45 block"><X size={20} /></span>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MemberForm;
