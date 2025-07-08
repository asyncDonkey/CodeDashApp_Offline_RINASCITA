import { SpriteAnimation } from './animation.js';
import * as AudioManager from './audioManager.js';
// AGGIORNATO: Importa tutti gli array dei nemici e activeMiniboss da donkeyRunner.js per il targeting
import {
    obstacles,
    SFX_CLOUD_SHOT,
    SFX_DEBUG_SHOT,
    SFX_KERNEL_SHOT,
    SFX_COMPANION_FRUIT_COLLECT,
    DEBUGGATOR_IA_PROJECTILE_DAMAGE,
    enemies, fastEnemies, armoredEnemies, shootingEnemies, armoredShootingEnemies,
    toughBasicEnemies, dangerousFlyingEnemies, kamikazeFlyingEnemies, activeMiniboss,
    COMPANION_FRAME_WIDTH, COMPANION_FRAME_HEIGHT, COMPANION_NUM_FRAMES, COMPANION_ANIMATION_SPEED,
    COMPANION_PROJECTILE_CLOUD_SRC,
    COMPANION_PROJECTILE_DEBUG_SRC,
    COMPANION_PROJECTILE_KERNEL_SRC,
    // AGGIUNTO: Re-importa le costanti dei percorsi degli sprite principali dei compagni
    COMPANION_CLOUD_ASSISTANT_SRC,
    COMPANION_DEBUGGATOR_IA_SRC,
    COMPANION_KERNEL_4_2_SRC, // Anche questa, se non già presente esplicitamente
    FlyingEnemy // <--- AGGIUNGI QUESTA LINEA
} from './donkeyRunner.js';




// Costanti generali per i proiettili dei compagni
const COMPANION_PROJECTILE_FRAME_WIDTH = 16;
const COMPANION_PROJECTILE_FRAME_HEIGHT = 16;
const COMPANION_PROJECTILE_NUM_FRAMES = 4;
const COMPANION_PROJECTILE_TARGET_SIZE = 24;
const COMPANION_PROJECTILE_SPEED = 600; // MODIFICATO: Aumentata la velocità per un homing più aggressivo
const COMPANION_PROJECTILE_DAMAGE = 1;


const KERNEL_4_2_FRAME_WIDTH = 64;
const KERNEL_4_2_FRAME_HEIGHT = 64;
const KERNEL_4_2_NUM_FRAMES = 10;
const KERNEL_4_2_ANIMATION_SPEED = 0.1;
const KERNEL_4_2_PROJECTILE_DAMAGE = 2;


