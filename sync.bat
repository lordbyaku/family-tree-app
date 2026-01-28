@echo off
echo === Sinkronisasi GitHub ===

echo 1. Menyiapkan perubahan lokal...
git add .

set /p commit_msg="Masukkan pesan commit (tekan Enter untuk default 'update'): "
if "%commit_msg%"=="" set commit_msg=update

echo.
echo 2. Menyimpan perubahan...
git commit -m "%commit_msg%"

echo.
echo 3. Menarik perubahan terbaru dari server...
git pull origin main --rebase

echo.
echo 4. Mengirim ke GitHub...
git push origin main

echo.
echo === Selesai! ===
pause
