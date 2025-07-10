// www/js/badgeManager.js

// Importa currentUserData da main.js
import { currentUserData } from './main.js';
// Rimuovere la seguente linea:
// import { doc, getDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let badgeDefinitionsCache = {};

// NUOVO: Definizione dei BADGE DI GIOCO A LIVELLI per il frontend
// Questa è una versione semplificata e duplicata da functions/index.js per permettere
// al frontend di calcolare il progresso e i livelli successivi.
export const FRONTEND_BADGE_TIERS = {
    SCORE_MASTER: {
        baseId: 'score', // Corresponds to backend
        metric: 'highestScore',
        tiers: [
            { level: 1, threshold: 500, id: 'score_rookie', name: 'Score Initiate', description: 'Reach 500 points in a single run.', icon: 'images/badges/score_master_1.png' },
            { level: 2, threshold: 2500, id: 'score_veteran', name: 'Score Enthusiast', description: 'Reach 2500 points in a single run.', icon: 'images/badges/score_master_2.png' },
            { level: 3, threshold: 5000, id: 'score_elite', name: 'Score Artisan', description: 'Reach 5000 points in a single run.', icon: 'images/badges/score_master_3.png' },
            { level: 4, threshold: 10000, id: 'score_master', name: 'Score Grandmaster', description: 'Reach 10000 points in a single run.', icon: 'images/badges/score_master_4.png' },
            { level: 5, threshold: 25000, id: 'score_legend', name: 'Score Legend', description: 'Reach 25000 points in a single run and unlock a special skin!', unlocksSkin: 'skin_donkey_score_legend', icon: 'images/badges/score_master_5.png' }
        ]
    },
    BUG_HUNTER: {
        baseId: 'enemiesDefeated', // Corresponds to backend
        metric: 'enemiesDefeated',
        tiers: [
            { level: 1, threshold: 10, id: 'bug_hunter_rookie', name: 'Bug Scout', description: 'Debug 10 enemies in a single run.', icon: 'images/badges/bug_hunter_1.png' },
            { level: 2, threshold: 50, id: 'bug_hunter_veteran', name: 'Bug Fixer', description: 'Debug 50 enemies in a single run.', icon: 'images/badges/bug_hunter_2.png' },
            { level: 3, threshold: 100, id: 'bug_hunter_expert', name: 'Bug Exterminator', description: 'Debug 100 enemies in a single run.', icon: 'images/badges/bug_hunter_3.png' },
            { level: 4, threshold: 200, id: 'bug_hunter_master', name: 'Bug Hunter Elite', description: 'Debug 200 enemies in a single run.', icon: 'images/badges/bug_hunter_4.png' },
            { level: 5, threshold: 350, id: 'bug_hunter_elite', name: 'Bug Whisperer', description: 'Debug 350 enemies in a single run and unlock a special skin!', unlocksSkin: 'skin_donkey_bug_whisperer', icon: 'images/badges/bug_hunter_5.png' }
        ]
    },
    JUMPER: {
        baseId: 'jumps', // Corresponds to backend
        metric: 'jumps',
        tiers: [
            { level: 1, threshold: 50, id: 'jumper_rookie', name: 'Jumper Novice', description: 'Jump 500 times in a single run.', icon: 'images/badges/jumper_1.png' },
            { level: 2, threshold: 250, id: 'jumper_veteran', name: 'Jumper Adept', description: 'Jump 2500 times in a single run.', icon: 'images/badges/jumper_2.png' },
            { level: 3, threshold: 500, id: 'jumper_elite', name: 'Jumper Master', description: 'Jump 5000 times in a single run.', icon: 'images/badges/jumper_3.png' },
            { level: 4, threshold: 1000, id: 'jumper_master', name: 'Jumper Grand', description: 'Jump 10000 times in a single run.', icon: 'images/badges/jumper_4.png' },
            { level: 5, threshold: 2500, id: 'jumper_legend', name: 'Jumper Legend', description: 'Jump 25000 times in a single run and unlock a special skin!', unlocksSkin: 'skin_donkey_jumper_legend', icon: 'images/badges/jumper_5.png' }
        ]
    },
    BOSS_SLAYER_BADGES: {
        type: 'individual_boss',
        bosses: [
            { id: 'glitchzilla_slayer', name: 'Glitchzilla Slayer', description: 'Defeat Glitchzilla.', flag: 'glitchzillaDefeated', unlocksSkin: 'skin_donkey_glitchzilla_slayer', icon: 'images/badges/glitchzilla_slayer.png' },
            { id: 'trojan_byte_slayer', name: 'Trojan Byte Slayer', description: 'Defeat Trojan Byte.', flag: 'trojanByteDefeated', unlocksSkin: 'skin_donkey_trojan_slayer', icon: 'images/badges/trojan_byte_slayer.png' },
            { id: 'missing_number_slayer', name: 'Missing Number Slayer', description: 'Defeat Missing Number.', flag: 'missingNumberDefeated', unlocksSkin: 'skin_donkey_missing_slayer', icon: 'images/badges/missing_number_slayer.png' },
            { id: 'dunno_exe_slayer', name: 'DUNNO.EXE Slayer', description: 'Defeat DUNNO.EXE.', flag: 'dunnoExeDefeated', unlocksSkin: 'skin_donkey_dunno_slayer', icon: 'images/badges/dunno_exe_slayer.png' }
        ]
    },
    CODE_STORMER: {
        baseId: 'shotsFired', // Corresponds to backend
        metric: 'shotsFired',
        tiers: [
            { level: 1, threshold: 200, id: 'code_shooter_rookie', name: 'Code Shooter', description: 'Fire 200 shots in a single run.', icon: 'images/badges/code_stormer_1.png' },
            { level: 2, threshold: 1000, id: 'code_shooter_veteran', name: 'Code Barrager', description: 'Fire 1000 shots in a single run.', icon: 'images/badges/code_stormer_2.png' },
            { level: 3, threshold: 2000, id: 'code_shooter_elite', name: 'Code Artillery', description: 'Fire 2000 shots in a single run.', icon: 'images/badges/code_stormer_3.png' },
            { level: 4, threshold: 5000, id: 'code_shooter_master', name: 'Code Volley', description: 'Fire 5000 shots in a single run.', icon: 'images/badges/code_stormer_4.png' },
            { level: 5, threshold: 10000, id: 'code_shooter_legend', name: 'Code Storm', description: 'Fire 10000 shots in a single run and unlock a special skin!', unlocksSkin: 'skin_bullet_code_storm', icon: 'images/badges/code_stormer_5.png' }
        ]
    },
    BIT_COLLECTOR: {
        baseId: 'bitsCollected', // Corresponds to backend
        metric: 'bitsCollected',
        tiers: [
            { level: 1, threshold: 500, id: 'bit_miner_rookie', name: 'Bit Gatherer', description: 'Collect 500 bits in a single run.', icon: 'images/badges/bit_collector_1.png' },
            { level: 2, threshold: 2500, id: 'bit_miner_veteran', name: 'Bit Hoarder', description: 'Collect 2500 bits in a single run.', icon: 'images/badges/bit_collector_2.png' },
            { level: 3, threshold: 5000, id: 'bit_miner_elite', name: 'Bit Tycoon', description: 'Collect 5000 bits in a single run.', icon: 'images/badges/bit_collector_3.png' },
            { level: 4, threshold: 10000, id: 'bit_miner_master', name: 'Bit Baron', description: 'Collect 10000 bits in a single run.', icon: 'images/badges/bit_collector_4.png' },
            { level: 5, threshold: 20000, id: 'bit_miner_legend', name: 'Bit Overlord', description: 'Collect 20000 bits in a single run and unlock a special skin!', unlocksSkin: 'skin_donkey_bit_overlord', icon: 'images/badges/bit_collector_5.png' }
        ]
    },
    MISSION_EXPERT: {
        baseId: 'missionsCompleted', // Corresponds to backend
        metric: 'missionsCompleted',
        tiers: [
            { level: 1, threshold: 1, id: 'mission_rookie', name: 'Mission Apprentice', description: 'Complete 1 mission in a single run.', icon: 'images/badges/mission_expert_1.png' },
            { level: 2, threshold: 5, id: 'mission_veteran', name: 'Mission Seeker', description: 'Complete 5 missions in a single run.', icon: 'images/badges/mission_expert_2.png' },
            { level: 3, threshold: 10, id: 'mission_elite', name: 'Mission Commander', description: 'Complete 10 missions in a single run.', icon: 'images/badges/mission_expert_3.png' },
            { level: 4, threshold: 15, id: 'mission_master', name: 'Mission Maven', description: 'Complete 15 missions in a single run.', icon: 'images/badges/mission_expert_4.png' },
            { level: 5, threshold: 25, id: 'mission_legend', name: 'Mission Legend', description: 'Complete 25 missions in a single run and unlock a special skin!', unlocksSkin: 'skin_donkey_mission_legend', icon: 'images/badges/mission_expert_5.png' }
        ]
    },
    POWERUP_MASTER: {
        baseId: 'powerUpsCollected', // Corresponds to backend
        metric: 'powerUpsCollected',
        tiers: [
            { level: 1, threshold: 10, id: 'power_up_apprentice', name: 'Power-Up Scavenger', description: 'Collect 10 power-ups in a single run.', icon: 'images/badges/powerup_master_1.png' },
            { level: 2, threshold: 25, id: 'power_up_expert', name: 'Power-Up Collector', description: 'Collect 25 power-ups in a single run.', icon: 'images/badges/powerup_master_2.png' },
            { level: 3, threshold: 50, id: 'power_up_master', name: 'Power-Up Hoarder', description: 'Collect 50 power-ups in a single run.', icon: 'images/badges/powerup_master_3.png' },
            { level: 4, threshold: 75, id: 'power_up_grandmaster', name: 'Power-Up Enthusiast', description: 'Collect 75 power-ups in a single run.', icon: 'images/badges/powerup_master_4.png' },
            { level: 5, threshold: 100, id: 'power_up_overlord', name: 'Power-Up Overlord', description: 'Collect 100 power-ups in a single run and unlock a special skin!', unlocksSkin: 'skin_donkey_powerup_overlord', icon: 'images/badges/powerup_master_5.png' }
        ]
    },
    DATA_PACKET_EXPERT: {
        baseId: 'dataPacketsCollected', // Corresponds to backend
        metric: 'dataPacketsCollected',
        tiers: [
            { level: 1, threshold: 5, id: 'data_collector_apprentice', name: 'Data Packet Recruiter', description: 'Collect 5 data packets in a single run.', icon: 'images/badges/data_packet_expert_1.png' },
            { level: 2, threshold: 15, id: 'data_collector_expert', name: 'Data Packet Analyst', description: 'Collect 15 data packets in a single run.', icon: 'images/badges/data_packet_expert_2.png' },
            { level: 3, threshold: 30, id: 'data_collector_master', name: 'Data Packet Engineer', description: 'Collect 30 data packets in a single run.', icon: 'images/badges/data_packet_expert_3.png' },
            { level: 4, threshold: 50, id: 'data_collector_guru', name: 'Data Packet Scientist', description: 'Collect 50 data packets in a single run.', icon: 'images/badges/data_packet_expert_4.png' },
            { level: 5, threshold: 75, id: 'data_collector_legend', name: 'Data Packet Guru', description: 'Collect 75 data packets in a single run and unlock a special skin!', unlocksSkin: 'skin_donkey_data_guru', icon: 'images/badges/data_packet_expert_5.png' }
        ]
    },
    MULTI_FRUIT_EATER: {
        baseId: 'multi_fruit_cumulative', // Corresponds to backend
        type: 'multi_fruit_cumulative',
        name: 'Fruit Salad Champion',
        description: 'Collect at least 5 of each digital fruit type to master this badge!', // Description updated to reflect lower thresholds
        thresholds: {
            kiwi: 5,
            orange: 5,
            pear: 5,
            apple: 5,
            banana: 5,
            berry: 5,
            blueberry: 5,
            cherry: 5,
            coconut: 5,
            dragonfruit: 5,
            grapes: 5,
            lemon: 5,
            melon: 5,
            papaya: 5,
            peach: 5,
            pineapple: 5,
            strawberry: 5,
            watermelon: 5,
        },
        id: 'multi_fruit_eater_badge',
        unlocksSkin: 'skin_donkey_fruit_master',
        icon: 'images/badges/multi_fruit_eater.png' // Added icon
    },
    DIGITAL_FRUIT_COLLECTOR: {
        baseId: 'totalDigitalFruits', // Corresponds to backend
        metric: 'totalDigitalFruits',
        tiers: [
            { level: 1, threshold: 10, id: 'digital_fruit_collector_1', name: 'Fruit Seeker', description: 'Collect 10 digital fruits in total.', icon: 'images/badges/digital_fruit_collector_1.png' },
            { level: 2, threshold: 50, id: 'digital_fruit_collector_2', name: 'Fruit Hoarder', description: 'Collect 50 digital fruits in total.', icon: 'images/badges/digital_fruit_collector_2.png' },
            { level: 3, threshold: 100, id: 'digital_fruit_collector_3', name: 'Fruit Tycoon', description: 'Collect 100 digital fruits in total.', icon: 'images/badges/digital_fruit_collector_3.png' },
            { level: 4, threshold: 250, id: 'digital_fruit_collector_4', name: 'Fruit Baron', description: 'Collect 250 digital fruits in total.', icon: 'images/badges/digital_fruit_collector_4.png' },
            { level: 5, threshold: 500, id: 'digital_fruit_collector_5', name: 'Fruit Overlord', description: 'Collect 500 digital fruits in total and unlock a special skin!', unlocksSkin: 'skin_donkey_fruit_overlord', icon: 'images/badges/digital_fruit_collector_5.png' }
        ]
    },
    // NUOVO: Badge for highest enemies defeated in a Rain Run (no icon provided in list)
    RAIN_ENEMIES_SLAYER: {
        baseId: 'highestRainRunEnemiesDefeated', // Corresponds to backend
        metric: 'rainRunEnemiesDefeated',
        tiers: [
            { id: 'rain_bug_hunter_rookie', level: 1, threshold: 100, name: 'Rain Bug Hunter Initiate', description: 'Debug 100 enemies in a single Rain Run.', icon: 'images/badges/rain_debuggator_01.png'},
            { id: 'rain_bug_hunter_veteran', level: 2, threshold: 200, name: 'Rain Bug Hunter Adept', description: 'Debug 200 enemies in a single Rain Run.', icon: 'images/badges/rain_debuggator_02.png' },
            { id: 3, level: 3, threshold: 350, id: 'rain_bug_hunter_expert', name: 'Rain Bug Hunter Expert', description: 'Debug 350 enemies in a single Rain Run.', icon: 'images/badges/rain_debuggator_03.png' },
            { id: 4, level: 4, threshold: 500, id: 'rain_bug_hunter_master', name: 'Rain Bug Hunter Master', description: 'Debug 500 enemies in a single Rain Run.', icon: 'images/badges/rain_debuggator_04.png' },
            { id: 5, level: 5, threshold: 750, id: 'rain_bug_hunter_legend', name: 'Rain Bug Hunter Legend', description: 'Debug 750 enemies in a single Rain Run.', icon: 'images/badges/rain_debuggator_05.png' },
        ]
    },
    // NUOVO: Badge for highest score in a Rain Run (no icon provided in list)
    RAIN_SCORE_MASTER: {
        baseId: 'highestRainRunHighScore', // Corresponds to backend
        metric: 'rainRunHighScore',
        tiers: [
            { id: 'rain_score_rookie', level: 1, threshold: 10000, name: 'Rain Score Initiate', description: 'Reach 10000 points in a single Rain Run.', icon: 'images/badges/rain_score_master_1.png' },
            { id: 'rain_score_veteran', level: 2, threshold: 20000, name: 'Rain Score Enthusiast', description: 'Reach 20000 points in a single Rain Run.', icon: 'images/badges/rain_score_master_2.png' },
            { id: 'rain_score_elite', level: 3, threshold: 30000, name: 'Rain Score Artisan', description: 'Reach 30000 points in a single Rain Run.', icon: 'images/badges/rain_score_master_3.png' },
            { id: 'rain_score_master', level: 4, threshold: 50000, name: 'Rain Score Grandmaster', description: 'Reach 50000 points in a single Rain Run.', icon: 'images/badges/rain_score_master_4.png' },
            { id: 'rain_score_legend', level: 5, threshold: 75000, name: 'Rain Score Legend', description: 'Reach 75000 points in a single Rain Run.', icon: 'images/badges/rain_score_master_5.png' },
        ]
    },
};