// --- CLASSE BASE PER I PROIETTILI DEI COMPAGNI (Aggiornata per targeting dinamico) ---
class CompanionProjectile {
    // AGGIORNATO: Ora accetta un `targetType` invece di `targetsPool`
    constructor(x, y, sprite, frameW, frameH, numFrames, targetW, targetH, speed, damage, isHarmful, isHoming = false, targetType = 'enemies') {
        this.x = x;
        this.y = y;
        this.width = targetW;
        this.height = targetH;
        this.speed = speed;
        this.damage = damage;
        this.sprite = sprite;
        this.animation = null;
        this.isHarmful = isHarmful;
        this.isHoming = isHoming;
        this.targetType = targetType; // NUOVO: Tipo di target (e.g., 'enemies', 'obstacles')
        this.target = null; // Il target corrente del proiettile homing

        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0 && numFrames > 1) {
            this.animation = new SpriteAnimation(this.sprite, frameW, frameH, numFrames, 0.1);
        }
    }

    update(dt) {
        if (this.isHoming) {
            let currentFrameTargets = [];

            // Costruisci dinamicamente il pool di target in ogni frame in base al targetType
            if (this.targetType === 'enemies') {
                currentFrameTargets = [
                    ...enemies,
                    ...fastEnemies,
                    ...armoredEnemies,
                    ...shootingEnemies,
                    ...armoredShootingEnemies,
                    ...toughBasicEnemies,
                    ...dangerousFlyingEnemies,
                    ...kamikazeFlyingEnemies
                ].filter(enemy => !(enemy instanceof FlyingEnemy && !enemy.isDangerousFlyer));

                if (activeMiniboss) {
                    currentFrameTargets.push(activeMiniboss);
                }
            } else if (this.targetType === 'obstacles') {
                currentFrameTargets = [...obstacles];
            }

            let closestTarget = null;
            let minDistance = Infinity;

            // Cerca il target più vicino nel pool di target dinamico
            if (currentFrameTargets.length > 0) {
                for (const potentialTarget of currentFrameTargets) {
                    // Considera qualsiasi target VIVO
                    if (potentialTarget && potentialTarget.health > 0) {
                        const distance = Math.sqrt(Math.pow(potentialTarget.x - this.x, 2) + Math.pow(potentialTarget.y - this.y, 2));
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestTarget = potentialTarget;
                        }
                    }
                }
            }
            this.target = closestTarget; // Aggiorna il target corrente con il più vicino trovato

            if (this.target) {
                // Calcola la direzione verso il target aggiornato
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const angle = Math.atan2(dy, dx);

                this.x += this.speed * Math.cos(angle) * dt;
                this.y += this.speed * Math.sin(angle) * dt;
            } else {
                // Se non c'è un target valido (es. tutti i nemici sono morti o fuori schermo), muoviti dritto in avanti.
                this.x += this.speed * dt;
            }
        } else {
            // Movimento normale (per DebuggatorIA)
            this.x += this.speed * dt;
        }

        if (this.animation) this.animation.update(dt);
    }


    draw(ctx) {
        if (this.animation && this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, f.sWidth, f.sHeight, this.x, this.y, this.width, this.height);
        } else if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.drawImage(this.sprite, 0, 0, this.sprite.naturalWidth, this.sprite.naturalHeight, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// --- CLASSE BASE PER I COMPAGNI (Aggiornata per la scalabilità dello sprite) ---
class BaseCompanion {
    // AGGIORNATO: Il costruttore ora prende direttamente frameW e frameH per la dimensione di visualizzazione
    constructor(player, images, type, spritePath, frameW, frameH, numFrames, animationSpeed, attackInterval = 2.0) {
        console.log(`DEBUG_COMP: BaseCompanion constructor for ${type}. Player received:`, player);
        this.player = player;
        this.images = images;
        this.type = type;
        this.sprite = images[spritePath];
        // AGGIORNATO: Le dimensioni del compagno ora corrispondono alle dimensioni del singolo frame.
        // Se volessi applicare uno scale factor globale (es. GLOBAL_SPRITE_SCALE_FACTOR da donkeyRunner.js)
        // dovresti fare: this.width = frameW * GLOBAL_SPRITE_SCALE_FACTOR;
        // Ma per visualizzare lo "sprite di 64" senza ulteriori scaling, usiamo frameW/H direttamente.
        this.width = frameW;
        this.height = frameH;
        this.x = (player && typeof player.x === 'number') ? player.x : 0;
        this.y = (player && typeof player.y === 'number') ? player.y : 0;

        if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            this.animation = new SpriteAnimation(this.sprite, frameW, frameH, numFrames, animationSpeed);
        } else {
            console.warn(`DEBUG_COMP: Sprite mancante o rotto per il compagno ${type} (chiave cercata: ${spritePath}).`);
            this.animation = null;
        }

        this.attackCooldown = attackInterval;
        this.attackTimer = Math.random() * attackInterval;
        this.projectiles = [];
    }

    // AGGIORNATO: Il metodo update ora accetta un array di collezionabili (opzionale)
    update(dt, collectiblesArray = []) {
        if (!this.player) {
            console.error(`DEBUG_COMP: BaseCompanion.update: this.player è undefined per ${this.type}! Impossibile aggiornare la posizione.`);
            console.error(new Error().stack);
            return;
        }

        if (this.animation) {
            this.animation.update(dt);
        }

        this.attackTimer += dt;
        if (this.attackTimer >= this.attackCooldown) {
            this.performAttack();
            this.attackTimer = 0;
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update(dt);
            // Rimuovi i proiettili che escono dallo schermo (qui 800 è un valore arbitrario oltre il giocatore)
            if (this.projectiles[i].x > this.player.x + 800 || this.projectiles[i].x < this.player.x - 800) {
                this.projectiles.splice(i, 1);
            }
        }
        // Il metodo checkAndCollect sarà chiamato nelle sottoclassi se necessario
    }

    draw(ctx) {
        if (this.animation && this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            const f = this.animation.getFrame();
            ctx.drawImage(this.sprite, f.sx, f.sy, f.sWidth, f.sHeight, this.x, this.y, this.width, this.height);
        } else if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
            ctx.drawImage(this.sprite, 0, 0, this.sprite.naturalWidth, this.sprite.naturalHeight, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'purple';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        this.projectiles.forEach(p => p.draw(ctx));
    }

    performAttack() {
        // Implementato nelle sottoclassi
    }

    // Metodo generico per la raccolta (può essere sovrascritto)
    checkAndCollect(collectiblesArray) {
        // Implementato nelle sottoclassi che hanno bisogno di raccogliere oggetti
    }
}

// --- CLASSI SPECIFICHE DEI COMPAGNI ---
export class CloudAssistant extends BaseCompanion {
    constructor(player, images) {
        // Passa le costanti generali di frame e animazione a BaseCompanion
        super(player, images, 'cloud_assistant', COMPANION_CLOUD_ASSISTANT_SRC,
              COMPANION_FRAME_WIDTH, COMPANION_FRAME_HEIGHT, COMPANION_NUM_FRAMES, COMPANION_ANIMATION_SPEED, 2.5);
        this.initialOffsetY = -this.height;
        this.amplitude = 10;
        this.frequency = 5;
        this.offsetX = -this.width / 2;
    }

    update(dt, collectiblesArray = []) { // Accetta collectiblesArray ma non lo usa
        this.x = this.player.x + this.player.displayWidth / 2 + this.offsetX;
        this.y = this.player.y + this.initialOffsetY + Math.sin(Date.now() / 1000 * this.frequency) * this.amplitude;
        super.update(dt, collectiblesArray); // Passa collectiblesArray a super.update (anche se non usato lì)
    }

    performAttack() {
        const projX = this.x + this.width;
        const projY = this.y + this.height / 2 - COMPANION_PROJECTILE_TARGET_SIZE / 2;

        // Controlla se ci sono ostacoli da colpire
        if (obstacles.length > 0) {
            this.projectiles.push(new CompanionProjectile(
                projX, projY,
                this.images[COMPANION_PROJECTILE_CLOUD_SRC],
                COMPANION_PROJECTILE_FRAME_WIDTH, COMPANION_PROJECTILE_FRAME_HEIGHT,
                COMPANION_PROJECTILE_NUM_FRAMES,
                COMPANION_PROJECTILE_TARGET_SIZE, COMPANION_PROJECTILE_TARGET_SIZE,
                COMPANION_PROJECTILE_SPEED,
                COMPANION_PROJECTILE_DAMAGE,
                false, // isHarmful (tipicamente gli ostacoli non "danneggiano" il giocatore con il contatto del proiettile)
                true, // isHoming (questo proiettile è homing)
                'obstacles' // targetType: questo proiettile mira agli ostacoli
            ));
            AudioManager.playSound(SFX_CLOUD_SHOT);
        }
    }
}


export class DebuggatorIA extends BaseCompanion {
    constructor(player, images) {
        // Passa le costanti generali di frame e animazione a BaseCompanion
        super(player, images, 'debuggator_ia', COMPANION_DEBUGGATOR_IA_SRC,
              COMPANION_FRAME_WIDTH, COMPANION_FRAME_HEIGHT, COMPANION_NUM_FRAMES, COMPANION_ANIMATION_SPEED, 1.8);
        this.offsetX = -this.width - 10;
        this.offsetY = 10;
        this.teleportTimer = 0;
        this.teleportInterval = 0.5;
        this.teleportPositions = [
            { x: -this.width, y: 0 },
            { x: -this.width, y: this.player.displayHeight - this.height },
            { x: this.player.displayWidth / 2 - this.width / 2, y: this.player.displayHeight / 2 - this.height / 2 },
        ];
        this.currentTeleportIndex = 0;
    }

    update(dt, collectiblesArray = []) { // Accetta collectiblesArray ma non lo usa
        if (!this.player || typeof this.player.displayWidth === 'undefined') {
            console.error("DEBUG_COMP: DebuggatorIA.update: this.player o le sue proprietà di visualizzazione sono undefined! this.player value:", this.player);
            console.error(new Error().stack);
            return;
        }

        this.teleportTimer += dt;
        if (this.teleportTimer >= this.teleportInterval) {
            this.currentTeleportIndex = (this.currentTeleportIndex + 1) % this.teleportPositions.length;
            const targetPos = this.teleportPositions[this.currentTeleportIndex];
            this.x = this.player.x + targetPos.x;
            this.y = this.player.y + targetPos.y;
            this.teleportTimer = 0;
        }
        super.update(dt, collectiblesArray); // Passa collectiblesArray a super.update (anche se non usato lì)
    }

    performAttack() {
        const projX = this.x + this.width;
        const projY = this.y + this.height / 2 - COMPANION_PROJECTILE_TARGET_SIZE / 2;
        this.projectiles.push(new CompanionProjectile(
            projX, projY,
            this.images[COMPANION_PROJECTILE_DEBUG_SRC],
            COMPANION_PROJECTILE_FRAME_WIDTH, COMPANION_PROJECTILE_FRAME_HEIGHT,
            COMPANION_PROJECTILE_NUM_FRAMES,
            COMPANION_PROJECTILE_TARGET_SIZE, COMPANION_PROJECTILE_TARGET_SIZE,
            COMPANION_PROJECTILE_SPEED,
            DEBUGGATOR_IA_PROJECTILE_DAMAGE,
            false, // Non è homing
            [] // AGGIORNATO: DebuggatorIA non ha target homing, passa un array vuoto
        ));
        AudioManager.playSound(SFX_DEBUG_SHOT);
    }
}

export class Kernel42 extends BaseCompanion {
    constructor(player, images) {
        // Passa le costanti specifiche di Kernel 4.2 a BaseCompanion
        super(player, images, 'kernel_4_2', COMPANION_KERNEL_4_2_SRC, 
              KERNEL_4_2_FRAME_WIDTH, KERNEL_4_2_FRAME_HEIGHT, KERNEL_4_2_NUM_FRAMES, KERNEL_4_2_ANIMATION_SPEED, 0.8); // Attacca più velocemente
        
        this.baseOffsetX = -this.width / 2; // Inizialmente centrato sopra il player
        this.baseOffsetY = -this.height * 1.5; // Sopra il player
        this.amplitudeX = 30; // Ampiezza movimento avanti/indietro
        this.frequencyX = 2; // Frequenza movimento avanti/indietro
        this.amplitudeY = 15; // Ampiezza movimento ondulatorio su/giù
        this.frequencyY = 3; // Frequenza movimento ondulatorio su/giù
        this.time = 0; // Contatore tempo per animazione ondulatoria
        this.collectionCooldown = 0.1; // Cooldown per la raccolta per evitare frame multipli
        this.collectionTimer = 0;
    }

    update(dt, collectiblesArray = []) { // Riceve l'array dei collezionabili qui
        this.time += dt;

        // Movimento ondulatorio sopra il player, con leggera variazione avanti/indietro
        this.x = this.player.x + this.player.displayWidth / 2 + this.baseOffsetX + Math.sin(this.time * this.frequencyX) * this.amplitudeX; 
        this.y = this.player.y + this.baseOffsetY + Math.sin(this.time * this.frequencyY) * this.amplitudeY;

        super.update(dt, collectiblesArray); // Passa collectiblesArray a super.update (anche se non usato lì, per consistenza)
        
        // Gestione della raccolta dei collezionabili
        this.collectionTimer += dt;
        if (this.collectionTimer >= this.collectionCooldown) {
            this.checkAndCollect(collectiblesArray); // Chiama il metodo di raccolta specifico
            this.collectionTimer = 0;
        }
    }

    performAttack() {
        const projX = this.x + this.width / 2;
        const projY = this.y + this.height / 2 - COMPANION_PROJECTILE_TARGET_SIZE / 2;

        // Controlla se esiste almeno un potenziale bersaglio (nemico o boss) per sparare.
        const anyTargetExists = (
            enemies.length > 0 ||
            fastEnemies.length > 0 ||
            armoredEnemies.length > 0 ||
            shootingEnemies.length > 0 ||
            armoredShootingEnemies.length > 0 ||
            toughBasicEnemies.length > 0 ||
            dangerousFlyingEnemies.length > 0 ||
            kamikazeFlyingEnemies.length > 0 ||
            activeMiniboss // Controlla se il miniboss esiste
        );

        if (anyTargetExists) { // Spara solo se c'è potenzialmente qualcosa da colpire
            this.projectiles.push(new CompanionProjectile(
                projX, projY,
                this.images[COMPANION_PROJECTILE_KERNEL_SRC],
                COMPANION_PROJECTILE_FRAME_WIDTH, COMPANION_PROJECTILE_FRAME_HEIGHT,
                COMPANION_PROJECTILE_NUM_FRAMES,
                COMPANION_PROJECTILE_TARGET_SIZE, COMPANION_PROJECTILE_TARGET_SIZE,
                COMPANION_PROJECTILE_SPEED,
                KERNEL_4_2_PROJECTILE_DAMAGE,
                true, // isHarmful (sempre vero per i proiettili di Kernel)
                true, // isHoming (questo proiettile è homing)
                'enemies' // targetType: questo proiettile mira ai nemici
            ));
            AudioManager.playSound(SFX_KERNEL_SHOT);
        }
    }

    // AGGIORNATO: Logica di raccolta per Kernel 4.2 (corretti i tipi di collezionabili)
    checkAndCollect(collectiblesArray) {
        const companionRect = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };

        for (let i = collectiblesArray.length - 1; i >= 0; i--) {
            const collectible = collectiblesArray[i];

            if (!collectible || typeof collectible.type === 'undefined') {
                console.warn("DEBUG_COLLECT: Oggetto collezionabile senza tipo definito:", collectible);
                continue;
            }

            const collided = companionRect.x < collectible.x + collectible.width &&
                             companionRect.x + companionRect.width > collectible.x &&
                             companionRect.y < collectible.y + collectible.height &&
                             companionRect.y + companionRect.height > collectible.y;

            if (collided) {
                let shouldCollect = false;

                switch (collectible.type) {
                    case 'bronze':
                    case 'silver':
                    case 'gold':
                    case 'platinum': // Corrispondono ai tipi reali dei Bit
                        shouldCollect = true;
                        break;
                    case 'data_pkg': // Corrisponde al tipo reale di Data Package
                        shouldCollect = true;
                        break;
                    case 'rich_bit': // Corrisponde al tipo reale di Rich Bits
                        shouldCollect = true;
                        break;
                    case 'kiwi':
                    case 'orange':
                    case 'pear': // Corrispondono ai tipi reali della Frutta Digitale
                        shouldCollect = true;
                        break;
                    case 'extra_life': // Corrisponde al tipo reale di Extra Life
                        shouldCollect = Math.random() < 0.5; // Raccoglie ExtraLife con il 50% di probabilità
                        break;
                    case 'power_up': // Corrisponde al tipo reale di PowerUps
                        shouldCollect = false; // NON raccoglie PowerUps
                        break;
                    default:
                        shouldCollect = false; // Non raccoglie altri tipi non specificati
                        break;
                }

                if (shouldCollect) {
                    if (collectible.collect) {
                        collectible.collect({ byCompanion: true });
                    }

                    if (collectible.type === 'kiwi' || collectible.type === 'orange' || collectible.type === 'pear') {
                        AudioManager.playSound(SFX_COMPANION_FRUIT_COLLECT);
                    } else if (collectible.type === 'bronze' || collectible.type === 'silver' || collectible.type === 'gold' || collectible.type === 'platinum' || collectible.type === 'rich_bit' || collectible.type === 'data_pkg') {
                        AudioManager.playSound('bitCollect', false, 0.5);
                    }

                    collectiblesArray.splice(i, 1);
                }
            }
        }
    }
}


