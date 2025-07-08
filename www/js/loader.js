// www/js/loader.js

import { setupGameEngine, preloadGameAssets } from './donkeyRunner.js';
import * as AudioManager from './audioManager.js'; // Importa AudioManager come modulo
import { showToast } from './toastNotifications.js';

// Rimosso l'import di Firebase Firestore, non più necessario per il gioco offline.
// import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'; 
import { initializeMenu } from './main.js'; // Importa initializeMenu per chiamarlo alla fine

console.log("loader.js FILE CARICATO E IN ESECUZIONE");

// Riferimenti DOM
const terminalContainer = document.getElementById('terminal-container');
const terminalLog = document.getElementById('terminal-log');
const mainMenu = document.getElementById('main-menu');
const startGameBtn = document.getElementById('start-game-btn');
const accountBtn = document.getElementById('account-icon-container');
const gameContainerWrapper = document.getElementById('game-container-wrapper');
const glitchpediaBtn = document.getElementById('glitchpedia-btn');


// NUOVO: Riferimento al canvas del loader
const loaderCanvas = document.getElementById('loaderCanvas'); // Assicurati che l'ID corrisponda a index.html
let loaderCtx = null;
let loaderGround = null; // This will remain null as LoaderGround class is removed

let loaderAnimationId = null;

// loaderBackgroundParticles and related variables are no longer needed, keeping for clarity of removal
// let loaderBackgroundParticles = []; 
let lastLoaderFrameTime = 0;

// NUOVO: Riferimenti DOM per i nuovi contenitori della top bar
const topBarLeft = document.getElementById('top-bar-left');
const topBarRight = document.getElementById('top-bar-right');

// NEW: Static loading image
let staticLoadingImage = null;


// Funzione helper per caricare immagini (copiata da menuAnimation.js)
const loadImage = (src) => {
   return new Promise((resolve, reject) => {
       const img = new Image();
       img.onload = () => resolve(img);
       img.onerror = (err) => {
          console.error(`Impossibile caricare lo sprite: ${src}`);
          reject(new Error(`Fallimento caricamento ${src}`));
       };
       img.src = src;
   });
};

// REMOVED: LoaderGround class is no longer needed
/*
// =================================================================================
// CLASSE LoaderGround (Adattata da MenuGround in menuAnimation.js)
// Sarà utilizzata anche per il loader, quindi la rendiamo generica
// =================================================================================
class LoaderGround {
   constructor(canvas) {
       this.canvas = canvas;
       this.ctx = canvas.getContext('2d');
       this.GROUND_LEVEL_PERCENT = 0.85; // Percentuale di altezza del canvas per la linea di terra
       this.y = this.canvas.height * this.GROUND_LEVEL_PERCENT;

       this.palette = {
          DARK_TEAL_BLUE: '#32535f',
          MEDIUM_TEAL: '#0b8a8f',
          BRIGHT_TEAL: '#0eaf9b',
       };
       this.lineWidth = 2;
   }

   draw() {
       const groundHeight = this.canvas.height - this.y;
       this.ctx.fillStyle = this.palette.DARK_TEAL_BLUE;
       this.ctx.fillRect(0, this.y, this.canvas.width, groundHeight);

       this.ctx.fillStyle = this.palette.MEDIUM_TEAL;
       this.ctx.fillRect(0, this.y, this.canvas.width, this.lineWidth * 3);

       this.ctx.fillStyle = this.palette.BRIGHT_TEAL;
       this.ctx.fillRect(0, this.y + this.lineWidth * 3, this.canvas.width, this.lineWidth);
   }

   resize() {
       this.y = this.canvas.height * this.GROUND_LEVEL_PERCENT;
   }
}
*/

async function preloadLoaderSounds() {
   console.log('Pre-caricamento suoni del loader...');
   try {
       // Only preload success_bleep as per new requirements
       await AudioManager.loadSound('success_bleep', 'audio/success_bleep.ogg');
       console.log('Suono del loader caricato con successo.');
   } catch (error) {
       console.warn('Uno o più suoni del loader non sono stati caricati:', error);
   }
}

// NUOVO: Funzione helper per configurare il contesto di rendering
// Copiata da donkeyRunner.js per una configurazione completa di imageSmoothingEnabled
function setupRenderingContextForLoader(context) {
    context.imageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    console.log('Image smoothing disabled for loader context.');
}

// REMOVED: initializeLoaderBackgroundParticles function is no longer needed
/*
// NUOVO: Funzione per inizializzare le particelle di sfondo del loader (adattata da menuAnimation.js)
function initializeLoaderBackgroundParticles() {
    loaderBackgroundParticles = [];
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ<>!@#$%^&*()_+{}|[]?';
    // Particelle con velocità leggermente diverse per l'effetto parallasse
    const layers = [
        { count: 120, speed: 0.08, size: 10, alpha: 0.18 }, // Livello più lontano
        { count: 80, speed: 0.15, size: 14, alpha: 0.35 },   // Livello intermedio
        { count: 50, speed: 0.25, size: 18, alpha: 0.55 }    // Livello più vicino
    ];

    layers.forEach(layer => {
        for (let i = 0; i < layer.count; i++) {
            loaderBackgroundParticles.push({
                x: Math.random() * loaderCanvas.width,
                y: Math.random() * loaderCanvas.height,
                char: chars[Math.floor(Math.random() * chars.length)],
                speed: layer.speed,
                size: layer.size,
                alpha: layer.alpha
            });
        }
    });
}
*/

