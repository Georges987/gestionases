@echo off
chcp 65001 > nul
title Gestion ONG - Build + Deploy vers XAMPP

echo.
echo ========================================
echo   Gestion ONG - Build + Deploy XAMPP
echo ========================================
echo.

cd /d "D:\Mes projets Open Codes\Gestion ONG"

REM Build
echo [1/2] Build du projet...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERREUR] Le build a echoue !
    pause
    exit /b 1
)
echo [OK] Build reussi.

REM Deploy vers XAMPP
echo.
echo [2/2] Copie vers XAMPP...
xcopy /Y "dist\index.html" "C:\xampp\htdocs\index.html" > nul
xcopy /Y "api\auth.php" "C:\xampp\htdocs\api\auth.php" > nul
xcopy /Y "api\config.php" "C:\xampp\htdocs\api\config.php" > nul
echo [OK] Fichiers copies vers C:\xampp\htdocs\

echo.
echo ========================================
echo   Deploiement XAMPP termine !
echo ========================================
echo.
echo   Accedez a l'app sur : http://localhost
echo   Login : admin@gestion-ong.org / admin123
echo.
pause
