# Icone Windows (Node-based)

## Pré-requis
- `assets/icon.png` doit exister
- Node.js installé
- Installer: `npm install image-to-ico --save-dev`

## Utilisation
1. Générer l'ICO:
   ```bash
   npm run icon:convert
   ```
   ou:
   ```bash
   node tools/convert_icon_node.js
   ```

2. Utiliser `assets/icon.ico` dans Electron ou pour un raccourci Windows

## Raccourci bureau
Exécuter en PowerShell (en tant qu'admin si nécessaire):
```powershell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$desktop\Gestion ONG.lnk")
$Shortcut.TargetPath = "D:\Mes projets Open Codes\Gestion ONG\launch.bat"
$Shortcut.IconLocation = "D:\Mes projets Open Codes\Gestion ONG\assets\icon.ico"
$Shortcut.WorkingDirectory = "D:\Mes projets Open Codes\Gestion ONG"
$Shortcut.Save()
```

Ou double-clique sur `create_shortcut.bat`