// REMOVED: drawLoaderBackgroundEffects function is no longer needed
/*
// NUOVO: Funzione per aggiornare e disegnare lo sfondo dinamico del loader
function drawLoaderBackgroundEffects(deltaTime) {
    // 1. Disegna il colore di sfondo solido del loader
    loaderCtx.fillStyle = '#111827'; // Usa il colore base del terminale
    loaderCtx.fillRect(0, 0, loaderCanvas.width, loaderCanvas.height);

    // 2. Aggiorna e disegna le particelle di sfondo
    loaderBackgroundParticles.forEach(p => {
        p.y += p.speed * deltaTime * 100; // Moltiplica per 100 per mantenere la velocità simile tra frame
        if (p.y > loaderCanvas.height) {
            p.y = 0;
            p.x = Math.random() * loaderCanvas.width;
        }
    });

    loaderCtx.save();
    loaderBackgroundParticles.forEach(p => {
        // Colore delle particelle (es. verde-blu del terminale)
        const particleColor = `rgba(14, 175, 155, ${p.alpha})`;

        loaderCtx.fillStyle = particleColor;
        loaderCtx.font = `${p.size}px "Source Code Pro", monospace`;
        loaderCtx.fillText(p.char, p.x, p.y);
    });
    loaderCtx.restore();

    // 3. Disegna l'effetto Scanlines
    loaderCtx.save();
    loaderCtx.fillStyle = 'rgba(50, 50, 50, 0.2)'; // Grigio scuro semi-trasparente
    for (let i = 0; i < loaderCanvas.height; i += 3) {
        loaderCtx.fillRect(0, i, loaderCanvas.width, 1);
    }
    loaderCtx.restore();
}
*/

// Update runTopLoadingBar to be just runLoadingBar, and track asset loading progress
function runLoadingBar(barId, assetLoadingPromise) {
    const progressBarElement = document.getElementById(barId);
    if (!progressBarElement) return Promise.resolve();

    let progress = 0;
    const updateProgress = () => {
        const barWidth = 40;

        // Calcola filledBlocks: arrotonda al numero intero più vicino.
        // Clampa il risultato per assicurare che sia tra 0 e barWidth.
        const filledBlocks = Math.max(0, Math.min(barWidth, Math.round((barWidth * progress) / 100)));

        // emptyBlocks è semplicemente la differenza. Non può essere negativo se filledBlocks è clampato correttamente.
        const emptyBlocks = barWidth - filledBlocks;

        const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
        progressBarElement.textContent = `[${bar}] ${Math.round(progress)}%`;
    };

    updateProgress(); // Initial draw

    let animationFrame;
    const durationEstimate = 3000; // Keep the same duration estimate for the animation
    let startTime; // Declare startTime here

    assetLoadingPromise.then(() => {
        startTime = performance.now(); // Set startTime when the promise resolves to start animation
        animationFrame = requestAnimationFrame(animateBar); // Start animation when assets are loaded
    });

    const animateBar = (currentTime) => {
        const elapsed = currentTime - startTime;
        progress = Math.min(100, (elapsed / durationEstimate) * 100);
        updateProgress();
        if (progress < 100) {
            animationFrame = requestAnimationFrame(animateBar);
        }
    };
    

    return new Promise(resolve => {
        assetLoadingPromise.then(() => {
            cancelAnimationFrame(animationFrame);
            progress = 100; // Assicura che la barra sia al 100% alla fine
            updateProgress();
            resolve();
        });
    });
}

// NUOVO: Loop di rendering per il loader canvas
function loaderLoop() {
    if (!loaderCtx) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastLoaderFrameTime) / 1000; // Calcola deltaTime
    lastLoaderFrameTime = currentTime; // Aggiorna il tempo dell'ultimo frame

    loaderCtx.clearRect(0, 0, loaderCanvas.width, loaderCanvas.height); // Pulisce il canvas

    // REMOVED: drawLoaderBackgroundEffects(deltaTime);
    // REMOVED: loaderGround.draw();

    // Draw the static loading image
    if (staticLoadingImage) {
        const targetWidth = 400; // Desired display width
        const targetHeight = 400; // Desired display height
        const x = (loaderCanvas.width / 2) - (targetWidth / 2);
        const y = (loaderCanvas.height / 2) - (targetHeight / 2); // Center perfectly vertically
        loaderCtx.drawImage(staticLoadingImage, x, y, targetWidth, targetHeight);
    }

    loaderAnimationId = requestAnimationFrame(loaderLoop);
}

// Applica la stessa correzione a updateIndividualAsciiBar
function updateIndividualAsciiBar(barId, percentage) {
    const progressBarElement = document.getElementById(barId);
    if (!progressBarElement) return;
    const barWidth = 40;

    const filledBlocks = Math.max(0, Math.min(barWidth, Math.round((barWidth * percentage) / 100)));
    const emptyBlocks = barWidth - filledBlocks;

    const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
    progressBarElement.textContent = `[${bar}] ${percentage}%`;
}

