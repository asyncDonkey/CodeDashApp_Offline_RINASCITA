// www/js/shopManager.js

// Rimosse le importazioni Firebase (getFirestore, doc, getDoc, updateDoc, FieldValue, increment, arrayUnion, arrayRemove, auth, db, functions)
// Rimosse le importazioni Cloud Functions (httpsCallable)

import { showToast } from './toastNotifications.js';
import { initializeMenu } from './main.js'; // Per aggiornare il menu dopo un acquisto
import { openOfflineDB, getUser, saveUser } from './offlineDb.js'; // Importa le funzioni di IndexedDB
import { currentUserData, getCurrentUserId } from './main.js'; // Importa currentUserData e getCurrentUserId

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
    'companion_cloud_assistant': { price: 5000, name: 'Cloud Assistant', type: 'companion', icon: 'cloud', preview_asset: 'images/shop_previews/companion_cloud_assistant_preview.gif', currency: 'digital_fruits' }, // <-- AGGIUNTA currency
    'companion_debuggator_ia': { price: 8000, name: 'Debuggator IA', type: 'companion', icon: 'bug-droid', preview_asset: 'images/shop_previews/companion_debuggator_ia_preview.gif', currency: 'digital_fruits' }, // <-- AGGIUNTA currency
    'companion_kernel_4_2': { price: 12000, name: 'Kernel 4.2', type: 'companion', icon: 'brain', preview_asset: 'images/shop_previews/companion_kernel_4_2_preview.gif', currency: 'digital_fruits' }, // <-- AGGIUNTA currency

    // Aggiungi i power-up permanenti al catalogo cosmetico
    'powerup_extra_life': { price: 10000, name: 'Extra Life Module', type: 'permanentPowerup', icon: 'heart', preview_asset: 'images/shop_previews/powerup_extra_life_preview.gif' },
    //'permanent_powerup_bit_magnet': { price: 7500, name: 'Bit Magnet', type: 'permanentPowerup', icon: 'magnet', preview_asset: 'images/shop_previews/powerup_bit_magnet_preview.gif' },
};

const shopContentDiv = document.getElementById('shop-content');
const shopModal = document.getElementById('shopModal');
const shopCategoriesNav = document.getElementById('shop-categories-nav');
const shopItemGridContainer = document.getElementById('shop-item-grid-container');

// Variabile per tenere traccia dell'ID della skin attualmente visualizzata nella preview
let currentPreviewItemId = null;

/**
 * Funzione generica per creare una card di un oggetto nel negozio.
 * @param {object} itemObject - L'oggetto completo dal cosmeticCatalog (es. { id: 'skin_id', price: 100, name: 'Skin Name', ... }).
 * @param {number} userTotalBits - I bit attuali dell'utente.
 * @param {number} userTotalDigitalFruits - Le digital fruits attuali dell'utente.
 * @param {string[]} userUnlockedItems - Gli ID degli oggetti già sbloccati dall'utente.
 * @returns {string} La stringa HTML della card.
 */
