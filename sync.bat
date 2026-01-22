@echo off
echo Mengirim perubahan ke GitHub...
git add .
set /p commit_msg="Masukkan pesan commit (tekan Enter untuk default 'update'): "
if "%commit_msg%"=="" set commit_msg=update
git commit -m "%commit_msg%"
git push origin main
echo Selesai!
pause
