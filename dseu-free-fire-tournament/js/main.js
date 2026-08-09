/* ============================================================
   DSEU FREE FIRE ESPORTS TOURNAMENT — SHARED SCRIPTS
   File : js/main.js
   Role : loaded on EVERY page. Handles the navigation bar,
          footer year and localStorage helpers used by the
          registration, success and admin pages.
   ============================================================ */

/* ------------------------------------------------------------
   1. STORAGE KEYS & HELPERS
   All data lives in the browser's localStorage.
   The list below shows the exact key names used everywhere.
   ------------------------------------------------------------ */
var REG_KEY = 'dseu_fe_registrations'; // the array of all registrations
var COUNTER_KEY = 'dseu_fe_counter';   // counter used to make unique IDs
var LAST_ID_KEY = 'dseu_fe_last_id';   // the ID of the most recent registration

/** Read the full list of registrations (safe if empty/corrupt). */
function getRegistrations() {
  try {
    var raw = localStorage.getItem(REG_KEY);
    var list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

/** Save the full list of registrations. */
function saveRegistrations(list) {
  localStorage.setItem(REG_KEY, JSON.stringify(list));
}

/** Create the next unique registration ID (DSEU-FE-001, 002, ...). */
function nextRegistrationId() {
  var count = parseInt(localStorage.getItem(COUNTER_KEY), 10);
  if (isNaN(count) || count < 0) {
    count = getRegistrations().length; // rebuild from existing data
  }
  count = count + 1;
  localStorage.setItem(COUNTER_KEY, String(count));
  return 'DSEU-FE-' + String(count).padStart(3, '0');
}

/** Remember the most recent registration ID (used by success page). */
function setLastId(id) { localStorage.setItem(LAST_ID_KEY, id); }
function getLastId() { return localStorage.getItem(LAST_ID_KEY) || ''; }

/** Format an ISO date string into a friendly date + time. */
function formatDate(iso) {
  if (!iso) { return '—'; }
  var d = new Date(iso);
  if (isNaN(d.getTime())) { return '—'; }
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/** Validate a mobile / WhatsApp number. Accepts +, spaces, dashes. */
function isValidMobile(value) {
  var digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/** Validate a Free Fire UID (numbers only, 6-16 digits). */
function isValidUid(value) {
  return /^\d{6,16}$/.test(String(value || '').trim());
}

/** Validate an uploaded file. Returns true when the file is OK. */
function isValidFile(file, allowedTypes, maxMb) {
  if (!file) { return false; }
  var okType = allowedTypes.indexOf(file.type) !== -1;
  var okSize = file.size <= maxMb * 1024 * 1024;
  return okType && okSize;
}

/** Convert a File object into a base64 data URL (for localStorage). */
function readFileAsDataUrl(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () { resolve(reader.result); };
    reader.onerror = function () { reject(new Error('Could not read the file')); };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------
   2. NAVBAR (hamburger menu on mobile + active link highlight)
   ------------------------------------------------------------ */
(function setupNavbar() {
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    // close the menu when clicking outside of it
    document.addEventListener('click', function (e) {
      if (links.classList.contains('open') &&
          !links.contains(e.target) && !toggle.contains(e.target)) {
        links.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // add a subtle background after scrolling
  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  // mark the current page in the navigation as active
  var pageName = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(function (link) {
    var href = link.getAttribute('href') || '';
    var targetFile = href.split('#')[0];
    if (targetFile === pageName) { link.classList.add('active'); }
  });
})();

/* ------------------------------------------------------------
   3. FOOTER YEAR (always current)
   ------------------------------------------------------------ */
(function setYear() {
  var y = document.getElementById('year');
  if (y) { y.textContent = new Date().getFullYear(); }
})();

/* ------------------------------------------------------------
   4. SCROLL-REVEAL ANIMATIONS (elements with data-reveal)
   ------------------------------------------------------------ */
(function setupReveal() {
  var items = document.querySelectorAll('[data-reveal]');
  if (!items.length) { return; }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('revealed'); });
  }
})();

/* ------------------------------------------------------------
   5. ADMIN LOGIN GUARD (username + password protection)
   ------------------------------------------------------------
   How it works (Version 1):
   - admin-login.html checks the username & password below.
   - On success it saves a small "logged in" flag in localStorage.
   - admin.html calls requireAdminLogin() on every load and sends
     users back to admin-login.html when they are not logged in.
   - Clicking LOGOUT clears the flag and returns to the login page.
   ⚠️ NOTE: this is a client-side check — good enough for local
     testing. For real security we would need a server (v2).
   ------------------------------------------------------------ */

// 🔑 FIXED CREDENTIALS FOR LOCAL TESTING
// Change these two lines to change the admin login details.
var ADMIN_USERNAME = 'sam007';
var ADMIN_PASSWORD = '817815356AIM';

var ADMIN_AUTH_KEY = 'dseu_fe_admin_authed';  // "logged in" flag

/** Check a typed username + password. */
function verifyAdminLogin(username, password) {
  return String(username || '').trim() === ADMIN_USERNAME &&
         String(password || '') === ADMIN_PASSWORD;
}

/** Marks the current browser as logged-in. */
function setAdminAuthed() { localStorage.setItem(ADMIN_AUTH_KEY, 'yes'); }
function clearAdminAuthed() { localStorage.removeItem(ADMIN_AUTH_KEY); }
function isAdminAuthed() { return localStorage.getItem(ADMIN_AUTH_KEY) === 'yes'; }

/**
 * Call this at the start of admin.js. It redirects to
 * admin-login.html when the visitor is not logged in.
 */
function requireAdminLogin() {
  if (!isAdminAuthed()) {
    location.replace('admin-login.html');
    return false;
  }
  return true;
}

/** Logs out and returns to the login page. */
function logoutAdmin() {
  clearAdminAuthed();
  location.href = 'admin-login.html';
}