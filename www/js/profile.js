// www/js/profile.js

// Importa solo le funzioni di IndexedDB
import { openOfflineDB, getUser, saveUser } from './offlineDb.js';

import { showToast } from './toastNotifications.js';
import { generateBlockieAvatar, updateMenuVisuals } from './main.js'; // generateBlockieAvatar è ora in main.js
import * as BadgeManager from './badgeManager.js'; // BadgeManager verrà adattato in seguito

// currentUserData è ora una variabile globale gestita in main.js
// La importiamo qui per accedervi.
import { currentUserData, getCurrentUserId, initializeMenu } from './main.js';

// Catalogo degli oggetti cosmetici (mantenuto per handleEquipItem e shopManager)
const cosmeticCatalog = {
  skin_donkey_default_info: {
    price: 2000,
    name: 'Donkey Basic',
    type: 'donkeySkin',
    icon: 'monitor-play',
    preview_asset: 'images/shop_previews/default_donkey_skin.gif',
    isDefault: true,
  }, // Added price for completeness
  skin_bullet_log: {
    price: 1500,
    name: 'Log Bullets',
    type: 'bulletSkin',
    icon: 'files',
    preview_asset: 'images/shop_previews/bullet_log_style.gif',
    isDefault: true,
  }, // Added price
  skin_donkey_golden_walk: {
    price: 7500,
    name: 'Golden Donkey',
    type: 'donkeySkin',
    icon: 'sparkle',
    preview_asset: 'images/shop_previews/donkey_golden_walk_preview.gif',
  }, // Added price
  skin_bullet_firewall: {
    price: 4000,
    name: 'Firewall Packets',
    type: 'bulletSkin',
    icon: 'shield',
    preview_asset: 'images/shop_previews/bullet_firewall_style.gif',
  }, // Added price
  // --- INIZIO NUOVE SKIN ACQUISTABILI ---
  skin_donkey_cyberpunk: {
    price: 10000,
    name: 'Donkey Cyberpunk',
    type: 'donkeySkin',
    icon: 'robot',
    preview_asset: 'images/shop_previews/donkey_cyberpunk_walk_preview.gif',
  },
  skin_donkey_vintage: {
    price: 6000,
    name: 'Donkey Vintage',
    type: 'donkeySkin',
    icon: 'cassette-tape',
    preview_asset: 'images/shop_previews/donkey_vintage_walk_preview.gif',
  },
  skin_donkey_pixelart: {
    price: 15000,
    name: 'Donkey Pixel-Art',
    type: 'donkeySkin',
    icon: 'square',
    preview_asset: 'images/shop_previews/donkey_pixel_walk_preview.gif',
  },
  skin_donkey_malware: {
    price: 8000,
    name: 'Donkey Malware',
    type: 'donkeySkin',
    icon: 'skull',
    preview_asset: 'images/shop_previews/donkey_malware_preview.gif',
  },
  skin_donkey_antivirus: {
    price: 12000,
    name: 'Donkey Antivirus',
    type: 'donkeySkin',
    icon: 'shield-check',
    preview_asset: 'images/shop_previews/donkey_antivirus_preview.gif',
  },
  skin_donkey_async: {
    price: 9500,
    name: 'Donkey Async',
    type: 'donkeySkin',
    icon: 'infinity',
    preview_asset: 'images/shop_previews/donkey_async_preview.gif',
  },
  skin_donkey_javascript: {
    price: 11000,
    name: 'Donkey JavaScript',
    type: 'donkeySkin',
    icon: 'code',
    preview_asset: 'images/shop_previews/donkey_javascript_preview.gif',
  },
  skin_donkey_dev: {
    price: 10000,
    name: 'Donkey Dev',
    type: 'donkeySkin',
    icon: 'code',
    preview_asset: 'images/shop_previews/skin_donkey_dev_preview.gif',
  },
  skin_bullet_binary: {
    price: 3000,
    name: 'Binary Bombs',
    type: 'bulletSkin',
    icon: 'binary',
    preview_asset: 'images/shop_previews/bullet_binary_style.gif',
  },
  skin_bullet_error: {
    price: 2500,
    name: 'Error Packets',
    type: 'bulletSkin',
    icon: 'bug-beetle',
    preview_asset: 'images/shop_previews/bullet_error_skin.gif',
  },
  skin_bullet_cyberwrath: {
    price: 5500,
    name: 'CyberWrath Bullets',
    type: 'bulletSkin',
    icon: 'flame',
    preview_asset: 'images/shop_previews/bullet_cyberwrath_style.gif',
  },
  skin_bullet_necron: {
    price: 6000,
    name: 'Necron Bullets',
    type: 'bulletSkin',
    icon: 'atom',
    preview_asset: 'images/shop_previews/bullet_necron_style.gif',
  },
  skin_bullet_arcade: {
    price: 3500,
    name: 'Arcade Bullets',
    type: 'bulletSkin',
    icon: 'game-controller',
    preview_asset: 'images/shop_previews/bullet_arcade_style.gif',
  },
  // --- FINE NUOVE SKIN ACQUISTABILI ---
  // Aggiunta delle entry per le skin di default per il locker
  default_donkey: {
    name: 'Default Donkey',
    type: 'donkeySkin',
    icon: 'monitor-play',
    isDefault: true,
    preview_asset: 'images/shop_previews/default_donkey_skin.gif',
  },
  default_bullet: {
    name: 'Default Bullets',
    type: 'bulletSkin',
    icon: 'dot-outline',
    isDefault: true,
    preview_asset: 'images/shop_previews/default_bullet_style.gif',
  },
  // --- INIZIO SKIN SBLOCCABILI TRAMITE BADGE ---
  skin_donkey_score_legend: {
    name: 'Score Legend Donkey',
    type: 'donkeySkin',
    icon: 'star',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_score_legend_preview.gif',
  },
  skin_donkey_bug_whisperer: {
    name: 'Bug Whisperer Donkey',
    type: 'donkeySkin',
    icon: 'bug',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_bug_whisperer_preview.gif',
  },
  skin_donkey_jumper_legend: {
    name: 'Jumper Legend Donkey',
    type: 'donkeySkin',
    icon: 'arrow-circle-up',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_jumper_legend_preview.gif',
  },
  skin_bullet_code_storm: {
    name: 'Code Storm Bullets',
    type: 'bulletSkin',
    icon: 'cloud-lightning',
    badgeUnlock: true,
    preview_asset: 'images/bullets/badge_bullets/bullet_code_storm_style.png',
  }, // Corretto percorso
  skin_donkey_bit_overlord: {
    name: 'Bit Overlord Donkey',
    type: 'donkeySkin',
    icon: 'coin',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_bit_overlord_preview.gif',
  },
  skin_donkey_mission_legend: {
    name: 'Mission Legend Donkey',
    type: 'donkeySkin',
    icon: 'flag',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_mission_legend_preview.gif',
  },
  skin_donkey_powerup_overlord: {
    name: 'Power-Up Overlord Donkey',
    type: 'donkeySkin',
    icon: 'lightning',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_powerup_overlord_preview.gif',
  },
  skin_donkey_data_guru: {
    name: 'Data Guru Donkey',
    type: 'donkeySkin',
    icon: 'database',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_data_guru_preview.gif',
  },

  skin_donkey_fruit_master: {
    name: 'Fruit Master Donkey',
    type: 'donkeySkin',
    icon: 'apple',
    badgeUnlock: true,
    badgeId: 'multi_fruit_eater_badge',
    preview_asset: 'images/shop_previews/skin_donkey_fruit_master_preview.gif',
  },
  skin_donkey_fruit_overlord: {
    name: 'Fruit Overlord Donkey',
    type: 'donkeySkin',
    icon: 'trophy',
    badgeUnlock: true,
    badgeId: 'digital_fruit_collector_5',
    preview_asset: 'images/shop_previews/skin_donkey_fruit_overlord_preview.gif',
  },

  skin_donkey_glitchzilla_slayer: {
    name: 'Glitchzilla Slayer Donkey',
    type: 'donkeySkin',
    icon: 'bug-beetle',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_glitchzilla_slayer_preview.gif',
  },
  skin_donkey_trojan_slayer: {
    name: 'Trojan Slayer Donkey',
    type: 'donkeySkin',
    icon: 'virus',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_trojan_slayer_preview.gif',
  },
  skin_donkey_missing_slayer: {
    name: 'Missing Slayer Donkey',
    type: 'donkeySkin',
    icon: 'question',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_missing_slayer_preview.gif',
  },
  skin_donkey_dunno_slayer: {
    name: 'DUNNO.EXE Slayer Donkey',
    type: 'donkeySkin',
    icon: 'file-x',
    badgeUnlock: true,
    preview_asset: 'images/shop_previews/skin_donkey_dunno_slayer_preview.gif',
  },
  // --- FINE SKIN SBLOCCABILI TRAMITE BADGE ---
  // AGGIUNGI I COMPAGNI AL CATALOGO COSMETICO
  companion_cloud_assistant: {
    price: 5000,
    name: 'Cloud Assistant',
    type: 'companion',
    icon: 'cloud',
    preview_asset: 'images/shop_previews/companion_cloud_assistant_preview.gif',
    currency: 'digital_fruits',
  }, // <-- AGGIUNTA currency
  companion_debuggator_ia: {
    price: 8000,
    name: 'Debuggator IA',
    type: 'companion',
    icon: 'bug-droid',
    preview_asset: 'images/shop_previews/companion_debuggator_ia_preview.gif',
    currency: 'digital_fruits',
  }, // <-- AGGIUNTA currency
  companion_kernel_4_2: {
    price: 12000,
    name: 'Kernel 4.2',
    type: 'companion',
    icon: 'brain',
    preview_asset: 'images/shop_previews/companion_kernel_4_2_preview.gif',
    currency: 'digital_fruits',
  }, // <-- AGGIUNTA currency

  // Aggiungi i power-up permanenti al catalogo cosmetico
  powerup_extra_life: {
    price: 10000,
    name: 'Extra Life Module',
    type: 'permanentPowerup',
    icon: 'heart',
    preview_asset: 'images/shop_previews/powerup_extra_life_preview.gif',
  },
  permanent_powerup_bit_magnet: {
    price: 7500,
    name: 'Bit Magnet',
    type: 'permanentPowerup',
    icon: 'magnet',
    preview_asset: 'images/shop_previews/powerup_bit_magnet_preview.gif',
  },
  permanent_powerup_double_shot: {
    price: 300,
    name: 'Double Shot',
    type: 'permanentPowerup',
    icon: 'crosshair',
    preview_asset: 'images/shop_previews/powerup_double_shot_preview.gif', // Nota: questo file immagine va creato
    currency: 'digital_fruits',
  },
};

