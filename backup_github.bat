@echo off
echo [*] Sincronizando backup do projeto Godot ShiftCore3D no GitHub...
git add .
git commit -m "auto: backup sincronizado Godot 4.7.2 v1.0"
git branch -M main
git push -u origin main
echo [OK] Backup concluido com sucesso!
