/* ============================================================
   DSEU FREE FIRE ESPORTS TOURNAMENT — HOME PAGE SCRIPTS
   File : js/home.js  (only loaded on index.html)
   Role : FAQ accordion behaviour.
   ============================================================ */

document.querySelectorAll('.faq-question').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var item = btn.parentElement;      // the .faq-item container
    var answer = item.querySelector('.faq-answer');
    var wasOpen = item.classList.contains('open');

    // close every other open question (accordion behaviour)
    document.querySelectorAll('.faq-item.open').forEach(function (other) {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.faq-answer').style.maxHeight = null;
      }
    });

    // toggle the clicked one
    item.classList.toggle('open');
    answer.style.maxHeight = wasOpen ? null : answer.scrollHeight + 'px';
  });
});