function createItemCard(itemObject, userTotalBits, userTotalDigitalFruits, userUnlockedItems) {
    // Directly use itemObject since it's now passed correctly from renderShopCategory
    if (!itemObject) {
        console.warn("Item object is undefined in createItemCard.");
        return '';
    }

    let buttonText = 'Buy';
    let buttonDisabled = '';
    let priceText = '';
    let currencyIconHtml = '';

    const isOwned = userUnlockedItems.includes(itemObject.id);
    const currencyType = itemObject.currency || 'bits'; // Default to 'bits' if not specified
    const itemPrice = itemObject.price || 0; // Ensure price exists and defaults to 0

    let hasEnoughCurrency = false;

    // Determine currency icon and check if user has enough
    if (currencyType === 'digital_fruits') {
        currencyIconHtml = '<i class="ph-bold ph-orange"></i>'; // Digital Fruit icon
        priceText = itemPrice.toLocaleString(); // Format price
        hasEnoughCurrency = userTotalDigitalFruits >= itemPrice;
    } else { // Default to bits
        currencyIconHtml = '<i class="ph-bold ph-currency-btc"></i>'; // Bit icon
        priceText = itemPrice.toLocaleString();
        hasEnoughCurrency = userTotalBits >= itemPrice;
    }

    // Set button text and disable state based on ownership and currency
    if (isOwned) {
        buttonText = 'Owned';
        buttonDisabled = 'disabled';
        priceText = 'Unlocked'; // No price displayed if owned
        currencyIconHtml = ''; // No currency icon if owned
    } else if (!hasEnoughCurrency) {
        buttonText = 'Not Enough';
        buttonDisabled = 'disabled';
    }

    // Determine the preview content (image or fallback icon)
    const previewContent = itemObject.preview_asset
        ? `<img src="${itemObject.preview_asset}" alt="${itemObject.name} Preview" class="item-shop-preview-asset">`
        : `<i class="ph-bold ph-${itemObject.icon || 'question'}" style="font-size: 48px; color: #666;"></i>`; // Fallback icon

    return `
        <div class="shop-item-card" data-item-id="${itemObject.id}" data-item-type="${itemObject.type}">
            <div class="item-preview">
                ${previewContent}
            </div>
            <div class="item-name">
                <span>${itemObject.name}</span>
            </div>
            <div class="item-price">
                ${priceText} ${currencyIconHtml}
            </div>
            <button class="buy-button" ${buttonDisabled}>${buttonText}</button>
        </div>
    `;
}
export async function initShop() {
    console.log("Inizializzazione negozio..."); //
    const localUserId = getCurrentUserId(); //
    if (!currentUserData || currentUserData.userId !== localUserId) {
        console.error("currentUserData non disponibile o non corrisponde. Impossibile inizializzare il negozio."); //
        showToast('Errore: impossibile caricare il negozio.', 'error'); //
        return;
    }

    const userUnlockedItems = currentUserData.inventory?.unlockedItems || []; //

    // Aggiorna il contatore dei bit nel negozio
    const shopBitsCounter = document.getElementById('shop-bits-counter'); //
    if (shopBitsCounter) {
        shopBitsCounter.textContent = currentUserData.gameStats?.totalBits || 0; //
    }

    // Aggiungi listener ai bottoni di categoria (se non già fatto)
    if (!shopCategoriesNav.dataset.listenersInitialized) { //
        shopCategoriesNav.querySelectorAll('.shop-category-btn').forEach(button => { //
            button.addEventListener('click', () => {
                const categoryType = button.dataset.category; //
                // MODIFICATO: Passa l'intero oggetto currentUserData
                renderShopCategory(categoryType, currentUserData); 
                // Rimuovi la classe 'active' da tutti i bottoni e aggiungila a quello cliccato
                shopCategoriesNav.querySelectorAll('.shop-category-btn').forEach(btn => btn.classList.remove('active')); //
                button.classList.add('active');
            });
        });
        shopCategoriesNav.dataset.listenersInitialized = 'true'; //
    }

    const defaultButton = shopCategoriesNav.querySelector('.shop-category-btn[data-category="donkeySkin"]'); //
    if (defaultButton) {
        defaultButton.click(); // Simula un click per renderizzare la categoria di default
    } else {
        // MODIFICATO: Passa l'intero oggetto currentUserData
        renderShopCategory('donkeySkin', currentUserData); 
    }

    // addBuyButtonListeners continua a ricevere userBits e userUnlockedItems come prima,
    // ma la logica di createItemCard è stata modificata per usare tutti e tre i valori di valuta.
    addBuyButtonListeners(currentUserData.gameStats.totalBits || 0, currentUserData.inventory?.unlockedItems || []); //
}
/**
 * Renderizza una specifica categoria di oggetti nel negozio.
 * @param {string} category - Il tipo di oggetto da filtrare ('donkeySkin', 'bulletSkin', 'companion', 'permanentPowerup').
 * @param {object} userData - L'oggetto utente locale (currentUserData).
 */
