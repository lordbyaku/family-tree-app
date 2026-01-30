# PANDUAN LENGKAP: HAPUS & IMPORT DATA KELUARGA

## 📋 RINGKASAN

Panduan ini akan membantu Anda:
1. Menghapus semua data yang salah/rusak
2. Import data dummy keluarga 5 generasi (50 anggota)

---

## ⚠️ PENTING - BACA DULU!

- **BACKUP DULU** jika ada data penting!
- Proses ini **TIDAK BISA DI-UNDO**
- Pastikan Anda sudah **LOGIN sebagai ADMIN**
- Pastikan koneksi internet **STABIL**

---

## 🗑️ LANGKAH 1: HAPUS SEMUA DATA RUSAK

### **OPSI A: Via Supabase Dashboard (REKOMENDASI)** ⭐

1. **Buka Supabase:**
   ```
   https://supabase.com
   ```

2. **Login** dengan akun Supabase Anda

3. **Pilih Project:** family-tree-app

4. **Buka SQL Editor:**
   - Klik **"SQL Editor"** di sidebar kiri
   - Klik **"+ New query"**

5. **Copy-paste query ini:**
   ```sql
   -- CEK DULU BERAPA DATA YANG ADA
   SELECT COUNT(*) as total, tree_slug 
   FROM members 
   GROUP BY tree_slug;

   -- HAPUS SEMUA DATA DI TREE "default"
   DELETE FROM members 
   WHERE tree_slug = 'default' OR tree_slug IS NULL;

   -- VERIFIKASI (harusnya 0)
   SELECT COUNT(*) as sisa 
   FROM members 
   WHERE tree_slug = 'default' OR tree_slug IS NULL;
   ```

6. **Klik "RUN"** atau tekan `Ctrl+Enter`

7. **Cek hasil:**
   - Kolom `sisa` harusnya menunjukkan **0**

✅ **SELESAI!** Data sudah bersih.

---

### **OPSI B: Via Browser Console**

Jika tidak bisa akses Supabase Dashboard:

1. **Login ke aplikasi:**
   ```
   https://family-tree-app-pi.vercel.app/
   Email: admin@family.com
   Password: admin123
   ```

2. **Buka Developer Console:**
   - Tekan `F12` atau
   - Klik kanan → Inspect → Tab "Console"

3. **Edit file `delete_all_script.js`:**
   - Ganti `YOUR_SUPABASE_URL` dengan URL Supabase Anda
   - Ganti `YOUR_SUPABASE_ANON_KEY` dengan Anon Key Anda
   - (Lihat di Supabase Dashboard → Settings → API)

4. **Copy-paste seluruh isi file `delete_all_script.js`** ke console

5. **Tekan Enter**

6. **Konfirmasi** saat muncul popup warning

7. **Tunggu** hingga selesai (auto-reload)

---

## 📥 LANGKAH 2: IMPORT DATA KELUARGA BARU

Ada **2 cara**, pilih yang paling mudah:

### **CARA 1: Manual via Supabase Dashboard (TERCEPAT)** ⭐

1. **Buka file:**
   ```
   dummy_family_5_generations.json
   ```

2. **Copy semua isinya** (Ctrl+A, Ctrl+C)

3. **Buka Supabase Dashboard** → **Table Editor**

4. **Klik table `members`**

5. **Klik "Insert"** → **"Insert row"**

6. Atau gunakan **SQL Editor:**
   ```sql
   -- Template insert (contoh untuk 1 anggota)
   INSERT INTO members (
       id, name, gender, birth_date, death_date, is_deceased,
       place_of_birth, occupation, education, address, 
       phone, email, biography, children, parents, spouses, tree_slug
   ) VALUES (
       'gen1-male-001',
       'Raden Soekamto',
       'male',
       '1930-03-15',
       '1995-08-12',
       true,
       'Yogyakarta',
       'Guru',
       'SMA',
       'Jl. Malioboro No. 45, Yogyakarta',
       '',
       '',
       'Pendiri keluarga',
       ARRAY['gen2-male-001', 'gen2-female-001', 'gen2-male-002', 'gen2-female-002'],
       ARRAY[]::jsonb[],
       ARRAY['{"id": "gen1-female-001", "status": "married"}'::jsonb],
       'default'
   );
   ```

