/* main.js*/

const main = document.getElementById('mainContent');
const loader = document.getElementById('pageLoader');
const mobileToggle = document.getElementById('mobileToggle');
const navList = document.getElementById('navList');
const themeToggle = document.getElementById('themeToggle'); 

// langue
const langFrToggle = document.getElementById('langFrToggle'); 
const langEnToggle = document.getElementById('langEnToggle'); 

const pages = ['home','about','resume','projects','skills','engagements','testimonials','contact'];

let currentLang = localStorage.getItem('lang') || 'fr'; 

// --- DICTIONNAIRE DE TRADUCTION DU MENU ---
const translations = {
  fr: {
    nav_home: "Accueil",
    nav_about: "Profil",
    nav_resume: "CV",
    nav_projects: "Projets",
    nav_skills: "Compétences",
    nav_engagements: "Engagements",
    nav_contact: "Contact"
  },
  en: {
    nav_home: "Home",
    nav_about: "Profile",
    nav_resume: "Resume",
    nav_projects: "Projects",
    nav_skills: "Skills",
    nav_engagements: "Involvement",
    nav_contact: "Contact"
  }
};

function updateStaticText(lang) {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });
}

function currentPageFromURL() {
  const hash = window.location.hash.slice(1);
  return hash || 'home';
}

// Mobile menu
mobileToggle.addEventListener('click', () => {
  navList.classList.toggle('open');
  mobileToggle.classList.toggle('open');
  const isExpanded = navList.classList.contains('open');
  mobileToggle.setAttribute('aria-expanded', isExpanded);
  document.body.style.overflow = isExpanded ? 'hidden' : '';
});


// Theme Toggle Logic
function setDarkTheme(isDark) {
  document.body.classList.toggle('theme-dark', isDark);
  document.body.classList.toggle('theme-light', !isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
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


// Langue
function updateLangButtonState(lang) {
  document.documentElement.setAttribute('lang', lang);

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
  updateLangButtonState(lang);
  updateStaticText(lang);
  const currentPage = currentPageFromURL(); 
  loadPage(currentPage, false);
}


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
    main.style.opacity = 0;
    setTimeout(()=> {
      main.innerHTML = html;
      window.scrollTo(0, 0); 
      main.style.opacity = 1;
      runPageScripts(page);
      setActiveNav(page);
      if (navList.classList.contains('open')) {
        mobileToggle.click();
      }
    }, 150);
    if (push) {
      history.pushState({page}, '', `#${page}`);
    } else {
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
    setTimeout(()=>loader.classList.remove('active'), 250);
  }
}


document.addEventListener('click', (e) => {
  const target = e.target.closest('a[data-link]');
  if (target) {
    e.preventDefault();
    const page = target.getAttribute('data-link');
    loadPage(page, true);
    return;
  }
});


window.addEventListener('popstate', (e) => {
  const page = currentPageFromURL();
  loadPage(page, false);
});


function runPageScripts(page) {
  if (page === 'skills') {
    document.querySelectorAll('.skill .bar > i').forEach(bar => {
      bar.style.width = '0%';
      setTimeout(() => {
        const value = bar.getAttribute('data-value');
        bar.style.width = `${value}%`;
      }, 50); 
    });
  }
  if (page === 'engagements') {
    document.querySelectorAll('.eng-header.clickable').forEach(header => {
      header.addEventListener('click', e => {
        const details = header.nextElementSibling;
        const card = header.closest('.card.engagement');
        details.classList.toggle('open');
        header.classList.toggle('open');
        if(card) card.classList.toggle('open'); 
      });
    });
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
      });
    });
  }
}


document.addEventListener('DOMContentLoaded', ()=>{
  // Initialiser le thème
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
  
  // Initialisation de la langue au chargement
  updateLangButtonState(currentLang);

  updateStaticText(currentLang);
  const initial = currentPageFromURL();
  loadPage(initial, false);
});