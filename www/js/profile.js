// www/js/profile.js

// Importa solo le funzioni di IndexedDB
import { openOfflineDB, getUser, saveUser } from './offlineDb.js';

import { showToast } from './toastNotifications.js';
import { generateBlockieAvatar } from './main.js'; // generateBlockieAvatar è ora in main.js
import * as BadgeManager from './badgeManager.js'; // BadgeManager verrà adattato in seguito

// currentUserData è ora una variabile globale gestita in main.js
// La importiamo qui per accedervi.
import { currentUserData, getCurrentUserId, initializeMenu } from './main.js';


// Catalogo degli oggetti cosmetici (mantenuto per handleEquipItem e shopManager)
const cosmeticCatalog = {
    'skin_donkey_default_info': { price: 2000, name: 'Donkey Basic', type: 'donkeySkin', icon: 'monitor-play', preview_asset: 'images/shop_previews/skin_info_preview.gif' }, // Added price for completeness
    'skin_bullet_log': { price: 1500, name: 'Log Bullets', type: 'bulletSkin', icon: 'files', preview_asset: 'images/shop_previews/bullet_log_style.gif' }, // Added price
    'skin_donkey_golden_walk': { price: 7500, name: 'Golden Donkey', type: 'donkeySkin', icon: 'sparkle', preview_asset: 'images/shop_previews/donkey_golden_walk_preview.gif' }, // Added price
    'skin_bullet_firewall': { price: 4000, name: 'Firewall Packets', type: 'bulletSkin', icon: 'shield', preview_asset: 'images/shop_previews/bullet_firewall_style.gif' }, // Added price
    // --- INIZIO NUOVE SKIN ACQUISTABILI ---
    'skin_donkey_cyberpunk': { price: 10000, name: 'Donkey Cyberpunk', type: 'donkeySkin', icon: 'robot', preview_asset: 'images/shop_previews/donkey_cyberpunk_walk_preview.gif' },
    'skin_donkey_vintage': { price: 6000, name: 'Donkey Vintage', type: 'donkeySkin', icon: 'cassette-tape', preview_asset: 'images/shop_previews/donkey_vintage_walk_preview.gif' },
    'skin_donkey_pixelart': { price: 15000, name: 'Donkey Pixel-Art', type: 'donkeySkin', icon: 'square', preview_asset: 'images/shop_previews/donkey_pixel_walk_preview.gif' },
    'skin_donkey_malware': { price: 8000, name: 'Donkey Malware', type: 'donkeySkin', icon: 'skull', preview_asset: 'images/shop_previews/donkey_malware_preview.gif' },
    'skin_donkey_antivirus': { price: 12000, name: 'Donkey Antivirus', type: 'donkeySkin', icon: 'shield-check', preview_asset: 'images/shop_previews/donkey_antivirus_preview.gif' },
    'skin_donkey_async': { price: 9500, name: 'Donkey Async', type: 'donkeySkin', icon: 'infinity', preview_asset: 'images/shop_previews/donkey_async_preview.gif' },
    'skin_donkey_javascript': { price: 11000, name: 'Donkey JavaScript', type: 'donkeySkin', icon: 'code', preview_asset: 'images/shop_previews/donkey_javascript_preview.gif' },
    'skin_donkey_dev':{price: 10000, name: 'Donkey Dev', type: 'donkeySkin', icon: 'code', preview_asset: 'images/shop_previews/skin_donkey_dev_preview.gif' },
    'skin_bullet_binary': { price: 3000, name: 'Binary Bombs', type: 'bulletSkin', icon: 'binary', preview_asset: 'images/shop_previews/bullet_binary_style.gif' },
    'skin_bullet_error': { price: 2500, name: 'Error Packets', type: 'bulletSkin', icon: 'bug-beetle', preview_asset: 'images/shop_previews/bullet_error_skin.gif' },
    'skin_bullet_cyberwrath': { price: 5500, name: 'CyberWrath Bullets', type: 'bulletSkin', icon: 'flame', preview_asset: 'images/shop_previews/bullet_cyberwrath_style.gif' },
    'skin_bullet_necron': { price: 6000, name: 'Necron Bullets', type: 'bulletSkin', icon: 'atom', preview_asset: 'images/shop_previews/bullet_necron_style.gif' },
    'skin_bullet_arcade': { price: 3500, name: 'Arcade Bullets', type: 'bulletSkin', icon: 'game-controller', preview_asset: 'images/shop_previews/bullet_arcade_style.gif' },
    // --- FINE NUOVE SKIN ACQUISTABILI ---
    // Aggiunta delle entry per le skin di default per il locker
    'default_donkey': { name: 'Default Donkey', type: 'donkeySkin', icon: 'monitor-play', isDefault: true, preview_asset: 'images/shop_previews/default_donkey_skin.gif' },
    'default_bullet': { name: 'Default Bullets', type: 'bulletSkin', icon: 'dot-outline', isDefault: true, preview_asset: 'images/shop_previews/default_bullet_style.gif' },
    // --- INIZIO SKIN SBLOCCABILI TRAMITE BADGE ---
    'skin_donkey_score_legend': { name: 'Score Legend Donkey', type: 'donkeySkin', icon: 'star', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_score_legend_preview.gif' },
    'skin_donkey_bug_whisperer': { name: 'Bug Whisperer Donkey', type: 'donkeySkin', icon: 'bug', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_bug_whisperer_preview.gif' },
    'skin_donkey_jumper_legend': { name: 'Jumper Legend Donkey', type: 'donkeySkin', icon: 'arrow-circle-up', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_jumper_legend_preview.gif' },
    'skin_bullet_code_storm': { name: 'Code Storm Bullets', type: 'bulletSkin', icon: 'cloud-lightning', badgeUnlock: true, preview_asset: 'images/bullets/badge_bullets/bullet_code_storm_style.png' }, // Corretto percorso
    'skin_donkey_bit_overlord': { name: 'Bit Overlord Donkey', type: 'donkeySkin', icon: 'coin', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_bit_overlord_preview.gif' },
    'skin_donkey_mission_legend': { name: 'Mission Legend Donkey', type: 'donkeySkin', icon: 'flag', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_mission_legend_preview.gif' },
    'skin_donkey_powerup_overlord': { name: 'Power-Up Overlord Donkey', type: 'donkeySkin', icon: 'lightning', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_powerup_overlord_preview.gif' },
    'skin_donkey_data_guru': { name: 'Data Guru Donkey', type: 'donkeySkin', icon: 'database', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_data_guru_preview.gif' },

    'skin_donkey_fruit_master': {
        name: 'Fruit Master Donkey',
        type: 'donkeySkin',
        icon: 'apple',
        badgeUnlock: true,
        badgeId: 'multi_fruit_eater_badge',
        preview_asset: 'images/shop_previews/skin_donkey_fruit_master_preview.gif'
    },
    'skin_donkey_fruit_overlord': {
        name: 'Fruit Overlord Donkey',
        type: 'donkeySkin',
        icon: 'trophy',
        badgeUnlock: true,
        badgeId: 'digital_fruit_collector_5',
        preview_asset: 'images/shop_previews/skin_donkey_fruit_overlord_preview.gif'
    },

    'skin_donkey_glitchzilla_slayer': { name: 'Glitchzilla Slayer Donkey', type: 'donkeySkin', icon: 'bug-beetle', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_glitchzilla_slayer_preview.gif' },
    'skin_donkey_trojan_slayer': { name: 'Trojan Slayer Donkey', type: 'donkeySkin', icon: 'virus', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_trojan_slayer_preview.gif' },
    'skin_donkey_missing_slayer': { name: 'Missing Slayer Donkey', type: 'donkeySkin', icon: 'question', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_missing_slayer_preview.gif' },
    'skin_donkey_dunno_slayer': { name: 'DUNNO.EXE Slayer Donkey', type: 'donkeySkin', icon: 'file-x', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_dunno_slayer_preview.gif' },
    // --- FINE SKIN SBLOCCABILI TRAMITE BADGE ---
    // AGGIUNGI I COMPAGNI AL CATALOGO COSMETICO
    'companion_cloud_assistant': { price: 5000, name: 'Cloud Assistant', type: 'companion', icon: 'cloud', preview_asset: 'images/shop_previews/companion_cloud_assistant_preview.gif', currency: 'digital_fruits' }, // <-- AGGIUNTA currency
    'companion_debuggator_ia': { price: 8000, name: 'Debuggator IA', type: 'companion', icon: 'bug-droid', preview_asset: 'images/shop_previews/companion_debuggator_ia_preview.gif', currency: 'digital_fruits' }, // <-- AGGIUNTA currency
    'companion_kernel_4_2': { price: 12000, name: 'Kernel 4.2', type: 'companion', icon: 'brain', preview_asset: 'images/shop_previews/companion_kernel_4_2_preview.gif', currency: 'digital_fruits' }, // <-- AGGIUNTA currency

    // Aggiungi i power-up permanenti al catalogo cosmetico
    'powerup_extra_life': { price: 10000, name: 'Extra Life Module', type: 'permanentPowerup', icon: 'heart', preview_asset: 'images/shop_previews/powerup_extra_life_preview.gif' },
    'permanent_powerup_bit_magnet': { price: 7500, name: 'Bit Magnet', type: 'permanentPowerup', icon: 'magnet', preview_asset: 'images/shop_previews/powerup_bit_magnet_preview.gif' },
'permanent_powerup_double_shot': { 
    price: 300, 
    name: 'Double Shot', 
    type: 'permanentPowerup', 
    icon: 'crosshair', 
    preview_asset: 'images/shop_previews/powerup_double_shot_preview.gif', // Nota: questo file immagine va creato
    currency: 'digital_fruits' 
},
};

// Variabile globale per tenere traccia della tab attiva nella modale
let activeTab = 'donkeySkin'; // Default, assicurati che sia accessibile

/**
 * Funzione principale per aprire e popolare la modale del profilo
 * @param {object} user - L'oggetto utente locale (currentUserData da main.js).
 */
export async function openProfileModal(user) {
    if (!user) {
        console.error("openProfileModal: User data non fornito. Reinizializzazione utente locale.");
        showToast("Nessun profilo utente locale disponibile. Riprova.", "error");
        // Potrebbe essere necessario un meccanismo per forzare initializeLocalUser() qui
        // se l'utente è null e la modale viene aperta (ad es. un click sull'icona avatar)
        return;
    }
    const profileModal = document.getElementById('profileModal');
    if (!profileModal) {
        console.error("Elemento 'profileModal' non trovato nel DOM.");
        return;
    }
    profileModal.style.display = 'flex';

    try {
        renderProfileStats(user);

        // Assicurati che la scheda "Stats" sia attiva per default all'apertura
        // Simula il click sul pulsante "Stats"
        const statsButton = document.getElementById('profile-nav-stats');
        if (statsButton) {
            statsButton.click();
        } else {
            console.warn("Elemento 'profile-nav-stats' non trovato. Impossibile attivare la scheda Statistiche per default.");
        }
    } catch (error) {
        console.error("Errore nell'aprire la modale del profilo:", error);
        showToast('Impossibile caricare il profilo.', 'error');
    }
}

/**
 * Renderizza la sezione Statistiche del profilo
 * @param {object} userData - I dati dell'utente locale.
 */
function renderProfileStats(userData) {
    const gameStats = userData.gameStats || {};
    const avatarSeed = userData.avatarSeed || userData.userId; // Usa userId locale come fallback
    const avatarSrc = userData.photoURL || generateBlockieAvatar(avatarSeed, 80);

    const profileModalAvatar = document.getElementById('profile-modal-avatar');
    if (profileModalAvatar) {
        profileModalAvatar.src = avatarSrc;
    } else {
        console.error("Elemento 'profile-modal-avatar' non trovato nel DOM.");
    }

    document.getElementById('profile-modal-name').textContent = userData.nickname || 'Offline Player';
    document.getElementById('profile-modal-email').textContent = userData.email || 'N/A';
    document.getElementById('profile-modal-highest-score').textContent = gameStats.highestScore || 0;
    document.getElementById('profile-modal-total-score').textContent = gameStats.totalScore || 0;
    document.getElementById('profile-modal-games-played').textContent = gameStats.totalGamesPlayed || 0;
    document.getElementById('profile-modal-bosses-defeated').innerHTML = `${gameStats.bossesDefeated || 0}<span class="blinking-cursor">_</span>`;

    const editNicknameBtn = document.getElementById('edit-nickname-btn');
    if (editNicknameBtn) {
        editNicknameBtn.disabled = false;
        editNicknameBtn.title = 'Modifica Nickname';
    } else {
        console.warn("Elemento 'edit-nickname-btn' non trovato nel DOM.");
    }

    // Rimuovi o nascondi il vecchio contenitore dei badge se esiste ancora nel DOM
    const oldBadgesContainer = document.getElementById('profile-modal-badges-container-old');
    if (oldBadgesContainer) {
        oldBadgesContainer.innerHTML = '';
        // oldBadgesContainer.remove(); // Se vuoi rimuoverlo completamente
    }
}


/**
 * Funzione generica per creare una card di un oggetto (skin, compagno, powerup)
 * @param {string} itemId - L'ID dell'oggetto nel cosmeticCatalog.
 * @param {object} equippedItems - L'oggetto contenente gli ID degli item equipaggiati per ogni tipo (es. { donkeySkin: 'skin_id', companion: 'comp_id', permanentPowerups: ['powerup_id'] }).
 * @param {string} itemType - Il tipo di oggetto ('donkeySkin', 'bulletSkin', 'companion', 'permanentPowerup').
 * @returns {string} La stringa HTML della card.
 */
function createItemCard(itemId, equippedItems, itemType) {
    const item = cosmeticCatalog[itemId];
    if (!item) {
        console.warn(`Item with ID ${itemId} not found in cosmeticCatalog.`);
        return '';
    }

    let isEquipped = false;
    let buttonText = 'Equip';
    let buttonDisabled = '';

    // Logica specifica per i potenziamenti permanenti
    if (itemType === 'permanentPowerup') {
        isEquipped = Array.isArray(equippedItems.permanentPowerups) && equippedItems.permanentPowerups.includes(itemId);
        if (isEquipped) {
            buttonText = 'Deactivate'; // Se equipaggiato, mostra "Deactivate"
        }
    } else { // Logica per skin e compagni
        isEquipped = (itemId === equippedItems[itemType]) || (item.isDefault && (!equippedItems[itemType] && itemId.startsWith('default_')));
        if (isEquipped) {
            buttonText = 'On';
            buttonDisabled = 'disabled'; // Il pulsante 'On' è disabilitato
        }
    }

    const previewContent = item.preview_asset
        ? `<img src="${item.preview_asset}" alt="${item.name} Preview" class="item-shop-preview-asset">`
        : `<i class="ph-bold ph-${item.icon || 'question'}" style="font-size: 48px; color: #666;"></i>`;

    return `
        <div class="item-card ${item.isDefault ? 'default-item-card' : ''}" data-item-id="${itemId}" data-item-type="${itemType}">
            <div class="item-preview">
                ${previewContent}
            </div>
            <div class="item-name">
                <span>${item.name}</span>
            </div>
            <button class="equip-button ${isEquipped ? 'equipped' : ''}" ${buttonDisabled}>${buttonText}</button>
        </div>
    `;
}

/**
 * Gestisce l'attivazione delle schede all'interno delle modali (Skins, Companions, Powerups).
 * @param {HTMLElement} modalElement - L'elemento della modale (es. skinsModal).
 * @param {string} activeTabId - L'ID del pulsante della scheda attiva (es. 'donkeySkin', 'companion', 'permanentPowerup', 'all', 'equipped', 'active').
 * @param {object} userData - I dati dell'utente, inclusi inventory.unlockedItems e inventory.equipped.
 */
async function activateItemTab(modalElement, activeTabId, userData) {
    const navButtons = modalElement.querySelectorAll('.category-btn');
    const itemContainer = modalElement.querySelector('.item-grid-container'); // Contenitore principale degli item
    const inventory = userData.inventory || {};
    const unlockedItems = inventory.unlockedItems || [];
    const equipped = inventory.equipped || {};

    // Disattiva tutti i pulsanti e svuota il contenitore
    navButtons.forEach(btn => btn.classList.remove('active'));
    itemContainer.innerHTML = ''; // Svuota il contenuto precedente

    // Attiva il pulsante cliccato
    const clickedButton = modalElement.querySelector(`[data-type-filter="${activeTabId}"]`);
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    let itemsToRender = [];
    let currentEquipped = {
        donkeySkin: equipped.donkeySkin,
        bulletSkin: equipped.bulletSkin,
        companion: equipped.companion,
        permanentPowerups: equipped.permanentPowerups || []
    }; // Oggetto per tenere traccia degli item equipaggiati per il rendering

    switch (modalElement.id) {
        case 'skinsModal':
            if (activeTabId === 'donkeySkin') {
                itemsToRender = [
                    ...unlockedItems.filter(id => cosmeticCatalog[id] && cosmeticCatalog[id].type === 'donkeySkin' && id !== 'skin_donkey_default_info'),
                    'default_donkey' // Aggiungi la skin di default
                ].sort();
            } else if (activeTabId === 'bulletSkin') {
                itemsToRender = [
                    ...unlockedItems.filter(id => cosmeticCatalog[id] && cosmeticCatalog[id].type === 'bulletSkin' && id !== 'skin_bullet_log'),
                    'default_bullet' // Aggiungi la skin di default
                ].sort();
            } else if (activeTabId === 'all') {
                itemsToRender = [
                    ...unlockedItems.filter(id => cosmeticCatalog[id] && (cosmeticCatalog[id].type === 'donkeySkin' || cosmeticCatalog[id].type === 'bulletSkin')),
                    'default_donkey',
                    'default_bullet'
                ].sort();
            }
            break;
        case 'companionsModal':
            if (activeTabId === 'companion' || activeTabId === 'available') { // 'available' per coerenza con il testo
                itemsToRender = unlockedItems.filter(id => cosmeticCatalog[id] && cosmeticCatalog[id].type === 'companion').sort();
            } else if (activeTabId === 'equipped') {
                if (equipped.companion && cosmeticCatalog[equipped.companion]) {
                    itemsToRender.push(equipped.companion);
                }
            }
            break;
        case 'powerupsModal':
            console.log("DEBUG: Entered powerupsModal case in activateItemTab."); // Debug log
            console.log("DEBUG: unlockedItems from userData:", unlockedItems); // Debug log
            console.log("DEBUG: unlockedItems array content before filtering (Powerups Modal):", unlockedItems);
            if (activeTabId === 'permanentPowerup' || activeTabId === 'available') { // 'available' per coerenza con il testo
                itemsToRender = unlockedItems.filter(id => cosmeticCatalog[id] && cosmeticCatalog[id].type === 'permanentPowerup').sort();
                console.log("DEBUG: Filtered itemsToRender for 'permanentPowerup'/'available' tab:", itemsToRender); // Debug log
            } else if (activeTabId === 'active') {
                itemsToRender = (equipped.permanentPowerups || []).filter(id => cosmeticCatalog[id]).sort();
                console.log("DEBUG: Filtered itemsToRender for 'active' tab:", itemsToRender); // Debug log
            }
            break;
    }

    let contentHTML = `<div class="item-grid">`;
    if (itemsToRender.length > 0) {
        itemsToRender.forEach(id => {
            // Passa l'intero oggetto equipped per una logica di `isEquipped` più flessibile
            contentHTML += createItemCard(id, currentEquipped, cosmeticCatalog[id].type);
        });
    } else {
        contentHTML += `<p>No items available in this category.</p>`;
    }

    // Aggiungi l'opzione "Nessun Compagno" solo per la modale dei compagni e la scheda "Disponibili"
    if (modalElement.id === 'companionsModal' && (activeTabId === 'companion' || activeTabId === 'available')) {
        contentHTML += `
            <div class="item-card" data-item-id="null_companion" data-item-type="companion">
                <div class="item-preview">
                    <i class="ph-bold ph-x-circle" style="font-size: 48px; color: #666;"></i>
                </div>
                <div class="item-name">
                    <span>No Companion</span>
                </div>
                <button class="equip-button ${!equipped.companion ? 'equipped' : ''}" ${!equipped.companion ? 'disabled' : ''}>
                    ${!equipped.companion ? 'Equip' : 'On'}
                </button>
            </div>
        `;
    }
    contentHTML += `</div>`;
    itemContainer.innerHTML = contentHTML;
    addEquipListeners(itemContainer); // Ri-attacca i listener ai nuovi pulsanti
}


/**
 * Renderizza la modale delle Skins.
 * @param {object} initialUserData - Parametro mantenuto per compatibilità, ma useremo dati freschi.
 */
export async function renderSkinsModal(initialUserData) {
    const skinsModal = document.getElementById('skinsModal');
    if (!skinsModal) {
        console.error("Elemento skinsModal non trovato.");
        showToast("Errore: Impossibile visualizzare le Skins.", "error");
        return;
    }
    skinsModal.style.display = 'flex';

    // *** INIZIO MODIFICA: Ricarica i dati utente più freschi dal database ***
    const localUserId = getCurrentUserId();
    if (!localUserId) {
        console.error("renderSkinsModal: User ID non disponibile. Impossibile caricare il profilo.");
        showToast("Errore: Impossibile caricare il profilo utente.", "error");
        return;
    }
    const freshUserData = await getUser(localUserId); // Ricarica i dati freschi da IndexedDB
    if (!freshUserData) {
        console.error("renderSkinsModal: Dati utente non trovati nel DB locale.");
        showToast("Errore: Dati utente non trovati.", "error");
        return;
    }
    // Sincronizza il currentUserData globale con i dati freschi per garantire coerenza in tutta l'app
    Object.assign(currentUserData, freshUserData);
    console.log("DEBUG: renderSkinsModal - Dati utente ricaricati dal DB per rendering:", currentUserData.inventory?.equipped);
    // *** FINE MODIFICA ***

    // Inizializza i listener per le schede solo una volta
    const nav = skinsModal.querySelector('#skins-categories-nav');
    if (!nav.dataset.listenersInitialized) {
        nav.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Ora activateItemTab userà sempre l'oggetto currentUserData appena aggiornato
                activateItemTab(skinsModal, button.dataset.typeFilter, currentUserData);
            });
        });
        nav.dataset.listenersInitialized = 'true';
    }

    // Attiva la scheda di default (es. 'donkeySkin') all'apertura
    activateItemTab(skinsModal, 'donkeySkin', currentUserData);
}
/**
 * Renderizza la modale dei Companions.
 * @param {object} initialUserData - Parametro mantenuto per compatibilità, ma useremo dati freschi.
 */
export async function renderCompanionsModal(initialUserData) {
    const companionsModal = document.getElementById('companionsModal');
    if (!companionsModal) {
        console.error("Elemento companionsModal non trovato.");
        showToast("Errore: Impossibile visualizzare i Compagni.", "error");
        return;
    }
    companionsModal.style.display = 'flex';

    // *** INIZIO MODIFICA: Ricarica i dati utente più freschi dal database ***
    const localUserId = getCurrentUserId();
    if (!localUserId) {
        console.error("renderCompanionsModal: User ID non disponibile. Impossibile caricare il profilo.");
        showToast("Errore: Impossibile caricare il profilo utente.", "error");
        return;
    }
    const freshUserData = await getUser(localUserId);
    if (!freshUserData) {
        console.error("renderCompanionsModal: Dati utente non trovati nel DB locale.");
        showToast("Errore: Dati utente non trovati.", "error");
        return;
    }
    Object.assign(currentUserData, freshUserData); // Sincronizza il globale
    console.log("DEBUG: renderCompanionsModal - Dati utente ricaricati dal DB per rendering:", currentUserData.inventory?.equipped);
    // *** FINE MODIFICA ***

    const nav = companionsModal.querySelector('#companions-categories-nav');
    if (!nav.dataset.listenersInitialized) {
        nav.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', () => {
                activateItemTab(companionsModal, button.dataset.typeFilter, currentUserData);
            });
        });
        nav.dataset.listenersInitialized = 'true';
    }

    activateItemTab(companionsModal, 'companion', currentUserData); // Scheda di default
}

/**
 * Renderizza la modale dei Power-Ups Permanenti.
 * @param {object} initialUserData - Parametro mantenuto per compatibilità, ma useremo dati freschi.
 */
export async function renderPowerupsModal(initialUserData) {
    const powerupsModal = document.getElementById('powerupsModal');
    if (!powerupsModal) {
        console.error("Elemento powerupsModal non trovato.");
        showToast("Errore: Impossibile visualizzare i Power-Ups.", "error");
        return;
    }
    powerupsModal.style.display = 'flex';

    // *** INIZIO MODIFICA: Ricarica i dati utente più freschi dal database ***
    const localUserId = getCurrentUserId();
    if (!localUserId) {
        console.error("renderPowerupsModal: User ID non disponibile. Impossibile caricare il profilo.");
        showToast("Errore: Impossibile caricare il profilo utente.", "error");
        return;
    }
    const freshUserData = await getUser(localUserId);
    if (!freshUserData) {
        console.error("renderPowerupsModal: Dati utente non trovati nel DB locale.");
        showToast("Errore: Dati utente non trovati.", "error");
        return;
    }
    Object.assign(currentUserData, freshUserData); // Sincronizza il globale
    console.log("DEBUG: renderPowerupsModal - Dati utente ricaricati dal DB per rendering:", currentUserData.inventory?.equipped);
    // *** FINE MODIFICA ***

    const nav = powerupsModal.querySelector('#powerups-categories-nav');
    if (!nav.dataset.listenersInitialized) {
        nav.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', () => {
                activateItemTab(powerupsModal, button.dataset.typeFilter, currentUserData);
            });
        });
        nav.dataset.listenersInitialized = 'true';
    }

    activateItemTab(powerupsModal, 'permanentPowerup', currentUserData); // Scheda di default
}