/**
 * Funzione principale per aprire e popolare la modale del profilo
 * @param {object} user - L'oggetto utente locale (currentUserData da main.js).
 */
export async function openProfileModal(user) {
  if (!user) {
    showToast('No local user profile available.', 'error');
    return;
  }
  const profileModal = document.getElementById('profileModal');
  if (!profileModal) return;
  profileModal.style.display = 'flex';

  renderProfileStats(user);
  const statsButton = document.getElementById('profile-nav-stats');
  if (statsButton) {
    statsButton.click();
  }
}

function renderProfileStats(userData) {
  const gameStats = userData.gameStats || {};
  const avatarSeed = userData.avatarSeed || userData.userId;
  const avatarSrc = userData.photoURL || generateBlockieAvatar(avatarSeed, 80);

  const profileModalAvatar = document.getElementById('profile-modal-avatar');
  if (profileModalAvatar) profileModalAvatar.src = avatarSrc;

  document.getElementById('profile-modal-name').textContent = userData.nickname || 'Offline Player';
  document.getElementById('profile-modal-email').textContent = userData.email || 'N/A';
  document.getElementById('profile-modal-highest-score').textContent = gameStats.highestScore || 0;
  document.getElementById('profile-modal-total-score').textContent = gameStats.totalScore || 0;
  document.getElementById('profile-modal-games-played').textContent =
    gameStats.totalGamesPlayed || 0;
  document.getElementById('profile-modal-bosses-defeated').innerHTML =
    `${gameStats.bossesDefeated || 0}<span class="blinking-cursor">_</span>`;
}

