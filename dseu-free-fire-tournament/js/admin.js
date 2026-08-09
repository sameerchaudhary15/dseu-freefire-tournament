/* ============================================================
   DSEU FREE FIRE ESPORTS TOURNAMENT — ADMIN PAGE SCRIPTS
   File : js/admin.js  (only loaded on admin.html)
   Role : dashboard stats, search, table, status changes,
          delete and CSV export. All data comes from localStorage.
   ============================================================ */

(function () {
  'use strict';

  /* 0. SECURITY GUARD — only a logged-in admin may use this page.
     If the visitor is not logged in, they are sent to
     admin-login.html and the rest of this script stops. */
  if (!requireAdminLogin()) { return; }

  /* state: the raw list, plus the current search + status filter */
  var allRegs = getRegistrations();
var searchText = '';
var statusFilter = 'all';
var currentReg = null; // the registration shown inside the detail modal

var tableBody = document.getElementById('tableBody');
var emptyState = document.getElementById('emptyState');
var detailModal = document.getElementById('detailModal');

/* ------------------------------------------------------------
   1. DASHBOARD STATS
   ------------------------------------------------------------ */
function renderStats() {
  var total = allRegs.length;
  var pending = 0, verified = 0, rejected = 0;
  allRegs.forEach(function (r) {
    var ps = r.paymentStatus || '';
    if (ps === 'Payment Verified') { verified++; }
    else if (ps === 'Payment Rejected') { rejected++; }
    else { pending++; } // "Pending Verification" + older registrations
  });
  setText('statTotal', total);
  setText('statPending', pending);
  setText('statApproved', verified);
  setText('statRejected', rejected);
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) { el.textContent = value; }
}

/* ------------------------------------------------------------
   2. TABLE RENDERING  (with search + status filter applied)
   ------------------------------------------------------------ */
function getFiltered() {
  var term = searchText.toLowerCase();
  return allRegs.filter(function (r) {
    var matchesSearch = !term ||
      (r.teamName || '').toLowerCase().indexOf(term) !== -1 ||
      (r.id || '').toLowerCase().indexOf(term) !== -1;
    var cat = r.participantCategory || '';
    var pay = r.paymentStatus || '';
    var matchesFilter;
    switch (statusFilter) {
      case 'college':      matchesFilter = cat === 'DSEU / College Student'; break;
      case 'outsider':     matchesFilter = cat === 'Outsider'; break;
      case 'pay-pending':  matchesFilter = !pay || pay === 'Pending Verification'; break;
      case 'pay-verified': matchesFilter = pay === 'Payment Verified'; break;
      case 'pay-rejected': matchesFilter = pay === 'Payment Rejected'; break;
      default:             matchesFilter = statusFilter === 'all' || r.status === statusFilter;
    }
    return matchesSearch && matchesFilter;
  });
}

function renderTable() {
  var rows = getFiltered();

  // show the empty state when there is nothing to display
  tableBody.innerHTML = '';
  emptyState.style.display = rows.length ? 'none' : 'block';

  rows.forEach(function (r) {
    var tr = document.createElement('tr');

    var category = r.participantCategory || '—';
    var fee = r.registrationFee ? '₹' + r.registrationFee : '—';
    var utr = r.utr || '—';
    var pay = r.paymentStatus || '—';
    var date = formatDate(r.date);

    tr.innerHTML =
      '<td><span class="reg-id">' + esc(r.id) + '</span></td>' +
      '<td><span class="team-name">' + esc(r.teamName) + '</span></td>' +
      '<td class="muted">' + esc(r.captainName) + '</td>' +
      '<td class="muted">' + esc(category) + '</td>' +
      '<td class="fee-cell">' + esc(fee) + '</td>' +
      '<td class="muted utr-cell" title="' + esc(utr) + '">' + esc(utr) + '</td>' +
      '<td><span class="badge ' + payBadgeClass(r.paymentStatus) + '">' + esc(pay) + '</span></td>' +
      '<td><span class="badge ' + esc(r.status) + '">' + esc(r.status) + '</span></td>' +
      '<td class="muted">' + esc(date) + '</td>' +
      '<td><div class="row-actions">' +
      '  <button class="icon-btn" data-action="view" data-id="' + esc(r.id) + '" title="View details">' +
      '    <svg class="icon"><use href="#icon-eye"/></svg></button>' +
      '  <button class="icon-btn danger" data-action="delete" data-id="' + esc(r.id) + '" title="Delete">' +
      '    <svg class="icon"><use href="#icon-trash"/></svg></button>' +
      '</div></td>';

    tableBody.appendChild(tr);
  });
}

/* escape special HTML characters so input text is shown safely */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* css class used for a payment-status badge (no spaces allowed in class names) */
function payBadgeClass(paymentStatus) {
  if (paymentStatus === 'Payment Verified') { return 'pay-verified'; }
  if (paymentStatus === 'Payment Rejected') { return 'pay-rejected'; }
  return 'pay-pending';
}

/* ------------------------------------------------------------
   3. SEARCH + STATUS FILTER EVENTS
   ------------------------------------------------------------ */
document.getElementById('searchInput').addEventListener('input', function (e) {
  searchText = e.target.value.trim();
  renderTable();
});

document.getElementById('statusFilter').addEventListener('change', function (e) {
  statusFilter = e.target.value;
  renderTable();
});
/* ------------------------------------------------------------
   4. TABLE ACTIONS (view + delete buttons inside each row)
   ------------------------------------------------------------ */
tableBody.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) { return; }
  var id = btn.getAttribute('data-id');
  var reg = allRegs.filter(function (r) { return r.id === id; })[0];
  if (!reg) { return; }

  if (btn.getAttribute('data-action') === 'view') {
    openModal(reg);
  } else if (btn.getAttribute('data-action') === 'delete') {
    askDelete(reg);
  }
});