/**
 * Aggiunge i listener per i pulsanti "Equipaggia" all'interno di un contenitore specifico.
 * @param {HTMLElement} container - L'elemento contenitore che contiene i pulsanti di equipaggiamento.
 */
function addEquipListeners(container) {
    // RIMUOVI LE SEGUENTI RIGHE: Non sono più necessarie dopo innerHTML = ''
    /*
    container.querySelectorAll('.equip-button').forEach(button => {
        const newButton = button.cloneNode(true); // Create a clone without listeners
        button.parentNode.replaceChild(newButton, button); // Replace the old button with the clone
    });
    */

    // Aggiungi i nuovi listener a TUTTI i pulsanti appena renderizzati.
    // Questi pulsanti sono nuovi elementi, quindi non avranno listener duplicati.
    container.querySelectorAll('.equip-button').forEach(button => {
        const card = button.closest('.item-card');
        const itemId = card.dataset.itemId;
        const itemType = card.dataset.itemType;

        // Attacca il listener solo se il pulsante non è disabilitato (es. già equipaggiato)
        if (!button.disabled) {
            button.addEventListener('click', async (e) => {
                e.preventDefault(); // Previeni l'azione di default
                const actualItemIdToSend = (itemId === 'null_companion') ? null : itemId;
                await handleEquipItem(actualItemIdToSend, itemType);
            });
        }
    });
}


