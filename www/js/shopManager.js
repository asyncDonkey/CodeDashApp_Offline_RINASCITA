// www/js/shopManager.js

// Rimosse le importazioni Firebase (getFirestore, doc, getDoc, updateDoc, FieldValue, increment, arrayUnion, arrayRemove, auth, db, functions)
// Rimosse le importazioni Cloud Functions (httpsCallable)

import { showToast } from './toastNotifications.js';
import { initializeMenu } from './main.js'; // Per aggiornare il menu dopo un acquisto
import { openOfflineDB, getUser, saveUser } from './offlineDb.js'; // Importa le funzioni di IndexedDB
import { currentUserData, getCurrentUserId } from './main.js'; // Importa currentUserData e getCurrentUserId
import { notifyPlayerTookDamage } from './missionManager.js';

// Catalogo degli oggetti cosmetici (duplicato da profile.js, assicurati che siano sempre sincronizzati)
// In un'applicazione offline, è comune avere il catalogo hardcoded o caricato da un file JSON locale.
// Catalogo degli oggetti cosmetici (duplicato da profile.js, assicurati che siano sempre sincronizzati)
const cosmeticCatalog = {
    //'skin_donkey_default_info': { price: 2000, name: 'Donkey Basic', type: 'donkeySkin', icon: 'monitor-play', preview_asset: 'images/shop_previews/skin_info_preview.gif' },
    //'skin_bullet_log': { price: 1500, name: 'Log Bullets', type: 'bulletSkin', icon: 'files', preview_asset: 'images/shop_previews/bullet_log_style.gif' },
    'skin_donkey_golden_walk': { price: 7500, name: 'Golden Donkey', type: 'donkeySkin', icon: 'sparkle', preview_asset: 'images/shop_previews/donkey_golden_walk_preview.gif' },
    'skin_bullet_firewall': { price: 4000, name: 'Firewall Packets', type: 'bulletSkin', icon: 'shield', preview_asset: 'images/shop_previews/bullet_firewall_style.gif' },
    // --- INIZIO NUOVE SKIN ACQUISTABILI ---
    'skin_donkey_cyberpunk': { price: 10000, name: 'Donkey Cyberpunk', type: 'donkeySkin', icon: 'robot', preview_asset: 'images/shop_previews/donkey_cyberpunk_walk_preview.gif' },
    'skin_donkey_vintage': { price: 6000, name: 'Donkey Vintage', icon: 'cassette-tape', preview_asset: 'images/shop_previews/donkey_vintage_walk_preview.gif' },
    'skin_donkey_pixelart': { price: 15000, name: 'Donkey Pixel-Art', type: 'donkeySkin', icon: 'square', preview_asset: 'images/shop_previews/donkey_pixel_walk_preview.gif' },
    'skin_donkey_malware': { price: 8000, name: 'Donkey Malware', type: 'donkeySkin', icon: 'skull', preview_asset: 'images/shop_previews/donkey_malware_preview.gif' },
    'skin_donkey_antivirus': { price: 12000, name: 'Donkey Antivirus', type: 'donkeySkin', icon: 'shield-check', preview_asset: 'images/shop_previews/donkey_antivirus_preview.gif' },
    'skin_donkey_async': { price: 9500, name: 'Donkey Async', type: 'donkeySkin', icon: 'infinity', preview_asset: 'images/shop_previews/donkey_async_preview.gif' },
    'skin_donkey_javascript': { price: 11000, name: 'Donkey JavaScript', type: 'donkeySkin', icon: 'code', preview_asset: 'images/shop_previews/donkey_javascript_preview.gif' },
    'skin_donkey_dev':{price: 10000,name: 'Donkey Dev', type: 'donkeySkin', icon: 'code', preview_asset: 'images/shop_previews/skin_donkey_dev_preview.gif' },
    'skin_bullet_binary': { price: 3000, name: 'Binary Bombs', type: 'bulletSkin', icon: 'binary', preview_asset: 'images/shop_previews/bullet_binary_style.gif' },
    'skin_bullet_error': { price: 2500, name: 'Error Packets', type: 'bulletSkin', icon: 'bug-beetle', preview_asset: 'images/shop_previews/bullet_error_skin.gif' },
    'skin_bullet_cyberwrath': { price: 5500, name: 'CyberWrath Bullets', type: 'bulletSkin', icon: 'flame', preview_asset: 'images/shop_previews/bullet_cyberwrath_style.gif' },
    'skin_bullet_necron': { price: 6000, name: 'Necron Bullets', type: 'bulletSkin', icon: 'atom', preview_asset: 'images/shop_previews/bullet_necron_style.gif' },
    'skin_bullet_arcade': { price: 3500, name: 'Arcade Bullets', type: 'bulletSkin', icon: 'game-controller', preview_asset: 'images/shop_previews/bullet_arcade_style.gif' },
    // --- FINE NUOVE SKIN ACQUISTABILI ---
    // Aggiunta delle entry per le skin di default per il locker (non acquistabili, solo per riferimento)
    'default_donkey': { price: 0, name: 'Default Donkey', type: 'donkeySkin', icon: 'monitor-play', isDefault: true, preview_asset: 'images/shop_previews/default_donkey_skin.gif' },
    'default_bullet': { price: 0, name: 'Default Bullets', type: 'bulletSkin', icon: 'dot-outline', isDefault: true, preview_asset: 'images/shop_previews/default_bullet_style.gif' },
    // --- INIZIO SKIN SBLOCCABILI TRAMITE BADGE (non acquistabili) ---
    'skin_donkey_score_legend': { price: 0, name: 'Score Legend Donkey', type: 'donkeySkin', icon: 'star', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_score_legend_preview.gif' },
    'skin_donkey_bug_whisperer': { price: 0, name: 'Bug Whisperer Donkey', type: 'donkeySkin', icon: 'bug', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_bug_whisperer_preview.gif' },
    'skin_donkey_jumper_legend': { price: 0, name: 'Jumper Legend Donkey', type: 'donkeySkin', icon: 'arrow-circle-up', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_jumper_legend_preview.gif' },
    'skin_bullet_code_storm': { price: 0, name: 'Code Storm Bullets', type: 'bulletSkin', icon: 'cloud-lightning', badgeUnlock: true, preview_asset: 'images/bullets/badge_bullets/bullet_code_storm_style.png' },
    'skin_donkey_bit_overlord': { price: 0, name: 'Bit Overlord Donkey', type: 'donkeySkin', icon: 'coin', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_bit_overlord_preview.gif' },
    'skin_donkey_mission_legend': { price: 0, name: 'Mission Legend Donkey', type: 'donkeySkin', icon: 'flag', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_mission_legend_preview.gif' },
    'skin_donkey_powerup_overlord': { price: 0, name: 'Power-Up Overlord Donkey', type: 'donkeySkin', icon: 'lightning', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_powerup_overlord_preview.gif' },
    'skin_donkey_data_guru': { price: 0, name: 'Data Guru Donkey', type: 'donkeySkin', icon: 'database', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_data_guru_preview.gif' },
    'skin_donkey_fruit_master': { price: 0, name: 'Fruit Master Donkey', type: 'donkeySkin', icon: 'apple', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_fruit_master_preview.gif' },
    'skin_donkey_fruit_overlord': { price: 0, name: 'Fruit Overlord Donkey', type: 'donkeySkin', icon: 'trophy', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_fruit_overlord_preview.gif' },
    'skin_donkey_glitchzilla_slayer': { price: 0, name: 'Glitchzilla Slayer Donkey', type: 'donkeySkin', icon: 'bug-beetle', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_glitchzilla_slayer_preview.gif' },
    'skin_donkey_trojan_slayer': { price: 0, name: 'Trojan Slayer Donkey', type: 'donkeySkin', icon: 'virus', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_trojan_slayer_preview.gif' },
    'skin_donkey_missing_slayer': { price: 0, name: 'Missing Slayer Donkey', type: 'donkeySkin', icon: 'question', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_missing_slayer_preview.gif' },
    'skin_donkey_dunno_slayer': { price: 0, name: 'DUNNO.EXE Slayer Donkey', type: 'donkeySkin', icon: 'file-x', badgeUnlock: true, preview_asset: 'images/shop_previews/skin_donkey_dunno_slayer_preview.gif' },
    // --- FINE SKIN SBLOCCABILI TRAMITE BADGE ---
    // AGGIUNGI I COMPAGNI AL CATALOGO COSMETICO
    'companion_cloud_assistant': { price: 500, name: 'Cloud Assistant', type: 'companion', icon: 'cloud', preview_asset: 'images/shop_previews/companion_cloud_assistant_preview.gif', currency: 'digital_fruits' }, // <-- AGGIUNTA currency
    'companion_debuggator_ia': { price: 800, name: 'Debuggator IA', type: 'companion', icon: 'bug-droid', preview_asset: 'images/shop_previews/companion_debuggator_ia_preview.gif', currency: 'digital_fruits' }, // <-- AGGIUNTA currency
    'companion_kernel_4_2': { price: 1200, name: 'Kernel 4.2', type: 'companion', icon: 'brain', preview_asset: 'images/shop_previews/companion_kernel_4_2_preview.gif', currency: 'digital_fruits' }, // <-- AGGIUNTA currency
    
    /**
 * @todo change for production:
 * @todo Price set low for tests.
 */
    // Aggiungi i power-up permanenti al catalogo cosmetico
    'powerup_extra_life': { price: 10, name: 'Extra Life Module', type: 'permanentPowerup', icon: 'heart', preview_asset: 'images/shop_previews/powerup_extra_life_preview.gif' },
    //'permanent_powerup_bit_magnet': { price: 7500, name: 'Bit Magnet', type: 'permanentPowerup', icon: 'magnet', preview_asset: 'images/shop_previews/powerup_bit_magnet_preview.gif' },
    'permanent_powerup_double_shot': { 
    price: 5, 
    name: 'Double Shot', 
    type: 'permanentPowerup', 
    icon: 'crosshair', 
    preview_asset: 'images/shop_previews/powerup_double_shot_preview.gif', // Nota: questo file immagine va creato
    currency: 'digital_fruits' 
},
};

// --- Stato a livello di modulo per tenere traccia della scheda attiva ---
let activeShopTab = 'donkeySkin'; // Scheda di default

/**
 * Inizializza lo shop. Aggiunge i listener per la navigazione e renderizza la scheda di default.
 * Questa è la funzione di ingresso principale per lo shop.
 */
export async function initShop() {
    console.log("Inizializzazione negozio...");
    const shopNav = document.getElementById('shop-categories-nav');

    // Aggiunge i listener solo una volta, usando un flag
    if (shopNav && !shopNav.dataset.initialized) {
        shopNav.addEventListener('click', (event) => {
            const button = event.target.closest('.shop-category-btn');
            if (button) {
                const categoryType = button.dataset.category;
                if (categoryType) {
                    activeShopTab = categoryType; // Aggiorna lo stato della scheda attiva
                    renderShopItems(activeShopTab); // Renderizza il contenuto per la nuova scheda
                }
            }
        });
        shopNav.dataset.initialized = 'true';
    }

    // Renderizza il contenuto per la scheda attiva all'apertura
    await renderShopItems(activeShopTab);
}

/**
 * Renderizza tutti gli oggetti per una data categoria dello shop.
 * @param {string} category - La categoria da mostrare (es. 'donkeySkin').
 */
async function renderShopItems(category) {
    const shopContainer = document.getElementById('shop-item-grid-container');
    if (!shopContainer) {
        console.error("Contenitore degli oggetti dello shop non trovato!");
        return;
    }

    shopContainer.innerHTML = '<p>Caricamento...</p>';

    try {
        const user = await getUser(getCurrentUserId());
        if (!user) throw new Error("Dati utente non trovati.");

        // Aggiorna lo stato attivo sui bottoni di navigazione
        document.querySelectorAll('#shop-categories-nav .shop-category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        const userUnlockedItems = new Set(user.inventory?.unlockedItems || []);
        const itemsToDisplay = Object.entries(cosmeticCatalog)
            .map(([id, item]) => ({ id, ...item }))
            .filter(item =>
                item.type === category &&
                item.price > 0 &&
                !userUnlockedItems.has(item.id)
            )
            .sort((a, b) => a.price - b.price);

        if (itemsToDisplay.length === 0) {
            shopContainer.innerHTML = '<p>Nessun nuovo oggetto disponibile in questa categoria.</p>';
        } else {
            const cardsHTML = itemsToDisplay.map(item => createShopItemCard(item, user)).join('');
            shopContainer.innerHTML = `<div class="shop-items-grid">${cardsHTML}</div>`;
        }

        // Ri-attacca i listener ai nuovi bottoni di acquisto
        addPurchaseListeners(shopContainer);

    } catch (error) {
        console.error("Errore nel renderizzare gli oggetti dello shop:", error);
        shopContainer.innerHTML = `<p>Errore nel caricare lo shop. Riprova.</p>`;
    }
}

/**
 * Crea la card HTML per un singolo oggetto dello shop.
 */
function createShopItemCard(item, user) {
    const currencyType = item.currency || 'bits';
    const userCurrency = currencyType === 'digital_fruits'
        ? (user.gameStats?.totalDigitalFruits || 0)
        : (user.gameStats?.totalBits || 0);

    const canAfford = userCurrency >= item.price;
    const currencyIconClass = currencyType === 'digital_fruits' ? 'ph-orange' : 'ph-currency-btc';

    const previewContent = item.preview_asset
        ? `<img src="${item.preview_asset}" alt="${item.name}" class="item-shop-preview-asset">`
        : `<i class="ph-bold ph-${item.icon || 'question'}" style="font-size: 48px;"></i>`;

    return `
        <div class="shop-item-card" data-item-id="${item.id}">
            <div class="item-preview">${previewContent}</div>
            <div class="item-name"><span>${item.name}</span></div>
            <div class="item-price">
                <span>${item.price.toLocaleString()}</span>
                <i class="ph-bold ${currencyIconClass}"></i>
            </div>
            <button class="buy-button" ${!canAfford ? 'disabled' : ''}>
                ${canAfford ? 'Acquista' : 'Fondi insuff.'}
            </button>
        </div>
    `;
}

/**
 * Aggiunge i listener per i click sui bottoni di acquisto.
 */
function addPurchaseListeners(container) {
    container.querySelectorAll('.buy-button').forEach(button => {
        if (button.disabled) return;
        const card = button.closest('.shop-item-card');
        const itemId = card.dataset.itemId;
        button.addEventListener('click', () => handlePurchase(itemId));
    });
}

/**
 * Gestisce la logica di acquisto di un oggetto.
 */
async function handlePurchase(itemId) {
    const item = cosmeticCatalog[itemId];
    if (!item) {
        showToast("Oggetto non trovato!", "error");
        return;
    }

    showToast("Processo l'acquisto...", "info");

    try {
        const user = await getUser(getCurrentUserId());
        if (!user) throw new Error("Utente non trovato.");

        // Controlla la valuta e scala il prezzo
        const currencyType = item.currency || 'bits';
        if (currencyType === 'digital_fruits') {
            if ((user.gameStats.totalDigitalFruits || 0) < item.price) throw new Error("Frutti digitali insufficienti.");
            user.gameStats.totalDigitalFruits -= item.price;
        } else {
            if ((user.gameStats.totalBits || 0) < item.price) throw new Error("Bit insufficienti.");
            user.gameStats.totalBits -= item.price;
        }

        // Aggiunge l'oggetto all'inventario
        if (!user.inventory.unlockedItems) user.inventory.unlockedItems = [];
        user.inventory.unlockedItems.push(itemId);
        user.updatedAt = Date.now();

        // Salva le modifiche nel DB
        await saveUser(user);

        // Sincronizza lo stato globale e la UI
        Object.assign(currentUserData, user);
        window.dispatchEvent(new CustomEvent('menubitscollected'));

        showToast(`${item.name} acquistato con successo!`, "success");

        // --- IL FIX FONDAMENTALE ---
        // Dopo l'acquisto, renderizza di nuovo solo la scheda dello shop che era attiva.
        await renderShopItems(activeShopTab);

    } catch (error) {
        console.error("Errore durante l'acquisto:", error);
        showToast(`Acquisto fallito: ${error.message}`, "error");
        // Renderizza di nuovo la scheda per riattivare i bottoni in caso di errore
        await renderShopItems(activeShopTab);
    }
}