/**
 * Funzione generica per creare una card di un oggetto (skin, compagno, powerup)
 */
function createItemCard(itemId, equippedItems, itemType) {
  const item = cosmeticCatalog[itemId];
  if (!item) return '';

  let isEquipped = false;
  let buttonText = 'Equip';
  let buttonDisabled = '';
  let buttonClass = 'equip-button';

  if (itemType === 'permanentPowerup') {
    isEquipped = (equippedItems.permanentPowerups || []).includes(itemId);
    buttonText = isEquipped ? 'Deactivate' : 'Activate';
  } else {
    isEquipped = equippedItems[itemType] === itemId || (!equippedItems[itemType] && item.isDefault);
    if (isEquipped) {
      buttonText = 'On';
      buttonDisabled = 'disabled';
      buttonClass += ' equipped';
    }
  }

  const previewContent = item.preview_asset
    ? `<img src="${item.preview_asset}" alt="${item.name} Preview" class="item-shop-preview-asset">`
    : `<i class="ph-bold ph-${item.icon || 'question'}" style="font-size: 48px;"></i>`;

  return `
        <div class="item-card ${isEquipped ? 'equipped-card' : ''}" data-item-id="${itemId}" data-item-type="${itemType}">
            <div class="item-preview">${previewContent}</div>
            <div class="item-name"><span>${item.name}</span></div>
            <button class="${buttonClass}" ${buttonDisabled}>${buttonText}</button>
        </div>
    `;
}

