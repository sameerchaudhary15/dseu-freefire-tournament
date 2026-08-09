/* ============================================================
   DSEU FREE FIRE ESPORTS TOURNAMENT — SUCCESS PAGE SCRIPTS
   File : js/success.js  (only loaded on success.html)
   Role : find the newest registration and display the ID etc.
   ============================================================ */

(function loadSuccessCard() {
  // prefer the ?id= value passed by the register page
  var id = new URLSearchParams(location.search).get('id') || getLastId();
  var reg = getRegistrations().filter(function (r) { return r.id === id; })[0];

  if (!reg) {
    // no registration found → show the card anyway with a friendly notice
    var msg = document.querySelector('.success-sub');
    if (msg) { msg.textContent = 'No registration found in this browser. Please register a team first.'; }
    return;
  }

  var setText = function (elId, value) {
    var el = document.getElementById(elId);
    if (el) { el.textContent = value || '—'; }
  };

  setText('regId', reg.id);
  setText('regId2', reg.id);
  setText('regTeam', reg.teamName);
  setText('regCategory', reg.participantCategory || '—');
  setText('regFee', reg.registrationFee ? '₹' + reg.registrationFee : '—');

  var pay = reg.paymentStatus || 'Pending Verification';
  var statusEl = document.getElementById('regPaymentStatus');
  if (statusEl) {
    statusEl.textContent = pay;
    statusEl.classList.remove('pay-pending', 'pay-verified', 'pay-rejected');
    statusEl.classList.add(
      pay === 'Payment Verified' ? 'pay-verified' :
      pay === 'Payment Rejected' ? 'pay-rejected' : 'pay-pending'
    );
  }
})();