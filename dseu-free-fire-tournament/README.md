# DSEU Free Fire Esports Tournament — Website (Version 1)

A complete, modern and fully responsive registration website for the **DSEU Free Fire
Esports Tournament**, built with **plain HTML, CSS and vanilla JavaScript** — no React,
no frameworks, no databases. Everything runs directly in your browser.

---

## 📁 Files & Folders

```
dseu-free-fire-tournament/
│
├── index.html        ← HOME PAGE (hero, info, about, highlights, process, rules, FAQ, CTA, footer)
├── register.html     ← REGISTRATION PAGE (4-step form)
├── success.html      ← SUCCESS PAGE (shown after registration)
├── admin-login.html   ← ADMIN LOGIN PAGE (username + password)
├── admin.html        ← ADMIN PAGE (dashboard, search, status, delete, CSV export)
│
├── css/
│   ├── style.css     ← shared design system (colors, buttons, navbar, footer) — used on every page
│   ├── home.css      ← home page styles only
│   ├── register.css  ← registration form styles only
│   ├── success.css   ← success page styles only
│   ├── admin-login.css ← admin login page styles only
│   └── admin.css     ← admin page styles only
│
├── js/
│   ├── main.js       ← shared helpers (localStorage, validation, navbar, footer year, admin login guard)
│   ├── home.js       ← FAQ accordion
│   ├── register.js   ← multi-step form logic + validation + saving
│   ├── admin-login.js  ← admin login behaviour (username + password check)
│   ├── success.js    ← shows the last registration on the success page
│   └── admin.js      ← dashboard rendering, search, status, delete, CSV
│
└── README.md         ← this file
```

---

## 🚀 How to Open the Website (no server needed)

1. Open the folder `dseu-free-fire-tournament`.
2. Double-click **`index.html`** — it opens in your browser.
3. Use the **Register** button (or `register.html`) to test the full flow.
4. To open the admin dashboard, go to **`admin.html`** — it will send you to
   **`admin-login.html`** first. Log in with the admin credentials below.

💡 Every page is linked from the navigation bar, so you rarely need to open files manually.

---

## 🧪 How to Test the Full Flow

1. Go to the **Home page** → click **Register Now**.
2. Fill **Step 1**: team name, captain name, WhatsApp number, team UID, (optional) logo.
3. Fill **Step 2**: 4 players (+ optional substitute).
4. Fill **Step 3**: choose **Participant Category** —
   - **DSEU / College Student (₹49 / team)** → college details (name, course, semester, student ID) appear and become **required**.
   - **Outsider (₹79 / team)** → college details stay **hidden**.
   The fee is set automatically and cannot be edited.
5. Fill **Step 4 — Secure Your Slot**: scan the UPI QR, pay the displayed fee, enter the
   **UTR / Transaction ID**, upload the **payment screenshot**, and tick the payment confirmation box.
6. Fill **Step 5**: Instagram username, WhatsApp number for updates.
7. Click **Submit Registration** → you are sent to the **success page** with a
   **Registration ID** like `DSEU-FE-001` and the payment status **Pending Verification**.
8. Open **`admin.html`** → the team is listed with **Payment Pending**.
   - Filters: All / DSEU / College Student / Outsider / Payment Pending / Payment Verified / Payment Rejected
   - **View** button → full details (including UTR + payment screenshot)
   - **Verify payments manually** in the modal: Pending Verification / Payment Verified / Payment Rejected
   - **Registration status**: Pending / Approve / Reject
   - **Delete** button → remove a registration
   - **Export CSV** → download all registrations as a spreadsheet file

---

## 🔐 Admin Login (username + password)

The admin dashboard is protected by a login page (`admin-login.html`).

**Login details (for local testing):**

| Field | Value |
|-------|-------|
| Username | `sam007` |
| Password | `817815356AIM` |

- Opening `admin.html` (or clicking **Admin**) while logged out sends you to
  `admin-login.html`.
- Wrong credentials → the login page shows *"Invalid username or password."*
  (one generic message — it never reveals which field was wrong).
- Correct credentials → you land on the admin dashboard.
- **Logout:** the admin page has a **Logout** button in the top bar; it clears
  the session and returns to the login page.

**Change the credentials:** open `js/main.js` and look for the two lines near
the top of the "ADMIN LOGIN GUARD" section:

```js
var ADMIN_USERNAME = 'sam007';
var ADMIN_PASSWORD = '817815356AIM';
```

⚠️ **Important (Version 1):** this is a *client-side* check. It keeps casual
visitors out, but someone with browser DevTools could still view or edit the
code/data. Real, secure login needs a server — planned for Version 2.

---

## 💾 Where Is the Data Stored?

All data is stored **locally in your browser** using **localStorage** (no server,
no database — by design for Version 1).

| What | localStorage key |
|------|------------------|
| All registrations | `dseu_fe_registrations` |
| ID counter | `dseu_fe_counter` |
| Last registration ID | `dseu_fe_last_id` |
| Admin "logged in" flag | `dseu_fe_admin_authed` |

Each registration record stores: team data, players, `participantCategory`
("DSEU / College Student" or "Outsider"), `registrationFee` (49 or 79), `utr`,
`paymentScreenshot` (base64), `paymentStatus` ("Pending Verification" by default)
and `status` (registration status).

**To reset all data:** open DevTools (F12) → `Application` → `Local Storage`,
or simply clear your browser data for this site.

**Important:** data is tied to the browser + computer you used. If you test on a
different browser/computer, the data won't appear there.

---

## ✏️ How to Customise (easy edits for beginners)

### Change the colors
Open `css/style.css` → look at the top under `:root`. That's the whole palette.
For example, change `--primary: #ff6b00;` to any color to re-theme the site.

### Change tournament text (prize, dates, fee)
Open `index.html` and search for words like `₹3,000`, `32 Teams`, `10 Aug`.
The sections are clearly commented with names like `<!-- 2. TOURNAMENT INFO -->`.

### Change contact / social links
Open `index.html`, Ctrl+F for:
- `https://instagram.com/your_page`  ← replace with your real Instagram
- `https://wa.me/919876543210`       ← replace with your real WhatsApp number
(These are also in the footer on the home page.)

### Change the entry fee / upload limits
- Fees are ₹49 (DSEU / college students) and ₹79 (outsiders). They live in
  `js/register.js` (`CATEGORY_COLLEGE` / `CATEGORY_OUTSIDER` → `getRegistrationFee`).
  The dropdown labels in `register.html` (Step 3) must match.
- File limits: `js/register.js` → the `maxMb` argument in `setupFileInput(...)`,
  and the `accept` attribute on the `<input type="file">` fields in `register.html`.

### Add your UPI QR code (payment image)
1. Create / open the `img/` folder in the project root.
2. Save your QR image as **`img/qr-upi.png`** (PNG works best for sharp QR edges).
3. Open `register.html` and check the `<img>` with `id="qrImage"` — its `src` is
   already `img/qr-upi.png`. No code changes needed.
4. If the image is missing, the form shows a friendly "QR image not found" notice
   instead of a broken image icon.

---

## ✅ What Is Validated in Version 1

- Required fields can't be empty (each step must be completed).
- **Participant Category** must be selected; college details are required only
  for DSEU / college students (hidden for outsiders).
- WhatsApp/mobile numbers must be 10–15 digits.
- Free Fire UIDs must be digits only (6–16 characters).
- **UTR / Transaction ID** is required (letters + numbers, 6–40 characters) and
  cannot be skipped.
- Payment **screenshot** is required (PNG/JPG/WEBP, max 2 MB) and shows a preview.
- The payment **confirmation checkbox** must be ticked before submitting.
- Uploads must be PNG/JPG/WEBP/GIF and below the size limit − the form refuses
  invalid files.
- Substitute must be provided *either* completely *or* not at all.
- The registration fee is always derived from the selected category — users can
  never change or type the price.
- Registration IDs are generated automatically and never repeat.

---

## ⚠️ Things to Know in Version 1

- **No real database / payments.** This version is for testing the whole flow
  on your computer.
- Uploaded images are stored as base64 inside localStorage, which has a ~5 MB
  limit — keep images under 1 MB (logos) / 2 MB (screenshots) as the form requires.
- The success page saves the **last registration** made in that browser.

## 🔜 Ideas for Version 2

- Backend server (Node/PHP/Python) with a real database (SQLite/MySQL).
- Real payment gateway (UPI / Razorpay / PhonePe).
- Email/WhatsApp auto-confirmation messages.
- PDF certificate / match-slot generation.

---

© DSEU Esports Tournament · Built with plain HTML, CSS & JavaScript.