export async function startLoadingSequence(initialUser = null) {
    try {
        document.body.addEventListener('click', () => {
            if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
                AudioManager.audioContext.resume();
            }
        }, { once: true });

        terminalContainer.style.opacity = 1; // Questo dovrebbe essere già impostato a 1 all'inizio

        await preloadLoaderSounds();

        try {
            staticLoadingImage = await loadImage('images/loadingScreen.png');
            console.log('Static loading image loaded successfully.');
        } catch (e) {
            console.error('Failed to load static loading image:', e);
        }

        if (!loaderCanvas) {
            console.error("loaderCanvas non trovato! Assicurati che sia in index.html con id='loaderCanvas'");
            return;
        }
        loaderCtx = loaderCanvas.getContext('2d');

        setupRenderingContextForLoader(loaderCtx);
        console.log('Loader Context Image Smoothing Enabled:', loaderCtx.imageSmoothingEnabled);

        // REMOVED: initializeLoaderBackgroundParticles();
        // loaderBackgroundParticles is no longer used, so this call can be removed
        // but the function definition for initializeLoaderBackgroundParticles() itself
        // is kept in the provided code, so I will comment out the call here.

        const resizeLoaderCanvas = () => {
            loaderCanvas.width = window.innerWidth;
            loaderCanvas.height = window.innerHeight;
            // REMOVED: if (loaderGround) loaderGround.resize();
            // REMOVED: initializeLoaderBackgroundParticles();
        };
        window.addEventListener('resize', resizeLoaderCanvas);
        resizeLoaderCanvas();

        loaderGround = null; // Ensure loaderGround is explicitly null

        if (accountBtn) accountBtn.style.display = 'none';
        if (topBarLeft) topBarLeft.style.display = 'none';
        if (topBarRight) topBarRight.style.display = 'none';
        terminalContainer.style.display = 'flex';
        terminalLog.style.display = 'none';

        const multiProgressContainer = document.getElementById('multi-progress-container');
        if (multiProgressContainer) {
            multiProgressContainer.style.display = 'flex';
            multiProgressContainer.style.position = 'absolute';
            multiProgressContainer.style.bottom = '50px';
            multiProgressContainer.style.left = '50%';
            multiProgressContainer.style.transform = 'translateX(-50%)';
            multiProgressContainer.style.width = 'fit-content';
            multiProgressContainer.style.flexDirection = 'column';
            multiProgressContainer.style.alignItems = 'center';
        }

        mainMenu.style.display = 'none';
        gameContainerWrapper.style.display = 'none';

        updateIndividualAsciiBar('progress-bar-1', 0);

        document.querySelector('.progress-bar-wrapper .progress-label').textContent = 'LOADING...';

        lastLoaderFrameTime = performance.now();
        loaderLoop();


        setupGameEngine();
        const preloadGameAssetsPromise = preloadGameAssets();

        await runLoadingBar('progress-bar-1', preloadGameAssetsPromise);

        AudioManager.playSound('success_bleep');

        // *** INSERISCI QUI I NUOVI LOG E TIMEOUT DI TEST ***
        console.log("SUONO DI SUCCESSO ESEGUITO. A breve tentiamo di dissolvere."); // Questo DEVE apparire
        setTimeout(() => {
            console.log("TIMEOUT DI DISSOLVENZA INIZIATO!"); // Questo DEVE apparire
            terminalContainer.style.opacity = 0; // Tentiamo di dissolvere
            console.log("Opacità impostata a 0, valore corrente:", terminalContainer.style.opacity); // Verifica il valore dopo l'impostazione
            // ... (il resto del codice del tuo timeout, senza altri log per ora) ...
            loaderCanvas.style.display = 'none'; // Nascondi il canvas del loader

            setTimeout(() => { // Il secondo setTimeout
                terminalContainer.style.display = 'none';
                initializeMenu();
                if (accountBtn) accountBtn.style.display = 'flex';
                if (topBarLeft) topBarLeft.style.display = 'flex';
                if (topBarRight) topBarRight.style.display = 'flex';
            }, 100);
        }, 300);
        // *** FINE BLOCCO DI TEST ***

    } catch (error) {
        console.error("ERRORE CRITICO durante la sequenza di caricamento:", error);
        terminalLog.innerHTML += `\n<span class="keyword-error">FATAL ERROR: ${error.message}</span>`;
    }
}

if (glitchpediaBtn) {
   glitchpediaBtn.addEventListener('click', () => {
       showToast('Apertura Glitchpedia...', 'info');
       const glitchpediaModal = document.getElementById('glitchpediaModal');
       if (glitchpediaModal) glitchpediaModal.style.display = 'block';
   });
}

// Listener per l'icona account/profilo.
// La logica di cosa fare (aprire modale login o profilo) è in auth.js e profile.js
// Qui ci assicuriamo solo che il contenitore esista.
if (accountBtn) {
   console.log('Account icon container is ready.');
}