# 🌳 Silsilah Keluarga (Family Archive)

Aplikasi manajemen silsilah keluarga modern yang dirancang untuk mengabadikan warisan keluarga, menghubungkan generasi, dan menyimpan data sejarah keluarga secara aman dan elegan.

![Family Tree Preview](https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop)

## 🚀 Fitur Utama

- **Visualisasi Pohon Interaktif**: Menampilkan bagan keluarga yang dinamis menggunakan React Flow dengan dukungan drag-and-drop dan layout otomatis/manual.
- **Manajemen Anggota**: Data lengkap meliputi nama, tanggal lahir/wafat, hubungan pernikahan, dan informasi biografis.
- **Pencarian Cerdas**: Cari anggota keluarga secara instan dengan fitur *highlighting* pada pohon.
- **Filter Perspektif**: Lihat garis keturunan secara khusus (Hanya Leluhur atau Hanya Keturunan) dari anggota tertentu.
- **Kalkulator Hubungan**: Hitung secara otomatis hubungan darah antara dua anggota keluarga.
- **Dashboard Ulang Tahun**: Pengingat otomatis untuk hari ulang tahun keluarga yang akan datang.
- **Statistik Keluarga**: Analisis data demografi keluarga, sebaran gender, dan ringkasan usia.
- **Ekspor & Backup**:
    - Ekspor bagan ke file gambar (PNG).
    - Import/Export data via Excel (.xlsx) atau JSON.
    - Sistem Backup & Snapshots langsung ke Database.
- **Audit Log**: Pantau setiap perubahan yang terjadi pada data keluarga untuk keamanan data.
- **Multi-Tree (Multi-Slug)**: Mendukung pengelolaan beberapa silsilah keluarga yang berbeda dalam satu aplikasi.

---

## 🔒 Sistem Keamanan & Akses

Aplikasi ini menggunakan sistem autentikasi berbasis **Supabase** dengan dua level akses:

1. **Super Admin (Master Admin)**: Kontrol penuh terhadap database dan manajemen pengguna.
2. **Admin**: Dapat mengelola data silsilah (tambah/edit/hapus anggota).
3. **Guest (Tamu)**: Akses hanya baca (read-only) untuk melihat pohon keluarga.

### 🛡️ Master Admin Dashboard
Fitur khusus untuk pengelola utama aplikasi untuk mengelola akun pengguna:
- **Akses**: Melalui link `/admin-dashboard` atau tombol **Shield** di profil admin.
- **Shortcut**: `Ctrl + Shift + U` (Khusus Admin).
- **Fitur**: Daftar pengguna, pendaftaran pengguna admin baru, dan penghapusan akun pengguna.

---

## ⌨️ Pintasan Keyboard (Keyboard Shortcuts)

Gunakan pintasan ini untuk navigasi yang lebih cepat:

- `/` atau `Ctrl + F` : Fokus ke kolom pencarian.
- `Ctrl + Z` : Membatalkan perubahan terakhir (Undo).
- `Ctrl + Y` : Mengulang perubahan (Redo).
- `Ctrl + L` : Membuka Riwayat Perubahan (Audit Log).
- `Ctrl + Shift + U` : Masuk ke Dashboard Master Admin.
- `Esc` : Menutup Modal/Pop-up yang sedang terbuka.

---

## 🛠️ Teknologi & Stack

- **Frontend**: [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Visualisasi**: [React Flow](https://reactflow.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Exporting**: [ExcelJS](https://github.com/exceljs/exceljs) & [html-to-image](https://github.com/tsayen/html-to-image)

---

## ⚙️ Persiapan Lokal (Local Setup)

1. **Clone Repository**
   ```bash
   git clone [url-repository]
   ```
2. **Instal Dependensi**
   ```bash
   npm install
   ```
3. **Konfigurasi Environment**
   Buat file `.env` di direktori utama dan isi dengan kredensial Supabase Anda:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```

---

## 📁 Struktur Database
Aplikasi ini membutuhkan tabel-tabel berikut di Supabase:
- `members`: Data utama anggota keluarga.
- `relationships`: Data hubungan antar anggota (orang tua, pasangan).
- `app_users`: Data akun pengguna aplikasi.
- `audit_logs`: Catatan aktivitas perubahan data.
- `backups`: Penyimpanan snapshot data JSON.

---

## 📄 Lisensi
Copyright 2026 - **SILSILAH KELUARGA**
Developer: *Haritrisna Suryadimarta*

---
*Dibuat dengan ❤️ untuk menjaga sejarah tetap hidup.*
