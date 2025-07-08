// www/js/missionManager.js

import { showToast } from './toastNotifications.js';
// Rimosse le importazioni di db e auth da main.js in quanto non più necessarie in modalità offline.
// import { db, auth } from './main.js'; 
import * as AudioManager from './audioManager.js'; // Importa AudioManager


// Definizione dei tipi di missione
const MISSION_TYPES = {
    COLLECT_BITS: 'collect_bits',
    DEFEAT_ENEMIES: 'defeat_enemies',
    SURVIVE_TIME: 'survive_time',
    DONT_TAKE_DAMAGE: 'dont_take_damage',
    JUMP_X_TIMES: 'jump_x_times',
    SHOOT_X_TIMES: 'shoot_x_times',
    COLLECT_POWERUPS: 'collect_powerups',   // NUOVO
    COLLECT_DATAPACKETS: 'collect_datapackets', // NUOVO
};
// Pool di missioni con i loro obiettivi e ricompense
const MISSION_POOL = [
    {
        id: 'mission_collect_50_bits',
        type: MISSION_TYPES.COLLECT_BITS,
        objective: 50,
        reward: 200,
        description: 'COLLECT 50x BIT_DATA.',
        onStartText: 'DATA_ACQUISITION. Objective: COLLECT 50x BIT_DATA.',
        onCompleteText: 'TASK_COMPLETED: DATA_ACQUISITION. REWARD: {reward} BIT_DATA.',
    },
    {
        id: 'mission_defeat_10_enemies',
        type: MISSION_TYPES.DEFEAT_ENEMIES,
        objective: 10,
        reward: 300,
        description: 'ELIMINATE 10x HOSTILE_PROCESS.',
        onStartText: 'THREAT_NEUTRALIZATION. Objective: ELIMINATE 10x HOSTILE_PROCESS.',
        onCompleteText: 'TASK_COMPLETED: THREAT_NEUTRALIZATION. REWARD: {reward} BIT_DATA.',
    },
    {
        id: 'mission_survive_60_seconds',
        type: MISSION_TYPES.SURVIVE_TIME,
        objective: 60, // secondi
        reward: 400,
        description: 'MAINTAIN SYS_UPTIME for 60 SECONDS.',
        onStartText: 'UPTIME_VERIFICATION. Objective: MAINTAIN SYSTEM_UPTIME 60s.',
        onCompleteText: 'TASK_COMPLETED: UPTIME_VERIFICATION. REWARD: {reward} BIT_DATA.',
    },
    {
        id: 'mission_dont_take_damage_for_30_seconds',
        type: MISSION_TYPES.DONT_TAKE_DAMAGE,
        objective: 30, // secondi
        reward: 500,
        description: 'Avoid [DAMAGED] status for 30s.',
        onStartText: 'INTEGRITY_AUDIT. Objective: AVOID [DAMAGED] STATUS for 30s.',
        onCompleteText: 'TASK_COMPLETED: INTEGRITY_AUDIT. REWARD: {reward} BIT_DATA.',
    },
    {
        id: 'mission_jump_20_times',
        type: MISSION_TYPES.JUMP_X_TIMES,
        objective: 20,
        reward: 150,
        description: 'EXECUTE 20x JUMP_PROTOCOL.',
        onStartText: 'PROTOCOL_BYPASS. Objective: EXECUTE 20x JUMP_PROTOCOL.',
        onCompleteText: 'TASK_COMPLETED: PROTOCOL_BYPASS. REWARD: {reward} BIT_DATA.',
    },
    {
        id: 'mission_shoot_50_times',
        type: MISSION_TYPES.SHOOT_X_TIMES,
        objective: 50,
        reward: 250,
        description: 'INITIATE 50x FIRE_COMMAND.',
        onStartText: 'FIRING_SEQUENCE. Objective: INITIATE 50x FIRE_COMMAND.',
        onCompleteText: 'TASK_COMPLETED: FIRING_SEQUENCE. REWARD: {reward} BIT_DATA.',
    },
    {
        id: 'mission_collect_5_powerups', // Nuovo ID
        type: MISSION_TYPES.COLLECT_POWERUPS,
        objective: 5,
        reward: 350,
        description: 'COLLECT 5x SYSTEM_BOOSTS.',
        onStartText: 'RESOURCE_HARVEST. Objective: COLLECT 5x SYSTEM_BOOSTS.',
        onCompleteText: 'TASK_COMPLETED: RESOURCE_HARVEST. REWARD: {reward} BIT_DATA.',
    },
    {
        id: 'mission_collect_3_datapackets', // Nuovo ID
        type: MISSION_TYPES.COLLECT_DATAPACKETS,
        objective: 3,
        reward: 450,
        description: 'RETRIEVE 3x DATA_C.',
        onStartText: 'DATA_RETRIEVAL. Objective: RETRIEVE 3x DATA_.',
        onCompleteText: 'TASK_COMPLETED: DATA_RETRIEVAL. REWARD: {reward} BIT_DATA.',
    },
];

