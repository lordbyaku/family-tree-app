"""
AUTO-IMPORT DATA KELUARGA KE SUPABASE
Versi: 1.0
Author: AI Assistant

Prasyarat:
1. pip install supabase python-dotenv
2. Buat file .env dengan:
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_anon_key
"""

import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Konfigurasi
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://your-project.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'your-anon-key-here')
TREE_SLUG = 'default'
JSON_FILE = 'dummy_family_5_generations.json'

def main():
    print("=" * 60)
    print("AUTO-IMPORT DATA KELUARGA KE SUPABASE")
    print("=" * 60)
    print()
    
    # Validasi konfigurasi
    if 'your-project' in SUPABASE_URL or 'your-anon-key' in SUPABASE_KEY:
        print("❌ ERROR: Please configure SUPABASE_URL and SUPABASE_KEY!")
        print()
        print("Edit file .env atau script ini:")
        print(f"  SUPABASE_URL = '{SUPABASE_URL}'")
        print(f"  SUPABASE_KEY = '{SUPABASE_KEY}'")
        return
    
    # Connect to Supabase
    print(f"📡 Connecting to Supabase...")
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Connected!\n")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return
    
    # Load JSON data
    print(f"📂 Loading {JSON_FILE}...")
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            family_data = json.load(f)
        print(f"✅ Loaded {len(family_data)} members\n")
    except FileNotFoundError:
        print(f"❌ File not found: {JSON_FILE}")
        return
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return
    
    # Konfirmasi sebelum import
    print("⚠️  WARNING:")
    print(f"   This will import {len(family_data)} members to tree '{TREE_SLUG}'")
    print(f"   Make sure the database is clean!")
    print()
    confirm = input("Continue? (yes/no): ").strip().lower()
    
    if confirm not in ['yes', 'y']:
        print("❌ Import cancelled by user")
        return
    
    print()
    print("🚀 Starting import...")
    print("-" * 60)
    
    # Transform data untuk database
    db_data = []
    for member in family_data:
        db_member = {
            'id': member.get('id'),
            'name': member.get('name', ''),
            'gender': member.get('gender', 'male'),
            'birth_date': member.get('birthDate'),
            'death_date': member.get('deathDate'),
            'is_deceased': member.get('isDeceased', False),
            'place_of_birth': member.get('placeOfBirth'),
            'occupation': member.get('occupation'),
            'education': member.get('education'),
            'address': member.get('address'),
            'phone': member.get('phone'),
            'email': member.get('email'),
            'biography': member.get('biography'),
            'photo': member.get('photo'),
            'children': member.get('children', []),
            'parents': member.get('parents', []),
            'spouses': member.get('spouses', []),
            'tree_slug': TREE_SLUG
        }
        db_data.append(db_member)
    
    # Import in batches
    BATCH_SIZE = 10
    total = len(db_data)
    success_count = 0
    error_count = 0
    errors = []
    
    for i in range(0, total, BATCH_SIZE):
        batch = db_data[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
        
        try:
            response = supabase.table('members').upsert(batch).execute()
            success_count += len(batch)
            print(f"✅ Batch {batch_num}/{total_batches}: {len(batch)} members imported")
        except Exception as e:
            error_count += len(batch)
            error_msg = f"Batch {batch_num}: {str(e)[:100]}"
            errors.append(error_msg)
            print(f"❌ {error_msg}")
    
    print("-" * 60)
    print()
    print("📊 IMPORT SUMMARY:")
    print(f"   Total members:     {total}")
    print(f"   ✅ Success:        {success_count}")
    print(f"   ❌ Failed:         {error_count}")
    print()
    
    if errors:
        print("🔍 Errors:")
        for err in errors:
            print(f"   - {err}")
        print()
    
    if success_count == total:
        print("🎉 ALL DATA IMPORTED SUCCESSFULLY!")
    elif success_count > 0:
        print("⚠️  PARTIAL IMPORT - Some data failed")
    else:
        print("❌ IMPORT FAILED - No data was imported")
    
    print()
    print("=" * 60)

if __name__ == '__main__':
    main()
