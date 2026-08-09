/* ============================================================
   DSEU FREE FIRE ESPORTS TOURNAMENT — ADMIN LOGIN SCRIPT
   File : js/admin-login.js  (only loaded on admin-login.html)
   Role : check the username + password and open the dashboard.
   The credentials + session helpers live in js/main.js.
   ============================================================ */

(function () {
  'use strict';

  // Already logged in? Skip the login page and go straight to the dashboard.
  if (isAdminAuthed()) {
    location.replace('admin.html');
    return;
  }

  var form = document.getElementById('loginForm');
  var errorEl = document.getElementById('loginError');
  var passwordInput = document.getElementById('password');
  var toggleBtn = document.getElementById('togglePw');

  /* ---- show / hide password button ---- */
  toggleBtn.addEventListener('click', function () {
    var show = passwordInput.type === 'password';
    passwordInput.type = show ? 'text' : 'password';
    toggleBtn.classList.toggle('active', show);
    toggleBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  /* ---- hide the error again as soon as the admin types ---- */
  form.addEventListener('input', function () {
    errorEl.classList.remove('show');
  });

  /* ---- LOGIN ---- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var username = document.getElementById('username').value;
    var password = passwordInput.value;

    if (verifyAdminLogin(username, password)) {
      setAdminAuthed();          // save the "logged in" flag
      location.href = 'admin.html';
    } else {
      // One generic message — never reveal whether the username or
      // the password was the problem.
      errorEl.classList.add('show');
    }
  });
})();