/* ------------------------------------------------------------
   5. DETAIL MODAL — full view of one registration
   ------------------------------------------------------------ */
function openModal(reg) {
  currentReg = reg;
  var escName = function (s) { return esc(s || '—'); };

  document.getElementById('modalTeam').textContent = reg.teamName || '—';
  document.getElementById('modalId').textContent = reg.id || '—';
  var badge = document.getElementById('modalBadge');
  badge.textContent = reg.status || 'Pending';
  badge.className = 'modal-badge badge ' + esc(reg.status || 'Pending');

  var subs = (reg.substitute && reg.substitute.name) ? escName(reg.substitute.name) + ' (UID: ' + escName(reg.substitute.uid) + ')' : 'None';
  var players = reg.players.map(function (p, i) {
    return { name: p.name, uid: p.uid };
  });
  var logoImg = '<img class="img-preview" src="' + reg.teamLogo + '" alt="Team logo">';
  var paymentImg = '<img class="img-preview" src="' + reg.verification.paymentScreenshot + '" alt="Payment screenshot">';

  document.getElementById('modalBody').innerHTML =
    kv('Category', escName(reg.participantCategory || '—')) +
    kv('Registration Fee', reg.registrationFee ? '₹' + reg.registrationFee : '—') +
    kv('UTR / Transaction ID', escName(reg.utr || '—')) +
    kv('Payment Status', '<span class="badge ' + payBadgeClass(reg.paymentStatus) + '">' + esc(reg.paymentStatus || 'Pending Verification') + '</span>') +
    kv('Captain', escName(reg.captainName)) +
    kv('Captain WhatsApp', escName(reg.captainWhatsApp)) +
    kv('Team UID', escName(reg.teamUID)) +
    kv('Registration Status', esc(reg.status || 'Pending')) +
    kv('Registered On', esc(formatDate(reg.date))) +
    kv('College', escName(reg.college && reg.college.name)) +
    kv('Course', escName(reg.college && reg.college.course)) +
    kv('Semester / Year', escName(reg.college && reg.college.semester)) +
    kv('Student ID / Roll No.', escName(reg.college && reg.college.studentId)) +
    kv('Instagram', escName(reg.verification && reg.verification.instagram)) +
    kv('WhatsApp', escName(reg.verification && reg.verification.whatsapp)) +
    kv('Players', players.map(function (p) { return escName(p.name) + ' · UID ' + escName(p.uid); }).join('<br>')) +
    kv('Substitute', subs) +
    kv('Team Logo', reg.teamLogo ? logoImg : '—', true) +
    kv('Payment Screenshot', reg.verification && reg.verification.paymentScreenshot ? paymentImg : '—', true);

  detailModal.classList.add('open');
  detailModal.setAttribute('aria-hidden', 'false');
}

function kv(label, value, full) {
  return '<div class="modal-kv' + (full ? ' full' : '') + '">' +
         '<div class="k">' + label + '</div>' +
         '<div class="v">' + value + '</div></div>';
}

/* modal close (backdrop, X button, Escape key) */
document.querySelectorAll('#detailModal [data-close]').forEach(function (el) {
  el.addEventListener('click', closeModal);
});
function closeModal() {
  detailModal.classList.remove('open');
  detailModal.setAttribute('aria-hidden', 'true');
  currentReg = null;
}
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
});
/* ------------------------------------------------------------
   6. STATUS CHANGE (modal buttons: Pending / Approve / Reject)
   ------------------------------------------------------------ */
