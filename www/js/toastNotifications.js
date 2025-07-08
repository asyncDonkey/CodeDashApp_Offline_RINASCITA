

// js/toastNotifications.js

/**
 * Contenitore DOM per le notifiche toast.
 * Viene cercato una sola volta quando il modulo viene caricato.
 * @type {HTMLElement|null}
 */
const toastContainer = document.getElementById('toast-container');

if (!toastContainer) {
    console.warn(
        "Attenzione: L'elemento #toast-container non è stato trovato nel DOM. Le notifiche Toast non funzioneranno correttamente. Assicurati che sia presente nel tuo HTML."
    );
}

/**
 * Mostra una notifica toast.
 * @param {string} message - Il messaggio da visualizzare.
 * @param {string} [type='info'] - Tipo di notifica ('success', 'error', 'warning', 'info').
 * @param {number} [duration=2500] - Durata in millisecondi prima della scomparsa automatica. (MODIFICATO: 2.5 secondi)
 */
export function showToast(message, type = 'info', duration = 2500) { // Durata predefinita ridotta
    if (!toastContainer) {
        console.error('Fallback ad alert: #toast-container non trovato. Notifica:', message);
        alert(`[${type.toUpperCase()}] ${message}`);
        return;
    }

    // Crea l'elemento toast
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type.toLowerCase()}`; // Assicura che type sia lowercase per la classe CSS

    // Crea lo span per il messaggio
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    // RIMOSSO: Creazione e aggiunta del pulsante di chiusura 'X'

    // Funzione per chiudere e rimuovere il toast
    const dismissToast = () => {
        toast.classList.remove('show');
        toast.classList.add('hide'); // Attiva l'animazione di uscita (definita in CSS)

        const removeFinal = () => {
            if (toast.parentNode === toastContainer) {
                toastContainer.removeChild(toast);
            }
            toast.removeEventListener('transitionend', removeFinal); // Rimuovi il listener dopo l'esecuzione
        };

        toast.addEventListener('transitionend', removeFinal, { once: true });

        // Fallback per rimozione, nel caso la transizione non si attivi
        setTimeout(() => {
            removeFinal();
        }, 500); // Piccolo timeout per dare tempo alla transizione, se non ha funzionato transitionend
    };

    // NUOVO: Chiudi il toast cliccandoci sopra
    toast.addEventListener('click', dismissToast);

    // Aggiungi il toast al contenitore
    toastContainer.appendChild(toast);

    // Mostra il toast con una piccola animazione di entrata
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    // Imposta la scomparsa automatica se la durata è positiva
    if (duration > 0) {
        setTimeout(() => {
            // Chiama dismissToast, che si occuperà della rimozione
            dismissToast();
        }, duration);
    }
}