function renderShopCategory(category, userData) {
    const shopContainer = document.getElementById('shop-container');

    if (!shopContainer) {
        console.error("Errore: Elemento #shop-container non trovato nel DOM.");
        return;
    }

    shopItemGridContainer.innerHTML = '';

    // itemsToDisplay will correctly contain objects like { id: '...', name: '...', price: ..., type: '...', ... }
    let itemsToDisplay = Object.entries(cosmeticCatalog)
        .map(([id, item]) => ({ id, ...item }))
        .filter(item =>
            item.type === category && !item.isDefault && !item.badgeUnlock
        )
        .sort((a, b) => a.price - b.price);

    if (itemsToDisplay.length === 0) {
        shopItemGridContainer.innerHTML = '<p>Nessun oggetto disponibile in questa categoria.</p>';
        return;
    }

    let gridHtml = '<div class="shop-items-grid">';
    itemsToDisplay.forEach(item => {
        // MODIFIED: Pass the entire 'item' object (which now has name, price, currency, etc.)
        gridHtml += createItemCard(
            item, // <-- MODIFICATION HERE: Pass the full 'item' object
            userData.gameStats.totalBits || 0,
            userData.gameStats.totalDigitalFruits || 0,
            userData.inventory.unlockedItems || []
        );
    });
    gridHtml += '</div>';
    shopItemGridContainer.innerHTML = gridHtml;

    addBuyButtonListeners(userData.gameStats.totalBits || 0, userData.inventory.unlockedItems || []);
}

/**
 * Aggiunge i listener ai bottoni "Buy" dopo che la griglia è stata renderizzata.
 * @param {number} userBits - I bit attuali dell'utente.
 * @param {string[]} userUnlockedItems - Gli ID degli oggetti già sbloccati dall'utente.
 */
function addBuyButtonListeners(userBits, userUnlockedItems) {
    shopItemGridContainer.querySelectorAll('.buy-button').forEach(button => {
        // --- RIMUOVI LE SEGUENTI 2 RIGHE ---
        // Rimuovi i listener esistenti per evitare duplicati
        // const newButton = button.cloneNode(true);
        // button.parentNode.replaceChild(newButton, button);
        // --- FINE RIMOZIONE ---

        // Attacca il listener direttamente al 'button' corrente nel forEach.
        // Questo 'button' è un elemento nuovo ogni volta che la griglia viene renderizzata.
        if (!button.disabled) { // Usa 'button.disabled' direttamente
            button.addEventListener('click', async (event) => {
                const itemCard = event.target.closest('.shop-item-card'); // Cerca la card genitore
                const itemId = itemCard.dataset.itemId; // Ottieni l'ID dall'attributo data-*
                // const itemType = itemCard.dataset.itemType; // Non più necessario qui

                // Ottieni i dettagli completi dell'oggetto dal catalogo usando l'itemId
                const item = cosmeticCatalog[itemId]; 

                if (!item) {
                    showToast('Errore: oggetto non trovato nel catalogo.', 'error');
                    return;
                }
                
                // Chiama handlePurchase con l'ID dell'oggetto e il suo prezzo
                await handlePurchase(itemId, item.price); 
            });

            // Listener per la preview (se vuoi una preview al click sull'oggetto)
            const itemCard = button.closest('.shop-item-card'); // Usa 'button.closest' direttamente
            itemCard.addEventListener('click', () => {
                const itemId = itemCard.dataset.itemId;
                const item = cosmeticCatalog[itemId];
                if (item && item.preview_asset) {
                    const previewImage = document.getElementById('shop-preview-image');
                    const previewName = document.getElementById('shop-preview-name');
                    if (previewImage) previewImage.src = item.preview_asset;
                    if (previewName) previewName.textContent = item.name;
                    currentPreviewItemId = itemId; // Aggiorna l'ID della preview
                }
            });
        }
    });
}


/**
 * Gestisce la logica di acquisto di un oggetto localmente.
 * Sostituisce la Cloud Function `purchaseItem`.
 * @param {string} itemId - L'ID dell'oggetto da acquistare.
 * @param {number} itemPrice - Il costo dell'oggetto.
 */
