// www/js/leaderboardManager.js

// Rimosse tutte le importazioni Firebase (getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc, documentId)
// Rimosse le importazioni di auth e db da firebase-config.js o main.js
// Rimosse le importazioni di generateBlockieAvatar da main.js

import { showToast } from './toastNotifications.js';

// Non è più necessario importare o utilizzare elementi DOM della leaderboard,
// dato che la funzionalità è rimossa.
// let miniLeaderboardListEl = null;

/**
 * Inizializza la gestione della leaderboard.
 * In un contesto offline, questa funzione non fa nulla, dato che la leaderboard globale è stata rimossa.
 * Potrebbe essere adattata in futuro per una leaderboard locale, ma per ora è vuota.
 */
export function initLeaderboard() {
  console.log('[LeaderboardManager] Leaderboard globale disabilitata in modalità offline.');
  // Assicurati che l'elemento della leaderboard sia nascosto nel DOM
  const leaderboardModal = document.getElementById('leaderboardModal');
  if (leaderboardModal) {
    leaderboardModal.style.display = 'none';
  }
  const leaderboardBtn = document.getElementById('leaderboard-btn');
  if (leaderboardBtn) {
    leaderboardBtn.style.display = 'none'; // Nascondi anche il pulsante nel menu
  }
}

/**
 * Funzione per caricare la leaderboard.
 * In un contesto offline, questa funzione non fa nulla.
 * @returns {Promise<void>}
 */
export async function loadLeaderboard() {
  console.log(
    '[LeaderboardManager] Tentativo di caricare la leaderboard globale (disabilitata in offline).',
  );
  showToast('Leaderboard not available in offline mode.', 'info');
  // Non carica alcun dato
  return Promise.resolve();
}

/**
 * Funzione per inviare un punteggio alla leaderboard.
 * In un contesto offline, questa funzione non fa nulla. Il salvataggio dei punteggi
 * è gestito localmente in donkeyRunner.js.
 * @param {object} gameData - I dati del gioco da inviare.
 * @returns {Promise<void>}
 */
export async function submitScore(gameData) {
  console.log(
    '[LeaderboardManager] Tentativo di inviare punteggio alla leaderboard globale (disabilitata in offline).',
  );
  // Il salvataggio delle statistiche è già gestito in processGameOver di donkeyRunner.js
  // Non è necessario fare nulla qui.
  return Promise.resolve();
}

// Rimosse le funzioni helper per la visualizzazione della leaderboard
/*
function formatScoreTimestamp(firebaseTimestamp) { ... }
function displayLeaderboard(leaderboardData, profilesMap) { ... }
*/
