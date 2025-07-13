// js/main.js

// Import ONLY necessary non-Firebase modules
import { initShop } from './shopManager.js';
import { menuAnimation, bitTypes } from './menuAnimation.js';
import { launchGame, stopGameLoop, pauseGame, currentGameState, GAME_STATE, COMPANION_ASSET_MAP, SKIN_ASSET_MAP } from './donkeyRunner.js'; // Added SKIN_ASSET_MAP
import * as AudioManager from './audioManager.js';
import { initLeaderboard } from './leaderboardManager.js'; // Verrà svuotato/rimosso in seguito
import { startLoadingSequence } from './loader.js';
import * as MissionManager from './missionManager.js';

import { showAuthModal } from './auth.js'; // Verrà minimalizzato/rimosso
import { openProfileModal, handleEquipItem, initProfileControls, renderSkinsModal, renderCompanionsModal, renderPowerupsModal } from './profile.js';

import { createIcon } from './blockies.mjs';
import { showToast } from './toastNotifications.js';

// NUOVO: Importa le funzioni di IndexedDB
import { openOfflineDB, getUser, saveUser } from './offlineDb.js';

export let currentUserData = null; // ORA ESPORTATO
let isGameStarting = false;
let currentUserProfileUnsubscribe = null; // Not needed
let notificationListener = null; // Not needed
let bitCountListener = null; // Not needed