/**
 * Gestisce l'equipaggiamento di un oggetto (skin, compagno, powerup).
 * @param {string|null} itemId - L'ID dell'oggetto da equipaggiare, o null per disequipaggiare.
 * @param {string} itemType - Il tipo di oggetto ('donkeySkin', 'bulletSkin', 'companion', 'permanentPowerup').
 */
export async function handleEquipItem(itemId, itemType) {
    showToast('Applico la modifica...', 'info');
    const localUserId = getCurrentUserId();
    if (!currentUserData || currentUserData.userId !== localUserId) {
        console.error("currentUserData non disponibile o non corrisponde. Impossibile equipaggiare l'oggetto.");
        showToast('Errore: impossibile accedere ai dati utente locali.', 'error');
        return;
    }

    const buttons = document.querySelectorAll(`.equip-button[data-item-type="${itemType}"]`);
    buttons.forEach(b => b.disabled = true);

    try {
        if (!currentUserData.inventory) currentUserData.inventory = {};
        if (!currentUserData.inventory.equipped) currentUserData.inventory.equipped = {};
        
        const unlockedItems = currentUserData.inventory.unlockedItems || [];

        if (itemType === 'permanentPowerup') {
            if (!currentUserData.inventory.equipped.permanentPowerups) {
                currentUserData.inventory.equipped.permanentPowerups = [];
            }
            let currentPermanentPowerups = new Set(currentUserData.inventory.equipped.permanentPowerups);

            if (currentPermanentPowerups.has(itemId)) {
                // L'oggetto è equipaggiato -> lo disattivo
                currentPermanentPowerups.delete(itemId);
                showToast(`${cosmeticCatalog[itemId].name} disattivato!`, 'success');
            } else {
                // L'oggetto non è equipaggiato -> provo ad attivarlo
                if (currentPermanentPowerups.size >= 2) {
                    showToast("Puoi equipaggiare solo 2 potenziamenti permanenti.", "warning");
                    buttons.forEach(b => b.disabled = false);
                    return; // Interrompo perché il limite è stato raggiunto
                }
                if (!unlockedItems.includes(itemId)) {
                    showToast("Non possiedi questo potenziamento.", "error");
                    buttons.forEach(b => b.disabled = false);
                    return; // Interrompo perché l'utente non possiede l'oggetto
                }
                currentPermanentPowerups.add(itemId);
                showToast(`${cosmeticCatalog[itemId].name} attivato!`, 'success');
            }
            // Aggiorno l'inventario con il nuovo set di potenziamenti
            currentUserData.inventory.equipped.permanentPowerups = Array.from(currentPermanentPowerups);
        } else {
            // Logica esistente per skin e compagni
            const itemDetails = cosmeticCatalog[itemId];
            if (itemId === null || (itemDetails && itemDetails.isDefault)) {
                currentUserData.inventory.equipped[itemType] = null;
                showToast(`Default ${itemType} equipaggiato!`, 'success');
            } else {
                if (!unlockedItems.includes(itemId)) {
                    showToast("Non possiedi questo oggetto.", "error");
                    buttons.forEach(b => b.disabled = false);
                    return;
                }
                currentUserData.inventory.equipped[itemType] = itemId;
                showToast(`${itemDetails.name} equipaggiato!`, 'success');
            }
        }

        currentUserData.updatedAt = Date.now();
        await saveUser(currentUserData);
        initializeMenu();

        // Logica per ri-renderizzare le modali se aperte
        const openModals = {
            skinsModal: window.renderSkinsModal, // Assumi che queste funzioni siano globali o importate
            companionsModal: window.renderCompanionsModal,
            powerupsModal: window.renderPowerupsModal
        };

        for (const modalId in openModals) {
            const modalElement = document.getElementById(modalId);
            if (modalElement && modalElement.style.display === 'flex' && typeof openModals[modalId] === 'function') {
                await openModals[modalId](currentUserData);
            }
        }

        window.dispatchEvent(new CustomEvent('equippedItemChanged', {
            detail: { itemId, itemType, equippedItems: currentUserData.inventory.equipped }
        }));

    } catch (error) {
        console.error("Errore nell'equipaggiare l'oggetto localmente:", error);
        showToast(`Errore: ${error.message}`, 'error');
    } finally {
        buttons.forEach(b => b.disabled = false); // Riabilita sempre i pulsanti alla fine
    }
}

