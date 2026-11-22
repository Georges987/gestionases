@echo off
chcp 65001 > nul
title Gestion ONG - Deploy OVH (curl)

echo.
echo ========================================
echo   Gestion ONG - Deploy OVH (curl)
echo ========================================

REM Configuration (a remplir si pas de .env)
set FTP_HOST=ftp.cluster130.hosting.ovh.net
set FTP_USER=ongasec
set FTP_PASS=OngAsesOrg2020
set FTP_PATH=/www

REM Chemins locaux
set PROJECT_DIR=D:\Mes projets Open Codes\Gestion ONG
set DIST_DIR=%PROJECT_DIR%\dist
set API_DIR=%PROJECT_DIR%\api

echo.
echo === BUILD ===
cd /d "%PROJECT_DIR%"
set VITE_API_BASE=/admin/api
call npm run build

if %errorlevel% neq 0 (
    echo [ERREUR] Le build a echoue !
    pause
    exit /b 1
)
echo [OK] Build reussi !

echo.
echo === UPLOAD FTP (curl) ===
echo Serveur: %FTP_HOST%
echo Utilisateur: %FTP_USER%
echo Chemin: %FTP_PATH%

REM Upload index.html
echo Uploading index.html...
curl.exe -s -T "%DIST_DIR%\index.html" ftp://%FTP_USER%:%FTP_PASS%@%FTP_HOST%/%FTP_PATH%/index.html
if %errorlevel% neq 0 (echo [ERREUR] Upload index.html echoue) else (echo [OK] index.html uploadE)

REM Creer dossier api/ via curl (MKDIR)
echo Creation dossier api/...
curl.exe -s --ftp-create-dirs -T /dev/null ftp://%FTP_USER%:%FTP_PASS%@%FTP_HOST%/%FTP_PATH%/api/.dummy
echo [OK] dossier api/ cree

REM Upload fichiers API
echo Uploading api/config.php...
curl.exe -s -T "%API_DIR%\config.php" ftp://%FTP_USER%:%FTP_PASS%@%FTP_HOST%/%FTP_PATH%/api/config.php
if %errorlevel% neq 0 (echo [ERREUR]) else (echo [OK])

echo Uploading api/auth.php...
curl.exe -s -T "%API_DIR%\auth.php" ftp://%FTP_USER%:%FTP_PASS%@%FTP_HOST%/%FTP_PATH%/api/auth.php
if %errorlevel% neq 0 (echo [ERREUR]) else (echo [OK]))

echo Uploading api/stocks.php...
curl.exe -s -T "%API_DIR%\stocks.php" ftp://%FTP_USER%:%FTP_PASS%@%FTP_HOST%/%FTP_PATH%/api/stocks.php
if %errorlevel% neq 0 (echo [ERREUR]) else (echo [OK]))

REM Upload .htaccess (racine)
echo Uploading .htaccess...
curl.exe -s -T "%PROJECT_DIR%\deploy\.htaccess" ftp://%FTP_USER%:%FTP_PASS%@%FTP_HOST%/%FTP_PATH%/.htaccess
if %errorlevel% neq 0 (echo [ERREUR]) else (echo [OK])

echo.
echo ========================================
echo   DEPLOIEMENT REUSSI !
echo ========================================
echo.
echo Application deployee sur: https://www.ongases.org
echo Login: admin@gestion-ong.org / admin123
echo.
pause
