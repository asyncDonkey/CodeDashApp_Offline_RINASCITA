// www/js/loader.js

import { setupGameEngine, preloadGameAssets } from './donkeyRunner.js';
import * as AudioManager from './audioManager.js';
import { showToast } from './toastNotifications.js';
import { initializeMenu } from './main.js';
import { menuAnimation, bitTypes } from './menuAnimation.js';

console.log("loader.js FILE CARICATO E IN ESECUZIONE");

// Riferimenti DOM
const terminalContainer = document.getElementById('terminal-container');
const terminalLog = document.getElementById('terminal-log');
const mainMenu = document.getElementById('main-menu');
const loaderCanvas = document.getElementById('loaderCanvas');
const topBarLeft = document.getElementById('top-bar-left');
const topBarRight = document.getElementById('top-bar-right');
const gameContainerWrapper = document.getElementById('game-container-wrapper');
// NUOVA MODIFICA: Riferimento al contenitore della barra di progresso
const multiProgressContainer = document.getElementById('multi-progress-container');


let loaderCtx = null;
let loaderAnimationId = null;
let staticLoadingImage = null;
let lastLoaderFrameTime = 0;

const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(`Impossibile caricare l'immagine: ${src}`);
            reject(new Error(`Fallimento caricamento ${src}`));
        };
        img.src = src;
    });
};

async function preloadMenuBitSprites() {
    console.log('[Loader] Pre-caricamento sprite dei bit del menu...');
    const promises = Object.entries(bitTypes).map(([name, type]) => {
        return new Promise((resolve) => {
            if (!type.src) {
                console.warn(`[Loader] Nessun percorso 'src' per il tipo di bit: ${name}`);
                resolve();
                return;
            }
            const img = new Image();
            img.onload = () => {
                menuAnimation.bitSprites[name] = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`[Loader] Impossibile caricare lo sprite del bit: ${type.src}`);
                // Risolvi comunque per non bloccare il caricamento
                resolve();
            };
            img.src = type.src;
        });
    });
    await Promise.all(promises);
    console.log('[Loader] Tutti gli sprite dei bit del menu sono stati pre-caricati.');
}

async function preloadLoaderSounds() {
    console.log('Pre-caricamento suoni del loader...');
    try {
        await AudioManager.loadSound('success_bleep', 'audio/success_bleep.ogg');
        console.log('Suono del loader caricato con successo.');
    } catch (error) {
        console.warn('Uno o più suoni del loader non sono stati caricati:', error);
    }
}

function setupRenderingContextForLoader(context) {
    context.imageSmoothingEnabled = false;
    console.log('Image smoothing disabled for loader context.');
}

function runLoadingBar(barId, assetLoadingPromises) {
    const progressBarElement = document.getElementById(barId);
    if (!progressBarElement) return Promise.resolve();

    let progress = 0;
    const barWidth = 40;

    const updateProgress = () => {
        const filledBlocks = Math.max(0, Math.min(barWidth, Math.round((barWidth * progress) / 100)));
        const emptyBlocks = barWidth - filledBlocks;
        const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
        progressBarElement.textContent = `[${bar}] ${Math.round(progress)}%`;
    };

    updateProgress();

    return new Promise(resolve => {
        let startTime = performance.now();
        const durationEstimate = 1500; // Riduciamo la durata per una sensazione più reattiva

        const animateBar = (currentTime) => {
            const elapsed = currentTime - startTime;
            progress = Math.min(100, (elapsed / durationEstimate) * 100);
            updateProgress();
            if (progress < 100) {
                requestAnimationFrame(animateBar);
            }
        };

        Promise.all(assetLoadingPromises).then(() => {
             // Quando gli asset sono pronti, anima velocemente al 100% se non ci è già
            const finalAnimation = (currentTime) => {
                const elapsed = currentTime - startTime;
                progress = Math.min(100, progress + 5); // Salta velocemente al 100%
                updateProgress();
                if(progress < 100) {
                    requestAnimationFrame(finalAnimation);
                } else {
                     resolve();
                }
            };
            requestAnimationFrame(finalAnimation);
        }).catch(error => {
            console.error("[Loader] Errore durante il caricamento degli asset.", error);
            resolve();
        });

        // Avvia un'animazione di base indipendentemente dal caricamento
        requestAnimationFrame(animateBar);
    });
}