async function handlePurchase(itemId, itemPrice) {
    showToast('Elaborazione acquisto...', 'info');
    const localUserId = getCurrentUserId();

    if (!currentUserData || currentUserData.userId !== localUserId) {
        console.error("currentUserData non disponibile o non corrisponde. Impossibile completare l'acquisto.");
        showToast('Errore: impossibile accedere ai dati utente locali.', 'error');
        return;
    }

    const userProfileToUpdate = { ...currentUserData };
    userProfileToUpdate.gameStats = { ...userProfileToUpdate.gameStats };
    userProfileToUpdate.inventory = { ...userProfileToUpdate.inventory };
    userProfileToUpdate.inventory.unlockedItems = [...(userProfileToUpdate.inventory.unlockedItems || [])];

    console.log("DEBUG handlePurchase: Inizio del processo di acquisto.");
    console.log("DEBUG handlePurchase: itemId ricevuto:", itemId);
    console.log("DEBUG handlePurchase: Contenuto di cosmeticCatalog:", cosmeticCatalog);

    const itemDetails = cosmeticCatalog[itemId];

    if (!itemDetails) { // Aggiunto controllo per itemDetails undefined
        console.error("Errore: Dettagli oggetto non trovati nel catalogo per ID:", itemId);
        showToast('Errore: oggetto non valido per l\'acquisto.', 'error');
        return;
    }

    const currencyType = itemDetails.currency || 'bits';

    let currentCurrency;
    let currencyFieldName;
    let currencyDisplayName;

    if (currencyType === 'digital_fruits') {
        currentCurrency = userProfileToUpdate.gameStats.totalDigitalFruits || 0;
        currencyFieldName = 'totalDigitalFruits';
        currencyDisplayName = 'Digital Fruits';
    } else {
        currentCurrency = userProfileToUpdate.gameStats.totalBits || 0;
        currencyFieldName = 'totalBits';
        currencyDisplayName = 'Bits';
    }

    const userUnlockedItems = userProfileToUpdate.inventory.unlockedItems;

    if (userUnlockedItems.includes(itemId)) {
        showToast('Hai già sbloccato questo oggetto!', 'warning');
        return;
    }
    if (currentCurrency < itemPrice) {
        showToast(`Non hai abbastanza ${currencyDisplayName} per questo acquisto.`, 'error');
        return;
    }

    console.log("DEBUG: Entrato nel blocco try di handlePurchase.");
    try {
        userProfileToUpdate.gameStats[currencyFieldName] = currentCurrency - itemPrice;
        userProfileToUpdate.inventory.unlockedItems.push(itemId);
        userProfileToUpdate.updatedAt = Date.now();

        console.log("DEBUG: Tenterò di salvare l'utente in IndexedDB.", userProfileToUpdate);

        await saveUser(userProfileToUpdate);

        console.log("DEBUG: Salvataggio utente completato con successo in IndexedDB.");

        Object.assign(currentUserData, userProfileToUpdate);

        showToast('Acquisto completato con successo!', 'success');

        // Ricarica il negozio per riflettere lo stato aggiornato (bit, oggetti sbloccati)
        await initShop(); // Re-inizializza il negozio con i nuovi dati
        initializeMenu(); // Aggiorna il menu principale (es. contatori bit e snapshot)

        // NUOVO: Aggiorna le modali dell'inventario se sono aperte o necessitano di refresh
        // Assumi che queste funzioni esistano in main.js o profile.js e siano esportate
        // Se non esistono, dovrai crearle.
        if (typeof updateSkinsModalDisplay === 'function') {
            updateSkinsModalDisplay();
        }
        if (typeof updateCompanionsModalDisplay === 'function') {
            updateCompanionsModalDisplay();
        }
        if (typeof updatePowerUpsModalDisplay === 'function') {
            updatePowerUpsModalDisplay();
        }


    } catch (error) {
        console.error("Errore durante l'acquisto locale:", error);
        showToast(`Errore nell'acquisto: ${error.message}`, 'error');
        debugger;
    }
}
