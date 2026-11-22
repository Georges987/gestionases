<#
.SYNOPSIS
    Script de déploiement ultra-robuste pour OVH
.DESCRIPTION
    Déploiement pas-à-pas pour éviter l'erreur 553 (Nom de fichier non autorisé)
#>

$ErrorActionPreference = "Continue"

# =============================================================================
# CONFIGURATION
# =============================================================================
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ENV_FILE = Join-Path $SCRIPT_DIR ".env"

function Load-Env {
    if (-not (Test-Path $ENV_FILE)) {
        Write-Host "[ERREUR] Le fichier deploy\.env n'existe pas!" -ForegroundColor Red
        exit 1
    }
    $envVars = @{}
    foreach ($line in Get-Content $ENV_FILE) {
        $trimmedLine = $line.Trim()
        if ($trimmedLine -match '^[^#].*=') {
            $idx = $trimmedLine.IndexOf('=')
            if ($idx -gt 0) {
                $key = $trimmedLine.Substring(0, $idx).Trim()
                $value = $trimmedLine.Substring($idx + 1).Trim()
                $envVars[$key] = $value
            }
        }
    }
    return $envVars
}

$envConfig = Load-Env
$FTP_HOST = $envConfig["FTP_HOST"]
$FTP_USER = $envConfig["FTP_USER"]
$FTP_PASS = $envConfig["FTP_PASS"]
$REMOTE_ROOT = "/www/admin"

$LOCAL_PROJECT = "D:\Mes projets Open Codes\Gestion ONG"
$LOCAL_DIST = "$LOCAL_PROJECT\dist"
$LOCAL_API = "$LOCAL_PROJECT\api"
# =============================================================================

function Run-Build {
    Write-Host "`n=== BUILD ===" -ForegroundColor Cyan
    $env:VITE_API_BASE = "/admin/api"
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run build" -WorkingDirectory $LOCAL_PROJECT -NoNewWindow -Wait -PassThru
    if ($process.ExitCode -ne 0) { Write-Host "[ERREUR] Build échoué" -ForegroundColor Red; exit 1 }
    Write-Host "[OK] Build réussi!" -ForegroundColor Green
}

function Ftp-Command($method, $path, $credentials) {
    try {
        $uri = New-Object System.Uri("ftp://$FTP_HOST$REMOTE_ROOT/$path")
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Credentials = $credentials
        $request.Method = $method
        $request.UsePassive = $true
        $response = $request.GetResponse()
        if ($response) { $response.Close() }
        return $true
    } catch {
        return $false
    }
}

function Ftp-Upload($path, $localPath, $credentials) {
    if (-not (Test-Path $localPath)) {
        Write-Host "  [SKIP] $localPath introuvable" -ForegroundColor Yellow
        return $false
    }
    try {
        $uri = New-Object System.Uri("ftp://$FTP_HOST$REMOTE_ROOT/$path")
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Credentials = $credentials
        $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $request.UseBinary = $true
        $request.UsePassive = $true
        
        $bytes = [System.IO.File]::ReadAllBytes($localPath)
        $stream = $request.GetRequestStream()
        $stream.Write($bytes, 0, $bytes.Length)
        $stream.Close()
        Write-Host "[OK] Uploadé: $path" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "[ERREUR] Upload $path : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# =============================================================================
# EXECUTION
# =============================================================================
Write-Host "`nDeploy - Gestion ONG (OVH Robust)" -ForegroundColor Green
Write-Host "====================================`n"

Run-Build

$credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)

Write-Host "=== UPLOAD FTP ===" -ForegroundColor Cyan

# 1. Upload index.html à la racine
Ftp-Upload "index.html" "$LOCAL_DIST\index.html" $credentials

# 2. Upload assets/ (JS/CSS hashés par Vite)
Write-Host "Upload des assets..." -ForegroundColor Gray
# Créer le dossier assets/ (si déjà existant, ignore l'erreur)
Ftp-Command "MakeDirectory" "assets" $credentials | Out-Null
# Uploader tous les fichiers du dossier dist/assets/
$assetsDir = Join-Path $LOCAL_DIST "assets"
if (Test-Path $assetsDir) {
    Get-ChildItem -Path $assetsDir -File | ForEach-Object {
        Ftp-Upload "assets/$($_.Name)" $_.FullName $credentials
    }
}

# 3. Créer dossier api/
Write-Host "Création du dossier api/..." -ForegroundColor Gray
if (Ftp-Command "MakeDirectory" "api" $credentials) {
    Write-Host "[OK] Dossier api/ prêt" -ForegroundColor Green
} else {
    Write-Host "  Dossier api/ existe déjà ou erreur" -ForegroundColor Gray
}

# 4. Upload tous les fichiers PHP de l'API
Get-ChildItem -Path $LOCAL_API -Filter "*.php" | ForEach-Object {
    Ftp-Upload "api/$($_.Name)" $_.FullName $credentials
}

# 5. Upload .htaccess racine (SPA routing)
$htaccessRoot = Join-Path $LOCAL_PROJECT ".htaccess"
if (Test-Path $htaccessRoot) {
    Ftp-Upload ".htaccess" $htaccessRoot $credentials
}

# 6. Créer dossier api/data/
Write-Host "Création du dossier api/data/..." -ForegroundColor Gray
if (Ftp-Command "MakeDirectory" "api/data" $credentials) {
    Write-Host "[OK] Dossier api/data/ prêt" -ForegroundColor Green
} else {
    Write-Host "  Dossier api/data/ existe déjà" -ForegroundColor Gray
}

# 7. Upload .htaccess de protection
Ftp-Upload "api/data/.htaccess" "$LOCAL_API\data\.htaccess" $credentials

Write-Host "`n=== TERMINÉ ===" -ForegroundColor Green
Write-Host "Vérifiez sur https://admin.ongases.org" -ForegroundColor Cyan
