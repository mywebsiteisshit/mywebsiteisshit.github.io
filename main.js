/* main.js
 - Chargement dynamique des pages depuis /pages/*.html
 - Gère l'historique (pushState) pour pouvoir partager des URLs
 - Ajoute animations simples (fade-in), mobile menu toggle, et animation de barres de compétences
 - Ajout de la logique du mode sombre (dark mode)
*/

const main = document.getElementById('mainContent');
const loader = document.getElementById('pageLoader');
const mobileToggle = document.getElementById('mobileToggle');
const navList = document.getElementById('navList');
const themeToggle = document.getElementById('themeToggle'); // Référence au bouton de bascule du thème

const pages = ['home','about','resume','projects','skills','engagements','testimonials','contact'];

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
  // L'icône est un soleil (clair) par défaut, on la change pour une lune (sombre) si on passe en dark mode
  if (isDark) {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'; // Icône Lune
    icon.setAttribute('aria-label', 'Activer le mode clair');
  } else {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'; // Icône Soleil
    icon.setAttribute('aria-label', 'Activer le mode sombre');
  }
}

// Écouteur pour le bouton de bascule du thème
themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('theme-dark');
  setDarkTheme(!isDark);
});

// Delegate clicks on nav (links with data-link)
document.addEventListener('click', e => {
  const a = e.target.closest('[data-link]');
  if (a) {
    e.preventDefault();
    const page = a.getAttribute('data-link');
    navigateTo(page);
  }
});

// Load initial page from location.hash or default home
function currentPageFromURL() {
  const p = location.pathname.replace(/^\//,'').replace(/\.html$/,'');
  // if served from index.html root, use hash or query param
  const hash = location.hash.replace('#','');
  if (hash && pages.includes(hash)) return hash;
  const search = new URLSearchParams(location.search).get('page');
  if (search && pages.includes(search)) return search;
  return 'home';
}

// Nav active state
function setActiveNav(page) {
  document.querySelectorAll('.nav-list a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('data-link') === page);
  });
}

// Page fetcher - Fade uniquement sur mainContent, pas sur header
async function loadPage(page, push = false){
  if (!pages.includes(page)) page = 'home';
  loader.classList.add('active');
  try {
    const res = await fetch(`./pages/${page}.html`);
    if (!res.ok) throw new Error('Page non trouvée');
    const html = await res.text();

    // Fade seulement sur mainContent
    main.style.opacity = 0;
    setTimeout(()=> {
      main.innerHTML = html;
      main.focus();
      main.style.opacity = 1;
      runPageScripts(page);
      setActiveNav(page);
    }, 150);

    if (push) {
      // push state with hash for shareable URL
      history.pushState({page}, '', `#${page}`);
    }
  } catch (err) {
    main.innerHTML = `<section class="section"><h2 class="h2">Erreur</h2><p>Impossible de charger la page.</p></section>`;
    console.error(err);
  } finally {
    setTimeout(()=>loader.classList.remove('active'), 250);
  }
}

function navigateTo(page) {
  loadPage(page, true);
  // FIX: Fermer le menu après la navigation sur mobile
  if (window.innerWidth <= 900) { 
      navList.classList.remove('open');
      mobileToggle.classList.remove('open');
      document.body.style.overflow = ''; // Rétablir le défilement
  }
}

// Handle browser back/forward
window.addEventListener('popstate', e => {
  const state = e.state;
  const page = (state && state.page) ? state.page : currentPageFromURL();
  loadPage(page, false);
});

// Run small page-level scripts (e.g. animate skill bars)
function runPageScripts(page) {
  if (page === 'skills') {
    // animate progress bars
    document.querySelectorAll('.bar > i').forEach((el)=>{
      const val = el.getAttribute('data-value') || '0';
      el.style.width = '0%';
      setTimeout(()=> {
        el.style.transition = 'width 900ms cubic-bezier(.2,.9,.2,1)';
        el.style.width = val + '%';
      }, 120);
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

  const initial = currentPageFromURL();
  loadPage(initial, false);
});