**CATATAN:** Cara ini ribet untuk 50 data. Lebih baik pakai Cara 2.

---

### **CARA 2: Via Script Python (OTOMATIS)** ⭐⭐⭐

Saya akan buatkan script Python yang auto-import!

#### **Prasyarat:**
- Python 3.7+ sudah terinstall
- Pip sudah terinstall

#### **Langkah:**

1. **Install library Supabase:**
   ```bash
   pip install supabase
   ```

2. **Edit file `.env` atau buat file `config.py`:**
   ```python
   SUPABASE_URL = "https://your-project.supabase.co"
   SUPABASE_KEY = "your-anon-key"
   ```

3. **Jalankan script import:**
   ```bash
   python import_to_supabase.py
   ```

---

### **CARA 3: Via Aplikasi (Import JSON)**

Jika fitur import di aplikasi sudah fix:

1. **Login ke aplikasi** sebagai admin

2. **Klik icon "Import"** (atau tombol Upload di header)

3. **Pilih file:**
   ```
   dummy_family_5_generations.json
   ```

4. **Klik "Import"**

5. **Tunggu** proses selesai

**⚠️ CATATAN:** Cara ini mungkin masih error karena struktur data. Lebih aman pakai Cara 1 atau 2.

---

## 🔍 VERIFIKASI HASIL IMPORT

Setelah import selesai:

1. **Refresh halaman** aplikasi

2. **Cek di pohon keluarga:**
   - Harusnya muncul 50 anggota
   - 5 generasi (dari Raden Soekamto sampai cucu-cicit)

3. **Cek relasi:**
   - Klik salah satu anggota
   - Pastikan orang tua, anak, pasangan sudah terhubung

4. **Via Supabase SQL:**
   ```sql
   -- Cek total anggota
   SELECT COUNT(*) FROM members WHERE tree_slug = 'default';
   -- Harusnya: 50

   -- Cek distribusi gender
   SELECT gender, COUNT(*) FROM members GROUP BY gender;
   -- Harusnya: Male ~25, Female ~25

   -- Cek generasi tertua
   SELECT name, birth_date FROM members 
   WHERE is_deceased = true 
   ORDER BY birth_date ASC LIMIT 5;
   ```

---

## 🆘 TROUBLESHOOTING

### **Problem: "Error 23505: duplicate key value"**

**Solusi:**
- Ada data duplikat dengan ID yang sama
- Hapus dulu semua data (ulangi Langkah 1)
- Coba import lagi

---

### **Problem: "Error: relationship already exists"**

**Solusi:**
- Mungkin relasi parent/child bentrok
- Cek manual di database:
  ```sql
  SELECT id, name, parents, children 
  FROM members 
  WHERE array_length(parents, 1) > 2;
  ```

---

### **Problem: Import via JSON di aplikasi ga berhasil**

**Penyebab:**
- Field mapping tidak sesuai
- Format date salah
- Struktur parents/children/spouses tidak sesuai

**Solusi:**
- Gunakan Cara 1 (SQL Direct) atau Cara 2 (Python Script)
- Atau tunggu saya fix fitur import di aplikasi

---

## 📊 STRUKTUR DATA KELUARGA

Total: **50 Anggota**

### **Generasi 1** (2 orang)
- Raden Soekamto (1930-1995) + Siti Aminah (1935-2005)

### **Generasi 2** (8 orang)
- 4 Anak + 4 Pasangan
- Tersebar di Jakarta, Semarang, Bandung, Surabaya

### **Generasi 3** (18 orang)
- 9 Cucu + 9 Pasangan
- Profesi: Programmer, Dokter, Psikolog, Pilot, dll

### **Generasi 4** (17 orang)
- Cicit (pelajar & mahasiswa)

### **Generasi 5** (5 orang)
- Canggah (bayi & balita: 2023-2024)

---

## 📝 NEXT STEPS

Setelah import berhasil:

1. ✅ **Tambah foto** untuk setiap anggota
2. ✅ **Lengkapi biografi** yang masih kurang
3. ✅ **Export PDF** untuk dokumentasi
4. ✅ **Backup rutin** agar data aman

---

## 💬 NEED HELP?

**WhatsApp:** 08562717803

Sertakan:
- Screenshot error (jika ada)
- Langkah yang sudah dicoba
- Browser & device yang digunakan

---

**Good Luck!** 🚀