async function handleNicknameEdit() {
    const user = currentUserData;
    if (!user) {
        showToast('Nessun utente locale disponibile per la modifica del nickname.', 'error');
        return;
    }

    const editNicknameModal = document.getElementById('editNicknameModal');
    const newNicknameInput = document.getElementById('newNicknameInput');
    const nicknameCooldownMessage = document.getElementById('nicknameCooldownMessage');
    const saveNewNicknameBtn = document.getElementById('saveNewNicknameBtn');
    const closeEditNicknameModal = document.getElementById('closeEditNicknameModal');
    const profileModalName = document.getElementById('profile-modal-name');

    if (
        !editNicknameModal ||
        !newNicknameInput ||
        !saveNewNicknameBtn ||
        !closeEditNicknameModal ||
        !profileModalName
    ) {
        console.error('Elementi della modale di modifica nickname non trovati.');
        showToast('UI Error: Impossibile aprire la modale di modifica nickname.', 'error');
        return;
    }

    const currentNickname = user.nickname || 'Offline Player';
    newNicknameInput.value = currentNickname;

    if (nicknameCooldownMessage) {
        nicknameCooldownMessage.textContent = 'You can modify your nickname whenever you want.';
    }
    newNicknameInput.disabled = false;
    saveNewNicknameBtn.disabled = false;
    saveNewNicknameBtn.textContent = 'Salva';

    editNicknameModal.style.display = 'flex';

    saveNewNicknameBtn.removeEventListener('click', saveNicknameHandler);
    closeEditNicknameModal.removeEventListener('click', closeNicknameModalHandler);

    saveNewNicknameBtn.addEventListener('click', saveNicknameHandler);
    closeEditNicknameModal.addEventListener('click', closeNicknameModalHandler);

    async function saveNicknameHandler() {
        const newNickname = newNicknameInput.value.trim();
        const currentNicknameOnModal = profileModalName.textContent;

        if (newNickname === '') {
            showToast("Nickname can't be empty.", 'warning');
            return;
        }
        if (newNickname === currentNicknameOnModal) {
            showToast('Il nuovo nickname è uguale al precedente.', 'info');
            editNicknameModal.style.display = 'none';
            return;
        }

        saveNewNicknameBtn.disabled = true;
        saveNewNicknameBtn.textContent = 'Salvataggio...';

        try {
            currentUserData.nickname = newNickname;
            currentUserData.updatedAt = Date.now();
            currentUserData.profileUpdatedAt = Date.now();

            await saveUser(currentUserData);

            profileModalName.textContent = newNickname;
            showToast('Nickname aggiornato con successo!', 'success');
            document.getElementById('edit-nickname-btn').disabled = false;
            document.getElementById('edit-nickname-btn').title = 'Modifica Nickname';
            editNicknameModal.style.display = 'none';

            initializeMenu();

        } catch (error) {
            console.error("Errore durante l'aggiornamento del nickname locale:", error);
            showToast(`Errore: ${error.message}`, 'error');
            saveNewNicknameBtn.disabled = false;
            saveNewNicknameBtn.textContent = 'Salva';
        }
    }

    function closeNicknameModalHandler() {
        editNicknameModal.style.display = 'none';
    }
}

