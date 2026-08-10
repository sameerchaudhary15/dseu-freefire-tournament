/* ============================================================
   DSEU FREE FIRE ESPORTS TOURNAMENT — REGISTRATION FORM SCRIPTS
   File : js/register.js  (only loaded on register.html)
   Role : multi-step form behaviour + validation + saving.
   ============================================================ */

/* ------------------------------------------------------------
   1. QUICK REFERENCES TO FORM ELEMENTS
   ------------------------------------------------------------ */
var form = document.getElementById('registrationForm');
var panels = Array.prototype.slice.call(document.querySelectorAll('.step-panel'));
var stepEls = Array.prototype.slice.call(document.querySelectorAll('.step'));
var progressFill = document.getElementById('progressFill');
var btnPrev = document.getElementById('btnPrev');
var btnNext = document.getElementById('btnNext');
var btnSubmit = document.getElementById('btnSubmit');
var formErrorBox = document.getElementById('formErrorBox');
var formErrorText = document.getElementById('formErrorText');

var currentStep = 1;               // starting on step 1
var totalSteps = 5;
var MAX_FILE_BYTES = 1024 * 1024;  // max upload size 1 MB
var imgTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/* uploaded files are stored here (as base64 strings) */
var uploaded = { teamLogo: '', paymentScreenshot: '' };

/* ------------------------------------------------------------
   2. UI HELPERS  (show/hide panels, update progress bar)
   ------------------------------------------------------------ */
function getPanel(id) { return document.getElementById('step-' + id); }

