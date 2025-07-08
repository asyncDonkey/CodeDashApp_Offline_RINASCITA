# DevPlan Globale: Roadmap per codeDash v2.0

## Visione Generale
Dopo aver consolidato il gameplay e l'interfaccia con la v1.6, la roadmap si espande per trasformare `codeDash` in un'esperienza di gioco persistente, personalizzabile e guidata dalla community. Gli obiettivi principali sono l'introduzione di un'economia di gioco, un negozio con oggetti cosmetici e potenziamenti, e il miglioramento radicale dell'esperienza visiva e dell'infrastruttura di supporto.

---

## ✅ Modulo Completato (v1.6)

### Gameplay e Controlli
- [x] **Controlli Mobile Rinnovati:** Sostituiti i pulsanti fissi con un sistema a due aree di tocco (salto/sparo).
- [x] **Sistema di Vita e Scudo Rinforzato:** Introdotto un sistema di salute e il power-up permanente "Running Deprecated Subroutines".
- [x] **Nuova Arma "Machine Language":** Aggiunto il fuoco automatico temporaneo.
- [x] **Meccanica "Mangia-Proiettili":** I proiettili dei nemici comuni sono ora innocui e forniscono "Bit" se raccolti.
- [x] **Bilanciamento:** Ridotta la velocità dei proiettili comuni e migliorato il contrasto cromatico dei boss.

### Bug Fixing e Stabilità
- [x] **Correzione Logica Power-up:** Risolti i bug di spawning per `Debug Mode` e di stato residuo per `Decompiler`.
- [x] **Fix Animazione Menu:** Risolto il bug che impediva la corretta visualizzazione dell'animazione di uscita dal menu.
- [x] **Fix Crash al Logout:** Risolto un crash nativo che si verificava durante il logout dell'utente.
- [x] **Fix Grafici Vari:** Corretti bug di sovrapposizione di sprite e di elementi UI.

---

## 💡 Modulo 1: Economia di Gioco e Menu Interattivo

**Obiettivo:** Rendere il menu un'esperienza dinamica e integrare l'economia dei Bit nel cuore del gioco.

- [ ] **Task 1.1: Aggiornamento UI Menu**
    -   **Azione:** Rivedere il posizionamento e lo stile dei pulsanti del menu per integrare il nuovo pulsante "Negozio" e il contatore dei Bit.
    -   **Azione (Utenti non autenticati):** Al posto del pulsante "Negozio", visualizzare un'icona `ph-identification-card` con effetto "glow". Al click, questa aprirà la modale di login, spiegando i vantaggi dell'account.
    -   **Azione (Utenti autenticati):** Mostrare il pulsante "Negozio" e il saldo totale di Bit dell'utente, letto da Firestore.

- [ ] **Task 1.2: Menu Interattivo - Raccolta Bit**
    -   **Elaborazione:** Il menu diventa un "mini-gioco" per la raccolta di Bit.
    -   **Azione (Utenti non autenticati):** Le stringhe di codice vaganti vengono sostituite da sprite di Bit. L'asino continuerà a "mangiarle" automaticamente per un puro effetto visivo.
    -   **Azione (Utenti autenticati):**
        1.  I Bit appaiono sullo schermo a intervalli regolari.
        2.  L'utente può **fare tap su un Bit**.
        3.  Alla ricezione del tap, l'asino calcola il percorso e si dirige autonomamente verso il Bit per raccoglierlo.
        4.  Il contatore dei Bit nell'interfaccia si aggiorna in tempo reale.

- [ ] **Task 1.3: Sistema di Persistenza dei Bit del Menu**
    -   **Obiettivo:** Salvare i Bit raccolti nel menu in modo efficiente e sicuro.
    -   **Azione (Archiviazione Locale):** I Bit raccolti nella sessione del menu verranno accumulati in una variabile temporanea salvata nel `localStorage` del dispositivo.
    -   **Azione (Cloud Function `syncMenuBits`):**
        -   **Trigger:** Verrà chiamata dal client **solo** all'inizio di una nuova partita (quando si preme "Play").
        -   **Logica:** La funzione riceverà i Bit dal `localStorage`, li aggiungerà al `totalBits` dell'utente su Firestore e, solo dopo la conferma dal server, il `localStorage` verrà svuotato. Questo garantisce che nessun Bit venga perso, anche se l'utente chiude l'app.

---

## 🏪 Modulo 2: Il Negozio e la Personalizzazione

**Obiettivo:** Creare un hub dove i giocatori possano spendere i loro Bit per sbloccare oggetti unici.