let currentMission = null;
let missionProgress = 0;
let missionTimer = 0;
let missionActive = false;
let missionCooldownTimer = 0;
const MISSION_COOLDOWN_DURATION = 10; // Secondi tra la fine di una missione e l'inizio di una nuova

// Variabili per tracciare lo stato di gioco per le missioni
let enemiesDefeatedInMission = 0;
let bitsCollectedInMission = 0;
let playerJumpsInMission = 0;
let playerShotsInMission = 0;
let playerTookDamageThisMission = false; // Flag per la missione "non subire danni"
let powerupsCollectedInMission = 0;
let datapacketsCollectedInMission = 0;

// Riferimento all'elemento HTML per la UI della missione
let missionUIElement = null;

export function initMissions() {
    console.log('[MissionManager] Inizializzazione sistema missioni.');
    missionUIElement = document.getElementById('mission-display');
    if (!missionUIElement) {
        console.warn('[MissionManager] Elemento #mission-display non trovato. La UI delle missioni non sarà visibile.');
    }
    
}

export function resetMissions() {
    console.log('[MissionManager] Reset missioni.');
    currentMission = null;
    missionProgress = 0;
    missionTimer = 0;
    missionActive = false;
    missionCooldownTimer = 0;

    enemiesDefeatedInMission = 0;
    bitsCollectedInMission = 0;
    playerJumpsInMission = 0;
    playerShotsInMission = 0;
    playerTookDamageThisMission = false;

    // NUOVO: Resetta i contatori per le nuove missioni
    powerupsCollectedInMission = 0;
    datapacketsCollectedInMission = 0;

    updateMissionDisplay(); // Pulisce la UI
}

function generateNewMission() {
    if (missionActive || missionCooldownTimer > 0) return;

    // Filtra missioni già completate in questa sessione o quelle non adatte a essere ripetute
    // Per ora, le missioni sono ripetibili, ma qui si potrebbe aggiungere logica di non-ripetibilità
    const availableMissions = MISSION_POOL; 

    if (availableMissions.length === 0) {
        console.log('[MissionManager] Nessuna missione disponibile da generare.');
        return;
    }

    const randomIndex = Math.floor(Math.random() * availableMissions.length);
    currentMission = availableMissions[randomIndex];
    missionProgress = 0;
    missionTimer = 0;
    missionActive = true;
    playerTookDamageThisMission = false; // Resetta questo flag per la nuova missione

    const startText = currentMission.onStartText.replace('{reward}', currentMission.reward);
    //showToast(startText, 'info', 5000);
    console.log(`[MissionManager] Nuova missione generata: ${currentMission.description}`);
    updateMissionDisplay();
}

