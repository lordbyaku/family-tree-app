import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlugs() {
    console.log("Checking tree_slugs in database...");
    const { data, error } = await supabase
        .from('members')
        .select('tree_slug');

    if (error) {
        console.error("Error fetching slugs:", error);
        return;
    }

    const slugs = [...new Set(data.map(m => m.tree_slug))];
    console.log("Found unique slugs:", slugs);

    for (const slug of slugs) {
        const { count, error: countError } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('tree_slug', slug);

        console.log(`Slug: ${slug} -> Count: ${count}`);
    }
}

checkSlugs();
