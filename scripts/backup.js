import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runBackup() {
    console.log("Starting backup process...");

    const { data: members, error } = await supabase
        .from('members')
        .select('*');

    if (error) {
        console.error("Error fetching members:", error);
        process.exit(1);
    }

    // Group by slug
    const families = {};
    members.forEach(m => {
        const slug = m.tree_slug || 'legacy';
        if (!families[slug]) families[slug] = [];
        families[slug].push(m);
    });

    // Create backup directory
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const dateDir = path.join(backupDir, timestamp);
    if (!fs.existsSync(dateDir)) {
        fs.mkdirSync(dateDir);
    }

    // Save each family
    for (const [slug, data] of Object.entries(families)) {
        const filePath = path.join(dateDir, `${slug}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Saved backup for: ${slug}`);
    }

    console.log("Backup completed successfully.");
}

runBackup();