export function updateMissionProgress(eventType, data = {}) {
    if (!missionActive || !currentMission) return;

    let progressMade = false;

    switch (eventType) {
        case MISSION_TYPES.COLLECT_BITS:
            if (currentMission.type === MISSION_TYPES.COLLECT_BITS) {
                bitsCollectedInMission += (data.value || 0);
                missionProgress = bitsCollectedInMission;
                progressMade = true;
            }
            break;
        case MISSION_TYPES.DEFEAT_ENEMIES:
            if (currentMission.type === MISSION_TYPES.DEFEAT_ENEMIES) {
                enemiesDefeatedInMission += 1;
                missionProgress = enemiesDefeatedInMission;
                progressMade = true;
            }
            break;
        case 'game_tick': // Chiamato ogni frame da donkeyRunner
            missionTimer += data.dt;
            if (currentMission.type === MISSION_TYPES.SURVIVE_TIME) {
                missionProgress = Math.floor(missionTimer);
                progressMade = true;
            }
            if (currentMission.type === MISSION_TYPES.DONT_TAKE_DAMAGE) {
                // Se il giocatore subisce danno, la missione fallisce immediatamente per questo tipo
                if (data.playerTookDamage) {
                    playerTookDamageThisMission = true; // Imposta il flag, la missione sarà segnata come fallita
                }
                missionProgress = Math.floor(missionTimer); // Continua a tracciare il tempo
                progressMade = true;
            }
            break;
        case MISSION_TYPES.JUMP_X_TIMES:
            if (currentMission.type === MISSION_TYPES.JUMP_X_TIMES) {
                playerJumpsInMission += 1;
                missionProgress = playerJumpsInMission;
                progressMade = true;
            }
            break;
        case MISSION_TYPES.SHOOT_X_TIMES:
            if (currentMission.type === MISSION_TYPES.SHOOT_X_TIMES) {
                playerShotsInMission += 1;
                missionProgress = playerShotsInMission;
                progressMade = true;
            }
            break;
        // NUOVO: Gestione eventi per le nuove missioni
        // Gestione eventi per le nuove missioni
        case MISSION_TYPES.COLLECT_POWERUPS:
            if (currentMission.type === MISSION_TYPES.COLLECT_POWERUPS) {
                powerupsCollectedInMission += 1;
                missionProgress = powerupsCollectedInMission;
                progressMade = true;
            }
            break;
        case MISSION_TYPES.COLLECT_DATAPACKETS:
            if (currentMission.type === MISSION_TYPES.COLLECT_DATAPACKETS) {
                datapacketsCollectedInMission += 1; // Correctly track datapackets
                missionProgress = datapacketsCollectedInMission;
                progressMade = true;
            }
            break;
    }

    if (progressMade) {
        checkMissionCompletion();
        updateMissionDisplay();
    }
}

function checkMissionCompletion() {
    if (!currentMission || !missionActive) return;

    let completed = false;
    let failed = false;

    switch (currentMission.type) {
        case MISSION_TYPES.COLLECT_BITS:
            if (bitsCollectedInMission >= currentMission.objective) completed = true;
            break;
        case MISSION_TYPES.DEFEAT_ENEMIES:
            if (enemiesDefeatedInMission >= currentMission.objective) completed = true;
            break;
        case MISSION_TYPES.SURVIVE_TIME:
            if (missionTimer >= currentMission.objective) completed = true;
            break;
        case MISSION_TYPES.DONT_TAKE_DAMAGE:
            if (playerTookDamageThisMission) failed = true; // Fallita se ha subito danno
            else if (missionTimer >= currentMission.objective) completed = true; // Altrimenti completata per tempo
            break;
        case MISSION_TYPES.JUMP_X_TIMES:
            if (playerJumpsInMission >= currentMission.objective) completed = true;
            break;
        case MISSION_TYPES.SHOOT_X_TIMES:
            if (playerShotsInMission >= currentMission.objective) completed = true;
            break;
        // Gestione eventi per le nuove missioni
       case MISSION_TYPES.COLLECT_POWERUPS:
            if (powerupsCollectedInMission >= currentMission.objective) completed = true;
            break;
        case MISSION_TYPES.COLLECT_DATAPACKETS:
            if (datapacketsCollectedInMission >= currentMission.objective) completed = true; // Correctly check datapackets
            break;
    }

    if (completed) {
        completeMission();
    } else if (failed) {
        failMission();
    }
}

function completeMission() {
    if (!currentMission) return;

    missionActive = false;
    const reward = currentMission.reward;

    // Assegna la ricompensa (aggiungendo bit al giocatore)
    if (window.addGameBits) {
        window.addGameBits(reward);
    } else {
        console.warn('[MissionManager] Impossibile aggiungere bit. window.addGameBits non definita.');
    }

    // NUOVO: Incrementa il contatore delle missioni completate
    if (window.incrementMissionsCompleted) {
        window.incrementMissionsCompleted();
    } else {
        console.warn('[MissionManager] Impossibile incrementare il contatore missioni. window.incrementMissionsCompleted non definita.');
    }

    const completeText = currentMission.onCompleteText.replace('{reward}', reward);
    //showToast(completeText, 'success', 5000);
    AudioManager.playSound('sfx_mission_complete');
    console.log(`[MissionManager] Missione completata: ${currentMission.description}. Ricompensa: ${reward} Bit.`);
    
    currentMission = null;
    missionCooldownTimer = MISSION_COOLDOWN_DURATION;

    updateMissionDisplay();
}

function failMission() {
    if (!currentMission) return;

    missionActive = false;
    //showToast(`MISSIONE FALLITA: ${currentMission.description}`, 'error', 3000);
    AudioManager.playSound('sfx_mission_failed');
    console.log(`[MissionManager] Missione fallita: ${currentMission.description}`);
    
    currentMission = null; // Rimuove la missione fallita
    missionCooldownTimer = MISSION_COOLDOWN_DURATION; // Avvia il cooldown

    updateMissionDisplay(); // Aggiorna la UI
}