export const MENU_SKIN_ASSET_MAP = {
    'skin_donkey_default_info': {
        walk: 'images/asyncDonkey_walk.png',
        digest: 'images/donkeyDigest.png'
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
        walk: 'images/skins/skin_donkey_pixelart.png',
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
        digest: 'images/skins/skin_donkey_dev_digest.png',
    },
    // Non includiamo le skin dei proiettili qui perché il menu non le visualizza
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
    'skin_donkey_fruit_master': {
        walk: 'images/skins/badge_skins/skin_donkey_fruit_master_walk.png',
        digest: 'images/skins/badge_skins/skin_donkey_fruit_master_digest.png'
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

    // --- FINE SKIN SBLOCCABILI TRAMITE BADGE ---
};

// Frasi casuali per la fase di "processing"
const PROCESSING_PHRASES = [
    "Initializing kernel...",
    "Validating checksums...",
    "Loading modules...",
    "Synchronizing data stream...",
    "Optimizing subroutines...",
    "DonkeyDebug subroutine: start",
    "Establishing secure connection...",
    "Analyzing bytecode...",
    "Compiling game assets...",
    "Booting up game engine...",
    "Checking integrity hash..."
];

// Funzione centralizzata per avviare il menu (chiamata sia all'inizio sia al ritorno dal gioco)
export function initializeMenu(initialDonkeyPos = null) {
    console.log("Inizializzazione del menu...");
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.style.display = 'flex';
        mainMenu.style.opacity = 1;
    }

    const topBarLeft = document.getElementById('top-bar-left');
    const topBarRight = document.getElementById('top-bar-right');
    if (topBarLeft) topBarLeft.style.display = 'flex';
    if (topBarRight) topBarRight.style.display = 'flex';

    // --- NUOVA LOGICA MUSICA CASUALE ---
    const menuTracks = [
        { name: 'menu_music_1', file: 'audio/music_menu_1.ogg', title: '.NET Surfing', artist: 'U.T.' },
        { name: 'menu_music_2', file: 'audio/music_menu_2.ogg', title: 'delete.exe', artist: 'U.T.' },
        { name: 'menu_music_3', file: 'audio/music_menu_3.ogg', title: 'synchronize', artist: 'U.T.' }
    ];

    const randomTrack = menuTracks[Math.floor(Math.random() * menuTracks.length)];

    const nowPlayingContainer = document.getElementById('now-playing-container');
    if (nowPlayingContainer) {
        nowPlayingContainer.innerHTML = `
            <span>NOW PLAYING:</span>
            <span class="track-title">"${randomTrack.title}"</span> by ${randomTrack.artist}
        `;
    }

    AudioManager.loadBackgroundMusic(randomTrack.name, randomTrack.file)
        .then(() => {
            AudioManager.playMusicByName(randomTrack.name, true);
        }).catch(err => console.error("Errore caricamento musica menu:", err));

    // Initialize menu animation canvas once
    const menuCanvasElement = document.getElementById('menuCanvas');
    if (menuCanvasElement && !menuAnimation.canvas) { // Check if not already initialized
        menuAnimation.init('menuCanvas'); // Call init for canvas setup and initial loop
    }

    // Pass currentUserData to update the player and companion display in the menu
    // This call is critical for reflecting changes in equipment/purchase.
    // Ensure currentUserData is loaded before calling this.
    if (currentUserData) {
        menuAnimation.updateMenuPlayerDisplay(currentUserData);
    } else {
        console.warn("currentUserData not available in initializeMenu. Menu player display might not update correctly.");
    }


    // --- AGGIORNAMENTO CONTATORI BIT E FRUTTA NELLA TOP BAR DEL MENU ---
    if (window.currentUserData && window.currentUserData.gameStats) {
        const bitCountValueElement = document.getElementById('bit-count-value');
        if (bitCountValueElement) {
            bitCountValueElement.textContent = window.currentUserData.gameStats.totalBits || 0;
        }
        const digitalFruitCountValueElement = document.getElementById('digital-fruit-count-value');
        if (digitalFruitCountValueElement) {
            digitalFruitCountValueElement.textContent = window.currentUserData.gameStats.totalDigitalFruits || 0;
        }
    }
    // Assicurati che l'animazione del menu sia avviata. init() la avvia,
    // ma se init() non viene chiamata per ogni refresh (es. solo updateMenuPlayerDisplay),
    // assicurati che il loop sia attivo.
    if (!menuAnimation.isRunning) {
        menuAnimation.start();
    }
}
export function generateBlockieAvatar(seed, imgSize = 40, blockieOptions = {}) {
    if (typeof createIcon !== 'function') {
        console.error('createIcon from Blockies non importata!');
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${imgSize}' height='${imgSize}' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E`;
    }
    try {
        const defaultOptions = {
            seed: String(seed).toLowerCase(),
            size: 8,
            scale: 5,
        };
        const options = { ...defaultOptions, ...blockieOptions };
        options.scale = Math.max(1, Math.round(imgSize / options.size));
        const canvasElement = createIcon(options);
        if (canvasElement && typeof canvasElement.toDataURL === 'function') {
            return canvasElement.toDataURL();
        } else {
            throw new Error('createIcon non ha restituito un canvas valido.');
        }
    } catch (e) {
        console.error('Errore generazione avatar Blockie:', e, 'Seed:', seed);
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${imgSize}' height='${imgSize}' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' fill='%23ddd'/%3E%3Ctext x='5' y='7.5' font-size='5' text-anchor='middle' fill='%23777'%3E?%3C/text%3E%3C/svg%3E`;
    }
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export { escapeHTML };

export function getCurrentUserId() {
    return currentUserData ? currentUserData.userId : 'default_offline_user';
}

const startGameSequence = async () => {
    if (isGameStarting) return;
    isGameStarting = true;

    const topBarLeft = document.getElementById('top-bar-left');
    const topBarRight = document.getElementById('top-bar-right');
    if (topBarLeft) topBarLeft.style.display = 'none';
    if (topBarRight) topBarRight.style.display = 'none';

    if (menuAnimation.donkey) {
        menuAnimation.donkey.startProcessing();
    }

    const collectedItemsToSync = menuAnimation.collectedItemCounts;
    let totalBitsForToast = 0;
    let totalFruitsForToast = 0;
    for (const itemType in collectedItemsToSync) {
        const itemDefinition = bitTypes[itemType];
        if (itemDefinition) {
            if (itemDefinition.value > 0 && !itemDefinition.fruitEquivalent) {
                totalBitsForToast += (itemDefinition.value || 0) * (collectedItemsToSync[itemType] || 0);
            } else if (itemDefinition.fruitEquivalent) {
                totalFruitsForToast += (itemDefinition.fruitEquivalent || 0) * (collectedItemsToSync[itemType] || 0);
            }
        } else {
            console.warn(`[Main.js] Tipo di item sconosciuto nel calcolo del toast: ${itemType}`);
        }
    }

    if (currentUserData && Object.keys(collectedItemsToSync).length > 0) {
        let toastMessageParts = [];
        if (totalBitsForToast > 0) toastMessageParts.push(`${totalBitsForToast} bit`);
        if (totalFruitsForToast > 0) toastMessageParts.push(`${totalFruitsForToast} Digital Fruits`);

        if (toastMessageParts.length > 0) {
            console.log(`[Main.js] Sincronizzazione di ${toastMessageParts.join(' e ')}...`);
            showToast(`Syncing ${toastMessageParts.join(' and ')}...`, 'info');
        } else {
            console.log(`[Main.js] Nessun bit o Digital Fruit valido da sincronizzare.`);
        }

        try {
            currentUserData.gameStats.totalBits = (currentUserData.gameStats.totalBits || 0) + totalBitsForToast;
            currentUserData.gameStats.totalDigitalFruits = (currentUserData.gameStats.totalDigitalFruits || 0) + totalFruitsForToast;
            currentUserData.updatedAt = Date.now();
            await saveUser(currentUserData);

            console.log('[Main.js] Sincronizzazione riuscita. Pulisco i conteggi locali.');
            localStorage.setItem('menuCollectedItemCounts', JSON.stringify({}));
            if (menuAnimation) {
                menuAnimation.collectedItemCounts = {};
            }
        } catch (error) {
            console.error('[Main.js] Errore di salvataggio dei bit/frutti:', error);
            showToast('Error saving currencies!', 'error');
        }
    }

    if (menuAnimation.donkey) {
        menuAnimation.donkey.stopProcessing();
    }

    const wasRainingInMenu = menuAnimation.isDigitalRainActive;

    AudioManager.playSound('gameStart');
    AudioManager.stopMusic();

    menuAnimation.start();
    await menuAnimation.startExitAnimation();

    const mainMenu = document.getElementById('main-menu');
    const gameContainerWrapper = document.getElementById('game-container-wrapper');
    if (mainMenu) mainMenu.style.display = 'none';
    if (gameContainerWrapper) gameContainerWrapper.style.display = 'block';

    launchGame({ inventory: currentUserData?.inventory, isRaining: wasRainingInMenu });
    isGameStarting = false;
};


document.addEventListener('DOMContentLoaded', function () {
    console.log('[Main.js] DOMContentLoaded: Inizializzazione applicazione.');
    startLoadingSequence();
    initLeaderboard();
    initProfileControls();
    MissionManager.initMissions();

    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', startGameSequence);
        // Touchend listener no longer needed here, handled by global listener below.
    }

    let localTotalBits = 0;
    let localTotalDigitalFruits = 0;

    window.addEventListener('menubitscollected', () => {
        let pendingTotalBits = 0;
        let pendingTotalDigitalFruits = 0;
        const collectedCounts = menuAnimation.collectedItemCounts;
        for (const itemType in collectedCounts) {
            const itemDefinition = bitTypes[itemType];
            if (itemDefinition) {
                if (itemDefinition.value > 0 && !itemDefinition.fruitEquivalent) {
                    pendingTotalBits += (itemDefinition.value || 0) * (collectedCounts[itemType] || 0);
                } else if (itemDefinition.fruitEquivalent) {
                    pendingTotalDigitalFruits += (itemDefinition.fruitEquivalent || 0) * (collectedCounts[itemType] || 0);
                }
            }
        }

        const bitCountValueElement = document.getElementById('bit-count-value');
        if (bitCountValueElement) {
            bitCountValueElement.textContent = (currentUserData?.gameStats?.totalBits || 0) + pendingTotalBits;
        }
        const digitalFruitCountValueElement = document.getElementById('digital-fruit-count-value');
        if (digitalFruitCountValueElement) {
            digitalFruitCountValueElement.textContent = (currentUserData?.gameStats?.totalDigitalFruits || 0) + pendingTotalDigitalFruits;
        }
        initializeLocalUser();
    });

    window.addEventListener('equippedItemChanged', async (event) => {
        console.log('[Main.js] Evento equippedItemChanged ricevuto.', event.detail);
        initializeMenu();
        showToast('_Update: complete', 'info');

        const openModals = {
            skinsModal: window.renderSkinsModal, // Assumi che queste funzioni siano globali o importate
            companionsModal: window.renderCompanionsModal,
            powerupsModal: window.renderPowerupsModal
        };

        for (const modalId in openModals) {
            const modalElement = document.getElementById(modalId);
            if (modalElement && modalElement.style.display === 'flex') {
                const activeTabButton = modalElement.querySelector('.category-btn.active');
                if (activeTabButton) {
                    const activeTabId = activeTabButton.dataset.typeFilter;
                    switch (modalId) {
                        case 'skinsModal':
                            await renderSkinsModal(currentUserData);
                            break;
                        case 'companionsModal':
                            await renderCompanionsModal(currentUserData);
                            break;
                        case 'powerupsModal':
                            await renderPowerupsModal(currentUserData);
                            break;
                    }
                }
            }
        }
    });

    const shopBtn = document.getElementById('shop-btn');
    if (shopBtn) {
        shopBtn.style.display = 'flex';
        shopBtn.addEventListener('click', async () => {
            await initShop();
            const shopModal = document.getElementById('shopModal');
            if (shopModal) shopModal.style.display = 'flex';
        });
        // Touchend listener no longer needed here, handled by global listener below.
    }

    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.style.display = 'none'; // Initially hidden
        // Touchend listener no longer needed here, handled by global listener below.
    }
    const skinsBtn = document.getElementById('skins-btn');
    if (skinsBtn) {
        skinsBtn.addEventListener('click', async () => {
            await renderSkinsModal(currentUserData);
        });
        // Touchend listener no longer needed here, handled by global listener below.
    }

    const companionsBtn = document.getElementById('companions-btn');
    if (companionsBtn) {
        companionsBtn.addEventListener('click', async () => {
            await renderCompanionsModal(currentUserData);
        });
        // Touchend listener no longer needed here, handled by global listener below.
    }

    const powerupsBtn = document.getElementById('powerups-btn');
    if (powerupsBtn) {
        powerupsBtn.addEventListener('click', async () => {
            await renderPowerupsModal(currentUserData);
        });
        // Touchend listener no longer needed here, handled by global listener below.
    }

    const creditsBtn = document.getElementById('credits-btn');
    if (creditsBtn) {
        creditsBtn.addEventListener('click', () => {
            const creditsModal = document.getElementById('creditsModal');
            if (creditsModal) {
                creditsModal.style.display = 'flex';
            }
        });
        // Touchend listener no longer needed here, handled by global listener below.
    }

    const showLoginModalBtn = document.getElementById('show-login-modal-btn');
    if (showLoginModalBtn) {
        showLoginModalBtn.style.display = 'none';
    }

    const userAvatarIcon = document.getElementById('user-avatar-icon');
    if (userAvatarIcon) {
        userAvatarIcon.addEventListener('click', () => openProfileModal(currentUserData));
        // TO FIX: Add a direct touchend listener for reliable mobile interaction
        userAvatarIcon.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent phantom clicks
            openProfileModal(currentUserData); // Directly call the modal function
        }, { passive: false });
    }

    

    // NEW: Global touchend listener to ensure click events are dispatched reliably on touch devices
    document.addEventListener('touchend', function(e) {
        let target = e.target;

        // NEW: Check if the target is the menuCanvas itself
        const menuCanvas = document.getElementById('menuCanvas');
        if (menuCanvas && (target === menuCanvas || menuCanvas.contains(target))) {
            // Let menuAnimation.js handle clicks/taps on the canvas directly.
            // Do not preventDefault here, and do not manually dispatch click.
            return;
        }

        // Original logic for other clickable elements
        while (target && target !== document.body) {
            if (target.matches('button, a, .menu-btn, .top-bar-icon-btn, [onclick], [role="button"], [tabindex]:not([tabindex="-1"])')) {
                // Prevent default touch behavior (e.g., phantom clicks, scroll issues)
                e.preventDefault();
                // Programmatically dispatch a click event
                target.click(); // This will trigger the existing click listeners
                break; // Stop after finding the first relevant target
            }
            target = target.parentElement;
        }
    }, { passive: false });

    // Modal closing logic directly within DOMContentLoaded
    const modalsToManage = [
        { id: 'shopModal', closeBtnId: 'closeShopModal' },
        { id: 'leaderboardModal', closeBtnId: 'closeLeaderboardModal' },
        { id: 'creditsModal', closeBtnId: 'closeCreditsModalBtn' },
        { id: 'profileModal', closeBtnId: 'closeProfileModal' },
        { id: 'skinsModal', closeBtnId: 'closeSkinsModal' },
        { id: 'companionsModal', closeBtnId: 'closeCompanionsModal' },
        { id: 'powerupsModal', closeBtnId: 'closePowerupsModal' }
    ];

    modalsToManage.forEach(({ id, closeBtnId }) => {
        const modalElement = document.getElementById(id);
        const closeButton = document.getElementById(closeBtnId);

        if (modalElement) {
            // Close when 'X' button is clicked
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    modalElement.style.display = 'none';
                });
            } else {
                console.warn(`Close button with ID '${closeBtnId}' for modal '${id}' not found.`);
            }

            // Close when clicking outside the modal content (for both click and touchend)
            modalElement.addEventListener('click', (event) => {
                if (event.target === modalElement) {
                    modalElement.style.display = 'none';
                }
            });
            modalElement.addEventListener('touchend', (event) => {
                if (event.target === modalElement) {
                    event.preventDefault(); // Prevent default touch behavior
                    modalElement.style.display = 'none';
                }
            });
        } else {
            console.warn(`Modal element with ID '${id}' not found.`);
        }
    });

    const rainStatusIndicator = document.getElementById('rain-status-indicator');
    console.log("Rain Status Indicator element:", rainStatusIndicator);

    window.addEventListener('rainStatusChanged', (event) => {
        console.log("Rain status changed event received:", event.detail.isRaining);
        const isRaining = event.detail.isRaining;
        if (rainStatusIndicator) {
            const statusText = isRaining ? 'true' : 'false';
            const statusClass = isRaining ? 'rain-status-true' : 'rain-status-false';
            rainStatusIndicator.innerHTML = `isRaining = <span class="${statusClass}">${statusText}</span>`;
            rainStatusIndicator.style.display = 'block';
        }
        window.openOfflineDB = openOfflineDB;
        window.getUser = getUser;
        window.saveUser = saveUser;
    });

    setTimeout(() => {
        const isRainingInitial = window.menuAnimation ? window.menuAnimation.isDigitalRainActive : false;
        if (rainStatusIndicator) {
            const statusText = isRainingInitial ? 'true' : 'false';
            const statusClass = isRainingInitial ? 'rain-status-true' : 'rain-status-false';
            rainStatusIndicator.innerHTML = `isRaining = <span class="${statusClass}">${statusText}</span>`;
            rainStatusIndicator.style.display = 'block';
        }
    }, 1000);

    async function initializeLocalUser() {
        const localUserId = 'default_offline_user';

        try {
            await openOfflineDB();
            let userProfile = await getUser(localUserId);

            if (!userProfile) {
                console.log('[Main.js] Nessun profilo utente locale trovato. Creazione di un profilo di default.');
                userProfile = {
                    userId: localUserId,
                    nickname: 'Offline Player',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    profileUpdatedAt: Date.now(),
                    gameStats: { /* ... le tue statistiche di gioco di default ... */ },
                    inventory: {
                        equipped: {
                            bulletSkin: null,
                            donkeySkin: "skin_donkey_default_info",
                            permanentPowerups: [],
                            companion: null,
                        },
                        unlockedItems: ["skin_donkey_default_info"],
                    },
                    email: null,
                    photoURL: '',
                    avatarSeed: localUserId,
                    nationalityCode: null,
                    isAdmin: false,
                    statusMessage: "",
                    externalLinks: [],
                    earnedBadges: [],
                    bio: "",
                    activeNicknameAnimation: null,
                    hasPublishedArticles: false,
                    hasDefeatedGlitchzilla: false,
                };
                await saveUser(userProfile);
                console.log('[Main.js] Profilo di default creato e salvato localmente.');
            };
            currentUserData = userProfile;
            window.currentUserData = currentUserData;

            const accountContainer = document.getElementById('account-icon-container');
            const avatarIconImg = document.getElementById('user-avatar-icon');
            const bitCounter = document.getElementById('bit-counter');
            const digitalFruitCounter = document.getElementById('digital-fruit-counter');
            const loginIconLink = document.getElementById('show-login-modal-btn');
            const skinsBtn = document.getElementById('skins-btn');
            const companionsBtn = document.getElementById('companions-btn');
            const powerupsBtn = document.getElementById('powerups-btn');

            if (loginIconLink) loginIconLink.style.display = 'none';
            if (avatarIconImg) avatarIconImg.style.display = 'block';
            if (bitCounter) bitCounter.style.display = 'flex';
            if (digitalFruitCounter) digitalFruitCounter.style.display = 'flex';
            if (accountContainer) accountContainer.classList.add('is-avatar-container');
            if (skinsBtn) skinsBtn.style.display = 'flex';
            if (companionsBtn) companionsBtn.style.display = 'flex';
            if (powerupsBtn) powerupsBtn.style.display = 'flex';

            let photoURLToUse;
            if (currentUserData.photoURL) {
                photoURLToUse = currentUserData.photoURL;
            } else if (currentUserData.avatarSeed) {
                photoURLToUse = generateBlockieAvatar(currentUserData.avatarSeed, 50);
            } else {
                photoURLToUse = generateBlockieAvatar(localUserId, 50);
            }
            if (avatarIconImg) avatarIconImg.src = photoURLToUse;

            document.getElementById('bit-count-value').textContent = currentUserData.gameStats?.totalBits || 0;
            if (digitalFruitCounter) {
                document.getElementById('digital-fruit-count-value').textContent = currentUserData.gameStats?.totalDigitalFruits || 0;
            }

            window.dispatchEvent(new CustomEvent('menubitscollected'));

            const authModal = document.getElementById('authModal');
            if (authModal) authModal.style.display = 'none';

        } catch (error) {
            console.error('[Main.js] Errore critico durante il caricamento/inizializzazione utente locale:', error);
            showToast('Critical error, unable to launch offline game.', 'error');
        }
    }
    initializeLocalUser();

    if (window.Capacitor && Capacitor.isNativePlatform()) {
        const { App } = Capacitor.Plugins;

        if (App) {
            console.log('[Main.js] Rilevata piattaforma nativa. Attivo listener App (versione offline).');

            App.addListener('pause', () => {
                console.log('[App Event] App in background (pause event).');
                if (currentGameState === GAME_STATE.PLAYING) {
                    pauseGame(true);
                    console.log('[App Event] Gioco e musica fermati automaticamente.');
                } else if (currentGameState === GAME_STATE.MENU) {
                    menuAnimation.stop();
                    AudioManager.stopMusic();
                    console.log('[App Event] Animazione menu e musica fermate automaticamente.');
                } else {
                    AudioManager.stopMusic();
                    console.log('[App Event] Musica fermata.');
                }
            });

            App.addListener('resume', () => {
                console.log('[App Event] App tornata in foreground (resume event).');
                if (currentGameState === GAME_STATE.MENU) {
                    initializeMenu();
                    console.log('[App Event] Menu animazione e musica riprese automaticamente.');
                } else if (currentGameState === GAME_STATE.PAUSE) {
                    console.log('[App Event] Gioco era in pausa. Torna allo schermo di pausa, attende Resume.');
                }
            });
        } else {
            console.error('[Main.js] Plugin App di Capacitor non trovato. I listener di pausa/resume non saranno attivi.');
        }
    }

    window.returnToMainMenu = async () => {
        stopGameLoop();
        const gameContainerWrapper = document.getElementById('game-container-wrapper');
        const scoreInputContainer = document.getElementById('scoreInputContainerDonkey');
        const mobileControlsDiv = document.getElementById('mobileControls');

        if (gameContainerWrapper) gameContainerWrapper.style.display = 'none';
        if (scoreInputContainer) scoreInputContainer.style.display = 'none';
        if (mobileControlsDiv) mobileControlsDiv.style.display = 'none';

        const topBarLeft = document.getElementById('top-bar-left');
        const topBarRight = document.getElementById('top-bar-right');
        if (topBarLeft) topBarLeft.style.display = 'flex';
        if (topBarRight) topBarRight.style.display = 'flex';

        if (currentUserData) {
            try {
                const avatarIconImg = document.getElementById('user-avatar-icon');
                const accountContainer = document.getElementById('account-icon-container');

                if (avatarIconImg) {
                    let photoURLToUse;
                    if (currentUserData.photoURL) {
                        photoURLToUse = currentUserData.photoURL;
                    } else if (currentUserData.avatarSeed) {
                        photoURLToUse = generateBlockieAvatar(currentUserData.avatarSeed, 50);
                    } else {
                        photoURLToUse = generateBlockieAvatar(currentUserData.userId, 50);
                    }
                    avatarIconImg.src = photoURLToUse;
                    avatarIconImg.style.display = 'block';

                    if (accountContainer) {
                        accountContainer.style.display = 'flex';
                        accountContainer.classList.add('is-avatar-container');
                    }
                }
            } catch (error) {
                console.error("Error re-fetching user data for avatar:", error);
                showToast("Error loading profile icon.", "error");
            }
        }

        initializeMenu();
        MissionManager.resetMissions();
        window.dispatchEvent(new CustomEvent('rainStatusChanged', { detail: { isRaining: false } }));
    };
});

/**
 * NUOVA FUNZIONE ESPORTATA: Aggiorna l'animazione del menu dopo un cambiamento.
 * Questa è la funzione chiave per risolvere la race condition.
 */
export async function updateMenuVisuals() {
    console.log("[main.js] Chiamata a updateMenuVisuals() per aggiornare l'animazione del menu.");

    // 1. Ricarica i dati utente più recenti per assicurarti di avere l'inventario aggiornato.
    const localUserId = getCurrentUserId();
    if (!localUserId) {
        console.error("updateMenuVisuals: User ID non disponibile.");
        return;
    }

    try {
        const freshUserData = await getUser(localUserId);
        if (freshUserData) {
            // Aggiorna l'oggetto globale currentUserData
            Object.assign(currentUserData, freshUserData);
            console.log("[main.js] Dati utente ricaricati per l'aggiornamento visivo.");

            // 2. Chiama la funzione specifica di menuAnimation per aggiornare solo la grafica.
            if (menuAnimation) {
                menuAnimation.updateMenuPlayerDisplay(currentUserData);
                showToast('_Update: successful', 'success');
            }
        }
    } catch (error) {
        console.error("Errore durante l'aggiornamento dei dati utente per il menu:", error);
        showToast('Error updating view.', 'error');
    }
}