export async function loadBadgeDefinitions() {
    if (Object.keys(badgeDefinitionsCache).length > 0) {
        return badgeDefinitionsCache; // Ritorna la cache se già popolata
    }
    console.log("Caricamento definizioni badge da FRONTEND_BADGE_TIERS (locale)...");
    // Popola badgeDefinitionsCache direttamente da FRONTEND_BADGE_TIERS
    for (const key in FRONTEND_BADGE_TIERS) {
        const category = FRONTEND_BADGE_TIERS[key];
        if (category.type === 'individual_boss') {
            category.bosses.forEach(bossBadge => {
                badgeDefinitionsCache[bossBadge.id] = { ...bossBadge, isSecret: bossBadge.isSecret || false };
            });
        } else if (category.type === 'multi_fruit_cumulative') {
            badgeDefinitionsCache[category.id] = { ...category, isSecret: category.isSecret || false };
        } else {
            category.tiers.forEach(tier => {
                badgeDefinitionsCache[tier.id] = { ...tier, isSecret: tier.isSecret || false };
            });
        }
    }
    console.log(`Caricate ${Object.keys(badgeDefinitionsCache).length} definizioni badge da locale.`);
    return badgeDefinitionsCache;
}

export async function getUserBadgesStatus(userId) {
    // In un contesto offline, currentUserData è la nostra fonte di verità.
    // L'ID utente è sempre quello locale fisso.
    if (!currentUserData || currentUserData.userId !== userId) {
        console.warn(`getUserBadgesStatus: currentUserData non disponibile o non corrisponde per userId: ${userId}. Usando dati vuoti.`);
        return { earnedBadges: [], gameStats: {} };
    }

    console.log(`getUserBadgesStatus: Recupero stato badge per utente locale (${userId}).`);
    return {
        earnedBadges: currentUserData.inventory?.earnedBadges || [], // Assumendo che i badge guadagnati siano in inventory
        gameStats: currentUserData.gameStats || {},
    };
}
/**
 * Renderizza i badge nella sezione dedicata del profilo.
 * @param {HTMLElement} containerElement L'elemento DOM dove renderizzare i badge.
 * @param {object} userBadgesStatus L'oggetto restituito da getUserBadgesStatus.
 */