/**
 * Inizializza i controlli della modale del profilo.
 */
export function initProfileControls() {
    const profileModal = document.getElementById('profileModal');
    if (!profileModal) return;

    const closeProfileModal = document.getElementById('closeProfileModal');
    const editNicknameBtn = document.getElementById('edit-nickname-btn');
    const generateAvatarBtn = document.getElementById('generate-avatar-btn');
    const saveGeneratedAvatarBtn = document.getElementById('save-generated-avatar-btn');

    const statsBtn = document.getElementById('profile-nav-stats');
    const statsContent = document.getElementById('profile-stats-content');
    const badgesBtn = document.getElementById('profile-nav-badges');
    const badgesContent = document.getElementById('profile-badges-content');
    const optionsBtn = document.getElementById('profile-nav-options');
    const optionsContent = document.getElementById('profile-options-content');

    function activateProfileTab(activeBtn, activeContent) {
        statsBtn.classList.remove('active');
        badgesBtn.classList.remove('active');
        if (optionsBtn) optionsBtn.classList.remove('active');

        statsContent.classList.remove('active');
        badgesContent.classList.remove('active');
        if (optionsContent) optionsContent.classList.remove('active');

        activeBtn.classList.add('active');
        activeContent.classList.add('active');
    }

    statsBtn?.addEventListener('click', () => activateProfileTab(statsBtn, statsContent));
    badgesBtn?.addEventListener('click', async () => {
        activateProfileTab(badgesBtn, badgesContent);
        if (currentUserData) {
            showToast('Caricamento badge...', 'info');
            const userBadgesStatus = await BadgeManager.getUserBadgesStatus(currentUserData.userId);
            const badgesContainer = document.getElementById('profile-modal-badges-container');
            if (badgesContainer) {
                BadgeManager.renderBadges(badgesContainer, userBadgesStatus);
                showToast('Badge caricati!', 'success');
            } else {
                console.error("Elemento '#profile-modal-badges-container' non trovato.");
                showToast('Errore nel caricare i badge: contenitore non trovato.', 'error');
            }
        } else {
            showToast('Nessun profilo locale disponibile per visualizzare i badge.', 'warning');
            const badgesContainer = document.getElementById('profile-modal-badges-container');
            if (badgesContainer) {
                badgesContainer.innerHTML = '<p>Nessun profilo locale disponibile per visualizzare i badge.</p>';
            }
        }
    });

    optionsBtn?.addEventListener('click', () => {
        activateProfileTab(optionsBtn, optionsContent);
    });

    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            if (profileModal) profileModal.style.display = 'none';
        });
    }

    if (editNicknameBtn) {
        editNicknameBtn.addEventListener('click', handleNicknameEdit);
    }

    if (generateAvatarBtn) {
        generateAvatarBtn.addEventListener('click', handleGenerateRandomAvatar);
    }

    if (saveGeneratedAvatarBtn) {
        saveGeneratedAvatarBtn.addEventListener('click', handleSaveGeneratedAvatar);
    }

    if (window.Capacitor && Capacitor.isNativePlatform()) {
        const profileInputFields = [
            document.getElementById('newNicknameInput'),
        ];

        profileInputFields.forEach(input => {
            if (input) {
                input.addEventListener('focus', () => {
                    setTimeout(() => {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                });
            }
        });
    }
}

/**
 * Gestisce la generazione di un avatar casuale (solo UI).
 */
async function handleGenerateRandomAvatar() {
    const user = currentUserData;
    if (!user) {
        showToast('Nessun profilo locale disponibile per generare un avatar.', 'error');
        return;
    }

    const newSeed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newBlockieUrl = generateBlockieAvatar(newSeed, 80);

    const profileModalAvatar = document.getElementById('profile-modal-avatar');
    const saveGeneratedAvatarBtn = document.getElementById('save-generated-avatar-btn');

    if (profileModalAvatar) {
        profileModalAvatar.src = newBlockieUrl;
    }

    if (profileModalAvatar) {
        profileModalAvatar.dataset.pendingBlockieUrl = newBlockieUrl;
        profileModalAvatar.dataset.pendingAvatarSeed = newSeed;
    }

    if (saveGeneratedAvatarBtn) {
        saveGeneratedAvatarBtn.style.display = 'inline-flex';
        saveGeneratedAvatarBtn.disabled = false;
        showToast('Nuovo avatar generato. Clicca "Salva" per confermare.', 'info');
    }
}


/**
 * Salva l'avatar Blockie generato nella UI sul database locale.
 */
async function handleSaveGeneratedAvatar() {
    const user = currentUserData;
    if (!user) {
        showToast("Nessun profilo locale disponibile per salvare l'avatar.", 'error');
        return;
    }

    const profileModalAvatar = document.getElementById('profile-modal-avatar');
    const saveGeneratedAvatarBtn = document.getElementById('save-generated-avatar-btn');

    const pendingBlockieUrl = profileModalAvatar.dataset.pendingBlockieUrl;
    const pendingAvatarSeed = profileModalAvatar.dataset.pendingAvatarSeed;

    if (!pendingBlockieUrl || !pendingAvatarSeed) {
        showToast('Nessun avatar generato in attesa di salvataggio.', 'warning');
        return;
    }

    if (saveGeneratedAvatarBtn) {
        saveGeneratedAvatarBtn.disabled = true;
        saveGeneratedAvatarBtn.textContent = 'Salvataggio...';
    }

    try {
        currentUserData.photoURL = pendingBlockieUrl;
        currentUserData.profileUpdatedAt = Date.now();
        currentUserData.avatarSeed = pendingAvatarSeed;

        await saveUser(currentUserData);

        document.getElementById('profile-modal-avatar').src = pendingBlockieUrl;

        showToast('Avatar Blockie salvato con successo!', 'success');

        profileModalAvatar.removeAttribute('data-pending-blockie-url');
        profileModalAvatar.removeAttribute('data-pending-avatar-seed');
        if (saveGeneratedAvatarBtn) {
            saveGeneratedAvatarBtn.style.display = 'none';
            saveGeneratedAvatarBtn.disabled = false;
            saveGeneratedAvatarBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i>';
        }

        initializeMenu();

    } catch (error) {
        console.error("Errore durante il salvataggio dell'avatar Blockie locale:", error);
        showToast("Errore durante il salvataggio dell'avatar Blockie.", 'error');
        if (saveGeneratedAvatarBtn) {
            saveGeneratedAvatarBtn.disabled = false;
            saveGeneratedAvatarBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i>';
        }
    }
}