/**
 * Gestisce l'attivazione delle schede all'interno delle modali
 */
async function activateItemTab(modalElement, activeTabId, userData) {
  const navButtons = modalElement.querySelectorAll('.category-btn');
  const itemContainer = modalElement.querySelector('.item-grid-container');
  const inventory = userData.inventory || {};
  const unlockedItems = inventory.unlockedItems || [];
  const equipped = inventory.equipped || {};

  navButtons.forEach((btn) => btn.classList.remove('active'));
  itemContainer.innerHTML = '';

  const clickedButton = modalElement.querySelector(`[data-type-filter="${activeTabId}"]`);
  if (clickedButton) clickedButton.classList.add('active');

  let itemsToRender = [];
  let itemTypesInThisModal = [];
  if (modalElement.id === 'skinsModal') itemTypesInThisModal = ['donkeySkin', 'bulletSkin'];
  if (modalElement.id === 'companionsModal') itemTypesInThisModal = ['companion'];
  if (modalElement.id === 'powerupsModal') itemTypesInThisModal = ['permanentPowerup'];

  itemsToRender = unlockedItems.filter((id) => {
    const item = cosmeticCatalog[id];
    return (
      item &&
      (activeTabId === 'all' ? itemTypesInThisModal.includes(item.type) : item.type === activeTabId)
    );
  });

  if (modalElement.id === 'skinsModal') {
    if (activeTabId === 'donkeySkin' || activeTabId === 'all')
      itemsToRender.push('skin_donkey_default_info');
    if (activeTabId === 'bulletSkin' || activeTabId === 'all')
      itemsToRender.push('skin_bullet_log');
  }

  let contentHTML = '<div class="item-grid">';
  if (itemsToRender.length > 0) {
    [...new Set(itemsToRender)].sort().forEach((id) => {
      contentHTML += createItemCard(id, equipped, cosmeticCatalog[id].type);
    });
  } else {
    contentHTML += '<p>No items in this category.</p>';
  }

  if (modalElement.id === 'companionsModal') {
    const isNoneEquipped = !equipped.companion;
    contentHTML += `
            <div class="item-card ${isNoneEquipped ? 'equipped-card' : ''}" data-item-id="null" data-item-type="companion">
                <div class="item-preview"><i class="ph-bold ph-x-circle" style="font-size: 48px;"></i></div>
                <div class="item-name"><span>No Companion</span></div>
                <button class="equip-button ${isNoneEquipped ? 'equipped' : ''}" ${isNoneEquipped ? 'disabled' : ''}>${isNoneEquipped ? 'On' : 'Equip'}</button>
            </div>`;
  }

  contentHTML += '</div>';
  itemContainer.innerHTML = contentHTML;
  addEquipListeners(itemContainer);
}

/**
 * Funzione helper per configurare una modale con navigazione a schede.
 * Utilizza event delegation per gestire i click in modo robusto.
 */
async function setupModal(modalId, defaultTabId, navId) {
  const modalElement = document.getElementById(modalId);
  if (!modalElement) return;
  modalElement.style.display = 'flex';

  const localUserId = getCurrentUserId();
  const freshUserData = await getUser(localUserId);
  if (!freshUserData) {
    showToast('Error loading user profile.', 'error');
    return;
  }
  Object.assign(currentUserData, freshUserData);

  const nav = document.getElementById(navId);
  if (nav && !nav.dataset.listenerAttached) {
    nav.addEventListener('click', (event) => {
      const button = event.target.closest('.category-btn');
      if (button) {
        activateItemTab(modalElement, button.dataset.typeFilter, currentUserData);
      }
    });
    nav.dataset.listenerAttached = 'true';
  }

  const lastActiveButton = nav ? nav.querySelector('.category-btn.active') : null;
  const tabToActivate = lastActiveButton ? lastActiveButton.dataset.typeFilter : defaultTabId;

  activateItemTab(modalElement, tabToActivate, currentUserData);
}

export const renderSkinsModal = () =>
  setupModal('skinsModal', 'donkeySkin', 'skins-categories-nav');
