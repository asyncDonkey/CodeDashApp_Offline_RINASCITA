// www/js/auth.js

// Rimosse tutte le importazioni Firebase Authentication
// import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
// import { auth, db, functions } from './firebase-config.js'; // Rimosse importazioni di auth, db, functions
// import { httpsCallable } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js'; // Rimosso httpsCallable

import { showToast } from './toastNotifications.js';
// Non è più necessario importare currentUserData o initializeMenu da main.js per questo modulo
// import { currentUserData, initializeMenu } from './main.js';

// Riferimenti DOM
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginLink = document.getElementById('showRegister');
const registerLink = document.getElementById('showLogin');
const closeAuthModalBtn = document.getElementById('closeAuthModal');
const authModalTitle = document.getElementById('authModalTitle');

// Rimosse le variabili per la verifica del telefono
// let phoneNumberInput = null;
// let appVerifier = null;
// let confirmationResult = null;
// let phoneAuthContainer = null;
// let verificationCodeInput = null;
// let verifyCodeButton = null;
// let resendCodeButton = null;
// let phoneSignInButton = null;
// let phoneMessage = null;

// Rimosse le costanti per i messaggi di errore
// const ERROR_MESSAGES = { ... };

/**
 * Mostra la modale di autenticazione.
 * In un contesto offline, questa modale non ha funzionalità di autenticazione reale.
 * Verrà semplicemente nascosta se tentata di aprire.
 * @param {string} mode - 'login' o 'register'.
 * @param {boolean} forceShow - Se true, forza la visualizzazione (utile per il caricamento iniziale).
 */
export function showAuthModal(mode, forceShow = false) {
  if (!authModal) {
    console.error('Elemento authModal non trovato.');
    return;
  }

  // In modalità offline, non vogliamo mostrare la modale di autenticazione.
  // L'utente è sempre considerato "offline_player".
  console.log(
    '[Auth.js] Tentativo di mostrare la modale di autenticazione. Disabilitata in modalità offline.',
  );
  authModal.style.display = 'none';
  document.body.classList.remove('modal-open');
  showToast('Authentication is not required in offline mode.', 'info');
  return; // Esci immediatamente

  // Il codice seguente non verrà mai eseguito in modalità offline, ma lo lascio commentato
  // per riferimento se la logica dovesse cambiare in futuro.
  /*
    authModal.style.display = 'flex';
    document.body.classList.add('modal-open');

    if (mode === 'register') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authModalTitle.textContent = 'Registrati';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authModalTitle.textContent = 'Accedi';
    }
    */
}

// Tutte le funzioni di autenticazione (loginUser, registerUser, resetPassword, verifyEmail,
// signInWithGoogle, signInWithPhoneNumber, setupRecaptcha, handlePhoneSignIn, verifyPhoneNumber)
// sono state rimosse in quanto non più necessarie per un gioco completamente offline.

document.addEventListener('DOMContentLoaded', function () {
  console.log('[Auth.js DOMContentLoaded] Elementi della modale di autenticazione pronti.');

  // Listener per chiudere la modale al click sul bottone 'X'
  if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', () => {
      if (authModal) authModal.style.display = 'none';
      document.body.classList.remove('modal-open');
    });
  }

  // Listener per chiudere la modale cliccando fuori
  window.addEventListener('click', (event) => {
    if (event.target == authModal) {
      authModal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }
  });

  // Rimosse le logiche per i form di login/registrazione e verifica telefono
  // in quanto non più funzionali in modalità offline.
  /*
    if (loginForm) { ... }
    if (registerForm) { ... }
    if (loginLink) { ... }
    if (registerLink) { ... }
    if (document.getElementById('google-signin-button')) { ... }
    if (document.getElementById('phone-signin-button')) { ... }
    if (document.getElementById('verify-code-button')) { ... }
    if (document.getElementById('resend-code-button')) { ... }
    if (document.getElementById('resetPasswordLink')) { ... }
    if (document.getElementById('resetPasswordForm')) { ... }
    */

  // Gestione input tastiera in modalità landscape per la modale di autenticazione
  if (window.Capacitor && Capacitor.isNativePlatform()) {
    const authInputFields = [
      document.getElementById('loginEmail'),
      document.getElementById('loginPassword'),
      document.getElementById('registerEmail'),
      document.getElementById('registerPassword'),
      document.getElementById('registerNickname'),
      // phoneNumberInput, // Rimosso
      // verificationCodeInput // Rimosso
    ].filter(Boolean); // Filtra gli elementi nulli se non trovati

    authInputFields.forEach((input) => {
      input?.addEventListener('focus', () => {
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
    });
  }
});
