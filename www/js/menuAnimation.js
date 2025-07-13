// www/js/menuAnimation.js

// www/js/menuAnimation.js

import * as AudioManager from './audioManager.js';
import { showToast } from './toastNotifications.js';
import {
    COMPANION_ASSET_MAP,
    GLOBAL_SPRITE_SCALE_FACTOR,
    SKIN_ASSET_MAP,
} from './donkeyRunner.js';
import { SpriteAnimation } from './animation.js';

const loadImageForMenuDisplay = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(`Impossibile caricare lo sprite per il menu: ${src}`, err);
            resolve(null);
        };
        img.src = src;
    });
};

// NUOVO: Esporta la variabile isRainingOnGameStart
export let isRainingOnGameStart = false;


// Costanti
const GRAVITY = 0.6;
const GROUND_LEVEL_PERCENT = 0.85;
const MAX_BITS_ON_SCREEN = 5;
const MIN_BIT_SPAWN_INTERVAL = 3 * 1000;
const MAX_BIT_SPAWN_INTERVAL = 7 * 1000;

const CRYSTAL_BIT_SPAWN_CHANCE = 0.005;
const DIGITAL_FRUIT_SPAWN_CHANCE_MAX = 0.03;

// NUOVA COSTANTE: Altezza minima di spawn sopra il terreno
const MIN_BIT_SPAWN_HEIGHT_ABOVE_GROUND = 50;

// NUOVE COSTANTI PER LA PIOGGIA DIGITALE
const DONKEY_RAIN_PHRASES = ["It's raining =O", "Bugs are coming...", "init -RainBehaviour"];
const THUNDER_CLAP_SOUND_NAME = 'sfx_thunder_clap'; // Nome per il suono del tuono
const RAIN_PENDING_PHRASES = ["AWAITING RAIN...", "SCANNING FOR RAIN...", "IMMINENT DIGITAL RAIN..."];

export const bitTypes = {
    bronze: { value: 1, src: 'images/bits/bit_bronze.png', width: 16, height: 16, frameCount: 8, ticksPerFrame: 25, name: 'bronze' },
    silver: { value: 2, src: 'images/bits/bit_silver.png', width: 16, height: 16, frameCount: 8, ticksPerFrame: 25, name: 'silver' },
    gold: { value: 5, src: 'images/bits/bit_gold.png', width: 16, height: 16, frameCount: 8, ticksPerFrame: 25, name: 'gold' },
    platinum: { value: 10, src: 'images/bits/bit_platinum.png', width: 16, height: 16, frameCount: 8, ticksPerFrame: 25, name: 'platinum' },
    crystal: { value: 250, src: 'images/bits/bit_crystal.png', width: 16, height: 16, frameCount: 8, ticksPerFrame: 25, name: 'crystal' },
    digital_kiwi: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_kiwi.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_kiwi' },
    digital_orange: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_orange.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_orange' },
    digital_pear: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_pear.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_pear' },
    // --- INIZIO NUOVI DIGITAL FRUITS ---
    digital_apple: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_apple.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_apple' },
    digital_banana: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_banana.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_banana' },
    digital_berry: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_berry.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_berry' },
    digital_blueberry: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_blueberry.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_blueberry' },
    digital_cherry: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_cherry.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_cherry' },
    digital_coconut: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_coconut.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_coconut' },
    digital_dragonfruit: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_dragonfruit.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_dragonfruit' },
    digital_grapes: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_grapes.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_grapes' },
    digital_lemon: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_lemon.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_lemon' },
    digital_melon: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_melon.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_melon' },
    digital_papaya: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_papaya.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_papaya' },
    digital_peach: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_peach.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_peach' },
    digital_pineapple: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_pineapple.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_pineapple' },
    digital_strawberry: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_strawberry.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_strawberry' },
    digital_watermelon: { value: 0, fruitEquivalent: 1, src: 'images/bits/digital_fruits/digital_watermelon.png', width: 16, height: 16, frameCount: 1, ticksPerFrame: 30, name: 'digital_watermelon' },
    // --- FINE NUOVI DIGITAL FRUITS ---
};
const commonBitTypes = [
    'bronze', 'silver', 'gold', 'platinum',
    'digital_kiwi', 'digital_orange', 'digital_pear',
    // --- INIZIO NUOVI DIGITAL FRUITS NELLO SPAWN ---
    'digital_apple', 'digital_banana', 'digital_berry', 'digital_blueberry',
    'digital_cherry', 'digital_coconut', 'digital_dragonfruit', 'digital_grapes',
    'digital_lemon', 'digital_melon', 'digital_papaya', 'digital_peach',
    'digital_pineapple', 'digital_strawberry', 'digital_watermelon'
    // --- FINE NUOVI DIGITAL FRUITS NELLO SPAWN ---
];


// --- CLASSI DELL'ANIMAZIONE ---

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 50;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 50;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

class Bit {
    constructor(canvas, type, bitSprite) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type;
        this.sprite = bitSprite;

        this.value = type.value;
        this.width = type.width * GLOBAL_SPRITE_SCALE_FACTOR;
        this.height = type.height * GLOBAL_SPRITE_SCALE_FACTOR;
        this.frameCount = type.frameCount;
        this.ticksPerFrame = type.ticksPerFrame;

        const groundY = this.canvas.height * GROUND_LEVEL_PERCENT;
        this.x = Math.random() * (this.canvas.width - 100) + 50;
        // MODIFICATO: La posizione Y ora garantisce uno spawn al di cui sopra di una certa altezza dal terreno
        this.y = groundY - (Math.random() * 150 + this.height + MIN_BIT_SPAWN_HEIGHT_ABOVE_GROUND);