export const renderCompanionsModal = () =>
  setupModal('companionsModal', 'companion', 'companions-categories-nav');
export const renderPowerupsModal = () =>
  setupModal('powerupsModal', 'permanentPowerup', 'powerups-categories-nav');

function addEquipListeners(container) {
  container.querySelectorAll('.equip-button').forEach((button) => {
    if (button.disabled) return;
    const card = button.closest('.item-card');
    const itemId = card.dataset.itemId === 'null' ? null : card.dataset.itemId;
    const itemType = card.dataset.itemType;
    button.addEventListener('click', () => handleEquipItem(itemId, itemType));
  });
}
/**
 * Gestisce l'equipaggiamento di un oggetto e aggiorna la UI correttamente.
 */
export async function handleEquipItem(itemId, itemType) {
  showToast('Applying _Update...', 'info');
  const localUserId = getCurrentUserId();
  if (!currentUserData) {
    showToast('Error: User data not available.', 'error');
    return;
  }

  try {
    if (!currentUserData.inventory) currentUserData.inventory = {};
    if (!currentUserData.inventory.equipped) currentUserData.inventory.equipped = {};

    if (itemType === 'permanentPowerup') {
      let equippedPups = new Set(currentUserData.inventory.equipped.permanentPowerups || []);
      if (equippedPups.has(itemId)) {
        equippedPups.delete(itemId);
        showToast(`${cosmeticCatalog[itemId].name} deactivated.`, 'success');
      } else {
        if (equippedPups.size >= 2) throw new Error('You can only equip 2 permanent power-ups.');
        if (!currentUserData.inventory.unlockedItems.includes(itemId))
          throw new Error("You don't own this power-up.");
        equippedPups.add(itemId);
        showToast(`${cosmeticCatalog[itemId].name} activated!`, 'success');
      }
      currentUserData.inventory.equipped.permanentPowerups = Array.from(equippedPups);
    } else {
      if (itemId === null || cosmeticCatalog[itemId]?.isDefault) {
        currentUserData.inventory.equipped[itemType] =
          itemType === 'donkeySkin' ? 'skin_donkey_default_info' : 'skin_bullet_log';
        showToast(`Default ${itemType} equipped.`, 'success');
      } else {
        if (!currentUserData.inventory.unlockedItems.includes(itemId))
          throw new Error("You don't own this item.");
        currentUserData.inventory.equipped[itemType] = itemId;
        showToast(`${cosmeticCatalog[itemId].name} equipped!`, 'success');
      }
    }

    currentUserData.updatedAt = Date.now();
    await saveUser(currentUserData);
    await updateMenuVisuals();

    // Ricarica i dati e aggiorna la modale aperta, mantenendo la scheda attiva
    const freshUserData = await getUser(localUserId);
    if (!freshUserData) throw new Error('Failed to reload user data.');
    Object.assign(currentUserData, freshUserData);

    const openModals = {
      skinsModal: 'skins-categories-nav',
      companionsModal: 'companions-categories-nav',
      powerupsModal: 'powerups-categories-nav',
    };

    for (const modalId in openModals) {
      const modalElement = document.getElementById(modalId);
      if (modalElement && modalElement.style.display === 'flex') {
        const nav = document.getElementById(openModals[modalId]);
        const activeButton = nav ? nav.querySelector('.category-btn.active') : null;
        const activeTabId = activeButton
          ? activeButton.dataset.typeFilter
          : modalId === 'skinsModal'
            ? 'donkeySkin'
            : 'companion';
        await activateItemTab(modalElement, activeTabId, currentUserData);
      }
    }
  } catch (error) {
    console.error('Error equipping item:', error);
    showToast(`Error: ${error.message}`, 'error');
    // Se c'è un errore, è buona norma ripristinare la UI allo stato precedente
    const anyOpenModal = document.querySelector('#skinsModal, #companionsModal, #powerupsModal');
    if (anyOpenModal && anyOpenModal.style.display === 'flex') {
      window[`render${anyOpenModal.id.charAt(0).toUpperCase() + anyOpenModal.id.slice(1)}`]();
    }
  }
}

