@echo off
echo [*] Sincronizando backup de ShiftCore3D no GitHub...
git add .
git commit -m "auto: backup sincronizado v1.0 CrazyGames HTML5"
git branch -M main
git push -u origin main
echo [OK] Backup concluido com sucesso!
