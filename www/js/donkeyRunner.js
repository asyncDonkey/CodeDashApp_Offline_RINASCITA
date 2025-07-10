// js/donkeyRunner.js
import { openOfflineDB, getUser, saveUser } from './offlineDb.js';

import { SpriteAnimation } from './animation.js';
import {
    PowerUpItem,
    POWERUP_TYPE,
    POWERUP_DURATION,
    POWERUP_CONFIGS, // Importa POWERUP_CONFIGS
} from './powerUps.js';
import * as AudioManager from './audioManager.js';
// Rimosse db e auth. generateBlockieAvatar rimane se usato per gli avatar locali.
import { generateBlockieAvatar, currentUserData } from './main.js'; // currentUserData ora importato da main.js
// Rimosse tutte le importazioni Firebase Firestore
// import { collection, query, orderBy, limit, getDocs, serverTimestamp, where, addDoc, doc, getDoc, documentId, } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { showToast } from './toastNotifications.js';
import * as MissionManager from './missionManager.js';
import { CompanionManager } from './companionManager.js';
import { FRONTEND_BADGE_TIERS } from './badgeManager.js'; // <-- AGGIUNGI QUESTA LINEA

// --- GESTIONE AUDIO V1.4 ---
const BGM_PLAYLIST = Array.from({ length: 11 }, (_, i) => `track_${String(i + 1).padStart(2, '0')}.ogg`);
// Rimuovi o commenta la vecchia BOSS_MUSIC_PATH se non più necessaria

const GLITCHZILLA_MUSIC_PATH = 'audio/boss/glitchzilla_music.ogg'; // Nuovo path specifico
const TROJAN_BYTE_MUSIC_PATH = 'audio/boss/trojan_byte_music.ogg'; // Nuovo path specifico
const MISSING_NUMBER_MUSIC_PATH = 'audio/boss/missing_number_music.ogg'; // Nuovo path specifico
const DUNNO_EXE_MUSIC_PATH = 'audio/boss/dunno_exe_music.ogg'
const GAME_OVER_MUSIC_PATH = 'audio/game_over_music.ogg';
const THUNDER_CLAP_SOUND_NAME = 'sfx_thunder_clap';

// NUOVI: Suoni personalizzati
export const SFX_FRUIT_COLLECT = 'sfx_fruit_collect';
export const SFX_CLOUD_SHOT = 'sfx_cloud_shot';
export const SFX_DEBUG_SHOT = 'sfx_debug_shot';
export const SFX_KERNEL_SHOT = 'sfx_kernel_shot'; // Suono per quando Kernel 4.2 spara
export const SFX_COMPANION_FRUIT_COLLECT = 'sfx_companion_fruit_collect'; // Suono per quando il compagno raccoglie frutta

// NUOVO: Suono per quando il player "mangia" i proiettili nemici
const SFX_PROJECTILE_DIGEST = 'sfx_projectile_digest';
const SFX_GLITCHZILLA_SPECIAL_ATTACK = 'sfx_glitchzilla_special_attack';
const SFX_GLITCHZILLA_TARGET_LOCK = 'sfx_glitchzilla_target_lock';

const SFX_GLITCHZILLA_LOADING_SHOT = 'sfx_glitchzilla_loading_shot'; // NUOVO
const SFX_MISSING_NUMBER_LOADING_SHOT = 'sfx_missing_number_loading_shot'; // NUOVO

// NUOVI SUONI per MissingNumber (placeholder, usa suoni esistenti per ora)
const SFX_MISSING_NUMBER_ENTITY_SPAWN = 'sfx_missing_number_entity_spawn'; // [FEAT]
const SFX_MISSING_NUMBER_FAST_ATTACK = 'sfx_missing_number_fast_attack'; // [FEAT]

const POWERUP_SOUND_MAP = {
    [POWERUP_TYPE.TRIPLE_SHOT]: { sfx: 'sfx_triple_shot', voice: 'voice_multithread' },
    [POWERUP_TYPE.SHIELD]: { sfx: 'sfx_shield', voice: 'voice_shield' },
    [POWERUP_TYPE.SMART_BOMB]: { sfx: 'sfx_smart_bomb', voice: 'voice_cleanup' },
    [POWERUP_TYPE.DEBUG_MODE]: { sfx: 'sfx_debug_mode', voice: 'voice_debug' },
    [POWERUP_TYPE.FIREWALL]: { sfx: 'sfx_firewall', voice: 'voice_firewall' },
    [POWERUP_TYPE.BLOCK_BREAKER]: { sfx: 'sfx_block_breaker', voice: 'voice_decompiler' },
    [POWERUP_TYPE.SLAYER_SUBROUTINE]: { sfx: 'sfx_legendary', voice: 'voice_slayer' },
    [POWERUP_TYPE.CODE_INJECTOR]: { sfx: 'sfx_legendary', voice: 'voice_injector' },
    [POWERUP_TYPE.REINFORCED_SHIELD]: { sfx: 'sfx_reinforced_shield', voice: 'voice_deprecated' },
    [POWERUP_TYPE.MACHINE_LANGUAGE]: { sfx: 'sfx_machine_gun', voice: 'voice_machine_language' },
    [POWERUP_TYPE.BIT_VACUUM]: { sfx: 'sfx_bit_vacuum', voice: 'voice_bit_vacuum' }, // NUOVO
    [POWERUP_TYPE.PURGE_PROTOCOL]: { sfx: 'sfx_purge_protocol', voice: 'voice_purge_protocol' }, // NUOVO
};


const TRACK_METADATA = {
    // Musiche Menu (caricate da main.js ma i metadati sono qui per consistenza)
    'audio/music_menu_1.ogg': { title: '.NET Surfing', artist: 'U.T.' },
    'audio/music_menu_2.ogg': { title: 'delete.exe', artist: 'U.T.' },
    'audio/music_menu_3.ogg': { title: 'synchronize', artist: 'U.T.' },
    // Musiche di gioco casuali (BGM_PLAYLIST)
    'audio/bgm/track_01.ogg': { title: 'Code Rangers', artist: 'U.T.' },
    'audio/bgm/track_02.ogg': { title: "Summer '97", artist: 'U.T.' },
    'audio/bgm/track_03.ogg': { title: 'combatCode', artist: 'U.T.' },
    'audio/bgm/track_04.ogg': { title: 'Daemon Build', artist: 'U.T.' },
    'audio/bgm/track_05.ogg': { title: 'Debuggator_subroutine', artist: 'U.T.' },
    'audio/bgm/track_06.ogg': { title: 'Deep Space Pursuit', artist: 'U.T.' },
    'audio/bgm/track_07.ogg': { title: 'Enter The Matrix', artist: 'U.T.' },
    'audio/bgm/track_08.ogg': { title: 'target_lock', artist: 'U.T.' },
    'audio/bgm/track_09.ogg': { title: 'GalaxyRush!', artist: 'U.T.' },
    'audio/bgm/track_10.ogg': { title: 'Glitch Rangers', artist: 'U.T.' },
    'audio/bgm/track_11.ogg': { title: "The Donkey's Gallop", artist: 'U.T.' },

    
    
    
    // Musiche Boss
    [GLITCHZILLA_MUSIC_PATH]: { title: 'The Parsing Process', artist: 'U.T.' },
    [TROJAN_BYTE_MUSIC_PATH]: { title: 'Server Hillness', artist: 'U.T.' },
    [MISSING_NUMBER_MUSIC_PATH]: { title: 'Deprecated', artist: 'U.T.' },
    [DUNNO_EXE_MUSIC_PATH]: { title: '-rm -rf', artist: 'U.T.' },
    // Musica Game Over
    [GAME_OVER_MUSIC_PATH]: { title: 'isOver = true', artist: 'U.T.' },
    // Musica di gioco predefinita (se AudioManager.playMusic() la cerca)
    'game_default_music': { title: 'Mainframe Mission', artist: 'UNKNOWN' },
};


export const SKIN_ASSET_MAP = {
    'skin_donkey_default_info': { // This is now a purchasable skin, not just "default"
        walk: 'images/skins/skin_info_walk.png', // Assuming new asset paths for this re-defined skin
        digest: 'images/skins/skin_info_digest.png' // Assuming new asset paths for this re-defined skin
    },
    'skin_donkey_golden_walk': {
        walk: 'images/skins/skin_donkey_golden_walk.png',
        digest: 'images/skins/skin_donkey_golden_digest.png'
    },
    'skin_bullet_log': {
        projectile: 'images/bullets/bullet_log_style.png'
    },
    'skin_bullet_firewall': {
        projectile: 'images/bullets/bullet_firewall_style.png'
    },
    // --- INIZIO NUOVE SKIN ACQUISTABILI ---
    'skin_donkey_cyberpunk': {
        walk: 'images/skins/skin_donkey_cyberpunk_walk.png',
        digest: 'images/skins/skin_donkey_cyberpunk_digest.png'
    },
    'skin_donkey_vintage': {
        walk: 'images/skins/skin_donkey_vintage_walk.png',
        digest: 'images/skins/skin_donkey_vintage_digest.png'
    },
    'skin_donkey_pixelart': {
        walk: 'images/skins/skin_donkey_pixelart_walk.png',
        digest: 'images/skins/skin_donkey_pixelart_digest.png'
    },
    'skin_donkey_malware': {
        walk: 'images/skins/skin_donkey_malware_walk.png',
        digest: 'images/skins/skin_donkey_malware_digest.png'
    },
    'skin_donkey_antivirus': {
        walk: 'images/skins/skin_donkey_antivirus_walk.png',
        digest: 'images/skins/skin_donkey_antivirus_digest.png'
    },
    'skin_donkey_async': {
        walk: 'images/skins/skin_donkey_async_walk.png',
        digest: 'images/skins/skin_donkey_async_digest.png'
    },
    'skin_donkey_javascript': {
        walk: 'images/skins/skin_donkey_javascript_walk.png',
        digest: 'images/skins/skin_donkey_javascript_digest.png'
    },
    'skin_donkey_dev':{ 
        walk: 'images/skins/skin_donkey_dev_walk.png',
        digest: 'images/skin_donkey_dev_digest.png',
    },
    // --- FINE NUOVE SKIN ACQUISTABILI ---
    // --- INIZIO NUOVE SKIN PROIETTILI ACQUISTABILI ---
    'skin_bullet_binary': {
        projectile: 'images/bullets/bullet_binary_style.png'
    },
    'skin_bullet_error': {
        projectile: 'images/bullets/bullet_error_style.png'
    },
    'skin_bullet_cyberwrath': {
        projectile: 'images/bullets/bullet_cyberwrath_style.png'
    },
    'skin_bullet_necron': {
        projectile: 'images/bullets/bullet_necron_style.png'
    },
    'skin_bullet_arcade': {
        projectile: 'images/bullets/bullet_arcade_style.png'
    },
    // --- FINE NUOVE SKIN PROIETTILI ACQUISTABILI ---
    // --- INIZIO SKIN SBLOCCABILI TRAMITE BADGE ---
    'skin_donkey_score_legend': {
        walk: 'images/skins/badge_skins/skin_donkey_score_legend_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_score_legend_digest.png'
    },
    'skin_donkey_bug_whisperer': {
        walk: 'images/skins/badge_skins/skin_donkey_bug_whisperer_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_bug_whisperer_digest.png'
    },
    'skin_donkey_jumper_legend': {
        walk: 'images/skins/badge_skins/skin_donkey_jumper_legend_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_jumper_legend_digest.png'
    },
    'skin_bullet_code_storm': {
        projectile: 'images/bullets/badge_bullets/bullet_code_storm_style.png'
    },
    'skin_donkey_bit_overlord': {
        walk: 'images/skins/badge_skins/skin_donkey_bit_overlord_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_bit_overlord_digest.png'
    },
    'skin_donkey_mission_legend': {
        walk: 'images/skins/badge_skins/skin_donkey_mission_legend_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_mission_legend_digest.png'
    },
    'skin_donkey_powerup_overlord': {
        walk: 'images/skins/badge_skins/skin_donkey_powerup_overlord_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_powerup_overlord_digest.png'
    },
    'skin_donkey_data_guru': {
        walk: 'images/skins/badge_skins/skin_donkey_data_guru_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_data_guru_digest.png'
    },
    'skin_donkey_glitchzilla_slayer': {
        walk: 'images/skins/badge_skins/skin_donkey_glitchzilla_slayer_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_glitchzilla_slayer_digest.png'
    },
    'skin_donkey_trojan_slayer': {
        walk: 'images/skins/badge_skins/skin_donkey_trojan_slayer_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_trojan_slayer_digest.png'
    },
    'skin_donkey_missing_slayer': {
        walk: 'images/skins/badge_skins/skin_donkey_missing_slayer_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_missing_slayer_digest.png'
    },
    'skin_donkey_dunno_slayer': {
        walk: 'images/skins/badge_skins/skin_donkey_dunno_slayer_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_dunno_slayer_digest.png'
    },
    'skin_donkey_fruit_overlord': {
        walk: 'images/skins/badge_skins/skin_donkey_fruit_overlord_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_fruit_overlord_digest.png'
    },
    'skin_donkey_fruit_master': {
        walk: 'images/skins/badge_skins/skin_donkey_fruit_master_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_fruit_master_digest.png'
    },

    // --- FINE SKIN SBLOCCABILI TRAMITE BADGE ---
};

export const COMPANION_KERNEL_4_2_SRC = 'images/companions/kernel_4.2_sprite.png';
export const COMPANION_PROJECTILE_KERNEL_SRC = 'images/companions/proj_kernel_bullet.png';
export const KERNEL_4_2_FRAME_WIDTH = 64;
export const KERNEL_4_2_FRAME_HEIGHT = 64;
export const KERNEL_4_2_NUM_FRAMES = 10;
export const KERNEL_4_2_ANIMATION_SPEED = 0.1;
export const KERNEL_4_2_PROJECTILE_DAMAGE = 2;

// Costanti generali per i compagni (esistenti)
export const COMPANION_FRAME_WIDTH = 32;
export const COMPANION_FRAME_HEIGHT = 32;
export const COMPANION_NUM_FRAMES = 4;
export const COMPANION_ANIMATION_SPEED = 0.15;
export const COMPANION_TARGET_SIZE = 48;
export const DEBUGGATOR_IA_PROJECTILE_DAMAGE = 1


export const COMPANION_CLOUD_ASSISTANT_SRC = 'images/companions/cloud_assistant_sprite.png';
export const COMPANION_DEBUGGATOR_IA_SRC = 'images/companions/debuggator_ia_sprite.png';
export const COMPANION_PROJECTILE_CLOUD_SRC = 'images/companions/proj_cloud_assistant.png';
export const COMPANION_PROJECTILE_DEBUG_SRC = 'images/companions/proj_debuggator_ia.png';

// NUOVO: Mappa degli asset per i compagni (ora usa le costanti definite sopra)
export const COMPANION_ASSET_MAP = {
    'companion_cloud_assistant': {
        sprite: COMPANION_CLOUD_ASSISTANT_SRC,
        projectile: COMPANION_PROJECTILE_CLOUD_SRC,
        frameWidth: COMPANION_FRAME_WIDTH, // AGGIUNGI QUESTE RIGHE
        frameHeight: COMPANION_FRAME_HEIGHT, // AGGIUNGI QUESTE RIGHE
        numFrames: COMPANION_NUM_FRAMES, // AGGIUNGI QUESTE RIGHE
    },
    'companion_debuggator_ia': {
        sprite: COMPANION_DEBUGGATOR_IA_SRC,
        projectile: COMPANION_PROJECTILE_DEBUG_SRC,
        frameWidth: COMPANION_FRAME_WIDTH, // AGGIUNGI QUESTE RIGHE
        frameHeight: COMPANION_FRAME_HEIGHT, // AGGIUNGI QUESTE RIGHE
        numFrames: COMPANION_NUM_FRAMES, // AGGIUNGI QUESTE RIGHE
    },
    'companion_kernel_4_2': {
        sprite: COMPANION_KERNEL_4_2_SRC,
        projectile: COMPANION_PROJECTILE_KERNEL_SRC,
        frameWidth: KERNEL_4_2_FRAME_WIDTH, // AGGIUNGI QUESTE RIGHE
        frameHeight: KERNEL_4_2_FRAME_HEIGHT, // AGGIUNGI QUESTE RIGHE
        numFrames: KERNEL_4_2_NUM_FRAMES, // AGGIUNGI QUESTE RIGHE
    },
};


const PALETTE = {
   DARK_BACKGROUND: '#111827', // Grigio-blu notte scuro
   MEDIUM_PURPLE: '#631b34',
   DARK_TEAL_BLUE: '#32535f',
   MEDIUM_TEAL: '#0b8a8f',
   BRIGHT_TEAL: '#0eaf9b',
   BRIGHT_GREEN_TEAL: '#30e1b9',
   TERMINAL_RED: '#ff5555',
   TERMINAL_YELLOW: '#f1fa8c',
   TERMINAL_ORANGE: '#ffb86c',
   TERMINAL_PURPLE: '#bd93f9',
   TERMINAL_CYAN: '#8be9fd',
   TERMINAL_PINK: '#ff79c6',
   // NUOVI COLORI PER IL TESTO "-sudo"
   SUDO_COLOR_1: '#311f5f',
   SUDO_COLOR_2: '#1687a7',
   SUDO_COLOR_3: '#1fd5bc',
   SUDO_COLOR_4: '#edffb1',
};
// NUOVO: Oggetto per definire i temi visivi di ogni boss
const BOSS_THEMES = {
    'Glitchzilla': { // Boss viola/magenta
        backgroundColor: PALETTE.DARK_BACKGROUND, // MODIFICATO: Sfondo scuro
        particleColors: [PALETTE.BRIGHT_GREEN_TEAL, PALETTE.TERMINAL_RED, PALETTE.TERMINAL_YELLOW]
    },
    'TrojanByte': { // Boss rosso/marrone
        backgroundColor: PALETTE.DARK_BACKGROUND, // MODIFICATO: Sfondo scuro
        particleColors: [PALETTE.TERMINAL_ORANGE, PALETTE.TERMINAL_YELLOW, '#FFFFFF']
    },
    'MissingNumber': { // Boss con glitch colorati
        backgroundColor: '#000000', // Sfondo nero puro per far esplodere i colori del glitch
        particleColors: [PALETTE.TERMINAL_PURPLE, PALETTE.TERMINAL_CYAN, PALETTE.TERMINAL_PINK]
    },
'DUNNO.EXE': { // Nuovo tema per DUNNO.EXE
        backgroundColor: '#1E1E2E', // Un blu molto scuro/violaceo per un'atmosfera cyber
        particleColors: ['#BD93F9', '#FF79C6', '#8BE9FD'] // Viola, rosa, ciano per i glitch
    },
};

const RANDOMLY_SPAWNABLE_POWERUPS = [
    POWERUP_TYPE.TRIPLE_SHOT,
    POWERUP_TYPE.SHIELD,
    POWERUP_TYPE.SMART_BOMB,
    POWERUP_TYPE.FIREWALL,
    POWERUP_TYPE.BLOCK_BREAKER,
    POWERUP_TYPE.MACHINE_LANGUAGE,
    // Aggiungi anche i nuovi power-up generici alla pool se vuoi che possano spawnare casualmente
    // POWERUP_TYPE.BIT_VACUUM, // Sarà un drop specifico da boss
    // POWERUP_TYPE.PURGE_PROTOCOL, // Sarà un drop specifico da boss
];

// Declare global DOM element variables with 'let' and no initial assignment
// They will be assigned in setupGameEngine() once the DOM is ready.
let miniLeaderboardListEl = null;

let creditsModal = null;
let closeCreditsModalBtn = null;
let accordionHeaders = null;
let scrollToTutorialLink = null;
let orientationPromptEl = null;
let dismissOrientationPromptBtn = null;

let canvas = null;
let ctx = null;

let touchOverlayLeft = null;
let touchOverlayRight = null;

let gameContainer = null;
let jumpButton = null;
let shootButton = null;
let mobileControlsDiv = null;
let fullscreenButton = null;
let scoreInputContainerDonkey = null;

let saveScoreBtnDonkey = null;
let restartGameBtnDonkey = null;
let mobileStartButton = null;
let shareScoreBtnDonkey = null;
let backToMenuBtn = null; // Nuovo: Riferimento al pulsante "Torna al Menu"
let accountIconBtn = null; // Nuovo: Riferimento all'icona account/login
let mainMenuBtn = null; // Pulsante per tornare al menu
let accountIconContainer = null; // Riferimento al contenitore dell'icona profilo


let backgroundParticles = [];

let currentGameInstance = 0;
let hasReinforcedShieldSpawned = false;
let isGameInitializing = false; // NUOVO: Flag per indicare un periodo di inizializzazione del gioco
let isRainRunActive = false;


let isTouchDevice = false; // Will be set in setupGameEngine
let isIPhone = false; // Will be set in setupGameEngine

export let activeMiniboss = null;
let bits = 0;

let companionManager = null; // NUOVO: Istanza del CompanionManager
// FINE AGGIUNTA IMPORT E DICHIARAZIONE VARIABILE GLOBALE



// Constants remain 'const'
const groundHeight = 70;

const PLAYER_JUMP_VELOCITY_INITIAL = -850; // px/s (valore da testare/affinare)
const GRAVITY_ACCELERATION = 2000; // px/s^2 (valore da testare/affinare)

let gameSpeed = 220;
const lineWidth = 2;
export const GLOBAL_SPRITE_SCALE_FACTOR = 1.5;

export const WARNING_EXCLAMATION_COLOR = 'red';
const WARNING_EXCLAMATION_FONT = 'bold 28px "Courier New", monospace';
const WARNING_EXCLAMATION_OFFSET_Y = -20;
const WARNING_DURATION = 0.4;

const PLAYER_SPRITESHEET_SRC = 'images/asyncDonkey_walk.png';
const PLAYER_ACTUAL_FRAME_WIDTH = 64;
const PLAYER_ACTUAL_FRAME_HEIGHT = 64;
const PLAYER_NUM_WALK_FRAMES = 5;
const PLAYER_TARGET_WIDTH = PLAYER_ACTUAL_FRAME_WIDTH // * 2;
const PLAYER_TARGET_HEIGHT = PLAYER_ACTUAL_FRAME_HEIGHT // * 2;
const PLAYER_PROJECTILE_SPRITE_SRC = 'images/bitProjectile.png';
const PLAYER_UPGRADED_PROJECTILE_SPRITE_SRC = 'images/playerUpgradedProjectile.png';
const PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH = 24;
const PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8;
const PLAYER_PROJECTILE_NUM_FRAMES = 4;
const PLAYER_PROJECTILE_ANIMATION_SPEED = 0.08;
const PLAYER_PROJECTILE_TARGET_WIDTH = PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const PLAYER_PROJECTILE_TARGET_HEIGHT = PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const PROJECTILE_VERTICAL_OFFSET = 15 * GLOBAL_SPRITE_SCALE_FACTOR;
const PLAYER_DIGEST_SRC = 'images/donkey_digest.png';
const PLAYER_REINFORCED_DIGEST_SRC = 'images/donkey_digest_reinforced.png';
const PLAYER_DIGEST_NUM_FRAMES = 9; // MODIFICA QUESTO VALORE se la tua animazione ha un numero di frame diverso
const MACHINE_LANGUAGE_PROJECTILE_SPRITE_SRC = 'images/machine_language_projectile.png';
const MACHINE_LANGUAGE_PROJECTILE_ACTUAL_FRAME_WIDTH = 16; // Come da specifiche
const MACHINE_LANGUAGE_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8;  // Come da specifiche
const MACHINE_LANGUAGE_PROJECTILE_NUM_FRAMES = 4;
const MACHINE_LANGUAGE_PROJECTILE_TARGET_WIDTH = MACHINE_LANGUAGE_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const MACHINE_LANGUAGE_PROJECTILE_TARGET_HEIGHT = MACHINE_LANGUAGE_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

// NUOVO: Costanti per il proiettile "Rain Run"
const RAIN_PROJECTILE_SPRITE_SRC = 'images/bullets/bullet_rain_style.png'; // Percorso sprite
const RAIN_PROJECTILE_ACTUAL_FRAME_WIDTH = 24; // Larghezza reale di un frame (come da tua intenzione)
const RAIN_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8; // <-- MODIFICATO: Altezza reale di un frame (come da tua intenzione)
const RAIN_PROJECTILE_NUM_FRAMES = 4; // <-- MODIFICATO: Numero di frame (come da tua intenzione)
const RAIN_PROJECTILE_TARGET_WIDTH = RAIN_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const RAIN_PROJECTILE_TARGET_HEIGHT = RAIN_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const RAIN_PROJECTILE_DAMAGE = 1.5; // Infligge 1.5 danno

const RAIN_SPAWN_MULTIPLIER = 0.75; // Per aumentare la frequenza di spawn (0.75 significa 25% più veloci)

//  queste costanti vicino alle altre degli sprite
const BIT_BRONZE_SRC = 'images/bits/bit_bronze.png'; // Valore 1
const BIT_SILVER_SRC = 'images/bits/bit_silver.png'; // Valore 2
const BIT_GOLD_SRC = 'images/bits/bit_gold.png';   // Valore 5
const BIT_PLATINUM_SRC = 'images/bits/bit_platinum.png'; // Valore 10
const BIT_FRAME_WIDTH = 16;
const BIT_FRAME_HEIGHT = 16;
const BIT_NUM_FRAMES = 8; // Modifica se la tua animazione ha più frame
const BIT_TARGET_WIDTH = BIT_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const BIT_TARGET_HEIGHT = BIT_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

// NUOVI: Digital Fruits (Sprite e Costanti)
const DIGITAL_KIWI_SRC = 'images/bits/digital_fruits/digital_kiwi.png';
const DIGITAL_ORANGE_SRC = 'images/bits/digital_fruits/digital_orange.png';
const DIGITAL_PEAR_SRC = 'images/bits/digital_fruits/digital_pear.png';
const DIGITAL_APPLE_SRC = 'images/bits/digital_fruits/digital_apple.png';
const DIGITAL_BANANA_SRC = 'images/bits/digital_fruits/digital_banana.png';
const DIGITAL_BERRY_SRC = 'images/bits/digital_fruits/digital_berry.png';
const DIGITAL_BLUEBERRY_SRC = 'images/bits/digital_fruits/digital_blueberry.png';
const DIGITAL_CHERRY_SRC = 'images/bits/digital_fruits/digital_cherry.png';
const DIGITAL_COCONUT_SRC = 'images/bits/digital_fruits/digital_coconut.png';
const DIGITAL_DRAGONFRUIT_SRC = 'images/bits/digital_fruits/digital_dragonfruit.png';
const DIGITAL_GRAPES_SRC = 'images/bits/digital_fruits/digital_grapes.png';
const DIGITAL_LEMON_SRC = 'images/bits/digital_fruits/digital_lemon.png';
const DIGITAL_MELON_SRC = 'images/bits/digital_fruits/digital_melon.png';
const DIGITAL_PAPAYA_SRC = 'images/bits/digital_fruits/digital_papaya.png';
const DIGITAL_PEACH_SRC = 'images/bits/digital_fruits/digital_peach.png';
const DIGITAL_PINEAPPLE_SRC = 'images/bits/digital_fruits/digital_pineapple.png';
const DIGITAL_STRAWBERRY_SRC = 'images/bits/digital_fruits/digital_strawberry.png';
const DIGITAL_WATERMELON_SRC = 'images/bits/digital_fruits/digital_watermelon.png';
const DIGITAL_FRUIT_FRAME_WIDTH = 16; // Larghezza di un singolo frame dello sprite (da verificare)
const DIGITAL_FRUIT_FRAME_HEIGHT = 16; // Altezza di un singolo frame dello sprite (da verificare)
const DIGITAL_FRUIT_NUM_FRAMES = 1; // Numero di frame nell'animazione (da verificare)
const DIGITAL_FRUIT_TARGET_WIDTH = DIGITAL_FRUIT_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const DIGITAL_FRUIT_TARGET_HEIGHT = DIGITAL_FRUIT_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const DATA_PKG_SRC = 'images/objects/data_pkg.png'; // Pacchetto dati
const RICH_BITS_SRC = 'images/objects/rich_bits.png'; // Bit ricchi (movimento a onda)
const EXTRA_LIFE_SRC = 'images/objects/extra_life.png'; // Vita extra

// Dimensioni e frame per i nuovi collezionabili
const DATA_PKG_FRAME_WIDTH = 32;
const DATA_PKG_FRAME_HEIGHT = 32;
const DATA_PKG_NUM_FRAMES = 6;
const DATA_PKG_TARGET_WIDTH = DATA_PKG_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const DATA_PKG_TARGET_HEIGHT = DATA_PKG_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const RICH_BITS_FRAME_WIDTH = 16;
const RICH_BITS_FRAME_HEIGHT = 16;
const RICH_BITS_NUM_FRAMES = 8;
const RICH_BITS_TARGET_WIDTH = RICH_BITS_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const RICH_BITS_TARGET_HEIGHT = RICH_BITS_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const EXTRA_LIFE_FRAME_WIDTH = 32;
const EXTRA_LIFE_FRAME_HEIGHT = 32;
const EXTRA_LIFE_NUM_FRAMES = 4;
const EXTRA_LIFE_TARGET_WIDTH = EXTRA_LIFE_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const EXTRA_LIFE_TARGET_HEIGHT = EXTRA_LIFE_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const OBSTACLE_SPRITE_SRC = 'images/codeBlock.png';
const OBSTACLE_VAR1_SPRITE_SRC = 'images/codeBlock_var1.png'; 
const OBSTACLE_VAR2_SPRITE_SRC = 'images/codeBlock_var2.png';
const OBSTACLE_VAR3_SPRITE_SRC = 'images/codeBlock_var3.png'; // [FEAT] Nuova variante 3
const OBSTACLE_VAR4_SPRITE_SRC = 'images/codeBlock_var4.png'; // [FEAT] Nuova variante 4
const OBSTACLE_VAR5_SPRITE_SRC = 'images/codeBlock_var5.png'; // [FEAT] Nuova variante 5
const OBSTACLE_ACTUAL_FRAME_WIDTH = 32;
const OBSTACLE_ACTUAL_FRAME_HEIGHT = 32;
const OBSTACLE_NUM_FRAMES = 4;
const OBSTACLE_ANIMATION_SPEED = 0.15;
const OBSTACLE_TARGET_WIDTH = OBSTACLE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const OBSTACLE_TARGET_HEIGHT = OBSTACLE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const OBSTACLE_HEALTH = 1;

const ENEMY_ONE_SPRITE_SRC = 'images/enemyOne.png';
const ENEMY_ONE_ACTUAL_FRAME_WIDTH = 48;
const ENEMY_ONE_ACTUAL_FRAME_HEIGHT = 64;
const ENEMY_ONE_NUM_FRAMES = 4;
const ENEMY_ONE_TARGET_WIDTH = ENEMY_ONE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_ONE_TARGET_HEIGHT = ENEMY_ONE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_TWO_SPRITE_SRC = 'images/enemyTwo.png';
const ENEMY_TWO_ACTUAL_FRAME_WIDTH = 40;
const ENEMY_TWO_ACTUAL_FRAME_HEIGHT = 56;
const ENEMY_TWO_NUM_FRAMES = 4;
const ENEMY_TWO_TARGET_WIDTH = ENEMY_TWO_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_TWO_TARGET_HEIGHT = ENEMY_TWO_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_THREE_BASE_SRC = 'images/enemyThree.png';
const ENEMY_THREE_DMG1_SRC = 'images/enemyThreeDmgOne.png';
const ENEMY_THREE_DMG2_SRC = 'images/enemyThreeDmgTwo.png';
const ENEMY_THREE_ACTUAL_FRAME_WIDTH = 56;
const ENEMY_THREE_ACTUAL_FRAME_HEIGHT = 72;
const ENEMY_THREE_NUM_FRAMES = 4;
const ENEMY_THREE_TARGET_WIDTH = ENEMY_THREE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_THREE_TARGET_HEIGHT = ENEMY_THREE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const ARMORED_ENEMY_HEALTH = 3;

const ENEMY_FOUR_IDLE_SRC = 'images/enemyFour.png';
const ENEMY_FOUR_ACTUAL_FRAME_WIDTH = 48;
const ENEMY_FOUR_ACTUAL_FRAME_HEIGHT = 72;
const ENEMY_FOUR_IDLE_NUM_FRAMES = 4;
const ENEMY_FOUR_TARGET_WIDTH = ENEMY_FOUR_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_FOUR_TARGET_HEIGHT = ENEMY_FOUR_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const SHOOTING_ENEMY_SHOOT_INTERVAL = 2.5;
const SHOOTING_ENEMY_PROJECTILE_SOUND = 'audio/enemy_shoot_light.ogg';

const ENEMY_FOUR_PROJECTILE_SPRITE_SRC = 'images/enemyFourProjectile.png';
const ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_WIDTH = 16;
const ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_HEIGHT = 16;
const ENEMY_FOUR_PROJECTILE_NUM_FRAMES = 4;
const ENEMY_FOUR_PROJECTILE_TARGET_WIDTH = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_FOUR_PROJECTILE_TARGET_HEIGHT = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_FIVE_SPRITE_SRC = 'images/enemyFive.png';
const ENEMY_FIVE_ACTUAL_FRAME_WIDTH = 32;
const ENEMY_FIVE_ACTUAL_FRAME_HEIGHT = 32;
const ENEMY_FIVE_NUM_FRAMES = 4;
const ENEMY_FIVE_TARGET_WIDTH = ENEMY_FIVE_ACTUAL_FRAME_WIDTH * 1.5;
const ENEMY_FIVE_TARGET_HEIGHT = ENEMY_FIVE_ACTUAL_FRAME_HEIGHT * 1.5;

const ENEMY_SIX_BASE_SRC = 'images/enemySix.png';
const ENEMY_SIX_DMG1_SRC = 'images/enemySixDmg1.png';
const ENEMY_SIX_DMG2_SRC = 'images/enemySixDmg2.png';
const ENEMY_SIX_DMG3_SRC = 'images/enemySixDmg3.png';
const ENEMY_SIX_ACTUAL_FRAME_WIDTH = 64;
const ENEMY_SIX_ACTUAL_FRAME_HEIGHT = 80;
const ENEMY_SIX_IDLE_NUM_FRAMES = 4;
const ENEMY_SIX_TARGET_WIDTH = ENEMY_SIX_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_SIX_TARGET_HEIGHT = ENEMY_SIX_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const ARMORED_SHOOTING_ENEMY_HEALTH = 4;
const ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL = 3.0;
const ARMORED_SHOOTING_ENEMY_PROJECTILE_SOUND = 'audio/enemy_shoot_heavy.ogg';

const ENEMY_SIX_PROJECTILE_SPRITE_SRC = 'images/enemySixProjectile.png';
const ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_WIDTH = 20;
const ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_HEIGHT = 20;
const ENEMY_SIX_PROJECTILE_NUM_FRAMES = 4;
const ENEMY_SIX_PROJECTILE_TARGET_WIDTH = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_SIX_PROJECTILE_TARGET_HEIGHT = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

const ENEMY_SEVEN_BASE_SRC = 'images/enemySeven.png';
const ENEMY_SEVEN_DMG1_SRC = 'images/enemySevenDmg1.png';
const ENEMY_SEVEN_ACTUAL_FRAME_WIDTH = 48;
const ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT = 64;
const ENEMY_SEVEN_NUM_FRAMES = 4;
const ENEMY_SEVEN_TARGET_WIDTH = ENEMY_SEVEN_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const ENEMY_SEVEN_TARGET_HEIGHT = ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const TOUGH_BASIC_ENEMY_HEALTH = 2;

const DANGEROUS_FLYING_ENEMY_SRC = 'images/dangerousFlyingEnemy.png';
const DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_WIDTH = 40;
const DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT = 40;
const DANGEROUS_FLYING_ENEMY_NUM_FRAMES = 4;
const DANGEROUS_FLYING_ENEMY_TARGET_WIDTH = DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const DANGEROUS_FLYING_ENEMY_TARGET_HEIGHT = DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const DANGEROUS_FLYING_ENEMY_HEALTH = 1;

// NUOVE COSTANTI: Kamikaze Flying Enemy
const KAMIKAZE_FLYING_ENEMY_SRC = 'images/kamikaze_flying_enemy.png'; // [FEAT] Percorso sprite
const KAMIKAZE_FLYING_ENEMY_ACTUAL_FRAME_WIDTH = 32; // [FEAT] Larghezza frame
const KAMIKAZE_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT = 32; // [FEAT] Altezza frame
const KAMIKAZE_FLYING_ENEMY_NUM_FRAMES = 6; // [FEAT] Numero di frame
const KAMIKAZE_FLYING_ENEMY_TARGET_WIDTH = KAMIKAZE_FLYING_ENEMY_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR; // [FEAT] Dimensioni target
const KAMIKAZE_FLYING_ENEMY_TARGET_HEIGHT = KAMIKAZE_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR; // [FEAT] Dimensioni target
const KAMIKAZE_FLYING_ENEMY_SPEED = 400; // [FEAT] Velocità moderata
const KAMIKAZE_FLYING_ENEMY_HEALTH = 1; // [FEAT] Salute
const KAMIKAZE_FLYING_ENEMY_SCORE_VALUE = 75; // [FEAT] Punti

const GLITCHZILLA_BASE_SRC = 'images/glitchzilla_sprite.png';
const GLITCHZILLA_DMG1_SRC = 'images/glitchzillaDmg1.png';
const GLITCHZILLA_DMG2_SRC = 'images/glitchzillaDmg2.png';
const GLITCHZILLA_DMG3_SRC = 'images/glitchzillaDmg3.png';
const GLITCHZILLA_ACTUAL_FRAME_WIDTH = 96;
const GLITCHZILLA_ACTUAL_FRAME_HEIGHT = 96;
const GLITCHZILLA_NUM_FRAMES = 8;
const GLITCHZILLA_TARGET_WIDTH =GLITCHZILLA_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR * 1.5;
const GLITCHZILLA_TARGET_HEIGHT = GLITCHZILLA_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR * 1.5;
const GLITCHZILLA_HEALTH = 100; // 40
const GLITCHZILLA_SCORE_VALUE = 500;
const GLITCHZILLA_SPAWN_SCORE_THRESHOLD = 2000;

const GLITCHZILLA_PROJECTILE_SPRITE_SRC = 'images/glitchzillaProjectile.png';
const GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_WIDTH = 24;
const GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_HEIGHT = 24;
const GLITCHZILLA_PROJECTILE_NUM_FRAMES = 4;
const GLITCHZILLA_PROJECTILE_TARGET_WIDTH = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const GLITCHZILLA_PROJECTILE_TARGET_HEIGHT = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

// Aggiungi queste nuove costanti relative a Glitchzilla
const GLITCHZILLA_ATTACK_SRC = 'images/glitchzilla_attack_sprite.png'; // [FEAT] Nuovo sprite per l'attacco di Glitchzilla
const GLITCHZILLA_ATTACK_NUM_FRAMES = 4; // [FEAT] Il tuo sprite di attacco è 96x96 con 4 frames

const GLITCHZILLA_SPECIAL_PROJECTILE_SRC = 'images/glitchzilla_special_projectile.png'; // [FEAT] Nuovo sprite per il proiettile speciale
const GLITCHZILLA_SPECIAL_PROJECTILE_ACTUAL_FRAME_WIDTH = 16; // [FEAT] Larghezza frame proiettile speciale
const GLITCHZILLA_SPECIAL_PROJECTILE_ACTUAL_FRAME_HEIGHT = 16; // [FEAT] Altezza frame proiettile speciale
const GLITCHZILLA_SPECIAL_PROJECTILE_NUM_FRAMES = 4; // [FEAT] Numero di frame proiettile speciale
const GLITCHZILLA_SPECIAL_PROJECTILE_TARGET_WIDTH = GLITCHZILLA_SPECIAL_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR; // [FEAT] Dimensione finale
const GLITCHZILLA_SPECIAL_PROJECTILE_TARGET_HEIGHT = GLITCHZILLA_SPECIAL_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR; // [FEAT] Dimensione finale
const GLITCHZILLA_SPECIAL_PROJECTILE_SPEED = 700; // [FEAT] Velocità del proiettile speciale (molto veloce)

// --- TROJAN_BYTE (Boss 2) Constants ---
const TROJAN_BYTE_BASE_SRC = 'images/trojanByte_base.png';
const TROJAN_BYTE_DMG1_SRC = 'images/trojanByte_dmg1.png';
const TROJAN_BYTE_DMG2_SRC = 'images/trojanByte_dmg2.png';
const TROJAN_BYTE_DMG3_SRC = 'images/trojanByte_dmg3.png';
const TROJAN_BYTE_ACTUAL_FRAME_WIDTH = 80; // Larghezza sprite suggerita
const TROJAN_BYTE_ACTUAL_FRAME_HEIGHT = 80; // Altezza sprite suggerita
const TROJAN_BYTE_NUM_FRAMES = 4; // Assumendo 4 frame per animazione
const TROJAN_BYTE_TARGET_WIDTH = TROJAN_BYTE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR * 1.1; // Leggermente più grande di glitchzilla
const TROJAN_BYTE_TARGET_HEIGHT = TROJAN_BYTE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR * 1.1;
const TROJAN_BYTE_HEALTH = 180; // HP suggeriti 80
const TROJAN_BYTE_SCORE_VALUE = 1000; // Valore punteggio
const TROJAN_BYTE_SPAWN_SCORE_THRESHOLD = 5000; // Soglia di apparizione 5000
const TROJAN_BYTE_PROJECTILE_SPRITE_SRC = 'images/trojanByteProjectile.png';
const TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_WIDTH = 16;
const TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_HEIGHT = 16;
const TROJAN_BYTE_PROJECTILE_NUM_FRAMES = 4; // Assumendo 4 frame per animazione
const TROJAN_BYTE_PROJECTILE_TARGET_WIDTH = TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const TROJAN_BYTE_PROJECTILE_TARGET_HEIGHT = TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const TROJAN_BYTE_PROJECTILE_SPEED = 200; // Velocità proiettili
const TROJAN_BYTE_ZIGZAG_PROJECTILE_SPRITE_SRC = 'images/trojan_zigzag_projectile.png';
const TROJAN_BYTE_ZIGZAG_PROJECTILE_FRAME_WIDTH = 24;
const TROJAN_BYTE_ZIGZAG_PROJECTILE_FRAME_HEIGHT = 24;
const TROJAN_BYTE_ZIGZAG_PROJECTILE_NUM_FRAMES = 4;
const TROJAN_BYTE_ZIGZAG_PROJECTILE_TARGET_WIDTH = TROJAN_BYTE_ZIGZAG_PROJECTILE_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const TROJAN_BYTE_ZIGZAG_PROJECTILE_TARGET_HEIGHT = TROJAN_BYTE_ZIGZAG_PROJECTILE_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;

// NUOVI: Trojan Byte Charged Projectile
const TROJAN_CHARGED_PROJECTILE_SRC = 'images/trojan_charged_projectile.png'; // Percorso del tuo nuovo sprite
const TROJAN_CHARGED_PROJECTILE_ACTUAL_FRAME_WIDTH = 24; // La larghezza del frame del tuo sprite
const TROJAN_CHARGED_PROJECTILE_ACTUAL_FRAME_HEIGHT = 24; // L'altezza del frame del tuo sprite
const TROJAN_CHARGED_PROJECTILE_NUM_FRAMES = 4; // Il numero di frame del tuo sprite
const TROJAN_CHARGED_PROJECTILE_TARGET_WIDTH = TROJAN_CHARGED_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const TROJAN_CHARGED_PROJECTILE_TARGET_HEIGHT = TROJAN_CHARGED_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const TROJAN_CHARGED_PROJECTILE_SPEED = 500; // Velocità del nuovo proiettile (veloce)

// NUOVI SUONI per Trojan Byte
const SFX_TROJAN_CHARGE = 'sfx_trojan_charge'; // Suono di carica del boss
const SFX_TROJAN_LAUNCH = 'sfx_trojan_launch'; // Suono di lancio del proiettile

// --- MISSING_NUMBER (Boss 3) Constants ---
const MISSING_NUMBER_BASE_SRC = 'images/missingNumber_base.png';
const MISSING_NUMBER_DMG1_SRC = 'images/missingNumber_dmg1.png';
const MISSING_NUMBER_DMG2_SRC = 'images/missingNumber_dmg2.png';
const MISSING_NUMBER_DMG3_SRC = 'images/missingNumber_dmg3.png';
const MISSING_NUMBER_ACTUAL_FRAME_WIDTH = 70; // Larghezza sprite suggerita
const MISSING_NUMBER_ACTUAL_FRAME_HEIGHT = 70; // Altezza sprite suggerita
const MISSING_NUMBER_NUM_FRAMES = 4; // Assumendo 4 frame per animazione
const MISSING_NUMBER_TARGET_WIDTH = MISSING_NUMBER_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR * 1.1;
const MISSING_NUMBER_TARGET_HEIGHT = MISSING_NUMBER_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR * 1.1;
const MISSING_NUMBER_HEALTH = 250; // HP suggeriti
const MISSING_NUMBER_SCORE_VALUE = 1500; // Valore punteggio
const MISSING_NUMBER_SPAWN_SCORE_THRESHOLD = 10000; // Soglia di apparizione 10000
const MISSING_NUMBER_PROJECTILE_SPRITE_SRC = 'images/missingNumberProjectile.png';
const MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_WIDTH = 12;
const MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_HEIGHT = 12;
const MISSING_NUMBER_PROJECTILE_NUM_FRAMES = 4; // Assumendo 4 frame per animazione
const MISSING_NUMBER_PROJECTILE_TARGET_WIDTH =
    MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const MISSING_NUMBER_PROJECTILE_TARGET_HEIGHT =
    MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const MISSING_NUMBER_PROJECTILE_SPEED = 300; // Velocità proiettili più piccoli

// NUOVE COSTANTI: MissingNumber attacchi aggiuntivi
const MISSING_NUMBER_ENTITY_SRC = 'images/missingNumber_entity.png';
const MISSING_NUMBER_ENTITY_ACTUAL_FRAME_WIDTH = 12;
const MISSING_NUMBER_ENTITY_ACTUAL_FRAME_HEIGHT = 24;
const MISSING_NUMBER_ENTITY_NUM_FRAMES = 4;
const MISSING_NUMBER_ENTITY_TARGET_WIDTH = MISSING_NUMBER_ENTITY_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const MISSING_NUMBER_ENTITY_TARGET_HEIGHT = MISSING_NUMBER_ENTITY_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const MISSING_NUMBER_ENTITY_SPEED = 350;

const MISSING_NUMBER_FAST_PROJECTILE_SRC = 'images/missingNumber_fastProjectile.png';
const MISSING_NUMBER_FAST_PROJECTILE_ACTUAL_FRAME_WIDTH = 12;
const MISSING_NUMBER_FAST_PROJECTILE_ACTUAL_FRAME_HEIGHT = 24;
const MISSING_NUMBER_FAST_PROJECTILE_NUM_FRAMES = 4;
const MISSING_NUMBER_FAST_PROJECTILE_TARGET_WIDTH = MISSING_NUMBER_FAST_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const MISSING_NUMBER_FAST_PROJECTILE_TARGET_HEIGHT = MISSING_NUMBER_FAST_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const MISSING_NUMBER_FAST_PROJECTILE_SPEED = 800;



// --- DUNNO.EXE (Boss 4) Constants ---
const DUNNO_EXE_BASE_SRC = 'images/dunnoExe_flying.png';
const DUNNO_EXE_DMG1_SRC = 'images/dunnoExe_flying_DMG1.png';
const DUNNO_EXE_LANDED_SHIELD_OFF_SRC = 'images/dunnoExe_landed_shieldOff.png';
const DUNNO_EXE_LANDED_SHIELD_ON_SRC = 'images/dunnoExe_landed_shieldOn.png';
const DUNNO_EXE_ACTUAL_FRAME_WIDTH = 80; // Da definire, un valore sensato per un boss volante di circa 100px di larghezza visiva
const DUNNO_EXE_ACTUAL_FRAME_HEIGHT = 80; // Da definire, un valore sensato per un boss volante di circa 100px di altezza visiva
const DUNNO_EXE_NUM_FRAMES = 4; // Tutti gli sprite del boss hanno 4 frame
const DUNNO_EXE_TARGET_WIDTH = DUNNO_EXE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR * 1.2; // Dimensione più grande
const DUNNO_EXE_TARGET_HEIGHT = DUNNO_EXE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR * 1.2;
const DUNNO_EXE_HEALTH = 300; // HP suggeriti
const DUNNO_EXE_SCORE_VALUE = 2500; // Valore punteggio
const DUNNO_EXE_SPAWN_SCORE_THRESHOLD = 20000; // Soglia di apparizione 20000


const DUNNO_EXE_PROJECTILE_1_SRC = 'images/dunnoExe_projectile_1.png'; // Proiettile piccolo che scende
const DUNNO_EXE_PROJECTILE_1_FRAME_WIDTH = 16;
const DUNNO_EXE_PROJECTILE_1_FRAME_HEIGHT = 16;
const DUNNO_EXE_PROJECTILE_1_NUM_FRAMES = 4;
const DUNNO_EXE_PROJECTILE_1_TARGET_WIDTH = DUNNO_EXE_PROJECTILE_1_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const DUNNO_EXE_PROJECTILE_1_TARGET_HEIGHT = DUNNO_EXE_PROJECTILE_1_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const DUNNO_EXE_PROJECTILE_1_SPEED = 250; // Velocità per il tipo 1

const DUNNO_EXE_PROJECTILE_2_SRC = 'images/dunnoExe_projectile_2.png'; // Proiettile grande che scompare e ricompare
const DUNNO_EXE_PROJECTILE_2_FRAME_WIDTH = 32;
const DUNNO_EXE_PROJECTILE_2_FRAME_HEIGHT = 32;
const DUNNO_EXE_PROJECTILE_2_NUM_FRAMES = 4;
const DUNNO_EXE_PROJECTILE_2_TARGET_WIDTH = DUNNO_EXE_PROJECTILE_2_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const DUNNO_EXE_PROJECTILE_2_TARGET_HEIGHT = DUNNO_EXE_PROJECTILE_2_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const DUNNO_EXE_PROJECTILE_2_SPEED = 150; // Velocità lenta

const DUNNO_EXE_PROJECTILE_3_SRC = 'images/dunnoExe_projectile_3.png'; // Proiettile medio veloce con pause lunghe
const DUNNO_EXE_PROJECTILE_3_FRAME_WIDTH = 24;
const DUNNO_EXE_PROJECTILE_3_FRAME_HEIGHT = 24;
const DUNNO_EXE_PROJECTILE_3_NUM_FRAMES = 4;
const DUNNO_EXE_PROJECTILE_3_TARGET_WIDTH = DUNNO_EXE_PROJECTILE_3_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const DUNNO_EXE_PROJECTILE_3_TARGET_HEIGHT = DUNNO_EXE_PROJECTILE_3_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const DUNNO_EXE_PROJECTILE_3_SPEED = 400; // Velocità molto veloce

// --- SLAYER_SUBROUTINE (Power-Up Permanente) Constants ---
const SLAYER_PROJECTILE_SPRITE_SRC = 'images/slay_projectile.png'; // Percorso sprite proiettile
const SLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH = 24;
const SLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8;
const SLAYER_PROJECTILE_NUM_FRAMES = 4;
const SLAYER_PROJECTILE_TARGET_WIDTH = SLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const SLAYER_PROJECTILE_TARGET_HEIGHT = SLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const SLAYER_PROJECTILE_DAMAGE = 2; // Danno del proiettile slayer

// --- CODE_INJECTOR (Power-Up Permanente) Constants ---
const CODE_INJECTOR_PROJECTILE_SPRITE_SRC = 'images/inject_projectile.png'; // Percorso sprite proiettile
const CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_WIDTH = 24;
const CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_HEIGHT = 8;
const CODE_INJECTOR_PROJECTILE_NUM_FRAMES = 4;
const CODE_INJECTOR_PROJECTILE_TARGET_WIDTH = CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_WIDTH * GLOBAL_SPRITE_SCALE_FACTOR;
const CODE_INJECTOR_PROJECTILE_TARGET_HEIGHT =
    CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_HEIGHT * GLOBAL_SPRITE_SCALE_FACTOR;
const CODE_INJECTOR_PROJECTILE_DAMAGE = 3; // Danno del proiettile injector

const ENEMY_PROJECTILE_SPEED = 250;


// SEZIONE soundsToLoad
// Assicurati che tutte le costanti di suono siano dichiarate PRIMA di questo array.
const soundsToLoad = [
    // Suoni Esistenti
    { name: 'jump', path: 'audio/jump.ogg' },
    { name: 'shoot', path: 'audio/shoot.ogg' },
    { name: 'enemyHit', path: 'audio/enemy_hit.ogg' },
    { name: 'enemyExplode', path: 'audio/enemy_explode.ogg' },
    { name: 'playerHit', path: 'audio/player_hit.ogg' },
    { name: 'shieldBlock', path: 'audio/shield_block.ogg' },
    { name: 'blockBreak', path: 'audio/block_break.ogg' },
    { name: 'enemyShootLight', path: 'audio/enemy_shoot_light.ogg' },
    { name: 'enemyShootHeavy', path: 'audio/enemy_shoot_heavy.ogg' },
    { name: 'glitchzillaSpawn', path: 'audio/glitchzilla_spawn.ogg' },
    { name: 'glitchzillaHit', path: 'audio/glitchzilla_hit.ogg' },
    { name: 'glitchzillaAttack', path: 'audio/glitchzilla_attack.ogg' },
    // Nuovi Suoni v1.4
    { name: 'gameOverImpact', path: 'audio/game_over_impact.mp3' },
    { name: 'bossDefeat', path: 'audio/boss/boss_defeat.ogg' },
    // Caricamento suoni Power-Up
    ...Object.values(POWERUP_SOUND_MAP).flatMap(sounds => [
        { name: sounds.sfx, path: `audio/powerups/sfx/${sounds.sfx}.mp3` },
        { name: sounds.voice, path: `audio/powerups/voice/${sounds.voice}.mp3` }
    ]),
    { name: 'music_menu_1', path: 'audio/music_menu_1.ogg' },
    { name: 'music_menu_2', path: 'audio/music_menu_2.ogg' },
    { name: 'music_menu_3', path: 'audio/music_menu_3.ogg' },
    { name: 'gameStart', path: 'audio/sfx_start_game.ogg' },
    { name: 'sfx_menu_eat', path: 'audio/sfx/sfx_menu_eat.ogg' },
    { name: 'sfx_donkey_digest', path: 'audio/sfx/sfx_donkey_digest.ogg' },
    { name: 'sfx_donkey_comment', path: 'audio/sfx/sfx_donkey_comment.ogg' },
    { name: 'sfx_thunder_clap', path: 'audio/sfx/sfx_thunder_clap.ogg' },
    { name: 'sfx_trojan_normal', path: 'audio/sfx_trojan_normal.ogg' },
    { name: 'sfx_trojan_special', path: 'audio/sfx_trojan_special.ogg' },
    { name: 'bitCollect', path: 'audio/bit_collect.ogg' },
    { name: 'missingNumberSpawn', path: 'audio/missing_number_spawn.ogg' },
    { name: 'sfx_mission_complete', path: 'audio/missions/sfx/sfx_mission_complete.mp3' },
    { name: 'sfx_mission_failed', path: 'audio/missions/sfx/sfx_mission_failed.mp3' },
    { name: 'sfx_hum', path: 'audio/sfx/sfx_hum.mp3'},
    { name: SFX_FRUIT_COLLECT, path: 'audio/sfx_fruit_collect.ogg' },
    { name: SFX_CLOUD_SHOT, path: 'audio/sfx_cloud_shot.ogg' },
    { name: SFX_DEBUG_SHOT, path: 'audio/sfx_debug_shot.ogg' },
    { name: SFX_PROJECTILE_DIGEST, path: 'audio/sfx_projectile_digest.ogg' },
    // NUOVI SUONI di Glitchzilla
    { name: SFX_GLITCHZILLA_SPECIAL_ATTACK, path: 'audio/sfx_glitchzilla_special_attack.ogg' },
    { name: SFX_GLITCHZILLA_TARGET_LOCK, path: 'audio/sfx_glitchzilla_target_lock.ogg' },
    // NUOVI SUONI di MissingNumber
    { name: SFX_MISSING_NUMBER_ENTITY_SPAWN, path: 'audio/missingNumber_pip.ogg' }, // Usato come placeholder
    { name: SFX_MISSING_NUMBER_FAST_ATTACK, path: 'audio/enemy_shoot_heavy.ogg' }, // Usato come placeholder
    { name: SFX_KERNEL_SHOT, path: 'audio/sfx/kernel_shot.ogg' }, // Percorso per il suono di sparo di Kernel 4.2
    { name: SFX_COMPANION_FRUIT_COLLECT, path: 'audio/sfx/companion_fruit_collect.ogg' }, // Percorso per il suono di raccolta frutta del compagno
    { name: SFX_TROJAN_CHARGE, path: 'audio/sfx_trojan_charge.mp3' }, // Aggiungi il suono di carica
    { name: SFX_TROJAN_LAUNCH, path: 'audio/sfx_trojan_launch.mp3' }, // Aggiungi il suono di lancio
    { name: SFX_GLITCHZILLA_LOADING_SHOT, path: 'audio/sfx_glitchzilla_loading_shot.mp3' }, // NUOVO
    { name: SFX_MISSING_NUMBER_LOADING_SHOT, path: 'audio/sfx_missing_number_loading_shot.mp3' }, // NUOVO
];



const POWERUP_THEMATIC_NAMES = {
    [POWERUP_TYPE.TRIPLE_SHOT]: 'Multi-Thread',
    [POWERUP_TYPE.SHIELD]: 'Active Shield',
    [POWERUP_TYPE.SMART_BOMB]: 'System Cleanup',
    [POWERUP_TYPE.DEBUG_MODE]: 'Debug Payload',
    [POWERUP_TYPE.FIREWALL]: 'Solid Firewall',
    [POWERUP_TYPE.BLOCK_BREAKER]: 'Decompiler',
    [POWERUP_TYPE.SLAYER_SUBROUTINE]: 'Slayer Subroutine', // Nuovo nome tematico
    [POWERUP_TYPE.CODE_INJECTOR]: 'Code Injector', // Nuovo nome tematico
[POWERUP_TYPE.BIT_VACUUM]: 'Bit Vacuum Field', // NUOVO
    [POWERUP_TYPE.PURGE_PROTOCOL]: 'Purge Protocol Beta', // NUOVO
};


function setupRenderingContext(context) {
    context.imageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    console.log('Image smoothing disabilitato.');
}

export const GAME_STATE = { MENU: 'MENU', PLAYING: 'PLAYING', GAME_OVER: 'GAME_OVER' };
export let currentGameState = GAME_STATE.MENU;
let asyncDonkey = null;
let playerInitialX = 50;
let playerInitialY = 0;

let images = {};
const imagesToLoad = [];

let imagesLoadedCount = 0;
let allImagesLoaded = false;
let resourcesInitialized = false;
let gameLoopRequestId = null;

let bossFightImminent = false;
let bossWarningTimer = 2.0;
let postBossCooldownActive = false;
let postBossCooldownTimer = 2.0;

export let collectibles = [];
export let obstacles = [];
let obstacleSpawnTimer = 0;
let nextObstacleSpawnTime = 0;

let projectiles = [];
let canShoot = true;
let shootTimer = 0;
const projectileSpeed = 400;
const shootCooldownTime = 0.3;

export let enemies = [];
let enemyBaseSpawnTimer = 0;
let nextEnemyBaseSpawnTime = 0;

export let flyingEnemies = [];
let flyingEnemySpawnTimer = 0;
let nextFlyingEnemySpawnTime = 0;
const flyingEnemyScoreValue = 100;
const POWER_UP_DROP_CHANCE_FROM_FLYING_ENEMY = 0.35;

export let fastEnemies = [];
let fastEnemySpawnTimer = 0;
let nextFastEnemySpawnTime = 0;
const fastEnemySpeedMultiplier = 1.5;

export let armoredEnemies = [];
let armoredEnemySpawnTimer = 0;
let nextArmoredEnemySpawnTime = 0;
const armoredEnemySpeedMultiplier = 0.7;

export let shootingEnemies = [];
let shootingEnemySpawnTimer = 0;
let nextShootingEnemySpawnTime = 0;
let enemyProjectiles = [];
let floatingTexts = [];  

export let kamikazeFlyingEnemies = []; // [FEAT] Array per i nuovi nemici volanti kamikaze
let kamikazeFlyingEnemySpawnTimer = 0; // [FEAT] Timer per lo spawn
let nextKamikazeFlyingEnemySpawnTime = 0; // [FEAT] Prossimo tempo di spawn

// let collectibleBits = []; 
let bitSpawnTimer = 0;    
let nextBitSpawnTime = 0; 

// let extraLifeItems = [];
// let richBitsItems = [];
// let dataPackageItems = [];
// let digitalFruitItems = [];


let extraLifeSpawnTimer = 0;
let nextExtraLifeSpawnTime = 0;
let richBitsSpawnTimer = 0;
let nextRichBitsSpawnTime = 0;
let dataPackageSpawnTimer = 0;
let nextDataPackageSpawnTime = 0;
let digitalFruitSpawnTimer = 0;
let nextDigitalFruitSpawnTime = 0;

let hasExtraLifeSpawnedThisGame = false; // NUOVO: Flag per garantire solo 1 spawn di Extra Life per partita


export let armoredShootingEnemies = [];
let armoredShootingEnemySpawnTimer = 0;
let nextArmoredShootingEnemySpawnTime = 0;

export let toughBasicEnemies = [];
let toughBasicEnemySpawnTimer = 0;
let nextToughBasicEnemySpawnTime = 0;

export let dangerousFlyingEnemies = [];
let dangerousFlyingEnemySpawnTimer = 0;
let nextDangerousFlyingEnemySpawnTime = 0;

let hasGlitchzillaSpawnedThisGame = false; // Flag per tracciare se Glitchzilla è SPAWNATO in questa partita (trigger della sua comparsa)
let isGlitchzillaDefeatedThisGame = false; // Nuovo: Flag per tracciare se Glitchzilla è STATO SCONFITTO in questa partita
let hasTrojanByteSpawnedThisGame = false; // Flag per tracciare se Trojan_Byte è SPAWNATO
let isTrojanByteDefeatedThisGame = false; // Nuovo: Flag per tracciare se Trojan_Byte è STATO SCONFITTO
let hasMissingNumberSpawnedThisGame = false; // Flag per tracciare se Missing_Number è SPAWNATO
let isMissingNumberDefeatedThisGame = false; // Nuovo: Flag per tracciare se Missing_Number è STATO SCONFITTO
let hasDunnoExeSpawnedThisGame = false; // NUOVO: Flag per tracciare se DUNNO.EXE è SPAWNATO
let isDunnoExeDefeatedThisGame = false; // NUOVO: Flag per tracciare se DUNNO.EXE è STATO SCONFITTO

let hasSlayerSubroutineUpgrade = false;
let hasCodeInjectorUpgrade = false;
let hasDebugModeUpgrade = false;

let powerUpItems = [];
let powerUpSpawnTimer = 0;
let nextPowerUpSpawnTime = 0;

// NUOVO: Riferimenti agli elementi DOM della pausa
let pauseButton = null;
let pauseModal = null;
let resumeGameBtn = null;
let restartGameFromPauseBtn = null;
let mainMenuFromPauseBtn = null;

// NUOVO BLOCCO IMPORTANTE: Variabili globali per pioggia e tuoni in-game
let isRainingInGame = false;
let gameRainParticles = [];
let thunderclapGameTimer = 0;
let nextThunderclapGameInterval = 0;
let isFlashingGame = false;
let flashGameTimer = 0;
const FLASH_GAME_DURATION = 0.1; // Durata del lampo in secondi

const SCORE_THRESHOLD_FAST_ENEMY = 200;
const SCORE_THRESHOLD_ARMORED_ENEMY = 450;
const SCORE_THRESHOLD_SHOOTING_ENEMY = 700;
const SCORE_THRESHOLD_ARMORED_SHOOTING_ENEMY = 1000;
const SCORE_THRESHOLD_TOUGH_BASIC_ENEMY = 150;
const SCORE_THRESHOLD_DANGEROUS_FLYING_ENEMY = 800;
const TASTY_BUG_MESSAGES = ["Tasty bug!", "Mmm, data!", "Yummy!", "+10 bits", "CRUNCH!", "Buffer++"];

let score = 0;
let finalScore = 0;
let gameOverTrigger = false;
let lastTime = 0;
let isShootingHeld = false; // <--  QUESTA RIGA


let gameStats = {
    jumps: 0,
    shotsFired: 0,
    powerUpsCollected: 0,
    missionsCompleted: 0,
    missionBitsEarned: 0,
    slayerCollected: false,
    injectorCollected: false,
    debugCollected: false,
    enemiesDefeated: 0,
    dataPacketsCollected: 0,
    // NUOVO: Contatori per i Digital Fruits raccolti in-game
    digitalKiwiCollected: 0,
    digitalOrangeCollected: 0,
    digitalPearCollected: 0,
    digitalAppleCollected: 0,
        digitalBananaCollected: 0,
        digitalBerryCollected: 0,
        digitalBlueberryCollected: 0,
        digitalCherryCollected: 0,
        digitalCoconutCollected: 0,
        digitalDragonfruitCollected: 0,
        digitalGrapesCollected: 0,
        digitalLemonCollected: 0,
        digitalMelonCollected: 0,
        digitalPapayaCollected: 0,
        digitalPeachCollected: 0,
        digitalPineappleCollected: 0,
        digitalStrawberryCollected: 0,
        digitalWatermelonCollected: 0,
    
    digitalFruitsCollected: 0, // Contatore totale per la run
    rainRunEnemiesDefeated: 0, // Inizializzato a 0
};
window.addGameBits = (amount) => {
    bits += amount;
    gameStats.missionBitsEarned += amount; 
    floatingTexts.push(new FloatingText(asyncDonkey.x + asyncDonkey.displayWidth / 2, asyncDonkey.y - 40, `+${amount} Bit Mission!`));
    AudioManager.playSound('bitCollect', false, 0.7); // Usa lo stesso suono per coerenza
};

// NUOVO: Funzione per incrementare il contatore delle missioni completate
window.incrementMissionsCompleted = () => {
    gameStats.missionsCompleted++;
};


// --- NUOVA FUNZIONE: Recupera l'inventario dell'utente locale da IndexedDB ---
/**
 * Fetches the current local user's inventory from IndexedDB.
 * @returns {Promise<object | null>} The user's inventory object or null if data not found.
 */
async function getAuthenticatedUserInventory() {
    // In un contesto offline, l'utente è sempre 'default_offline_user'
    const localUserId = 'default_offline_user';
    try {
        await openOfflineDB(); // Assicurati che il database sia aperto
        const userProfile = await getUser(localUserId);
        if (userProfile) {
            return userProfile.inventory || null;
        }
    } catch (error) {
        console.error("[donkeyRunner.js] Errore nel recuperare l'inventario utente da IndexedDB:", error);
    }
    return null;
}



function getUrlParameter(name) {
    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function spawnBitIfNeeded(dt) {
    bitSpawnTimer += dt;
    if (bitSpawnTimer >= nextBitSpawnTime) {
        const yPos = 100 + Math.random() * (canvas.height - groundHeight - 200);

        const rand = Math.random();
        let bitType;
        if (rand < 0.05) { 
            bitType = 'gold';
        } else if (rand < 0.30) { 
            bitType = 'silver';
        } else { 
            bitType = 'bronze';
        }

        collectibles.push(new Bit(canvas.width, yPos, bitType)); 

        bitSpawnTimer = 0;
        nextBitSpawnTime = 0.5 + Math.random() * 1.5; 
    }
}

function spawnExtraLifeIfNeeded(dt) {
    if (hasExtraLifeSpawnedThisGame || asyncDonkey.health >= asyncDonkey.maxHealth) {
        extraLifeSpawnTimer = 0; 
        nextExtraLifeSpawnTime = calculateNextExtraLifeSpawnTime(); 
        return;    
    }

    extraLifeSpawnTimer += dt;
    if (extraLifeSpawnTimer >= nextExtraLifeSpawnTime) {
        const yPos = 50 + Math.random() * (canvas.height - groundHeight - EXTRA_LIFE_TARGET_HEIGHT - 100);
        collectibles.push(new ExtraLifeCollectible(canvas.width, yPos)); 
        hasExtraLifeSpawnedThisGame = true; 
        extraLifeSpawnTimer = 0; 
    }
}

function spawnRichBitsIfNeeded(dt) {
    richBitsSpawnTimer += dt;
    if (richBitsSpawnTimer >= nextRichBitsSpawnTime) {
        const yPos = 80 + Math.random() * (canvas.height - groundHeight - RICH_BITS_TARGET_HEIGHT - 120);
        collectibles.push(new RichBitsCollectible(canvas.width, yPos)); 
        richBitsSpawnTimer = 0; 
        nextRichBitsSpawnTime = calculateNextRichBitsSpawnTime(); 
    }
}

function spawnDataPackageIfNeeded(dt) {
    dataPackageSpawnTimer += dt;
    if (dataPackageSpawnTimer >= nextDataPackageSpawnTime) {
        const yPos = 100 + Math.random() * (canvas.height - groundHeight - DATA_PKG_TARGET_HEIGHT - 150);
        collectibles.push(new DataPackageCollectible(canvas.width, yPos)); 
        dataPackageSpawnTimer = 0; 
        nextDataPackageSpawnTime = calculateNextDataPackageSpawnTime(); 
    }
}

function spawnDigitalFruitIfNeeded(dt) {
    digitalFruitSpawnTimer += dt;
    if (digitalFruitSpawnTimer >= nextDigitalFruitSpawnTime) {
        // --- INIZIO NUOVI TIPI DIGITAL FRUITS ---
        const fruitTypes = [
            'kiwi', 'orange', 'pear', 'apple', 'banana', 'berry',
            'blueberry', 'cherry', 'coconut', 'dragonfruit', 'grapes',
            'lemon', 'melon', 'papaya', 'peach', 'pineapple',
            'strawberry', 'watermelon'
        ];
        // --- FINE NUOVI TIPI DIGITAL FRUITS ---
        const chosenFruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        const yPos = 50 + Math.random() * (canvas.height - groundHeight - DIGITAL_FRUIT_TARGET_HEIGHT - 100);
        collectibles.push(new DigitalFruitCollectible(canvas.width, yPos, chosenFruitType)); 
        
        digitalFruitSpawnTimer = 0;
        nextDigitalFruitSpawnTime = calculateNextDigitalFruitSpawnTime();
    }
}

async function handleShareScore() {
    console.log('handleShareScore attivato!');

    if (typeof finalScore === 'undefined' || finalScore < 0) {
        showToast('Nessun punteggio valido da condividere.', 'warning');
        return;
    }

    let challengerName = 'un Asinello Pixelato'; // Nome di default più amichevole
    // In un contesto offline, currentUserData è già disponibile globalmente
    // e non c'è un "currentUser" di Firebase Auth
    if (currentUserData && currentUserData.nickname) {
        challengerName = currentUserData.nickname;
    } else {
        // Fallback per un utente locale senza nickname specifico
        challengerName = 'Offline Player';
    }

    // Poiché non ci sono classifiche online, la condivisione sarà solo un messaggio locale
    // o un link generico senza parametri di sfida specifici.
    const siteBaseUrl = 'https://codedash.asynced.org'; // Usiamo il link diretto al gioco
    const simpleShareText = `Ho totalizzato ${finalScore} punti su codeDash! Scarica il gioco e prova a battermi! 🎮 ${siteBaseUrl}`;

    console.log('Testo condivisione:', simpleShareText);

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Sfida su codeDash da ${challengerName}!`,
                text: simpleShareText,
                url: siteBaseUrl, // L'URL generico del gioco
            });
            showToast('Sfida condivisa con successo!', 'success');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Errore durante navigator.share:', error);
                showToast('Condivisione annullata o fallita.', 'info');
            }
        }
    } else {
        console.log('navigator.share non supportato, uso fallback.');
        fallbackShare(simpleShareText);
    }
}

function fallbackShare(textToShare) {
    if (document.execCommand) { // navigator.clipboard.writeText non funziona sempre in WebView/iFrame
        const textarea = document.createElement('textarea');
        textarea.value = textToShare;
        textarea.style.position = 'fixed'; // Evita scroll
        textarea.style.opacity = '0'; // Rendi invisibile
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Testo della sfida copiato negli appunti!', 'info');
        } catch (err) {
            console.error('Fallback: Impossibile copiare negli appunti:', err);
            // Fallback finale se nemmeno execCommand funziona
            prompt('Copia questo testo per condividere la tua sfida:', textToShare);
        } finally {
            document.body.removeChild(textarea);
        }
    } else {
        // Fallback più semplice e meno intrusivo se execCommand non è disponibile
        prompt('Copia questo testo per condividere la tua sfida:', textToShare);
    }
}

/**
 * Helper function to prepare the list of assets to load.
 */
function prepareAssetsToLoad() {
    imagesToLoad.length = 0; // Clear existing if this function is called multiple times

    // Add base player sprites (can be overridden by equipped skins)
    imagesToLoad.push(
        { name: 'playerDefaultWalk', src: SKIN_ASSET_MAP['skin_donkey_default_info'].walk },
        { name: 'playerDefaultDigest', src: SKIN_ASSET_MAP['skin_donkey_default_info'].digest },
        { name: 'playerReinforced', src: 'images/asyncDonkey_reinforced.png' }, // Keep reinforced sprite separate as it's not a "skin"
        { name: 'playerReinforcedDigest', src: 'images/donkey_digest_reinforced.png' } // Keep reinforced digest sprite separate
    );

    // Add all defined player and bullet skins to be preloaded
    for (const skinId in SKIN_ASSET_MAP) {
        if (SKIN_ASSET_MAP[skinId].walk) {
            imagesToLoad.push({ name: `playerSkin_${skinId}_walk`, src: SKIN_ASSET_MAP[skinId].walk });
        }
        if (SKIN_ASSET_MAP[skinId].digest) {
            imagesToLoad.push({ name: `playerSkin_${skinId}_digest`, src: SKIN_ASSET_MAP[skinId].digest });
        }
        if (SKIN_ASSET_MAP[skinId].projectile) {
            imagesToLoad.push({ name: `bulletSkin_${skinId}_projectile`, src: SKIN_ASSET_MAP[skinId].projectile });
        }
    }

    // AGGIORNATO: Carica gli asset dei compagni usando la mappa COMPANION_ASSET_MAP
    // Ora usa le costanti definite ed esportate in questo stesso file.
    for (const companionId in COMPANION_ASSET_MAP) {
        if (COMPANION_ASSET_MAP[companionId].sprite) {
            imagesToLoad.push({ name: COMPANION_ASSET_MAP[companionId].sprite, src: COMPANION_ASSET_MAP[companionId].sprite });
        }
        if (COMPANION_ASSET_MAP[companionId].projectile) {
            imagesToLoad.push({ name: COMPANION_ASSET_MAP[companionId].projectile, src: COMPANION_ASSET_MAP[companionId].projectile });
        }
    }
          // Funzione helper per capitalizzare la prima lettera (puoi definirla altrove o qui)
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    imagesToLoad.push(
        { name: 'player', src: PLAYER_SPRITESHEET_SRC },
        { name: 'playerReinforced', src: 'images/asyncDonkey_reinforced.png' }, // Questo è già usato da Player con il nome 'playerReinforced'
        { name: 'playerProjectile', src: PLAYER_PROJECTILE_SPRITE_SRC },
        { name: 'playerUpgradedProjectile', src: PLAYER_UPGRADED_PROJECTILE_SPRITE_SRC },
        { name: 'obstacle', src: OBSTACLE_SPRITE_SRC },
        { name: 'obstacleVar1', src: OBSTACLE_VAR1_SPRITE_SRC },
        { name: 'obstacleVar2', src: OBSTACLE_VAR2_SPRITE_SRC },
        { name: 'obstacleVar3', src: OBSTACLE_VAR3_SPRITE_SRC }, // [FEAT] Carica nuova variante 3
        { name: 'obstacleVar4', src: OBSTACLE_VAR4_SPRITE_SRC }, // [FEAT] Carica nuova variante 4
        { name: 'obstacleVar5', src: OBSTACLE_VAR5_SPRITE_SRC }, // [FEAT] Carica nuova variante 5
        { name: 'enemyOne', src: ENEMY_ONE_SPRITE_SRC },
        { name: 'enemyTwo', src: ENEMY_TWO_SPRITE_SRC },
        { name: 'enemyThreeBase', src: ENEMY_THREE_BASE_SRC },
        { name: 'enemyThreeDmg1', src: ENEMY_THREE_DMG1_SRC },
        { name: 'enemyThreeDmg2', src: ENEMY_THREE_DMG2_SRC },
        { name: 'enemyFourIdle', src: ENEMY_FOUR_IDLE_SRC },
        { name: 'enemyFourProjectile', src: ENEMY_FOUR_PROJECTILE_SPRITE_SRC },
        { name: 'enemyFive', src: ENEMY_FIVE_SPRITE_SRC },
        { name: 'enemySixBase', src: ENEMY_SIX_BASE_SRC },
        { name: 'enemySixDmg1', src: ENEMY_SIX_DMG1_SRC },
        { name: 'enemySixDmg2', src: ENEMY_SIX_DMG2_SRC },
        { name: 'enemySixDmg3', src: ENEMY_SIX_DMG3_SRC },
        { name: 'enemySixProjectile', src: ENEMY_SIX_PROJECTILE_SPRITE_SRC },
        { name: 'enemySevenBase', src: ENEMY_SEVEN_BASE_SRC },
        { name: 'enemySevenDmg1', src: ENEMY_SEVEN_DMG1_SRC },
        { name: 'dangerousFlyingEnemy', src: DANGEROUS_FLYING_ENEMY_SRC },
        { name: 'kamikazeFlyingEnemy', src: KAMIKAZE_FLYING_ENEMY_SRC },
        { name: 'glitchzillaBase', src: GLITCHZILLA_BASE_SRC },
        { name: 'glitchzillaDmg1', src: GLITCHZILLA_DMG1_SRC },
        { name: 'glitchzillaDmg2', src: GLITCHZILLA_DMG2_SRC },
        { name: 'glitchzillaDmg3', src: GLITCHZILLA_DMG3_SRC },
        { name: 'glitchzillaProjectile', src: GLITCHZILLA_PROJECTILE_SPRITE_SRC },
        { name: 'glitchzillaAttackSprite', src: GLITCHZILLA_ATTACK_SRC }, // [FEAT] Carica il nuovo sprite di attacco
        { name: 'glitchzillaSpecialProjectile', src: GLITCHZILLA_SPECIAL_PROJECTILE_SRC }, // [FEAT] Carica il nuovo sprite del proiettile speciale
        { name: 'trojanByteBase', src: TROJAN_BYTE_BASE_SRC },
        { name: 'trojanByteDmg1', src: TROJAN_BYTE_DMG1_SRC },
        { name: 'trojanByteDmg2', src: TROJAN_BYTE_DMG2_SRC },
        { name: 'trojanByteDmg3', src: TROJAN_BYTE_DMG3_SRC },
        { name: 'trojanByteProjectile', src: TROJAN_BYTE_PROJECTILE_SPRITE_SRC },
        { name: 'trojanZigzagProjectile', src: TROJAN_BYTE_ZIGZAG_PROJECTILE_SPRITE_SRC },
        { name: 'missingNumberBase', src: MISSING_NUMBER_BASE_SRC },
        { name: 'missingNumberDmg1', src: MISSING_NUMBER_DMG1_SRC },
        { name: 'missingNumberDmg2', src: MISSING_NUMBER_DMG2_SRC },
        { name: 'missingNumberDmg3', src: MISSING_NUMBER_DMG3_SRC },
        { name: 'missingNumberProjectile', src: MISSING_NUMBER_PROJECTILE_SPRITE_SRC },
        { name: 'missingNumberProjectile', src: MISSING_NUMBER_PROJECTILE_SPRITE_SRC },
        { name: 'missingNumberEntity', src: MISSING_NUMBER_ENTITY_SRC }, // [FEAT] Carica lo sprite dell'entità
        { name: 'missingNumberFastProjectile', src: MISSING_NUMBER_FAST_PROJECTILE_SRC }, // [FEAT] Carica lo sprite del proiettile veloce
        { name: 'dunnoExeFlying', src: DUNNO_EXE_BASE_SRC },
        { name: 'dunnoExeFlyingDmg1', src: DUNNO_EXE_DMG1_SRC },
        { name: 'dunnoExeLandedShieldOff', src: DUNNO_EXE_LANDED_SHIELD_OFF_SRC },
        { name: 'dunnoExeLandedShieldOn', src: DUNNO_EXE_LANDED_SHIELD_ON_SRC },
        { name: 'dunnoExeProjectile1', src: DUNNO_EXE_PROJECTILE_1_SRC },
        { name: 'dunnoExeProjectile2', src: DUNNO_EXE_PROJECTILE_2_SRC },
        { name: 'dunnoExeProjectile3', src: DUNNO_EXE_PROJECTILE_3_SRC },
        { name: 'slayerProjectile', src: SLAYER_PROJECTILE_SPRITE_SRC },
        { name: 'codeInjectorProjectile', src: CODE_INJECTOR_PROJECTILE_SPRITE_SRC },
        { name: 'machineLanguageProjectile', src: MACHINE_LANGUAGE_PROJECTILE_SPRITE_SRC },
        { name: 'bitBronze', src: BIT_BRONZE_SRC },
        { name: 'bitSilver', src: BIT_SILVER_SRC },
        { name: 'bitGold', src: BIT_GOLD_SRC },
        { name: 'bitPlatinum', src: BIT_PLATINUM_SRC },
        { name: 'playerDigest', src: PLAYER_DIGEST_SRC },
        { name: 'playerReinforcedDigest', src: PLAYER_REINFORCED_DIGEST_SRC },
        { name: 'dataPackage', src: DATA_PKG_SRC },
        { name: 'richBits', src: RICH_BITS_SRC },
        { name: 'extraLife', src: EXTRA_LIFE_SRC },
        { name: 'powerup_bit_vacuum', src: POWERUP_CONFIGS[POWERUP_TYPE.BIT_VACUUM].src },
        { name: 'powerup_purge_protocol', src: POWERUP_CONFIGS[POWERUP_TYPE.PURGE_PROTOCOL].src },
        { name: 'digitalKiwi', src: DIGITAL_KIWI_SRC },
        { name: 'digitalOrange', src: DIGITAL_ORANGE_SRC },
        { name: 'digitalPear', src: DIGITAL_PEAR_SRC },
        { name: 'digitalApple', src: DIGITAL_APPLE_SRC },
        { name: 'digitalBanana', src: DIGITAL_BANANA_SRC },
        { name: 'digitalBerry', src: DIGITAL_BERRY_SRC },
        { name: 'digitalBlueberry', src: DIGITAL_BLUEBERRY_SRC },
        { name: 'digitalCherry', src: DIGITAL_CHERRY_SRC },
        { name: 'digitalCoconut', src: DIGITAL_COCONUT_SRC },
        { name: 'digitalDragonfruit', src: DIGITAL_DRAGONFRUIT_SRC },
        { name: 'digitalGrapes', src: DIGITAL_GRAPES_SRC },
        { name: 'digitalLemon', src: DIGITAL_LEMON_SRC },
        { name: 'digitalMelon', src: DIGITAL_MELON_SRC },
        { name: 'digitalPapaya', src: DIGITAL_PAPAYA_SRC },
        { name: 'digitalPeach', src: DIGITAL_PEACH_SRC },
        { name: 'digitalPineapple', src: DIGITAL_PINEAPPLE_SRC },
        { name: 'digitalStrawberry', src: DIGITAL_STRAWBERRY_SRC },
        { name: 'digitalWatermelon', src: DIGITAL_WATERMELON_SRC },
        { name: 'trojanChargedProjectile', src: TROJAN_CHARGED_PROJECTILE_SRC }, // Carica il tuo nuovo sprite del proiettile
        { name: 'rainProjectile', src: RAIN_PROJECTILE_SPRITE_SRC }, // <-- ASSICURATI CHE SIA COSÌ
    );

    // Add power-up sprites dynamically
    // RIMANE COSÌ: Qui i 'name' sono già i 'spriteKey' dalle configs
    for (const type in POWERUP_CONFIGS) {
        if (Object.prototype.hasOwnProperty.call(POWERUP_CONFIGS, type)) {
            const config = POWERUP_CONFIGS[type];
            if (config.spriteKey && config.src) {
                imagesToLoad.push({ name: config.spriteKey, src: config.src });
            } else {
                console.warn(`Configurazione src o spriteKey mancante per power-up tipo: ${type}`);
            }
        }
    }
}

// La funzione loadImage è già corretta, memorizza con il 'name' fornito
function loadImage(name, src) {
    return new Promise((resolve) => {
        if (!src) {
            console.error(`ERRORE: src mancante per l'immagine '${name}'. Impossibile caricare.`);
            imagesLoadedCount++;
            if (imagesLoadedCount === imagesToLoad.length) {
                allImagesLoaded = true;
            }
            resolve(null);
            return;
        }
        const img = new Image();
        images[name] = img; // L'IMMAGINE VIENE MEMORIZZATA QUI CON IL 'NAME' (CHE ORA È IL PATH COMPLETO PER I COMPANION)
        img.onload = () => {
            imagesLoadedCount++;
            if (img.naturalWidth === 0) {
                // console.warn(`Immagine caricata ma con naturalWidth 0: ${name} da ${src}`);
            }
            if (imagesLoadedCount === imagesToLoad.length) {
                allImagesLoaded = true;
            }
            resolve(img);
        };
        img.onerror = () => {
            imagesLoadedCount++;
            console.error(`ERRORE caricamento immagine: ${name} da ${src}`);
            images[name] = null;
            if (imagesLoadedCount === imagesToLoad.length) {
                allImagesLoaded = true;
            }
            resolve(null);
        };
        img.src = src;
    });
}

/**
 * Inizializza le variabili principali, ottiene i riferimenti al DOM,
 * e attacca tutti gli event listener necessari. Va chiamata una sola volta.
 */
export function setupGameEngine() {
    console.log('⚙️ setupGameEngine: Inizializzazione motore di gioco...');

    // Get DOM references and assign them to the global 'let' variables
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('CRITICO: Elemento Canvas non trovato! Impossibile avviare il gioco.');
        return;
    }
    ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 450;
    playerInitialY = canvas.height - groundHeight - PLAYER_TARGET_HEIGHT;

    miniLeaderboardListEl = document.getElementById('miniLeaderboardList');
    creditsModal = document.getElementById('creditsModal');
    closeCreditsModalBtn = document.getElementById('closeCreditsModalBtn');
    accordionHeaders = document.querySelectorAll('.accordion-header');
    scrollToTutorialLink = document.getElementById('scrollToTutorialLink');
    orientationPromptEl = document.getElementById('orientationPrompt');
    dismissOrientationPromptBtn = document.getElementById('dismissOrientationPrompt');

    gameContainer = document.getElementById('game-container-wrapper');
    touchOverlayLeft = document.getElementById('touch-overlay-left');
    touchOverlayRight = document.getElementById('touch-overlay-right');
    mobileControlsDiv = document.getElementById('mobileControls');
    fullscreenButton = document.getElementById('fullscreenButton');
    scoreInputContainerDonkey = document.getElementById('scoreInputContainerDonkey');

    saveScoreBtnDonkey = document.getElementById('saveScoreBtnDonkey');
    restartGameBtnDonkey = document.getElementById('restartGameBtnDonkey');
    mobileStartButton = document.getElementById('mobileStartButton');
    shareScoreBtnDonkey = document.getElementById('shareScoreBtnDonkey');
    backToMenuBtn = document.getElementById('backToMenuBtn');
    mainMenuBtn = document.getElementById('mainMenuBtn');
    accountIconContainer = document.getElementById('account-icon-container');

    // NUOVO: Riferimenti agli elementi della pausa
    pauseButton = document.getElementById('pauseButton');
    pauseModal = document.getElementById('pauseModal');
    resumeGameBtn = document.getElementById('resumeGameBtn');
    restartGameFromPauseBtn = document.getElementById('restartGameFromPauseBtn');
    mainMenuFromPauseBtn = document.getElementById('mainMenuFromPauseBtn');

    companionManager = new CompanionManager(); // NUOVO: Inizializza il CompanionManager

    // Setup iniziale basato sul dispositivo
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    isIPhone = /iPhone/i.test(navigator.userAgent);
    if (isTouchDevice) {
        if (mobileControlsDiv) mobileControlsDiv.style.display = 'flex';
        if (fullscreenButton) fullscreenButton.style.display = 'block';
    } else {
        if (mobileControlsDiv) mobileControlsDiv.style.display = 'none';
        if (mobileStartButton) mobileStartButton.style.display = 'none';
    }
    if (fullscreenButton) {
        if (isIPhone) fullscreenButton.style.display = 'none';
        else if (isTouchDevice) fullscreenButton.style.display = 'block';
        else fullscreenButton.style.display = 'none';
    }
    if (jumpButton) jumpButton.innerHTML = '<i class="ph-bold ph-arrow-circle-up"></i>';
    if (shootButton) shootButton.innerHTML = '<i class="ph-bold ph-code"></i>';

    prepareAssetsToLoad();
    setupRenderingContext(ctx);
    attachEventListeners();

    console.log('✅ setupGameEngine: Completato.');
}

// Aggiunta funzione per gestire BGM
let currentBGMPath = '';
let currentPlayingMusicInfo = null; // NUOVA VARIABILE
async function playRandomBGM() {
    AudioManager.stopMusic();
    const availableTracks = BGM_PLAYLIST.filter(track => `audio/bgm/${track}` !== currentBGMPath);
    const trackFilename = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    currentBGMPath = `audio/bgm/${trackFilename}`; // Aggiorna il percorso del file attualmente in riproduzione

    console.log(`🎵 Playing BGM: ${currentBGMPath}`);
    // Usa playMusicByName con il percorso come nome identificativo
    await AudioManager.playMusicByName(currentBGMPath, true); // Loop BGM

    // Aggiorna le informazioni per il display "Now Playing"
    currentPlayingMusicInfo = TRACK_METADATA[currentBGMPath];
    if (!currentPlayingMusicInfo) {
        console.warn(`Metadati non trovati per la traccia: ${currentBGMPath}`);
        currentPlayingMusicInfo = { title: 'Unknown Track', artist: 'Unknown Artist' }; // Fallback
    }
}

export function stopGameLoop() { // Aggiunto 'export'
    if (gameLoopRequestId) {
        cancelAnimationFrame(gameLoopRequestId);
        gameLoopRequestId = null;
        console.log('Game loop fermato.');
    }
}


export function pauseGame(isNativeAppPause = false) { // isNativeAppPause indica se chiamata da evento App di Capacitor
    // Se il gioco non è in stato PLAYING o PAUSE, o se è già in pausa nativa, non fare nulla
    if (currentGameState !== GAME_STATE.PLAYING && currentGameState !== GAME_STATE.PAUSE) return;
    // Se è già in pausa nativa e la richiesta arriva ancora, ignora (idempotenza)
    if (currentGameState === GAME_STATE.PAUSE && isNativeAppPause) return;


    currentGameState = GAME_STATE.PAUSE; // Imposta lo stato su PAUSA
    stopGameLoop(); // FERMA IL GAME LOOP (essenziale per fermare l'animazione)

    if (isNativeAppPause) {
        // Se la pausa proviene dall'evento nativo App.pause
        AudioManager.stopMusic(); // FERMA COMPLETAMENTE la musica
        console.log("Gioco in PAUSA profonda (app background). Musica STAPPATA.");
        // NUOVO: Mostra la modale di pausa anche quando la pausa è nativa
        if (pauseModal) pauseModal.style.display = 'flex'; // MOSTRA LA MODALE DI PAUSA
        if (mobileControlsDiv) mobileControlsDiv.style.display = 'none'; 
        if (pauseButton) pauseButton.style.display = 'none'; 
    } else {
        // Se la pausa proviene dal pulsante in-game
        AudioManager.pauseMusic(); // Mette in PAUSA la musica (per riprenderla esattamente da dove era)
        console.log("Gioco in PAUSA (pulsante in-game). Musica PAUSATA.");
        // Mostra la modale di pausa (già gestito)
        if (pauseModal) pauseModal.style.display = 'flex';
        if (mobileControlsDiv) mobileControlsDiv.style.display = 'none';
        if (pauseButton) pauseButton.style.display = 'none';
    }
}

function resumeGame() {
    if (currentGameState !== GAME_STATE.PAUSE) return;

    currentGameState = GAME_STATE.PLAYING;
    startGameLoop(); // RI-AVVIA il game loop

    // RIMOSSO: AudioManager.playMusicByName e AudioManager.resumeMusic per avvio automatico musica gioco
    // La musica verrà riavviata solo quando l'utente premerà "Play" o "Resume"
    AudioManager.resumeMusic(); // Continua a ripristinare il volume del nodo gain, ma playMusicByName è stato rimosso dalla riga sopra.

    // Nasconde la modale di pausa e ripristina i controlli mobili se visibili
    if (pauseModal) pauseModal.style.display = 'none'; 
    if (mobileControlsDiv && isTouchDevice) mobileControlsDiv.style.display = 'flex'; 
    if (pauseButton) pauseButton.style.display = 'block'; 
    console.log("Gioco RIPRESO.");
}

async function playBossMusic(bossName) { // Aggiunto parametro bossName
    AudioManager.stopMusic();
    let musicPath;
    let musicNameForAudioManager; // Nome identificativo per AudioManager

    switch (bossName) {
        case 'Glitchzilla':
            musicPath = GLITCHZILLA_MUSIC_PATH;
            musicNameForAudioManager = 'glitchzilla_music';
            break;
        case 'TrojanByte':
            musicPath = TROJAN_BYTE_MUSIC_PATH;
            musicNameForAudioManager = 'trojan_byte_music';
            break;
        case 'MissingNumber':
            musicPath = MISSING_NUMBER_MUSIC_PATH;
            musicNameForAudioManager = 'missing_number_music';
            break;
        case 'DUNNO.EXE': // NUOVO CASE
            musicPath = DUNNO_EXE_MUSIC_PATH;
            musicNameForAudioManager = 'dunno_exe_music';
            break;
        default:
            console.warn(`Musica boss non definita per: ${bossName}. Riproduco musica di Glitchzilla.`);
            musicPath = GLITCHZILLA_MUSIC_PATH; // Fallback
            musicNameForAudioManager = 'glitchzilla_music';
    }

    console.log(`⚔️ Playing Boss Music: ${musicPath}`);
    // Usa playMusicByName con il nome identificativo
    await AudioManager.playMusicByName(musicNameForAudioManager, true); // Loop Boss Music

    // Aggiorna le informazioni per il display "Now Playing"
    currentPlayingMusicInfo = TRACK_METADATA[musicPath];
    if (!currentPlayingMusicInfo) {
        console.warn(`Metadati non trovati per la traccia boss: ${musicPath}`);
        currentPlayingMusicInfo = { title: 'Unknown Boss Theme', artist: 'Unknown Artist' }; // Fallback
    }
}

async function playGameOverMusic(instanceId) {
    // Se l'ID della partita non corrisponde più a quello corrente, non fare nulla.
    if (instanceId !== currentGameInstance) {
        console.log(`Annullamento musica game over per istanza ${instanceId} (scaduta).`);
        return;
    }

    AudioManager.stopMusic();
    console.log(`💀 Playing Game Over Music: ${GAME_OVER_MUSIC_PATH}`);
    // Usa playMusicByName con il nome identificativo
    await AudioManager.playMusicByName('game_over_music', false); // Non in loop

    // Aggiorna le informazioni per il display "Now Playing"
    currentPlayingMusicInfo = TRACK_METADATA[GAME_OVER_MUSIC_PATH];
    if (!currentPlayingMusicInfo) {
        console.warn(`Metadati non trovati per la traccia Game Over: ${GAME_OVER_MUSIC_PATH}`);
        currentPlayingMusicInfo = { title: 'Game Over', artist: 'Unknown Artist' }; // Fallback
    }

    // Secondo controllo, ancora più sicuro, dopo l'attesa del caricamento
    if (instanceId !== currentGameInstance) {
        console.log(`Annullamento musica game over per istanza ${instanceId} (scaduta).`);
        return;
    }
}
/**
 * Esegue il caricamento di tutte le immagini e suoni necessari per il gioco.
 * Restituisce una Promise che si risolve quando tutto è caricato.
 */
/**
 * Esegue il caricamento di tutte le immagini e suoni necessari per il gioco.
 * Restituisce una Promise che si risolve quando tutto è caricato.
 */
export async function preloadGameAssets() {
    console.log('⏳ preloadGameAssets: Avvio caricamento assets...');
    if (resourcesInitialized) {
        console.log('Assets già caricati.');
        return;
    }

    const imagePromises = imagesToLoad.map((d) => loadImage(d.name, d.src));
    const soundPromises = soundsToLoad.map((s) => AudioManager.loadSound(s.name, s.path));

    const musicLoadPromises = [
        // Carica le musiche dei boss
        AudioManager.loadBackgroundMusic('glitchzilla_music', GLITCHZILLA_MUSIC_PATH),
        AudioManager.loadBackgroundMusic('trojan_byte_music', TROJAN_BYTE_MUSIC_PATH),
        AudioManager.loadBackgroundMusic('missing_number_music', MISSING_NUMBER_MUSIC_PATH),
        AudioManager.loadBackgroundMusic('dunno_exe_music', DUNNO_EXE_MUSIC_PATH),
        // Carica la musica di game over
        AudioManager.loadBackgroundMusic('game_over_music', GAME_OVER_MUSIC_PATH),
    ];

    // NUOVO: Carica TUTTE le musiche della BGM_PLAYLIST
    BGM_PLAYLIST.forEach(trackFilename => {
        const fullPath = `audio/bgm/${trackFilename}`;
        // Usa il percorso completo come nome identificativo se non hai un nome più specifico
        musicLoadPromises.push(AudioManager.loadBackgroundMusic(fullPath, fullPath));
    });

    await Promise.allSettled([...imagePromises, ...soundPromises, ...musicLoadPromises]);

    console.log('✅ preloadGameAssets: Processo di caricamento assets completato.');
    resourcesInitialized = true;
}

export async function launchGame(options = {}) { 
    if (currentGameState === 'PLAYING') {
        console.warn('launchGame chiamato mentre il gioco è già in esecuzione. Chiamata ignorata.');
        return;
    }
    
    gameOverTrigger = false;
    score = 0;
    finalScore = 0;
    isGameInitializing = true;

    currentGameInstance++;
    console.log(`🚀 launchGame: Avvio del gioco! (Istanza: ${currentGameInstance})`);

    if (!resourcesInitialized) {
        console.error('Impossibile avviare il gioco, le risorse non sono state caricate.');
        return;
    }

    if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
        AudioManager.audioContext.resume().catch((err) => console.error('Errore nel riprendere AudioContext:', err));
    }

    currentGameState = 'PLAYING';

    // L'inventario viene sempre passato da main.js (currentUserData.inventory)
    // Non è più necessario recuperarlo da Firestore qui.
    let gameInventory = options.inventory;
    if (!gameInventory) {
        console.warn("[donkeyRunner.js] Inventario non fornito a launchGame, tentativo di recupero locale.");
        gameInventory = await getAuthenticatedUserInventory(); // Recupera dal profilo locale
        if (!gameInventory) {
            console.error("[donkeyRunner.js] Impossibile recuperare l'inventario locale. Avvio con inventario vuoto.");
            gameInventory = { equipped: {}, unlockedItems: [] };
        }
    }

    // MODIFICATO: Passa il flag isRaining a resetGame
    resetGame({ inventory: gameInventory, isRaining: options.isRaining }); 
    console.log("NUOVO LOG DI DEBUG: asyncDonkey dopo resetGame in launchGame:", asyncDonkey); // NUOVO LOG DI DEBUG

    playRandomBGM();

    if (mobileStartButton) mobileStartButton.style.display = 'none';
    if (scoreInputContainerDonkey) scoreInputContainerDonkey.style.display = 'none';
    if (accountIconContainer) {
        accountIconContainer.style.display = 'none'; // L'icona dell'account non è più rilevante in-game
    }
    if (mobileControlsDiv) {
        mobileControlsDiv.style.setProperty('display', isTouchDevice ? 'flex' : 'none', 'important');
    }

    if (companionManager) { // Non c'è più bisogno di controllare gameInventory qui, è già passato a resetGame
        const equippedCompanionId = gameInventory.equipped?.companion;
        if (equippedCompanionId) {
            console.log("NUOVO LOG DI DEBUG: Chiamata equipCompanion con asyncDonkey:", asyncDonkey); // NUOVO LOG DI DEBUG
            companionManager.equipCompanion(equippedCompanionId, asyncDonkey, images);
            console.log(`[donkeyRunner.js] Compagno ${equippedCompanionId} equipaggiato al lancio del gioco.`);
        } else {
            companionManager.unequipCompanion();
            console.log("[donkeyRunner.js] Nessun compagno equipaggiato al lancio del gioco.");
        }
    }

    if (gameLoopRequestId === null) {
        startGameLoop();
    }

    MissionManager.startGameMissions();    

    setTimeout(() => {
        isGameInitializing = false;
        console.log("Periodo di inizializzazione del gioco terminato.");
    }, 200);
}


class Player {
    constructor(x, y, dw, dh, inventory = {}) { // 'inventory' è già il parametro
        this.x = x;
        this.y = y;
        this.displayWidth = dw;
        this.displayHeight = dh;
        this.velocityY = 0;
        this.onGround = true;

        this.health = 1;
        this.maxHealth = 1;
        this.isReinforced = false;
        this.invulnerableTimer = 0;

        const currentInventory = inventory || {};
        const unlockedItems = currentInventory.unlockedItems || [];
        const equippedItems = currentInventory.equipped || {};

        // La logica per powerup_extra_life è già corretta, usa unlockedItems
        if (unlockedItems.includes('powerup_extra_life')) {
            console.log('✅ Potenziamento permanente ATTIVO: Vita extra!');
            this.health = 2;
            this.maxHealth = 2;
        }

        // --- SKIN LOGIC FOR PLAYER (DONKEY) START ---
        const equippedDonkeySkinId = equippedItems.donkeySkin || 'skin_donkey_default_info';

        this.sprite = images[`playerSkin_${equippedDonkeySkinId}_walk`] || images['playerDefaultWalk'];
        this.digestSprite = images[`playerSkin_${equippedDonkeySkinId}_digest`] || images['playerDefaultDigest'];

        if (!this.sprite || !this.sprite.complete || this.sprite.naturalWidth === 0) {
            console.error(`Failed to load walk sprite for skin: ${equippedDonkeySkinId}. Using default.`);
            this.sprite = images['playerDefaultWalk'];
        }
        if (!this.digestSprite || !this.digestSprite.complete || this.digestSprite.naturalWidth === 0) {
            console.error(`Failed to load digest sprite for skin: ${equippedDonkeySkinId}. Using default.`);
            this.digestSprite = images['playerDefaultDigest'];
        }
        // --- SKIN LOGIC FOR PLAYER (DONKEY) END ---

        const pXRatio = 20 / 120;
        const pYRatio = 10 / 120;
        const pX = this.displayWidth * pXRatio;
        const pY = this.displayHeight * pYRatio;
        this.colliderWidth = this.displayWidth - pX;
        this.colliderHeight = this.displayHeight - pY;
        this.colliderOffsetX = pX / 2;
        this.colliderOffsetY = pY / 2;

        this.walkAnimation = new SpriteAnimation(this.sprite, PLAYER_ACTUAL_FRAME_WIDTH, PLAYER_ACTUAL_FRAME_HEIGHT, PLAYER_NUM_WALK_FRAMES);

        this.reinforcedSprite = images['playerReinforced'];
        this.reinforcedWalkAnimation = null;
        if (this.reinforcedSprite && this.reinforcedSprite.complete && this.reinforcedSprite.naturalWidth > 0) {
            this.reinforcedWalkAnimation = new SpriteAnimation(this.reinforcedSprite, PLAYER_ACTUAL_FRAME_WIDTH, PLAYER_ACTUAL_FRAME_HEIGHT, PLAYER_NUM_WALK_FRAMES);
        } else {
            this.reinforcedWalkAnimation = this.walkAnimation;
            this.reinforcedSprite = this.sprite;
        }

        this.digestAnimation = new SpriteAnimation(this.digestSprite, PLAYER_ACTUAL_FRAME_WIDTH, PLAYER_ACTUAL_FRAME_HEIGHT, PLAYER_DIGEST_NUM_FRAMES);
        
        this.reinforcedDigestSprite = images['playerReinforcedDigest'];
        this.reinforcedDigestAnimation = null;
        if (this.reinforcedDigestSprite && this.reinforcedDigestSprite.complete && this.reinforcedDigestSprite.naturalWidth > 0) {
            this.reinforcedDigestAnimation = new SpriteAnimation(this.reinforcedDigestSprite, PLAYER_ACTUAL_FRAME_WIDTH, PLAYER_ACTUAL_FRAME_HEIGHT, PLAYER_DIGEST_NUM_FRAMES);
        } else {
            this.reinforcedDigestAnimation = this.digestAnimation;
            this.reinforcedDigestSprite = this.digestSprite;
        }

        this.isDigesting = false;
        this.digestTimer = 0;
        this.digestDuration = 0.2;

        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.isShieldActive = false;
        this.isFirewallActive = false;
        this.isBlockBreakerActive = false;
        this.hasSlayerSubroutine = false;
        this.hasCodeInjector = false;
        this.isMachineLanguageActive = false;
        this.machineGunTimer = 0;
        this.isBitVacuumActive = false;
        this.isPurgeProtocolActive = false;
        this.canEatEnemy = false;

        this.equippedBulletSkinId = equippedItems.bulletSkin || null;
        this.showGlowEffect = false; // NUOVO: Flag per il glow effect

        // MODIFICA QUI: Rimuovi la logica di equipaggiamento del compagno da qui.
        // Verrà gestita direttamente in launchGame() dopo il reset.
    }

    // NUOVO: Metodo per subire un colpo
    takeHit() {
        // --- INIZIO BUG FIX: Previene colpi durante la brevissima inizializzazione del gioco ---
        if (isGameInitializing) {
            console.warn("Il giocatore ha subito un colpo durante l'inizializzazione, ignorato.");
            return; // Ignora il colpo se il gioco è in fase di inizializzazione
        }
        // --- FINE BUG FIX ---

        if (this.invulnerableTimer > 0) return; // Non può essere colpito se è invulnerabile

        if (this.isShieldActive) {
            this.deactivatePowerUp();
            AudioManager.playSound('shieldBlock');
            return;
        }

        this.health--;
        AudioManager.playSound('playerHit');

        if (this.health <= 0) {
            gameOverTrigger = true;
            processGameOver();
        } else {
            this.invulnerableTimer = 1.5;
            MissionManager.notifyPlayerTookDamage(); // NUOVO: Notifica al MissionManager che il giocatore ha subito un danno
        }
    }

    draw() {
    let animationToDraw, spriteToDraw;

    // Se sta digerendo, questa animazione ha la priorità su tutto
    if (this.isDigesting) {
        animationToDraw = this.isReinforced ? this.reinforcedDigestAnimation : this.digestAnimation;
        spriteToDraw = this.isReinforced ? this.reinforcedDigestSprite : this.digestSprite;
    } else {
        // Altrimenti, usa la normale logica di camminata/rinforzato
        animationToDraw = this.isReinforced ? this.reinforcedWalkAnimation : this.walkAnimation;
        spriteToDraw = this.isReinforced ? this.reinforcedSprite : this.sprite;
    }

    // NUOVO: Definisci 'f' qui, prima che venga usato.
    const f = animationToDraw ? animationToDraw.getFrame() : null; // Aggiunto controllo per null

    // Disegna lo sprite scelto (con logica di invulnerabilità invariata)
    if (!(this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0)) {
        // Aggiungi f al controllo, dato che potrebbe essere null se l'animazione non è valida
        if (animationToDraw && f && spriteToDraw && spriteToDraw.complete && spriteToDraw.naturalWidth > 0) {
            // Se l'effetto glow è attivo, applica uno stile di ombra (glow)
            if (this.showGlowEffect) {
                ctx.save();
                ctx.shadowColor = 'rgba(0, 255, 255, 1)';
                ctx.shadowBlur = 15 + Math.sin(Date.now() / 100) * 5;
                ctx.drawImage(spriteToDraw, f.sx, f.sy, PLAYER_ACTUAL_FRAME_WIDTH, PLAYER_ACTUAL_FRAME_HEIGHT, this.x, this.y, this.displayWidth, this.displayHeight);
                ctx.restore();
            } else {
                ctx.drawImage(spriteToDraw, f.sx, f.sy, PLAYER_ACTUAL_FRAME_WIDTH, PLAYER_ACTUAL_FRAME_HEIGHT, this.x, this.y, this.displayWidth, this.displayHeight);
            }
        } else {
            this.drawFallback();
        }
    }

    // 4. Disegna gli effetti dei power-up (scudo, firewall)
    if (this.isFirewallActive) {
        ctx.save();
        ctx.strokeStyle = PALETTE.BRIGHT_TEAL;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.2;
        const auraPadding = 5;
        ctx.strokeRect(
            this.x - auraPadding,
            this.y - auraPadding,
            this.displayWidth + auraPadding * 2,
            this.displayHeight + auraPadding * 2
        );
        ctx.restore();
    }

    if (this.isShieldActive) {
        ctx.beginPath();
        ctx.arc(
            this.x + this.displayWidth / 2,
            this.y + this.displayHeight / 2,
            this.displayWidth / 1.8,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

// Assicurati che anche la funzione drawFallback() usi 'ctx' e non 'this.ctx'
// Sostituisci o  questo metodo alla classe Player
drawFallback() {
    ctx.fillStyle = 'orange'; // Usa ctx
    ctx.fillRect(this.x, this.y, this.displayWidth, this.displayHeight);
}

    update(dt) {
    // Gestisce il timer di invulnerabilità dopo un colpo
    if (this.invulnerableTimer > 0) {
        this.invulnerableTimer -= dt;
    }

    // Gestisce il timer di digestione
    if (this.isDigesting) {
        this.digestTimer -= dt;
        const digestAnim = this.isReinforced ? this.reinforcedDigestAnimation : this.digestAnimation;
        if (digestAnim) digestAnim.update(dt);

        if (this.digestTimer <= 0) {
            this.isDigesting = false;
            if (this.digestAnimation) this.digestAnimation.reset();
            if (this.reinforcedDigestAnimation) this.reinforcedDigestAnimation.reset();
        }
    }

    // Logica della fisica (gravità e posizione verticale)
    this.velocityY += GRAVITY_ACCELERATION * dt;
    this.y += this.velocityY * dt;

    if (this.y + this.displayHeight >= canvas.height - groundHeight) {
        this.y = canvas.height - groundHeight - this.displayHeight;
        this.velocityY = 0;
        this.onGround = true;
    } else {
        this.onGround = false;
    }

    // Aggiorna l'animazione di camminata solo se NON sta digerendo
    if (this.onGround && !this.isDigesting) {
        const animToUpdate = this.isReinforced ? this.reinforcedWalkAnimation : this.walkAnimation;
        if (animToUpdate) animToUpdate.update(dt);
    }

    // Gestisce la durata dei power-up temporanei
    if (this.activePowerUp && this.powerUpTimer > 0) {
        this.powerUpTimer -= dt;
        if (this.powerUpTimer <= 0) {
            this.deactivatePowerUp();
        }
    }
}

    jump() {
        if (this.onGround) {
            this.velocityY = PLAYER_JUMP_VELOCITY_INITIAL;
            this.onGround = false;
            AudioManager.playSound('jump');
            gameStats.jumps++;
            MissionManager.updateMissionProgress('jump_x_times', { count: 1 }); // NUOVO: Notifica il salto al MissionManager
        }
    }

    shoot() {
        // If Machine Language is active, shoot ignoring standard cooldown.
        // Rate is managed by machineGunTimer in the game loop.
        if (this.isMachineLanguageActive) {
            // Not checking canShoot, just firing.
        }
        // Otherwise, use standard cooldown logic
        else if (!canShoot) {
            return; // Exit if on cooldown
        }

        const projectileYBase = this.y + this.displayHeight / 2 - PLAYER_PROJECTILE_TARGET_HEIGHT / 2;
        
        // >>> INIZIO MODIFICA: Riordina la logica di determinazione del tipo di proiettile

        let projectileType;
        let bulletSkinId;

        // Step 1: Determina il tipo di proiettile basico (normale o machine_language)
        if (this.isMachineLanguageActive) {
            projectileType = 'machine_language';
            bulletSkinId = null; // Il proiettile machine_language ha la sua grafica
        } else {
            projectileType = 'normal';
            bulletSkinId = this.equippedBulletSkinId; // Inizializza con la skin equipaggiata
        }

        // Step 2: Applica le sovrascritture dei power-up permanenti (hanno priorità sul base/cosmetico)
        if (this.hasSlayerSubroutine) {
            projectileType = 'slayer';
            bulletSkinId = null; // Slayer ha il suo look
        } else if (this.hasCodeInjector) {
            projectileType = 'injector';
            bulletSkinId = null; // Injector ha il suo look
        } else if (this.hasDebugMode) {
            projectileType = 'debug';
            bulletSkinId = null; // Debug ha il suo look
        }

        // Step 3: Applica la sovrascrittura della Rain Run (QUESTA È LA PRIORITÀ PIÙ ALTA)
        // Se è una Rain Run, forza il tipo di proiettile della pioggia e il suo sprite,
        // sovrascrivendo qualsiasi visuale dei power-up permanenti, ma mantenendo i loro danni.
        // La classe Projectile gestirà il danno in base al 'projectileType'.
        if (isRainRunActive) {
            projectileType = 'rain_projectile';
            bulletSkinId = null; // Assicurati che nessuna altra skin cosmetica interferisca
        }

        // <<< FINE MODIFICA: Riordina la logica di determinazione del tipo di proiettile
        
        if (this.activePowerUp === POWERUP_TYPE.TRIPLE_SHOT) {
            // Pass the determined projectileType and bulletSkinId to the Projectile constructor
            projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase - PROJECTILE_VERTICAL_OFFSET, projectileType, bulletSkinId));
            projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase, projectileType, bulletSkinId));
            projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase + PROJECTILE_VERTICAL_OFFSET, projectileType, bulletSkinId));
        } else {
            // Pass the determined projectileType and bulletSkinId to the Projectile constructor
            projectiles.push(new Projectile(this.x + this.displayWidth, projectileYBase, projectileType, bulletSkinId));
        }

        AudioManager.playSound('shoot', false, 0.8);
        gameStats.shotsFired++;
        MissionManager.updateMissionProgress('shoot_x_times', { count: 1 });

        if (!this.isMachineLanguageActive) {
            canShoot = false;
            shootTimer = 0;
        }
    }

    activatePowerUp(type) {
    const soundInfo = POWERUP_SOUND_MAP[type];
    if (soundInfo) {
        AudioManager.playSound(soundInfo.sfx);
        setTimeout(() => AudioManager.playSound(soundInfo.voice), 150);
    }
    gameStats.powerUpsCollected++;
        MissionManager.updateMissionProgress('collect_powerups', { type: type });

    if (type === POWERUP_TYPE.REINFORCED_SHIELD) {
            if (!this.isReinforced) {
                this.isReinforced = true;
                this.maxHealth = 3;
                this.health = 3;
                showToast('RUNNING DEPRECATED SUBROUTINES: TRUE', 'success');
            }
            // Essendo permanente per la run, non fa altro e non viene rimosso
            return;
        }

    // --- NUOVA GESTIONE UNIFICATA POWER-UP PERMANENTI ---
    if (type === POWERUP_TYPE.SLAYER_SUBROUTINE) {
        if (!this.hasSlayerSubroutine) {
            this.hasSlayerSubroutine = true;
            this.hasCodeInjector = false; // Slayer sovrascrive Injector
            hasSlayerSubroutineUpgrade = true; // Aggiorna flag globale
            gameStats.slayerCollected = true; // Traccia lo stat
            showToast('Slayer Subroutine ATTIVATO!', 'success');
        }
        return; 
    }
    if (type === POWERUP_TYPE.CODE_INJECTOR) {
        if (!this.hasSlayerSubroutine && !this.hasCodeInjector) {
            this.hasCodeInjector = true;
            hasCodeInjectorUpgrade = true; // Aggiorna flag globale
            gameStats.injectorCollected = true; // Traccia lo stat
            showToast('Code Injector ATTIVATO!', 'success');
        }
        return;
    }
    if (type === POWERUP_TYPE.DEBUG_MODE) {
        if (!this.hasDebugMode) {
            this.hasDebugMode = true;
            hasDebugModeUpgrade = true; // Aggiorna flag globale
            gameStats.debugCollected = true; // Traccia lo stat
            showToast('Debug Mode ENGAGED!', 'success');
        }
        return;
    }

     // --- GESTIONE POWER-UP TEMPORANEI (Logica esistente semplificata) ---
    // Aggiungi i nuovi power-up temporanei alla lista di quelli esclusivi (che si disattivano a vicenda)
    const exclusiveTypes = [
        POWERUP_TYPE.TRIPLE_SHOT, POWERUP_TYPE.SHIELD,
        POWERUP_TYPE.FIREWALL, POWERUP_TYPE.BLOCK_BREAKER,
        POWERUP_TYPE.BIT_VACUUM, 
        POWERUP_TYPE.PURGE_PROTOCOL, 
    ];
    if (exclusiveTypes.includes(this.activePowerUp) && exclusiveTypes.includes(type)) {
        this.deactivatePowerUp();
    }
    this.deactivatePowerUp(); 

    this.activePowerUp = type;
    switch (type) {
        case POWERUP_TYPE.TRIPLE_SHOT:
            this.powerUpTimer = POWERUP_DURATION.TRIPLE_SHOT;
            break;
        case POWERUP_TYPE.SHIELD:
            this.powerUpTimer = POWERUP_DURATION.SHIELD;
            this.isShieldActive = true;
            break;
        case POWERUP_TYPE.SMART_BOMB:
            this.activateSmartBomb();
            break;
        case POWERUP_TYPE.FIREWALL:
            this.powerUpTimer = POWERUP_DURATION.FIREWALL;
            this.isFirewallActive = true;
            break;
        case POWERUP_TYPE.BLOCK_BREAKER:
            this.powerUpTimer = POWERUP_DURATION.BLOCK_BREAKER;
            this.isBlockBreakerActive = true;
            break;
        case POWERUP_TYPE.MACHINE_LANGUAGE:
            this.powerUpTimer = POWERUP_DURATION.MACHINE_LANGUAGE;
            this.isMachineLanguageActive = true;
            break;
        // NUOVI POWER-UP DI MODULO 6 (rimangono come sono)
        case POWERUP_TYPE.BIT_VACUUM:
            this.powerUpTimer = POWERUP_DURATION.BIT_VACUUM;
            this.isBitVacuumActive = true;
            showToast('Bit Vacuum Attivo!', 'info');
            break;
        case POWERUP_TYPE.PURGE_PROTOCOL:
            this.powerUpTimer = POWERUP_DURATION.PURGE_PROTOCOL;
            this.isPurgeProtocolActive = true;
            this.canEatEnemy = true;
            showToast('Purge Protocol Attivo! Inizia a cacciare!', 'info');
            break;
        }
    }
    deactivatePowerUp() {
        console.log(`Power-up ${this.activePowerUp} DEACTIVATED.`);
        if (this.activePowerUp === POWERUP_TYPE.SHIELD) this.isShieldActive = false;
        if (this.activePowerUp === POWERUP_TYPE.FIREWALL) this.isFirewallActive = false;
        if (this.activePowerUp === POWERUP_TYPE.BLOCK_BREAKER) this.isBlockBreakerActive = false;
        if (this.activePowerUp === POWERUP_TYPE.MACHINE_LANGUAGE) this.isMachineLanguageActive = false;
        // NUOVO: Disattiva i nuovi power-up
        if (this.activePowerUp === POWERUP_TYPE.BIT_VACUUM) this.isBitVacuumActive = false; // NUOVO
        if (this.activePowerUp === POWERUP_TYPE.PURGE_PROTOCOL) this.isPurgeProtocolActive = false; // NUOVO
        if (this.activePowerUp === POWERUP_TYPE.PURGE_PROTOCOL) this.canEatEnemy = false; // NUOVO: Disabilita l'effetto "mangia nemici"

        this.activePowerUp = null;
        this.powerUpTimer = 0;
    }

    activateSmartBomb() {
        console.log('BOMBA Intelligente ATTIVATA!');
        let enemiesCleared = 0;
        const allEnemyLists = [
            enemies,
            fastEnemies,
            armoredEnemies,
            shootingEnemies,
            flyingEnemies,
            armoredShootingEnemies,
            toughBasicEnemies,
            dangerousFlyingEnemies,
        ];
        allEnemyLists.forEach((enemyList) => {
            for (let i = enemyList.length - 1; i >= 0; i--) {
                enemyList.splice(i, 1);
                score += 15;
                enemiesCleared++;
            }
        });
        if (activeMiniboss) {
            activeMiniboss.takeDamage(5);
            console.log('Smart Bomb ha danneggiato il boss!');
        }
        let obstaclesCleared = 0;
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles.splice(i, 1);
            score += 5;
            obstaclesCleared++;
        }
        if (enemiesCleared > 0 || obstaclesCleared > 0) AudioManager.playSound('enemyExplode', false, 0.9);
        if (enemiesCleared > 0) console.log(`${enemiesCleared} nemici distrutti dalla bomba!`);
        if (obstaclesCleared > 0) console.log(`${obstaclesCleared} ostacoli distrutti dalla bomba!`);
        // Smart Bomb non è un power-up a tempo, quindi non imposto activePowerUp su null qui.
        // È un'azione "usa e getta".
        this.activePowerUp = null; // Rimuovo l'activePowerUp se era Smart Bomb per evitare UI persistente.
        this.powerUpTimer = 0;
    }
}

class Bit {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = BIT_TARGET_WIDTH;
        this.height = BIT_TARGET_HEIGHT;

        // Assegna sprite, valore, testo e proprietà del testo in base al tipo
        switch(type) {
            case 'silver':
                this.sprite = images['bitSilver'];
                this.value = 2;
                this.text = '2 BIT'; 
                this.textColor = '#e2e2e2';
                this.fontSize = 12;
                break;
            case 'gold':
                this.sprite = images['bitGold'];
                this.value = 5;
                this.text = '5 BIT'; 
                this.textColor = '#efd081';
                this.fontSize = 14;
                break;
            case 'platinum':
                this.sprite = images['bitPlatinum'];
                this.value = 10;
                this.text = '10 BIT'; 
                this.textColor = '#fccfff';
                this.fontSize = 16;
                break;
            case 'bronze':
            default:
                this.sprite = images['bitBronze'];
                this.value = 1;
                this.text = '1 BIT'; 
                this.textColor = '#d79878';
                this.fontSize = 10;
                break;
        }

        this.animation = new SpriteAnimation(this.sprite, BIT_FRAME_WIDTH, BIT_FRAME_HEIGHT, BIT_NUM_FRAMES);
        this.textOffset = 0; 
        this.textAnimationTimer = Math.random() * Math.PI * 2; 

        // Metodo collect per gestire la raccolta dell'oggetto
        this.collect = (options = {}) => {
            bits += this.value;
            if (options.byCompanion) {
                AudioManager.playSound('bitCollect', false, 0.5); // Suono più basso per compagno
            } else {
                AudioManager.playSound('bitCollect', false, 0.7);
                floatingTexts.push(new FloatingText(asyncDonkey.x + asyncDonkey.displayWidth / 2, asyncDonkey.y - 40, `+${this.value} Bit!`, this.textColor, this.fontSize));
                if (asyncDonkey && !asyncDonkey.isDigesting) {
                    asyncDonkey.isDigesting = true;
                    asyncDonkey.digestTimer = asyncDonkey.digestDuration;
                }
            }
            MissionManager.updateMissionProgress('collect_bits', { value: this.value });
        };
    }

    update(dt) {
        this.x -= gameSpeed * dt;
        if (this.animation) {
            this.animation.update(dt);
        }
        this.textAnimationTimer += dt * 5; 
        this.textOffset = Math.sin(this.textAnimationTimer) * 2; 
    }

    draw(ctx) {
        if (this.animation && this.sprite && this.sprite.complete) {
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, BIT_FRAME_WIDTH, BIT_FRAME_HEIGHT, this.x, this.y, this.width, this.height);
        }

        ctx.save();
        ctx.fillStyle = this.textColor;
        ctx.font = `bold ${this.fontSize}px "Courier Prime", monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.7)'; 
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x + this.width / 2, this.y - 5 + this.textOffset);
        ctx.restore();
    }
}


// CLASSE ExtraLifeCollectible
class ExtraLifeCollectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = 'extra_life'; // NUOVO: Definisci il tipo
        this.width = EXTRA_LIFE_TARGET_WIDTH;
        this.height = EXTRA_LIFE_TARGET_HEIGHT;
        this.sprite = images['extraLife'];
        this.animation = new SpriteAnimation(this.sprite, EXTRA_LIFE_FRAME_WIDTH, EXTRA_LIFE_FRAME_HEIGHT, EXTRA_LIFE_NUM_FRAMES, 0.1);
        
        // [FEAT] Testo per lo sprite
        this.text = 'INT';
        this.textColor = '#ff306c'; // Rosso
        this.fontSize = 14;
        this.textOffset = 0;
        this.textAnimationTimer = Math.random() * Math.PI * 2;
        // Metodo collect per gestire la raccolta dell'oggetto
        this.collect = (options = {}) => {
            if (options.byCompanion) {
                // Logica per quando il compagno raccoglie
                if (asyncDonkey.health < asyncDonkey.maxHealth) {
                    asyncDonkey.health++;
                }
            } else {
                // Logica per quando il player raccoglie
                if (asyncDonkey.health < asyncDonkey.maxHealth) {
                    asyncDonkey.health++;
                    showToast('Extra Life Acquisita!', 'success');
                } else {
                    showToast('Integrity Maxed!', 'info');
                }
                AudioManager.playSound('powerUpCollect');
                floatingTexts.push(new FloatingText(asyncDonkey.x + asyncDonkey.displayWidth / 2, asyncDonkey.y - 40, `+1 INT!`, '#ff306c', 24));
                if (asyncDonkey && !asyncDonkey.isDigesting) {
                    asyncDonkey.isDigesting = true;
                    asyncDonkey.digestTimer = asyncDonkey.digestDuration;
                }
            }
        };
    }

    update(dt) {
        this.x -= gameSpeed * dt;
        this.animation.update(dt);
        // [FEAT] Aggiorna l'animazione del testo
        this.textAnimationTimer += dt * 5;
        this.textOffset = Math.sin(this.textAnimationTimer) * 2;
    }

    draw(ctx) {
        if (this.animation && this.sprite && this.sprite.complete) {
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, EXTRA_LIFE_FRAME_WIDTH, EXTRA_LIFE_FRAME_HEIGHT, this.x, this.y, this.width, this.height);
        }

        // [FEAT] Disegna il testo sopra lo sprite
        ctx.save();
        ctx.fillStyle = this.textColor;
        ctx.font = `bold ${this.fontSize}px "Courier Prime", monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x + this.width / 2, this.y - 5 + this.textOffset);
        ctx.restore();
    }
}

class RichBitsCollectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = 'rich_bit'; // NUOVO: Definisci il tipo
        this.width = RICH_BITS_TARGET_WIDTH;
        this.height = RICH_BITS_TARGET_HEIGHT;
        this.sprite = images['richBits'];
        this.animation = new SpriteAnimation(this.sprite, RICH_BITS_FRAME_WIDTH, RICH_BITS_FRAME_HEIGHT, RICH_BITS_NUM_FRAMES, 0.1);

        this.initialY = y;
        this.angle = Math.random() * Math.PI * 2;
        this.amplitude = 15 + Math.random() * 10;
        this.frequency = 3 + Math.random() * 2;

        this.text = 'RICH BIT';
        this.textColor = '#FFD700'; // Oro (colore di base)
        this.fontSize = 16;
        this.textOffset = 0;
        this.textAnimationTimer = Math.random() * Math.PI * 2;
        // Metodo collect per gestire la raccolta dell'oggetto
        this.collect = (options = {}) => {
            const value = 250;
            bits += value;
            if (options.byCompanion) {
                AudioManager.playSound('bitCollect', false, 0.5); // Suono più basso per compagno
            } else {
                AudioManager.playSound('bitCollect', false, 0.9);
                floatingTexts.push(new FloatingText(asyncDonkey.x + asyncDonkey.displayWidth / 2, asyncDonkey.y - 40, `+${value} Bits!`, '#FFD700', 22));
                if (asyncDonkey && !asyncDonkey.isDigesting) {
                    asyncDonkey.isDigesting = true;
                    asyncDonkey.digestTimer = asyncDonkey.digestDuration;
                }
            }
            MissionManager.updateMissionProgress('collect_bits', { value: value });
        };

        // [FEAT] Colori per animazione lampeggiante
        this.flashColors = ['#FFD700', '#FFA500', '#FFCC00', '#FFDB58']; // Oro, Arancione, Giallo
    }

    update(dt) {
        this.x -= gameSpeed * dt;
        this.animation.update(dt);

        this.angle += this.frequency * dt;
        this.y = this.initialY + Math.sin(this.angle) * this.amplitude;

        this.textAnimationTimer += dt * 5;
        this.textOffset = Math.sin(this.textAnimationTimer) * 2;
    }

    draw(ctx) {
        if (this.animation && this.sprite && this.sprite.complete) {
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, RICH_BITS_FRAME_WIDTH, RICH_BITS_FRAME_HEIGHT, this.x, this.y, this.width, this.height);
        }

        // [FEAT] Disegna il testo con animazione di colore
        ctx.save();
        const colorIndex = Math.floor(Date.now() / 150) % this.flashColors.length; // Cambia colore ogni 150ms
        ctx.fillStyle = this.flashColors[colorIndex]; // Colore lampeggiante
        ctx.font = `bold ${this.fontSize}px "Courier Prime", monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x + this.width / 2, this.y - 5 + this.textOffset);
        ctx.restore();
    }
}

// CLASSE DataPackageCollectible
class DataPackageCollectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = 'data_pkg'; // NUOVO: Definisci il tipo
        this.width = DATA_PKG_TARGET_WIDTH;
        this.height = DATA_PKG_TARGET_HEIGHT;
        this.sprite = images['dataPackage'];
        this.animation = new SpriteAnimation(this.sprite, DATA_PKG_FRAME_WIDTH, DATA_PKG_FRAME_HEIGHT, DATA_PKG_NUM_FRAMES, 0.1);
        
        this.text = 'DATA PKG';
        this.textColor = '#95ffcf'; // Viola (colore di base)
        this.fontSize = 12;
        this.textOffset = 0;
        this.textAnimationTimer = Math.random() * Math.PI * 2;
        // Metodo collect per gestire la raccolta dell'oggetto
        this.collect = (options = {}) => {
            const randomBits = Math.floor(Math.random() * 20) + 10;
            bits += randomBits;
            gameStats.dataPacketsCollected++;
            if (options.byCompanion) {
                AudioManager.playSound('bitCollect', false, 0.5); // Suono più basso per compagno
            } else {
                AudioManager.playSound('bitCollect', false, 0.7);
                floatingTexts.push(new FloatingText(asyncDonkey.x + asyncDonkey.displayWidth / 2, asyncDonkey.y - 40, `+${randomBits} Bits!`, '#9370DB', 20)); 
                if (asyncDonkey && !asyncDonkey.isDigesting) {
                    asyncDonkey.isDigesting = true;
                    asyncDonkey.digestTimer = asyncDonkey.digestDuration;
                }
            }
            MissionManager.updateMissionProgress('collect_datapackets', { count: 1 });
        };

        // [FEAT] Colori per animazione lampeggiante
        this.flashColors = ['#9370DB', '#8A2BE2', '#BA55D3', '#DA70D6']; // Diverse tonalità di viola
    }

    update(dt) {
        this.x -= gameSpeed * dt;
        this.animation.update(dt);
        this.textAnimationTimer += dt * 5;
        this.textOffset = Math.sin(this.textAnimationTimer) * 2;
    }

    draw(ctx) {
        if (this.animation && this.sprite && this.sprite.complete) {
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, DATA_PKG_FRAME_WIDTH, DATA_PKG_FRAME_HEIGHT, this.x, this.y, this.width, this.height);
        }

        // [FEAT] Disegna il testo con animazione di colore
        ctx.save();
        const colorIndex = Math.floor(Date.now() / 150) % this.flashColors.length; // Cambia colore ogni 150ms
        ctx.fillStyle = this.flashColors[colorIndex]; // Colore lampeggiante
        ctx.font = `bold ${this.fontSize}px "Courier Prime", monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x + this.width / 2, this.y - 5 + this.textOffset);
        ctx.restore();
    }
}
// CLASSE DigitalFruitCollectible
// Metodo collect per la classe DigitalFruitCollectible
class DigitalFruitCollectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = DIGITAL_FRUIT_TARGET_WIDTH;
        this.height = DIGITAL_FRUIT_TARGET_HEIGHT;
        
        let displayName = type.charAt(0).toUpperCase() + type.slice(1);
        switch(type) {
            case 'kiwi': this.sprite = images['digitalKiwi']; break;
            case 'orange': this.sprite = images['digitalOrange']; break;
            case 'pear': this.sprite = images['digitalPear']; break;
            // --- INIZIO NUOVI CASI DIGITAL FRUITS ---
            case 'apple': this.sprite = images['digitalApple']; break;
            case 'banana': this.sprite = images['digitalBanana']; break;
            case 'berry': this.sprite = images['digitalBerry']; break;
            case 'blueberry': this.sprite = images['digitalBlueberry']; break;
            case 'cherry': this.sprite = images['digitalCherry']; break;
            case 'coconut': this.sprite = images['digitalCoconut']; break;
            case 'dragonfruit': this.sprite = images['digitalDragonfruit']; displayName = 'Dragon Fruit'; break;
            case 'grapes': this.sprite = images['digitalGrapes']; break;
            case 'lemon': this.sprite = images['digitalLemon']; break;
            case 'melon': this.sprite = images['digitalMelon']; break;
            case 'papaya': this.sprite = images['digitalPapaya']; break;
            case 'peach': this.sprite = images['digitalPeach']; break;
            case 'pineapple': this.sprite = images['digitalPineapple']; break;
            case 'strawberry': this.sprite = images['digitalStrawberry']; break;
            case 'watermelon': this.sprite = images['digitalWatermelon']; break;
            // --- FINE NUOVI CASI DIGITAL FRUITS ---
            default: this.sprite = images['digitalPear']; displayName = 'Fruit'; // Fallback
        }
        this.text = `${displayName} DATA`; // Modifica il testo per includere il nome del frutto
        this.textColor = '#30e1b9'; // Verde acqua (colore di base, sarà sovrascritto dall'animazione)
        this.fontSize = 14;

        this.animation = new SpriteAnimation(this.sprite, DIGITAL_FRUIT_FRAME_WIDTH, DIGITAL_FRUIT_FRAME_HEIGHT, DIGITAL_FRUIT_NUM_FRAMES, 0.05);
        this.textOffset = 0;
        this.textAnimationTimer = Math.random() * Math.PI * 2;
        // Metodo collect per gestire la raccolta dell'oggetto
        this.collect = (options = {}) => {
            // --- INIZIO AGGIORNAMENTO CONTATORI DIGITAL FRUITS ---
            switch(this.type) {
                case 'kiwi': gameStats.digitalKiwiCollected++; break;
                case 'orange': gameStats.digitalOrangeCollected++; break;
                case 'pear': gameStats.digitalPearCollected++; break;
                case 'apple': gameStats.digitalAppleCollected++; break;
                case 'banana': gameStats.digitalBananaCollected++; break;
                case 'berry': gameStats.digitalBerryCollected++; break;
                case 'blueberry': gameStats.digitalBlueberryCollected++; break;
                case 'cherry': gameStats.digitalCherryCollected++; break;
                case 'coconut': gameStats.digitalCoconutCollected++; break;
                case 'dragonfruit': gameStats.digitalDragonfruitCollected++; break;
                case 'grapes': gameStats.digitalGrapesCollected++; break;
                case 'lemon': gameStats.digitalLemonCollected++; break;
                case 'melon': gameStats.digitalMelonCollected++; break;
                case 'papaya': gameStats.digitalPapayaCollected++; break;
                case 'peach': gameStats.digitalPeachCollected++; break;
                case 'pineapple': gameStats.digitalPineappleCollected++; break;
                case 'strawberry': gameStats.digitalStrawberryCollected++; break;
                case 'watermelon': gameStats.digitalWatermelonCollected++; break;
            }
            // --- FINE AGGIORNAMENTO CONTATORI DIGITAL FRUITS ---
            
            gameStats.digitalFruitsCollected++;
            
            if (options.byCompanion) {
                AudioManager.playSound(SFX_COMPANION_FRUIT_COLLECT, false, 0.7);
            } else {
                AudioManager.playSound(SFX_FRUIT_COLLECT, false, 0.7);
                floatingTexts.push(new FloatingText(asyncDonkey.x + asyncDonkey.displayWidth / 2, asyncDonkey.y - 40, `+1 ${displayName}!`, '#30e1b9', 20)); 
                if (asyncDonkey && !asyncDonkey.isDigesting) {
                    asyncDonkey.isDigesting = true;
                    asyncDonkey.digestTimer = asyncDonkey.digestDuration;
                }
            }
            MissionManager.updateMissionProgress('collect_digital_fruits', { type: this.type, count: 1 });
        };
        // [FEAT] Colori specifici per l'animazione della frutta
        this.flashColors = ['#31b0b0', '#46cfb3', '#73f0c6', '#abffd1', '#d9ffe2'];
    }

    update(dt) {
        this.x -= gameSpeed * dt;
        this.animation.update(dt);
        this.textAnimationTimer += dt * 5;
        this.textOffset = Math.sin(this.textAnimationTimer) * 2;
    }

    draw(ctx) {
        if (this.animation && this.sprite && this.sprite.complete) {
            ctx.save();

            const glowIntensity = (Math.sin(Date.now() / 150) + 1) / 2;
            const baseGlowBlur = 5;
            const pulsatingBlur = baseGlowBlur + glowIntensity * 5;

            ctx.shadowColor = 'rgba(149, 255, 207, 0.8)';    
            ctx.shadowBlur = pulsatingBlur;

            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, DIGITAL_FRUIT_FRAME_WIDTH, DIGITAL_FRUIT_FRAME_HEIGHT, this.x, this.y, this.width, this.height);

            ctx.restore();
        }

        ctx.save();
        const colorIndex = Math.floor(Date.now() / 150) % this.flashColors.length; 
        ctx.fillStyle = this.flashColors[colorIndex]; 
        ctx.font = `bold ${this.fontSize}px "Courier Prime", monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x + this.width / 2, this.y - 5 + this.textOffset);
        ctx.restore();
    }
}


class FloatingText {
    constructor(x, y, text, color = '#ebebf0', fontSize = 16, duration = 1.2) { // MODIFICATO: Aggiunti color, fontSize, duration con default
        this.x = x;
        this.y = y;
        this.text = text;
        this.life = duration; // Usa duration passata
        this.vy = -40; // Velocità di salita (pixel al secondo)
        this.alpha = 1.0;
        this.color = color; // Usa il colore passato
        this.fontSize = fontSize; // Usa la dimensione del font passata
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt;
        
        if (this.life < 0.5) {
            this.alpha = this.life / 0.5;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color; // Ora usa il colore dell'istanza
        ctx.font = `${this.fontSize}px "Courier Prime", cursive`; // Usa fontSize dell'istanza
        ctx.textAlign = 'center';
        ctx.shadowColor = '#a6a6bf'; // Ombra per leggibilità
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }

    isFinished() { // Assicurati che questo metodo sia presente per la rimozione dall'array
        return this.life <= 0;
    }
}

// NUOVA CLASSE: DigitalRainParticle (Copia da menuAnimation.js, adattata per donkeyRunner.js)
class DigitalRainParticle {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        this.reset();

        const chars = '01';
        this.char = chars[Math.floor(Math.random() * chars.length)];

        this.size = Math.random() * 8 + 6;
        this.color = `rgba(255, 0, 0, ${0.5 + Math.random() * 0.5})`; // Colore rosso accesso
    }

    reset() {
        this.x = Math.random() * this.canvasWidth;
        this.y = -Math.random() * this.canvasHeight;
        this.speed = Math.random() * 80 + 50;
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;
        if (this.y > this.canvasHeight) {
            this.reset();
        }
    }

    draw() { // Usa il contesto globale 'ctx'
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.font = `${this.size}px "Courier Prime", monospace`;
        ctx.fillText(this.char, this.x, this.y);
        ctx.restore();
    }
}

class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = OBSTACLE_TARGET_WIDTH;
        this.height = OBSTACLE_TARGET_HEIGHT;
        this.health = OBSTACLE_HEALTH;

        // [FEAT] NUOVO: Selezione casuale dello sprite dell'ostacolo con le nuove varianti
        const obstacleSpriteChoices = [
            'obstacle', // L'originale 'codeBlock.png'
            'obstacleVar1',
            'obstacleVar2',
            'obstacleVar3', // [FEAT] Aggiungi nuova variante 3
            'obstacleVar4', // [FEAT] Aggiungi nuova variante 4
            'obstacleVar5'  // [FEAT] Aggiungi nuova variante 5
        ];
        // Scegli uno sprite a caso dall'array
        const randomSpriteKey = obstacleSpriteChoices[Math.floor(Math.random() * obstacleSpriteChoices.length)];
        this.sprite = images[randomSpriteKey]; // Assegna lo sprite scelto

        // Assicurati che l'animazione venga sempre creata, dato che ora tutti gli ostacoli sono animati
        this.animation = null;
        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            // Se lo sprite ha più di 1 frame, crea l'animazione
            if (OBSTACLE_NUM_FRAMES > 1) { // Ora OBSTACLE_NUM_FRAMES è 4
                this.animation = new SpriteAnimation(
                    this.sprite,
                    OBSTACLE_ACTUAL_FRAME_WIDTH,
                    OBSTACLE_ACTUAL_FRAME_HEIGHT,
                    OBSTACLE_NUM_FRAMES,
                    OBSTACLE_ANIMATION_SPEED // Usa la nuova velocità di animazione
                );
            }
        } else {
            console.warn(`Sprite ostacolo non caricato o rotto per la chiave '${randomSpriteKey}'. Sprite:`, this.sprite);
            // Fallback: se lo sprite non si carica, l'animazione rimane null e userà il fallback di disegno
        }
    }

    update(dt) {
        this.x -= gameSpeed * dt;
        // Aggiorna l'animazione solo se esiste
        if (this.animation) this.animation.update(dt);
    }

    draw() {
        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        
        // [FEAT] Applica un leggero glow rosso agli ostacoli
        ctx.save(); // Salva lo stato corrente del contesto

        const glowIntensity = (Math.sin(Date.now() / 200) + 1) / 2; // Valore tra 0 e 1 per pulsazione
        const baseGlowBlur = 5; // Sfocatura base
        const pulsatingBlur = baseGlowBlur + glowIntensity * 3; // Sfocatura che pulsa tra 5 e 8

        ctx.shadowColor = 'rgba(255, 0, 0, 0.7)'; // Colore rosso semitrasparente
        ctx.shadowBlur = pulsatingBlur; // Applica il glow pulsante

        if (this.animation && spriteUsable) {
            // Disegna il frame corrente dell'animazione
            const f = this.animation.getFrame();
            ctx.drawImage(
                this.sprite,
                f.sx,
                f.sy,
                f.sWidth, // Usa la larghezza del frame dall'animazione
                f.sHeight, // Usa l'altezza del frame dall'animazione
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else if (spriteUsable) {
            // Fallback per sprite non animato (dovrebbe essere raro ora)
            ctx.drawImage(
                this.sprite,
                0,
                0,
                OBSTACLE_ACTUAL_FRAME_WIDTH, // O la larghezza naturale se conosciuta
                OBSTACLE_ACTUAL_FRAME_HEIGHT, // O l'altezza naturale se conosciuta
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else {
            // Fallback di disegno (riquadro colorato) se lo sprite non è disponibile
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        ctx.restore(); // Ripristina lo stato del contesto (rimuove il glow per gli elementi successivi)
    }
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            AudioManager.playSound('blockBreak');
            return true;
        }
        return false;
    }
}

class Projectile {
    // The constructor now accepts a 'type' and optionally an 'equippedBulletSkinId' for custom skins
    constructor(x, y, type = 'normal', equippedBulletSkinId = null) {
        this.x = x;
        this.y = y;
        this.type = type; // Store the functional type
        this.animation = null;

        // Step 1: Apply functional power-up projectile properties (damage, speed, sprite, animation)
        // This logic always takes precedence for functional projectiles.
        switch (this.type) {
            case 'slayer':
                this.width = SLAYER_PROJECTILE_TARGET_WIDTH;
                this.height = SLAYER_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed;
                this.damage = SLAYER_PROJECTILE_DAMAGE;
                this.sprite = images['slayerProjectile'];
                if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && SLAYER_PROJECTILE_NUM_FRAMES > 1) {
                    this.animation = new SpriteAnimation(this.sprite, SLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH, SLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT, SLAYER_PROJECTILE_NUM_FRAMES, PLAYER_PROJECTILE_ANIMATION_SPEED);
                }
                break;
            case 'injector':
                this.width = CODE_INJECTOR_PROJECTILE_TARGET_WIDTH;
                this.height = CODE_INJECTOR_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed;
                this.damage = CODE_INJECTOR_PROJECTILE_DAMAGE;
                this.sprite = images['codeInjectorProjectile'];
                if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && CODE_INJECTOR_PROJECTILE_NUM_FRAMES > 1) {
                    this.animation = new SpriteAnimation(this.sprite, CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_WIDTH, CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_HEIGHT, CODE_INJECTOR_PROJECTILE_NUM_FRAMES, PLAYER_PROJECTILE_ANIMATION_SPEED);
                }
                break;
            case 'debug':
                this.width = PLAYER_PROJECTILE_TARGET_WIDTH;
                this.height = PLAYER_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed;
                this.damage = 2;
                this.sprite = images['playerUpgradedProjectile'];
                if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && PLAYER_PROJECTILE_NUM_FRAMES > 1) {
                    this.animation = new SpriteAnimation(this.sprite, PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH, PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT, PLAYER_PROJECTILE_NUM_FRAMES, PLAYER_PROJECTILE_ANIMATION_SPEED);
                }
                break;
            case 'machine_language':
                this.width = MACHINE_LANGUAGE_PROJECTILE_TARGET_WIDTH;
                this.height = MACHINE_LANGUAGE_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed * 1.2;
                this.damage = 1;
                this.sprite = images['machineLanguageProjectile'];
                if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
                    this.animation = new SpriteAnimation(this.sprite, MACHINE_LANGUAGE_PROJECTILE_ACTUAL_FRAME_WIDTH, MACHINE_LANGUAGE_PROJECTILE_ACTUAL_FRAME_HEIGHT, MACHINE_LANGUAGE_PROJECTILE_NUM_FRAMES, 0.08);
                }
                break;
            case 'rain_projectile': // Proiettile per la Rain Run
                this.width = RAIN_PROJECTILE_TARGET_WIDTH;
                this.height = RAIN_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed;
                this.damage = RAIN_PROJECTILE_DAMAGE;
                this.sprite = images['rainProjectile']; // Sprite specifico per la pioggia

                // // >>> INIZIO MODIFICA: Aggiungi log di debug qui
                // console.log("DEBUG (Projectile Constructor): 'rain_projectile' type detected.");
                // console.log("DEBUG (Projectile Constructor): Assigned sprite object:", this.sprite);
                // console.log("DEBUG (Projectile Constructor): Sprite complete property:", this.sprite?.complete);
                // console.log("DEBUG (Projectile Constructor): Sprite naturalWidth property:", this.sprite?.naturalWidth);
                // // <<< FINE MODIFICA

                if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && RAIN_PROJECTILE_NUM_FRAMES > 1) {
                    this.animation = new SpriteAnimation(this.sprite, RAIN_PROJECTILE_ACTUAL_FRAME_WIDTH, RAIN_PROJECTILE_ACTUAL_FRAME_HEIGHT, RAIN_PROJECTILE_NUM_FRAMES, PLAYER_PROJECTILE_ANIMATION_SPEED);
                } else {
                    // Aggiungi un avviso se lo sprite non è valido
                    console.warn("WARN (Projectile Constructor): Rain Projectile sprite is not ready or invalid. Using fallback/no animation.");
                }
                break;
            case 'normal': // This is the case where a cosmetic skin might apply
            default:
                this.width = PLAYER_PROJECTILE_TARGET_WIDTH;
                this.height = PLAYER_PROJECTILE_TARGET_HEIGHT;
                this.speed = projectileSpeed;
                this.damage = 1;
                this.sprite = images['playerProjectile']; // Default projectile
                if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && PLAYER_PROJECTILE_NUM_FRAMES > 1) {
                    this.animation = new SpriteAnimation(this.sprite, PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH, PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT, PLAYER_PROJECTILE_NUM_FRAMES, PLAYER_PROJECTILE_ANIMATION_SPEED);
                }
                break;
        }

        // Step 2: If the projectile type is 'normal' (i.e., not a functional power-up override),
        // apply the equipped cosmetic skin.
        // This happens AFTER the functional type is set, ensuring functional priority.
        // ASSICURARSI CHE LA LOGICA 'equippedBulletSkinId' NON SOVRASCRIVA IL PROIETTILE 'rain_projectile'.
        // LA CONDIZIONE `this.type === 'normal'` GESTISCE GIÀ QUESTO.
        if (this.type === 'normal' && equippedBulletSkinId && SKIN_ASSET_MAP[equippedBulletSkinId]?.projectile) {
            const cosmeticSprite = images[`bulletSkin_${equippedBulletSkinId}_projectile`];
            if (cosmeticSprite && cosmeticSprite.complete && cosmeticSprite.naturalWidth > 0) {
                this.sprite = cosmeticSprite;
                this.animation = new SpriteAnimation(this.sprite, PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH, PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT, PLAYER_PROJECTILE_NUM_FRAMES, PLAYER_PROJECTILE_ANIMATION_SPEED);
                console.log(`Applied cosmetic bullet skin: ${equippedBulletSkinId}`);
            } else {
                console.warn(`Failed to load cosmetic bullet skin: ${equippedBulletSkinId}. Using default projectile sprite.`);
            }
        }
    }
    update(dt) {
        this.x += this.speed * dt;
        if (this.animation) this.animation.update(dt);
    }
    draw() {
        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if (this.animation && spriteUsable) {
            const frame = this.animation.getFrame();
            ctx.drawImage(
                this.sprite,
                frame.sx,
                frame.sy,
                this.animation.frameWidth,
                this.animation.frameHeight,
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else if (spriteUsable) {
            // Fallback for non-animated sprite or with a single frame
            // >>> START OF MODIFICATION
            let sourceFrameW = this.animation ? this.animation.frameWidth : this.sprite.naturalWidth;
            let sourceFrameH = this.animation ? this.animation.frameHeight : this.sprite.naturalHeight;
            if (this.type === 'normal' || this.type === 'debug') {
                // For standard projectiles that might have a single frame sprite
                sourceFrameW = PLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH;
                sourceFrameH = PLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT;
            } else if (this.type === 'slayer') {
                sourceFrameW = SLAYER_PROJECTILE_ACTUAL_FRAME_WIDTH;
                sourceFrameH = SLAYER_PROJECTILE_ACTUAL_FRAME_HEIGHT;
            } else if (this.type === 'injector') {
                sourceFrameW = CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_WIDTH;
                sourceFrameH = CODE_INJECTOR_PROJECTILE_ACTUAL_FRAME_HEIGHT;
            }
            // <<< END OF MODIFICATION
            ctx.drawImage(
                this.sprite,
                0,
                0, // Assume 0,0 for the first frame if no animation
                sourceFrameW,
                sourceFrameH,
                this.x,
                this.y,
                this.width,
                this.height
            );
        } else {
            // Fallback drawing for projectiles without valid sprite
            let color = '#FF0000'; // Default for broken projectile
            if (this.type === 'normal') color = PALETTE.BRIGHT_TEAL;
            if (this.type === 'debug') color = PALETTE.BRIGHT_GREEN_TEAL;
            if (this.type === 'slayer') color = '#FF6347'; // Example color for Slayer
            if (this.type === 'injector') color = '#6A5ACD'; // Example color for Injector

            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}
class BaseEnemy {
    constructor(
        x,
        y,
        targetW,
        targetH,
        spriteNameKey,
        frameW,
        frameH,
        numFrames,
        speedMult,
        hp = 1,
        fallbackColor = '#ccc',
        scoreValue = 25
    ) {
        this.x = x;
        this.y = y;
        this.width = targetW;
        this.height = targetH;
        this.speed = gameSpeed * speedMult;
        this.health = hp;
        this.maxHealth = hp;
        this.baseSpriteName = spriteNameKey;
        this.sprite = images[spriteNameKey];
        this.fallbackColor = fallbackColor;
        this.animation = null;
        this.numFrames = numFrames;
        this.frameWidth = frameW;
        this.frameHeight = frameH;
        this.scoreValue = scoreValue;
        this.animations = {};
        this.isWarning = false;
        this.warningTimer = 0;

        // [CORRECTION] Assicurati che l'animazione base sia caricata e impostata
        this.loadAnimation(this.baseSpriteName, this.frameWidth, this.frameHeight, this.numFrames, 'base');
        this.animation = this.animations.base; // Imposta l'animazione corrente a 'base' dopo averla caricata
    }

    loadAnimation(spriteNameKeyToLoad, frameW, frameH, numFramesAnim, animationKey) {
        const spriteInstance = images[spriteNameKeyToLoad];
        if (spriteInstance && spriteInstance.complete && spriteInstance.naturalWidth > 0 && numFramesAnim > 0) {
            this.animations[animationKey] = new SpriteAnimation(spriteInstance, frameW, frameH, numFramesAnim);
            // [CORRECTION] Rimosso il blocco if (animationKey === 'base' && !this.animation) per evitare reset e sovrascritture inattese
            // L'impostazione iniziale di this.animation è ora gestita nel costruttore.
        } else {
            console.warn(
                `BaseEnemy.loadAnimation FALLITO per sprite key '${spriteNameKeyToLoad}' (anim key: ${animationKey}). Sprite:`,
                spriteInstance
            );
            this.animations[animationKey] = null;
            // [CORRECTION] Non toccare this.animation qui, verrà gestito esternamente dal costruttore o da updateCurrentAnimation
        }
    }
    update(dt) {
        this.x -= this.speed * dt;
        if (this.animation) this.animation.update(dt);
    }
    draw() {
        let currentAnimToDraw = this.animation;
        let spriteToUse = currentAnimToDraw ? currentAnimToDraw.spritesheet : this.sprite;
        const spriteUsable = spriteToUse && spriteToUse.complete && spriteToUse.naturalWidth > 0;

        if (currentAnimToDraw && spriteUsable) {
            const f = currentAnimToDraw.getFrame();
            ctx.drawImage(spriteToUse, f.sx, f.sy, f.sWidth, f.sHeight, this.x, this.y, this.width, this.height);
        } else if (spriteUsable && !currentAnimToDraw) {
            ctx.drawImage(spriteToUse, 0, 0, this.frameWidth, this.frameHeight, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.fallbackColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
        if (this.isWarning) {
            ctx.fillStyle = WARNING_EXCLAMATION_COLOR;
            ctx.font = WARNING_EXCLAMATION_FONT;
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x + this.width / 2, this.y + WARNING_EXCLAMATION_OFFSET_Y);
        }

        // NUOVO: Disegna la barra della vita come barra di caricamento con percentuale
        if (this.maxHealth > 1) { // Disegna la barra solo se ha più di 1 HP max
            const healthBarWidth = this.width * 0.8;
            const healthBarHeight = 8; // Altezza leggermente maggiore per il testo
            const healthBarX = this.x + (this.width - healthBarWidth) / 2;
            const healthBarY = this.y - healthBarHeight - 10; // Spostato leggermente più in alto per il testo

            // Barra di sfondo (grigia)
            ctx.fillStyle = 'rgba(100,100,100,0.7)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

            // Barra di vita attuale (verde/rossa)
            const currentHealthWidth = healthBarWidth * (this.health / this.maxHealth);
            ctx.fillStyle = this.health > this.maxHealth * 0.3 ? 'rgba(0,255,0,0.7)' : 'rgba(255,0,0,0.7)'; // Verde o Rosso (sotto 30%)
            ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

            // Bordo della barra
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);


            // Testo percentuale
            const percentage = (this.health / this.maxHealth) * 100;
            ctx.fillStyle = '#FFFFFF'; // Colore del testo bianco
            ctx.font = 'bold 10px "Courier Prime", monospace'; // Font più piccolo
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 3;
            ctx.fillText(`${percentage.toFixed(0)}%`, healthBarX + healthBarWidth / 2, healthBarY + healthBarHeight / 2 + 3); // Centra il testo
            ctx.shadowBlur = 0; // Resetta l'ombra dopo il testo
        }
    }
    takeDamage(dmg = 1) {
        this.health -= dmg;
        if (this.health < 0) this.health = 0;
        
    }
}

class ArmoredEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            ENEMY_THREE_TARGET_WIDTH,
            ENEMY_THREE_TARGET_HEIGHT,
            'enemyThreeBase',
            ENEMY_THREE_ACTUAL_FRAME_WIDTH,
            ENEMY_THREE_ACTUAL_FRAME_HEIGHT,
            ENEMY_THREE_NUM_FRAMES,
            armoredEnemySpeedMultiplier,
            ARMORED_ENEMY_HEALTH,
            '#A9A9A9',
            50
        );
        this.loadAnimation(
            'enemyThreeDmg1',
            ENEMY_THREE_ACTUAL_FRAME_WIDTH,
            ENEMY_THREE_ACTUAL_FRAME_HEIGHT,
            ENEMY_THREE_NUM_FRAMES,
            '2'
        );
        this.loadAnimation(
            'enemyThreeDmg2',
            ENEMY_THREE_ACTUAL_FRAME_WIDTH,
            ENEMY_THREE_ACTUAL_FRAME_HEIGHT,
            ENEMY_THREE_NUM_FRAMES,
            '1'
        );
        this.updateCurrentAnimation();
    }
    updateCurrentAnimation() {
        let animKey = 'base';
        if (this.health === 2) animKey = '2';
        else if (this.health === 1) animKey = '1';
        this.animation = this.animations[animKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }
    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        this.updateCurrentAnimation();
    }
}

class ShootingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            ENEMY_FOUR_TARGET_WIDTH,
            ENEMY_FOUR_TARGET_HEIGHT,
            'enemyFourIdle',
            ENEMY_FOUR_ACTUAL_FRAME_WIDTH,
            ENEMY_FOUR_ACTUAL_FRAME_HEIGHT,
            ENEMY_FOUR_IDLE_NUM_FRAMES,
            0.5,
            1,
            '#FF69B4',
            40
        );
        this.shootTimer = Math.random() * SHOOTING_ENEMY_SHOOT_INTERVAL + 1.5;
        this.projectileSpriteName = 'enemyFourProjectile';
        this.projectileFrameWidth = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_WIDTH;
        this.projectileFrameHeight = ENEMY_FOUR_PROJECTILE_ACTUAL_FRAME_HEIGHT;
        this.projectileNumFrames = ENEMY_FOUR_PROJECTILE_NUM_FRAMES;
        this.projectileTargetWidth = ENEMY_FOUR_PROJECTILE_TARGET_WIDTH;
        this.projectileTargetHeight = ENEMY_FOUR_PROJECTILE_TARGET_HEIGHT;
    }
    update(dt) {
        super.update(dt);
        if (this.isWarning) {
            this.warningTimer += dt;
            if (this.warningTimer >= WARNING_DURATION) {
                this.isWarning = false;
                this.warningTimer = 0;
                enemyProjectiles.push(
                    new EnemyProjectile(
                        this.x - this.projectileTargetWidth,
                        this.y + this.height / 2 - this.projectileTargetHeight / 2,
                        this.projectileSpriteName,
                        this.projectileFrameWidth,
                        this.projectileFrameHeight,
                        this.projectileNumFrames,
                        this.projectileTargetWidth,
                        this.projectileTargetHeight
                    )
                );
                AudioManager.playSound('enemyShootLight');
                this.shootTimer = 0;
            }
        } else {
            this.shootTimer += dt;
            if (this.shootTimer >= SHOOTING_ENEMY_SHOOT_INTERVAL) {
                this.isWarning = true;
                this.warningTimer = 0;
            }
        }
    }
}

class EnemyProjectile {
    constructor(x, y, spriteNameKey, frameW, frameH, numFrames, targetW, targetH, speed = ENEMY_PROJECTILE_SPEED, isHarmful = false, type = 'normal') { // NUOVO: Aggiunto parametro 'type'
        this.x = x;
        this.y = y;
        this.width = targetW;
        this.height = targetH;
        this.speed = speed;
        this.sprite = images[spriteNameKey];
        this.animation = null;
        this.isHarmful = isHarmful;
        this.type = type; // Memorizza il tipo di proiettile

        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && numFrames > 1) {
            this.animation = new SpriteAnimation(this.sprite, frameW, frameH, numFrames, 0.1);
        } else if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && numFrames === 1) { // Gestisce sprite a singolo frame
            // Non crea animazione se ha un solo frame, si usa direttamente l'immagine
            this.animation = null; // Assicurati che non ci sia un'animazione se lo sprite è a frame singolo
        } else {
            console.warn(`EnemyProjectile: Sprite non caricato o rotto per '${spriteNameKey}'.`);
        }
    }
    update(dt) {
        this.x -= this.speed * dt;
        if (this.animation) this.animation.update(dt);
    }
    draw() {
        const spriteUsable = this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0;
        if (this.animation && spriteUsable) {
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, f.sWidth, f.sHeight, this.x, this.y, this.width, this.height);
        } else if (spriteUsable) {
            const sourceFrameW = this.animation
                ? this.animation.frameWidth
                : this.sprite.naturalWidth /
                  (this.animation && this.animation.numFrames > 0 ? this.animation.numFrames : 1);
            const sourceFrameH = this.animation ? this.animation.frameHeight : this.sprite.naturalHeight;
            ctx.drawImage(this.sprite, 0, 0, sourceFrameW, sourceFrameH, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class ZigZagProjectile extends EnemyProjectile {
    constructor(x, y) {
        // Chiama il costruttore base con le informazioni del proiettile a zig-zag
        super(
            x, y,
            'trojanZigzagProjectile', // spriteKey
            TROJAN_BYTE_ZIGZAG_PROJECTILE_FRAME_WIDTH,
            TROJAN_BYTE_ZIGZAG_PROJECTILE_FRAME_HEIGHT,
            TROJAN_BYTE_ZIGZAG_PROJECTILE_NUM_FRAMES,
            TROJAN_BYTE_ZIGZAG_PROJECTILE_TARGET_WIDTH,
            TROJAN_BYTE_ZIGZAG_PROJECTILE_TARGET_HEIGHT,
            ENEMY_PROJECTILE_SPEED * 0.75, // <<-- 1. RALLENTATO ULTERIORMENTE
            true
        );

        // --- 2. NUOVA LOGICA PER IL MOVIMENTO VERTICALE CONTROLLATO ---

        // Definiamo i limiti verticali del movimento
        const topY = 80; // Altezza massima che può raggiungere (come un proiettile "alto")
        const bottomY = canvas.height - groundHeight - this.height - 35; // Altezza minima (come un proiettile "basso", con un po' di margine dal suolo)

        // Calcoliamo il centro e l'ampiezza dell'oscillazione
        this.verticalCenter = topY + (bottomY - topY) / 2;
        this.verticalAmplitude = (bottomY - topY) / 2;
        
        this.angle = Math.random() * Math.PI * 2; // Parte da un punto casuale dell'onda
        this.frequency = 3.5; // Frequenza dell'oscillazione (più bassa = onde più larghe)
    }

    update(dt) {
        // Il movimento orizzontale è gestito dal costruttore base
        super.update(dt);
        
        // Il movimento verticale ora oscilla tra i limiti definiti, senza mai uscire
        this.angle += this.frequency * dt;
        this.y = this.verticalCenter + Math.sin(this.angle) * this.verticalAmplitude;
    }
}



export class FlyingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            ENEMY_FIVE_TARGET_WIDTH,
            ENEMY_FIVE_TARGET_HEIGHT,
            'enemyFive', // Sprite fisso per questo tipo di nemico
            ENEMY_FIVE_ACTUAL_FRAME_WIDTH,
            ENEMY_FIVE_ACTUAL_FRAME_HEIGHT,
            ENEMY_FIVE_NUM_FRAMES,
            0.6 + Math.random() * 0.3, // Velocità casuale
            1, // Salute
            '#FFFF00', // Colore di fallback
            flyingEnemyScoreValue // Punteggio
        );
        this.initialY = y;
        this.angle = Math.random() * Math.PI * 2;
        this.amplitude = 20 + Math.random() * 20;
        this.frequency = 0.02 + Math.random() * 0.03;

        this.sudoText = "-sudo";
        this.sudoColors = [
            PALETTE.SUDO_COLOR_1,
            PALETTE.SUDO_COLOR_2,
            PALETTE.SUDO_COLOR_3,
            PALETTE.SUDO_COLOR_4
        ];
        this.currentColorIndex = 0;
        this.lastColorChangeTime = Date.now();
        this.colorChangeInterval = 150; // Millisecondi tra un cambio colore e l'altro
    }

    update(dt) {
        super.update(dt); // Chiama l'update del BaseEnemy per gestire il movimento X, ecc.

        // Movimento sinusoidale verticale
        this.angle += this.frequency;
        this.y = this.initialY + Math.sin(this.angle) * this.amplitude;

        // NUOVO: Aggiorna il colore del testo "-sudo" per l'animazione lampeggiante
        if (Date.now() - this.lastColorChangeTime > this.colorChangeInterval) {
            this.currentColorIndex = (this.currentColorIndex + 1) % this.sudoColors.length;
            this.lastColorChangeTime = Date.now();
        }
    }

    draw() {
        super.draw(); // Chiama il metodo draw del BaseEnemy per disegnare il nemico e la barra vita

        // NUOVO: Disegna il testo "-sudo" animato sopra il nemico
        // Solo per i FlyingEnemy "innocui" (non DangerousFlyingEnemy o KamikazeFlyingEnemy).
        // La proprietà `isDangerousFlyer` è impostata a `true` solo in DangerousFlyingEnemy.
        // I KamikazeFlyingEnemy non estendono FlyingEnemy, quindi non entreranno qui.
        if (!this.isDangerousFlyer) { // <-- AGGIUNGI QUESTA CONDIZIONE
            ctx.save(); // Salva lo stato del contesto

            ctx.font = 'bold 16px "Courier Prime", monospace'; // Font per il testo "-sudo"
            ctx.textAlign = 'center';

            // Imposta il colore del testo animato
            ctx.fillStyle = this.sudoColors[this.currentColorIndex];

            // Aggiungi un'ombra per far risaltare il testo
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            // Posiziona il testo leggermente sopra il nemico
            ctx.fillText(this.sudoText, this.x + this.width / 2, this.y - 15);

            ctx.restore(); // Ripristina lo stato del contesto
        }
    }
}

class ArmoredShootingEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            ENEMY_SIX_TARGET_WIDTH,
            ENEMY_SIX_TARGET_HEIGHT,
            'enemySixBase',
            ENEMY_SIX_ACTUAL_FRAME_WIDTH,
            ENEMY_SIX_ACTUAL_FRAME_HEIGHT,
            ENEMY_SIX_IDLE_NUM_FRAMES,
            0.4,
            ARMORED_SHOOTING_ENEMY_HEALTH,
            '#D2691E',
            60
        );
        this.shootTimer = Math.random() * ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL + 2.0;
        this.loadAnimation(
            'enemySixDmg1',
            ENEMY_SIX_ACTUAL_FRAME_WIDTH,
            ENEMY_SIX_ACTUAL_FRAME_HEIGHT,
            ENEMY_SIX_IDLE_NUM_FRAMES,
            'dmg1'
        );
        this.loadAnimation(
            'enemySixDmg2',
            ENEMY_SIX_ACTUAL_FRAME_WIDTH,
            ENEMY_SIX_ACTUAL_FRAME_HEIGHT,
            ENEMY_SIX_IDLE_NUM_FRAMES,
            'dmg2'
        );
        this.loadAnimation(
            'enemySixDmg3',
            ENEMY_SIX_ACTUAL_FRAME_WIDTH,
            ENEMY_SIX_ACTUAL_FRAME_HEIGHT,
            ENEMY_SIX_IDLE_NUM_FRAMES,
            'dmg3'
        );
        this.updateCurrentAnimation();
        this.projectileSpriteName = 'enemySixProjectile';
        this.projectileFrameWidth = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_WIDTH;
        this.projectileFrameHeight = ENEMY_SIX_PROJECTILE_ACTUAL_FRAME_HEIGHT;
        this.projectileNumFrames = ENEMY_SIX_PROJECTILE_NUM_FRAMES;
        this.projectileTargetWidth = ENEMY_SIX_PROJECTILE_TARGET_WIDTH;
        this.projectileTargetHeight = ENEMY_SIX_PROJECTILE_TARGET_HEIGHT;
    }
    updateCurrentAnimation() {
        let animKey;
        if (this.health === 4) animKey = 'base';
        else if (this.health === 3) animKey = 'dmg1';
        else if (this.health === 2) animKey = 'dmg2';
        else if (this.health === 1) animKey = 'dmg3';
        else animKey = 'base';
        this.animation = this.animations[animKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }
    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        this.updateCurrentAnimation();
    }
    update(dt) {
        super.update(dt);
        if (this.isWarning) {
            this.warningTimer += dt;
            if (this.warningTimer >= WARNING_DURATION) {
                this.isWarning = false;
                this.warningTimer = 0;
                const projectileY = this.y + this.height - this.projectileTargetHeight - 5;
                enemyProjectiles.push(
                    new EnemyProjectile(
                        this.x - this.projectileTargetWidth,
                        projectileY,
                        this.projectileSpriteName,
                        this.projectileFrameWidth,
                        this.projectileFrameHeight,
                        this.projectileNumFrames,
                        this.projectileTargetWidth,
                        this.projectileTargetHeight
                    )
                );
                AudioManager.playSound('enemyShootHeavy');
                this.shootTimer = 0;
            }
        } else {
            this.shootTimer += dt;
            if (this.shootTimer >= ARMORED_SHOOTING_ENEMY_SHOOT_INTERVAL) {
                this.isWarning = true;
                this.warningTimer = 0;
            }
        }
    }
}

class ToughBasicEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            ENEMY_SEVEN_TARGET_WIDTH,
            ENEMY_SEVEN_TARGET_HEIGHT,
            'enemySevenBase',
            ENEMY_SEVEN_ACTUAL_FRAME_WIDTH,
            ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT,
            ENEMY_SEVEN_NUM_FRAMES,
            0.6,
            TOUGH_BASIC_ENEMY_HEALTH,
            '#2E8B57',
            30
        );
        this.loadAnimation(
            'enemySevenDmg1',
            ENEMY_SEVEN_ACTUAL_FRAME_WIDTH,
            ENEMY_SEVEN_ACTUAL_FRAME_HEIGHT,
            ENEMY_SEVEN_NUM_FRAMES,
            'dmg1'
        );
        this.updateCurrentAnimation();
    }
    updateCurrentAnimation() {
        let animKey = this.health === 2 ? 'base' : this.health === 1 ? 'dmg1' : 'base';
        this.animation = this.animations[animKey] || this.animations['base'];
        if (this.animation && this.animation.reset) this.animation.reset();
    }
    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        this.updateCurrentAnimation();
    }
}

class DangerousFlyingEnemy extends FlyingEnemy {
    constructor(x, y) {
        super(x, y);
        this.baseSpriteName = 'dangerousFlyingEnemy';
        this.sprite = images[this.baseSpriteName];
        this.width = DANGEROUS_FLYING_ENEMY_TARGET_WIDTH;
        this.height = DANGEROUS_FLYING_ENEMY_TARGET_HEIGHT;
        this.health = DANGEROUS_FLYING_ENEMY_HEALTH;
        this.scoreValue = 150;
        this.fallbackColor = '#DC143C';
        this.animations = {};
        this.loadAnimation(
            this.baseSpriteName,
            DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_WIDTH,
            DANGEROUS_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT,
            DANGEROUS_FLYING_ENEMY_NUM_FRAMES,
            'base'
        );
        this.animation = this.animations['base'];
        this.isDangerousFlyer = true;
    }
}

// NUOVA CLASSE: KamikazeFlyingEnemy (sottoclasse di BaseEnemy)
class KamikazeFlyingEnemy extends BaseEnemy {
    constructor(x, y, targetPlayerX, targetPlayerY) {
        super(
            x,
            y,
            KAMIKAZE_FLYING_ENEMY_TARGET_WIDTH,
            KAMIKAZE_FLYING_ENEMY_TARGET_HEIGHT,
            'kamikazeFlyingEnemy', // Nome della chiave dello sprite
            KAMIKAZE_FLYING_ENEMY_ACTUAL_FRAME_WIDTH,
            KAMIKAZE_FLYING_ENEMY_ACTUAL_FRAME_HEIGHT,
            KAMIKAZE_FLYING_ENEMY_NUM_FRAMES,
            1.0, // Velocità base (moltiplicatore, poi viene scalato dalla velocità effettiva sotto)
            KAMIKAZE_FLYING_ENEMY_HEALTH,
            '#FF4500', // Colore fallback (Orange Red)
            KAMIKAZE_FLYING_ENEMY_SCORE_VALUE
        );
        this.name = 'KamikazeFlyingEnemy';
        this.initialX = x;
        this.initialY = y;

        // Calcola la direzione verso il giocatore al momento dello spawn
        const dx = targetPlayerX - this.x;
        const dy = targetPlayerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Se la distanza è zero, evita la divisione per zero e imposta una direzione di fallback
        if (distance === 0) {
            this.vx = -KAMIKAZE_FLYING_ENEMY_SPEED; // Vola dritto a sinistra
            this.vy = 0;
        } else {
            this.vx = (dx / distance) * KAMIKAZE_FLYING_ENEMY_SPEED;
            this.vy = (dy / distance) * KAMIKAZE_FLYING_ENEMY_SPEED;
        }
        console.log(`[FEAT] KamikazeFlyingEnemy istanziato a X:${x}, Y:${y} mirando a playerX:${targetPlayerX}, playerY:${targetPlayerY}`);
    }

    update(dt) {
        // Aggiorna la posizione in base alla velocità calcolata
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Aggiorna l'animazione dello sprite
        if (this.animation) this.animation.update(dt);
    }
    
    // Il metodo takeDamage di BaseEnemy è già gestito. Puoi personalizzarlo se necessario.
    // takeDamage(dmg = 1) {
    //     super.takeDamage(dmg);
    //     // ... logica aggiuntiva per la morte del kamikaze se necessario (es. esplosione diversa)
    // }
}

// NUOVA CLASSE: GlitchzillaSpecialProjectile - Aggiungi questa classe dopo EnemyProjectile
class GlitchzillaSpecialProjectile extends EnemyProjectile {
    constructor(x, y) {
        super(
            x, y,
            'glitchzillaSpecialProjectile', // Chiave sprite per il nuovo proiettile
            GLITCHZILLA_SPECIAL_PROJECTILE_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_SPECIAL_PROJECTILE_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_SPECIAL_PROJECTILE_NUM_FRAMES,
            GLITCHZILLA_SPECIAL_PROJECTILE_TARGET_WIDTH,
            GLITCHZILLA_SPECIAL_PROJECTILE_TARGET_HEIGHT,
            GLITCHZILLA_SPECIAL_PROJECTILE_SPEED, // Velocità specifica per questo proiettile
            true // È un proiettile dannoso
        );
        console.log(`[FEAT] GlitchzillaSpecialProjectile istanziato a X:${x}, Y:${y}`);
    }
}

class Glitchzilla extends BaseEnemy {
    constructor(x, y) {
        let initialHealth = GLITCHZILLA_HEALTH;
        if (isRainRunActive) {
            initialHealth = Math.ceil(initialHealth * 1.5); // Incrementa di 1/3, arrotonda per eccesso
        }
        super(
            x,
            y,
            GLITCHZILLA_TARGET_WIDTH,
            GLITCHZILLA_TARGET_HEIGHT,
            'glitchzillaBase',
            GLITCHZILLA_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_NUM_FRAMES,
            0.2,
            initialHealth, // UTILIZZA initialHealth CALCOLATA
            '#FF00FF',
            GLITCHZILLA_SCORE_VALUE
        );
        this.name = 'Glitchzilla';
        this.loadAnimation(
            'glitchzillaDmg1',
            GLITCHZILLA_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_NUM_FRAMES,
            'dmg1'
        );
        this.loadAnimation(
            'glitchzillaDmg2',
            GLITCHZILLA_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_NUM_FRAMES,
            'dmg2'
        );
        this.loadAnimation(
            'glitchzillaDmg3',
            GLITCHZILLA_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_NUM_FRAMES,
            'dmg3'
        );
        // [FEAT] Carica la nuova animazione di attacco
        this.loadAnimation(
            'glitchzillaAttackSprite', // Chiave per il nuovo sprite di attacco
            GLITCHZILLA_ACTUAL_FRAME_WIDTH,
            GLITCHZILLA_ACTUAL_FRAME_HEIGHT,
            GLITCHZILLA_ATTACK_NUM_FRAMES, // Usa il nuovo numero di frame per l'animazione di attacco
            'attack' // Chiave per accedere a questa animazione
        );

        this.updateCurrentAnimation();
        this.spawnTime = Date.now();
        this.attackSequence = [
            'warn_high',
            'high',
            'pause_short',
            'warn_medium',
            'medium',
            'pause_short',
            'warn_low',
            'low',
            'pause_long',
        ];
        this.attackSequenceIndex = 0;
        this.currentAttackPhaseDuration = 0;
        this.shotFiredInPhase = false;
        this.pauseShortDuration = 1.0; // [FEAT] Aumentato a 1.0s (da 0.75) per pause più lunghe
        this.pauseLongDuration = 3.0;    // [FEAT] Aumentato a 3.0s (da 2.0) per pause più lunghe

        // [FEAT] Nuove variabili per l'attacco speciale
        this.specialAttackReady = true; // Flag per controllare quando l'attacco speciale è disponibile
        this.specialAttackCooldown = 7.0; // [FEAT] Cooldown per l'attacco speciale (per non spammare)
        this.currentSpecialAttackCooldown = 0;
        this.playerTargetY = 0; // [FEAT] Per memorizzare la Y del player al momento del target lock
        this.soundPlayedInPhase = false; // [FEAT] Flag per il suono del target lock

        this.projectileSpriteName = 'glitchzillaProjectile';
        this.projectileFrameWidth = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_WIDTH;
        this.projectileFrameHeight = GLITCHZILLA_PROJECTILE_ACTUAL_FRAME_HEIGHT;
        this.projectileNumFrames = GLITCHZILLA_PROJECTILE_NUM_FRAMES;
        this.projectileTargetWidth = GLITCHZILLA_PROJECTILE_TARGET_WIDTH;
        this.projectileTargetHeight = GLITCHZILLA_PROJECTILE_TARGET_HEIGHT;
        AudioManager.playSound('glitchzillaSpawn');
        console.log('GLITCHZILLA SPAWNED! HP: ' + this.health);
    }

    updateCurrentAnimation() {
        let animKey;
        if (this.health > GLITCHZILLA_HEALTH * 0.75) animKey = 'base';
        else if (this.health > GLITCHZILLA_HEALTH * 0.5) animKey = 'dmg1';
        else if (this.health > GLITCHZILLA_HEALTH * 0.25) animKey = 'dmg2';
        else animKey = 'dmg3';

        // >>> START OF MODIFICATION
        // Don't reset the animation if the key is the same.
        // Reset only if the animation changes or if it's an "attack" animation that might require a specific reset.
        if (this.animation !== this.animations[animKey]) {
            this.animation = this.animations[animKey] || this.animations['base'];
            if (this.animation) {
                // Reset the animation only when it actually changes.
                // We do not reset here if it's the base or damaged animation for fluidity.
                // Attack animations might require a specific reset handled elsewhere.
            }
        }
    }
    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        console.log(`Glitchzilla took ${dmg} damage, HP: ${this.health}`);
        this.updateCurrentAnimation();
        AudioManager.playSound('glitchzillaHit');

        if (this.health <= 0) {
            console.log('Glitchzilla SCONFITTO! Assegno punteggio: ' + this.scoreValue);
            AudioManager.playSound('bossDefeat');
            playRandomBGM(); // Riparte la musica normale

            // >>> INIZIO MODIFICA: Aggiungi log di debug qui
            console.log("DEBUG (Boss Defeated): isRainingInGame:", isRainingInGame);
            console.log("DEBUG (Boss Defeated): gameRainParticles.length:", gameRainParticles.length);
            // <<< FINE MODIFICA

            score += this.scoreValue;
            activeMiniboss = null;
            isGlitchzillaDefeatedThisGame = true;

            // LOGICA DI DROP PER SLAYER_SUBROUTINE (20% di probabilità)
            if (Math.random() < 0.2) {
                // 20% chance
                console.log('Glitchzilla ha droppato Slayer Subroutine!');
                powerUpItems.push(
                    new PowerUpItem(
                        this.x + this.width / 2,
                        this.y + this.height / 2,
                        POWERUP_TYPE.SLAYER_SUBROUTINE,
                        images
                    )
                );
            }

            postBossCooldownActive = true;
            postBossCooldownTimer = 2.0;

            bossFightImminent = false;

            console.log(
                `Glitchzilla defeated. postBossCooldownActive: ${postBossCooldownActive}, bossFightImminent: ${bossFightImminent}`
            );
        }
    }
    draw() {
        // L'animazione corrente da disegnare è semplicemente 'this.animation',
        // che verrà aggiornata nel metodo 'update' in base allo stato del boss.
        let currentAnimToDraw = this.animation;
        let spriteToUse = currentAnimToDraw ? currentAnimToDraw.spritesheet : this.sprite;
        const spriteUsable = spriteToUse && spriteToUse.complete && spriteToUse.naturalWidth > 0;

        if (currentAnimToDraw && spriteUsable) {
            const f = currentAnimToDraw.getFrame();
            // Applica il filtro di colore magenta solo quando è in stato di avviso per l'attacco
            // (e quindi 'this.animation' è stato impostato su 'this.animations.attack' in update())
            if (this.isWarning) {
                ctx.save();
                // Effetto glitchy magenta pulsante durante l'avviso
                ctx.filter = `hue-rotate(${Math.sin(Date.now() / 100) * 20}deg) saturate(200%) brightness(120%)`;
                ctx.drawImage(spriteToUse, f.sx, f.sy, f.sWidth, f.sHeight, this.x, this.y, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(spriteToUse, f.sx, f.sy, f.sWidth, f.sHeight, this.x, this.y, this.width, this.height);
            }
        } else if (spriteUsable) {
            // Fallback per sprite non animato o con un solo frame
            ctx.drawImage(spriteToUse, 0, 0, this.frameWidth, this.frameHeight, this.x, this.y, this.width, this.height);
        } else {
            // Fallback di disegno (riquadro colorato) se lo sprite non è disponibile
            ctx.fillStyle = this.fallbackColor;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        // Disegna l'esclamazione di avviso sopra lo sprite
        if (this.isWarning) {
            ctx.fillStyle = WARNING_EXCLAMATION_COLOR;
            ctx.font = WARNING_EXCLAMATION_FONT;
            ctx.textAlign = 'center';
            ctx.fillText('!', this.x + this.width / 2, this.y + WARNING_EXCLAMATION_OFFSET_Y);
        }

        // Disegna la barra della vita (se pertinente)
        if (this.maxHealth > 1 && this.health > 0 && this.health < this.maxHealth) {
            const healthBarWidth = this.width * 0.8;
            const healthBarHeight = 5;
            const healthBarX = this.x + (this.width - healthBarWidth) / 2;
            const healthBarY = this.y - healthBarHeight - 3;
            ctx.fillStyle = 'rgba(100,100,100,0.7)';
            ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
            const currentHealthWidth = healthBarWidth * (this.health / this.maxHealth);
            ctx.fillStyle = 'rgba(0,255,0,0.7)';
            ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
        }
    }


    // Modifica il metodo update per Glitchzilla
    update(dt) {
        // Chiama il metodo update della classe base (movimento orizzontale, aggiornamento animazione corrente)
        super.update(dt);
        this.currentAttackPhaseDuration += dt;

        // Gestione del cooldown dell'attacco speciale
        if (!this.specialAttackReady) {
            this.currentSpecialAttackCooldown += dt;
            if (this.currentSpecialAttackCooldown >= this.specialAttackCooldown) {
                this.specialAttackReady = true;
                this.currentSpecialAttackCooldown = 0;
            }
        }

        let currentPhase = this.attackSequence[this.attackSequenceIndex];
        let phaseComplete = false;

        // Logica per l'attacco speciale basato sulla salute e sulla casualità
        if (this.health <= GLITCHZILLA_HEALTH * 0.5 && this.specialAttackReady && Math.random() < 0.3) { // 30% di probabilità
            let insertIndex = this.attackSequence.indexOf('pause_long');
            if (insertIndex === -1 || insertIndex === this.attackSequence.length - 1) {
                insertIndex = this.attackSequence.length;
            } else {
                insertIndex++;
            }

            this.attackSequence.splice(insertIndex, 0,
                'warn_target_lock',
                'delay_special_projectile',
                'special_projectile_shot',
                'pause_long_after_special'
            );
            this.specialAttackReady = false;
            console.log("Glitchzilla: Attacco speciale inserito nella sequenza!");
        }

        switch (currentPhase) {
            case 'warn_high':
            case 'warn_medium':
            case 'warn_low':
                this.isWarning = true;
                // [CORRECTION] Imposta l'animazione di attacco esplicitamente qui
                if (this.animations.attack) {
                    this.animation = this.animations.attack;
                }
                if (this.currentAttackPhaseDuration >= WARNING_DURATION) {
                    phaseComplete = true;
                    this.isWarning = false;
                    // >>> START OF MODIFICATION
                    // [CORRECTION] Torna all'animazione basata sulla salute quando il warning finisce
                    this.updateCurrentAnimation();
                    // <<< END OF MODIFICATION
                }
                break;

            case 'warn_target_lock':
                this.isWarning = true;
                if (this.animations.attack) {
                    this.animation = this.animations.attack;
                }
                if (!this.soundPlayedInPhase) {
                    // MODIFICA QUI: Usa il nuovo suono di caricamento per Glitchzilla
                    AudioManager.playSound(SFX_GLITCHZILLA_LOADING_SHOT);
                    this.playerTargetY = asyncDonkey.y + asyncDonkey.displayHeight / 2;
                    this.soundPlayedInPhase = true;
                }
                if (this.currentAttackPhaseDuration >= 1.5) {
                    phaseComplete = true;
                    this.isWarning = false;
                    this.soundPlayedInPhase = false;
                    this.updateCurrentAnimation();
                }
                break;

            case 'delay_special_projectile':
                this.isWarning = false; // Non è più in warning, ma è in attesa
                // L'animazione dovrebbe essere quella base o danneggiata, gestita da updateCurrentAnimation()
                if (this.currentAttackPhaseDuration >= 0.5) {
                    phaseComplete = true;
                }
                break;

            case 'high':
            case 'medium':
            case 'low':
                if (!this.shotFiredInPhase) {
                    let projectileY;
                    if (currentPhase === 'high')
                        projectileY = this.y + this.height * 0.2 - this.projectileTargetHeight / 2;
                    else if (currentPhase === 'medium')
                        projectileY = this.y + this.height * 0.65 - this.projectileTargetHeight / 2;
                    else projectileY = this.y + this.height * 0.8 - this.projectileTargetHeight / 2;
                    enemyProjectiles.push(
                        new EnemyProjectile(
                            this.x - this.projectileTargetWidth,
                            projectileY,
                            this.projectileSpriteName,
                            this.projectileFrameWidth,
                            this.projectileFrameHeight,
                            this.projectileNumFrames,
                            this.projectileTargetWidth,
                            this.projectileTargetHeight,
                            ENEMY_PROJECTILE_SPEED,
                            true
                        )
                    );
                    AudioManager.playSound('glitchzillaAttack');
                    this.shotFiredInPhase = true;
                }
                phaseComplete = true;
                break;

            case 'special_projectile_shot':
                if (!this.shotFiredInPhase) {
                    const projectileY = this.playerTargetY - GLITCHZILLA_SPECIAL_PROJECTILE_TARGET_HEIGHT / 2;
                    enemyProjectiles.push(
                        new GlitchzillaSpecialProjectile(
                            this.x - GLITCHZILLA_SPECIAL_PROJECTILE_TARGET_WIDTH,
                            projectileY
                        )
                    );
                    AudioManager.playSound(SFX_GLITCHZILLA_SPECIAL_ATTACK);
                    this.shotFiredInPhase = true;
                }
                phaseComplete = true;
                break;

            case 'pause_short':
                if (this.currentAttackPhaseDuration >= this.pauseShortDuration) {
                    phaseComplete = true;
                }
                break;
            case 'pause_long':
            case 'pause_long_after_special':
                if (this.currentAttackPhaseDuration >= this.pauseLongDuration) {
                    phaseComplete = true;
                }
                break;
        }

        if (phaseComplete) {
            this.attackSequenceIndex = (this.attackSequenceIndex + 1) % this.attackSequence.length;
            this.currentAttackPhaseDuration = 0;
            this.shotFiredInPhase = false;
            // Assicurati che l'animazione torni alla base se non è in warning.
            // Questa chiamata a updateCurrentAnimation() è essenziale per aggiornare l'animazione base
            // una volta che lo stato di warning è terminato e il boss torna alla sua animazione normale.
            // >>> START OF MODIFICATION
            if (!this.isWarning) { // Only if we are not entering a new warning state
                this.updateCurrentAnimation();
            }
            // <<< END OF MODIFICATION
        }
        if (this.x < canvas.width / 2) {
            this.x = canvas.width / 2;
        }
    }
}


class DelayedBurstProjectile extends EnemyProjectile {
    constructor(x, y) {
        super(
            x, y,
            'trojanZigzagProjectile', // Changed spriteKey to use the zig-zag sprite
            TROJAN_BYTE_ZIGZAG_PROJECTILE_FRAME_WIDTH, // Use zig-zag's frame width
            TROJAN_BYTE_ZIGZAG_PROJECTILE_FRAME_HEIGHT, // Use zig-zag's frame height
            TROJAN_BYTE_ZIGZAG_PROJECTILE_NUM_FRAMES, // Use zig-zag's frame count
            TROJAN_BYTE_ZIGZAG_PROJECTILE_TARGET_WIDTH, // Use zig-zag's target width
            TROJAN_BYTE_ZIGZAG_PROJECTILE_TARGET_HEIGHT, // Use zig-zag's target height
            0, // Initial speed is 0
            true // It's harmful
        );
        this.delay = 0.8; // Time to stay still (seconds)
        this.burstSpeed = 600; // Fast speed after delay (pixels/second)
        this.delayTimer = 0;
        this.isDelayed = true;
    }

    update(dt) {
        if (this.isDelayed) {
            this.delayTimer += dt;
            if (this.delayTimer >= this.delay) {
                this.isDelayed = false;
                this.speed = this.burstSpeed; // Switch to burst speed
            }
            // If still delayed, x does not change (remains "still")
        } else {
            // After delay, move normally at burstSpeed
            this.x -= this.speed * dt;
        }
        // Update animation regardless of movement
        if (this.animation) this.animation.update(dt);
    }
}

// donkeyRunner.js - TrojanByte Class Update
class TrojanByte extends BaseEnemy {
    constructor(x, y) {
        let initialHealth = TROJAN_BYTE_HEALTH;
        if (isRainRunActive) {
            initialHealth = Math.ceil(initialHealth * 1.5); // Incrementa di 1/3, arrotonda per eccesso
        }
        super(
            x, y,
            TROJAN_BYTE_TARGET_WIDTH, TROJAN_BYTE_TARGET_HEIGHT,
            'trojanByteBase',
            TROJAN_BYTE_ACTUAL_FRAME_WIDTH, TROJAN_BYTE_ACTUAL_FRAME_HEIGHT, TROJAN_BYTE_NUM_FRAMES,
            0.3, initialHealth, '#FF00FF', TROJAN_BYTE_SCORE_VALUE // UTILIZZA initialHealth CALCOLATA
        );
        this.name = 'TrojanByte';
        this.loadAnimation('trojanByteDmg1', TROJAN_BYTE_ACTUAL_FRAME_WIDTH, TROJAN_BYTE_ACTUAL_FRAME_HEIGHT, TROJAN_BYTE_NUM_FRAMES, 'dmg1');
        this.loadAnimation('trojanByteDmg2', TROJAN_BYTE_ACTUAL_FRAME_WIDTH, TROJAN_BYTE_ACTUAL_FRAME_HEIGHT, TROJAN_BYTE_NUM_FRAMES, 'dmg2');
        this.loadAnimation('trojanByteDmg3', TROJAN_BYTE_ACTUAL_FRAME_WIDTH, TROJAN_BYTE_ACTUAL_FRAME_HEIGHT, TROJAN_BYTE_NUM_FRAMES, 'dmg3');
        this.updateCurrentAnimation();

        // Logica di attacco
        this.state = 'ENTERING';
        this.attackPattern = [];
        this.currentActionIndex = 0;
        this.actionTimer = 0;
        
        // PAUSE CONFIGURABILI
        this.pauseLongDuration = 1.8; // Pausa lunga tra le sequenze (1.8s)
        this.pauseBetweenShots = 0.5; // Pausa breve tra i colpi di una raffica (Reduced from 0.9s)

        // Variabili per il nuovo attacco
        this.chargedBurstShotCount = 3; // Numero di proiettili nella raffica caricata
        this.chargeWarningDuration = 0.7; // Durata del warning prima della raffica
        this.burstShotInterval = 0.2; // Intervallo tra un proiettile e l'altro nella raffica

        console.log('TROJAN_BYTE SPAWNED! HP: ' + this.health);
    }
    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        console.log(`Trojan_Byte took ${dmg} damage, HP: ${this.health}`);
        this.updateCurrentAnimation();
        AudioManager.playSound('enemyHit');

        if (this.health <= 0) {
            console.log('TROJAN_BYTE SCONFITTO! Assegno punteggio: ' + this.scoreValue);
            AudioManager.playSound('bossDefeat');
            playRandomBGM();
            score += this.scoreValue;
            activeMiniboss = null;
            isTrojanByteDefeatedThisGame = true;
            if (!hasSlayerSubroutineUpgrade && Math.random() < 0.2) {
                console.log('Trojan Byte ha droppato Code Injector!');
                powerUpItems.push(new PowerUpItem(this.x + this.width / 2, this.y + this.height / 2, POWERUP_TYPE.CODE_INJECTOR, images));
            }
            postBossCooldownActive = true;
            postBossCooldownTimer = 2.0;
            bossFightImminent = false;
        }
    }

    generateNewAttackPattern() {
        this.attackPattern = [];

        const attackTypes = [
            'random_burst',
            'vertical_sweep_down',
            'vertical_sweep_up',
            'delayed_burst_sequence', // L'attacco "fermo e poi spara" (ora deprecato, ma mantenuto per riferimento)
            'charged_burst_attack', // NUOVO: Il nostro nuovo attacco a raffica caricata
        ];

        // Scegli un tipo di attacco casuale
        const chosenAttackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];

        console.log(`TrojanByte generated new attack pattern: ${chosenAttackType}`);

        switch (chosenAttackType) {
            case 'random_burst':
                const burstShotCount = Math.floor(Math.random() * 4) + 4;
                const positions = ['high', 'middle', 'low'];
                for (let i = 0; i < burstShotCount; i++) {
                    const randomPosition = positions[Math.floor(Math.random() * positions.length)];
                    this.attackPattern.push({ type: 'warn' });
                    this.attackPattern.push({ type: 'shot', position: randomPosition });
                    this.attackPattern.push({ type: 'pause', duration: this.pauseBetweenShots });
                }
                break;

            case 'delayed_burst_sequence': // Questo attacco ora non viene più creato come DelayedBurstProjectile
                this.attackPattern.push({ type: 'warn_special' });
                this.attackPattern.push({ type: 'shot_delayed_burst' }); // Questo tipo di shot verrà rimosso o modificato se non usato
                this.attackPattern.push({ type: 'pause', duration: this.pauseLongDuration });
                break;

            // NUOVO: Sequenza per l'attacco a raffica caricata
            case 'charged_burst_attack':
                this.attackPattern.push({ type: 'warn_charge' }); // Il boss si carica
                for (let i = 0; i < this.chargedBurstShotCount; i++) {
                    this.attackPattern.push({ type: 'shoot_charged_projectile' }); // Spara un proiettile caricato
                    if (i < this.chargedBurstShotCount - 1) {
                        this.attackPattern.push({ type: 'pause', duration: this.burstShotInterval }); // Pausa tra i colpi
                    }
                }
                this.attackPattern.push({ type: 'pause', duration: this.pauseLongDuration }); // Pausa lunga dopo la raffica
                break;

            case 'vertical_sweep_down':
                this.attackPattern.push({ type: 'warn' }); this.attackPattern.push({ type: 'shot', position: 'high' }); this.attackPattern.push({ type: 'pause', duration: this.pauseBetweenShots });
                this.attackPattern.push({ type: 'warn' }); this.attackPattern.push({ type: 'shot', position: 'middle' }); this.attackPattern.push({ type: 'pause', duration: this.pauseBetweenShots });
                this.attackPattern.push({ type: 'warn' }); this.attackPattern.push({ type: 'shot', position: 'low' }); this.attackPattern.push({ type: 'pause', duration: this.pauseBetweenShots });
                break;

            case 'vertical_sweep_up':
                this.attackPattern.push({ type: 'warn' }); this.attackPattern.push({ type: 'shot', position: 'low' }); this.attackPattern.push({ type: 'pause', duration: this.pauseBetweenShots });
                this.attackPattern.push({ type: 'warn' }); this.attackPattern.push({ type: 'shot', position: 'middle' }); this.attackPattern.push({ type: 'pause', duration: this.pauseBetweenShots });
                this.attackPattern.push({ type: 'warn' }); this.attackPattern.push({ type: 'shot', position: 'high' }); this.attackPattern.push({ type: 'pause', duration: this.pauseBetweenShots });
                break;
        }

        // Aggiunge la pausa lunga solo se non è la sequenza dell'attacco speciale (che ha già la sua)
        if (chosenAttackType !== 'delayed_burst_sequence' && chosenAttackType !== 'charged_burst_attack') { // Aggiornato
            this.attackPattern.push({ type: 'pause', duration: this.pauseLongDuration });
        }
        this.currentActionIndex = 0;
    }

    update(dt) {
        if (this.animation) {
            this.animation.update(dt);
        }

        if (this.state === 'ENTERING') {
            this.x -= this.speed * dt;
            if (this.x <= canvas.width / 1.5) {
                this.x = canvas.width / 1.5;
                this.state = 'ATTACKING';
                this.generateNewAttackPattern();
                console.log('TrojanByte in posizione. Inizio pattern di attacco.');
            }
        } else if (this.state === 'ATTACKING') {
            this.actionTimer += dt;
            if (this.currentActionIndex >= this.attackPattern.length) {
                this.generateNewAttackPattern();
            }

            if (!this.attackPattern[this.currentActionIndex]) {
                 this.generateNewAttackPattern();
                 return;
            }

            const currentAction = this.attackPattern[this.currentActionIndex];

            switch(currentAction.type) {
                case 'warn':
                case 'warn_special':
                    this.isWarning = true;
                    if (this.actionTimer >= WARNING_DURATION) {
                        this.isWarning = false;
                        this.currentActionIndex++;
                        this.actionTimer = 0;
                    }
                    break;
                // NUOVO: Gestione del warning di carica
                case 'warn_charge':
                    this.isWarning = true; // Boss shows warning
                    if (!this.soundPlayedInPhase) {
                        AudioManager.playSound(SFX_TROJAN_CHARGE); // Play charge sound
                        this.soundPlayedInPhase = true;
                    }
                    if (this.actionTimer >= this.chargeWarningDuration) { // Use specific charge duration
                        this.isWarning = false;
                        this.soundPlayedInPhase = false; // Reset sound flag
                        this.currentActionIndex++;
                        this.actionTimer = 0;
                    }
                    break;

                case 'shot':
                    let projectileY;
                    const shotPosition = currentAction.position || 'middle';

                    switch(shotPosition) {
                        case 'high':
                            projectileY = this.y + this.height * 0.2 - TROJAN_BYTE_PROJECTILE_TARGET_HEIGHT / 2;
                            break;
                        case 'low':
                            projectileY = this.y + this.height * 0.8 - TROJAN_BYTE_PROJECTILE_TARGET_HEIGHT / 2;
                            break;
                        case 'middle':
                        default:
                            projectileY = this.y + this.height * 0.5 - TROJAN_BYTE_PROJECTILE_TARGET_HEIGHT / 2;
                            break;
                    }

                    enemyProjectiles.push(new EnemyProjectile(this.x, projectileY, 'trojanByteProjectile', TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_WIDTH, TROJAN_BYTE_PROJECTILE_ACTUAL_FRAME_HEIGHT, TROJAN_BYTE_PROJECTILE_NUM_FRAMES, TROJAN_BYTE_PROJECTILE_TARGET_WIDTH, TROJAN_BYTE_PROJECTILE_TARGET_HEIGHT, TROJAN_BYTE_PROJECTILE_SPEED, true));
                    AudioManager.playSound('sfx_trojan_normal');
                    this.currentActionIndex++;
                    this.actionTimer = 0;
                    break;

                case 'shoot_charged_projectile': // NUOVO: Caso per il proiettile caricato
                    if (!this.shotFiredInPhase) { // Assicurati che spari solo una volta per azione
                        const projY = this.y + this.height * 0.5 - TROJAN_CHARGED_PROJECTILE_TARGET_HEIGHT / 2;
                        enemyProjectiles.push(new EnemyProjectile(
                            this.x,
                            projY,
                            'trojanChargedProjectile', // Usa la chiave del nuovo sprite
                            TROJAN_CHARGED_PROJECTILE_ACTUAL_FRAME_WIDTH,
                            TROJAN_CHARGED_PROJECTILE_ACTUAL_FRAME_HEIGHT,
                            TROJAN_CHARGED_PROJECTILE_NUM_FRAMES,
                            TROJAN_CHARGED_PROJECTILE_TARGET_WIDTH,
                            TROJAN_CHARGED_PROJECTILE_TARGET_HEIGHT,
                            TROJAN_CHARGED_PROJECTILE_SPEED, // Velocità specifica
                            true, // È dannoso
                            'charged_burst' // Tipo per identificazione se necessario
                        ));
                        AudioManager.playSound(SFX_TROJAN_LAUNCH); // Suono di lancio
                        this.shotFiredInPhase = true;
                    }
                    this.currentActionIndex++;
                    this.actionTimer = 0;
                    break;

                case 'shot_delayed_burst': // Vecchio caso, può essere rimosso o riutilizzato
                    // Se non intendi più usare DelayedBurstProjectile, puoi rimuovere questo caso
                    // o riconvertirlo per usare direttamente EnemyProjectile con un altro sprite/logica
                    const delayedY = this.y + this.height * 0.5 - TROJAN_BYTE_PROJECTILE_TARGET_HEIGHT / 2;
                    enemyProjectiles.push(new DelayedBurstProjectile(this.x, delayedY)); // Questo era per la classe DelayedBurstProjectile
                    AudioManager.playSound('sfx_trojan_special'); // Puoi decidere se riutilizzare questo suono
                    this.currentActionIndex++;
                    this.actionTimer = 0;
                    break;

                case 'pause':
                    if (this.actionTimer >= currentAction.duration) {
                        this.currentActionIndex++;
                        this.actionTimer = 0;
                    }
                    break;
            }
        }
    }

    updateCurrentAnimation() {
        let animKey;
        if (this.health > TROJAN_BYTE_HEALTH * 0.75) animKey = 'base';
        else if (this.health > TROJAN_BYTE_HEALTH * 0.5) animKey = 'dmg1';
        else if (this.health > TROJAN_BYTE_HEALTH * 0.25) animKey = 'dmg2';
        else animKey = 'dmg3';
        this.animation = this.animations[animKey] || this.animations['base'];
    }
}

// NUOVA CLASSE: MissingNumberSpawnedEnemy (subclass di BaseEnemy) - Aggiungi questa classe
class MissingNumberSpawnedEnemy extends BaseEnemy {
    constructor(x, y) {
        super(
            x,
            y,
            MISSING_NUMBER_ENTITY_TARGET_WIDTH,
            MISSING_NUMBER_ENTITY_TARGET_HEIGHT,
            'missingNumberEntity', // Chiave sprite
            MISSING_NUMBER_ENTITY_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_ENTITY_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_ENTITY_NUM_FRAMES,
            1.5, // Velocità moltiplicatore (sarà moltiplicato per gameSpeed) - tipo fastEnemy
            1, // HP
            '#FF8C00', // Colore fallback arancione
            15 // Punti (bassi, sono fastidiosi ma non valgono molto)
        );
        this.name = 'MissingNumberSpawnedEnemy'; // Per identificazione nelle collisioni
    }
    // Il metodo update di BaseEnemy (this.x -= this.speed * dt; if (this.animation) this.animation.update(dt);)
    // è già sufficiente per il movimento orizzontale e l'animazione.
    // Il metodo takeDamage di BaseEnemy è anch'esso sufficiente.
}
// NUOVA CLASSE: MissingNumberFastProjectile (subclass di EnemyProjectile)
class MissingNumberFastProjectile extends EnemyProjectile {
    constructor(x, y) {
        super(
            x, y,
            'missingNumberFastProjectile', // Chiave sprite per il proiettile veloce
            MISSING_NUMBER_FAST_PROJECTILE_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_FAST_PROJECTILE_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_FAST_PROJECTILE_NUM_FRAMES,
            MISSING_NUMBER_FAST_PROJECTILE_TARGET_WIDTH,
            MISSING_NUMBER_FAST_PROJECTILE_TARGET_HEIGHT,
            MISSING_NUMBER_FAST_PROJECTILE_SPEED, // Velocità del proiettile veloce
            true // È un proiettile dannoso
        );
        console.log(`[FEAT] MissingNumberFastProjectile istanziato a X:${x}, Y:${y}`);
    }
    // L'update di default di EnemyProjectile è sufficiente (movimento solo orizzontale)
}
//  questa classe dopo la classe TrojanByte
class MissingNumber extends BaseEnemy {
    constructor(x, y) {
        let initialHealth = MISSING_NUMBER_HEALTH;
        if (isRainRunActive) {
            initialHealth = Math.ceil(initialHealth * 1.5); // Incrementa di 1/3, arrotonda per eccesso
        }
        super(
            x,
            y,
            MISSING_NUMBER_TARGET_WIDTH,
            MISSING_NUMBER_TARGET_HEIGHT,
            'missingNumberBase',
            MISSING_NUMBER_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_NUM_FRAMES,
            0.4, // Velocità simile a Glitchzilla
            initialHealth, // UTILIZZA initialHealth CALCOLATA
            '#8A2BE2', // Colore fallback viola
            MISSING_NUMBER_SCORE_VALUE
        );
        this.name = 'MissingNumber';
        this.loadAnimation(
            'missingNumberDmg1',
            MISSING_NUMBER_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_NUM_FRAMES,
            'dmg1'
        );
        this.loadAnimation(
            'missingNumberDmg2',
            MISSING_NUMBER_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_NUM_FRAMES,
            'dmg2'
        );
        this.loadAnimation(
            'missingNumberDmg3',
            MISSING_NUMBER_ACTUAL_FRAME_WIDTH,
            MISSING_NUMBER_ACTUAL_FRAME_HEIGHT,
            MISSING_NUMBER_NUM_FRAMES,
            'dmg3'
        );
        // Rimosso: Caricamento dell'animazione 'attack' che riutilizzava 'missingNumberBase'.
        // MissingNumber ora non avrà un'animazione 'attack' separata; il suo stato di warning
        // sarà indicato dal flag isWarning che attiverà effetti visivi nella draw().

        this.updateCurrentAnimation();

        // Nuovi parametri per la logica di attacco a pattern casuale
        this.currentAttackPattern = [];
        this.currentAttackPatternIndex = 0;
        this.currentAttackPhaseDuration = 0;
        this.shotFiredInPhase = false;

        this.pauseShortDuration = 0.5;
        this.pauseMediumDuration = 1.0;
        this.pauseLongDuration = 2.5;

        // [FEAT] Flags per gli attacchi condizionali
        this.hasSpawnedEntitiesAttack = false;
        this.hasFastProjectileAttack = false;
        this.isPositioning = true;
        this.soundPlayedInPhase = false;
        this.playerTargetY = 0;

        // Definizione dei sub-pattern di attacco (immutata, usiamo allAttackPatterns come pool)
        this.allAttackPatterns = [
            // Pattern 1: un colpo alto, due bassi, 1 medio, pausa lunga
            [
                { type: 'warn', pos: 'high' },
                { type: 'shot', pos: 'high' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'low' },
                { type: 'shot', pos: 'low' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'low' },
                { type: 'shot', pos: 'low' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'middle' },
                { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseLongDuration },
            ],
            // Pattern 2: uno alto, uno medio, pausa lunga
            [
                { type: 'warn', pos: 'high' },
                { type: 'shot', pos: 'high' },
                { type: 'pause', duration: this.pauseMediumDuration },
                { type: 'warn', pos: 'middle' },
                { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseLongDuration },
            ],
            // Pattern 3: medio medio, pausa lunga
            [
                { type: 'warn', pos: 'middle' },
                { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'middle' },
                { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseLongDuration },
            ],
            // Pattern 4: basso medio basso, pausa lunga
            [
                { type: 'warn', pos: 'low' },
                { type: 'shot', pos: 'low' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'middle' },
                { type: 'shot', pos: 'middle' },
                { type: 'pause', duration: this.pauseShortDuration },
                { type: 'warn', pos: 'low' },
                { type: 'shot', pos: 'low' },
                { type: 'pause', duration: this.pauseLongDuration },
            ],
        ];

        this.projectileSpriteName = 'missingNumberProjectile';
        this.projectileFrameWidth = MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_WIDTH;
        this.projectileFrameHeight = MISSING_NUMBER_PROJECTILE_ACTUAL_FRAME_HEIGHT;
        this.projectileNumFrames = MISSING_NUMBER_PROJECTILE_NUM_FRAMES;
        this.projectileTargetWidth = MISSING_NUMBER_PROJECTILE_TARGET_WIDTH;
        this.projectileTargetHeight = MISSING_NUMBER_PROJECTILE_TARGET_HEIGHT;
        this.projectileSpeed = MISSING_NUMBER_PROJECTILE_SPEED;

        console.log('MISSING_NUMBER SPAWNED! HP: ' + this.health);
        AudioManager.playSound('missingNumberSpawn');
    }

    // NUOVO METODO: Aggiorna l'animazione corrente senza reset per fluidità
    updateCurrentAnimation() {
        let animKey;
        if (this.health > MISSING_NUMBER_HEALTH * 0.75) animKey = 'base';
        else if (this.health > MISSING_NUMBER_HEALTH * 0.5) animKey = 'dmg1';
        else if (this.health > MISSING_NUMBER_HEALTH * 0.25) animKey = 'dmg2';
        else animKey = 'dmg3';

        // >>> START OF MODIFICATION
        // Do not reset the animation if it is already the correct one
        if (this.animation !== this.animations[animKey]) {
            this.animation = this.animations[animKey] || this.animations['base'];
            // We do not call reset() here, as we want fluidity in the walk animation.
            // Specific reset for attacks/warnings will be handled in the update method.
        }
        // <<< END OF MODIFICATION
    }


    selectNewAttackPattern() {
        // >>> START OF MODIFICATION
        // Initialize the pool of available patterns with all base patterns
        let currentPool = [...this.allAttackPatterns];

        // If health drops to 50%, the entity spawn attack becomes available
        // We add the pattern to the pool multiple times to increase its selection probability,
        // but still allowing other patterns to be chosen.
        if (this.health <= MISSING_NUMBER_HEALTH * 0.5) {
            const entitySpawnPattern = [
                { type: 'warn_entity_spawn' },
                { type: 'spawn_entities', count: 3 }, // Spawns 3 entities
                { type: 'pause', duration: this.pauseLongDuration * 1.5 }, // Long pause after
            ];
            // Add it three times to give it a higher probability
            currentPool.push(entitySpawnPattern, entitySpawnPattern, entitySpawnPattern);
            console.log("MissingNumber: 'spawn entities' attack now available in pool.");
        }

        // If health drops to 25%, the fast projectile attack becomes available
        // This pattern is also added multiple times to the pool.
        if (this.health <= MISSING_NUMBER_HEALTH * 0.25) {
            const fastProjectilePattern = [
                { type: 'warn_fast_projectile' },
                { type: 'shoot_fast_projectile' },
                { type: 'pause', duration: this.pauseLongDuration * 2 },
            ];
            // Add it three times
            currentPool.push(fastProjectilePattern, fastProjectilePattern, fastProjectilePattern);
            console.log("MissingNumber: 'fast projectile' attack now available in pool.");
        }

        // Select a random pattern from the pool of available attacks
        const randomIndex = Math.floor(Math.random() * currentPool.length);
        this.currentAttackPattern = currentPool[randomIndex];
        console.log('MissingNumber has selected a new attack pattern:', this.currentAttackPattern);
        // <<< END OF MODIFICATION

        this.currentAttackPatternIndex = 0;
        this.currentAttackPhaseDuration = 0;
        this.shotFiredInPhase = false;
        this.isWarning = false;
    }

    // Modifica il metodo takeDamage
    takeDamage(dmg = 1) {
        super.takeDamage(dmg);
        console.log(`Missing_Number took ${dmg} damage, HP: ${this.health}`);
        this.updateCurrentAnimation();
        AudioManager.playSound('enemyHit');

        // [CORRECTION] Non chiamare selectNewAttackPattern() qui.
        // La logica di introduzione degli attacchi speciali è ora gestita all'inizio di selectNewAttackPattern()
        // che viene chiamata alla fine di ogni pattern d'attacco.

        if (this.health <= 0) {
            console.log('MISSING_NUMBER SCONFITTO! Assegno punteggio: ' + this.scoreValue);
            AudioManager.playSound('bossDefeat');
            playRandomBGM();

            score += this.scoreValue;
            activeMiniboss = null;
            isMissingNumberDefeatedThisGame = true;

            postBossCooldownActive = true;
            postBossCooldownTimer = 2.0;
            bossFightImminent = false;
        }
    }

    update(dt) {
        // [FEAT] Fase di posizionamento iniziale
        if (this.isPositioning) {
            this.x -= this.speed * dt;
            if (this.x <= canvas.width / 2) {
                this.x = canvas.width / 2;
                this.isPositioning = false;
                this.selectNewAttackPattern(); // Inizia i pattern d'attacco solo dopo il posizionamento
                console.log("MissingNumber: Posizionato. Inizio pattern d'attacco.");
            }
            // Aggiorna animazione anche durante il posizionamento
            if (this.animation) {
                this.animation.update(dt);
            }
            return; // Non eseguire la logica di attacco finché non è posizionato
        }


        // Continua con l'aggiornamento dell'animazione anche dopo il posizionamento
        if (this.animation) {
            this.animation.update(dt);
        }
        this.currentAttackPhaseDuration += dt;

        if (this.currentAttackPattern.length === 0) {
            this.selectNewAttackPattern(); // Assicurati che ci sia sempre un pattern
            return;
        }

        const currentAction = this.currentAttackPattern[this.currentAttackPatternIndex];
        let actionComplete = false;

        switch (currentAction.type) {
            case 'warn':
                this.isWarning = true;
                // Non impostare this.animation qui. L'animazione corrente (base/danno)
                // continuerà a essere visualizzata, ma con l'effetto di warning in draw().
                if (this.currentAttackPhaseDuration >= WARNING_DURATION) {
                    actionComplete = true;
                    this.isWarning = false;
                }
                break;
            // [FEAT] Nuovo warning per spawn entità
            case 'warn_entity_spawn':
                this.isWarning = true;
                // Non impostare this.animation qui. Useremo l'animazione base/danno esistente.
                if (!this.soundPlayedInPhase) {
                    AudioManager.playSound(SFX_MISSING_NUMBER_ENTITY_SPAWN);
                    this.soundPlayedInPhase = true;
                }
                if (this.currentAttackPhaseDuration >= WARNING_DURATION * 1.5) { // 0.6s di avviso
                    actionComplete = true;
                    this.isWarning = false;
                    this.soundPlayedInPhase = false;
                }
                break;
            // [FEAT] Nuovo warning per proiettile veloce (con avviso di aiming)
            case 'warn_fast_projectile':
                this.isWarning = true;
                // Non impostare this.animation qui. Useremo l'animazione base/danno esistente.
                if (!this.soundPlayedInPhase) {
                    // MODIFICA QUI: Usa il nuovo suono di caricamento per Missing No
                    AudioManager.playSound(SFX_MISSING_NUMBER_LOADING_SHOT);
                    this.playerTargetY = asyncDonkey.y + asyncDonkey.displayHeight / 2; // Target lock
                    this.soundPlayedInPhase = true;
                }
                if (this.currentAttackPhaseDuration >= 1.5) { // 1.5 secondi di avviso
                    actionComplete = true;
                    this.isWarning = false;
                    this.soundPlayedInPhase = false;
                }
                break;
            case 'shot':
                if (!this.shotFiredInPhase) {
                    let projectileY;
                    if (currentAction.pos === 'high') {
                        projectileY = this.y + this.height * 0.2 - this.projectileTargetHeight / 2;
                    } else if (currentAction.pos === 'middle') {
                        projectileY = this.y + this.height * 0.5 - this.projectileTargetHeight / 2;
                    } else if (currentAction.pos === 'low') {
                        projectileY = this.y + this.height * 0.8 - this.projectileTargetHeight / 2;
                    }
                    enemyProjectiles.push(
                        new EnemyProjectile(
                            this.x - this.projectileTargetWidth,
                            projectileY,
                            this.projectileSpriteName,
                            this.projectileFrameWidth,
                            this.projectileFrameHeight,
                            this.projectileNumFrames,
                            this.projectileTargetWidth,
                            this.projectileTargetHeight,
                            this.projectileSpeed,
                            true
                        )
                    );
                    AudioManager.playSound('enemyShootLight');
                    this.shotFiredInPhase = true;
                }
                actionComplete = true;
                break;
            // [FEAT] Nuovo caso per spawnare entità (non più proiettili)
            case 'spawn_entities':
                if (!this.shotFiredInPhase && currentAction.count > 0) {
                    const spawnCount = currentAction.count;
                    const entitySpawnY = canvas.height - groundHeight - MISSING_NUMBER_ENTITY_TARGET_HEIGHT; // Spawn sul pavimento
                    for (let i = 0; i < spawnCount; i++) {
                        // Spawna le entità leggermente sfalsate in X per non essere sovrapposte inizialmente
                        const spawnX = this.x - MISSING_NUMBER_ENTITY_TARGET_WIDTH - (i * 30);
                        enemies.push( // Aggiungili all'array principale dei nemici
                            new MissingNumberSpawnedEnemy(spawnX, entitySpawnY)
                        );
                    }
                    AudioManager.playSound(SFX_MISSING_NUMBER_ENTITY_SPAWN); // Suono di spawn
                    this.shotFiredInPhase = true;
                }
                actionComplete = true;
                break;
            // [FEAT] Nuovo caso per sparare proiettile veloce
            case 'shoot_fast_projectile':
                if (!this.shotFiredInPhase) {
                    const projectileY = this.playerTargetY - MISSING_NUMBER_FAST_PROJECTILE_TARGET_HEIGHT / 2;
                    enemyProjectiles.push(
                        new MissingNumberFastProjectile(
                            this.x - MISSING_NUMBER_FAST_PROJECTILE_TARGET_WIDTH,
                            projectileY
                        )
                    );
                    AudioManager.playSound(SFX_MISSING_NUMBER_FAST_ATTACK);
                    this.shotFiredInPhase = true;
                }
                actionComplete = true;
                break;
            case 'pause':
                if (this.currentAttackPhaseDuration >= currentAction.duration) {
                    actionComplete = true;
                }
                break;
        }

        if (actionComplete) {
            this.currentAttackPatternIndex++;
            this.currentAttackPhaseDuration = 0;
            this.shotFiredInPhase = false;
            this.isWarning = false; // Spegni l'avviso per la prossima azione
            this.updateCurrentAnimation(); // Torna all'animazione base/danno

            // Se tutte le azioni del pattern corrente sono state eseguite, seleziona un nuovo pattern
            if (this.currentAttackPatternIndex >= this.currentAttackPattern.length) {
                this.selectNewAttackPattern();
            }
        }
    }
}


class DunnoExeProjectile1 extends EnemyProjectile {
    constructor(x, y, targetPlayerY, isLandedShot = false) {
        super(
            x, y,
            'dunnoExeProjectile1',
            DUNNO_EXE_PROJECTILE_1_FRAME_WIDTH, DUNNO_EXE_PROJECTILE_1_FRAME_HEIGHT,
            DUNNO_EXE_PROJECTILE_1_NUM_FRAMES,
            DUNNO_EXE_PROJECTILE_1_TARGET_WIDTH, DUNNO_EXE_PROJECTILE_1_TARGET_HEIGHT,
            isLandedShot ? DUNNO_EXE_PROJECTILE_1_SPEED_LANDED : DUNNO_EXE_PROJECTILE_1_SPEED,
            true
        );
        this.initialSpawnY = y;
        this.targetPlayerY = targetPlayerY;
        this.hasCrossedTargetY = false;
        this.currentSpeedX = -this.speed;
        this.currentSpeedY = 0;
        this.yAdjustSpeed = this.speed * 0.5;

        console.log(`DUNNO.EXE: PROJ1 istanziato a X:${x}, Y:${y}, targetY:${targetPlayerY} (Landed: ${isLandedShot})`);
    }

    update(dt) {
        if (!this.hasCrossedTargetY) {
            if (this.y < this.targetPlayerY) {
                this.currentSpeedY = this.yAdjustSpeed;
            } else if (this.y > this.targetPlayerY) {
                this.currentSpeedY = -this.yAdjustSpeed;
            } else {
                this.currentSpeedY = 0;
            }

            if (
                (this.initialSpawnY < this.targetPlayerY && this.y >= this.targetPlayerY) ||
                (this.initialSpawnY > this.targetPlayerY && this.y <= this.targetPlayerY)
            ) {
                this.hasCrossedTargetY = true;
                this.currentSpeedY = 0;
                // >>> START OF MODIFICATION
                this.y = this.targetPlayerY; // Snap to target Y to ensure alignment
                // <<< END OF MODIFICATION
                console.log(`DUNNO.EXE: PROJ1 Y-target reached. Proceeding horizontal.`);
            }
        }

        this.x += this.currentSpeedX * dt;
        this.y += this.currentSpeedY * dt;

        if (this.animation) this.animation.update(dt);
    }
}

class DunnoExeProjectile2 extends EnemyProjectile {
    constructor(x, y) {
        super(
            x, y,
            'dunnoExeProjectile2',
            DUNNO_EXE_PROJECTILE_2_FRAME_WIDTH, DUNNO_EXE_PROJECTILE_2_FRAME_HEIGHT,
            DUNNO_EXE_PROJECTILE_2_NUM_FRAMES,
            DUNNO_EXE_PROJECTILE_2_TARGET_WIDTH, DUNNO_EXE_PROJECTILE_2_TARGET_HEIGHT,
            DUNNO_EXE_PROJECTILE_2_SPEED * 1.8, // Increased speed from 150 to 240 (150 * 1.6) for faster movement
            true // È dannoso
        );
        this.initialY = y;
        this.angle = Math.random() * Math.PI * 2; // Start phase for sine wave
        this.amplitude = 40 + Math.random() * 25; // Vertical oscillation amplitude (40-60px)
        this.frequency = 1.5 + Math.random() * 1.0; // Reduced frequency (1.5-2.5) for longer waves
        console.log(`DUNNO.EXE: PROJ2 (Oscillating) istanziato a X:${x}, Y:${y}, Speed: ${this.speed}, Freq: ${this.frequency}`);
    }

    update(dt) {
        // Horizontal movement
        this.x -= this.speed * dt;

        // Vertical oscillating movement
        this.angle += this.frequency * dt;
        this.y = this.initialY + Math.sin(this.angle) * this.amplitude;

        if (this.animation) this.animation.update(dt);
    }
}

class DunnoExeProjectile3 extends EnemyProjectile {
    constructor(x, y, targetPlayerY) {
        super(
            x, y,
            'dunnoExeProjectile3',
            DUNNO_EXE_PROJECTILE_3_FRAME_WIDTH, DUNNO_EXE_PROJECTILE_3_FRAME_HEIGHT,
            DUNNO_EXE_PROJECTILE_3_NUM_FRAMES,
            DUNNO_EXE_PROJECTILE_3_TARGET_WIDTH, DUNNO_EXE_PROJECTILE_3_TARGET_HEIGHT,
            DUNNO_EXE_PROJECTILE_3_SPEED, // Fast speed after teleport
            true // È dannoso
        );
        this.initialX = x;
        this.initialY = y; // This is the spawn Y, not necessarily the target Y
        this.targetPlayerY = targetPlayerY; // Player's Y when projectile is spawned
        this.phase = 'INITIAL_MOVE'; // STATES: INITIAL_MOVE, DISAPPEARING, REAPPEARING, FINAL_MOVE
        this.timer = 0;

        this.initialMoveDuration = 0.5; // How long it moves before disappearing
        this.disappearDuration = 0.3; // How long it stays invisible
        this.reappearOffsetRange = 100; // Max offset for new Y when reappearing

        this.isVisible = true;
        console.log(`DUNNO.EXE: PROJ3 (Teleporting) istanziato a X:${x}, Y:${y}`);
    }

    update(dt) {
        this.timer += dt;

        switch (this.phase) {
            case 'INITIAL_MOVE':
                this.x -= this.speed * dt; // Move horizontally
                if (this.timer >= this.initialMoveDuration) {
                    this.phase = 'DISAPPEARING';
                    this.isVisible = false;
                    this.timer = 0; // Reset timer for next phase
                }
                break;
            case 'DISAPPEARING':
                if (this.timer >= this.disappearDuration) {
                    this.phase = 'FINAL_MOVE';
                    this.isVisible = true;
                    this.timer = 0;

                    // Teleport Y to a new position relative to player's last known Y
                    // Keep X the same or slightly adjusted to simulate forward teleport
                    // We don't change X here, as per "stesse coordinatex"
                    this.y = asyncDonkey.y + (Math.random() * this.reappearOffsetRange * 2) - this.reappearOffsetRange;
                    // Ensure it's not off-screen vertically
                    this.y = Math.max(80, Math.min(canvas.height - groundHeight - this.height - 10, this.y));
                    console.log(`DUNNO.EXE: PROJ3 (Teleporting) riapparso a Y:${this.y}`);
                    // Speed remains high as per constructor
                }
                break;
            case 'FINAL_MOVE':
                this.x -= this.speed * dt; // Continue moving horizontally fast
                break;
        }

        if (this.animation) this.animation.update(dt);
    }

    draw() {
        if (this.isVisible) {
            super.draw();
        }
    }
}

class DunnoExeProjectile_ChargeBurst extends EnemyProjectile {
    constructor(x, y) {
        super(
            x, y,
            'dunnoExeProjectile2', // Using proj2 sprite for this (big, round)
            DUNNO_EXE_PROJECTILE_2_FRAME_WIDTH, DUNNO_EXE_PROJECTILE_2_FRAME_HEIGHT,
            DUNNO_EXE_PROJECTILE_2_NUM_FRAMES,
            DUNNO_EXE_PROJECTILE_2_TARGET_WIDTH, DUNNO_EXE_PROJECTILE_2_TARGET_HEIGHT,
            0, // Initial speed is 0 (stationary)
            true // It's harmful
        );
        this.delay = 1.0; // Time to stay still (seconds)
        this.burstSpeed = 600; // Fast speed after delay (pixels/second)
        this.delayTimer = 0;
        this.isDelayed = true;
        console.log(`DUNNO.EXE: PROJ_CHARGE_BURST istanziato a X:${x}, Y:${y}`);
    }

    update(dt) {
        if (this.isDelayed) {
            this.delayTimer += dt;
            if (this.delayTimer >= this.delay) {
                this.isDelayed = false;
                this.speed = this.burstSpeed; // Switch to burst speed
                AudioManager.playSound('enemyShootHeavy'); // Sound when it actually bursts
                console.log(`DUNNO.EXE: PROJ_CHARGE_BURST bursting!`);
            }
            // If still delayed, x does not change (remains "still")
        } else {
            // After delay, move normally at burstSpeed
            this.x -= this.speed * dt;
        }
        // Update animation regardless of movement
        if (this.animation) this.animation.update(dt);
    }
}

const DUNNO_EXE_PROJECTILE_1_SPEED_LANDED = 450;

class DunnoExe extends BaseEnemy {
    constructor(x, y) {
        let initialHealth = DUNNO_EXE_HEALTH;
        if (isRainRunActive) {
            initialHealth = Math.ceil(initialHealth * 1.5); // Incrementa di 1/3, arrotonda per eccesso
        }
        super(
            x, y,
            DUNNO_EXE_TARGET_WIDTH, DUNNO_EXE_TARGET_HEIGHT,
            'dunnoExeFlying', // Sprite iniziale di volo
            DUNNO_EXE_ACTUAL_FRAME_WIDTH, DUNNO_EXE_ACTUAL_FRAME_HEIGHT, DUNNO_EXE_NUM_FRAMES,
            0.2, initialHealth, '#5D3FD3', // Colore fallback viola // UTILIZZA initialHealth CALCOLATA
            DUNNO_EXE_SCORE_VALUE
        );
        this.name = 'DUNNO.EXE';

        // Caricamento animazioni per tutti gli stati
        this.loadAnimation('dunnoExeFlying', DUNNO_EXE_ACTUAL_FRAME_WIDTH, DUNNO_EXE_ACTUAL_FRAME_HEIGHT, DUNNO_EXE_NUM_FRAMES, 'flying');
        this.loadAnimation('dunnoExeFlyingDmg1', DUNNO_EXE_ACTUAL_FRAME_WIDTH, DUNNO_EXE_ACTUAL_FRAME_HEIGHT, DUNNO_EXE_NUM_FRAMES, 'flyingDmg1');
        this.loadAnimation('dunnoExeLandedShieldOff', DUNNO_EXE_ACTUAL_FRAME_WIDTH, DUNNO_EXE_ACTUAL_FRAME_HEIGHT, DUNNO_EXE_NUM_FRAMES, 'landedShieldOff');
        this.loadAnimation('dunnoExeLandedShieldOn', DUNNO_EXE_ACTUAL_FRAME_WIDTH, DUNNO_EXE_ACTUAL_FRAME_HEIGHT, DUNNO_EXE_NUM_FRAMES, 'landedShieldOn');
        this.updateCurrentAnimation(); // Imposta l'animazione iniziale

        // Stati del boss
        this.state = 'ENTERING'; // ENTERING, FLYING, LANDING, LANDED_SHIELD_ON, LANDED_SHIELD_OFF

        // --- NUOVI PATTERN DI ATTACCO RISTRUTTURATI ---

        // Pattern Volante NON DANNEGGIATO (Solo Proiettile 1 - Diving)
        this.attackPatternFlying_Undamaged = [
            { type: 'warn', duration: WARNING_DURATION },
            { type: 'shoot', action: 'shoot_proj1', count: 1, isLandedShot: false }, // Use proj1 (diving)
            { type: 'pause', duration: 2.0 }, // Longer pause
        ];

        // Pattern Volante DANNEGGIATO (Alterna Proiettile 1 e Proiettile 2 - Oscillating)
        this.attackPatternFlying_Damaged = [
            { type: 'warn', duration: WARNING_DURATION },
            { type: 'shoot', action: 'shoot_proj1', count: 1, isLandedShot: false }, // Use proj1 (diving)
            { type: 'pause', duration: 1.0 }, // Shorter pause
            { type: 'warn', duration: WARNING_DURATION },
            { type: 'shoot', action: 'shoot_proj2_oscillate', count: 1 }, // Use proj2 (oscillating)
            { type: 'pause', duration: 1.5 }, // Shorter pause
        ];

        // Pattern Atterrato (Scudo ON - 3 tipi di attacco)
        this.attackPatternLanded = [
            // Attack 1: Proj1 Burst (up to 5 shots, with 0.9s delay between each)
            { type: 'warn', duration: WARNING_DURATION },
            { type: 'shoot', action: 'shoot_proj1', isLandedShot: true, count: 1 }, // Shot 1
            { type: 'pause', duration: 0.9 },
            { type: 'shoot', action: 'shoot_proj1', isLandedShot: true, count: 1 }, // Shot 2
            { type: 'pause', duration: 0.9 },
            { type: 'shoot', action: 'shoot_proj1', isLandedShot: true, count: 1 }, // Shot 3
            { type: 'pause', duration: 0.9 },
            { type: 'shoot', action: 'shoot_proj1', isLandedShot: true, count: 1 }, // Shot 4
            { type: 'pause', duration: 0.9 },
            { type: 'shoot', action: 'shoot_proj1', isLandedShot: true, count: 1 }, // Shot 5
            { type: 'pause', duration: 2.0 }, // Long pause after burst

            // Attack 2: Charge Burst (Projectile 4)
            { type: 'warn', duration: WARNING_DURATION },
            { type: 'shoot', action: 'shoot_proj_charge_burst', count: 1 },
            { type: 'pause', duration: 2.5 }, // Pause after the charge burst (should account for its own delay)

            // Attack 3: Teleporting Projectile (Projectile 3)
            { type: 'warn', duration: WARNING_DURATION },
            { type: 'shoot', action: 'shoot_proj3_teleport', count: 1 },
            { type: 'pause', duration: 3.0 }, // Long pause after teleport attack
        ];
        // --- FINE NUOVI PATTERN ---

        this.currentAttackPattern = [];
        this.currentAttackIndex = 0;
        this.actionTimer = 0;
        this.shotFiredInPhase = false; // Flag per evitare spari multipli per azione

        // Movimento in stato "FLYING"
        this.fixedFlyingX = canvas.width - this.width - 50; // Mantiene una distanza fissa dal bordo destro
        this.flyingYTarget = 150; // Altezza media di volo (circa a metà schermo)
        this.amplitude = 40; // Oscillazione verticale
        this.frequency = 0.03; // Frequenza oscillazione verticale (più bassa per un'onda lenta)

        // Shield e atterraggio
        this.landedY = canvas.height - groundHeight - this.height; // Altezza di atterraggio
        this.shieldDuration = 0; // Durata variabile tra 10-30s
        this.vulnerableDuration = 0; // Durata variabile tra 5-15s
        this.shieldTimer = 0;
        this.isShieldActive = false; // Only for landed state
        this.isVulnerable = false; // Only for landed state

        console.log('DUNNO.EXE SPAWNED! HP: ' + this.health);
    }

    updateCurrentAnimation() {
        let animKey;
        if (this.health <= 0) {
            animKey = 'flying';
        } else if (this.state === 'LANDED_SHIELD_ON') {
            animKey = 'landedShieldOn';
        } else if (this.state === 'LANDED_SHIELD_OFF') {
            animKey = 'landedShieldOff';
        } else if (this.state === 'FLYING' && this.health <= DUNNO_EXE_HEALTH * 0.75) {
            animKey = 'flyingDmg1';
        } else {
            animKey = 'flying';
        }

        // >>> START OF MODIFICATION
        // Ensure that the current animation is actually different before changing it
        // and resetting its state. This avoids animation interruptions.
        if (this.animation !== this.animations[animKey]) {
            this.animation = this.animations[animKey] || this.animations['base'];
            if (this.animation) {
                this.animation.reset(); // Reset the animation only on change
            }
        }
        // <<< END OF MODIFICATION
    }

    takeDamage(dmg = 1) {
        if (this.state === 'LANDED_SHIELD_ON' && this.isShieldActive) {
            console.log('DUNNO.EXE: Scudo attivo! Danno bloccato.');
            AudioManager.playSound('shieldBlock');
            return;
        }
        super.takeDamage(dmg); // Chiama il takeDamage di BaseEnemy
        console.log(`DUNNO.EXE took ${dmg} damage, HP: ${this.health}`);
        this.updateCurrentAnimation(); // Aggiorna animazione dopo il danno
        AudioManager.playSound('enemyHit');

        if (this.health <= 0) {
            console.log('DUNNO.EXE SCONFITTO! Assegno punteggio: ' + this.scoreValue);
            AudioManager.playSound('bossDefeat');
            playRandomBGM();

            score += this.scoreValue;
            activeMiniboss = null;
            isDunnoExeDefeatedThisGame = true;
            postBossCooldownActive = true;
            postBossCooldownTimer = 2.0;
            bossFightImminent = false;
        } else if (this.health <= DUNNO_EXE_HEALTH * 0.5 && this.state === 'FLYING') {
            this.state = 'LANDING';
            // Reset pattern when transitioning to LANDING
            this.currentAttackPattern = [];
            this.currentAttackIndex = 0;
            this.actionTimer = 0;
            this.isWarning = false;
            this.shotFiredInPhase = false;
            console.log('DUNNO.EXE: Vita sotto il 50%, sta atterrando.');
        }
    }

    generateNewAttackPattern() {
        this.currentAttackPattern = [];
        if (this.state === 'FLYING') {
            // Choose pattern based on health in FLYING state
            if (this.health <= DUNNO_EXE_HEALTH * 0.75) { // Damaged flying pattern (was 0.5)
                this.currentAttackPattern = [...this.attackPatternFlying_Damaged];
            } else {
                // Undamaged flying pattern
                this.currentAttackPattern = [...this.attackPatternFlying_Undamaged];
            }
        } else if (this.state === 'LANDED_SHIELD_ON') { // Only generate for LANDED_SHIELD_ON
            this.currentAttackPattern = [...this.attackPatternLanded];
        }
        // No pattern generation for LANDING or LANDED_SHIELD_OFF (vulnerable) states

        this.currentAttackIndex = 0;
        this.actionTimer = 0;
        this.isWarning = false;
        this.shotFiredInPhase = false; // Reset del flag per il nuovo pattern
        console.log(`DUNNO.EXE generato nuovo pattern di attacco per stato ${this.state}. Pattern:`, this.currentAttackPattern.map(a => a.type + (a.action ? `:${a.action}` : '')));
    }

    update(dt) {
        if (this.animation) {
            this.animation.update(dt);
        }
        this.updateCurrentAnimation(); // Update sprite based on health/state

        // Movement and State Logic
        if (this.state === 'ENTERING') {
            this.x -= this.speed * dt;
            if (this.x <= this.fixedFlyingX) {
                this.x = this.fixedFlyingX;
                this.state = 'FLYING';
                this.y = this.flyingYTarget;
                this.generateNewAttackPattern();
                console.log('DUNNO.EXE in posizione di volo. Inizio pattern di attacco.');
            }
        } else if (this.state === 'FLYING') {
            this.x = this.fixedFlyingX;
            this.y = this.flyingYTarget + Math.sin(this.actionTimer * this.frequency) * this.amplitude;
            this.handleAttackPattern(dt); // Handle attacks only in FLYING state
        } else if (this.state === 'LANDING') {
            this.x = this.fixedFlyingX;
            this.y += (this.landedY - this.y) * 3 * dt;
            if (Math.abs(this.y - this.landedY) < 5) {
                this.y = this.landedY;
                this.state = 'LANDED_SHIELD_ON';
                this.isShieldActive = true;
                this.isVulnerable = false;
                this.shieldDuration = 10 + Math.random() * 5; // 10-15s shielded attacking
                this.shieldTimer = this.shieldDuration;
                this.generateNewAttackPattern(); // New pattern for landed state
                console.log('DUNNO.EXE atterrato. Scudo ON, attacco.');
            }
        } else if (this.state === 'LANDED_SHIELD_ON') {
            this.x = this.fixedFlyingX;
            this.shieldTimer -= dt;
            this.handleAttackPattern(dt); // Continue attacking while shielded

            if (this.shieldTimer <= 0) {
                this.state = 'LANDED_SHIELD_OFF';
                this.isShieldActive = false;
                this.isVulnerable = true;
                this.vulnerableDuration = 5 + Math.random() * 5; // 5-10s vulnerable
                this.shieldTimer = this.vulnerableDuration;
                // No new pattern generated here, as it doesn't attack while vulnerable
                console.log('DUNNO.EXE scudo OFF, vulnerabile.');
            }
        } else if (this.state === 'LANDED_SHIELD_OFF') {
            this.x = this.fixedFlyingX;
            this.shieldTimer -= dt;
            // DOES NOT ATTACK IN THIS STATE

            if (this.shieldTimer <= 0) {
                this.state = 'LANDED_SHIELD_ON';
                this.isShieldActive = true;
                this.isVulnerable = false;
                this.shieldDuration = 10 + Math.random() * 5; // 10-15s shielded attacking
                this.shieldTimer = this.shieldDuration;
                this.generateNewAttackPattern();
                console.log('DUNNO.EXE scudo ON, riprende attacco.');
            }
        }
    }

    handleAttackPattern(dt) {
        this.actionTimer += dt;

        if (!this.currentAttackPattern || this.currentAttackPattern.length === 0 || this.currentAttackIndex >= this.currentAttackPattern.length) {
            this.generateNewAttackPattern();
            return;
        }

        const currentAction = this.currentAttackPattern[this.currentAttackIndex];
        let actionComplete = false;

        // >>> START OF MODIFICATION
        // Check if the current action has a duration. If not, it's considered instantaneous,
        // so it completes in the same frame it's triggered.
        const actionDuration = typeof currentAction.duration !== 'undefined' ? currentAction.duration : 0;
        // <<< END OF MODIFICATION

        switch (currentAction.type) {
            case 'warn':
                this.isWarning = true;
                if (this.actionTimer >= WARNING_DURATION) {
                    actionComplete = true;
                    this.isWarning = false;
                }
                break;
            case 'shoot':
                if (!this.shotFiredInPhase) {
                    console.log(`DUNNO.EXE: TENTATIVO DI SPARARE: ${currentAction.action}`);
                    let projectileY = this.y + this.height / 2;
                    let targetX = asyncDonkey.x + asyncDonkey.displayWidth / 2;
                    let targetY = asyncDonkey.y + asyncDonkey.displayHeight / 2;

                    switch (currentAction.action) {
                        case 'shoot_proj1':
                            enemyProjectiles.push(new DunnoExeProjectile1(this.x, projectileY + (currentAction.offsetY || 0), targetY + (currentAction.offsetY || 0), currentAction.isLandedShot));
                            AudioManager.playSound('enemyShootLight', false, currentAction.isLandedShot ? 1.0 : 0.8, currentAction.isLandedShot ? 1.2 : 1.0);
                            break;
                        case 'shoot_proj2_oscillate':
                            enemyProjectiles.push(new DunnoExeProjectile2(this.x, projectileY));
                            AudioManager.playSound('enemyShootLight');
                            break;
                        case 'shoot_proj3_teleport':
                            enemyProjectiles.push(new DunnoExeProjectile3(this.x, projectileY, targetY));
                            AudioManager.playSound('enemyShootHeavy');
                            break;
                        case 'shoot_proj_charge_burst':
                            enemyProjectiles.push(new DunnoExeProjectile_ChargeBurst(this.x, projectileY));
                            break;
                    }
                    this.shotFiredInPhase = true;
                }
                // >>> START OF MODIFICATION
                if (this.actionTimer >= actionDuration) { // Use actionDuration for completion
                    actionComplete = true;
                }
                // <<< END OF MODIFICATION
                break;
            case 'pause':
                if (this.actionTimer >= currentAction.duration) {
                    actionComplete = true;
                }
                break;
        }

        if (actionComplete) {
            this.currentAttackIndex++;
            this.actionTimer = 0;
            this.isWarning = false;
            this.shotFiredInPhase = false;

            if (this.currentAttackIndex >= this.currentAttackPattern.length) {
                this.generateNewAttackPattern();
            }
        }
    }
}
// --- Funzioni di Gioco ---
function drawGround() {
    ctx.fillStyle = PALETTE.DARK_TEAL_BLUE;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    ctx.fillStyle = PALETTE.MEDIUM_TEAL;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, lineWidth * 3);
    ctx.fillStyle = PALETTE.BRIGHT_TEAL;
    ctx.fillRect(0, canvas.height - groundHeight + lineWidth * 3, canvas.width, lineWidth);
}

function calculateNextObstacleSpawnTime() {
    return 0.8 + Math.random() * 1.2;
}
nextObstacleSpawnTime = calculateNextObstacleSpawnTime();

// NUOVO: Funzioni per calcolare il prossimo spawn dei nuovi collezionabili
function calculateNextExtraLifeSpawnTime() {
    // Spawn circa ogni 20-30 secondi
    return 20 + Math.random() * 10;
}

// NUOVO: Funzione per calcolare il prossimo spawn dei Digital Fruits
function calculateNextDigitalFruitSpawnTime() {
    let spawnTime = 20 + Math.random() * 20;
    if (isRainRunActive) {
        spawnTime *= 0.2; // NUOVO VALORE: Molta più frutta con la pioggia
    }
    return spawnTime;
}
// NUOVO: Inizializza il prossimo spawn
nextDigitalFruitSpawnTime = calculateNextDigitalFruitSpawnTime();

function calculateNextRichBitsSpawnTime() {
    // MODIFICATO: Spawn molto più rari, ad esempio ogni 30-50 secondi
    return 50 + Math.random() * 25; 
}

function calculateNextDataPackageSpawnTime() {
    // Spawn circa ogni 5-10 secondi (più frequenti dei rich bits)
    return 5 + Math.random() * 5;
}

function spawnObstacleIfNeeded(dt) {
    obstacleSpawnTimer += dt;
    if (obstacleSpawnTimer >= nextObstacleSpawnTime) {
        const yPos = canvas.height - groundHeight - OBSTACLE_TARGET_HEIGHT;
        obstacles.push(new Obstacle(canvas.width, yPos));
        obstacleSpawnTimer = 0;
        nextObstacleSpawnTime = calculateNextObstacleSpawnTime();
    }
}

function updateObstacles(dt) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update(dt);
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function drawObstacles() {
    obstacles.forEach((obstacle) => obstacle.draw());
}

function updateProjectiles(dt) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(dt);
        if (projectiles[i].x > canvas.width) {
            projectiles.splice(i, 1);
        }
    }
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        enemyProjectiles[i].update(dt);
        if (enemyProjectiles[i].x + enemyProjectiles[i].width < 0) {
            enemyProjectiles.splice(i, 1);
        }
    }
}

function drawProjectiles() {
    projectiles.forEach((p) => p.draw());
    enemyProjectiles.forEach((ep) => ep.draw());
}

function updateShootCooldown(dt) {
    if (!canShoot) {
        shootTimer += dt;
        if (shootTimer >= shootCooldownTime) {
            canShoot = true;
            shootTimer = 0;
        }
    }
}

function calculateNextEnemyBaseSpawnTime() {
    let spawnTime = 2.5 + Math.random() * 2.0;
    if (isRainRunActive) {
        spawnTime *= RAIN_SPAWN_MULTIPLIER; // Più spawn con la pioggia
    }
    return spawnTime;
}
nextEnemyBaseSpawnTime = calculateNextEnemyBaseSpawnTime();

function spawnEnemyBaseIfNeeded(dt) {
    enemyBaseSpawnTimer += dt;
    if (enemyBaseSpawnTimer >= nextEnemyBaseSpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_ONE_TARGET_HEIGHT;
        enemies.push(
            new BaseEnemy(
                canvas.width,
                enemyY,
                ENEMY_ONE_TARGET_WIDTH,
                ENEMY_ONE_TARGET_HEIGHT,
                'enemyOne',
                ENEMY_ONE_ACTUAL_FRAME_WIDTH,
                ENEMY_ONE_ACTUAL_FRAME_HEIGHT,
                ENEMY_ONE_NUM_FRAMES,
                0.8,
                1,
                '#FF0000',
                20
            )
        );
        enemyBaseSpawnTimer = 0;
        nextEnemyBaseSpawnTime = calculateNextEnemyBaseSpawnTime();
    }
}

function calculateNextFlyingEnemySpawnTime() {
    let spawnTime = 3.5 + Math.random() * 3;
    if (isRainRunActive) {
        spawnTime *= RAIN_SPAWN_MULTIPLIER; // Più spawn con la pioggia
    }
    return spawnTime;
}
nextFlyingEnemySpawnTime = calculateNextFlyingEnemySpawnTime();

function spawnFlyingEnemyIfNeeded(dt) {
    flyingEnemySpawnTimer += dt;
    if (flyingEnemySpawnTimer >= nextFlyingEnemySpawnTime) {
        const enemyY = 50 + Math.random() * (canvas.height - groundHeight - ENEMY_FIVE_TARGET_HEIGHT - 100);
        flyingEnemies.push(new FlyingEnemy(canvas.width, enemyY));
        flyingEnemySpawnTimer = 0;
        nextFlyingEnemySpawnTime = calculateNextFlyingEnemySpawnTime();
    }
}

function calculateNextGenericEnemySpawnTime(min, max) {
    let spawnTime = min + Math.random() * (max - min);
    if (isRainRunActive) {
        spawnTime *= RAIN_SPAWN_MULTIPLIER; // Più spawn con la pioggia
    }
    return spawnTime;
}

function spawnFastEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_FAST_ENEMY) return;
    fastEnemySpawnTimer += dt;
    if (fastEnemySpawnTimer >= nextFastEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_TWO_TARGET_HEIGHT;
        fastEnemies.push(
            new BaseEnemy(
                canvas.width,
                enemyY,
                ENEMY_TWO_TARGET_WIDTH,
                ENEMY_TWO_TARGET_HEIGHT,
                'enemyTwo',
                ENEMY_TWO_ACTUAL_FRAME_WIDTH,
                ENEMY_TWO_ACTUAL_FRAME_HEIGHT,
                ENEMY_TWO_NUM_FRAMES,
                fastEnemySpeedMultiplier,
                1,
                '#FFA500',
                35
            )
        );
        fastEnemySpawnTimer = 0;
        nextFastEnemySpawnTime = calculateNextGenericEnemySpawnTime(4, 6);
    }
}

function spawnArmoredEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_ARMORED_ENEMY) return;
    armoredEnemySpawnTimer += dt;
    if (armoredEnemySpawnTimer >= nextArmoredEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_THREE_TARGET_HEIGHT;
        armoredEnemies.push(new ArmoredEnemy(canvas.width, enemyY));
        armoredEnemySpawnTimer = 0;
        nextArmoredEnemySpawnTime = calculateNextGenericEnemySpawnTime(6, 9);
    }
}

function spawnShootingEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_SHOOTING_ENEMY) return;
    shootingEnemySpawnTimer += dt;
    if (shootingEnemySpawnTimer >= nextShootingEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_FOUR_TARGET_HEIGHT;
        shootingEnemies.push(new ShootingEnemy(canvas.width, enemyY));
        shootingEnemySpawnTimer = 0;
        nextShootingEnemySpawnTime = calculateNextGenericEnemySpawnTime(5, 8);
    }
}

function spawnArmoredShootingEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_ARMORED_SHOOTING_ENEMY) return;
    armoredShootingEnemySpawnTimer += dt;
    if (armoredShootingEnemySpawnTimer >= nextArmoredShootingEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_SIX_TARGET_HEIGHT;
        armoredShootingEnemies.push(new ArmoredShootingEnemy(canvas.width, enemyY));
        armoredShootingEnemySpawnTimer = 0;
        nextArmoredShootingEnemySpawnTime = calculateNextGenericEnemySpawnTime(8, 12);
    }
}
function spawnToughBasicEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_TOUGH_BASIC_ENEMY) return;
    toughBasicEnemySpawnTimer += dt;
    if (toughBasicEnemySpawnTimer >= nextToughBasicEnemySpawnTime) {
        const enemyY = canvas.height - groundHeight - ENEMY_SEVEN_TARGET_HEIGHT;
        toughBasicEnemies.push(new ToughBasicEnemy(canvas.width, enemyY));
        toughBasicEnemySpawnTimer = 0;
        nextToughBasicEnemySpawnTime = calculateNextGenericEnemySpawnTime(3, 5);
    }
}
function spawnDangerousFlyingEnemyIfNeeded(dt) {
    if (score < SCORE_THRESHOLD_DANGEROUS_FLYING_ENEMY) return;
    dangerousFlyingEnemySpawnTimer += dt;
    if (dangerousFlyingEnemySpawnTimer >= nextDangerousFlyingEnemySpawnTime) {
        const enemyY = 30 + Math.random() * (canvas.height - groundHeight - DANGEROUS_FLYING_ENEMY_TARGET_HEIGHT - 150);
        dangerousFlyingEnemies.push(new DangerousFlyingEnemy(canvas.width, enemyY));
        dangerousFlyingEnemySpawnTimer = 0;
        nextDangerousFlyingEnemySpawnTime = calculateNextGenericEnemySpawnTime(7, 10);
    }
}

function spawnGlitchzillaIfNeeded() {
    if (score >= GLITCHZILLA_SPAWN_SCORE_THRESHOLD && !activeMiniboss && !hasGlitchzillaSpawnedThisGame) {
        const bossY = canvas.height - groundHeight - GLITCHZILLA_TARGET_HEIGHT;
        activeMiniboss = new Glitchzilla(canvas.width, bossY);
        hasGlitchzillaSpawnedThisGame = true;
        console.log('GLITCHZILLA È APPARSO!');
    }
}

// Funzione per calcolare il prossimo tempo di spawn del Kamikaze Flying Enemy
function calculateNextKamikazeFlyingEnemySpawnTime() {
    let spawnTime = 3 + Math.random() * 3;
    if (isRainRunActive) {
        spawnTime *= RAIN_SPAWN_MULTIPLIER; // Più spawn con la pioggia
    }
    return spawnTime;
}

// Funzione per spawnare il Kamikaze Flying Enemy
function spawnKamikazeFlyingEnemyIfNeeded(dt) {
    // [FEAT] Spawna solo dopo che MissingNumber è stato sconfitto
    // e se non c'è un boss attivo o imminente (per non interferire con le boss fight)
    if (isMissingNumberDefeatedThisGame && !activeMiniboss && !bossFightImminent && !postBossCooldownActive) {
        kamikazeFlyingEnemySpawnTimer += dt;
        if (kamikazeFlyingEnemySpawnTimer >= nextKamikazeFlyingEnemySpawnTime) {
            // Spawn a un'altezza casuale, evitando il terreno e il bordo superiore
            const spawnY = 50 + Math.random() * (canvas.height - groundHeight - KAMIKAZE_FLYING_ENEMY_TARGET_HEIGHT - 100);
            
            // Mira alla posizione attuale del giocatore al momento dello spawn
            kamikazeFlyingEnemies.push(new KamikazeFlyingEnemy(
                canvas.width, 
                spawnY, 
                asyncDonkey.x + asyncDonkey.displayWidth / 2, 
                asyncDonkey.y + asyncDonkey.displayHeight / 2
            ));
            kamikazeFlyingEnemySpawnTimer = 0;
            nextKamikazeFlyingEnemySpawnTime = calculateNextKamikazeFlyingEnemySpawnTime();
        }
    }
}

function calculateNextPowerUpAmbientSpawnTime() {
    let spawnTime = 10 + Math.random() * 10;
    if (isRainRunActive) {
        spawnTime *= 0.7; // Leggermente più power-up ambientali
    }
    return spawnTime;
}
nextPowerUpSpawnTime = calculateNextPowerUpAmbientSpawnTime();

function spawnPowerUpAmbientIfNeeded(dt) {
    powerUpSpawnTimer += dt;
    if (powerUpSpawnTimer >= nextPowerUpSpawnTime) {
        let powerupToSpawn = null;
        let spawnChance = 1; // Probabilità di default per power-up generici

        // 1. Priorità allo scudo rinforzato (se non è già apparso)
        if (!hasReinforcedShieldSpawned && Math.random() < 0.1) {
            powerupToSpawn = POWERUP_TYPE.REINFORCED_SHIELD;
            hasReinforcedShieldSpawned = true; // Impedisce che spawni di nuovo
        } 
        // 2. Logica per BIT_VACUUM (dopo Glitchzilla)
        else if (isGlitchzillaDefeatedThisGame && Math.random() < 0.2) { // 20% di probabilità
            powerupToSpawn = POWERUP_TYPE.BIT_VACUUM;
        }
        // 3. Logica per PURGE_PROTOCOL (dopo TrojanByte) - spawnrate un po' più basso
        else if (isTrojanByteDefeatedThisGame && Math.random() < 0.1) { // 8% di probabilità (più basso di Bit Vacuum)
            powerupToSpawn = POWERUP_TYPE.PURGE_PROTOCOL;
        }
        // 4. Altrimenti, spawn di power-up casuali esistenti
        else {
            const nonAmbientPowerUps = [
                POWERUP_TYPE.SLAYER_SUBROUTINE,
                POWERUP_TYPE.CODE_INJECTOR,
                POWERUP_TYPE.DEBUG_MODE,
                POWERUP_TYPE.REINFORCED_SHIELD, // Escludilo anche dal pool normale
                // Escludi i power-up che hanno una loro logica di spawn condizionale specifica
                POWERUP_TYPE.BIT_VACUUM,
                POWERUP_TYPE.PURGE_PROTOCOL,
            ];
            const availablePowerUpTypes = Object.values(POWERUP_TYPE)
                .filter(type => !nonAmbientPowerUps.includes(type));

            if (availablePowerUpTypes.length > 0) {
                powerupToSpawn = availablePowerUpTypes[Math.floor(Math.random() * availablePowerUpTypes.length)];
            }
        }

        if (powerupToSpawn) {
            const yPos = 50 + Math.random() * (canvas.height - groundHeight - 150);
            powerUpItems.push(new PowerUpItem(canvas.width, yPos, powerupToSpawn, images));
        }

        powerUpSpawnTimer = 0;
        // La frequenza di spawn complessiva rimane la stessa
        nextPowerUpSpawnTime = calculateNextPowerUpAmbientSpawnTime();
    }
}

function updatePowerUpItems(dt) {
    for (let i = powerUpItems.length - 1; i >= 0; i--) {
        powerUpItems[i].update(dt, gameSpeed);
        if (powerUpItems[i].x + powerUpItems[i].width < 0) {
            powerUpItems.splice(i, 1);
        }
    }
}

function drawPowerUpItems() {
    powerUpItems.forEach((item) => item.draw(ctx));
}

function updateAllEnemyTypes(dt) {
    enemies.forEach((e) => e.update(dt));
    flyingEnemies.forEach((e) => e.update(dt));
    fastEnemies.forEach((e) => e.update(dt));
    armoredEnemies.forEach((e) => e.update(dt));
    shootingEnemies.forEach((e) => e.update(dt));
    armoredShootingEnemies.forEach((e) => e.update(dt));
    toughBasicEnemies.forEach((e) => e.update(dt));
    dangerousFlyingEnemies.forEach((e) => e.update(dt));
    kamikazeFlyingEnemies.forEach(e => e.update(dt)); // [FEAT] Aggiorna i nuovi nemici
    if (activeMiniboss) activeMiniboss.update(dt);
}

function drawAllEnemyTypes() {
    enemies.forEach((e) => e.draw());
    flyingEnemies.forEach((e) => e.draw());
    fastEnemies.forEach((e) => e.draw());
    armoredEnemies.forEach((e) => e.draw());
    shootingEnemies.forEach((e) => e.draw());
    armoredShootingEnemies.forEach((e) => e.draw());
    toughBasicEnemies.forEach((e) => e.draw());
    dangerousFlyingEnemies.forEach((e) => e.draw());
    kamikazeFlyingEnemies.forEach(e => e.draw()); // [FEAT] Disegna i nuovi nemici
    if (activeMiniboss) activeMiniboss.draw();
}

/**
 * Gestisce la logica e la visualizzazione della schermata di Game Over.
 * MODIFICATO: Salva automaticamente le statistiche nel profilo utente locale in IndexedDB
 * e assegna i badge/sblocca le skin localmente.
 */
async function processGameOver() { // FUNZIONE RESA ASYNC
    // --- INIZIO BUG FIX: Previene il re-triggering immediato durante l'inizializzazione ---
    if (isGameInitializing) {
        console.warn("Tentativo di attivare Game Over durante l'inizializzazione. Annullato."); //
        return; // Annulla Game Over se il gioco è in fase di inizializzazione
    }
    // --- FINE BUG FIX ---

    gameOverTrigger = false; //
    currentGameState = 'GAME_OVER'; //
    finalScore = Math.floor(score); //
    const instanceId = currentGameInstance; // Cattura l'ID di questa partita

    AudioManager.stopMusic(); //
    AudioManager.playSound('gameOverImpact'); //
    // Passa l'ID alla funzione, con un piccolo ritardo per l'audio
    setTimeout(() => playGameOverMusic(instanceId), 500); //

    if (accountIconContainer) { //
        accountIconContainer.style.display = 'flex'; //
    }
    if (mobileControlsDiv) { //
        mobileControlsDiv.style.display = 'none'; //
    }

    // --- NUOVA LOGICA DI SALVATAGGIO AUTOMATICO LOCALE E BADGE ---
    const localUserId = 'default_offline_user'; // L'ID utente locale fisso

    if (!window.currentUserData || window.currentUserData.userId !== localUserId) {
        console.error("window.currentUserData non disponibile o non corrisponde all'utente locale. Impossibile salvare le statistiche."); //
        showToast('Errore: impossibile salvare le statistiche locali.', 'error'); //
        // Non fare 'return' qui, vogliamo comunque mostrare la schermata Game Over.
    }

    const currentUserData = window.currentUserData; // Assicurati di usare l'oggetto globale mutabile

    const bossesDefeatedCount =
        (isGlitchzillaDefeatedThisGame ? 1 : 0) +
        (isTrojanByteDefeatedThisGame ? 1 : 0) +
        (isMissingNumberDefeatedThisGame ? 1 : 0) +
        (isDunnoExeDefeatedThisGame ? 1 : 0);

    // Aggiorna le statistiche cumulative nel currentUserData (questo avviene prima dell'assegnazione badge)
    currentUserData.gameStats.gamesPlayed = (currentUserData.gameStats.gamesPlayed || 0) + 1; //
    currentUserData.gameStats.totalGamesPlayed = (currentUserData.gameStats.totalGamesPlayed || 0) + 1; //
    currentUserData.gameStats.totalScore = (currentUserData.gameStats.totalScore || 0) + finalScore; //
    if (finalScore > (currentUserData.gameStats.highestScore || 0)) {
        currentUserData.gameStats.highestScore = finalScore; //
        currentUserData.gameStats.isHighestScoreRainy = isRainRunActive; //
    } else if (finalScore === currentUserData.gameStats.highestScore && isRainRunActive && !(currentUserData.gameStats.isHighestScoreRainy || false)) {
        currentUserData.gameStats.isHighestScoreRainy = true; //
    }

    currentUserData.gameStats.bossesDefeated = (currentUserData.gameStats.bossesDefeated || 0) + bossesDefeatedCount; //
    currentUserData.gameStats.totalBits = (currentUserData.gameStats.totalBits || 0) + bits; // <-- CORRETTO
    currentUserData.gameStats.totalDigitalFruits = (currentUserData.gameStats.totalDigitalFruits || 0) + gameStats.digitalFruitsCollected;

       // Aggiorna le statistiche specifiche della run (highest in run)
    if (bits > (currentUserData.gameStats.highestBitsCollectedRun || 0)) { //
        currentUserData.gameStats.highestBitsCollectedRun = bits; //
    }
    if (gameStats.dataPacketsCollected > (currentUserData.gameStats.highestDataPacketsCollectedRun || 0)) { //
        currentUserData.gameStats.highestDataPacketsCollectedRun = gameStats.dataPacketsCollected; //
    }
    if (gameStats.digitalFruitsCollected > (currentUserData.gameStats.highestDigitalFruitsCollected || 0)) { //
        currentUserData.gameStats.highestDigitalFruitsCollected = gameStats.digitalFruitsCollected; //
    }
    if (gameStats.enemiesDefeated > (currentUserData.gameStats.highestEnemiesDefeatedRun || 0)) { //
        currentUserData.gameStats.highestEnemiesDefeatedRun = gameStats.enemiesDefeated; //
    }
    if (gameStats.jumps > (currentUserData.gameStats.highestJumpsRun || 0)) { //
        currentUserData.gameStats.highestJumpsRun = gameStats.jumps; //
    }
    if (gameStats.missionsCompleted > (currentUserData.gameStats.highestMissionsCompletedRun || 0)) { //
        currentUserData.gameStats.highestMissionsCompletedRun = gameStats.missionsCompleted; //
    }
    if (gameStats.powerUpsCollected > (currentUserData.gameStats.highestPowerUpsCollectedRun || 0)) { //
        currentUserData.gameStats.highestPowerUpsCollectedRun = gameStats.powerUpsCollected; //
    }
    if (gameStats.shotsFired > (currentUserData.gameStats.highestProjectilesFiredRun || 0)) { //
        currentUserData.gameStats.highestProjectilesFiredRun = gameStats.shotsFired; //
    }

    // Aggiorna le statistiche cumulative per i frutti digitali (già corrette)
    currentUserData.gameStats.totalDigitalKiwiCollected = (currentUserData.gameStats.totalDigitalKiwiCollected || 0) + gameStats.digitalKiwiCollected; //
    currentUserData.gameStats.totalDigitalOrangeCollected = (currentUserData.gameStats.totalDigitalOrangeCollected || 0) + gameStats.digitalOrangeCollected; //
    currentUserData.gameStats.totalDigitalPearCollected = (currentUserData.gameStats.totalDigitalPearCollected || 0) + gameStats.digitalPearCollected; //
    currentUserData.gameStats.totalDigitalAppleCollected = (currentUserData.gameStats.totalDigitalAppleCollected || 0) + gameStats.digitalAppleCollected; //
    currentUserData.gameStats.totalBananaCollected = (currentUserData.gameStats.totalBananaCollected || 0) + gameStats.digitalBananaCollected; //
    currentUserData.gameStats.totalBerryCollected = (currentUserData.gameStats.totalBerryCollected || 0) + gameStats.digitalBerryCollected; //
    currentUserData.gameStats.totalBlueberryCollected = (currentUserData.gameStats.totalBlueberryCollected || 0) + gameStats.digitalBlueberryCollected; //
    currentUserData.gameStats.totalCherryCollected = (currentUserData.gameStats.totalCherryCollected || 0) + gameStats.digitalCherryCollected; //
    currentUserData.gameStats.totalCoconutCollected = (currentUserData.gameStats.totalCoconutCollected || 0) + gameStats.digitalCoconutCollected; //
    currentUserData.gameStats.totalDragonfruitCollected = (currentUserData.gameStats.totalDragonfruitCollected || 0) + gameStats.digitalDragonfruitCollected; //
    currentUserData.gameStats.totalGrapesCollected = (currentUserData.gameStats.totalGrapesCollected || 0) + gameStats.digitalGrapesCollected; //
    currentUserData.gameStats.totalLemonCollected = (currentUserData.gameStats.totalLemonCollected || 0) + gameStats.digitalLemonCollected; //
    currentUserData.gameStats.totalMelonCollected = (currentUserData.gameStats.totalMelonCollected || 0) + gameStats.digitalMelonCollected; //
    currentUserData.gameStats.totalPapayaCollected = (currentUserData.gameStats.totalPapayaCollected || 0) + gameStats.digitalPapayaCollected; //
    currentUserData.gameStats.totalPeachCollected = (currentUserData.gameStats.totalPeachCollected || 0) + gameStats.digitalPeachCollected; //
    currentUserData.gameStats.totalPineappleCollected = (currentUserData.gameStats.totalPineappleCollected || 0) + gameStats.digitalPineappleCollected; //
    currentUserData.gameStats.totalStrawberryCollected = (currentUserData.gameStats.totalStrawberryCollected || 0) + gameStats.digitalStrawberryCollected; //
    currentUserData.gameStats.totalWatermelonCollected = (currentUserData.gameStats.totalWatermelonCollected || 0) + gameStats.digitalWatermelonCollected; //

    // Aggiorna le statistiche specifiche della Rain Run
    if (isRainRunActive) { //
        if (gameStats.rainRunEnemiesDefeated > (currentUserData.gameStats.highestRainRunEnemiesDefeated || 0)) { //
            currentUserData.gameStats.highestRainRunEnemiesDefeated = gameStats.rainRunEnemiesDefeated; //
        }
        if (finalScore > (currentUserData.gameStats.highestRainRunHighScore || 0)) { //
            currentUserData.gameStats.highestRainRunHighScore = finalScore; //
        }
    }

    // Aggiorna lo stato dei power-up permanenti raccolti (se non già presenti)
    if (gameStats.slayerCollected && !currentUserData.gameStats.slayerCollected) { //
        currentUserData.gameStats.slayerCollected = true; //
        if (!currentUserData.inventory.unlockedItems.includes('slayer_subroutine')) { //
            currentUserData.inventory.unlockedItems.push('slayer_subroutine'); //
        }
    }
    if (gameStats.injectorCollected && !currentUserData.gameStats.injectorCollected) { //
        currentUserData.gameStats.injectorCollected = true; //
        if (!currentUserData.inventory.unlockedItems.includes('code_injector')) { //
            currentUserData.inventory.unlockedItems.push('code_injector'); //
        }
    }
    if (gameStats.debugCollected && !currentUserData.gameStats.debugCollected) { //
        currentUserData.gameStats.debugCollected = true; //
        if (!currentUserData.inventory.unlockedItems.includes('debug_mode')) { //
            currentUserData.inventory.unlockedItems.push('debug_mode'); //
        }
    }

    // Aggiorna i timestamp di modifica
    currentUserData.updatedAt = Date.now(); //
    currentUserData.profileUpdatedAt = Date.now(); //

    // --- INIZIO LOGICA ASSEGNAZIONE BADGE (LOCALIZZATA DA CLOUD FUNCTION) ---
    // NUOVO: Aggiorna le statistiche di gioco con i flag di sconfitta dei boss per questa run.
    // Questo è FONDAMENTALE per l'assegnazione dei badge relativi ai boss.
    gameStats.glitchzillaDefeated = isGlitchzillaDefeatedThisGame;
    gameStats.trojanByteDefeated = isTrojanByteDefeatedThisGame;
    gameStats.missingNumberDefeated = isMissingNumberDefeatedThisGame;
    gameStats.dunnoExeDefeated = isDunnoExeDefeatedThisGame;

    const userProfile = currentUserData; // userProfile è currentUserData qui
    const earnedBadges = new Set(userProfile.inventory?.earnedBadges || []);
    const updatedUnlockedItemsForBadges = new Set(userProfile.inventory?.unlockedItems || []); // Separato per chiarezza, sarà poi unito

    const gameStatsFromRun = gameStats; // Statistiche della run corrente (ORA include i flag dei boss)
    const scoreFromRun = finalScore; // Punteggio della run corrente
    const bitsCollectedFromRun = bits; // Bit della run corrente

    const newBadgesAwardedDuringThisRun = []; // Per raccogliere i badge appena assegnati per i toast

    // Processa i badge a livelli e individuali
    for (const categoryKey in FRONTEND_BADGE_TIERS) {
        const category = FRONTEND_BADGE_TIERS[categoryKey];

        if (category.type === 'individual_boss') {
            for (const bossBadge of category.bosses) {
                // Con il fix sopra, gameStatsFromRun[bossBadge.flag] ora funzionerà correttamente
                if (gameStatsFromRun[bossBadge.flag] && !earnedBadges.has(bossBadge.id)) {
                    earnedBadges.add(bossBadge.id);
                    newBadgesAwardedDuringThisRun.push(bossBadge.id);
                    if (bossBadge.unlocksSkin && !updatedUnlockedItemsForBadges.has(bossBadge.unlocksSkin)) {
                        updatedUnlockedItemsForBadges.add(bossBadge.unlocksSkin);
                    }
                }
            }
        } else if (category.type === 'multi_fruit_cumulative') { // Nuovo: Badge cumulativo multi-frutta
            const badgeId = category.id; //
            if (!earnedBadges.has(badgeId)) {
                let allThresholdsMet = true;
                for (const fruitType in category.thresholds) { //
                    const required = category.thresholds[fruitType]; //
                    // Usa le statistiche cumulative del profilo utente per i conteggi totali della frutta
                    const current = userProfile.gameStats?.[`total${fruitType.charAt(0).toUpperCase() + fruitType.slice(1)}Collected`] || 0;
                    if (current < required) {
                        allThresholdsMet = false;
                        break;
                    }
                }
                if (allThresholdsMet) {
                    earnedBadges.add(badgeId); //
                    newBadgesAwardedDuringThisRun.push(badgeId);
                    if (category.unlocksSkin && !updatedUnlockedItemsForBadges.has(category.unlocksSkin)) { //
                        updatedUnlockedItemsForBadges.add(category.unlocksSkin); //
                    }
                }
            }
        } else { // Badge a livelli basati su metriche
            let currentMetricValue;
            // MODIFIED: Map the metric to the correct cumulative/highest-ever stat from userProfile.gameStats
            switch (category.metric) {
                case 'highestScore':
                    currentMetricValue = userProfile.gameStats?.highestScore || 0;
                    break;
                case 'enemiesDefeated':
                    currentMetricValue = userProfile.gameStats?.highestEnemiesDefeatedRun || 0;
                    break;
                case 'jumps':
                    currentMetricValue = userProfile.gameStats?.highestJumpsRun || 0;
                    break;
                case 'shotsFired':
                    currentMetricValue = userProfile.gameStats?.highestProjectilesFiredRun || 0;
                    break;
                case 'bitsCollected':
                    currentMetricValue = userProfile.gameStats?.highestBitsCollectedRun || 0;
                    break;
                case 'missionsCompleted':
                    currentMetricValue = userProfile.gameStats?.highestMissionsCompletedRun || 0;
                    break;
                case 'powerUpsCollected':
                    currentMetricValue = userProfile.gameStats?.highestPowerUpsCollectedRun || 0;
                    break;
                case 'dataPacketsCollected':
                    currentMetricValue = userProfile.gameStats?.highestDataPacketsCollectedRun || 0;
                    break;
                case 'totalDigitalFruits':
                    currentMetricValue = userProfile.gameStats?.totalDigitalFruits || 0;
                    break;
                case 'rainRunEnemiesDefeated':
                    currentMetricValue = userProfile.gameStats?.highestRainRunEnemiesDefeated || 0;
                    break;
                case 'rainRunHighScore':
                    currentMetricValue = userProfile.gameStats?.highestRainRunHighScore || 0;
                    break;
                default:
                    console.warn(`[processGameOver] Metric '${category.metric}' not explicitly mapped for badge calculation. Using 0.`);
                    currentMetricValue = 0;
                    break;
            }

            let currentMaxLevel = userProfile.gameStats?.[`${category.baseId}_level`] || 0;
            let newMaxLevel = currentMaxLevel;

            for (const tier of category.tiers) {
                if (currentMetricValue >= tier.threshold && tier.level > newMaxLevel) {
                    newMaxLevel = tier.level;
                }
            }

            if (newMaxLevel > currentMaxLevel) {
                const newBadgeId = category.tiers.find(t => t.level === newMaxLevel).id;
                if (!earnedBadges.has(newBadgeId)) {
                    earnedBadges.add(newBadgeId);
                    newBadgesAwardedDuringThisRun.push(newBadgeId);
                    userProfile.gameStats[`${category.baseId}_level`] = newMaxLevel;

                    const unlockedTier = category.tiers.find(t => t.id === newBadgeId);
                    if (unlockedTier?.unlocksSkin && !updatedUnlockedItemsForBadges.has(unlockedTier.unlocksSkin)) {
                        updatedUnlockedItemsForBadges.add(unlockedTier.unlocksSkin);
                    }
                }
            }
        }
    }

    // Applica i cambiamenti accumulati di badge e item sbloccati a currentUserData
    currentUserData.inventory.earnedBadges = Array.from(earnedBadges);
    currentUserData.inventory.unlockedItems = Array.from(updatedUnlockedItemsForBadges);
    currentUserData.updatedAt = Date.now(); // Aggiorna timestamp
    currentUserData.profileUpdatedAt = Date.now(); //

    // Salva il currentUserData aggiornato (questo sarà il salvataggio finale per la run)
    try {
        await saveUser(currentUserData); //
        console.log('[donkeyRunner.js] Statistiche di gioco e badge/skin salvati localmente:', currentUserData.gameStats);
        showToast('Statistiche e progressi salvati localmente!', 'success'); //

        // Mostra i toast per i badge appena guadagnati
        if (newBadgesAwardedDuringThisRun.length > 0) {
            // Carica le definizioni dei badge per ottenere i nomi leggibili per i toast
            const badgeDefinitions = {};
            for (const key in FRONTEND_BADGE_TIERS) {
                const category = FRONTEND_BADGE_TIERS[key];
                if (category.type === 'individual_boss') {
                    category.bosses.forEach(b => badgeDefinitions[b.id] = b.name); //
                } else if (category.type === 'multi_fruit_cumulative') {
                    badgeDefinitions[category.id] = category.name; //
                } else {
                    category.tiers.forEach(t => badgeDefinitions[t.id] = t.name); //
                }
            }
            for (const badgeId of newBadgesAwardedDuringThisRun) {
                const badgeName = badgeDefinitions[badgeId] || badgeId; // Fallback all'ID se il nome non è trovato
                showToast(`Nuovo badge: "${badgeName}" sbloccato!`, 'info');
            }
        }
    } catch (error) {
        console.error('[donkeyRunner.js] Errore nel salvataggio delle statistiche, badge e skin su IndexedDB:', error); //
        showToast(`Errore salvataggio locale: ${error.message}`, 'error'); //
    }
    // --- FINE LOGICA ASSEGNAZIONE BADGE ---

    // Mostra il contenitore del punteggio
    if (scoreInputContainerDonkey) { //
        const finalScoreDisplay = document.getElementById('finalScoreDisplayDonkey'); //
        if (finalScoreDisplay) { //
            finalScoreDisplay.textContent = finalScore; //
        }
        scoreInputContainerDonkey.style.display = 'flex'; //
        if (saveScoreBtnDonkey) saveScoreBtnDonkey.style.display = 'block'; //
        if (restartGameBtnDonkey) restartGameBtnDonkey.style.display = 'block'; //
        if (shareScoreBtnDonkey) shareScoreBtnDonkey.style.display = 'block'; //
        if (mainMenuBtn) mainMenuBtn.style.display = 'block'; //
    }
    MissionManager.resetMissions(); //
}
// NUOVA FUNZIONE: Rimuove un nemico dal suo array di origine
function removeEnemyFromAnyArray(enemyToRemove) {
    const allEnemyArrays = [
        enemies,
        fastEnemies,
        armoredEnemies,
        shootingEnemies,
        flyingEnemies,
        armoredShootingEnemies,
        toughBasicEnemies,
        dangerousFlyingEnemies,
        kamikazeFlyingEnemies, // [CORRECTION] Aggiungi il nuovo array qui
    ];

    for (const enemyArray of allEnemyArrays) {
        const index = enemyArray.indexOf(enemyToRemove);
        if (index > -1) {
            enemyArray.splice(index, 1);
            //console.log(`DEBUG_REMOVAL: Rimosso nemico dal suo array originale. Tipo: ${enemyToRemove.constructor.name}`);
            return true; // Nemico trovato e rimosso
        }
    }
    return false; // Nemico non trovato in nessun array gestito da questa funzione
}
// donkeyRunner.js - Sostituisci l'intera funzione checkCollisions()
function checkCollisions() {
    if (!asyncDonkey) return;
    const playerRect = {
        x: asyncDonkey.x + asyncDonkey.colliderOffsetX,
        y: asyncDonkey.y + asyncDonkey.colliderOffsetY,
        width: asyncDonkey.colliderWidth,
        height: asyncDonkey.colliderHeight,
    };

    let projectileRemoved = false; 

    for (let i = collectibles.length - 1; i >= 0; i--) {
        const item = collectibles[i];
        if (!item || item.type === 'power_up') continue; 

        if (
            playerRect.x < item.x + item.width &&
            playerRect.x + playerRect.width > item.x &&
            playerRect.y < item.y + item.height &&
            playerRect.y + playerRect.height > item.y
        ) {
            if (item.collect) {
                item.collect({ byCompanion: false }); 
            }
            collectibles.splice(i, 1); 
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (
            playerRect.x < obs.x + obs.width &&
            playerRect.x + playerRect.width > obs.x &&
            playerRect.y < obs.y + obs.height &&
            playerRect.y + playerRect.height > obs.y
        ) {
            if (asyncDonkey.isFirewallActive) {
                obstacles.splice(i, 1);
                score += 10;
                AudioManager.playSound('blockBreak', false, 0.7);
                continue;
            }
            if (asyncDonkey.isShieldActive) {
                asyncDonkey.deactivatePowerUp();
                obstacles.splice(i, 1);
                AudioManager.playSound('shieldBlock');
                continue;
            }
            asyncDonkey.takeHit();
            if(gameOverTrigger) return;
        }
    }

    for (let i = flyingEnemies.length - 1; i >= 0; i--) {
        const enemy = flyingEnemies[i];
        if (
            playerRect.x < enemy.x + enemy.width &&
            playerRect.x + playerRect.width > enemy.x &&
            playerRect.y < enemy.y + enemy.height &&
            playerRect.y + playerRect.height > enemy.y
        ) {
            flyingEnemies.splice(i, 1);    
            score += enemy.scoreValue;
            AudioManager.playSound('enemyExplode');
            gameStats.enemiesDefeated++;

            let droppedPowerUp = null;
            if (
                isGlitchzillaDefeatedThisGame &&
                !hasDebugModeUpgrade &&
                !hasSlayerSubroutineUpgrade &&
                !hasCodeInjectorUpgrade &&
                Math.random() < 0.10
            ) {
                droppedPowerUp = POWERUP_TYPE.DEBUG_MODE;
            } else {
                droppedPowerUp = RANDOMLY_SPAWNABLE_POWERUPS[Math.floor(Math.random() * RANDOMLY_SPAWNABLE_POWERUPS.length)];
            }
            
            if (droppedPowerUp) {
                powerUpItems.push(
                    new PowerUpItem(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, droppedPowerUp, images)
                );
            }
        }
    }

    const allDamagingEnemyArrays = [enemies, fastEnemies, armoredEnemies, shootingEnemies, armoredShootingEnemies, toughBasicEnemies, dangerousFlyingEnemies, kamikazeFlyingEnemies];

    for (const enemyArray of allDamagingEnemyArrays) {
        for (let i = enemyArray.length - 1; i >= 0; i--) {
            const enemy = enemyArray[i];
            if (!enemy) continue;

            if (asyncDonkey.isPurgeProtocolActive && enemy !== activeMiniboss && !(enemy instanceof FlyingEnemy && !enemy.isDangerousFlyer)) {
                if (removeEnemyFromAnyArray(enemy)) {
                    score += enemy.scoreValue;
                    gameStats.enemiesDefeated++;
                    AudioManager.playSound('sfx_enemy_devour');
                    if (asyncDonkey && !asyncDonkey.isDigesting) {
                        asyncDonkey.isDigesting = true;
                        asyncDonkey.digestTimer = 0.5;
                    }
                }
                continue;
            }

            if (enemy instanceof FlyingEnemy && !enemy.isDangerousFlyer) {
                continue;
            }
            
            if (
                playerRect.x < enemy.x + enemy.width &&
                playerRect.x + playerRect.width > enemy.x &&
                playerRect.y < enemy.y + enemy.height && 
                playerRect.y + playerRect.height > enemy.y
        ) {
                asyncDonkey.takeHit();
                if (gameOverTrigger) return;

                if (enemy !== activeMiniboss && removeEnemyFromAnyArray(enemy)) {
                    gameStats.enemiesDefeated++;
                }
            }
        }
    }

    // Gestione collisioni dei proiettili del giocatore con i nemici 
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        if (!proj) continue;
        
        const allShootableEnemyTargets = [...enemies, ...fastEnemies, ...armoredEnemies, ...shootingEnemies,
            ...armoredShootingEnemies, ...toughBasicEnemies, ...dangerousFlyingEnemies, ...flyingEnemies, ...kamikazeFlyingEnemies];
            
        if (activeMiniboss) {
            allShootableEnemyTargets.push(activeMiniboss);    
        }

        for (let j = allShootableEnemyTargets.length - 1; j >= 0; j--) {
            const enemy = allShootableEnemyTargets[j];    
            if (!enemy) continue;

            if (
                proj.x < enemy.x + enemy.width &&
                proj.x + proj.width > enemy.x &&
                proj.y < enemy.y + enemy.height &&
                proj.y + proj.height > enemy.y
            ) {
                // Collisione rilevata
                enemy.takeDamage(proj.damage);
                AudioManager.playSound('enemyHit');
                projectiles.splice(i, 1);    
                projectileRemoved = true;

                // NUOVO: Logica di rimozione del nemico dopo che è stato sconfitto da un proiettile
                if (enemy.health <= 0) {
        if (enemy !== activeMiniboss) {
            if (removeEnemyFromAnyArray(enemy)) {
                score += enemy.scoreValue;
                AudioManager.playSound('enemyExplode'); // Suono di esplosione nemico
                gameStats.enemiesDefeated++; // Incrementa le statistiche
                if (isRainRunActive) { // NUOVO: Incrementa per Rain Run
                    gameStats.rainRunEnemiesDefeated++;
                }
                        }
                    }
                }
                // AGGIORNATO: Continua al prossimo proiettile del giocatore dopo la rimozione
                break; // Esci dal ciclo degli "enemy" per questo proiettile.
            }
        }

        if (projectileRemoved) {
            continue; 
        }

        if (asyncDonkey && asyncDonkey.isBlockBreakerActive) { 
            for (let k = obstacles.length - 1; k >= 0; k--) {
                const obs = obstacles[k];
                if (
                    proj.x < obs.x + obs.width &&
                    proj.x + proj.width > obs.x &&
                    proj.y < obs.y + obs.height &&
                    proj.y + obs.height > obs.y 
                ) {
                    if (obs.takeDamage(proj.damage)) {
                        obstacles.splice(k, 1);
                        score += 10;
                    }
                    projectiles.splice(i, 1);
                    projectileRemoved = true;
                    break; 
                }
            }
        }
    }

    // Gestione collisioni dei proiettili dei compagni (inclusi i boss)
    const allCompanionProjectiles = companionManager ? companionManager.getAllCompanionProjectiles() : [];
        
    for (let i = allCompanionProjectiles.length - 1; i >= 0; i--) {
        const cProj = allCompanionProjectiles[i];
        if (!cProj) continue;

        if (!cProj.sprite || typeof cProj.sprite.src === 'undefined') {
            console.warn(`DEBUG_COLLISIONI: Proiettile compagno (${cProj.type}) senza oggetto sprite valido o senza proprietà src. Saltando collisione.`);
            continue;
        }

        let companionProjectileRemoved = false; 

        const companionTargets = [...enemies, ...fastEnemies, ...armoredEnemies, ...shootingEnemies,
            ...armoredShootingEnemies, ...toughBasicEnemies, ...dangerousFlyingEnemies, ...flyingEnemies, ...kamikazeFlyingEnemies];
            
        if (activeMiniboss) {
            companionTargets.push(activeMiniboss);    
        }

        for (let j = companionTargets.length - 1; j >= 0; j--) {
            const enemy = companionTargets[j];    
            if (!enemy) continue;

            if (enemy instanceof FlyingEnemy && !enemy.isDangerousFlyer) {
                continue;
            }
                
            if (
                cProj.x < enemy.x + enemy.width &&
                cProj.x + cProj.width > enemy.x &&
                cProj.y < enemy.y + enemy.height &&
                cProj.y + cProj.height > enemy.y
            ) {
                // Collisione rilevata
                enemy.takeDamage(cProj.damage);
                AudioManager.playSound('enemyHit');
                if (companionManager.activeCompanion) {
                    const projIndex = companionManager.activeCompanion.projectiles.indexOf(cProj);
                    if (projIndex > -1) {
                        companionManager.activeCompanion.projectiles.splice(projIndex, 1);
                    }
                }
                companionProjectileRemoved = true;
                
                // NUOVO: Logica di rimozione del nemico dopo che è stato sconfitto da un proiettile compagno
                if (enemy.health <= 0) {
        if (enemy !== activeMiniboss) {
            if (removeEnemyFromAnyArray(enemy)) {
                score += enemy.scoreValue;
                AudioManager.playSound('enemyExplode'); // Suono di esplosione nemico
                gameStats.enemiesDefeated++; // Incrementa le statistiche
                if (isRainRunActive) { // NUOVO: Incrementa per Rain Run
                    gameStats.rainRunEnemiesDefeated++;
                }
                        }
                    }
                }
                // AGGIORNATO: Continua al prossimo proiettile del compagno dopo la rimozione
                break; // Esci dal ciclo degli "enemy" per questo proiettile compagno.
            }
        }

        if (companionProjectileRemoved) {
            continue; 
        }

        if (cProj.sprite.src.includes('proj_cloud_assistant')) { 
            for (let k = obstacles.length - 1; k >= 0; k--) {
                const obs = obstacles[k];
                if (
                    cProj.x < obs.x + obs.width &&
                    cProj.x + cProj.width > obs.x &&
                    cProj.y < obs.y + obs.height &&
                    cProj.y + obs.height > obs.y 
                ) {
                    if (obs.takeDamage(cProj.damage)) {
                        obstacles.splice(k, 1);
                        score += 10;
                    }
                    if (companionManager.activeCompanion) {
                        const projIndex = companionManager.activeCompanion.projectiles.indexOf(cProj);
                        if (projIndex > -1) {
                            companionManager.activeCompanion.projectiles.splice(projIndex, 1);
                        }
                    }
                    companionProjectileRemoved = true;
                    break; 
                }
            }
        }
    }

    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const eProj = enemyProjectiles[i];
        if (
            playerRect.x < eProj.x + eProj.width &&
            playerRect.x + playerRect.width > eProj.x &&
            playerRect.y < eProj.y + eProj.height &&
            playerRect.y + playerRect.height > eProj.y
        ) {
            enemyProjectiles.splice(i, 1);

            if (eProj.isHarmful) {
                asyncDonkey.takeHit();
                if (gameOverTrigger) return;
            } else {
                bits += 10;
                AudioManager.playSound(SFX_PROJECTILE_DIGEST, false, 0.7);
                if (asyncDonkey && !asyncDonkey.isDigesting) {
                    asyncDonkey.isDigesting = true;
                    asyncDonkey.digestTimer = asyncDonkey.digestDuration;
                    asyncDonkey.showGlowEffect = true;
                    setTimeout(() => {
                        if (asyncDonkey) asyncDonkey.showGlowEffect = false;
                    }, 200);
                }
                if (!eProj.isHarmful && Math.random() < 0.4) {
                    const randomMsg = TASTY_BUG_MESSAGES[Math.floor(Math.random() * TASTY_BUG_MESSAGES.length)];
                    floatingTexts.push(new FloatingText(asyncDonkey.x + asyncDonkey.displayWidth / 2, asyncDonkey.y, randomMsg));
                }
                MissionManager.updateMissionProgress('collect_bits', { value: 10 });
            }
        }
    }

    for (let i = powerUpItems.length - 1; i >= 0; i--) {
        const item = powerUpItems[i];
        if (
            playerRect.x < item.x + item.width &&
            playerRect.x + playerRect.width > item.x &&
            playerRect.y < item.y + item.height &&
            playerRect.y + playerRect.height > item.y
        ) {
            asyncDonkey.activatePowerUp(item.type);
            powerUpItems.splice(i, 1);
        }
    }
}
// NUOVO: Funzione per inizializzare le particelle del background
function initializeBackgroundParticles() {
    backgroundParticles = [];
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ<>!@#$%^&*()_+{}|[]?';
    
    // Creiamo 3 livelli di particelle per l'effetto parallasse
    const layers = [
        { count: 100, speed: 15, size: 10, alpha: 0.15 }, // Livello più lontano
        { count: 60, speed: 30, size: 14, alpha: 0.3 },   // Livello intermedio
        { count: 30, speed: 50, size: 18, alpha: 0.45 }   // Livello più vicino
    ];

    layers.forEach(layer => {
        for (let i = 0; i < layer.count; i++) {
            backgroundParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                char: chars[Math.floor(Math.random() * chars.length)],
                speed: layer.speed,
                size: layer.size,
                alpha: layer.alpha
            });
        }
    });
}
// NUOVO: Funzione per aggiornare la logica del background (chiamata nel game loop)
function updateBackground(dt) {
    backgroundParticles.forEach(p => {
        p.y += p.speed * dt;
        if (p.y > canvas.height) {
            p.y = 0;
            p.x = Math.random() * canvas.width;
        }
    });
}
function resetGame(options = {}) {
    asyncDonkey = new Player(playerInitialX, playerInitialY, PLAYER_TARGET_WIDTH, PLAYER_TARGET_HEIGHT, options.inventory);
    console.log("NUOVO LOG DI DEBUG: asyncDonkey istanza creata/riassegnata in resetGame:", asyncDonkey);

    obstacles = [];
    projectiles = [];
    enemies = [];
    flyingEnemies = [];
    fastEnemies = [];
    armoredEnemies = [];
    shootingEnemies = [];
    armoredShootingEnemies = [];
    toughBasicEnemies = [];
    dangerousFlyingEnemies = [];
    kamikazeFlyingEnemies = [];
    enemyProjectiles = [];
    powerUpItems = [];
    floatingTexts = [];

    collectibles = [];

    activeMiniboss = null;

    bossFightImminent = false;
    hasGlitchzillaSpawnedThisGame = false;
    isGlitchzillaDefeatedThisGame = false;
    hasTrojanByteSpawnedThisGame = false;
    isTrojanByteDefeatedThisGame = false;
    hasMissingNumberSpawnedThisGame = false;
    isMissingNumberDefeatedThisGame = false;
    hasDunnoExeSpawnedThisGame = false;
    isDunnoExeDefeatedThisGame = false;
    postBossCooldownActive = false;
    bossWarningTimer = 2.0;
    postBossCooldownTimer = 2.0;

    hasSlayerSubroutineUpgrade = false;
    hasCodeInjectorUpgrade = false;
    hasDebugModeUpgrade = false;
    hasReinforcedShieldSpawned = false;
    hasExtraLifeSpawnedThisGame = false;

    score = 0;
    finalScore = 0;
    bits = 0;
    gameOverTrigger = false;
    canShoot = true;
    shootTimer = 0;

    // >>> START OF MODIFICATION
    gameSpeed = 220; // Reset game speed to its initial value
    // <<< END OF MODIFICATION

    obstacleSpawnTimer = 0;
    nextObstacleSpawnTime = calculateNextObstacleSpawnTime();
    enemyBaseSpawnTimer = 0;
    nextEnemyBaseSpawnTime = calculateNextEnemyBaseSpawnTime();
    flyingEnemySpawnTimer = 0;
    nextFlyingEnemySpawnTime = calculateNextFlyingEnemySpawnTime();
    fastEnemySpawnTimer = 0;
    nextFastEnemySpawnTime = calculateNextGenericEnemySpawnTime(4, 6);
    armoredEnemySpawnTimer = 0;
    nextArmoredEnemySpawnTime = calculateNextGenericEnemySpawnTime(6, 9);
    shootingEnemySpawnTimer = 0;
    nextShootingEnemySpawnTime = calculateNextGenericEnemySpawnTime(5, 8);
    armoredShootingEnemySpawnTimer = 0;
    nextArmoredShootingEnemySpawnTime = calculateNextGenericEnemySpawnTime(8, 12);
    toughBasicEnemySpawnTimer = 0;
    nextToughBasicEnemySpawnTime = calculateNextGenericEnemySpawnTime(3, 5);
    dangerousFlyingEnemySpawnTimer = 0;
    nextDangerousFlyingEnemySpawnTime = calculateNextGenericEnemySpawnTime(7, 10);
    kamikazeFlyingEnemySpawnTimer = 0;
    nextKamikazeFlyingEnemySpawnTime = calculateNextKamikazeFlyingEnemySpawnTime();

    powerUpSpawnTimer = 0;
    nextPowerUpSpawnTime = calculateNextPowerUpAmbientSpawnTime();
    extraLifeSpawnTimer = 0;
    nextExtraLifeSpawnTime = calculateNextExtraLifeSpawnTime();
    richBitsSpawnTimer = 0;
    nextRichBitsSpawnTime = calculateNextRichBitsSpawnTime();
    dataPackageSpawnTimer = 0;
    nextDataPackageSpawnTime = calculateNextDataPackageSpawnTime();
    digitalFruitSpawnTimer = 0;
    nextDigitalFruitSpawnTime = calculateNextDigitalFruitSpawnTime();

    if (asyncDonkey) {
        asyncDonkey.isBitVacuumActive = false;
        asyncDonkey.isPurgeProtocolActive = false;
        asyncDonkey.canEatEnemy = false;
    }

    if (companionManager) {
        companionManager.unequipCompanion();
        console.log("NUOVO LOG DI DEBUG: Compagno disequipaggiato in resetGame.");
    }

    gameStats = {
        jumps: 0,
        shotsFired: 0,
        powerUpsCollected: 0,
        missionsCompleted: 0,
        missionBitsEarned: 0,
        slayerCollected: false,
        injectorCollected: false,
        debugCollected: false,
        enemiesDefeated: 0,
        dataPacketsCollected: 0,
        digitalKiwiCollected: 0,
        digitalOrangeCollected: 0,
        digitalPearCollected: 0,
        digitalAppleCollected: 0,
        digitalBananaCollected: 0,
        digitalBerryCollected: 0,
        digitalBlueberryCollected: 0,
        digitalCherryCollected: 0,
        digitalCoconutCollected: 0,
        digitalDragonfruitCollected: 0,
        digitalGrapesCollected: 0,
        digitalLemonCollected: 0,
        digitalMelonCollected: 0,
        totalPapayaCollected: 0,
        totalPeachCollected: 0,
        totalPineappleCollected: 0,
        totalStrawberryCollected: 0,
        totalWatermelonCollected: 0,
        digitalFruitsCollected: 0,
        rainRunEnemiesDefeated: 0, // Inizializzato a 0
        rainRunHighScore: 0,       // NUOVO: Inizializzato a 0
    };
    if (scoreInputContainerDonkey) {
        scoreInputContainerDonkey.style.display = 'none';
    }

    if (shareScoreBtnDonkey) {
        shareScoreBtnDonkey.style.display = 'inline-block';
    }

    const playerInitialsDonkeyInput = document.getElementById('playerInitialsDonkey');
    const playerInitialsLabel = document.getElementById('playerInitialsLabel');
    if (playerInitialsDonkeyInput) {
        playerInitialsDonkeyInput.style.display = 'block';
    }
    if (playerInitialsLabel) {
        playerInitialsLabel.style.display = 'block';
    }

    isRainRunActive = options.isRaining || false;
    gameRainParticles = [];
    // >>> INIZIO MODIFICA: Utilizza il flag corretto per popolare le particelle di pioggia
    if (isRainRunActive) { // SOSTITUISCI 'isRainingInGame' con 'isRainRunActive' qui
        const numRainParticles = 100; // Numero di particelle di pioggia
        for (let i = 0; i < numRainParticles; i++) {
            gameRainParticles.push(new DigitalRainParticle(canvas.width, canvas.height));
        }
        thunderclapGameTimer = 0;
        nextThunderclapGameInterval = 3000 + Math.random() * 7000;
        isFlashingGame = false;
        flashGameTimer = 0;
        console.log("[donkeyRunner.js] Pioggia e tuoni attivi in-game.");
    } else {
        // Questo blocco 'else' si attiva quando la pioggia non è attiva
        console.log("[donkeyRunner.js] Pioggia e tuoni disattivati in-game.");
    }

    if (canvas) {
        initializeBackgroundParticles();
    }

    if (touchOverlayLeft) {
        touchOverlayLeft.style.opacity = '1';
    }
    if (touchOverlayRight) {
        touchOverlayRight.style.opacity = '1';
    }

    console.log('Gioco resettato.');
    MissionManager.resetMissions();
}
// MODIFICATO: La funzione `drawTerminalBackgroundEffects` è stata completamente riscritta
// In www/js/donkeyRunner.js

function drawTerminalBackgroundEffects() {
    // NUOVO: Determina il tema corrente in base al boss attivo
    const currentTheme = activeMiniboss && activeMiniboss.name ? BOSS_THEMES[activeMiniboss.name] : null;

    // 1. Disegna le particelle del background dinamico
    ctx.save();
    backgroundParticles.forEach(p => {
        let particleColor;
        // Se c'è un tema boss e una piccola probabilità, usa un colore "glitch"
        if (currentTheme && Math.random() < 0.15) { // 15% di probabilità di glitch
            const glitchColors = currentTheme.particleColors;
            particleColor = glitchColors[Math.floor(Math.random() * glitchColors.length)];
        } else {
            // Altrimenti, usa il colore di default
            particleColor = `rgba(14, 175, 155, ${p.alpha})`;
        }
        
        ctx.fillStyle = particleColor;
        ctx.font = `${p.size}px "Courier Prime", monospace`;
        ctx.fillText(p.char, p.x, p.y);
    });
    ctx.restore();

    // 2. Disegna l'effetto Scanlines sopra a tutto
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    for (let i = 0; i < canvas.height; i += 3) {
        ctx.fillRect(0, i, canvas.width, 1);
    }
    ctx.restore();
}

function drawGlitchText(
    text,
    x,
    y,
    fontSize,
    primaryColor,
    glitchColor1,
    glitchColor2,
    glitchOffsetX = 2,
    glitchOffsetY = 1
) {
    ctx.font = `${fontSize}px "Courier Prime", "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    if (Math.random() < 0.1) {
        const offsetX = (Math.random() - 0.5) * glitchOffsetX * 2;
        const offsetY = (Math.random() - 0.5) * glitchOffsetY * 2;
        ctx.fillStyle = Math.random() < 0.5 ? glitchColor1 : glitchColor2;
        ctx.fillText(text, x + offsetX, y + offsetY);
    }
    ctx.fillStyle = primaryColor;
    ctx.fillText(text, x, y);
}



function updatePlaying(dt) {
    if (!asyncDonkey) return;

    const MACHINE_GUN_FIRE_RATE = 0.1; // 10 proiettili al secondo
    if (asyncDonkey.isMachineLanguageActive && isShootingHeld) {
        asyncDonkey.machineGunTimer += dt;
        if (asyncDonkey.machineGunTimer >= MACHINE_GUN_FIRE_RATE) {
            asyncDonkey.shoot(); // Usa la funzione shoot esistente
            asyncDonkey.machineGunTimer = 0;
        }
    }

    updateBackground(dt);

    // Gestione del cooldown post-boss
    if (postBossCooldownActive) {
        postBossCooldownTimer -= dt;
        if (postBossCooldownTimer <= 0) {
            postBossCooldownActive = false;
            console.log('Post-boss cooldown terminato. Ripresa del gioco normale.');
        }
    }

    // --- Logica di Inizio Battaglia Boss (Trigger della fase di warning) ---
    // DICHIARA willSpawnBoss QUI per risolvere il ReferenceError
    let willSpawnBoss = false; // NUOVO: Sostituisci la dichiarazione 'willSpawnBoss' qui se non è già presente.

    // Avvia la fase di warning di un boss solo se nessun boss è attivo, nessuna battaglia è imminente,
    // e non c'è un cooldown post-boss attivo.
    if (!activeMiniboss && !bossFightImminent && !postBossCooldownActive) {
        if (!isGlitchzillaDefeatedThisGame && score >= GLITCHZILLA_SPAWN_SCORE_THRESHOLD) {
            console.log('Soglia punteggio per Glitchzilla raggiunta. Avvio sequenza di spawn (2s warning).');
            willSpawnBoss = true;
            bossFightImminent = true;
            bossWarningTimer = 2.0;
            hasGlitchzillaSpawnedThisGame = true; // Marchia che la fase di questo boss è stata triggerata
        } else if (
            isGlitchzillaDefeatedThisGame &&
            !isTrojanByteDefeatedThisGame &&
            score >= TROJAN_BYTE_SPAWN_SCORE_THRESHOLD
        ) {
            console.log('Soglia punteggio per Trojan_Byte raggiunta. Avvio sequenza di spawn (2s warning).');
            willSpawnBoss = true;
            bossFightImminent = true;
            bossWarningTimer = 2.0;
            hasTrojanByteSpawnedThisGame = true; // Marchia che la fase di questo boss è stata triggerata
        } else if (
            isGlitchzillaDefeatedThisGame &&
            isTrojanByteDefeatedThisGame &&
            !isMissingNumberDefeatedThisGame &&
            score >= MISSING_NUMBER_SPAWN_SCORE_THRESHOLD
        ) {
            console.log('Soglia punteggio per Missing_Number raggiunta. Avvio sequenza di spawn (2s warning).');
            willSpawnBoss = true;
            bossFightImminent = true;
            bossWarningTimer = 2.0;
            hasMissingNumberSpawnedThisGame = true; // Marchia che la fase di questo boss è stata triggerata
        } else if ( // NUOVO: Logica di spawn per DUNNO.EXE
            isGlitchzillaDefeatedThisGame &&
            isTrojanByteDefeatedThisGame &&
            isMissingNumberDefeatedThisGame &&
            !hasDunnoExeSpawnedThisGame && // Assicurati che non sia già apparso
            score >= DUNNO_EXE_SPAWN_SCORE_THRESHOLD // Usa la soglia di DUNNO.EXE
        ) {
            console.log('Soglia punteggio per DUNNO.EXE raggiunta. Avvio sequenza di spawn (2s warning).');
            willSpawnBoss = true;
            bossFightImminent = true;
            bossWarningTimer = 2.0;
            hasDunnoExeSpawnedThisGame = true; // Marchia che la fase di questo boss è stata triggerata
        }

        // Se un boss sta per spawnare, cambia la musica.
        if (willSpawnBoss) {
            let bossToSpawnName = '';
            if (hasGlitchzillaSpawnedThisGame && !isGlitchzillaDefeatedThisGame) {
                bossToSpawnName = 'Glitchzilla';
            } else if (hasTrojanByteSpawnedThisGame && !isTrojanByteDefeatedThisGame) {
                bossToSpawnName = 'TrojanByte';
            } else if (hasMissingNumberSpawnedThisGame && !isMissingNumberDefeatedThisGame) {
                bossToSpawnName = 'MissingNumber';
            } else if (hasDunnoExeSpawnedThisGame && !isDunnoExeDefeatedThisGame) { // NUOVO
                bossToSpawnName = 'DUNNO.EXE';
            }

            // CHIAMA playBossMusic CON IL NOME DEL BOSS CORRETTO
            if (bossToSpawnName) {
                playBossMusic(bossToSpawnName);
            }
        }
    }


    // --- Logica di Spawn Effettivo del Boss (Crea l'oggetto boss dopo il warning) ---
    // Questo avviene DOPO che il timer del warning è scaduto, ma solo se nessun boss è attualmente attivo.
    if (bossFightImminent && !activeMiniboss && !postBossCooldownActive) {
        bossWarningTimer -= dt;
        if (bossWarningTimer <= 0) {
            let bossJustSpawned = false; // Flag per sapere se eseguire la pulizia

            if (hasGlitchzillaSpawnedThisGame && !isGlitchzillaDefeatedThisGame) {
                const bossY = canvas.height - groundHeight - GLITCHZILLA_TARGET_HEIGHT;
                activeMiniboss = new Glitchzilla(canvas.width, bossY);
                bossJustSpawned = true;
            } else if (hasTrojanByteSpawnedThisGame && !isTrojanByteDefeatedThisGame) {
                const bossY = canvas.height - groundHeight - TROJAN_BYTE_TARGET_HEIGHT;
                activeMiniboss = new TrojanByte(canvas.width, bossY);
                bossJustSpawned = true;
            } else if (hasMissingNumberSpawnedThisGame && !isMissingNumberDefeatedThisGame) {
                const bossY = canvas.height - groundHeight - MISSING_NUMBER_TARGET_HEIGHT;
                activeMiniboss = new MissingNumber(canvas.width, bossY);
                bossJustSpawned = true;
            } else if (hasDunnoExeSpawnedThisGame && !isDunnoExeDefeatedThisGame) { // NUOVO
                // Per DUNNO.EXE, parte un po' più in alto (la sua posizione iniziale "flyingY")
                // Il valore `this.y` viene poi gestito dalla classe DunnoExe stessa per l'animazione di entrata
                activeMiniboss = new DunnoExe(canvas.width, canvas.height / 2 - DUNNO_EXE_TARGET_HEIGHT / 2); // Posizione iniziale a metà schermo in altezza
                bossJustSpawned = true;
            }
            // --- NUOVO BLOCCO DI PULIZIA ---
            // --- NUOVO BLOCCO DI PULIZIA AGGIORNATO ---
            if (bossJustSpawned) {
                console.log('Boss apparso! Pulizia dello schermo da nemici e proiettili minori.');
                // Rimuovi tutti i nemici normali
                enemies = [];
                fastEnemies = [];
                armoredEnemies = [];
                shootingEnemies = [];
                armoredShootingEnemies = [];
                toughBasicEnemies = [];
                dangerousFlyingEnemies = [];
                flyingEnemies = [];
                kamikazeFlyingEnemies = [];

                // AGGIORNATO: Rimuovi tutti i proiettili e i collezionabili dal loro unico array globale
                enemyProjectiles = [];

                // collectibles = []; // <-- QUESTO È IL CAMBIAMENTO FONDAMENTALE PER I COLLEZIONABILI

                bossFightImminent = false;
            }
        }
    }
    asyncDonkey.update(dt);
    if (companionManager) {
        // AGGIORNATO: Passa l'array `collectibles` al CompanionManager
        companionManager.update(dt, collectibles);
    }
    updateShootCooldown(dt);
    updateProjectiles(dt);
    updateObstacles(dt);
    updateAllEnemyTypes(dt);
    updatePowerUpItems(dt);

    spawnBitIfNeeded(dt);
    spawnExtraLifeIfNeeded(dt);
    spawnRichBitsIfNeeded(dt);
    spawnDataPackageIfNeeded(dt);
    spawnDigitalFruitIfNeeded(dt);

    // AGGIORNATO: Rimosso il codice che ricostruiva `collectibles` da array non esistenti.
    // L'array `collectibles` ora viene popolato direttamente dalle funzioni `spawn*IfNeeded`.
    // Il ciclo di aggiornamento e rimozione per `collectibles` è già presente.
    for (let i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].update(dt);
        if (collectibles[i].x + collectibles[i].width < 0) {
            collectibles.splice(i, 1);
        }
    }

    // Logica per il power-up Bit Vacuum (che attrae gli item)
    if (asyncDonkey.isBitVacuumActive) {
        const attractSpeed = 500;
        const attractRadius = 250;

        const attractCollectibles = (itemArray) => {
            for (let i = itemArray.length - 1; i >= 0; i--) {
                const item = itemArray[i];
                // Solo gli item che non sono già stati raccolti da Kernel e non sono power_up
                if (!item || item.type === 'power_up') continue;

                const dx = asyncDonkey.x + asyncDonkey.displayWidth / 2 - item.x;
                const dy = asyncDonkey.y + asyncDonkey.displayHeight / 2 - item.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < attractRadius) {
                    const angle = Math.atan2(dy, dx);
                    item.x += Math.cos(angle) * attractSpeed * dt;
                    item.y += Math.sin(angle) * attractSpeed * dt;
                }
            }
        };

        // Applica l'attrazione solo all'array `collectibles`
        attractCollectibles(collectibles);
    }

    // RIMOSSO: I vecchi cicli di aggiornamento e rimozione per `collectibleBits`, `extraLifeItems`, etc.,
    // sono stati sostituiti dal nuovo ciclo unificato sopra per `collectibles`.

    // [FEAT] Rimozione dei Kamikaze Flying Enemies quando vanno fuori schermo
    for (let i = kamikazeFlyingEnemies.length - 1; i >= 0; i--) {
        kamikazeFlyingEnemies[i].update(dt);
        if (kamikazeFlyingEnemies[i].x + kamikazeFlyingEnemies[i].width < 0 || kamikazeFlyingEnemies[i].y > canvas.height || kamikazeFlyingEnemies[i].y + kamikazeFlyingEnemies[i].height < 0) {
            kamikazeFlyingEnemies.splice(i, 1);
        }
    }


    // RIMOSSO: Loop individuali per `collectibleBits`, `extraLifeItems`, `richBitsItems`, `dataPackageItems`, `digitalFruitItems`
    // Questi array non sono più aggiornati qui, in quanto `collectibles` è l'unica fonte di verità.
    // Gli oggetti vengono rimossi da `collectibles` da `Kernel42.checkAndCollect` o da `checkCollisions`.

    // [FEAT] Rimozione dei Kamikaze Flying Enemies quando vanno fuori schermo
    for (let i = kamikazeFlyingEnemies.length - 1; i >= 0; i--) {
        kamikazeFlyingEnemies[i].update(dt);
        if (kamikazeFlyingEnemies[i].x + kamikazeFlyingEnemies[i].width < 0 || kamikazeFlyingEnemies[i].y > canvas.height || kamikazeFlyingEnemies[i].y + kamikazeFlyingEnemies[i].height < 0) {
            kamikazeFlyingEnemies.splice(i, 1);
        }
    }

    if (isRainRunActive) { // Modifica qui
        //console.log("DEBUG (updatePlaying): isRainRunActive is TRUE. gameRainParticles.length:", gameRainParticles.length);

        gameRainParticles.forEach(p => p.update(dt));

        thunderclapGameTimer += dt * 1000;
        if (thunderclapGameTimer >= nextThunderclapGameInterval) {
            console.log("DEBUG (updatePlaying): Tentativo di riprodurre il tuono. isRainRunActive:", isRainRunActive); // Modifica qui
            AudioManager.playSound(THUNDER_CLAP_SOUND_NAME, false, 0.7);
            isFlashingGame = true;
            flashGameTimer = FLASH_GAME_DURATION;
            thunderclapGameTimer = 0;
            nextThunderclapGameInterval = 3000 + Math.random() * 7000;
        }
    }
    // Gestione dell'effetto lampo in-game
    if (isFlashingGame) {
        flashGameTimer -= dt;
        if (flashGameTimer <= 0) {
            isFlashingGame = false;
        }
    }

    // --- Logica di Spawn dei Nemici Normali (Messa in pausa durante boss fight/warning) ---
    // Genera nemici normali solo se NON c'è un boss attivo, NON una battaglia imminente,
    // e NON c'è un cooldown post-boss.
    if (!activeMiniboss && !bossFightImminent && !postBossCooldownActive) {
        // Determina la fase di gioco corrente in base ai boss sconfitti
        let currentPhase = 0;
        if (isGlitchzillaDefeatedThisGame) {
            currentPhase = 1;
        }
        if (isTrojanByteDefeatedThisGame) {
            currentPhase = 2;
        }
        if (isMissingNumberDefeatedThisGame) {
            currentPhase = 3;
        }
        if (isDunnoExeDefeatedThisGame) {
            currentPhase = 4;
        }

        switch (currentPhase) {
            case 0: // Prima di Glitchzilla sconfitto
                spawnObstacleIfNeeded(dt);
                spawnEnemyBaseIfNeeded(dt); // enemyOne
                spawnFlyingEnemyIfNeeded(dt); // enemyFive (data packets)
                break;
            case 1: // Dopo Glitchzilla sconfitto, prima di Trojan_Byte sconfitto
                spawnObstacleIfNeeded(dt);
                spawnEnemyBaseIfNeeded(dt);
                spawnFlyingEnemyIfNeeded(dt);
                spawnFastEnemyIfNeeded(dt); // enemyTwo
                spawnArmoredEnemyIfNeeded(dt); // enemyThree
                spawnToughBasicEnemyIfNeeded(dt); // enemySeven
                break;
            case 2: // Dopo Trojan_Byte sconfitto, prima di Missing_Number sconfitto
                spawnObstacleIfNeeded(dt);
                spawnEnemyBaseIfNeeded(dt);
                spawnFlyingEnemyIfNeeded(dt);
                spawnFastEnemyIfNeeded(dt);
                spawnArmoredEnemyIfNeeded(dt);
                spawnToughBasicEnemyIfNeeded(dt);
                spawnShootingEnemyIfNeeded(dt); // enemyFour
                spawnArmoredShootingEnemyIfNeeded(dt); // enemySix
                spawnDangerousFlyingEnemyIfNeeded(dt); // dangerousFlyingEnemy
                break;
            case 3: // Dopo Missing_Number sconfitto, prima di DUNNO.EXE
                spawnObstacleIfNeeded(dt);
                spawnEnemyBaseIfNeeded(dt);
                spawnFlyingEnemyIfNeeded(dt);
                spawnFastEnemyIfNeeded(dt);
                spawnArmoredEnemyIfNeeded(dt);
                spawnShootingEnemyIfNeeded(dt);
                spawnArmoredShootingEnemyIfNeeded(dt);
                spawnToughBasicEnemyIfNeeded(dt);
                spawnDangerousFlyingEnemyIfNeeded(dt);
                spawnKamikazeFlyingEnemyIfNeeded(dt); // [FEAT] Spawna il nuovo nemico qui
                break;
            case 4: // Dopo DUNNO.EXE sconfitto (tutti i nemici al massimo e magari più aggressivi)
                spawnObstacleIfNeeded(dt);
                spawnEnemyBaseIfNeeded(dt);
                spawnFlyingEnemyIfNeeded(dt);
                spawnFastEnemyIfNeeded(dt);
                spawnArmoredEnemyIfNeeded(dt);
                spawnShootingEnemyIfNeeded(dt);
                spawnArmoredShootingEnemyIfNeeded(dt);
                spawnToughBasicEnemyIfNeeded(dt);
                spawnDangerousFlyingEnemyIfNeeded(dt);
                spawnKamikazeFlyingEnemyIfNeeded(dt); // [FEAT] Spawna anche qui
                gameSpeed += dt * 0.5; // Aumenta la velocità di gioco più rapidamente
                break;
        }
        spawnPowerUpAmbientIfNeeded(dt); // I power-up spawnano sempre
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].update(dt);
        if (floatingTexts[i].life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }

    checkCollisions();
    if (currentGameState === GAME_STATE.PLAYING) {
        score += dt * 10;
        gameSpeed += dt * 0.3;
        MissionManager.updateMissionManager(dt);
        MissionManager.updateMissionProgress('game_tick', { dt: dt, playerTookDamage: asyncDonkey.invulnerableTimer > 0 });
    }
}


function drawPlayingScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let bgColor = PALETTE.DARK_BACKGROUND;
    if (activeMiniboss && activeMiniboss.name && BOSS_THEMES[activeMiniboss.name]) {
        bgColor = BOSS_THEMES[activeMiniboss.name].backgroundColor;
    }
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Disegna la pioggia in-game
    if (isRainRunActive) { // Modifica qui
        gameRainParticles.forEach(p => p.draw());
    }

    drawTerminalBackgroundEffects();
    drawGround();
    if (asyncDonkey) asyncDonkey.draw();
    if (companionManager) {
        companionManager.draw(ctx);
    }
    drawObstacles();
    drawAllEnemyTypes();
    drawProjectiles();
    drawPowerUpItems();
    // AGGIORNATO: Disegna tutti i collezionabili dall'array `collectibles`
    collectibles.forEach(item => item.draw(ctx));

    // --- UI DI GIOCO (CON SPAZIATURA CORRETTA) ---
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '24px "Courier Prime", "Courier New", Courier, monospace';

    // 1. Disegna lo score (Y = 40)
    ctx.fillStyle = PALETTE.BRIGHT_GREEN_TEAL;
    ctx.fillText('Score: ' + Math.floor(score), 20, 40);

    // 2. Disegna il contatore dei Bit (Y = 70)
    ctx.fillStyle = PALETTE.TERMINAL_CYAN;
    ctx.fillText('Bits: ' + bits, 20, 70);

    // NUOVO: Disegna il contatore dei Digital Fruits
    if (gameStats.digitalFruitsCollected > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.fillText('Fruits: ' + gameStats.digitalFruitsCollected, 20, 100);
    }

    // 3. Disegna la vita, ma solo se è stata aumentata (Y = 100)
    // MODIFICATO: Sposta la vita più in basso se i frutti sono mostrati
    const integrityY = (gameStats.digitalFruitsCollected > 0) ? 130 : 100;
    if (asyncDonkey && asyncDonkey.maxHealth > 1) {
        ctx.fillStyle = '#f8f8f2';
        ctx.fillText('Integrity: ', 20, integrityY);
        for (let i = 0; i < asyncDonkey.health; i++) {
            ctx.fillStyle = '#ff5555';
            ctx.fillText('■', 170 + (i * 25), integrityY);
        }
    }

    // NUOVO: Disegna gli stati permanenti in alto a destra
    ctx.textAlign = 'right';
    ctx.font = '16px "Courier Prime", monospace';
    let statusY = 40;

    if (asyncDonkey) {
        // Stato "Running Deprecated Subroutines"
        const deprecatedText = `> RDS_ACTIVE = ${asyncDonkey.isReinforced ? 'TRUE' : 'FALSE'}`;
        ctx.fillStyle = asyncDonkey.isReinforced ? '#50fa7b' : '#6272a4';
        ctx.fillText(deprecatedText, canvas.width - 20, statusY);
        statusY += 22;

        // Stato Arma Permanente
        let weaponOsText = '> WEAPON_OS: default.kern';
        let weaponColor = '#6272a4';
        if (asyncDonkey.hasSlayerSubroutine) {
            weaponOsText = '> WEAPON_OS: SLAYER.SYS';
            weaponColor = '#ffb86c';
        } else if (asyncDonkey.hasCodeInjector) {
            weaponOsText = '> WEAPON_OS: INJECTOR.DLL';
            weaponColor = '#ff79c6';
        }
        ctx.fillStyle = weaponColor;
        ctx.fillText(weaponOsText, canvas.width - 20, statusY);
        statusY += 22;
    }

    // Disegna l'indicatore del power-up temporaneo (leggermente più in basso)
    if (asyncDonkey && asyncDonkey.activePowerUp && asyncDonkey.powerUpTimer > 0) {
        const powerUpName = (POWERUP_THEMATIC_NAMES[asyncDonkey.activePowerUp] || 'SYSTEM_BOOST').toUpperCase();
        const timerValue = Math.ceil(asyncDonkey.powerUpTimer);
        const textPrefix = `> ${powerUpName} [`;
        const textSuffix = `S]`;
        let currentX = canvas.width - 20;

        ctx.font = '20px "Courier Prime", monospace';

        ctx.fillStyle = '#f8f8f2';
        ctx.fillText(textSuffix, currentX, statusY);
        currentX -= ctx.measureText(textSuffix).width;

        const glowIntensity = (Math.sin(Date.now() / 150) + 1) / 2;
        const numberColor = '#50fa7b';
        ctx.shadowColor = numberColor;
        ctx.shadowBlur = 5 + glowIntensity * 10;
        ctx.fillStyle = numberColor;
        ctx.fillText(String(timerValue), currentX, statusY);
        currentX -= ctx.measureText(String(timerValue)).width;

        ctx.shadowBlur = 0;

        ctx.fillStyle = '#f8f8f2';
        ctx.fillText(textPrefix, currentX, statusY);
        statusY += 22;
    }

    // NUOVO: Sezione "Now Playing" in-game
    if (currentPlayingMusicInfo) {
        ctx.textAlign = 'right';
        ctx.font = '12px "Courier Prime", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';

        const trackText = `♪ "${currentPlayingMusicInfo.title}" by ${currentPlayingMusicInfo.artist}`;
        ctx.fillText(trackText, canvas.width - 20, statusY);
    }

    floatingTexts.forEach(text => text.draw(ctx));

    ctx.restore();

    // NUOVO: Disegna l'effetto lampo dello schermo
    if (isFlashingGame) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${flashGameTimer / FLASH_GAME_DURATION})`; // Opacità decrescente
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
}
function drawGameOverScreen() {
    // TODO: [Future Task] Implementare uno schermo nero o verde terminale senza la scritta "GAME OVER"
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Decommenta o ripristina la riga qui sotto per visualizzare "GAME OVER"
    drawGlitchText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80, 60, 'red', '#FF5555', '#AA0000', 6, 3); // <-- DECOMMENTA/RIPRISTINA QUESTA RIGA
    drawGlitchText(
        'Punteggio Finale: ' + Math.floor(finalScore),
        canvas.width / 2,
        canvas.height / 2 - 20, // Spostato leggermente più in alto per lasciare spazio ai pulsanti
        32,
        PALETTE.BRIGHT_GREEN_TEAL,
        PALETTE.MEDIUM_TEAL,
        PALETTE.DARK_TEAL_BLUE,
        4,
        2
    );

    // Rimosso il testo "Premi INVIO per Riprovare" gestito dai nuovi pulsanti
    /*
    if (
        !shouldShowDonkeyScoreInput(finalScore) &&
        (!isTouchDevice || !mobileStartButton || mobileStartButton.style.display === 'none')
    ) {
        drawGlitchText(
            'Premi INVIO per Riprovare',
            canvas.width / 2,
            canvas.height / 2 + 60,
            24,
            PALETTE.BRIGHT_TEAL,
            PALETTE.MEDIUM_PURPLE,
            PALETTE.DARK_TEAL_BLUE,
            3,
            1
        );
    }
    */
}

function gameLoop(timestamp) {
    if (!resourcesInitialized) {
        gameLoopRequestId = requestAnimationFrame(gameLoop);
        return;
    }
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // --- INIZIO LOG DI DEBUG PER deltaTime ---
    if (isNaN(deltaTime)) {
        console.warn("CRITICAL: deltaTime is NaN!", { timestamp: timestamp, lastTime: lastTime, calculatedDt: deltaTime });
    }
    // --- FINE LOG DI DEBUG ---

    switch (currentGameState) {
        case GAME_STATE.MENU:
            // Non fare NIENTE qui. Il loop continua a girare ma non disegna nulla del gioco.
            break;
        case GAME_STATE.PLAYING:
            updatePlaying(deltaTime);
            drawPlayingScreen();
            break;
        case GAME_STATE.GAME_OVER:
            drawGameOverScreen();
            break;
        case GAME_STATE.PAUSE: // NUOVO: Stato di pausa
            // Non aggiornare la logica di gioco, disegna solo lo schermo corrente o una schermata statica.
            drawPlayingScreen(); // Disegna l'ultimo frame del gioco (opzionale, potresti disegnare una schermata statica)
            // L'interfaccia della modale di pausa è un elemento HTML che è gestito separatamente via display:flex.
            break;
    }
    gameLoopRequestId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    if (gameLoopRequestId) {
        cancelAnimationFrame(gameLoopRequestId);
    }
    lastTime = performance.now();
    gameLoopRequestId = requestAnimationFrame(gameLoop);
    console.log('Game loop avviato.');
}

let isFullscreenActive = false;

async function toggleFullscreen() {
    if (isIPhone) {
        console.log(
            'toggleFullscreen chiamato su iPhone, ma il pulsante dovrebbe essere nascosto. Nessuna azione intrapresa.'
        );
        return;
    }

    if (!gameContainer) return;
    const isCurrentlyFullscreen =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

    if (!isCurrentlyFullscreen) {
        try {
            if (gameContainer.requestFullscreen) {
                await gameContainer.requestFullscreen();
            } else if (gameContainer.webkitRequestFullscreen) {
                await gameContainer.webkitRequestFullscreen();
            } else if (gameContainer.msRequestFullscreen) {
                await gameContainer.msRequestFullscreen();
            }
        } catch (err) {
            console.error(`Errore attivazione fullscreen: ${err.message} (${err.name})`);
            showToast('Impossibile attivare la modalità fullscreen.', 'error');
        }
    } else {
        try {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
            else if (document.msExitFullscreen) await document.msExitFullscreen();
        } catch (err) {
            console.error(`Errore uscita fullscreen: ${err.message} (${err.name})`);
        }
    }
}

function handleFullscreenChange() {
    isFullscreenActive = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );

    if (isFullscreenActive) {
        document.body.classList.add('game-fullscreen-active');
        if (
            isTouchDevice &&
            screen.orientation &&
            (screen.orientation.type.startsWith('landscape') || window.innerWidth > window.innerHeight)
        ) {
            document.body.classList.add('game-fullscreen-landscape');
        } else {
            document.body.classList.remove('game-fullscreen-landscape');
        }
        if (fullscreenButton) fullscreenButton.textContent = 'ESCI';
    } else {
        document.body.classList.remove('game-fullscreen-active');
        document.body.classList.remove('game-fullscreen-landscape');
        if (fullscreenButton) fullscreenButton.textContent = 'FULLSCREEN';
    }
    checkAndDisplayOrientationPrompt();
}


/**
 * Helper function to attach all event listeners.
 */
async function attachEventListeners() { // Resa la funzione async
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ControlLeft' || e.key === 'x' || e.key === 'X' || e.key === 'ControlRight') {
            isShootingHeld = false;
        }
    });

    window.addEventListener('touchend', (e) => {
        e.preventDefault(); // Aggiunto per prevenire lo zoom su doppio tap
        // Controlla se uno dei tocchi rilasciati era nella parte destra dello schermo
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].clientX >= window.innerWidth / 2) {
                isShootingHeld = false;
                break;
            }
        }
    });

    if (screen.orientation) {
        screen.orientation.addEventListener('change', () => {
            if (isFullscreenActive) {
                if (screen.orientation.type.startsWith('landscape')) {
                    document.body.classList.add('game-fullscreen-landscape');
                } else {
                    document.body.classList.remove('game-fullscreen-landscape');
                }
            }
        });
    }

    // AZIONE 1.2 e 1.4:  il nuovo listener per il tocco
    // Event Listener per il gameContainer, che gestisce JUMP e SHOOT dalle aree di tocco
    if (gameContainer) {
        gameContainer.addEventListener('touchstart', (e) => {
            // Esegui la logica di gioco SOLO se siamo nello stato PLAYING
            if (currentGameState === GAME_STATE.PLAYING && asyncDonkey) {
                // CHIAVE DELLA CORREZIONE:
                // Annulla il comportamento di default SOLO durante il gioco attivo.
                // Questo permette ai pulsanti del menu di Game Over di ricevere i click.
                e.preventDefault(); // Mantiene il preventDefault qui per i controlli di gioco

                // Itera su tutti i tocchi attivi
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];

                    // Controlla se il tocco è a sinistra o a destra
                    if (touch.clientX < window.innerWidth / 2) {
                        // Tocco a SINISTRA -> SALTO
                        asyncDonkey.jump();
                        if (touchOverlayLeft && touchOverlayLeft.style.opacity !== '0') {
                            touchOverlayLeft.style.opacity = '0';
                        }
                    } else {
                        // Tocco a DESTRA -> SPARO
                        isShootingHeld = true;
                        if (asyncDonkey && !asyncDonkey.isMachineLanguageActive) {
                            asyncDonkey.shoot();
                        }
                        if (touchOverlayRight && touchOverlayRight.style.opacity !== '0') {
                            touchOverlayRight.style.opacity = '0';
                        }
                    }
                }
            }
        }, { passive: false });
    }

    if (fullscreenButton) {
        if (!isIPhone) {
            fullscreenButton.addEventListener('click', toggleFullscreen);
            console.log('Event listener per fullscreenButton aggiunto (non è un iPhone).');
        } else {
            console.log('Event listener per fullscreenButton NON aggiunto (è un iPhone).');
        }
    }

    if (restartGameBtnDonkey) {
         restartGameBtnDonkey.addEventListener('click', () => {
            if (scoreInputContainerDonkey) scoreInputContainerDonkey.style.display = 'none';
            // NUOVO: Ferma la musica corrente (es. game over music) subito al click
            AudioManager.stopMusic();
            launchGame();
         });
     }

    // Nuovo: Event Listener per il pulsante "Torna al Menu Principale"
    if (mainMenuBtn) {
    mainMenuBtn.addEventListener('click', () => { // Corretto da 'mainMenu' a 'mainMenuBtn'
        // Chiama la funzione globale esposta da main.js
        if (window.returnToMainMenu) {
            window.returnToMainMenu();
        }
    });
}


    // Event Listener for the mobile Start/Restart button
    if (mobileStartButton) {
        mobileStartButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentGameState === GAME_STATE.MENU || currentGameState === GAME_STATE.GAME_OVER) {
                launchGame();
            }
        });
    }

    // --- Event Listeners for Credits Modal ---
    // Rimozione completa di creditsIconBtn (già fatto in index.html)
    // Non servono più riferimenti o event listener per creditsIconBtn.

    // Questi event listener restano per la modale crediti, che può essere aperta dal menu principale
    // tramite glitchpedia-btn, non più da un'icona in gioco.
    if (closeCreditsModalBtn && creditsModal) {
        closeCreditsModalBtn.addEventListener('click', () => {
            creditsModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == creditsModal) {
            creditsModal.style.display = 'none';
        }
    });

    // --- Logic for Expandable Info Cards (Accordion) ---
    if (accordionHeaders.length > 0) {
        accordionHeaders.forEach((header) => {
            header.addEventListener('click', function () {
                const currentlyActiveHeader = document.querySelector('.accordion-header.active');
                if (currentlyActiveHeader && currentlyActiveHeader !== this) {
                    currentlyActiveHeader.classList.remove('active');
                    const activePanel = currentlyActiveHeader.nextElementSibling;
                    activePanel.style.maxHeight = null;
                    activePanel.classList.remove('open');
                }

                this.classList.toggle('active');
                const panel = this.nextElementSibling;
                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                    panel.classList.remove('open');
                } else {
                    panel.classList.add('open');
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                }
            });
        });
    }

    if (scrollToTutorialLink && accordionHeaders.length > 0) {
        scrollToTutorialLink.addEventListener('click', function (event) {
            event.preventDefault();

            const accordionContainer = document.getElementById('gameInfoAccordion');
            if (accordionContainer) {
                accordionContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            const firstHeader = accordionHeaders[0];
            const firstPanel = firstHeader.nextElementSibling;

            if (!firstHeader.classList.contains('active')) {
                const currentlyActiveHeader = document.querySelector('.accordion-header.active');
                if (currentlyActiveHeader) {
                    currentlyActiveHeader.classList.remove('active');
                    const activePanel = currentlyActiveHeader.nextElementSibling;
                    activePanel.style.maxHeight = null;
                    activePanel.classList.remove('open');
                }

                firstHeader.classList.add('active');
                firstPanel.classList.add('open');
                firstPanel.style.maxHeight = firstPanel.scrollHeight + 'px';
            }
        });
    }

    if (dismissOrientationPromptBtn && orientationPromptEl) {
        dismissOrientationPromptBtn.addEventListener('click', () => {
            orientationPromptEl.style.display = 'none';
            orientationPromptDismissedSession = true;
            console.log('Prompt orientamento chiuso dall utente per questa sessione.');
        });
    }

    // if (window.matchMedia('(orientation: portrait)').addEventListener) { // Rimuovi o commenta questa riga
    //     window.matchMedia('(orientation: portrait)').addEventListener('change', checkAndDisplayOrientationPrompt); // Rimuovi o commenta questa riga
    // } else if (window.addEventListener) { // Rimuovi o commenta questa riga
    //     window.addEventListener('orientationchange', checkAndDisplayOrientationPrompt); // Rimuovi o commenta questa riga
    // }

    // NUOVO: Event Listener per il pulsante di Pausa
    if (pauseButton) {
        pauseButton.addEventListener('click', () => {
            pauseGame();
        });
        // NUOVO: Aggiungi un listener touchstart per impedire la propagazione
        pauseButton.addEventListener('touchstart', (e) => {
            e.stopPropagation(); // Ferma l'evento qui, non lo propaga al gameContainer
            e.preventDefault();  // Previene il default, es. scroll involontario
            pauseGame(); // Chiama la funzione di pausa
        }, { passive: false });
    }

    // NUOVO: Event Listener per i pulsanti della modale di pausa
    if (resumeGameBtn) {
        resumeGameBtn.addEventListener('click', resumeGame);
    }
    if (restartGameFromPauseBtn) {
        restartGameFromPauseBtn.addEventListener('click', () => {
            if (pauseModal) pauseModal.style.display = 'none'; // Nasconde la modale
            if (pauseButton) pauseButton.style.display = 'block'; // Ripristina il pulsante di pausa
            launchGame(); // Riavvia il gioco
        });
    }
    if (mainMenuFromPauseBtn) {
        mainMenuFromPauseBtn.addEventListener('click', () => {
            if (pauseModal) pauseModal.style.display = 'none'; // Nasconde la modale
            if (pauseButton) pauseButton.style.display = 'block'; // Ripristina il pulsante di pausa
            if (window.returnToMainMenu) {
                window.returnToMainMenu();
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        // Questa logica è ora più semplice
        if (!resourcesInitialized) return;
        if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
            AudioManager.audioContext.resume().catch((err) => console.error('Error resuming AudioContext:', err));
        }
        switch (currentGameState) {
            // case 'MENU':
            //     if (e.key === 'Enter') {
            //         document.getElementById('start-game-btn').click();
            //     }
            //     break;
            case 'PLAYING':
                if (e.code === 'Space' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    asyncDonkey.jump();
                }
                if (e.code === 'ControlLeft' || e.key === 'x' || e.key === 'X' || e.key === 'ControlRight') {
                    e.preventDefault();
                    if (!isShootingHeld) {
                        isShootingHeld = true;
                        if (!asyncDonkey.isMachineLanguageActive) {
                            asyncDonkey.shoot();
                        }
                    }
                }
                // NUOVO: Tasto ESC per la pausa
                if (e.key === 'Escape') {
                    pauseGame();
                }
                break;
            case 'GAME_OVER':
                if (
                    e.key === 'Enter' &&
                    (!scoreInputContainerDonkey || scoreInputContainerDonkey.style.display === 'none')
                ) {
                    launchGame();
                }
                break;
            case 'PAUSE': // NUOVO: Gestione input in pausa
                if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { // Torna al gioco con Esc o P
                    resumeGame();
                }
                if (e.key === 'r' || e.key === 'R') { // Riavvia dalla pausa con R
                    if (pauseModal) pauseModal.style.display = 'none';
                    if (pauseButton) pauseButton.style.display = 'block';
                    launchGame();
                }
                if (e.key === 'm' || e.key === 'M') { // Torna al menu principale dalla pausa con M
                    if (pauseModal) pauseModal.style.display = 'none';
                    if (pauseButton) pauseButton.style.display = 'block';
                    if (window.returnToMainMenu) {
                        window.returnToMainMenu();
                    }
                }
                break;
        }
    });
}
// Remove auto-executing calls from here. These will be triggered from index.html or loader.js
