@echo off
echo Création du raccourci bureau pour Gestion ONG...
echo.

set SHORTCUT=%USERPROFILE%\Desktop\Gestion ONG.lnk
set TARGET=%~dp0launch.bat
set ICON=%~dp0assets\icon.ico
set WORKDIR=%~dp0

echo Set oWS = WScript.CreateObject("WScript.Shell") > %temp%\shortcut.vbs
echo sLinkFile = "%SHORTCUT%" >> %temp%\shortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %temp%\shortcut.vbs
echo oLink.TargetPath = "%TARGET%" >> %temp%\shortcut.vbs
echo oLink.WorkingDirectory = "%WORKDIR%" >> %temp%\shortcut.vbs
echo oLink.IconLocation = "%ICON%" >> %temp%\shortcut.vbs
echo oLink.Save >> %temp%\shortcut.vbs

cscript /nologo %temp%\shortcut.vbs
del %temp%\shortcut.vbs

echo.
echo Raccourci créé sur le bureau: Gestion ONG.lnk
echo.
pause
