<#
.SYNOPSIS
    Deploiement FTP Gestion ONG (OVH mutualise) - build + sync vers /admin/
.DESCRIPTION
    Build le projet React, puis uploade sur le serveur OVH :
      - dist/index.html            -> /admin/index.html
      - dist/assets/**             -> /admin/assets/**
      - .htaccess racine           -> FTP_REMOTE_PATH/.htaccess
      - api/*.php + api/.htaccess  -> FTP_REMOTE_PATH/admin/api/*
      - api/data/.htaccess         -> FTP_REMOTE_PATH/admin/api/data/.htaccess

    Les bases SQLite (users.db / gestion.db) ne sont JAMAIS uploadees.
    Les fichiers .db existants sur le serveur sont preserves.

.NOTES
    - Aucun upload n'est effectue sans confirmation (sauf avec -Force).
    - -WhatIf : simule le deploiement sans rien envoyer (recommande avant le 1er essai).
    - -BuildOnly / -UploadOnly : etapes separees.
#>

param(
    [switch]$BuildOnly,
    [switch]$UploadOnly,
    [switch]$WhatIf,   # simulation : affiche la liste des fichiers sans rien envoyer
    [switch]$Force,    # ignore la confirmation interactive
    [switch]$Help
)

$ErrorActionPreference = "Stop"

$SCRIPT_DIR  = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_DIR = Split-Path -Parent $SCRIPT_DIR
$DIST_DIR    = Join-Path $PROJECT_DIR "dist"
$API_DIR     = Join-Path $PROJECT_DIR "api"
$ENV_FILE    = Join-Path $SCRIPT_DIR ".env"

function Show-Help {
    Write-Host ""
    Write-Host "Deploiement Gestion ONG -> /admin/ sur OVH" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage :" -ForegroundColor Yellow
    Write-Host "  .\deploy.ps1 -WhatIf    Liste les fichiers a envoyer (aucun upload reel)"
    Write-Host "  .\deploy.ps1            Build + upload (avec confirmation)"
    Write-Host "  .\deploy.ps1 -BuildOnly Build uniquement"
    Write-Host "  .\deploy.ps1 -UploadOnly Upload uniquement"
    Write-Host "  .\deploy.ps1 -Force     Upload sans confirmation"
    Write-Host ""
    Write-Host "Configuration : deploy\.env (copier deploy\.env.example)" -ForegroundColor White
    exit 0
}

if ($Help) { Show-Help }

function Check-EnvFile {
    if (-not (Test-Path $ENV_FILE)) {
        Write-Host "[ERREUR] deploy\.env introuvable. Copiez deploy\.env.example vers deploy\.env." -ForegroundColor Red
        exit 1
    }
}

function Load-Env {
    Check-EnvFile
    $envVars = @{}
    foreach ($line in Get-Content $ENV_FILE) {
        $trimmedLine = $line.Trim()
        if ($trimmedLine -match '^[^#].*=') {
            $idx = $trimmedLine.IndexOf('=')
            if ($idx -gt 0) {
                $envVars[$trimmedLine.Substring(0, $idx).Trim()] = $trimmedLine.Substring($idx + 1).Trim()
            }
        }
    }
    return $envVars
}

function Run-Build {
    Write-Host ""
    Write-Host "=== BUILD ===" -ForegroundColor Cyan
    $envConfig = Load-Env
    if (-not $envConfig["VITE_API_BASE"]) {
        $envConfig["VITE_API_BASE"] = "/admin/api"
    }
    $env:VITE_API_BASE = $envConfig["VITE_API_BASE"]

    $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run build" -WorkingDirectory $PROJECT_DIR -NoNewWindow -Wait -PassThru
    if ($process.ExitCode -ne 0) {
        Write-Host "[ERREUR] Le build a echoue." -ForegroundColor Red
        exit 1
    }
    Write-Host "[OK] Build reussi." -ForegroundColor Green
}

# Construit la liste (source -> destination distante relative a FTP_REMOTE_PATH)
function Build-FileList {
    $list = New-Object System.Collections.ArrayList

    # Etape 1 : verifier que build est present
    $indexHtml = Join-Path $DIST_DIR "index.html"
    if (-not (Test-Path $indexHtml)) {
        Write-Host "[ERREUR] dist\index.html absent. Lancez d'abord le build (.\deploy.ps1 -BuildOnly)." -ForegroundColor Red
        exit 1
    }

    # index.html -> /admin/index.html
    [void]$list.Add(@{ src = $indexHtml; dst = "admin/index.html"; type = "file" })

    # assets dist -> /admin/assets/
    Get-ChildItem -Path (Join-Path $DIST_DIR "assets") -File | ForEach-Object {
        [void]$list.Add(@{ src = $_.FullName; dst = "admin/assets/$($_.Name)"; type = "file" })
    }

    # Autres fichiers de dist racine (ex: vite.svg)
    Get-ChildItem -Path $DIST_DIR -File | Where-Object { $_.Name -ne "index.html" } | ForEach-Object {
        [void]$list.Add(@{ src = $_.FullName; dst = "admin/$($_.Name)"; type = "file" })
    }

    # .htaccess racine (version deployee - corrigee OVH, sans DirectoryMatch)
    $htaccess = Join-Path $SCRIPT_DIR ".htaccess"
    if (Test-Path $htaccess) {
        [void]$list.Add(@{ src = $htaccess; dst = ".htaccess"; type = "file" })
    }

    # api/*.php (jamais les .db) + api/.htaccess + api/data/.htaccess
    Get-ChildItem -Path $API_DIR -Filter "*.php" | ForEach-Object {
        [void]$list.Add(@{ src = $_.FullName; dst = "admin/api/$($_.Name)"; type = "file" })
    }
    Get-ChildItem -Path $API_DIR -Filter ".htaccess" -Force 2>$null | ForEach-Object {
        [void]$list.Add(@{ src = $_.FullName; dst = "admin/api/.htaccess"; type = "file" })
    }
    $apiDataHtaccess = Join-Path $API_DIR "data/.htaccess"
    if (Test-Path $apiDataHtaccess) {
        [void]$list.Add(@{ src = $apiDataHtaccess; dst = "admin/api/data/.htaccess"; type = "file" })
    }

    # Dossiers a creer sur le serveur (dans l'ordre logique)
    [void]$list.Add(@{ src = $null; dst = "admin"; type = "dir" })
    [void]$list.Add(@{ src = $null; dst = "admin/assets"; type = "dir" })
    [void]$list.Add(@{ src = $null; dst = "admin/api"; type = "dir" })
    [void]$list.Add(@{ src = $null; dst = "admin/api/data"; type = "dir" })

    return $list
}

function Create-RemoteFolder($ftpUri, $folderRelPath, $credentials) {
    try {
        $request = [System.Net.FtpWebRequest]::Create("$ftpUri/$folderRelPath")
        $request.Credentials = $credentials
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $request.UsePassive = $true
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "  [OK] Dossier $folderRelPath/ cree" -ForegroundColor Green
    } catch {
        Write-Host "  Dossier $folderRelPath/ existe deja (ou cree automatiquement)" -ForegroundColor Gray
    }
}

function Upload-File($ftpUri, $dstRelPath, $sourcePath, $credentials) {
    if (-not (Test-Path $sourcePath)) {
        Write-Host "  [SKIP] $dstRelPath (fichier introuvable)" -ForegroundColor Yellow
        return
    }
    Write-Host "  Uploading $dstRelPath..." -ForegroundColor Yellow
    $request = [System.Net.FtpWebRequest]::Create("$ftpUri/$dstRelPath")
    $request.Credentials = $credentials
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.UseBinary = $true
    $request.UsePassive = $true

    $fileBytes = [System.IO.File]::ReadAllBytes($sourcePath)
    $requestStream = $request.GetRequestStream()
    $requestStream.Write($fileBytes, 0, $fileBytes.Length)
    $requestStream.Close()

    $size = [math]::Round($fileBytes.Length / 1024, 1)
    Write-Host "  [OK] $dstRelPath ($size KB)" -ForegroundColor Green
}

function Upload-FTP {
    $envConfig = Load-Env
    $ftpHost = $envConfig["FTP_HOST"]
    $ftpUser = $envConfig["FTP_USER"]
    $ftpPass = $envConfig["FTP_PASS"]
    $ftpPath = $envConfig["FTP_REMOTE_PATH"]
    if (-not $ftpPath) { $ftpPath = "/www" }

    if ($ftpHost -eq "ftp.cluster027.hosting.ovh.net" -or $ftpUser -eq "votre-identifiant-ftp") {
        Write-Host "[ERREUR] Identifiants FTP non configures dans deploy\.env" -ForegroundColor Red
        exit 1
    }

    # Confirmation interactive (sauf -Force ou -WhatIf)
    if (-not $WhatIf -and -not $Force) {
        Write-Host ""
        Write-Host "Cible : ftp://$ftpHost$ftpPath  (destination reelle : $ftpPath/admin/...)" -ForegroundColor Yellow
        $confirm = Read-Host "Uploader ces fichiers ? (o/N)"
        if ($confirm -notin @("o","O","oui","Oui","OUI")) {
            Write-Host "Annule par l'utilisateur." -ForegroundColor Yellow
            exit 0
        }
    }

    $list = Build-FileList
    Write-Host ""
    if ($WhatIf) {
        Write-Host "=== UPLOAD FTP (SIMULATION - aucun fichier envoye) ===" -ForegroundColor Cyan
    } else {
        Write-Host "=== UPLOAD FTP (REEL) ===" -ForegroundColor Cyan
    }
    Write-Host "Serveur        : $ftpHost" -ForegroundColor Gray
    Write-Host "Utilisateur    : $ftpUser" -ForegroundColor Gray
    Write-Host "Racine distante: $ftpPath" -ForegroundColor Gray
    Write-Host ""

    $ftpUri = "ftp://$ftpHost$ftpPath"
    $credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

    # 1) Creer les dossiers (dans l'ordre logique)
    foreach ($item in $list | Where-Object { $_.type -eq 'dir' }) {
        if ($WhatIf) {
            Write-Host "  [DIR ] $($item.dst)/" -ForegroundColor DarkGray
        } else {
            Create-RemoteFolder $ftpUri $item.dst $credentials
        }
    }

    # 2) Uploader les fichiers
    foreach ($item in $list | Where-Object { $_.type -eq 'file' }) {
        if ($WhatIf) {
            $size = if (Test-Path $item.src) { [math]::Round((Get-Item $item.src).Length / 1024, 1) } else { 0 }
            Write-Host "  [FILE] $($item.dst)  ($size KB)" -ForegroundColor DarkGray
        } else {
            Upload-File $ftpUri $item.dst $item.src $credentials
        }
    }

    Write-Host ""
    if ($WhatIf) {
        Write-Host "=== SIMULATION TERMINEE - rien n'a ete transfere ===" -ForegroundColor Yellow
        Write-Host "Relancez sans -WhatIf pour le deploiement reel."
    } else {
        Write-Host "=== DEPLOIEMENT REUSSI ===" -ForegroundColor Green
        Write-Host "Application : https://$ftpHost/admin/"
        Write-Host ""
        Write-Host "Verifications post-deploiement :" -ForegroundColor Yellow
        Write-Host "1. Videz le cache du navigateur (Ctrl+F5) sur https://$ftpHost/admin/" -ForegroundColor Gray
        Write-Host "2. Verifiez que https://$ftpHost/admin/assets/index-*.js renvoie 200" -ForegroundColor Gray
        Write-Host "3. Connectez-vous : admin@gestion-ong.org / ONG@ses13 (ou le mot de passe defini dans api/config.php)" -ForegroundColor Gray
        Write-Host "4. CHANGEZ LE MOT DE PASSE immediatement ; verifiez Parametres > mot de passe" -ForegroundColor Gray
        Write-Host "5. Testez une sauvegarde depuis Parametres > Sauvegarder" -ForegroundColor Gray
        Write-Host "6. Verifiez que https://$ftpHost/admin/api/data/gestion.db renvoie 403 ou 404 (jamais 200)" -ForegroundColor Gray
    }
    Write-Host ""
}

# ==================== Main ====================
if ($BuildOnly) {
    Run-Build
    exit 0
}
if ($UploadOnly) {
    Upload-FTP
    exit 0
}

Run-Build
Upload-FTP
