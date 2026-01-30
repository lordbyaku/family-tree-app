# ✅ IMPORT EXCEL - FIXED & READY!

## 🎯 FIELD YANG DIDUKUNG

Sesuai dengan form profil di aplikasi, hanya ada **11 kolom**:

| No | Kolom | Wajib | Format | Keterangan |
|----|-------|-------|--------|------------|
| 1 | **Nama** | ✅ | Text | Nama lengkap |
| 2 | **Jenis Kelamin** | ✅ | Laki-laki / Perempuan | Case-sensitive! |
| 3 | **Tanggal Lahir** | ✅ | DD/MM/YYYY | Format Indonesia |
| 4 | **Tanggal Wafat** | ⬜ | DD/MM/YYYY | Kosong jika masih hidup |
| 5 | **Status** | ✅ | Masih Hidup / Meninggal | Case-sensitive! |
| 6 | **Telepon** | ⬜ | Text/Number | Nomor HP |
| 7 | **Pekerjaan** | ⬜ | Text | Profesi |
| 8 | **Domisili** | ⬜ | Text | Alamat lengkap |
| 9 | **Orang Tua** | ⬜ | Nama, Nama | Pisahkan dengan koma |
| 10 | **Pasangan** | ⬜ | Nama | Satu pasangan saja |
| 11 | **Biografi** | ⬜ | Text | Cerita singkat |

**Catatan:** Kolom Tempat Lahir, Email, dan Pendidikan **TIDAK ADA** di database!

---

## 📥 CARA IMPORT

### **LANGKAH 1: Download Template**

1. Login ke aplikasi sebagai **Admin**
2. Klik tombol **download template** (icon FileDown warna amber/orange)
3. File `template-import-keluarga.xlsx` akan terdownload
4. File punya 3 sheet:
   - **Data Keluarga**: Isi data di sini
   - **Instruksi**: Penjelasan tiap kolom
   - **Tips Penting**: 10 tips penting

### **LANGKAH 2: Isi Data**

1. Buka file Excel
2. **HAPUS baris contoh** (Budi Santoso)
3. Mulai isi dari baris ke-2
4. **Format PENTING:**
   - Jenis Kelamin: **"Laki-laki"** atau **"Perempuan"** (huruf besar di awal!)
   - Status: **"Masih Hidup"** atau **"Meninggal"**
   - Tanggal: **DD/MM/YYYY** (contoh: 15/08/1945)
   - Orang Tua: **"Nama Ayah, Nama Ibu"** (pisah koma, nama HARUS SAMA PERSIS)
   - Pasangan: **"Nama Pasangan"** (nama HARUS SAMA PERSIS)

### **LANGKAH 3: Import**

1. **Save file** Excel Anda
2. Di aplikasi, klik **Import Excel** (icon FileSpreadsheet hijau)
3. **Pilih file** Excel
4. **Tunggu** proses selesai
5. **Refresh** halaman
6. **Cek pohon keluarga**

---

## 📊 FILE CONTOH SIAP  PAKAI

### **File:** `data_keluarga_50_anggota.csv`

✅ **50 anggota (5 generasi)**  
✅ **Format sudah benar**  
✅ **Relasi sudah terhubung**  
✅ **Tinggal convert ke Excel & import!**

**Cara pakai:**
```
1. Buka data_keluarga_50_anggota.csv
2. Save As → Excel Workbook (.xlsx)
3. Import ke aplikasi
4. Cek hasil di pohon keluarga
```

---

## ⚠️ TROUBLESHOOTING

### ❌ Error: "Could not find 'education' column"
**Penyebab:** File Excel masih punya kolom yang tidak didukung  
**Solusi:** Download template baru dari aplikasi (sudah fix!)

### ❌ Error: "Orang Tua tidak terkoneksi"
**Penyebab:** Nama tidak sama persis  
**Solusi:**  
- Cek typo: "Budi Santoso" ≠ "budi santoso" ≠ "Budi  Santoso" (spasi 2x)
- Nama di kolom "Orang Tua" HARUS SAMA dengan kolom "Nama"

