// www/js/toastNotifications.js

/**
 * Mostra una notifica toast personalizzata in stile terminale.
 * @param {string} message - Il messaggio da visualizzare.
 * @param {'info'|'success'|'error'|'warning'} type - Il tipo di notifica, per lo stile.
 * @param {number} duration - La durata in millisecondi prima che la notifica scompaia.
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Se esiste già un contenitore, lo rimuove per evitare duplicati
  const existingContainer = document.getElementById('toast-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  // 1. Crea il contenitore principale
  const toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'terminal-toast-container'; // Classe per lo stile generale

  // 2. Crea l'elemento toast
  const toast = document.createElement('div');
  // Aggiunge la classe base e una classe specifica per il tipo (info, success, etc.)
  toast.className = `terminal-toast toast-${type}`;

  // 3. Aggiunge il prompt e il messaggio in stile terminale
  // Usiamo innerHTML per permettere al cursore di essere un elemento span separato
  toast.innerHTML = `<span>&gt; ${message}</span><span class="toast-cursor">_</span>`;

  // 4. Aggiunge il toast al contenitore e il contenitore al body
  toastContainer.appendChild(toast);
  document.body.appendChild(toastContainer);

  // Mostra il toast con un'animazione
  setTimeout(() => {
    toast.classList.add('visible');
  }, 10); // Un piccolo ritardo per permettere il rendering prima di applicare la transizione

  // 5. Imposta un timeout per nascondere e rimuovere il toast
  setTimeout(() => {
    toast.classList.remove('visible');
    // Aspetta la fine della transizione di scomparsa prima di rimuovere l'elemento dal DOM
    toast.addEventListener(
      'transitionend',
      () => {
        if (toastContainer.parentNode) {
          toastContainer.remove();
        }
      },
      { once: true },
    );
  }, duration);
}
