# 🎮 GDD — Shift Core: Gravidade Cúbica - Desafio Orbital

**Nome Comercial**: Shift Core: Gravidade Cúbica - Desafio Orbital (Inédito e Inovador)  
**Gênero / Estilo**: Physics Puzzle / Ragdoll  
**Plataforma Alvo**: CrazyGames (HTML5 / WebGL)  
**URL de Entrega / Produção**: [https://shiftcore3d.kinomuse.com.br](https://shiftcore3d.kinomuse.com.br)  
**Stack Tecnológica**: Godot 4.7.2 3D (Forward+) + CrazyGames SDK v3  
**Data de Concepção**: 15/10/2026 02:33  
**Arquiteta Mestre de Criação**: Esmeralda (GLX Agent)  

---

## 🌟 1. Identidade de Marca & Introdução Obrigatória
1. **Intro FluidCleb Interactive (0.0s a 2.8s)**:
   - Splash Screen procedural obrigatória em Canvas idêntica aos títulos de referência (*Sobrevivente da Névoa* e *Hydrologic*).
   - Orbes de energia azul subindo (`#00f5ff`, `#38bdf8`, `#0284c7`), fusão central com áudio sintético procedural (`playFluidClebIntro()`), emblema da gota d'água metálica (`#94a3b8` / `#0284c7`), logo em neon `FLUIDCLEB` (38px) e subtítulo `INTERACTIVE` (13px), com barra de progresso suave.
2. **Apresentação em Animação Realista (Intro Narrativa / Lore Interativa)**:
   - Exibida imediatamente após a Splash Screen da FluidCleb.
   - Animação cinematográfica procedural em Canvas com partículas volumétricas, feixes de luz e transição dramática que narra os 3 atos da Lore em até 5 segundos com botões 'Continuar ➔' e 'Pular História'.

---

## 📖 2. Lore, Ambientação & Premissa
Num futuro distante, a humanidade explora os confins do espaço através de megaestruturas cúbicas flutuantes, repletas de segredos e armadilhas. Como um 'Cubo-Nauta', um robô de exploração de última geração, sua missão é navegar por esses labirintos gravitacionais, reativando núcleos energéticos e desvendando os mistérios por trás de sua criação.

---

## ⚡ 3. Core Gameplay Loop & Controles
O jogador entra em um novo setor cúbico, analisa o ambiente e manipula a gravidade para resolver puzzles de física, superando obstáculos e armadilhas. A cada setor concluído, novas habilidades são desbloqueadas e o robô é recompensado com dados que revelam a história da estação.

---

## 🧩 4. Módulos & Features Aprovados para o Jogo
- **Manipulação Gravitacional em 3 Eixos**
- **Propulsão Parabólica e Momento Orbital**
- **Módulos de Massa e Reatores de Inércia**
- **Recuperação Quântica / Análise de Trajetória (Rewarded Ad)**
- **Zonas de Estabilização Ragdoll**

---

## 💰 5. Estratégia de Monetização e Requisitos Oficiais CrazyGames
- Rewarded Ad 1: Reviver 1x por tentativa com bônus temático temporário.
- Rewarded Ad 2: Dobrar recursos especiais na tela de vitória.
- Midgame Ads: A cada 3 a 4 minutos estritamente em telas lógicas de intervalo.

### Requisitos Obrigatórios de Publicação CrazyGames (Docs Oficiais):
1. **Gameplay (Land in Gameplay & Física)**:
   - O jogador deve cair na ação em no máximo 1 clique (Play / Pular História direto na partida).
   - Física e movimentação com `deltaTime` (fixed timestep) consistente em 60Hz, 144Hz e 165Hz.
   - Proibido qualquer botão customizado de Fullscreen dentro do canvas (CrazyGames já fornece nativamente).
   - Localização em Inglês (EN) por padrão, com seletor/detecção PT-BR. PEGI 12.
2. **Técnico (Tamanho & Caminhos)**:
   - Bundle inicial ≤ 50MB (≤ 20MB para qualificar para mobile), total ≤ 250MB, máximo 1500 arquivos.
   - Caminhos estritamente relativos no build (`base: './'`), tempo de carga ≤ 20s.
3. **Anúncios & SDK v3 (CrazyGames Ads)**:
   - Chamadas de ciclo `gameplayStart()` e `gameplayStop()`.
   - Mute de áudio e pausa de jogo obrigatórios durante anúncios (`adStarted` -> mudo/pausa; `adFinished`/`adError` -> desmuta/retoma).
   - Rewarded Ads com ícone de vídeo, botão de recusar com mesma visibilidade; se der `adError` (AdBlock), NUNCA premiar.
   - Nunca disparar Midgame Ads durante gameplay ativa.

---

## 🛡️ 6. Protocolo de Validação de Qualidade por 2 Subagentes (QA)
- **Subagente 1 (Mecânica & Fluidez)**: Validação de 60 FPS constantes, física sem travamentos, movimentação precisa, colisão e conformidade com monitores de alta taxa de quadros (144Hz/165Hz).
- **Subagente 2 (Jogabilidade & CrazyGames SDK)**: Validação de interface/HUD responsiva sem sobreposição, efeitos visuais nítidos, localização em inglês e conformidade total com os requisitos oficiais do CrazyGames SDK v3 (mute em ads, pause, land in gameplay).
