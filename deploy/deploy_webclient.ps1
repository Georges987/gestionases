<#
.SYNOPSIS
    Script de déploiement via WebClient (plus stable sur OVH)
.DESCRIPTION
    Build le projet React et upload les fichiers sur un serveur OVH
.NOTES
    Nécessite les identifiants FTP dans les variables ci-dessous
#>

$ErrorActionPreference = "Stop"

# =============================================================================
# CONFIGURATION - REMPLACER ICI
# =============================================================================
$FTP_HOST = "ftp.cluster130.hosting.ovh.net"
$FTP_USER = "ongasec"
$FTP_PASS = "OngAsesOrg2020"

$LOCAL_PROJECT = "D:\Mes projets Open Codes\Gestion ONG"
$REMOTE_PATH = "/www"  # Chemin distant (souvent /www)

# =============================================================================
# Fonctions
# =============================================================================

function Upload-FileWebClient($ftpPath, $localPath) {
    if (-not (Test-Path $localPath)) {
        Write-Host "  [SKIP] $(Split-Path $localPath -Leaf) (fichier introuvable)" -ForegroundColor Yellow
        return
    }
    
    $uri = New-Object System.Uri("ftp://$FTP_HOST$REMOTE_PATH/$ftpPath")
    $wc = New-Object System.Net.WebClient
    $wc.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    
    try {
        Write-Host "Uploading $ftpPath..." -ForegroundColor Yellow
        $wc.UploadFile($uri, $localPath)
        $size = (Get-Item $localPath).Length
        Write-Host "[OK] $(Split-Path $localPath -Leaf) uploadé ($([math]::Round($size/1KB,1)) KB)" -ForegroundColor Green
    } catch {
        Write-Host "[ERREUR] Upload $ftpPath : $($_.Exception.InnerException.Message)" -ForegroundColor Red
    } finally {
        $wc.Dispose()
    }
}

# =============================================================================
# Main
# =============================================================================

Write-Host ""
Write-Host "Deploy - Gestion ONG (SQLite)" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# 1. Build
Write-Host "=== BUILD ===" -ForegroundColor Cyan
Write-Host "Building the project..." -ForegroundColor Gray

$env:VITE_API_BASE = "/admin/api"
$process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run build" -WorkingDirectory $LOCAL_PROJECT -NoNewWindow -Wait -PassThru

if ($process.ExitCode -ne 0) {
    Write-Host "[ERREUR] Le build a échoué!" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Build réussi!" -ForegroundColor Green
$htmlFile = "$LOCAL_PROJECT\dist\index.html"
if (Test-Path $htmlFile) {
    $size = (Get-Item $htmlFile).Length
    Write-Host "  Taille: $([math]::Round($size/1KB,1)) KB" -ForegroundColor Gray
}

# 2. Upload
Write-Host ""
Write-Host "=== UPLOAD FTP (WebClient) ===" -ForegroundColor Cyan
Write-Host "Serveur: $FTP_HOST" -ForegroundColor Gray
Write-Host "Utilisateur: $FTP_USER" -ForegroundColor Gray
Write-Host "Chemin: $REMOTE_PATH" -ForegroundColor Gray
Write-Host ""

# Upload index.html
Upload-FileWebClient "index.html" "$LOCAL_PROJECT\dist\index.html"

# Upload fichiers API
Upload-FileWebClient "api/config.php" "$LOCAL_PROJECT\api\config.php"
Upload-FileWebClient "api/auth.php" "$LOCAL_PROJECT\api\auth.php"
Upload-FileWebClient "api/stocks.php" "$LOCAL_PROJECT\api\stocks.php"

# Note: OVH ne permet pas toujours la création de dossiers via FTP avec WebClient
# Vous devrez peut-être créer le dossier /www/api/data/ manuellement via FileZilla
# et y mettre un fichier .htaccess vide

Write-Host ""
Write-Host "=== DÉPLOIEMENT TERMINÉ ===" -ForegroundColor Green
Write-Host "Application déployée sur https://$FTP_HOST" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Créez le dossier /www/api/data/ via FileZilla si absent" -ForegroundColor Gray
Write-Host "2. Connectez-vous avec admin@gestion-ong.org / admin123" -ForegroundColor Gray
Write-Host "3. Changez le mot de passe par défaut immédiatement!" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: La base SQLite sera créée automatiquement à la première connexion." -ForegroundColor Yellow
Write-Host ""
