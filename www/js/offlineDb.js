// www/js/offlineDb.js

const DB_NAME = 'asyncDonkeyOfflineDB';
const DB_VERSION = 1; // Incrementa questa versione ogni volta che modifichi lo schema degli object store
const USER_STORE_NAME = 'userProfiles';

let db; // Variabile per mantenere l'istanza del database IndexedDB

/**
 * Apre il database IndexedDB. Se non esiste, lo crea.
 * Se la versione è aggiornata, gestisce l'aggiornamento dello schema (creazione/modifica object store).
 * @returns {Promise<IDBDatabase>} Una Promise che risolve con l'istanza del database.
 */
export function openOfflineDB() {
  return new Promise((resolve, reject) => {
    // Se il database è già aperto, risolvi immediatamente
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Errore nell'apertura di IndexedDB:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('Database IndexedDB aperto con successo.');
      resolve(db);
    };

    // Questo evento si attiva quando il database viene creato per la prima volta
    // o quando viene aggiornata la versione (DB_VERSION).
    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;
      console.log(`Aggiornamento/Creazione database IndexedDB alla versione ${DB_VERSION}.`);

      // Creazione dell'object store per i profili utente
      // Se l'object store esiste già, lo distrugge per ricrearlo con il nuovo schema
      // (utile in fase di sviluppo, in produzione si gestiscono migrazioni più complesse)
      if (dbInstance.objectStoreNames.contains(USER_STORE_NAME)) {
        dbInstance.deleteObjectStore(USER_STORE_NAME);
        console.log(`Object store '${USER_STORE_NAME}' esistente eliminato per aggiornamento.`);
      }

      const userStore = dbInstance.createObjectStore(USER_STORE_NAME, { keyPath: 'userId' });
      console.log(`Object store '${USER_STORE_NAME}' creato con 'userId' come keyPath.`);

      // Aggiungi qui eventuali indici se necessari per query future (non strettamente richiesto ora)
      // Esempio: userStore.createIndex('nickname', 'nickname', { unique: false });
    };
  });
}

// Funzioni di utilità per interagire con l'object store userProfiles
// Queste verranno implementate più dettagliatamente nelle prossime azioni.

/**
 * Recupera un utente dal database.
 * @param {string} userId - L'ID dell'utente da recuperare.
 * @returns {Promise<Object|undefined>} La Promise risolve con l'oggetto utente o undefined se non trovato.
 */
export async function getUser(userId) {
  const database = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([USER_STORE_NAME], 'readonly');
    const store = transaction.objectStore(USER_STORE_NAME);
    const request = store.get(userId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Salva (o aggiorna) un utente nel database.
 * @param {Object} userData - L'oggetto utente da salvare. Deve contenere il campo 'userId'.
 * @returns {Promise<void>} Una Promise che risolve quando l'operazione è completata.
 */
export async function saveUser(userData) {
  const database = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([USER_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(USER_STORE_NAME);
    const request = store.put(userData); // 'put' inserisce o aggiorna se la chiave esiste

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Elimina un utente dal database.
 * @param {string} userId - L'ID dell'utente da eliminare.
 * @returns {Promise<void>} Una Promise che risolve quando l'operazione è completata.
 */
export async function deleteUser(userId) {
  const database = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([USER_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(USER_STORE_NAME);
    const request = store.delete(userId);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}