function loaderLoop() {
    if (!loaderCtx) return;

    loaderCtx.clearRect(0, 0, loaderCanvas.width, loaderCanvas.height);

    if (staticLoadingImage) {
        const targetWidth = 400;
        const targetHeight = 400;
        const x = (loaderCanvas.width / 2) - (targetWidth / 2);
        const y = (loaderCanvas.height / 2) - (targetHeight / 2);
        loaderCtx.drawImage(staticLoadingImage, x, y, targetWidth, targetHeight);
    }

    loaderAnimationId = requestAnimationFrame(loaderLoop);
}

export async function startLoadingSequence() {
    try {
        document.body.addEventListener('click', () => {
            if (AudioManager.audioContext?.state === 'suspended') {
                AudioManager.audioContext.resume();
            }
        }, { once: true });

        terminalContainer.style.opacity = 1;
        if (topBarLeft) topBarLeft.style.display = 'none';
        if (topBarRight) topBarRight.style.display = 'none';
        terminalContainer.style.display = 'flex';
        mainMenu.style.display = 'none';
        gameContainerWrapper.style.display = 'none';

        // --- INIZIO BLOCCO DI STILE CORRETTO ---
        // Applica gli stili per posizionare la barra di caricamento
        if (multiProgressContainer) {
            multiProgressContainer.style.display = 'flex';
            multiProgressContainer.style.position = 'absolute';
            multiProgressContainer.style.bottom = '50px';
            multiProgressContainer.style.left = '50%';
            multiProgressContainer.style.transform = 'translateX(-50%)';
            multiProgressContainer.style.width = 'fit-content';
            multiProgressContainer.style.flexDirection = 'column';
            multiProgressContainer.style.alignItems = 'center';
            multiProgressContainer.style.zIndex = '100'; // Assicurati che sia sopra il canvas
        }
        // --- FINE BLOCCO DI STILE CORRETTO ---

        await preloadLoaderSounds();
        staticLoadingImage = await loadImage('images/loadingScreen.png');

        loaderCtx = loaderCanvas.getContext('2d');
        setupRenderingContextForLoader(loaderCtx);

        const resizeLoaderCanvas = () => {
            loaderCanvas.width = window.innerWidth;
            loaderCanvas.height = window.innerHeight;
            setupRenderingContextForLoader(loaderCtx); // Riapplica le impostazioni al resize
        };
        window.addEventListener('resize', resizeLoaderCanvas);
        resizeLoaderCanvas();

        document.querySelector('.progress-bar-wrapper .progress-label').textContent = 'LOADING...';

        loaderLoop();

        setupGameEngine();

        const preloadGameAssetsPromise = preloadGameAssets();
        const preloadMenuBitsPromise = preloadMenuBitSprites();

        await runLoadingBar('progress-bar-1', [preloadGameAssetsPromise, preloadMenuBitsPromise]);

        AudioManager.playSound('success_bleep');

        // Dissolvenza finale
        setTimeout(() => {
            terminalContainer.style.transition = 'opacity 0.5s ease-out';
            terminalContainer.style.opacity = 0;
            setTimeout(() => {
                cancelAnimationFrame(loaderAnimationId); // Ferma il loop di rendering del loader
                terminalContainer.style.display = 'none';
                initializeMenu(); // Inizializza il menu DOPO che il loader è sparito
                if (topBarLeft) topBarLeft.style.display = 'flex';
                if (topBarRight) topBarRight.style.display = 'flex';
            }, 500); // Aspetta la fine della transizione
        }, 100);

    } catch (error) {
        console.error("ERRORE CRITICO durante la sequenza di caricamento:", error);
        if(terminalLog) terminalLog.innerHTML += `\n<span class="keyword-error">FATAL ERROR: ${error.message}</span>`;
    }
}