        this.frameIndex = 0;
        this.tickCount = 0;

        this.glowColor = '#f1fa8c';
        this.glowBlur = 10;
        this.glowAlpha = 0;
        this.glowDirection = 1;

        this.text = '';
        this.textColor = '';
        this.fontSize = 0;
        this.textOffset = 0;
        this.textAnimationTimer = Math.random() * Math.PI * 2;
        this.flashColors = [];

        if (type.name.startsWith('digital_')) {
            this.text = type.name.toUpperCase().replace('DIGITAL_', '') + ' DATA';
            this.fontSize = 12;
            this.flashColors = ['#31b0b0', '#46cfb3', '#73f0c6', '#abffd1', '#d9ffe2'];
        } else {
            this.text = `${type.value} BIT`;
            switch (type.name) {
                case 'bronze': this.textColor = '#e6e6ec'; this.fontSize = 10; break;
                case 'silver': this.textColor = '#C0C0C0'; this.fontSize = 11; break;
                case 'gold': this.textColor = '#FFD700'; this.fontSize = 12; break;
                case 'platinum': this.textColor = '#E5E4E2'; this.fontSize = 13; break;
                case 'crystal':
                    this.text = 'RICH BIT';
                    this.fontSize = 14;
                    this.flashColors = ['#ADD8E6', '#FFFFFF', '#87CEEB', '#00BFFF'];
                    break;
                default: this.textColor = '#e6e6ec'; this.fontSize = 10;
            }
        }
    }

    update() {
        if (this.frameCount > 1) {
            this.tickCount++;
            if (this.tickCount > this.ticksPerFrame) {
                this.tickCount = 0;
                this.frameIndex = (this.frameIndex + 1) % this.frameCount;
            }
        }

        this.glowAlpha += 0.02 * this.glowDirection;
        if (this.glowAlpha > 0.75) {
            this.glowAlpha = 0.75;
            this.glowDirection = -1;
        } else if (this.glowAlpha < 0) {
            this.glowAlpha = 0;
            this.glowDirection = 1;
        }

        this.textAnimationTimer += 0.1;
        this.textOffset = Math.sin(this.textAnimationTimer) * 2;
    }

    draw() {
        this.ctx.save();
        this.ctx.globalAlpha = this.glowAlpha;
        this.ctx.shadowBlur = this.glowBlur;
        this.ctx.shadowColor = this.glowColor;

        const sx = this.frameIndex * this.type.width;
        this.ctx.drawImage(this.sprite, sx, 0, this.type.width, this.type.height, this.x, this.y, this.width, this.height);

        this.ctx.restore();

        this.ctx.drawImage(this.sprite, sx, 0, this.type.width, this.type.height, this.x, this.y, this.width, this.height);

        this.ctx.save();
        if (this.flashColors.length > 0) {
            const colorIndex = Math.floor(Date.now() / 150) % this.flashColors.length;
            this.ctx.fillStyle = this.flashColors[colorIndex];
        } else {
            this.ctx.fillStyle = this.textColor;
        }

        this.ctx.font = `bold ${this.fontSize}px "Courier Prime", monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0,0,0,0.7)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(this.text, this.x + this.width / 2, this.y - 5 + this.textOffset);
        this.ctx.restore();
    }
}

// =================================================================================
// CLASSE MenuDonkey AGGIORNATA
// =================================================================================
class MenuDonkey {
    constructor(canvas, sprite, digestSprite, initialX = 50) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.sprite = sprite;
        this.digestSprite = digestSprite;

        this.sw = 64; this.sh = 64;
        this.dw = 64; this.dh = 64;
        this.x = initialX;
        this.groundY = this.canvas.height * GROUND_LEVEL_PERCENT - this.dh;
        this.y = this.groundY;
        this.dy = 0;
        this.originalDx = 1.2;
        this.dx = this.originalDx;
        this.isJumping = false;

        this.state = 'roaming';
        this.target = null;
        this.direction = 1;

        this.frameCount = 5;
        this.frameIndex = 0;
        this.ticksPerFrame = 12;
        this.tickCount = 0;

        this.digestFrameCount = 8;
        this.digestFrameIndex = 0;
        this.digestTicksPerFrame = 12;
        this.digestTickCount = 0;
        this.digestTimer = 0;

        this.speechBubble = document.getElementById('donkey-speech-bubble');
        this.isSpeaking = false;
        this.speechTimer = 0;
        this.currentSpeechText = '';
        this.typewriterIndex = 0;
        this.typewriterSpeed = 4;
        this.typewriterTick = 0;

        this.speechMessages = [
            "Mmm, data!", "Codelicious!", "01101110_01101111", "Syntax sugar!",
            "More please!", "Compiling...", "Buffer... loaded!", "Bugs in the menu?",
            "<3__<3", "-rm -rf", "That's some good async."
        ];
        this.digestMessages = [
            "Digesting data...", "Parsing complete.", "Mmm, bytes!", "CRUNCH."
        ];
        this.processingMessages = [
            "Initializing kernel...",
            "Validating checksums...",
            "Loading modules...",
            "Synchronizing data stream...",
            "Optimizing subroutines...",
            "DonkeyDebug subroutine: start",
            "Establishing secure connection..."
        ];
    }

    startBoost() {
        this.boostTimer = this.boostDuration;
    }

    // MODIFICATO: Aggiunto parametro 'force' per le priorità
    say(messageList = this.speechMessages, playSound = true, force = false) {
        if (!force && this.isSpeaking && this.state !== 'processing') return; // Se non forzato, rispetta stato

        if (playSound) {
            AudioManager.playSound('sfx_donkey_comment', false, 0.8);
        }

        this.isSpeaking = true;
        this.speechTimer = this.state === 'processing' ? 120 : 240;
        this.currentSpeechText = messageList[Math.floor(Math.random() * messageList.length)];

        this.typewriterIndex = 0;
        this.typewriterTick = 0;
        this.speechBubble.innerHTML = '';
        this.speechBubble.classList.add('visible');
    }

    startDigesting() {
        if (this.state === 'digesting') return;

        this.state = 'digesting';
        this.digestTimer = 120;
        this.digestFrameIndex = 0;
        this.digestTickCount = 0;

        AudioManager.playSound('sfx_donkey_digest', false, 0.7);
        this.say(this.digestMessages, false);
    }

    startProcessing() {
        this.state = 'processing';
        this.isDigesting = true;
        this.digestFrameIndex = 0;
        this.digestTickCount = 0;
        this.say(this.processingMessages, false);
    }

    stopProcessing() {
        if (this.state !== 'processing') return;
        this.isDigesting = false;
        this.state = 'roaming';
        this.speechBubble.classList.remove('visible');
        this.isSpeaking = false;
    }

    draw() {
        this.ctx.save();

        if (this.isDigesting || this.state === 'processing') {
            const sx = this.digestFrameIndex * this.sw;
            this.ctx.drawImage(this.digestSprite, sx, 0, this.sw, this.sh, this.x, this.y, this.dw, this.dh);
        } else {
            if (this.direction === -1) {
                this.ctx.scale(-1, 1);
                this.ctx.drawImage(this.sprite, this.frameIndex * this.sw, 0, this.sw, this.sh, -this.x - this.dw, this.y, this.dw, this.dh);
            } else {
                this.ctx.drawImage(this.sprite, this.frameIndex * this.sw, 0, this.sw, this.sh, this.x, this.y, this.dw, this.dh);
            }
        }

        this.ctx.restore();
    }

    update(dt) {
        let currentDx = this.originalDx;
        if (this.state === 'targeting') {
            currentDx = this.originalDx * 3;
        }
        this.dx = currentDx;

        switch (this.state) {
            case 'exiting':
                this.direction = 1;
                this.x += 8;
                break;
            case 'roaming':
                this.x += this.dx * this.direction;
                if (this.x + this.dw > this.canvas.width || this.x < 0) this.direction *= -1;
                break;
            case 'targeting':
                if (this.target) {
                    const targetCenter = this.target.x + this.target.width / 2;
                    const selfCenter = this.x + this.dw / 2;
                    const horizontalAlignmentThreshold = 5;

                    const donkeyCollectionY = this.y + (this.dh * 0.9);
                    const bitCollectionY = this.target.y + (this.target.height * 0.5);

                    if (Math.abs(targetCenter - selfCenter) < horizontalAlignmentThreshold) {
                        if (bitCollectionY < donkeyCollectionY - 20) {
                            this._jump();
                        } else {
                            this.x = targetCenter - this.dw / 2;
                            if (!this.isJumping) {
                                if (this.state !== 'digesting') {
                                    this.startDigesting();
                                }
                            }
                        }
                    } else {
                        this.direction = (targetCenter > selfCenter) ? 1 : -1;
                        this.x += this.dx * this.direction;
                    }
                } else {
                    this.state = 'roaming';
                }
                break;
            case 'digesting':
                this.digestTimer--;
                if (this.digestTimer <= 0) {
                    this.state = 'roaming';
                }
                break;
            case 'processing':
                break;
        }
        this.dy += GRAVITY;
        this.y += this.dy;
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.dy = 0;
            this.isJumping = false;
        }

        if (this.isDigesting || this.state === 'processing') {
            this.digestTickCount++;
            if (this.digestTickCount > this.digestTicksPerFrame) {
                this.digestTickCount = 0;
                this.digestFrameIndex = (this.digestFrameIndex + 1) % this.digestFrameCount;
            }
        } else {
            this.tickCount++;
            if (this.tickCount > this.ticksPerFrame) {
                this.tickCount = 0;
                this.frameIndex = this.isJumping ? 1 : (this.frameIndex + 1) % this.frameCount;
            }
        }

        if (this.isSpeaking) {
            this.speechTimer--;

            if (this.typewriterIndex < this.currentSpeechText.length) {
                this.typewriterTick++;
                if (this.typewriterTick >= this.typewriterSpeed) {
                    this.typewriterTick = 0;
                    this.typewriterIndex++;
                    this.speechBubble.innerHTML = this.currentSpeechText.substring(0, this.typewriterIndex) + '<span class="cursor">_</span>';
                }
            } else {
                this.speechBubble.innerHTML = this.currentSpeechText;
            }

            if (this.speechTimer <= 0) {
                this.isSpeaking = false;
                this.speechBubble.classList.remove('visible');
            } else {
                const bubbleX = this.x + this.dw / 2 - this.speechBubble.offsetWidth / 2;
                const bubbleY = this.y - this.speechBubble.offsetHeight - 5;
                this.speechBubble.style.left = `${bubbleX}px`;
                this.speechBubble.style.top = `${bubbleY}px`;
            }
        }
    }

    _jump() { if (!this.isJumping) { this.dy = -15; this.isJumping = true; } }
    setTarget(character) {
        if (this.state === 'digesting' || this.state === 'processing') return;
        this.target = character;
        this.state = 'targeting';
    }
}
// [CORRECTION] Moved MenuGround class definition before menuAnimation object
class MenuGround {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.y = this.canvas.height * GROUND_LEVEL_PERCENT;

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
        this.y = this.canvas.height * GROUND_LEVEL_PERCENT;
    }
}

// NUOVA CLASSE: MenuCompanion
class MenuCompanion {
    constructor(canvas, typeId, companionSprite, frameWidth, frameHeight, numFrames) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.typeId = typeId;
        this.sprite = companionSprite;

        this.sw = frameWidth;
        this.sh = frameHeight;
        this.dw = this.sw;
        this.dh = this.sh;

        this.x = Math.random() * (this.canvas.width * 0.8) + (this.canvas.width * 0.1);
        this.y = this.canvas.height * (GROUND_LEVEL_PERCENT - 0.1) - (Math.random() * 50 + this.dh);

        this.dx = 0.8 + Math.random() * 0.4;
        this.direction = Math.random() < 0.5 ? 1 : -1;

        this.frameCount = numFrames;
        this.frameIndex = 0;
        this.ticksPerFrame = 12;
        this.tickCount = 0;

        this.isSpeaking = false;
        this.speechTimer = 0;
        this.currentSpeechText = '';
        this.speechMessages = this.getCompanionMessages(typeId);
        this.textOffset = 0;
        this.textAnimationTimer = Math.random() * Math.PI * 2;
    }

    getCompanionMessages(typeId) {
        switch(typeId) {
            case 'companion_cloud_assistant':
                return [
                    "Cloud online!", "Syncing...", "Uploading thoughts...", "Data flow optimal.",
                    "Hello, human!", "Checking for updates..."
                ];
            case 'companion_debuggator_ia':
                return [
                    "Bug detected!", "Compiling fixes...", "Error: none!", "Debugging complete.",
                    "Analyzing vulnerabilities...", "Code is clean!"
                ];
            default:
                return ["Beep!", "Boop!", "Working..."];
        }
    }

    say(messageList = this.speechMessages) {
        if (this.isSpeaking) return;
        this.isSpeaking = true;
        this.speechTimer = 180;
        this.currentSpeechText = messageList[Math.floor(Math.random() * messageList.length)];
        this.textAnimationTimer = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.dx * this.direction;
        if (this.x + this.dw > this.canvas.width || this.x < 0) {
            this.direction *= -1;
            this.dx = 0.8 + Math.random() * 0.4;
        }

        this.tickCount++;
        if (this.tickCount > this.ticksPerFrame) {
            this.tickCount = 0;
            this.frameIndex = (this.frameIndex + 1) % this.frameCount;
        }

        if (this.isSpeaking) {
            this.speechTimer--;
            this.textAnimationTimer += 0.1;
            this.textOffset = Math.sin(this.textAnimationTimer) * 2;

            if (this.speechTimer <= 0) {
                this.isSpeaking = false;
                this.currentSpeechText = '';
            }
        } else {
            if (Math.random() < 0.001) {
                this.say();
            }
        }
    }

    draw() {
        if (!this.sprite || !this.sprite.complete || this.sprite.naturalWidth === 0) {
            console.warn(`[MenuCompanion] Sprite non valido per ${this.typeId}. Disegno fallback.`);
            this.ctx.fillStyle = 'orange';
            this.ctx.fillRect(this.x, this.y, this.dw, this.dh);
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(this.typeId.split('_')[1], this.x + this.dw / 2, this.y + this.dh / 2);
            return;
        }

        this.ctx.save();
        if (this.direction === -1) {
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.sprite, this.frameIndex * this.sw, 0, this.sw, this.sh, -this.x - this.dw, this.y, this.dw, this.dh);
        } else {
            this.ctx.drawImage(this.sprite, this.frameIndex * this.sw, 0, this.sw, this.sh, this.x, this.y, this.dw, this.dh);
        }
        this.ctx.restore();

        if (this.isSpeaking) {
            this.ctx.save();
            this.ctx.fillStyle = '#ADD8E6';
            this.ctx.font = `bold 12px "Courier Prime", monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = 'rgba(0,0,0,0.7)';
            this.ctx.shadowBlur = 3;
            this.ctx.fillText(this.currentSpeechText, this.x + this.dw / 2, this.y - 10 + this.textOffset);
            this.ctx.restore();
        }
    }
}

