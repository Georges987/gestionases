@echo off
chcp 65001 > nul
title Gestion ONG - Environnement de développement

echo.
echo ========================================
echo   Gestion ONG - Serveur de développement
echo ========================================
echo.

REM Verifier XAMPP
if not exist "C:\xampp\apache\bin\httpd.exe" (
    echo [ERREUR] XAMPP non trouve en C:\xampp
    echo Installez XAMPP ou modifiez le chemin dans ce script.
    pause
    exit /b 1
)

REM Lancer Apache
echo [1/3] Lancement d'Apache...
cd /d "C:\xampp"
start "XAMPP Apache" /min apache_start.bat
timeout /t 3 /nobreak > nul

REM Verifier Apache
curl.exe -s -o nul -w "%%{http_code}" http://localhost > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Apache est operationnel sur http://localhost
) else (
    echo [ATTENTION] Apache n'a pas pu demarrer. Verifiez qu'aucun service n'utilise le port 80.
)

REM Lancer MySQL
echo [2/3] Lancement de MySQL...
start "XAMPP MySQL" /min mysql_start.bat
timeout /t 2 /nobreak > nul

REM Verifier MySQL
C:\xampp\mysql\bin\mysql.exe -u root -e "SELECT 1;" > nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MySQL est operationnel
) else (
    echo [ATTENTION] MySQL n'a pas pu demarrer.
)

REM Lancer Vite
echo [3/3] Lancement du serveur Vite...
cd /d "D:\Mes projets Open Codes\Gestion ONG"
start "Vite Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   Serveurs lances avec succes !
echo ========================================
echo.
echo   Dev Server : http://localhost:5173
echo   XAMPP      : http://localhost
echo   phpMyAdmin : http://localhost/phpmyadmin
echo.
echo   Login : admin@gestion-ong.org / admin123
echo.
echo   Appuyez sur une touche pour arreter tous les serveurs...
echo.
pause > nul

REM Arrêt des serveurs
echo.
echo Arret des serveurs en cours...

taskkill /FI "WINDOWTITLE eq Vite Dev Server*" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq XAMPP Apache*" /T /F > nul 2>&1
taskkill /FI "WINDOWTITLE eq XAMPP MySQL*" /T /F > nul 2>&1

echo Tous les serveurs ont ete arretes.
echo.
pause
