# 🔒 IMPORT EXCEL - ISOLASI PER SLUG (FIXED!)

## ✅ MASALAH YANG SUDAH DIPERBAIKI

### ❌ **Masalah Sebelumnya:**
- Import di slug "default" **menimpa data di slug lain** (misalnya "sukardi")
- Generate ID manual (crypto.randomUUID()) bisa **collision dengan ID existing**
- Upsert dengan ID manual bisa **overwrite data yang tidak dimaksud**

### ✅ **Solusi Sekarang:**
- ✅ **Isolasi per slug**: Import di "default" HANYA affect slug "default"
- ✅ **Auto-generate ID**: Biarkan Supabase yang generate ID (mencegah collision)
- ✅ **Insert → Update**: Insert dulu tanpa relasi, baru update relasi
- ✅ **Filter ketat**: Semua query pakai `.eq('tree_slug', treeSlug)`

---

## 🔐 CARA KERJA BARU

### **3-Phase Import Process:**

#### **Phase 1: Insert Members** (tanpa relasi)
```javascript
// Insert semua member tanpa parents/children/spouses
// Biarkan Supabase auto-generate ID
INSERT INTO members (name, gender, birth_date, ..., tree_slug)
VALUES (...);
```

#### **Phase 2: Update Relationships**
```javascript
// Setelah punya ID, update relasi parents & spouses
// Hanya update member yang baru di-insert
UPDATE members 
SET parents = [...], spouses = [...]
WHERE id IN (inserted_ids);
```

#### **Phase 3: Auto-populate Children**
```javascript
// Scan semua members di slug INI saja
// Update children berdasarkan parents
SELECT * FROM members WHERE tree_slug = 'default';
UPDATE parents SET children = [...];
```

---

## 🎯 JAMINAN ISOLASI

### ✅ **Dijamin TIDAK akan menimpa slug lain karena:**

1. **tree_slug set immediately**
   ```javascript
   tree_slug: treeSlug  // Set saat mapping data
   ```

2. **Filter ketat di setiap query**
   ```javascript
   .eq('tree_slug', treeSlug)  // Hanya slug yang aktif
   ```

3. **Insert (bukan Upsert) di phase 1**
   ```javascript
   .insert(insertData)  // Buat row baru, bukan update existing
   ```

4. **Update hanya member baru**
   ```javascript
   // Hanya update member yang baru di-insert
   WHERE id IN (insertedMembers.map(m => m.id))
   ```

5. **Children update filtered**
   ```javascript
   // Hanya cari children di slug yang sama
   const allMembers = await supabase
       .from('members')
       .select('*')
       .eq('tree_slug', treeSlug);  // <-- Filter!
   ```

---

## 🧪 TEST CASE

### **Skenario 1: Import di slug "default"**
```
SEBELUM:
- Slug "default": 10 members
- Slug "sukardi": 20 members

IMPORT 50 members ke "default"

SETELAH:
- Slug "default": 60 members ✅ (10 + 50)
- Slug "sukardi": 20 members ✅ (TIDAK BERUBAH!)
```

### **Skenario 2: Import di slug "sukardi"**
```
SEBELUM:
- Slug "default": 60 members
- Slug "sukardi": 20 members

IMPORT 30 members ke "sukardi"

SETELAH:
- Slug "default": 60 members ✅ (TIDAK BERUBAH!)
- Slug "sukardi": 50 members ✅ (20 + 30)
```

### **Skenario 3: Import slug baru "keluarga_baru"**
```
SEBELUM:
- Slug "default": 60 members
- Slug "sukardi": 50 members
- Slug "keluarga_baru": 0 members (baru dibuat)

IMPORT 100 members ke "keluarga_baru"

SETELAH:
- Slug "default": 60 members ✅ (TIDAK BERUBAH!)
- Slug "sukardi": 50 members ✅ (TIDAK BERUBAH!)
- Slug "keluarga_baru": 100 members ✅ (0 + 100)
```

---

## 🔍 VERIFIKASI SETELAH IMPORT

Untuk memastikan data tidak tercampur:

### **1. Cek via Aplikasi**
```
1. Switch ke slug "default" → cek jumlah members
2. Switch ke slug "sukardi" → cek jumlah members
3. Pastikan jumlah sesuai ekspektasi
```

### **2. Cek via Supabase Dashboard**
```sql
-- Cek distribusi per slug
SELECT tree_slug, COUNT(*) as total 
FROM members 
GROUP BY tree_slug;

-- Expected result:
-- default   | 60
-- sukardi   | 50
-- keluarga_baru | 100
```

### **3. Cek Relasi Parents/Children**
```sql
-- Pastikan parents & children dalam slug yang sama
SELECT m.id, m.name, m.tree_slug, 
       p.tree_slug as parent_slug
FROM members m
LEFT JOIN jsonb_array_elements(m.parents) pe ON true
LEFT JOIN members p ON p.id = (pe->>'id')::uuid
WHERE m.tree_slug != p.tree_slug;

-- Harusnya KOSONG (0 rows)
```

---

## 🚨 CATATAN PENTING

### ❗ **Setelah Fix Ini:**

1. ✅ **Aman import di slug manapun** tanpa khawatir menimpa slug lain
2. ✅ **ID auto-generated** oleh Supabase (lebih aman)
3. ✅ **Relasi terisolasi** per slug
4. ✅ **Children auto-populate** hanya untuk members di slug yang sama

### ⚠️ **Perhatian:**

- **Jangan import file yang sama 2x** di slug yang sama (akan duplicate data)
- **Backup dulu** sebelum import banyak data
- **Test dengan data kecil** (5-10 orang) sebelum import 50+ orang

---

## 📋 CHANGELOG

**Version 2.2** - 30 Januari 2026 14:30 WIB

**Fixed:**
- ❌ Import menimpa data di slug lain → ✅ FIXED!
- ❌ ID collision dari manual generation → ✅ FIXED!
- ❌ Upsert overwrite data existing → ✅ FIXED!

**Changed:**
- Import logic dari **Upsert** → **Insert + Update**
- ID generation dari **manual (crypto.randomUUID)** → **auto (Supabase)**
- Update children dari **push array** → **rebuild array** (lebih akurat)

**Added:**
- Filter ketat `.eq('tree_slug', treeSlug)` di semua query
- Processed parents tracking (mencegah duplicate children)
- 3-phase import process (Insert → Update Relations → Update Children)

---

## ✅ READY TO USE!

Import sekarang:
- ✅ **100% isolated** per slug
- ✅ **Aman** dari collision
- ✅ **Tidak menimpa** data slug lain
- ✅ **Relasi tetap bekerja** dengan benar

**Silakan test lagi dan pastikan data tidak tercampur!** 🎉
