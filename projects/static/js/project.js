document.addEventListener("DOMContentLoaded", function () {
  var root = document.querySelector("[data-project-index]");
  if (!root) return;
  var buttons = Array.prototype.slice.call(root.querySelectorAll("[data-filter]"));
  var cards = Array.prototype.slice.call(root.querySelectorAll("[data-origin]"));
  function apply(filter) {
    cards.forEach(function (card) {
      var show = filter === "all" || card.getAttribute("data-origin") === filter || card.getAttribute("data-domain") === filter;
      card.hidden = !show;
    });
    buttons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-filter") === filter));
    });
  }
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      apply(btn.getAttribute("data-filter"));
    });
  });
});