### ❌ Error: "Tanggal tidak masuk"
**Penyebab:** Format tanggal salah  
**Solusi:**  
- Gunakan **DD/MM/YYYY**
- Jangan pakai MM/DD/YYYY (format Amerika)

### ❌ Error: "Jenis Kelamin harus Laki-laki atau Perempuan"
**Penyebab:** Typo atau huruf kecil  
**Solusi:**  
- Harus **"Laki-laki"** (dengan huruf L besar dan dash/strip)
- Harus **"Perempuan"** (dengan huruf P besar)
- Jangan: "laki-laki", "LAKI-LAKI", "Pria", "Wanita"

---

## 💡 TIPS SUKSES IMPORT

1. ✅ **Urut dari tertua**: Input kakek-nenek dulu, baru anak, cucu
2. ✅ **Nama konsisten**: Gunakan ejaan yang sama persis setiap kali
3. ✅ **Test kecil dulu**: Import 5-10 orang untuk test
4. ✅ **Backup data**: Export JSON dulu sebelum import besar
5. ✅ **Hapus contoh**: Jangan lupa hapus baris "Contoh: Budi Santoso"
6. ✅ **Cek format**: Jenis Kelamin & Status harus tepat
7. ✅ **Import bertahap**: Untuk 50+ orang, import per 20-30

---

## � FITUR IMPORT

### ✅ **Yang Sudah Bekerja:**
- Konversi format tanggal Excel (serial number & DD/MM/YYYY)
- Mapping nama ke ID untuk relasi
- Auto-update children dari parents
- Support multiple parents (pisah koma)
- Trim whitespace otomatis
- Case-insensitive name matching

### ✅ **Yang SUDAH DIHAPUS** (tidak ada di database):
- ~~Tempat Lahir~~
- ~~Email~~
- ~~Pendidikan~~

---

## 📝 CHANGELOG

**Version 2.1** - 30 Januari 2026 14:15 WIB

**Fixed:**
- ❌ Error "Could not find 'education' column" → ✅ Fixed!
- ❌ Error "Could not find 'email' column" → ✅ Fixed!
- ❌ Error "Could not find 'place_of_birth' column" → ✅ Fixed!

**Removed:**
- Kolom Tempat Lahir dari template & import logic
- Kolom Email dari template & import logic
- Kolom Pendidikan dari template & import logic

**Updated:**
- Template Excel hanya 11 kolom (sesuai database)
- CSV contoh sudah disesuaikan
- Dokumentasi sudah update

---

## 📋 CONTOH DATA YANG BENAR

```csv
Nama,Jenis Kelamin,Tanggal Lahir,Tanggal Wafat,Status,Telepon,Pekerjaan,Domisili,Orang Tua,Pasangan,Biografi
Raden Soekamto,Laki-laki,15/03/1930,12/08/1995,Meninggal,,Guru,"Jl. Malioboro 45",,Siti Aminah,Pendiri keluarga
Siti Aminah,Perempuan,20/07/1935,05/11/2005,Meninggal,,Ibu Rumah Tangga,"Jl. Malioboro 45",,Raden Soekamto,Ibu 4 anak
Budi Santoso,Laki-laki,10/01/1955,,Masih Hidup,081234567890,Dokter,"Jl. Sudirman 123","Raden Soekamto, Siti Aminah",Dewi Lestari,Anak pertama
```

---

## ✅ VERIFIKASI SETELAH IMPORT

Setelah import berhasil, cek:

1. **Total anggota** di pohon keluarga (harusnya sesuai jumlah baris Excel)
2. **Relasi Orang Tua** - klik anggota, cek parents terhubung
3. **Relasi Pasangan** - cek spouse terconnect
4. **Relasi Anak** - klik orang tua, cek children ada semua
5. **Tanggal lahir** - cek apakah tanggal masuk dengan benar

---

**Selamat mencoba!** 🎉  
Import sekarang **100% BEKERJA** dengan field yang benar!

Jika masih ada error, screenshot dan hubungi: **08562717803**
