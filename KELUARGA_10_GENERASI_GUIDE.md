# 📊 DATA KELUARGA 10 GENERASI - TEST IMPORT

## 📂 FILE: `keluarga_10_generasi.csv`

### 🎯 **Ringkasan Data**

- **Total Anggota:** ~150 orang
- **Rentang Tahun:** 1800 - 2025 (225 tahun!)
- **Jumlah Generasi:** 10 generasi
- **Tema:** Keluarga Adipati dari Keraton Yogyakarta

---

## 👪 **Struktur 10 Generasi**

| Generasi | Tahun Lahir | Jumlah | Status | Deskripsi |
|----------|-------------|--------|--------|-----------|
| **Gen 1** | 1800-1805 | 2 | Meninggal | Pendiri: Raden Adipati Kusuma & Nyai Raden Ayu Sari |
| **Gen 2** | 1825-1838 | 6 | Meninggal | 3 Putra Adipati + Pasangan (Pangeran, Penasihat, Lurah) |
| **Gen 3** | 1850-1870 | 8 | Meninggal | Cucu generasi pejuang & pedagang |
| **Gen 4** | 1875-1900 | 10 | Meninggal | Buyut era kolonial (dalang, guru, empu) |
| **Gen 5** | 1902-1930 | 12 | Meninggal | Canggah era kemerdekaan |
| **Gen 6** | 1935-1962 | 14 | Sebagian Meninggal | Wareng era orde baru (profesor, dalang nasional) |
| **Gen 7** | 1955-1982 | 16 | Masih Hidup | Udeg-udeg era reformasi (CEO, bupati, dokter) |
| **Gen 8** | 1980-2002 | 18 | Masih Hidup | Canggit milenial (direktur, politisi, dokter muda) |
| **Gen 9** | 2000-2019 | 20 | Masih Hidup | Wareng Gen Z (mahasiswa, pelajar, balita) |
| **Gen 10** | 2018-2024 | 10 | Masih Hidup | Bayi & balita generasi Alpha |

**Total:** ~116 orang (expanded dengan pasangan jadi ~150)

---

## 🎭 **Karakteristik Keluarga**

### **Profesi Turun Temurun:**

1. **Jalur Kerajaan:** Bangsawan → Panglima → Pejabat → Politisi
2. **Jalur Seni:** Dalang turun-temurun (6 generasi dalang!)
3. **Jalur Pendidikan:** Guru → Profesor → Dosen
4. **Jalur Kerajinan:** Empu Keris turun-temurun (5 generasi!)
5. **Jalur Bisnis:** Pedagang Batik → CEO Batik International
6. **Jalur Religi:** Kyai → Pengasuh Pesantren → Rektor Universitas Islam
7. **Jalur Kesehatan:** Bidan → Dokter → Dokter Spesialis

### **Lokasi:**
- **Yogyakarta** (mayoritas)
- **Sleman** (empu keris)
- **Bantul** (kepala desa/lurah turun-temurun)
- **Jakarta** (generasi modern yang hijrah)

### **Timeline Sejarah:**
- **1800-1875:** Era Kerajaan Yogyakarta
- **1875-1945:** Era Kolonial Belanda
- **1945-1965:** Era Kemerdekaan
- **1965-1998:** Era Orde Baru
- **1998-sekarang:** Era Reformasi & Digital

---

## 📋 **Format File**

```csv
Nama,Jenis Kelamin,Tanggal Lahir,Tanggal Wafat,Status,Telepon,Pekerjaan,Domisili,Orang Tua,Pasangan,Biografi
```

**Kolom:**
1. Nama (unik, tidak ada yang sama)
2. Jenis Kelamin (Laki-laki/Perempuan)
3. Tanggal Lahir (DD/MM/YYYY)
4. Tanggal Wafat (DD/MM/YYYY atau kosong)
5. Status (Masih Hidup/Meninggal)
6. Telepon (081234560001-081234560032)
7. Pekerjaan (sesuai era)
8. Domisili (Yogyakarta, Sleman, Bantul, Jakarta)
9. Orang Tua (Nama, Nama - pisah koma)
10. Pasangan (Nama)
11. Biografi (singkat)

---

## 🧪 **Cara Test Import**

### **OPSI 1: Import Langsung CSV**

1. **Buka file** dengan Excel/LibreOffice
2. **Save As** → Excel Workbook (.xlsx)
3. **Di aplikasi**, pilih slug test (misalnya "keluarga-adipati")
4. **Import** file Excel
5. **Cek hasil** di pohon keluarga

### **OPSI 2: Import Bertahap**

Karena data cukup besar (150 orang), bisa import bertahap:

**Batch 1 - Gen 1-5 (Meninggal semua):**
- Copy baris 1-50 ke file baru
- Import → cek
- Lanjut ke batch berikutnya

**Batch 2 - Gen 6-7 (Sebagian hidup):**
- Copy baris 51-100
- Import → cek relasi

**Batch 3 - Gen 8-10 (Masih hidup):**
- Copy baris 101-150
- Import → final check

---

## ✅ **Checklist Setelah Import**

### **1. Cek Jumlah**
```sql
SELECT COUNT(*) FROM members WHERE tree_slug = 'keluarga-adipati';
-- Expected: ~150
```

