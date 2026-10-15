# 🚀 ShiftCore3D — Shift Core: Gravidade Cúbica - Desafio Orbital

**Estúdio**: FluidCleb Interactive  
**Tipo**: Physics Puzzle / Ragdoll 3D — CrazyGames HTML5  
**Engine**: Godot 4.7.2 (GL Compatibility / WebGL)  
**URL Pública**: https://shiftcore3d.kinomuse.com.br

---

## 📁 Estrutura do Projeto

```
E:\desenvolvimento\ShiftCore3D\          ← Web Deploy (este repo)
  index.html                             ← Wrapper HTML5 + Intro FluidCleb
  vite.config.js                         ← Build config (base: './')
  package.json
  scripts/check_bundle_size.js           ← Validador de tamanho CrazyGames

E:\desenvolvimento\Godot\Projetos\ShiftCore3D\   ← Godot Source
  project.godot                          ← Config principal (GL Compatibility)
  scenes/
    boot.tscn                            ← Cena de boot (aguarda SDK)
    main.tscn                            ← Cena principal do jogo
    player.tscn                          ← Cubo-Nauta robô
    hud.tscn                             ← HUD completo responsivo
    energy_core.tscn                     ← Núcleo energético coletável
    platform.tscn                        ← Plataforma cúbica
    hazard.tscn                          ← Armadilha rotativa
  scripts/
    game_manager.gd                      ← Autoload: estado, gravidade, ads
    crazy_sdk.gd                         ← Autoload: CrazyGames SDK v3 bridge
    audio_manager.gd                     ← Autoload: áudio sintético procedural
    locale_manager.gd                    ← Autoload: EN/PT-BR detecção
    player.gd                            ← Física delta-time, squash/stretch
    hud.gd                               ← UI completa, lore, anúncios
    level_generator.gd                   ← Gerador procedural de setores
    energy_core.gd                       ← Núcleo: pulsação, partículas
    hazard.gd                            ← Armadilha: dano + cooldown
    boot.gd                              ← Boot: aguarda intro + SDK
```

---

## 🎮 Features Implementadas

- **Manipulação Gravitacional 3 Eixos**: W/A/S/D + Q/E para 6 direções
- **Física Delta-Time Rigorosa**: 60Hz fixo, consistente em 60–165Hz
- **5 Setores Procedurais**: plataformas, núcleos e armadilhas por seed
- **Coyote Time (0.12s)** + **Jump Buffering (0.15s)**
- **Squash & Stretch Elástico** com spring damping
- **Intro FluidCleb Procedural** (Canvas 2D, 0–2.8s)
- **Lore Interativa** com botão Skip bem visível (1 clique para gameplay)
- **HUD Responsivo**: Desktop (1280×720) + Touch mobile (6 botões de gravidade)
- **Audio Sintético Procedural** via AudioStreamGenerator (zero arquivos externos)

---

## 💰 CrazyGames SDK v3 — Integração Completa

| Feature | Status |
|---|---|
| Script oficial `crazygames-sdk-v3.js` | ✅ |
| `await SDK.init()` com fallback AdBlock | ✅ |
| `gameplayStart()` ao iniciar/despausar | ✅ |
| `gameplayStop()` ao pausar/morrer/menu | ✅ |
| Mute áudio + Freeze física em anúncios | ✅ |
| Rewarded Ad: Reviver 1x com invulnerabilidade 3s | ✅ |
| Rewarded Ad: Dobrar score na vitória | ✅ |
| Sem recompensa em adError (proteção AdBlock) | ✅ |
| Midgame Ads: 3–4 min, só em telas lógicas | ✅ |
| `happyTime()` na vitória | ✅ |
| SEM botão fullscreen customizado | ✅ |

---

## 🌐 Build e Deploy

### Exportar do Godot:
1. Abrir `E:\desenvolvimento\Godot\Projetos\ShiftCore3D\` no Godot 4.7.2
2. Project → Export → Web (GL Compatibility)
3. Exportar para: `E:\desenvolvimento\ShiftCore3D\game\`
4. Arquivo principal: `ShiftCore3D.html` (o index.html usa o wrapper)

### Build Vite:
```bash
cd E:\desenvolvimento\ShiftCore3D
npm install
npm run build
npm run build:check   # Valida tamanho ≤ 50MB
```

### Deploy:
```bash
# Copiar conteúdo de dist/ para o servidor web
# URL alvo: https://shiftcore3d.kinomuse.com.br
```

---

## 🔧 Status

**Versão**: 1.0.0  
**Data**: 2026-10-15  
**Build**: Pronto para exportação Godot + deploy Vite