/* Client-side feed search for the index page.
 * Instantly shows/hides cards whose title matches what you type.
 * The <form> submits to do a full server-side search across all feeds when
 * the user presses Enter or clicks the search button.
 */
(function () {
  'use strict';
  var inp = document.getElementById('feed-search');
  if (!inp) return;

  function filterCards(q) {
    q = q.toLowerCase().trim();
    document.querySelectorAll('.grid section.card').forEach(function (card) {
      var h2 = card.querySelector('h2');
      var title = h2 ? h2.textContent.toLowerCase() : '';
      card.style.display = (!q || title.indexOf(q) !== -1) ? '' : 'none';
    });
  }

  inp.addEventListener('input', function () { filterCards(inp.value); });

  // Apply on page load when the server echoed back a ?q= value.
  if (inp.value) filterCards(inp.value);
}());
