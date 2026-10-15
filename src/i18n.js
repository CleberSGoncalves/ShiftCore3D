/**
 * @fileoverview Localization module for Shift Core: Gravidade Cúbica
 * Supports English (default for CrazyGames) and Portuguese (PT-BR).
 */

class I18nManager {
  constructor() {
    this.locale = this.detectLocale();
    this.translations = {
      en: {
        game_title: "SHIFT CORE: CUBIC GRAVITY",
        game_subtitle: "Orbital Gravity Shifter",
        sector: "SECTOR",
        cores: "CORES",
        health: "HULL",
        score: "SCORE",
        gravity: "GRAVITY",
        dir_floor: "DOWN (FLOOR)",
        dir_ceiling: "UP (CEILING)",
        dir_left: "LEFT (WALL)",
        dir_right: "RIGHT (WALL)",
        jump: "JUMP",
        shift: "SHIFT GRAVITY",
        rotate_ccw: "ROTATE ⟲",
        rotate_cw: "ROTATE ⟳",
        flip_180: "FLIP 180°",
        paused: "GAME PAUSED",
        resume: "RESUME",
        restart: "RETRY SECTOR",
        next_level: "NEXT SECTOR",
        sector_complete: "SECTOR STABILIZED!",
        game_over: "CONTAINMENT FAILURE",
        game_over_desc: "The Cubo-Naut hull sustained critical orbital damage.",
        revive_btn: "REVIVE (WATCH AD)",
        revive_desc: "Recharge hull with Quantum Shield (1x per run)",
        double_score: "DOUBLE SCORE (AD)",
        continue_btn: "CONTINUE ➔",
        skip_story: "SKIP STORY ⏩",
        play_now: "START MISSION 🎮",
        lore_act1_title: "ACT I — THE ABANDONED STATION",
        lore_act1_desc: "Orbital Megastructure 'Tetra-Prime' has lost its gravitational stabilizer. Floating debris and unstable plasma fields drift through the vacuum.",
        lore_act2_title: "ACT II — THE CUBO-NAUT AWAKENS",
        lore_act2_desc: "Unit CN-38 online. Your gravitational core allows you to reorient local gravity in any direction to traverse the station's interior walls.",
        lore_act3_title: "ACT III — HARVEST THE CORES",
        lore_act3_desc: "Retrieve all unstable Energy Cores in each sector and reach the Orbital Warp Gate before station collapse!",
        tutorial_move: "A / D or Arrow Keys to Move",
        tutorial_jump: "W, Up Arrow or SPACE to Jump",
        tutorial_shift: "Q / E to Rotate Gravity • R to Flip 180°",
        tutorial_mobile: "Use virtual buttons to steer and reorient gravity",
        portal_locked: "GATE LOCKED: Collect all Energy Cores!",
        portal_open: "GATE ACTIVE: Enter the Warp Vortex!",
        all_sectors_cleared: "ALL SECTORS SECURED! STATION SAVED!",
        sound_on: "Sound: ON",
        sound_off: "Sound: MUTED"
      },
      pt: {
        game_title: "SHIFT CORE: GRAVIDADE CÚBICA",
        game_subtitle: "Desafio Gravitacional Orbital",
        sector: "SETOR",
        cores: "NÚCLEOS",
        health: "CASCO",
        score: "PONTOS",
        gravity: "GRAVIDADE",
        dir_floor: "BAIXO (CHÃO)",
        dir_ceiling: "CIMA (TETO)",
        dir_left: "ESQUERDA (PAREDE)",
        dir_right: "DIREITA (PAREDE)",
        jump: "PULO",
        shift: "MUDAR GRAVIDADE",
        rotate_ccw: "GIRAR ⟲",
        rotate_cw: "GIRAR ⟳",
        flip_180: "INVERTER 180°",
        paused: "JOGO PAUSADO",
        resume: "RETOMAR",
        restart: "REPETIR SETOR",
        next_level: "PRÓXIMO SETOR",
        sector_complete: "SETOR ESTABILIZADO!",
        game_over: "FALHA DE CONTENÇÃO",
        game_over_desc: "O casco do robô Cubo-Nauta sofreu danos críticos na órbita.",
        revive_btn: "REVIVER (VER ANÚNCIO)",
        revive_desc: "Recarregar casco com Escudo Quântico (1x por partida)",
        double_score: "DOBRAR PONTUAÇÃO (ANÚNCIO)",
        continue_btn: "CONTINUAR ➔",
        skip_story: "PULAR HISTÓRIA ⏩",
        play_now: "INICIAR MISSÃO 🎮",
        lore_act1_title: "ATO I — A ESTAÇÃO ABANDONADA",
        lore_act1_desc: "A megaestrutura orbital 'Tetra-Prime' perdeu seus estabilizadores gravitacionais. Resíduos cósmicos e campos de plasma instáveis flutuam no vácuo.",
        lore_act2_title: "ATO II — O CUBO-NAUTA DESPERTA",
        lore_act2_desc: "Unidade CN-38 online. Seu núcleo gravitacional permite reorientar a gravidade local em qualquer direção para caminhar pelas paredes e tetos.",
        lore_act3_title: "ATO III — COLETA DE NÚCLEOS",
        lore_act3_desc: "Recupere todos os Núcleos de Energia instáveis de cada setor e alcance o Portal Orbital antes do colapso da estação!",
        tutorial_move: "Use A / D ou Setas para Mover",
        tutorial_jump: "W, Seta Cima ou ESPAÇO para Pular",
        tutorial_shift: "Q / E para Girar Gravidade • R para Inverter 180°",
        tutorial_mobile: "Use os botões na tela para pilotar e mudar a gravidade",
        portal_locked: "PORTAL TRANCADO: Colete todos os Núcleos de Energia!",
        portal_open: "PORTAL ATIVO: Entre no Vórtice de Salto!",
        all_sectors_cleared: "TODOS OS SETORES SALVOS! VITÓRIA ORBITAL!",
        sound_on: "Som: LIGADO",
        sound_off: "Som: MUDO"
      }
    };
  }

  detectLocale() {
    const lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    if (lang.startsWith('pt')) return 'pt';
    return 'en';
  }

  setLocale(locale) {
    if (this.translations[locale]) {
      this.locale = locale;
    }
  }

  t(key) {
    const dict = this.translations[this.locale] || this.translations.en;
    return dict[key] || this.translations.en[key] || key;
  }
}

export const i18n = new I18nManager();
export default i18n;
