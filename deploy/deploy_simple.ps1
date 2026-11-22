<#
.SYNOPSIS
    Script de déploiement FTP simplifié pour Gestion ONG (SQLite)
.DESCRIPTION
    Build le projet React et upload les fichiers sur un serveur OVH via FTP
.NOTES
    Remplissez les variables ci-dessous avec vos identifiants OVH
#>

$ErrorActionPreference = "Stop"

# =============================================================================
# CONFIGURATION - REMPLACER ICI
# =============================================================================
$FTP_HOST = "ftp.cluster130.hosting.ovh.net"      # Serveur FTP OVH
$FTP_USER = "ongasec"                          # Utilisateur FTP
$FTP_PASS = "OngAsesOrg2020"                    # Mot de passe FTP
$FTP_REMOTE_PATH = "/www"            # Chemin distant (generalement /www ou /public_html)
$LOCAL_PROJECT = "D:\Mes projets Open Codes\Gestion ONG"
$LOCAL_API = "$LOCAL_PROJECT\api"
$LOCAL_DIST = "$LOCAL_PROJECT\dist"
# =============================================================================
$FTP_HOST = "ftp.cluster130.hosting.ovh.net"      # Serveur FTP OVH
$FTP_USER = "ongasec"                          # Utilisateur FTP
$FTP_PASS = "OngAsesOrg2020"                    # Mot de passe FTP
$FTP_REMOTE_PATH = "/home/ongasec"            # Chemin distant (généralement /www ou /home/user)
$LOCAL_PROJECT = "D:\Mes projets Open Codes\Gestion ONG"
$LOCAL_API = "$LOCAL_PROJECT\api"
$LOCAL_DIST = "$LOCAL_PROJECT\dist"
# =============================================================================

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = if ($LOCAL_PROJECT) { $LOCAL_PROJECT } else { Split-Path -Parent $SCRIPT_DIR }
$DIST_DIR = Join-Path $PROJECT_DIR "dist"
$API_DIR = Join-Path $PROJECT_DIR "api"

function Show-Header {
    Write-Host ""
    Write-Host "Deploy - Gestion ONG (SQLite)" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
}

function Run-Build {
    Write-Host "=== BUILD ===" -ForegroundColor Cyan
    Write-Host "Building the project..." -ForegroundColor Gray
    
    $env:VITE_API_BASE = "/admin/api"
    
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run build" -WorkingDirectory $PROJECT_DIR -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -ne 0) {
        Write-Host "[ERREUR] Le build a échoué!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[OK] Build réussi!" -ForegroundColor Green
    
    $htmlFile = Join-Path $DIST_DIR "index.html"
    if (Test-Path $htmlFile) {
        $size = (Get-Item $htmlFile).Length
        Write-Host "  Taille: $([math]::Round($size/1024, 1)) KB" -ForegroundColor Gray
    }
}

function Upload-File($ftpUri, $fileName, $sourcePath, $credentials) {
    if (-not (Test-Path $sourcePath)) {
        Write-Host "  [SKIP] $fileName (fichier introuvable)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Uploading $fileName..." -ForegroundColor Yellow
    
    try {
        $request = [System.Net.FtpWebRequest]::Create("$ftpUri/$fileName")
        $request.Credentials = $credentials
        $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $request.UseBinary = $true
        $request.UsePassive = $true
        
        $fileBytes = [System.IO.File]::ReadAllBytes($sourcePath)
        $requestStream = $request.GetRequestStream()
        $requestStream.Write($fileBytes, 0, $fileBytes.Length)
        $requestStream.Close()
        
        $size = [math]::Round($fileBytes.Length / 1024, 1)
        Write-Host "[OK] $fileName uploadé ($size KB)" -ForegroundColor Green
    } catch {
        Write-Host "[ERREUR] Échec upload $fileName : $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Create-RemoteFolder($ftpUri, $folderName, $credentials) {
    try {
        $request = [System.Net.FtpWebRequest]::Create("$ftpUri/$folderName/")
        $request.Credentials = $credentials
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $request.UsePassive = $true
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "[OK] Dossier $folderName/ créé" -ForegroundColor Green
    } catch {
        Write-Host "  Dossier $folderName/ existe déjà" -ForegroundColor Gray
    }
}

function Upload-FTP {
    Write-Host ""
    Write-Host "=== UPLOAD FTP ===" -ForegroundColor Cyan
    Write-Host "Serveur: $FTP_HOST" -ForegroundColor Gray
    Write-Host "Utilisateur: $FTP_USER" -ForegroundColor Gray
    Write-Host "Chemin: $FTP_REMOTE_PATH" -ForegroundColor Gray
    
    try {
        $ftpUri = "ftp://$FTP_HOST$FTP_REMOTE_PATH"
        $credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
        
        # Upload index.html
        Upload-File $ftpUri "index.html" (Join-Path $DIST_DIR "index.html") $credentials
        
        # Upload .htaccess
        Upload-File $ftpUri ".htaccess" (Join-Path $SCRIPT_DIR ".htaccess") $credentials
        
        # Créer le dossier api/
        Create-RemoteFolder $ftpUri "api" $credentials
        
        # Upload fichiers API
        $apiFiles = @("config.php", "auth.php", "stocks.php")
        foreach ($file in $apiFiles) {
            Upload-File "$ftpUri/api" "api/$file" (Join-Path $API_DIR $file) $credentials
        }
        
        # Créer le dossier api/data/
        Create-RemoteFolder "$ftpUri/api" "data" $credentials
        
        # Upload .htaccess pour le dossier data
        Upload-File "$ftpUri/api" "api/data/.htaccess" (Join-Path $API_DIR "data/.htaccess") $credentials
        
        Write-Host ""
        Write-Host "=== DÉPLOIEMENT RÉUSSI ===" -ForegroundColor Green
        Write-Host "Application déployée sur https://$FTP_HOST" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Prochaines étapes:" -ForegroundColor Yellow
        Write-Host "1. Vérifiez que le dossier api/data/ est accessible en écriture" -ForegroundColor Gray
        Write-Host "2. Connectez-vous avec admin@gestion-ong.org / admin123" -ForegroundColor Gray
        Write-Host "3. Changez le mot de passe par défaut immédiatement!" -ForegroundColor Gray
        Write-Host ""
        Write-Host "La base SQLite sera créée automatiquement à la première connexion." -ForegroundColor Yellow
        Write-Host ""
        
    } catch {
        Write-Host "[ERREUR] Échec de l'upload FTP: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host $_.Exception.StackTrace -ForegroundColor DarkGray
        exit 1
    }
}

# ==================== Main ====================
Show-Header
Run-Build
Upload-FTP