async function handleNicknameEdit() {
  const user = currentUserData;
  if (!user) {
    showToast('No local user available to change nickname.', 'error');
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
    showToast('UI Error: Unable to open nickname edit modal.', 'error');
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
      showToast('The new nickname is the same as the previous one.', 'info');
      editNicknameModal.style.display = 'none';
      return;
    }

    saveNewNicknameBtn.disabled = true;
    saveNewNicknameBtn.textContent = 'Saving...';

    try {
      currentUserData.nickname = newNickname;
      currentUserData.updatedAt = Date.now();
      currentUserData.profileUpdatedAt = Date.now();

      await saveUser(currentUserData);

      profileModalName.textContent = newNickname;
      showToast('Nickname successfully updated!', 'success');
      document.getElementById('edit-nickname-btn').disabled = false;
      document.getElementById('edit-nickname-btn').title = 'Change Nickname';
      editNicknameModal.style.display = 'none';

      initializeMenu();
    } catch (error) {
      console.error('Error updating local nickname:', error);
      showToast(`Error: ${error.message}`, 'error');
      saveNewNicknameBtn.disabled = false;
      saveNewNicknameBtn.textContent = 'Salva';
    }
  }

  function closeNicknameModalHandler() {
    editNicknameModal.style.display = 'none';
  }
}

export function initProfileControls() {
  const profileModal = document.getElementById('profileModal');
  if (!profileModal) return;

  const closeProfileModal = document.getElementById('closeProfileModal');
  const editNicknameBtn = document.getElementById('edit-nickname-btn');
  const statsBtn = document.getElementById('profile-nav-stats');
  const statsContent = document.getElementById('profile-stats-content');
  const badgesBtn = document.getElementById('profile-nav-badges');
  const badgesContent = document.getElementById('profile-badges-content');

  function activateProfileTab(activeBtn, activeContent) {
    [statsBtn, badgesBtn].forEach((b) => b?.classList.remove('active'));
    [statsContent, badgesContent].forEach((c) => c?.classList.remove('active'));
    activeBtn?.classList.add('active');
    activeContent?.classList.add('active');
  }

  statsBtn?.addEventListener('click', () => activateProfileTab(statsBtn, statsContent));
  badgesBtn?.addEventListener('click', async () => {
    activateProfileTab(badgesBtn, badgesContent);
    if (currentUserData) {
      showToast('Loading badges...', 'info');
      const userBadgesStatus = await BadgeManager.getUserBadgesStatus(currentUserData.userId);
      const badgesContainer = document.getElementById('profile-modal-badges-container');
      if (badgesContainer) BadgeManager.renderBadges(badgesContainer, userBadgesStatus);
    }
  });

  closeProfileModal?.addEventListener('click', () => {
    profileModal.style.display = 'none';
  });
  editNicknameBtn?.addEventListener('click', handleNicknameEdit);
}

/**
 * Gestisce la generazione di un avatar casuale (solo UI).
 */
async function handleGenerateRandomAvatar() {
  const user = currentUserData;
  if (!user) {
    showToast('No local profiles available to generate an avatar.', 'error');
    return;
  }

  const newSeed =
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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
    showToast('New avatar generated. Click "Save" to confirm..', 'info');
  }
}

/**
 * Salva l'avatar Blockie generato nella UI sul database locale.
 */
async function handleSaveGeneratedAvatar() {
  const user = currentUserData;
  if (!user) {
    showToast('No local profile available to save avatar.', 'error');
    return;
  }

  const profileModalAvatar = document.getElementById('profile-modal-avatar');
  const saveGeneratedAvatarBtn = document.getElementById('save-generated-avatar-btn');

  const pendingBlockieUrl = profileModalAvatar.dataset.pendingBlockieUrl;
  const pendingAvatarSeed = profileModalAvatar.dataset.pendingAvatarSeed;

  if (!pendingBlockieUrl || !pendingAvatarSeed) {
    showToast('No avatar generated waiting to be saved.', 'warning');
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

    showToast('Avatar Blockie successfully saved!', 'success');

    profileModalAvatar.removeAttribute('data-pending-blockie-url');
    profileModalAvatar.removeAttribute('data-pending-avatar-seed');
    if (saveGeneratedAvatarBtn) {
      saveGeneratedAvatarBtn.style.display = 'none';
      saveGeneratedAvatarBtn.disabled = false;
      saveGeneratedAvatarBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i>';
    }

    initializeMenu();
  } catch (error) {
    console.error('Error saving local Blockie avatar:', error);
    showToast('Error saving Blockie avatar.', 'error');
    if (saveGeneratedAvatarBtn) {
      saveGeneratedAvatarBtn.disabled = false;
      saveGeneratedAvatarBtn.innerHTML = '<i class="ph-bold ph-floppy-disk"></i>';
    }
  }
}
