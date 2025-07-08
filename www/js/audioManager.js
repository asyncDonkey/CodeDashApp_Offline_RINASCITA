// www/js/audioManager.js

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {}; // Conterrà i buffer audio caricati
let backgroundMusicSource = null; // Riferimento alla sorgente della musica di sottofondo
let backgroundMusicBuffer = null; // Buffer per la musica di sottofondo
let isMusicPlaying = false;
const masterGainNode = audioContext.createGain(); // Nodo Gain principale per controllare il volume generale
masterGainNode.connect(audioContext.destination);
masterGainNode.gain.value = 0.7; // Volume di default (0.0 a 1.0)

const soundEffectsGainNode = audioContext.createGain(); // Nodo Gain per gli effetti sonori
soundEffectsGainNode.connect(masterGainNode);
soundEffectsGainNode.gain.value = 0.5; // MODIFICATO: Volume effetti sonori, ora più basso

const musicGainNode = audioContext.createGain(); // Nodo Gain per la musica
musicGainNode.connect(masterGainNode);
let defaultMusicVolume = 0.8; // MODIFICATO: Volume di default della musica, ora più alto
musicGainNode.gain.value = defaultMusicVolume; // Volume musica (relativo al master, spesso più basso)

// NUOVE VARIABILI:
let currentBackgroundMusicName = null; // Per tracciare quale musica è in riproduzione (es. 'menu_music_1', 'glitchzilla_music')
const backgroundMusicBuffers = {}; // Nuovo oggetto per memorizzare i buffer delle diverse tracce musicali

/**
 * Carica un singolo file audio.
 * @param {string} name - Nome identificativo del suono.
 * @param {string} path - Percorso del file audio.
 * @returns {Promise<AudioBuffer>}
 */
async function loadSound(name, path) {
    if (!audioContext) {
        console.warn('AudioContext non supportato. Audio disabilitato.');
        return Promise.reject('AudioContext not supported');
    }
    if (sounds[name]) {
        return Promise.resolve(sounds[name]); // Già caricato
    }
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status} nel caricare ${path}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        sounds[name] = audioBuffer;
        console.log(`Audio caricato: ${name} da ${path}`);
        return audioBuffer;
    } catch (error) {
        console.error(`Errore durante il caricamento o decodifica dell'audio ${name} (${path}):`, error);
        sounds[name] = null; // Segna come fallito per non riprovare inutilmente
        return Promise.reject(error);
    }
}

/**
 * Carica una traccia di musica di sottofondo specificata da un nome.
 * @param {string} name - Nome identificativo della traccia musicale (es. 'menu_music', 'game_music', 'trojan_byte_music').
 * @param {string} path - Percorso del file musicale.
 * @returns {Promise<AudioBuffer>}
 */
async function loadBackgroundMusic(name, path) { // Modificato: aggiunto 'name'
    if (!audioContext) {
        console.warn('AudioContext non supportato. Audio disabilitato.');
        return Promise.reject('AudioContext not supported');
    }
    // Usa 'backgroundMusicBuffers' per memorizzare le musiche caricate
    if (backgroundMusicBuffers[name]) {
        console.log(`Musica '${name}' già caricata.`);
        return Promise.resolve(backgroundMusicBuffers[name]);
    }
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Errore HTTP ${response.status} nel caricare la musica ${path}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        backgroundMusicBuffers[name] = audioBuffer; // Salva il buffer con il suo nome
        console.log(`Musica di sottofondo '${name}' caricata da: ${path}`);
        return audioBuffer;
    } catch (error) {
        // Modificato: il messaggio di errore ora usa 'name' e 'path' correttamente
        console.error(`Errore caricamento musica di sottofondo '${name}' (${path}):`, error);
        backgroundMusicBuffers[name] = null; // Segna come fallito
        return Promise.reject(error);
    }
}

/**
 * Avvia una specifica traccia musicale di sottofondo.
 * Ferma la traccia attualmente in riproduzione, se presente.
 * @param {string} musicName - Il nome della traccia musicale da riprodurre (es. 'menu_music', 'game_music', 'trojan_byte_music').
 * @param {boolean} [loop=true] - Se la musica deve andare in loop.
 */
function playMusicByName(musicName, loop = true) {
    // Usa 'backgroundMusicBuffers' per trovare il buffer corretto
    const bufferToPlay = backgroundMusicBuffers[musicName];
    if (!audioContext || !bufferToPlay) {
        console.warn(`Buffer musica '${musicName}' non caricato o AudioContext non disponibile.`);
        return;
    }

    // Se la musica richiesta è già in riproduzione, non fare nulla
    if (currentBackgroundMusicName === musicName && isMusicPlaying && backgroundMusicSource && audioContext.state !== 'suspended') {
        console.log(`La musica '${musicName}' è già in riproduzione.`);
        return;
    }

    stopMusic(); // Ferma la musica attualmente in riproduzione

    // Resetta il volume in caso fosse stato mutato dalla pausa
    musicGainNode.gain.value = defaultMusicVolume;

    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('AudioContext ripreso, avvio musica con nome.');
            actuallyPlaySpecificMusic(musicName, bufferToPlay, loop);
        });
    } else {
        actuallyPlaySpecificMusic(musicName, bufferToPlay, loop);
    }
}

// NUOVA funzione helper per la riproduzione effettiva
function actuallyPlaySpecificMusic(musicName, buffer, loop) {
    backgroundMusicSource = audioContext.createBufferSource();
    backgroundMusicSource.buffer = buffer;
    backgroundMusicSource.connect(musicGainNode); // Connetti al gain della musica
    backgroundMusicSource.loop = loop;
    backgroundMusicSource.onended = () => {
        console.log(`Musica di sottofondo '${musicName}' terminata.`);
        isMusicPlaying = false;
        currentBackgroundMusicName = null;
    };
    backgroundMusicSource.start(0);
    isMusicPlaying = true;
    currentBackgroundMusicName = musicName; // Aggiorna il nome della traccia corrente
    console.log(`Musica di sottofondo '${musicName}' avviata.`);
}