export function updateMissionManager(dt) {
    if (!missionActive && missionCooldownTimer > 0) {
        missionCooldownTimer -= dt;
        // NUOVO: Chiama updateMissionDisplay per aggiornare il contatore a schermo
        updateMissionDisplay(); 
        if (missionCooldownTimer <= 0) {
            missionCooldownTimer = 0;
            generateNewMission(); // Genera una nuova missione dopo il cooldown
        }
    } else if (missionActive && currentMission) {
        // Aggiorna la missione basata sul tempo, se necessario
        if (currentMission.type === MISSION_TYPES.SURVIVE_TIME || currentMission.type === MISSION_TYPES.DONT_TAKE_DAMAGE) {
            updateMissionProgress('game_tick', { dt: dt, playerTookDamage: playerTookDamageThisMission });
        }
    }
}
export function updateMissionDisplay() {
    if (!missionUIElement) {
        console.warn('[MissionManager] missionUIElement è null. Impossibile aggiornare la UI della missione.');
        return;
    }

    //console.log('[MissionManager] updateMissionDisplay chiamato. currentMission:', currentMission, 'missionCooldownTimer:', missionCooldownTimer);

    if (!currentMission && missionCooldownTimer === 0) {
        //console.log('[MissionManager] updateMissionDisplay: Nessuna missione attiva e nessun cooldown. Nascondo UI.');
        missionUIElement.innerHTML = '';
        missionUIElement.style.display = 'none';
        missionUIElement.style.visibility = 'hidden';
        return;
    }

    //console.log('[MissionManager] updateMissionDisplay: Missione attiva o cooldown. Mostro UI.');
    missionUIElement.style.display = 'block';
    missionUIElement.style.visibility = 'visible';
    
    
    let displayHtml = '';

    if (currentMission) {
        let progressText = '';
        switch (currentMission.type) {
            case MISSION_TYPES.COLLECT_BITS:
                progressText = `Bit: ${missionProgress}/${currentMission.objective}`;
                break;
            case MISSION_TYPES.DEFEAT_ENEMIES:
                progressText = `Enemies: ${missionProgress}/${currentMission.objective}`;
                break;
            case MISSION_TYPES.SURVIVE_TIME:
                progressText = `D_Time: ${Math.floor(missionProgress)}/${currentMission.objective}s`;
                break;
            case MISSION_TYPES.DONT_TAKE_DAMAGE:
                if (playerTookDamageThisMission) {
                    progressText = '<span style="color: red;">FALLITA! Danno Subito!</span>';
                } else {
                    progressText = `Tempo: ${Math.floor(missionProgress)}/${currentMission.objective}s`;
                }
                break;
            case MISSION_TYPES.JUMP_X_TIMES:
                progressText = `Salti: ${missionProgress}/${currentMission.objective}`;
                break;
            case MISSION_TYPES.SHOOT_X_TIMES:
                progressText = `Colpi: ${missionProgress}/${currentMission.objective}`;
                break;
            default:
                progressText = `Progresso: ${missionProgress}/${currentMission.objective}`;
                break;
        }

        displayHtml = `
            <span class="mission-title">CURRENT_TASK:</span>
            <span class="mission-desc">${currentMission.description}</span>
            <span class="mission-progress">${progressText}</span>
        `;
    } else if (missionCooldownTimer > 0) {
        displayHtml = `
            <span class="mission-title">SERCHING(newTask):</span>
            <span class="mission-desc">Next task in ${Math.ceil(missionCooldownTimer)}s</span>
            <span class="mission-progress"></span>
        `;
    }

    missionUIElement.innerHTML = displayHtml;
}

export function startGameMissions() {
    // Rimuovi questa riga. resetMissions() viene già chiamato da donkeyRunner.js nel resetGame().
    // resetMissions(); // Assicurati che lo stato sia pulito 
    generateNewMission(); // Avvia la prima missione
    updateMissionDisplay(); // Chiama esplicitamente per assicurare l'aggiornamento UI
}


// Da chiamare quando il giocatore subisce un danno, per la missione 'DONT_TAKE_DAMAGE'
export function notifyPlayerTookDamage() {
    playerTookDamageThisMission = true;
    // Non chiamare updateMissionProgress qui, perché 'game_tick' lo fa già
    // e checkMissionCompletion verrà chiamato di conseguenza.
}