- [ ] **Task 2.1: Fondamenta del Negozio (Modale e UI)**
    -   **Azione:** Creare la struttura HTML per la modale del Negozio (`<div id="shopModal">`), organizzata in sezioni (es. Skin, Proiettili, Effetti Nickname, Potenziamenti).
    -   **Azione:** Stilizzare la modale e le "card" di ogni oggetto in vendita (con anteprima, nome, descrizione, costo e stato "Acquista" o "Posseduto").

- [ ] **Task 2.2: Backend per Acquisti Sicuri**
    -   **Azione:** Creare una Cloud Function `purchaseItem` che gestisca tutte le transazioni.
    -   **Logica di Sicurezza:** La funzione verificherà l'autenticazione, il costo dell'oggetto (letto da una configurazione sul server, non dal client), la disponibilità di Bit dell'utente, e solo allora procederà alla transazione, aggiornando il profilo utente su Firestore.

- [ ] **Task 2.3: Implementazione Oggetti Cosmetici Acquistabili**
    -   **Azione:** Definire un catalogo di oggetti cosmetici:
        -   **Skin Personaggio:** Diverse skin per l'asino.
        -   **Proiettili Personalizzati:** Sprite alternativi per i proiettili.
        -   **Effetti Nickname:** Effetti visivi (glow, gradienti) da applicare al nome utente in classifica.
    -   **Azione:** Creare un'interfaccia "Locker" (probabilmente nella modale Profilo) dove i giocatori possono equipaggiare gli oggetti sbloccati.

- [ ] **Task 2.4: Implementazione Potenziamenti Permanenti Acquistabili**
    -   **Azione:** Progettare e implementare una serie di potenziamenti permanenti molto costosi, che rappresentino obiettivi di fine gioco.

---

## 🎨 Modulo 3: Esperienza Visiva e Nuovi Contenuti

**Obiettivo:** Un "major facelift" per rendere il gioco visivamente più moderno, coerente e ricco di varietà.

- [ ] **Task 3.1: Nuova Schermata di Caricamento Immersiva**
    -   **Elaborazione:** Sostituire il loader attuale con una sequenza animata.
        1.  La scena si apre mostrando il pavimento del gioco.
        2.  Una barra di caricamento appare in alto e avanza.
        3.  Sullo sfondo scorrono linee di codice in stile "matrix".
        4.  Al 50%, appare il testo "Initializing donkeyDebugger subroutines...".
        5.  Lo sprite dell'asino si materializza al centro dello schermo con un effetto "glitch" o di interferenza elettronica.
        6.  Al 100%, appare il testo "Initializing codeDash..." e la camera passa fluidamente alla scena del menu principale, con l'asino che mantiene la posizione finale dell'animazione del loader.

- [ ] **Task 3.2: Animazione di Avvio Partita con Portale**
    -   **Azione:** Quando si preme "Play", l'asino correrà verso un portale che si apre al centro dello schermo. Una volta entrato, il portale si chiuderà su se stesso e la partita inizierà.

- [ ] **Task 3.3: Theming "Linux Style"**
    -   **Azione:** Creare una palette di colori centralizzata in un file CSS con variabili (es. `--linux-green`, `--terminal-bg`).
    -   **Azione:** Eseguire un refactoring completo di tutti gli stili e delle funzioni di disegno su canvas per utilizzare esclusivamente questa nuova palette.

- [ ] **Task 3.4: Aggiunta di Nuovi Contenuti di Gioco**
    -   **Azione:** Progettare e implementare un **nuovo boss** con meccaniche uniche.
    -   **Azione:** Creare 2-3 **varianti di sprite** per gli ostacoli (`codeBlocks`) per spezzare la monotonia visiva.

---

## 🌐 Modulo 4: Infrastruttura, Sito Web e Admin

**Obiettivo:** Costruire l'ecosistema attorno all'app per supportare la community e la gestione.

- [ ] **Task 4.1: Configurazione Dominio e Hosting**
    -   **Azione:** Collegare e configurare il dominio `codedash.top` su Firebase Hosting.

- [ ] **Task 4.2: Creazione Sito Web Vetrina**
    -   **Azione (Pagine):**
        -   Sviluppare una **Landing Page** tematica con screenshot, GIF e link agli store.
        -   Creare una pagina di **Supporto** con un form per inviare richieste a `support@codedash.top`.
        -   Pubblicare le pagine **Termini e Condizioni** e **Informativa sulla Privacy**.

- [ ] **Task 4.3: Pannello di Amministrazione**
    -   **Azione (Backend):** Aggiungere un flag `isAdmin: true` ai profili utente su Firestore.
    -   **Azione (Frontend):** Creare una pagina `admin.html` protetta, accessibile solo agli admin.
    -   **Azione (Funzionalità):**
        -   Dashboard con statistiche (utenti totali/attivi).
        -   Lista di tutti gli utenti registrati.
        -   Visualizzazione dei dettagli di registrazione di un singolo utente al click.