/**
 * Riproduce un suono caricato.
 * @param {string} name - Nome del suono da riprodurre.
 * @param {boolean} [loop=false] - Se il suono deve andare in loop.
 * @param {number} [volume=1.0] - Volume specifico per questa istanza del suono (0.0 a 1.0).
 * @returns {AudioBufferSourceNode | null} La sorgente audio creata, o null se il suono non è disponibile.
 */
function playSound(name, loop = false, volume = 1.0) {
    if (!audioContext || !sounds[name]) {
        console.warn(`Suono '${name}' non trovato o AudioContext non disponibile.`);
        return null;
    }
    // Assicura che l'AudioContext sia 'running' (interazione utente potrebbe essere richiesta)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const source = audioContext.createBufferSource();
    source.buffer = sounds[name];

    // Crea un nodo Gain per questo specifico suono per controllare il volume individuale
    const individualGainNode = audioContext.createGain();
    individualGainNode.gain.value = volume;

    source.connect(individualGainNode);
    individualGainNode.connect(soundEffectsGainNode); // Connetti al gain degli effetti sonori

    source.loop = loop;
    source.start(0);
    return source;
}

function playMusic(loop = true) {
    playMusicByName('game_music', loop); // Assumendo 'game_music' sia la musica predefinita
}

// Rimosso: la vecchia funzione actuallyPlayMusic non è più necessaria con playMusicByName
/*
function actuallyPlayMusic(loop) {
    if (isMusicPlaying && backgroundMusicSource) {
        backgroundMusicSource.stop(); // Ferma la musica precedente se ce n'è una
    }
    backgroundMusicSource = audioContext.createBufferSource();
    backgroundMusicSource.buffer = backgroundMusicBuffer;
    backgroundMusicSource.connect(musicGainNode); // Connetti al gain della musica
    backgroundMusicSource.loop = loop;
    backgroundMusicSource.onended = () => {
        console.log('Musica di sottofondo terminata.');
        isMusicPlaying = false;
    };
    backgroundMusicSource.start(0);
    isMusicPlaying = true;
    console.log('Musica di sottofondo avviata.');
}
*/

/**
 * Ferma la musica di sottofondo.
 */
function stopMusic() {
     if (backgroundMusicSource && isMusicPlaying) {
        backgroundMusicSource.onended = null; // Previene l'esecuzione di eventi onended
        backgroundMusicSource.stop(0);
        backgroundMusicSource = null; // Distrugge il riferimento alla sorgente
        isMusicPlaying = false;
        console.log('Musica di sottofondo fermata.');
     }
}

/**
 * NUOVO: Mette in pausa la musica (la muta)
 */
function pauseMusic() {
    if (musicGainNode) {
        musicGainNode.gain.value = 0; // Muta la musica
        console.log('Musica in pausa (mutata).');
    }
}

/**
 * NUOVO: Riprende la musica (ripristina il volume)
 */
function resumeMusic() {
    if (musicGainNode) {
        musicGainNode.gain.value = defaultMusicVolume; // Ripristina il volume
        // Assicurati che l'AudioContext sia ripreso se era sospeso (dovrebbe già essere gestito altrove, ma per sicurezza)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        console.log('Musica ripresa.');
    }
}


/**
 * Imposta il volume generale (master).
 * @param {number} volumeLevel - Livello del volume da 0.0 (muto) a 1.0 (massimo).
 */
function setMasterVolume(volumeLevel) {
    if (masterGainNode) {
        masterGainNode.gain.value = Math.max(0, Math.min(1, volumeLevel)); // Clamp tra 0 e 1
        console.log(`Volume master impostato a: ${masterGainNode.gain.value}`);
    }
}
/**
 * Imposta il volume degli effetti sonori.
 * @param {number} volumeLevel - Livello del volume da 0.0 a 1.0.
 */
function setSoundEffectsVolume(volumeLevel) {
    if (soundEffectsGainNode) {
        soundEffectsGainNode.gain.value = Math.max(0, Math.min(1, volumeLevel));
        console.log(`Volume effetti sonori impostato a: ${soundEffectsGainNode.gain.value}`);
    }
}

/**
 * Imposta il volume della musica.
 * @param {number} volumeLevel - Livello del volume da 0.0 a 1.0.
 */
function setMusicVolume(volumeLevel) {
    if (musicGainNode) {
        defaultMusicVolume = Math.max(0, Math.min(1, volumeLevel)); // Aggiorna anche il volume di default
        musicGainNode.gain.value = defaultMusicVolume;
        console.log(`Volume musica impostato a: ${musicGainNode.gain.value}`);
    }
}

// Esporta le funzioni che vuoi rendere disponibili al gioco
export {
    loadSound,
    playSound,
    loadBackgroundMusic, // Ancora utile per caricare singolarmente
    playMusic,           // Se si mantiene come default (vedi punto 4)
    playMusicByName,     // NUOVA: Funzione per riprodurre musica specifica
    stopMusic,
    pauseMusic,          // NUOVO: Esporta funzione per pausa musica
    resumeMusic,         // NUOVO: Esporta funzione per riprendere musica
    setMasterVolume,
    setSoundEffectsVolume,
    setMusicVolume,
    audioContext, // Esponi per controlli avanzati o resume su interazione utente
    currentBackgroundMusicName, // NUOVA: Esponi per sapere quale musica è in riproduzione
};