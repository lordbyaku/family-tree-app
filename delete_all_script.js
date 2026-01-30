/**
 * SCRIPT DELETE ALL MEMBERS
 * Cara pakai:
 * 1. Login ke https://family-tree-app-pi.vercel.app/
 * 2. Buka Developer Console (F12)
 * 3. Copy-paste script ini
 * 4. Tekan Enter
 */

// KONFIGURASI
const TREE_SLUG = 'default'; // Ganti dengan slug tree yang mau dihapus
const CONFIRM_DELETE = true; // Set ke true untuk konfirmasi

async function deleteAllMembers() {
    console.log('🗑️ Starting DELETE ALL process...');

    if (!CONFIRM_DELETE) {
        console.error('❌ Please set CONFIRM_DELETE = true to proceed');
        return;
    }

    // Konfirmasi user
    const confirmed = confirm(`⚠️ WARNING! Ini akan menghapus SEMUA data di tree "${TREE_SLUG}".\n\nApakah Anda yakin? Aksi ini TIDAK BISA DI-UNDO!`);

    if (!confirmed) {
        console.log('❌ Dibatalkan oleh user');
        return;
    }

    try {
        // Ambil Supabase client dari window (sudah di-load oleh aplikasi)
        const supabaseUrl = 'YOUR_SUPABASE_URL'; // Ganti dengan URL Supabase Anda
        const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Ganti dengan Anon Key Anda

        // Atau jika aplikasi expose supabase client:
        // const supabase = window.supabase;

        console.log(`📡 Connecting to Supabase...`);

        const { createClient } = supabase;
        const supabaseClient = createClient(supabaseUrl, supabaseKey);

        // Get count first
        const { count: beforeCount, error: countError } = await supabaseClient
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('tree_slug', TREE_SLUG);

        if (countError) throw countError;

        console.log(`📊 Found ${beforeCount} members in tree "${TREE_SLUG}"`);

        // Delete all
        const { data, error } = await supabaseClient
            .from('members')
            .delete()
            .eq('tree_slug', TREE_SLUG);

        if (error) throw error;

        console.log(`✅ Successfully deleted all members!`);
        console.log(`🔢 Total deleted: ${beforeCount}`);

        // Reload page
        setTimeout(() => {
            console.log('🔄 Reloading page...');
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error('❌ Error deleting members:', error);
        alert('Error: ' + error.message);
    }
}

// Run the function
deleteAllMembers();