function goToStep(step) {
  currentStep = Math.min(Math.max(step, 1), totalSteps);

  // hide every panel, then show the active one
  panels.forEach(function (p) { p.classList.remove('active'); });
  getPanel(currentStep).classList.add('active');

  // update the step circles + progress fill width
  stepEls.forEach(function (el) {
    var n = parseInt(el.getAttribute('data-step'), 10);
    el.classList.toggle('active', n === currentStep);
    el.classList.toggle('done', n < currentStep);
  });
  progressFill.style.width = ((currentStep / totalSteps) * 100) + '%';

  // prev is disabled on step 1, next hidden on step 5 (submit shows instead)
  btnPrev.disabled = currentStep === 1;
  btnNext.style.display = currentStep === totalSteps ? 'none' : 'inline-flex';
  btnSubmit.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';

  hideFormError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* show a red box under the form with a general message */
function showFormError(message) {
  formErrorText.textContent = message;
  formErrorBox.classList.add('show');
}
function hideFormError() { formErrorBox.classList.remove('show'); }

/* field-level errors */
function setError(input, message) {
  input.classList.add('invalid');
  var err = document.getElementById('err-' + input.id);
  if (err) { err.textContent = message; err.classList.add('show'); }
}
function clearError(input) {
  input.classList.remove('invalid');
  var err = document.getElementById('err-' + input.id);
  if (err) { err.textContent = ''; err.classList.remove('show'); }
}

/* ------------------------------------------------------------
   3. NAVIGATION BUTTONS
   ------------------------------------------------------------ */
btnPrev.addEventListener('click', function () { goToStep(currentStep - 1); });

btnNext.addEventListener('click', function () {
  var ok = validateStep(currentStep);
  if (ok) { goToStep(currentStep + 1); }
});

form.addEventListener('submit', function (e) {
  e.preventDefault();
  // validate every step one more time before saving
  var allOk = validateStep(1) && validateStep(2) && validateStep(3) && validateStep(4);
  if (!allOk) {
    // jump back to the first step with errors, THEN show the summary box
    goToStep(firstInvalidStep());
    showFormError('Please fix the highlighted fields, then submit again.');
    return;
  }
  submitRegistration();
});
/* ------------------------------------------------------------
   4. STEP VALIDATION
   Each validate function returns true only when the step is OK.
   Error messages are shown under the relevant fields.
   ------------------------------------------------------------ */

/** Fill an error message when a field is required but empty. */
function reqVal(input, label) {
  var v = input.value.trim();
  if (!v) {
    setError(input, label + ' is required.');
    return false;
  }
  clearError(input);
  return true;
}

function validateStep(step) {
  var ok = true;
  var f = function (input, label) { if (!reqVal(input, label)) { ok = false; } };
  var uid = function (input, label) {
    if (!input.value.trim()) { setError(input, label + ' is required.'); ok = false; return; }
    if (!isValidUid(input.value)) { setError(input, 'Enter a valid Free Fire UID (numbers only).'); ok = false; return; }
    clearError(input);
  };
  var mob = function (input, label) {
    if (!input.value.trim()) { setError(input, label + ' is required.'); ok = false; return; }
    if (!isValidMobile(input.value)) { setError(input, 'Enter a valid mobile number.'); ok = false; return; }
    clearError(input);
  };

  if (step === 1) {
    f($('teamName'), 'Team name');
    f($('captainName'), 'Captain name');
    mob($('captainWhatsApp'), 'Captain WhatsApp number');
    uid($('teamUID'), 'Team UID');
  }

  if (step === 2) {
    [1, 2, 3, 4].forEach(function (n) {
      f($('p' + n + 'name'), 'Player ' + n + ' name');
      uid($('p' + n + 'uid'), 'Player ' + n + ' UID');
    });
    // substitute: either both filled or both empty
    var sName = $('subName');
    var sUid = $('subUid');
    var bothFilled = sName.value.trim() && sUid.value.trim();
    var halfFilled = (sName.value.trim() && !sUid.value.trim()) || (!sName.value.trim() && sUid.value.trim());
    if (halfFilled) {
      if (!sName.value.trim()) { setError(sName, 'Add the substitute name too.'); }
      if (!sUid.value.trim()) { setError(sUid, 'Add the substitute UID too.'); }
      ok = false;
    } else if (bothFilled && !isValidUid(sUid.value)) {
      setError(sUid, 'Enter a valid Free Fire UID (numbers only).');
      ok = false;
    } else {
      clearError(sName); clearError(sUid);
    }
  }

  if (step === 3) {
    var categorySel = $('participantCategory');
    var category = getSelectedCategory();
    if (!category) {
      setError(categorySel, 'Please select a participant category.');
      ok = false;
    } else {
      clearError(categorySel);
    }
    // college details are required only for DSEU / college students
    if (category === CATEGORY_COLLEGE) {
      f($('collegeName'), 'College name');
      f($('course'), 'Course');
      f($('semester'), 'Semester / year');
      f($('studentId'), 'Student ID / roll number');
    }
  }

  if (step === 4) {
    // UTR / Transaction ID — required before the form can be submitted
    var utrVal = $('utr').value.trim();
    if (!utrVal) {
      setError($('utr'), 'UTR / Transaction ID is required.');
      ok = false;
    } else if (!/^[A-Za-z0-9\-:._\/]{6,40}$/.test(utrVal)) {
      setError($('utr'), 'Enter a valid UTR / Transaction ID (letters and numbers only).');
      ok = false;
    } else {
      clearError($('utr'));
    }
    // payment screenshot must be uploaded
    if (!uploaded.paymentScreenshot) {
      setError($('paymentScreenshot'), 'Payment screenshot is required.');
      ok = false;
    } else {
      clearError($('paymentScreenshot'));
    }
    // payment confirmation checkbox must be selected
    var confirmBox = $('paymentConfirm');
    if (!confirmBox.checked) {
      setError(confirmBox, 'Please confirm your payment to continue.');
      ok = false;
    } else {
      clearError(confirmBox);
    }
  }

  if (step === 5) {
    f($('instagram'), 'Instagram username');
    mob($('whatsapp'), 'WhatsApp number');
  }

  return ok;
}

function $ (id) { return document.getElementById(id); }

/**
 * Find the first step that still has errors, so the user is
 * taken back to it after a failed submit. (Re-checks all steps.)
 */
function firstInvalidStep() {
  for (var i = 1; i <= totalSteps; i++) {
    if (!validateStep(i)) { return i; }
  }
  return 1;
}

/* ------------------------------------------------------------
   5. FILE UPLOAD HANDLING (logo + payment screenshot)
   Validates type & size, then stores the image as a base64 URL.
   ------------------------------------------------------------ */
function setupFileInput(inputId, key, previewId, fileBoxId, errId, maxMb, allowedTypes) {
  var input = $(inputId);
  var preview = $(previewId);
  var errorEl = $(errId);
  var types = allowedTypes || imgTypes;

  input.addEventListener('change', function () {
    errorEl.classList.remove('show');
    var file = input.files && input.files[0];
    if (!file) {
      uploaded[key] = '';
      preview.classList.add('hidden');
      preview.innerHTML = '';
      return;
    }
    if (!isValidFile(file, types, maxMb)) {
      // file type or size is not allowed → reject it
      errorEl.textContent = 'Invalid file. Use PNG, JPG or WEBP up to ' + maxMb + ' MB.';
      errorEl.classList.add('show');
      input.value = '';
      uploaded[key] = '';
      preview.classList.add('hidden');
      preview.innerHTML = '';
      return;
    }
    readFileAsDataUrl(file).then(function (dataUrl) {
      uploaded[key] = dataUrl;
      // show a small preview thumbnail + file details
      var sizeText = (file.size / 1024).toFixed(0) + ' KB';
      preview.innerHTML =
        '<img src="' + dataUrl + '" alt="Uploaded image">' +
        '<div><div class="fname">' + file.name + '</div><div class="fsize">' + sizeText + '</div></div>';
      preview.classList.remove('hidden');
    }).catch(function () {
      errorEl.textContent = 'Could not read that file. Please try again.';
      errorEl.classList.add('show');
    });
  });
}

setupFileInput('teamLogo', 'teamLogo', 'previewLogo', 'fileBoxLogo', 'err-teamLogo', 1);
setupFileInput('paymentScreenshot', 'paymentScreenshot', 'previewPayment', 'fileBoxPayment', 'err-paymentScreenshot', 2, ['image/png', 'image/jpeg', 'image/webp']);

/* ------------------------------------------------------------
   5b. PARTICIPANT CATEGORY → REGISTRATION FEE
   The fee is ALWAYS derived from the selected category — the
   user can never type or change the price themselves.
   ------------------------------------------------------------ */
var CATEGORY_COLLEGE = 'DSEU / College Student';
var CATEGORY_OUTSIDER = 'Outsider';
var NUM_PAID_PLAYERS = 4;  // 4 main players per squad (substitute is NOT charged)

function getSelectedCategory() {
  var s = $('participantCategory');
  return s ? s.value : '';
}

function getRegistrationFee(category) {
  if (category === CATEGORY_COLLEGE) { return 49; }
  if (category === CATEGORY_OUTSIDER) { return 79; }
  return 0;
}

/* Refresh the fee text, college block and payment card whenever
   the category changes. */
function updateFeeUi() {
  var category = getSelectedCategory();
  var fee = getRegistrationFee(category);          // per-player rate (₹49 college / ₹79 outsider)
  var totalFee = fee * NUM_PAID_PLAYERS;            // total = per-player × 4 main players
  var collegeBlock = document.getElementById('collegeBlock');
  var hint = document.getElementById('feeHint');

  // college details only appear for DSEU / college students
  if (collegeBlock) { collegeBlock.style.display = (category === CATEGORY_COLLEGE) ? 'block' : 'none'; }

  if (hint) {
    hint.textContent = fee > 0
      ? 'Registration Fee: ₹' + totalFee + ' (₹' + fee + '/player × ' + NUM_PAID_PLAYERS + ' players) — set automatically from your category.'
      : 'Select a category to see your registration fee.';
  }

  var amountEl = document.getElementById('payFeeAmount');
  var catEl = document.getElementById('payFeeCat');
  if (amountEl) { amountEl.textContent = fee > 0 ? '₹' + totalFee : '₹—'; }
  if (catEl) {
    catEl.textContent =
      category === CATEGORY_COLLEGE ? 'College Student Registration' :
      category === CATEGORY_OUTSIDER ? 'Outsider Registration' :
      'Select your category first';
  }
}

var categoryInput = $('participantCategory');
categoryInput.addEventListener('change', function () {
  clearError(categoryInput);
  updateFeeUi();
  // when switching to Outsider, drop any college-field errors
  if (getSelectedCategory() !== CATEGORY_COLLEGE) {
    ['collegeName', 'course', 'semester', 'studentId'].forEach(function (id) {
      var el = $(id);
      if (el) { clearError(el); }
    });
  }
});

/* initialise the fee UI (default state shows the placeholder hint) */
updateFeeUi();

/* clear field errors while the user types again */
form.addEventListener('input', function (e) {
  if (e.target.classList && e.target.classList.contains('invalid')) {
    clearError(e.target);
  }
});
/* ------------------------------------------------------------
   6. SUBMIT — collect all data, save it, go to success page
   ------------------------------------------------------------ */
async function submitRegistration() {
  var players = [1, 2, 3, 4].map(function (n) {
    return {
      name: $('p' + n + 'name').value.trim(),
      uid: $('p' + n + 'uid').value.trim()
    };
  });

  // Fee comes automatically from selected category
  var category = getSelectedCategory();
  var fee = getRegistrationFee(category);  // per-player rate (₹49 college / ₹79 outsider)
  // Total = per-player rate × NUM_PAID_PLAYERS (4 main players, substitute not charged)
  var totalFee = fee * NUM_PAID_PLAYERS;
  var isCollege = category === CATEGORY_COLLEGE;

  // Generate registration ID
  var registrationId = nextRegistrationId();

  // Build a localStorage-compatible registration object.
  // camelCase keys + nested objects — matches what admin.js and success.js expect.
  var registration = {
    id: registrationId,
    teamName: $('teamName').value.trim(),
    captainName: $('captainName').value.trim(),
    captainWhatsApp: $('captainWhatsApp').value.trim(),
    teamUID: $('teamUID').value.trim(),
    participantCategory: category,
    registrationFee: totalFee,
    feePerPlayer: fee,
    players: players,
    substitute: $('subName').value.trim()
      ? { name: $('subName').value.trim(), uid: $('subUid').value.trim() }
      : null,
    college: isCollege
      ? {
          name: $('collegeName').value.trim(),
          course: $('course').value.trim(),
          semester: $('semester').value,
          studentId: $('studentId').value.trim()
        }
      : null,
    utr: $('utr').value.trim(),
    verification: {
      instagram: $('instagram').value.trim(),
      whatsapp: $('whatsapp').value.trim(),
      utr: $('utr').value.trim(),
      paymentScreenshot: uploaded.paymentScreenshot
    },
    teamLogo: uploaded.teamLogo,
    paymentStatus: 'Pending Verification',
    status: 'Pending',
    date: new Date().toISOString()
  };

  // 3. Build the row that matches the actual Supabase `registrations` columns.
  //    The database columns are:
  //    id, registration_id, team_name, captain_name, captain_whatsapp,
  //    team_uid, team_logo, players, substitute, participant_category,
  //    price_per_player, total_registration_fee, college_name, course,
  //    semester, student_id, instagram, whatsapp, payment_screenshot,
  //    utr, payment_status, status, created_at
  var supabaseRow = {
    registration_id: registrationId,
    team_name: registration.teamName,
    captain_name: registration.captainName,
    captain_whatsapp: registration.captainWhatsApp,
    team_uid: registration.teamUID,
    team_logo: registration.teamLogo,
    players: players,
    substitute: registration.substitute,
    participant_category: registration.participantCategory,
    price_per_player: fee,
    total_registration_fee: totalFee,
    college_name: isCollege ? registration.college.name : '',
    course: isCollege ? registration.college.course : '',
    semester: isCollege ? registration.college.semester : '',
    student_id: isCollege ? registration.college.studentId : '',
    instagram: registration.verification.instagram,
    whatsapp: registration.verification.whatsapp,
    payment_screenshot: registration.verification.paymentScreenshot,
    utr: registration.verification.utr,
    payment_status: registration.paymentStatus,
    status: registration.status,
    created_at: new Date().toISOString()
  };

  // 4. Insert into Supabase — only redirect AFTER a confirmed success.
  //    Supabase JS v2 returns { error } — it does NOT throw for API
  //    errors (RLS, unknown columns, etc.), so we must check .error ourselves.
  //    We intentionally omit .select() so anonymous users do not need SELECT permission.
  var supabaseResponse;
  try {
    supabaseResponse = await supabaseClient
      .from('registrations')
      .insert([supabaseRow]);
  } catch (err) {
    // Network error, timeout, or supabaseClient not initialised
    console.error('Supabase insert threw an exception:', err);
    showFormError('Could not save your registration to the database. ' +
                  'Please try again. (Check the console for the exact error.)');
    return;
  }

  if (supabaseResponse.error) {
    // API error returned by Supabase (e.g. RLS policy violation, column mismatch)
    console.error('Supabase insert failed:', supabaseResponse.error);
    showFormError('Could not save your registration to the database. ' +
                  'Please try again. (Check the console for the exact error.)');
    return;
  }

  // Save to localStorage (secondary cache — admin panel + success page read from here)
  var allRegs = getRegistrations();
  allRegs.push(registration);
  saveRegistrations(allRegs);

  // Remember the last registration ID (used by success.js)
  setLastId(registrationId);

  // 5. Go to success page — only AFTER Supabase confirms the insert
  location.href =
    'success.html?id=' + encodeURIComponent(registrationId);
}
