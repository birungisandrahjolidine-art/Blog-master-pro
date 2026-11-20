// Reading progress line for the single story page.
(function () {
    'use strict';

    var bar = document.querySelector('.story-progress-bar');
    var article = document.querySelector('.story-article');
    if (!bar || !article) return;

    var ticking = false;

    function update() {
        ticking = false;

        var top = article.getBoundingClientRect().top + window.scrollY;
        var start = top - window.innerHeight * 0.25;
        var end = Math.max(top + article.offsetHeight - window.innerHeight * 0.6, start + 200);
        var ratio = (window.scrollY - start) / (end - start);

        ratio = Math.min(1, Math.max(0, ratio));
        bar.style.width = (ratio * 100).toFixed(2) + '%';
    }

    function request() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
})();
