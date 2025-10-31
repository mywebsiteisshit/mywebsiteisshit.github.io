/* main.js
 - Chargement dynamique des pages depuis /pages_lang/*.html
 - Gère l'historique (pushState) pour pouvoir partager des URLs
 - Ajoute animations simples (fade-in), mobile menu toggle, et animation de barres de compétences
 - Ajout de la logique du mode sombre (dark mode)
 - AJOUT DE LA LOGIQUE MULTILINGUE (FR/EN)
*/

const main = document.getElementById('mainContent');
const loader = document.getElementById('pageLoader');
const mobileToggle = document.getElementById('mobileToggle');
const navList = document.getElementById('navList');
const themeToggle = document.getElementById('themeToggle'); 

// NOUVEAU: Références aux deux boutons de langue
const langFrToggle = document.getElementById('langFrToggle'); 
const langEnToggle = document.getElementById('langEnToggle'); 

const pages = ['home','about','resume','projects','skills','engagements','testimonials','contact'];

// NOUVEAU: Initialise la langue depuis localStorage
let currentLang = localStorage.getItem('lang') || 'fr'; 


// Helper pour obtenir la page courante
function currentPageFromURL() {
  const hash = window.location.hash.slice(1);
  return hash || 'home';
}

// Mobile menu
mobileToggle.addEventListener('click', () => {
  // TOGGLE DE CLASSE (MIEUX POUR CSS)
  navList.classList.toggle('open');
  mobileToggle.classList.toggle('open');
  
  const isExpanded = navList.classList.contains('open');
  mobileToggle.setAttribute('aria-expanded', isExpanded);
  
  // FIX: Empêcher le défilement du body lorsque le menu est ouvert
  document.body.style.overflow = isExpanded ? 'hidden' : '';
});


// Theme Toggle Logic
function setDarkTheme(isDark) {
  document.body.classList.toggle('theme-dark', isDark);
  document.body.classList.toggle('theme-light', !isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Mettre à jour l'icône du bascule
  const icon = themeToggle.querySelector('svg');
  if (isDark) {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'; // Icône Lune
    icon.setAttribute('aria-label', 'Activer le mode clair');
  } else {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'; // Icône Soleil
    icon.setAttribute('aria-label', 'Activer le mode sombre');
  }
}

themeToggle.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('theme-dark');
  setDarkTheme(isDark);
});


// LOGIQUE DE BASCULE DE LANGUE (AVEC DEUX BOUTONS STATIQUES)
function updateLangButtonState(lang) {
    // 1. Met à jour l'attribut lang de la balise <html>
    document.documentElement.setAttribute('lang', lang);
    
    // 2. Met à jour l'état visuel des boutons
    if (langFrToggle) {
        langFrToggle.classList.toggle('active', lang === 'fr');
    }
    if (langEnToggle) {
        langEnToggle.classList.toggle('active', lang === 'en');
    }
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    
    // Met à jour l'état visuel immédiatement
    updateLangButtonState(lang);

    // Recharge la page actuelle pour appliquer la nouvelle langue
    const currentPage = currentPageFromURL(); 
    loadPage(currentPage, false);
}

// NOUVEAU: Écouteurs pour les boutons de langue
document.addEventListener('click', (e) => {
    const target = e.target.closest('.lang-button');
    if (target) {
        e.preventDefault();
        const lang = target.getAttribute('data-lang');
        if (lang && lang !== currentLang) {
            setLanguage(lang);
        }
        return;
    }
});


// Nav active state
function setActiveNav(page) {
  navList.querySelectorAll('a').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('data-link') === page) {
      a.classList.add('active');
    }
  });
}

// Page fetcher - Utilise les dossiers pages_fr/ et pages_en/
async function loadPage(page, push = false){
  if (!pages.includes(page)) page = 'home';
  loader.classList.add('active');
  
  // Utilise le dossier de langue
  const langFolder = (currentLang === 'en') ? 'pages_en' : 'pages_fr';
  
  try {
    const res = await fetch(`./${langFolder}/${page}.html`);
    if (!res.ok) throw new Error('Page non trouvée');
    const html = await res.text();

    // Fade seulement sur mainContent
    main.style.opacity = 0;
    setTimeout(()=> {
      main.innerHTML = html;
      
      // FIX: Scroll au sommet (nécessaire pour éviter les sauts)
      window.scrollTo(0, 0); 
      
      main.style.opacity = 1;
      runPageScripts(page);
      setActiveNav(page);
      
      // Ferme le menu mobile si ouvert
      if (navList.classList.contains('open')) {
        mobileToggle.click(); // Simule le clic pour fermer
      }
    }, 150);

    // Historique/URL
    if (push) {
      history.pushState({page}, '', `#${page}`);
    } else {
        // Au changement de langue, on s'assure que le pushState n'est pas appelé, mais que l'URL reste
        history.replaceState({page}, '', `#${page}`);
    }

  } catch (err) {
    console.error("Erreur lors du chargement de la page:", err);
    // En cas d'erreur de chargement (ex: 404), on redirige vers l'accueil.
    if (page !== 'home') {
        loadPage('home', true);
    } else {
        loader.classList.remove('active');
    }
  } finally {
    // S'assure que le loader disparaît après l'animation de fade-in
    setTimeout(()=>loader.classList.remove('active'), 250);
  }
}

// Écouteur de navigation (clic sur les liens)
document.addEventListener('click', (e) => {
  const target = e.target.closest('a[data-link]');
  if (target) {
    e.preventDefault();
    const page = target.getAttribute('data-link');
    loadPage(page, true); // Push dans l'historique
    return;
  }
});

// Gérer le bouton retour du navigateur
window.addEventListener('popstate', (e) => {
  const page = currentPageFromURL();
  loadPage(page, false); // Ne pas push dans l'historique
});


// Scripts spécifiques aux pages (animation des barres de compétences)
function runPageScripts(page) {
  if (page === 'skills') {
    document.querySelectorAll('.skill .bar > i').forEach(bar => {
      // Réinitialiser la barre si elle a déjà été affichée
      bar.style.width = '0%';
      // Déclenche l'animation
      setTimeout(() => {
          const value = bar.getAttribute('data-value');
          bar.style.width = `${value}%`;
      }, 50); 
    });
  }
  
  if (page === 'engagements') {
    // FIX: Ajout de l'écouteur d'événements pour les blocs d'engagement extensibles
    document.querySelectorAll('.eng-header.clickable').forEach(header => {
      // Pour s'assurer que l'élément entier réagit au clic
      header.addEventListener('click', e => {
        const details = header.nextElementSibling;
        
        // Bascule de la classe 'open' sur les détails
        details.classList.toggle('open');
        // Bascule de la classe 'open' sur le header pour l'icône
        header.classList.toggle('open');
      });
    });
    
    // smooth anchor scrolling inside engagements if anchors exist (code existant)
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });
  }
}


// Initialize
document.addEventListener('DOMContentLoaded', ()=>{
  // Initialiser le thème (depuis localStorage ou détection du système)
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark') {
    setDarkTheme(true);
  } else if (savedTheme === 'light') {
    setDarkTheme(false);
  } else {
    // Si pas de préférence, utiliser la préférence système
    setDarkTheme(prefersDark);
  }
  
  // Initialisation de la langue au chargement (pour que le bouton actif soit visible)
  updateLangButtonState(currentLang);


  const initial = currentPageFromURL();
  loadPage(initial, false);
});