// --- NUOVA CLASSE: DigitalRainParticle ---
class DigitalRainParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this.reset();

        const chars = '01';
        this.char = chars[Math.floor(Math.random() * chars.length)];

        this.size = Math.random() * 8 + 6;
        this.color = `rgba(255, 0, 0, ${0.5 + Math.random() * 0.5})`;
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = -Math.random() * this.canvas.height;
        this.speed = Math.random() * 80 + 50;
    }

    update(deltaTime) {
        this.y += this.speed * deltaTime;
        if (this.y > this.canvas.height) {
            this.reset();
        }
    }

    draw() {
        this.ctx.save();
        this.ctx.fillStyle = this.color;
        this.ctx.font = `${this.size}px "Courier Prime", monospace`;
        this.ctx.fillText(this.char, this.x, this.y);
        this.ctx.restore();
    }
}

// =================================================================================
// OGGETTO menuAnimation AGGIORNATO
// =================================================================================
export const menuAnimation = {
    canvas: null, ctx: null, donkey: null, ground: null,
    animationFrameId: null, isRunning: false, particles: [],

    bitSprites: {},
    bits: [],

    companionSprites: {},
    companions: [],

    digitalRainParticles: [],
    isDigitalRainActive: false,
    digitalRainTimer: 0,
    isFlashing: false,
    flashTimer: 0,
    flashDuration: 0.1,
    isDonkeyHintingRain: false,

    thunderclapTimer: 0,
    nextThunderclapInterval: 0,
    lastDigitalRainChanceTime: 0,
    digitalRainChanceInterval: 15 * 1000,
    digitalRainDuration: 20 * 1000,

    bitSpawnTimer: null,

    isUserAuthenticated: false,
    collectedItemCounts: {},

    lastBitSpawnTime: 0,
    nextBitSpawnInterval: 0,

    backgroundParticles: [],

    resolveExitPromise: null,
    lastFrameTime: 0,

    preloadCompanionSprites(unlockedCompanionIds) {
        const promises = unlockedCompanionIds.map(id => {
            const companionConfig = COMPANION_ASSET_MAP[id];
            if (!companionConfig || !companionConfig.sprite) {
                console.warn(`[MenuAnimation] Configurazione o percorso sprite mancante per il compagno: ${id}`);
                return Promise.resolve({ id: id, img: null, frameWidth: 0, frameHeight: 0, numFrames: 0 });
            }
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.companionSprites[id] = img;
                    resolve({
                        id: id,
                        img: img,
                        frameWidth: companionConfig.frameWidth,
                        frameHeight: companionConfig.frameHeight,
                        numFrames: companionConfig.numFrames
                    });
                };
                img.onerror = () => {
                    console.error(`[MenuAnimation] Impossibile caricare lo sprite del compagno: ${companionConfig.sprite}`);
                    resolve({ id: id, img: null, frameWidth: 0, frameHeight: 0, numFrames: 0 });
                };
                img.src = companionConfig.sprite;
            });
        });
        return Promise.allSettled(promises).then(results => {
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value && result.value.img) {
                    this.companionSprites[result.value.id] = result.value.img;
                    this.companionSprites[result.value.id].frameWidth = result.value.frameWidth;
                    this.companionSprites[result.value.id].frameHeight = result.value.frameHeight;
                    this.companionSprites[result.value.id].numFrames = result.value.numFrames;
                } else if (result.status === 'rejected') {
                    // console.error(`[MenuAnimation] Caricamento compagno ${result.reason?.id || 'sconosciuto'} rifiutato.`);
                }
            });
        });
    },

    preloadBitSprites() {
        const promises = Object.entries(bitTypes).map(([name, type]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.bitSprites[name] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Impossibile caricare lo sprite del bit: ${type.src}`);
                    reject();
                };
                img.src = type.src;
            });
        });
        return Promise.all(promises);
    },

    // --- MODIFICATO: init function per la configurazione iniziale ---
    init(canvasId) { // Rimosso initialDonkeyPos e unlockedCompanionIds da qui
        this.canvas = document.getElementById(canvasId); if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Inizializza il MenuDonkey con sprite di default o vuoti;
        // gli sprite effettivi verranno impostati da updateMenuPlayerDisplay.
        this.donkey = new MenuDonkey(this.canvas, new Image(), new Image(), 50); // Initialized with empty images
        this.ground = new MenuGround(this.canvas);

        this.isUserAuthenticated = true;

        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();

        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        // NUOVO: Aggiungi un listener per touchend per i dispositivi touch
        // Per assicurare che i bits siano cliccabili anche su mobile
        this.canvas.addEventListener('touchend', (e) => {
            // Previene il click "fantasma" che touchend a volte genera
            e.preventDefault();
            // Chiama la stessa funzione che gestisce il click
            this.handleCanvasClick(e);
        }, { passive: false }); // Usare passive: false per permettere preventDefault

        this.donkey.state = 'roaming';
        this.resolveExitPromise = null;
        this.bits = [];
        this.companions = []; // Ensure it's empty on initial setup

        // [FEAT] Inizializza le particelle della pioggia digitale
        const numRainParticles = 100; // Numero di gocce di pioggia
        for (let i = 0; i < numRainParticles; i++) {
            this.digitalRainParticles.push(new DigitalRainParticle(this.canvas));
        }
        this.isDigitalRainActive = false;
        this.digitalRainTimer = 0;
        this.lastDigitalRainChanceTime = performance.now();
        this.isDonkeyHintingRain = false; // Reset hint flag on init

        // Inizializza i timer dei tuoni
        this.thunderclapTimer = 0;
        this.nextThunderclapInterval = 3000 + Math.random() * 7000; // Primo tuono tra 3 e 10 secondi

        try {
            this.collectedItemCounts = JSON.parse(localStorage.getItem('menuCollectedItemCounts')) || {};
            this.pendingMenuBits = Object.keys(this.collectedItemCounts).reduce((sum, type) => {
                return sum + (bitTypes[type]?.value || 0) * (this.collectedItemCounts[type] || 0);
            }, 0);

        } catch (e) {
            console.error("[MenuAnimation] Errore nel caricamento di 'menuCollectedItemCounts' dal localStorage:", e);
            this.collectedItemCounts = {};
            this.pendingMenuBits = 0;
        }
        console.log(`[MenuAnimation] Caricati ${JSON.stringify(this.collectedItemCounts)} item dal localStorage.`);

        this.nextBitSpawnInterval = this.generateRandomSpawnInterval();
        this.lastBitSpawnTime = performance.now();

        this.initializeBackgroundParticles();

        // Preload all necessary sprites (bits, companions, menu donkey skins)
        // This is important because updateMenuPlayerDisplay needs images to be loaded
        // MODIFICATO: Semplificato il Promise.all
        Promise.all([
            // La riga this.preloadBitSprites() è stata rimossa.
            AudioManager.loadSound('sfx_thunder_clap', `audio/sfx/sfx_thunder_clap.ogg`),
            AudioManager.loadSound('sfx_hum', 'audio/sfx/sfx_hum.mp3'),
            AudioManager.loadSound('sfx_menu_eat', 'audio/sfx/sfx_menu_eat.ogg'),
            AudioManager.loadSound('sfx_donkey_digest', 'audio/sfx/sfx_donkey_digest.ogg'),
            AudioManager.loadSound('sfx_donkey_comment', 'audio/sfx/sfx_donkey_comment.ogg'),
        ])
        .then(() => {
            // Poiché gli sprite sono già pre-caricati dal loader,
            // possiamo avviare l'animazione in sicurezza.
            this.start();
        })
        .catch(error => {
            console.error("[MenuAnimation] Errore nel caricamento degli asset audio, l'animazione potrebbe avere problemi:", error);
            this.start(); // Avvia comunque
        });
    },


    // --- NUOVA FUNZIONE: updateMenuPlayerDisplay ---
    // Questa funzione aggiorna visivamente il giocatore e il compagno nel menu.
    // Verrà chiamata ogni volta che l'equipaggiamento cambia o il menu viene inizializzato/reinicializzato.
    updateMenuPlayerDisplay(userData) {
        if (!this.donkey || !this.canvas || !this.ctx) {
            console.warn("Menu animation non completamente inizializzata per l'aggiornamento del display del giocatore.");
            return;
        }

        // 1. Aggiorna gli sprite del MenuDonkey basandosi sulla skin equipaggiata
        const equippedDonkeySkinId = userData.inventory?.equipped?.donkeySkin || 'skin_donkey_default_info';
        const playerSkinConfig = SKIN_ASSET_MAP[equippedDonkeySkinId];

        const playerWalkSpriteSrc = playerSkinConfig?.walk || 'images/asyncDonkey_walk.png'; // Fallback
        const playerDigestSpriteSrc = playerSkinConfig?.digest || 'images/donkey_digest.png'; // Fallback

        Promise.all([
            loadImageForMenuDisplay(playerWalkSpriteSrc),
            loadImageForMenuDisplay(playerDigestSpriteSrc)
        ]).then(([newPlayerSpriteImg, newDigestSpriteImg]) => {
            if (newPlayerSpriteImg) this.donkey.sprite = newPlayerSpriteImg;
            if (newDigestSpriteImg) this.donkey.digestSprite = newDigestSpriteImg;
        }).catch(e => console.error("Errore durante l'aggiornamento degli sprite del Donkey nel menu:", e));


        // 2. Aggiorna la visualizzazione dei Compagni
        this.companions = []; // Cancella i compagni attualmente visualizzati
        const equippedCompanionId = userData.inventory?.equipped?.companion;

        if (equippedCompanionId && equippedCompanionId !== 'null_companion') {
            const companionConfig = COMPANION_ASSET_MAP[equippedCompanionId];
            if (companionConfig && companionConfig.sprite) {
                loadImageForMenuDisplay(companionConfig.sprite).then(companionImg => {
                    if (companionImg) {
                        this.companions.push(new MenuCompanion(
                            this.canvas,
                            equippedCompanionId,
                            companionImg,
                            companionConfig.frameWidth,
                            companionConfig.frameHeight,
                            companionConfig.numFrames
                        ));
                        console.log(`[MenuAnimation] Aggiornato compagno equipaggiato nel menu: ${equippedCompanionId}`);
                    }
                }).catch(e => console.error("Errore caricamento sprite compagno per aggiornamento menu:", e));
            }
        }
        // Il loop di animazione (this.loop) si occuperà di disegnare il donkey e i compagni aggiornati.
    },

    generateRandomSpawnInterval() {
        return MIN_BIT_SPAWN_INTERVAL + Math.random() * (MAX_BIT_SPAWN_INTERVAL - MIN_BIT_SPAWN_INTERVAL);
    },

    initializeBackgroundParticles() {
        this.backgroundParticles = [];
        const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ<>!@#$%^&*()_+{}|[]?';
        const layers = [
            { count: 100, speed: 15, size: 10, alpha: 0.35 },
            { count: 60, speed: 30, size: 14, alpha: 0.5 },
            { count: 30, speed: 50, size: 18, alpha: 0.7 }
        ];

        layers.forEach(layer => {
            for (let i = 0; i < layer.count; i++) {
                this.backgroundParticles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    char: chars[Math.floor(Math.random() * chars.length)],
                    speed: layer.speed,
                    size: layer.size,
                    alpha: layer.alpha
                });
            }
        });
    },

    drawBackgroundEffects(deltaTime) {
        this.backgroundParticles.forEach(p => {
            p.y += p.speed * deltaTime;
            if (p.y > this.canvas.height) {
                p.y = 0;
                p.x = Math.random() * this.canvas.width;
            }
        });

        this.ctx.save();
        this.ctx.fillStyle = '#111827';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        this.ctx.save();
        this.backgroundParticles.forEach(p => {
            const particleColor = `rgba(14, 175, 155, ${p.alpha})`;
            this.ctx.fillStyle = particleColor;
            this.ctx.font = `${p.size}px "Courier Prime", monospace`;
            this.ctx.fillText(p.char, p.x, p.y);
        });
        this.ctx.restore();

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(50, 50, 50, 0.2)';
        for (let i = 0; i < this.canvas.height; i += 3) {
            this.ctx.fillRect(0, i, this.canvas.width, 1);
        }
        this.ctx.restore();
    },

    handleCanvasClick(event) {
        if (!this.isUserAuthenticated) {
            return;
        }

        let clientX, clientY; // Declare clientX and clientY here
        let clickX, clickY;   // Declare clickX and clickY here to ensure scope

        // Determine if it's a touch event or a mouse event
        if (event.touches && event.touches.length > 0) { // For touchstart/touchmove
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else if (event.changedTouches && event.changedTouches.length > 0) { // For touchend
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else { // For mouse click events
            clientX = event.clientX;
            clientY = event.clientY;
        }

        // Handle cases where clientX/Y might still be undefined or null for some edge cases
        if (typeof clientX === 'undefined' || clientX === null || typeof clientY === 'undefined' || clientY === null) {
            console.warn('[MenuAnimation] clientX or clientY is undefined/null from event. Skipping click processing.');
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        clickX = clientX - rect.left;
        clickY = clientY - rect.top;

        for (let i = this.bits.length - 1; i >= 0; i--) {
            const bit = this.bits[i];
            if (clickX >= bit.x && clickX <= bit.x + bit.width &&
                clickY >= bit.y && clickY <= bit.y + bit.height) {
                console.log(`[MenuAnimation] Click detected on bit ${i}! Donkey state: ${this.donkey.state}`);
                if (this.donkey.state !== 'targeting' && this.donkey.state !== 'digesting' && this.donkey.state !== 'processing') {
                    console.log('Bit clicked, donkey is targeting it!');
                    this.donkey.setTarget(bit);
                    break;
                } else {
                    console.log(`[MenuAnimation] Donkey is busy (${this.donkey.state}), cannot target new bit.`);
                }
            }
        }
        for (let i = this.companions.length - 1; i >= 0; i--) {
            const companion = this.companions[i];
            if (clickX >= companion.x && clickX <= companion.x + companion.dw &&
                clickY >= companion.y && clickY <= companion.y + companion.dh) {
                companion.say();
                break;
            }
        }
    },

    setAuthStatus(isAuthenticated) {
        this.isUserAuthenticated = isAuthenticated;
        console.log(`[MenuAnimation] Stato autenticazione impostato a: ${isAuthenticated}`);
    },

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
        if (this.ground) this.ground.resize();
        if (this.donkey) this.donkey.groundY = this.canvas.height * GROUND_LEVEL_PERCENT - this.donkey.dh;
    },

    spawnBit() {
        let chosenTypeName;
        const randomChance = Math.random();

        if (randomChance < CRYSTAL_BIT_SPAWN_CHANCE) {
            chosenTypeName = 'crystal';
        } else if (randomChance < DIGITAL_FRUIT_SPAWN_CHANCE_MAX) {
            const digitalFruits = [
                'digital_kiwi', 'digital_orange', 'digital_pear', 'digital_apple', 'digital_banana', 'digital_berry',
                'digital_blueberry', 'digital_cherry', 'digital_coconut', 'digital_dragonfruit', 'digital_grapes',
                'digital_lemon', 'digital_melon', 'digital_papaya', 'digital_peach', 'digital_pineapple',
                'digital_strawberry', 'digital_watermelon'
            ];
            chosenTypeName = digitalFruits[Math.floor(Math.random() * digitalFruits.length)];
        } else {
            const nonSpecialBitTypes = ['bronze', 'silver', 'gold', 'platinum'];
            chosenTypeName = nonSpecialBitTypes[Math.floor(Math.random() * nonSpecialBitTypes.length)];
        }

        const chosenType = bitTypes[chosenTypeName];
        const bitSprite = this.bitSprites[chosenTypeName];

        if (!bitSprite) {
            // Questo errore non dovrebbe più apparire!
            console.error(`Sprite per il bit "${chosenTypeName}" non trovato!`);
            return;
        }

        const newBit = new Bit(this.canvas, chosenType, bitSprite);
        this.bits.push(newBit);
    },

    start() {
        if (this.isRunning) return;
        this.isRunning = true;

        this.lastFrameTime = performance.now();

        this.bits = [];
        this.particles = [];

        if (this.donkey) {
            this.donkey.state = 'roaming';
            this.donkey.target = null;
            this.donkey.x = 50;
        }

        if (this.bits.length === 0) {
            for (let i = 0; i < MAX_BITS_ON_SCREEN; i++) {
                this.spawnBit();
            }
        }

        this.loop();
    },

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        console.log("[MenuAnimation] Animazione menu stoppata.");
    },

    startExitAnimation() {
        return new Promise((resolve) => {
            this.donkey.state = 'exiting';
            this.resolveExitPromise = resolve;
        });
    },

    loop() {
        if (!this.isRunning) {
            if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            return;
        }

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackgroundEffects(deltaTime);


        const timeUntilNextRainChance = this.digitalRainChanceInterval - (currentTime - this.lastDigitalRainChanceTime);
        const HINT_THRESHOLD = 5000;

        if (!this.isDigitalRainActive && timeUntilNextRainChance <= HINT_THRESHOLD && timeUntilNextRainChance > 0 && !this.isDonkeyHintingRain) {
            this.donkey.say(RAIN_PENDING_PHRASES, false, true);
            this.isDonkeyHintingRain = true;
            console.log("[MenuAnimation] Digital Rain: Hinting pending rain.");
        } else if (this.isDigitalRainActive || timeUntilNextRainChance <= 0) {
            this.isDonkeyHintingRain = false;
        }

        if (!this.isDigitalRainActive && (currentTime - this.lastDigitalRainChanceTime >= this.digitalRainChanceInterval)) {
            if (Math.random() < 0.5) {
                this.isDigitalRainActive = true;
                isRainingOnGameStart = true;
                this.digitalRainTimer = this.digitalRainDuration;
                console.log("[MenuAnimation] Digital Rain: Activated!");

                this.donkey.say(DONKEY_RAIN_PHRASES, false, true);

                AudioManager.playSound('sfx_hum', false, 0.6);
                console.log("[MenuAnimation] Digital Rain: Playing 'hum' sound.");

                window.dispatchEvent(new CustomEvent('rainStatusChanged', { detail: { isRaining: true } }));
            }
            this.lastDigitalRainChanceTime = currentTime;
            this.isDonkeyHintingRain = false;
        }

        if (this.isDigitalRainActive) {
            this.digitalRainTimer -= deltaTime * 1000;
            if (this.digitalRainTimer <= 0) {
                this.isDigitalRainActive = false;
                isRainingOnGameStart = false;
                console.log("[MenuAnimation] Digital Rain: Deactivated.");

                window.dispatchEvent(new CustomEvent('rainStatusChanged', { detail: { isRaining: false } }));
            }
            this.digitalRainParticles.forEach(p => {
                p.update(deltaTime);
                p.draw();
            });

            this.thunderclapTimer += deltaTime * 1000;
            if (this.thunderclapTimer >= this.nextThunderclapInterval) {
                console.log("[MenuAnimation] Tentativo di riprodurre il tuono!");
                AudioManager.playSound(THUNDER_CLAP_SOUND_NAME, false, 0.7);

                this.isFlashing = true;
                this.flashTimer = this.flashDuration;

                this.thunderclapTimer = 0;
                this.nextThunderclapInterval = 3000 + Math.random() * 7000;
            }
        }

        if (this.isFlashing) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer > 0) {
                this.ctx.save();
                this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashTimer / this.flashDuration})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.restore();
            } else {
                this.isFlashing = false;
            }
        }

        this.ground.draw();

        for (let i = this.bits.length - 1; i >= 0; i--) {
            this.bits[i].update();
            this.bits[i].draw();
        }

        for (let i = this.companions.length - 1; i >= 0; i--) {
            this.companions[i].update();
            this.companions[i].draw();
        }


        this.donkey.update(deltaTime);
        this.donkey.draw();

        if (this.donkey.target) {
            const donkeyRect = { x: this.donkey.x, y: this.donkey.y, width: this.donkey.dw, height: this.donkey.dh };
            const targetBit = this.donkey.target;
            const bitRect = { x: targetBit.x, y: targetBit.y, width: targetBit.width, height: targetBit.height };

            if (donkeyRect.x < bitRect.x + bitRect.width && donkeyRect.x + donkeyRect.width > bitRect.x &&
                donkeyRect.y < bitRect.y + bitRect.height && donkeyRect.y + bitRect.height > bitRect.y)
            {
                for (let i = 0; i < 20; i++) {
                    this.particles.push(new Particle(targetBit.x + targetBit.width / 2, targetBit.y + targetBit.height / 2, '#ffb86c'));
                }
                AudioManager.playSound('sfx_menu_eat', false, 0.6);

                if (this.isUserAuthenticated) {
                    this.collectedItemCounts[targetBit.type.name] = (this.collectedItemCounts[targetBit.type.name] || 0) + 1;
                    localStorage.setItem('menuCollectedItemCounts', JSON.stringify(this.collectedItemCounts));
                    console.log(`Raccolto 1 ${targetBit.type.name}. Conteggi attuali: ${JSON.stringify(this.collectedItemCounts)}`);

                    this.pendingMenuBits += targetBit.value;
                    localStorage.setItem('pendingMenuBits', this.pendingMenuBits.toString());

                    window.dispatchEvent(new CustomEvent('menubitscollected'));
                }

                if (Math.random() < 0.20) {
                    if (Math.random() < 0.5) { this.donkey.say(); } else { this.donkey.startDigesting(); }
                }

                this.bits = this.bits.filter(bit => bit !== targetBit);

                this.donkey.target = null;
                if (this.donkey.state !== 'digesting') {
                    this.donkey.state = 'roaming';
                }
                this.lastBitSpawnTime = currentTime;
                this.nextBitSpawnInterval = this.generateRandomSpawnInterval();
            }
        }

        if (this.bits.length < MAX_BITS_ON_SCREEN && (currentTime - this.lastBitSpawnTime >= this.nextBitSpawnInterval)) {
            this.spawnBit();
            this.lastBitSpawnTime = currentTime;
            this.nextBitSpawnInterval = this.generateRandomSpawnInterval();
        }

        this.ctx.save();
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            this.particles[i].draw(this.ctx);
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
        this.ctx.restore();

        if (this.donkey.state === 'exiting' && this.donkey.x > this.canvas.width) {
            if (this.resolveExitPromise) {
                this.resolveExitPromise();
                this.resolveExitPromise = null;
                this.stop();
            }
        }

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }
};