### **2. Cek Distribusi Generasi**
- Gen 1 (1800-an): 2 orang ✅
- Gen 2 (1820-an): 6 orang ✅
- Gen 3 (1840-an): 8 orang ✅
- ... dst

### **3. Cek Relasi Turun Temurun**

**Test Case: Jalur Dalang**
```
Gen 4: Ki Ageng Suryanto (dalang)
  └─ Gen 5: Dalang Suharjo
       └─ Gen 6: Ki Manteb Soedarsono (dalang nasional)
            └─ Gen 7: Ki Joko Edan (dalang kondang)
                 └─ Gen 8: Joko Susilo (dalang milenial)
                      └─ Gen 9: Bayu Susilo (anak SD)
                           └─ Gen 10: Hendra Susilo (bayi)
```

**Test Case: Jalur Empu Keris**
```
Gen 4: Mas Sarwo Edi (pandai besi)
  └─ Gen 5: Pak Kromo (empu keris)
       └─ Gen 6: Bp Sutrisno (empu keris)
            └─ Gen 7: Bp Sukamto (master empu)
                 └─ Gen 8: Bambang Sukamto (mahasiswa seni)
                      └─ Gen 9: Dimas Sukamto (balita)
```

### **4. Cek Pasangan**
- Semua Gen 1-8 punya pasangan ✅
- Gen 9-10 banyak yang belum menikah (wajar) ✅

### **5. Cek Children Auto-populate**
- Klik "Raden Adipati Kusuma" (Gen 1)
- Harusnya punya 3 children (Gen 2)
- Klik "Pangeran Suryo Kusumo" (Gen 2)
- Harusnya punya 2 children (Gen 3)

---

## 🎨 **Fitur Unik Data Ini**

1. ✅ **10 Generasi Lengkap** (1800-2025)
2. ✅ **Profesi Turun Temurun** (dalang, empu, lurah, dll)
3. ✅ **Timeline Sejarah Indonesia** (kerajaan → kolonial → merdeka → modern)
4. ✅ **Nama Indonesia Autentik** (Raden, Nyi, Kyai, Ki, dll)
5. ✅ **Gelar Tradisional** (Pangeran, Tumenggung, Lurah, dll)
6. ✅ **Biografi Context-aware** (sesuai era dan profesi)
7. ✅ **Nomor Telepon** hanya untuk yang masih hidup (Gen 6-10)
8. ✅ **Lokasi Realistis** (Yogyakarta, Sleman, Bantul, Jakarta)

---

## 📊 **Statistik Data**

```
Total: 150 anggota
- Laki-laki: ~75 (50%)
- Perempuan: ~75 (50%)

Status:
- Meninggal: ~60 (Gen 1-5, sebagian Gen 6)
- Masih Hidup: ~90 (Gen 6-10)

Usia Tertua: Raden Adipati Kusuma (1800-1875, 75 tahun)
Usia Termuda: Hendra Susilo (lahir 2024, 1 tahun)

Rentang Usia: 225 tahun!
```

---

## 🔧 **Troubleshooting**

### Problem: "Import terlalu lama"
**Solusi:**
- Import bertahap (50 orang per batch)
- Jangan import 150 sekaligus di koneksi lambat

### Problem: "Relasi tidak connect"
**Solusi:**
- Cek nama orang tua PERSIS SAMA dengan kolom Nama
- Case-sensitive!
- Contoh: "Raden Adipati Kusuma" ≠ "raden adipati kusuma"

### Problem: "Children tidak muncul"
**Solusi:**
- Tunggu proses Phase 3 selesai
- Refresh halaman
- Re-import jika masih error

---

## 🎯 **Test Case Rekomendasi**

### **Test 1: Import Lengkap**
```
1. Buat slug baru "test-10-gen"
2. Import keluarga_10_generasi.csv
3. Cek total: 150 orang
4. Cek relasi Gen 1 → Gen 10
5. Screenshot pohon keluarga
```

### **Test 2: Import per Generasi**
```
1. Buat slug "test-gen-1-5"
2. Import Gen 1-5 (50 orang)
3. Buat slug "test-gen-6-10"
4. Import Gen 6-10 (100 orang)
5. Bandingkan kedua slug (harusnya tidak tercampur!)
```

### **Test 3: Update Data Existing**
```
1. Import Gen 1-5
2. Edit beberapa member manual
3. Re-import Gen 1-5
4. Cek apakah data manual tetap (atau ke-overwrite)
```

---

## 💡 **Tips Visualisasi**

Dengan 10 generasi, pohon keluarga akan **SANGAT LEBAR**!

**Rekomendasi:**
1. Gunakan view **Horizontal** untuk 10 generasi
2. Zoom out untuk lihat big picture
3. Focus mode untuk trace jalur tertentu (misal jalur dalang)
4. Export PDF landscape A3 untuk dokumentasi

---

**Selamat mencoba!** 🎉

Data ini adalah test case **ULTIMATE** untuk fitur import Anda.

Jika bisa import 150 orang dengan 10 generasi tanpa error, maka fitur import sudah **PRODUCTION READY!** 🚀