document.querySelectorAll('.modal-status-actions [data-status]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    if (!currentReg) { return; }
    setStatus(currentReg.id, btn.getAttribute('data-status'));
    closeModal();
  });
});

/** Update the registration status of one registration and re-render. */
function setStatus(id, status) {
  allRegs.forEach(function (r) {
    if (r.id === id) { r.status = status; }
  });
  saveRegistrations(allRegs);
  renderStats();
  renderTable();
}

/* payment status buttons in the detail modal (manual payment verification) */
document.querySelectorAll('.modal-status-actions [data-pay]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    if (!currentReg) { return; }
    setPaymentStatus(currentReg.id, btn.getAttribute('data-pay'));
    closeModal();
  });
});

/** Update the payment status of one registration and re-render. */
function setPaymentStatus(id, paymentStatus) {
  allRegs.forEach(function (r) {
    if (r.id === id) { r.paymentStatus = paymentStatus; }
  });
  saveRegistrations(allRegs);
  renderStats();
  renderTable();
}

/* ------------------------------------------------------------
   7. DELETE (with a confirmation dialog)
   ------------------------------------------------------------ */
var confirmOverlay = document.getElementById('confirmOverlay');
var confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
var pendingDeleteId = null;

function askDelete(reg) {
  pendingDeleteId = reg.id;
  document.getElementById('confirmText').textContent =
    'Delete "' + reg.teamName + '" (' + reg.id + ')? This cannot be undone.';
  confirmOverlay.classList.add('open');
}
function closeConfirm() {
  confirmOverlay.classList.remove('open');
  pendingDeleteId = null;
}
document.getElementById('confirmCancelBtn').addEventListener('click', closeConfirm);
document.addEventListener('click', function (e) {
  if (e.target === confirmOverlay) { closeConfirm(); }
});

confirmDeleteBtn.addEventListener('click', function () {
  allRegs = allRegs.filter(function (r) { return r.id !== pendingDeleteId; });
  saveRegistrations(allRegs);
  closeConfirm();
  closeModal();
  renderStats();
  renderTable();
});

/* delete button inside the detail modal */
document.getElementById('modalDelete').addEventListener('click', function () {
  if (currentReg) { askDelete(currentReg); }
});

/* ------------------------------------------------------------
   8. CSV EXPORT  (downloads a .csv file of all registrations)
   ------------------------------------------------------------ */
document.getElementById('btnExport').addEventListener('click', exportCsv);

function exportCsv() {
  if (!allRegs.length) {
    alert('Nothing to export yet — no registrations found.');
    return;
  }

  var header = [
    'Registration ID', 'Registration Status', 'Payment Status', 'Category', 'Fee', 'UTR', 'Date',
    'Team Name', 'Team UID', 'Captain', 'Captain WhatsApp',
    'Player 1', 'Player 1 UID', 'Player 2', 'Player 2 UID',
    'Player 3', 'Player 3 UID', 'Player 4', 'Player 4 UID',
    'Substitute', 'Substitute UID',
    'College', 'Course', 'Semester/Year', 'Student ID',
    'Instagram', 'WhatsApp (updates)'
  ];

  var lines = [header.join(',')];

  allRegs.forEach(function (r) {
    var p = r.players || [];
    var row = [
      r.id, r.status, r.paymentStatus,
      r.participantCategory, r.registrationFee ? '₹' + r.registrationFee : '', r.utr, r.date,
      r.teamName, r.teamUID, r.captainName, r.captainWhatsApp,
      (p[0] || {}).name, (p[0] || {}).uid,
      (p[1] || {}).name, (p[1] || {}).uid,
      (p[2] || {}).name, (p[2] || {}).uid,
      (p[3] || {}).name, (p[3] || {}).uid,
      r.substitute && r.substitute.name, r.substitute && r.substitute.uid,
      r.college && r.college.name, r.college && r.college.course,
      r.college && r.college.semester, r.college && r.college.studentId,
      r.verification && r.verification.instagram,
      r.verification && r.verification.whatsapp
    ];
    // wrap every cell in quotes so commas in names are safe
    lines.push(row.map(function (cell) { return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"'; }).join(','));
  });

  var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'dseu-fe-registrations.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/* ------------------------------------------------------------
   9. INITIAL RENDER
   ------------------------------------------------------------ */
renderStats();
renderTable();

/* ------------------------------------------------------------
   10. LOGOUT
   ------------------------------------------------------------ */
var btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
  btnLogout.addEventListener('click', logoutAdmin); // helper from main.js
}

})();