// Classe per gestire tutti i compagni attivi
export class CompanionManager {
    constructor() {
        this.activeCompanion = null;
    }

    equipCompanion(companionId, player, images) {
        console.log(`DEBUG_COMP: equipCompanion chiamato. companionId: ${companionId}, player object is:`, player);
        if (this.activeCompanion) {
            console.log(`DEBUG_COMP: Disequipaggiamento compagno precedente ${this.activeCompanion.type}`);
            this.activeCompanion.projectiles = [];
            this.activeCompanion = null;
        }

        switch (companionId) {
            case 'companion_cloud_assistant':
                // Passa le costanti generali di frame e animazione
                this.activeCompanion = new CloudAssistant(player, images);
                break;
            case 'companion_debuggator_ia':
                // Passa le costanti generali di frame e animazione
                this.activeCompanion = new DebuggatorIA(player, images);
                break;
            // NUOVO: Aggiungi il caso per Kernel 4.2
            case 'companion_kernel_4_2':
                this.activeCompanion = new Kernel42(player, images);
                break;
            default:
                console.warn(`DEBUG_COMP: Compagno con ID ${companionId} non riconosciuto.`);
                this.activeCompanion = null;
        }
        if (this.activeCompanion) {
            console.log(`DEBUG_COMP: Compagno ${this.activeCompanion.type} impostato come compagno attivo.`);
        }
    }

    unequipCompanion() {
        if (this.activeCompanion) {
            console.log(`DEBUG_COMP: unequipCompanion chiamato. Disequipaggiamento di ${this.activeCompanion.type}`);
            this.activeCompanion.projectiles = [];
            this.activeCompanion = null;
        } else {
            console.log("DEBUG_COMP: unequipCompanion chiamato, ma nessun compagno attivo da disequipaggiare.");
        }
    }

    // AGGIORNATO: Ora accetta l'array 'collectibles' come parametro
    update(dt, collectiblesArray = []) {
        if (this.activeCompanion) {
            // Passa l'array 'collectibles' al compagno attivo
            this.activeCompanion.update(dt, collectiblesArray);
        }
    }

    draw(ctx) {
        if (this.activeCompanion) {
            this.activeCompanion.draw(ctx);
        }
    }

    getAllCompanionProjectiles() {
        return this.activeCompanion ? this.activeCompanion.projectiles : [];
    }
}