export async function renderBadges(containerElement, userBadgesStatus) {
    if (!containerElement) {
        console.error("renderBadges: Elemento container non fornito.");
        return;
    }

    const badgeDefs = await loadBadgeDefinitions(); // Load ALL badge definitions
    // Modificare la seguente linea per riflettere il caricamento locale:
    // console.log("Definizioni badge caricate da Firestore:", badgeDefs);
    console.log("Definizioni badge caricate localmente:", badgeDefs);
    containerElement.innerHTML = ''; // Clear the container

    const badgeGrid = document.createElement('div');
    badgeGrid.className = 'badge-grid'; // CSS class for the badge grid
    containerElement.appendChild(badgeGrid);

    // Group badges by baseId for tiered badges, and keep individual boss badges
const displayCategories = {};

// Popola displayCategories con i badge a livelli e individuali
for (const key in FRONTEND_BADGE_TIERS) {
    const category = FRONTEND_BADGE_TIERS[key];

    if (category.type !== 'individual_boss' && category.type !== 'multi_fruit_cumulative') { // Existing tiered badge logic
        const baseId = category.baseId;
        const currentMaxEarnedLevel = userBadgesStatus.gameStats?.[`${baseId}_level`] || 0;
        const firstTier = category.tiers.find(t => t.level === 1);

        let tierToDisplay = null;
        let isTieredCategoryEarned = false;

        if (currentMaxEarnedLevel > 0) {
            tierToDisplay = category.tiers.find(t => t.level === currentMaxEarnedLevel);
            isTieredCategoryEarned = true;
        } else {
            tierToDisplay = firstTier;
        }

        // Recupera la definizione COMPLETA del badge dal cache di Firestore
        // per il tier che stiamo per mostrare (attuale o primo)
        const badgeDefFromFirestore = tierToDisplay ? badgeDefs[tierToDisplay.id] : null;

        if (firstTier && firstTier.isSecret && !isTieredCategoryEarned) {
            continue; // Salta il rendering se è segreto e non sbloccato
        }

        const nextTierForProgress = category.tiers.find(t => t.level === (currentMaxEarnedLevel + 1));

        displayCategories[baseId] = {
            type: 'tiered',
            baseId: baseId,
            metric: category.metric,
            currentMaxEarnedLevel: currentMaxEarnedLevel,
            tierToDisplay: tierToDisplay, // Il tier dal FRONTEND_BADGE_TIERS
            nextTierForProgress: nextTierForProgress,
            totalTiers: category.tiers.length,
            isCategoryEarned: isTieredCategoryEarned,
            // **USA L'ICONA DA FIRESTORE SE DISPONIBILE, ALTRIMENTI IL FALLBACK O QUELLA LOCALE**
            icon: badgeDefFromFirestore?.icon || tierToDisplay?.icon || 'images/badges/locked_tiered_badge.png',
            name: badgeDefFromFirestore?.name || category.name || (tierToDisplay ? tierToDisplay.name.replace(` Level ${tierToDisplay.level}`, '') : ''),
            description: badgeDefFromFirestore?.description || tierToDisplay?.description || '',
            isSecret: badgeDefFromFirestore?.isSecret || firstTier?.isSecret || false
        };

        } else if (category.type === 'multi_fruit_cumulative') { // NEW: Multi-fruit cumulative badge
        const badgeId = category.id;
        const isEarned = userBadgesStatus.earnedBadges.includes(badgeId);

        const badgeDefFromFirestore = badgeDefs[badgeId];

        if ((category.isSecret || badgeDefFromFirestore?.isSecret) && !isEarned) {
            return; // Skip rendering if secret and not unlocked
        }

        let allThresholdsMet = true;
        let progressDetails = [];
        let totalProgressCurrent = 0;
        let totalProgressThreshold = 0;

        for (const fruitType in category.thresholds) {
            const required = category.thresholds[fruitType];
            const current = userBadgesStatus.gameStats?.[`total${fruitType.charAt(0).toUpperCase() + fruitType.slice(1)}Collected`] || 0;
            if (current < required) {
                allThresholdsMet = false;
            }
            progressDetails.push(`${fruitType.replace('digital_', '')}: ${current}/${required}`);
            totalProgressCurrent += current;
            totalProgressThreshold += required;
        }

        displayCategories[badgeId] = {
            type: 'multi_fruit_cumulative',
            id: badgeId,
            name: badgeDefFromFirestore?.name || category.name,
            description: badgeDefFromFirestore?.description || category.description,
            icon: badgeDefFromFirestore?.icon || category.icon || 'images/badges/locked_multi_fruit_badge.png', // Fallback icon
            isSecret: badgeDefFromFirestore?.isSecret || category.isSecret || false,
            isEarned: isEarned,
            progressDetails: progressDetails.join(', '),
            totalProgressCurrent: totalProgressCurrent,
            totalProgressThreshold: totalProgressThreshold
        };

    } else { // Badge boss individuali
        category.bosses.forEach(bossBadge => {
            const badgeId = bossBadge.id;
            const isEarned = userBadgesStatus.earnedBadges.includes(badgeId);

            // Recupera la definizione COMPLETA del badge boss dal cache di Firestore
            const badgeDefFromFirestore = badgeDefs[badgeId];

            if ((bossBadge.isSecret || badgeDefFromFirestore?.isSecret) && !isEarned) {
                return; // Salta il rendering se è segreto e non sbloccato
            }
            displayCategories[badgeId] = {
                type: 'individual_boss',
                id: bossBadge.id,
                // **USA I DATI DA FIRESTORE SE DISPONIBILI, ALTRIMENTI QUELLI LOCALI**
                name: badgeDefFromFirestore?.name || bossBadge.name,
                description: badgeDefFromFirestore?.description || bossBadge.description,
                icon: badgeDefFromFirestore?.icon || bossBadge.icon || 'images/badges/locked_boss_badge.png', // Fallback anche per i boss
                isSecret: badgeDefFromFirestore?.isSecret || bossBadge.isSecret || false,
                isEarned: isEarned
            };
        });
    }
}

    // Sort categories for consistent display
    const sortedCategoryKeys = Object.keys(displayCategories).sort((a, b) => {
        const itemA = displayCategories[a];
        const itemB = displayCategories[b];

        // Sort tiered categories first, then individual boss badges
        if (itemA.type === 'tiered' && itemB.type === 'individual_boss') return -1;
        if (itemA.type === 'individual_boss' && itemB.type === 'tiered') return 1;

        // Within tiered categories, sort alphabetically by baseId
        if (itemA.type === 'tiered' && itemB.type === 'tiered') {
            return itemA.baseId.localeCompare(itemB.baseId);
        }
        // Within individual boss badges, sort alphabetically by id
        if (itemA.type === 'individual_boss' && itemB.type === 'individual_boss') {
            return itemA.id.localeCompare(itemB.id);
        }
        return 0;
    });

    if (sortedCategoryKeys.length === 0) {
        badgeGrid.innerHTML = '<p>Ancora nessun badge sbloccato o nessuna definizione visibile.</p>';
        return;
    }

    sortedCategoryKeys.forEach(categoryKey => {
        const item = displayCategories[categoryKey];
        const badgeCard = document.createElement('div');

        let progressHTML = '';
        let statusText = '';
        let icon = item.icon;
        let name = item.name;
        let description = item.description;
        let isEarnedStatus = false; // To track if the badge (or its highest tier) is earned

        if (item.type === 'tiered') {
            isEarnedStatus = item.isCategoryEarned;
            badgeCard.className = `badge-card ${isEarnedStatus ? 'earned' : 'locked'}`;

            // Adjust display name for tiered badges
            name = item.tierToDisplay ? item.tierToDisplay.name : item.name;

            if (item.currentMaxEarnedLevel > 0) {
                // Badge category has been started/earned at least one level
                statusText = `Livello ${item.currentMaxEarnedLevel} SBLOCCATO`;
                description = item.tierToDisplay?.description || item.description; // Description of the highest earned tier

                if (item.nextTierForProgress) {
                    // Not yet max level, show progress towards next
                    const nextTierThreshold = item.nextTierForProgress.threshold;
                    let actualCurrentValue = 0;
                    // Correctly map metric to gameStats property
                    switch (item.metric) {
                        case 'score':
                            actualCurrentValue = userBadgesStatus.gameStats?.highestScore || 0;
                            break;
                        case 'enemiesDefeated':
                            actualCurrentValue = userBadgesStatus.gameStats?.highestEnemiesDefeatedRun || 0;
                            break;
                        case 'jumps':
                            actualCurrentValue = userBadgesStatus.gameStats?.highestJumpsRun || 0;
                            break;
                        case 'shotsFired':
                            actualCurrentValue = userBadgesStatus.gameStats?.highestProjectilesFiredRun || 0;
                            break;
                        case 'bitsCollected':
                            actualCurrentValue = userBadgesStatus.gameStats?.highestBitsCollectedRun || 0;
                            break;
                        case 'missionsCompleted':
                            actualCurrentValue = userBadgesStatus.gameStats?.highestMissionsCompletedRun || 0;
                            break;
                        case 'powerUpsCollected':
                            actualCurrentValue = userBadgesStatus.gameStats?.highestPowerUpsCollectedRun || 0;
                            break;
                        case 'dataPacketsCollected':
                            actualCurrentValue = userBadgesStatus.gameStats?.highestDataPacketsCollectedRun || 0;
                            break;
                    case 'totalDigitalFruits': // NEW
                    actualCurrentValue = userBadgesStatus.gameStats?.totalDigitalFruits || 0;
                    break;
            // --- INIZIO CODICE DA AGGIUNGERE ---
    case 'rainRunEnemiesDefeated':
        actualCurrentValue = userBadgesStatus.gameStats?.highestRainRunEnemiesDefeated || 0;
        break;
    case 'rainRunHighScore':
        actualCurrentValue = userBadgesStatus.gameStats?.highestRainRunHighScore || 0;
        break;
    // --- FINE CODICE DA AGGIUNGERE ---
}
                    const progressPercentage = Math.min(100, (actualCurrentValue / nextTierThreshold) * 100).toFixed(0);

                    progressHTML = `
                        <div class="badge-progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                        <span class="progress-text">${actualCurrentValue}/${nextTierThreshold} (Prossimo: ${item.nextTierForProgress.name})</span>
                    `;
                } else {
                    // Max level reached
                    statusText = `Livello ${item.currentMaxEarnedLevel} COMPLETO`;
                    progressHTML = `<span class="progress-text badge-completed-text">Tutti i livelli sbloccati!</span>`;
                }
            } else {
                // No levels earned yet for this tiered badge category
                statusText = 'NON SBLOCCATO';
                icon = item.icon || 'images/badges/locked_tiered_badge.png'; // Generic locked icon for tiered badges
                description = item.tierToDisplay?.description || item.description; // Description of the first tier
                name = item.tierToDisplay ? item.tierToDisplay.name : item.name; // Name of the first tier

                const firstTierThreshold = item.tierToDisplay.threshold;
                let actualCurrentValue = 0;
                switch (item.metric) {
                    case 'score':
                        actualCurrentValue = userBadgesStatus.gameStats?.highestScore || 0;
                        break;
                    case 'enemiesDefeated':
                        actualCurrentValue = userBadgesStatus.gameStats?.highestEnemiesDefeatedRun || 0;
                        break;
                    case 'jumps':
                        actualCurrentValue = userBadgesStatus.gameStats?.highestJumpsRun || 0;
                        break;
                    case 'shotsFired':
                        actualCurrentValue = userBadgesStatus.gameStats?.highestProjectilesFiredRun || 0;
                        break;
                    case 'bitsCollected':
                        actualCurrentValue = userBadgesStatus.gameStats?.highestBitsCollectedRun || 0;
                        break;
                    case 'missionsCompleted':
                        actualCurrentValue = userBadgesStatus.gameStats?.highestMissionsCompletedRun || 0;
                        break;
                    case 'powerUpsCollected':
                        actualCurrentValue = userBadgesStatus.gameStats?.highestPowerUpsCollectedRun || 0;
                        break;
                    case 'dataPacketsCollected':
                        actualCurrentValue = userBadgesStatus.gameStats?.highestDataPacketsCollectedRun || 0;
                        break;
                // --- INIZIO MODIFICA 2 (DA AGGIUNGERE QUI) ---
            case 'rainRunEnemiesDefeated':
                actualCurrentValue = userBadgesStatus.gameStats?.highestRainRunEnemiesDefeated || 0;
                break;
            case 'rainRunHighScore':
                actualCurrentValue = userBadgesStatus.gameStats?.highestRainRunHighScore || 0;
                break;
            // --- FINE MODIFICA 2 ---
        }
                const progressPercentage = Math.min(100, (actualCurrentValue / firstTierThreshold) * 100).toFixed(0);

                progressHTML = `
                    <div class="badge-progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <span class="progress-text">${actualCurrentValue}/${firstTierThreshold}</span>
                `;
            }
        } else if (item.type === 'individual_boss') {
            isEarnedStatus = item.isEarned;
            badgeCard.className = `badge-card ${isEarnedStatus ? 'earned' : 'locked'}`;

            if (isEarnedStatus) {
                statusText = 'SBLOCCATO';
            } else {
                statusText = 'SCONOSCIUTO';
                name = "???"; // Name hidden if not earned
                description = 'Sconfiggi questo boss per sbloccarlo!'; // Generic description
                icon = 'images/badges/locked_boss_badge.png'; // Generic locked icon
            }
        } else if (item.type === 'multi_fruit_cumulative') { // NEW: Multi-fruit cumulative badge display
            isEarnedStatus = item.isEarned;
            badgeCard.className = `badge-card ${isEarnedStatus ? 'earned' : 'locked'}`;

            if (isEarnedStatus) {
                statusText = 'SBLOCCATO';
            } else {
                statusText = 'IN PROGRESSO';
                icon = item.icon || 'images/badges/locked_multi_fruit_badge.png'; // Generic locked icon for multi-fruit
                name = item.name; // Show name even if not earned
                description = item.description;

                const progressPercentage = Math.min(100, (item.totalProgressCurrent / item.totalProgressThreshold) * 100).toFixed(0);
                progressHTML = `
                    <div class="badge-progress-bar">
                        <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <span class="progress-text">Progresso: ${item.progressDetails}</span>
                `;
            }
        }

        

        

        badgeCard.innerHTML = `
            <img src="${icon}" alt="${name}" class="badge-icon">
            <h3 class="badge-name">${name}</h3>
            <p class="badge-description">${description}</p>
            <div class="badge-status">${statusText}</div>
            ${progressHTML}
            ${item.isSecret && !isEarnedStatus ? '<span class="badge-secret">SEGRETTO</span>' : ''}
        `;
        badgeGrid.appendChild(badgeCard);
    });
}