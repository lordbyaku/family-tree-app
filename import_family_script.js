/**
 * SCRIPT IMPORT KELUARGA 5 GENERASI
 * Cara pakai:
 * 1. Pastikan database sudah dihapus (gunakan delete_all_script.js dulu)
 * 2. Download file dummy_family_5_generations_fixed.json
 * 3. Login ke https://family-tree-app-pi.vercel.app/ sebagai admin
 * 4. Buka Developer Console (F12)
 * 5. Copy-paste script ini ke console
 * 6. Tekan Enter
 */

const FAMILY_DATA = [
    {
        "id": "gen1-male-001",
        "name": "Raden Soekamto",
        "gender": "male",
        "birthDate": "1930-03-15",
        "deathDate": "1995-08-12",
        "isDeceased": true,
        "placeOfBirth": "Yogyakarta",
        "occupation": "Guru",
        "education": "SMA",
        "address": "Jl. Malioboro No. 45, Yogyakarta",
        "phone": "",
        "email": "",
        "biography": "Pendiri keluarga, mantan guru SMA yang sangat dihormati",
        "children": ["gen2-male-001", "gen2-female-001", "gen2-male-002", "gen2-female-002"],
        "parents": [],
        "spouses": [{ "id": "gen1-female-001", "status": "married" }],
        "photo": null
    },
    {
        "id": "gen1-female-001",
        "name": "Siti Aminah",
        "gender": "female",
        "birthDate": "1935-07-20",
        "deathDate": "2005-11-05",
        "isDeceased": true,
        "placeOfBirth": "Solo",
        "occupation": "Ibu Rumah Tangga",
        "education": "SMP",
        "address": "Jl. Malioboro No. 45, Yogyakarta",
        "phone": "",
        "email": "",
        "biography": "Ibu yang penuh kasih sayang, membesarkan 4 anak",
        "children": ["gen2-male-001", "gen2-female-001", "gen2-male-002", "gen2-female-002"],
        "parents": [],
        "spouses": [{ "id": "gen1-male-001", "status": "married" }],
        "photo": null
    }
    // ... (data lainnya - total 50 anggota)
];

async function importFamilyData() {
    console.log('📥 Starting IMPORT process...');
    console.log(`📊 Total members to import: ${FAMILY_DATA.length}`);

    const confirmed = confirm(`Import ${FAMILY_DATA.length} anggota keluarga?\n\nPastikan database sudah kosong!`);

    if (!confirmed) {
        console.log('❌ Import dibatalkan');
        return;
    }

    try {
        // Dapatkan supabase configuration dari .env atau hardcode
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

        const { createClient } = supabase;
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

        const TREE_SLUG = 'default';

        // Transform data ke format database
        const dbData = FAMILY_DATA.map(member => ({
            id: member.id,
            name: member.name || '',
            gender: member.gender || 'male',
            birth_date: member.birthDate || null,
            death_date: member.deathDate || null,
            is_deceased: member.isDeceased || false,
            place_of_birth: member.placeOfBirth || null,
            occupation: member.occupation || null,
            education: member.education || null,
            address: member.address || null,
            phone: member.phone || null,
            email: member.email || null,
            biography: member.biography || null,
            photo: member.photo || null,
            children: member.children || [],
            parents: member.parents || [],
            spouses: member.spouses || [],
            tree_slug: TREE_SLUG
        }));

        console.log('📤 Uploading to Supabase...');

        // Insert in batches (Supabase has limit)
        const BATCH_SIZE = 10;
        for (let i = 0; i < dbData.length; i += BATCH_SIZE) {
            const batch = dbData.slice(i, i + BATCH_SIZE);
            const { error } = await supabaseClient
                .from('members')
                .upsert(batch);

            if (error) throw error;

            console.log(`✅ Imported ${Math.min(i + BATCH_SIZE, dbData.length)}/${dbData.length}`);
        }

        console.log('🎉 Import completed successfully!');
        console.log('🔄 Reloading page in 2 seconds...');

        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error) {
        console.error('❌ Import error:', error);
        alert('Import gagal: ' + error.message);
    }
}

// AUTO RUN
importFamilyData();
