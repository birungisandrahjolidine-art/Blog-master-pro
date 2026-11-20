/* Shared light/dark theme controller used by every page. */
(function () {
    'use strict';

    var STORAGE_KEY = 'telesora-theme';
    var root = document.documentElement;

    function readStoredTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
        } catch (error) {
            return 'dark';
        }
    }

    function syncToggles(isLight) {
        var label = isLight ? 'Switch to dark theme' : 'Switch to light theme';
        var toggles = document.querySelectorAll('.theme-toggle');

        Array.prototype.forEach.call(toggles, function (toggle) {
            toggle.setAttribute('aria-pressed', String(isLight));
            toggle.setAttribute('aria-label', label);
            toggle.setAttribute('title', label);
        });
    }

    function applyTheme(theme) {
        var isLight = theme === 'light';

        if (isLight) {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }

        syncToggles(isLight);
        root.dispatchEvent(new CustomEvent('themechange', { detail: { theme: isLight ? 'light' : 'dark' } }));
    }

    applyTheme(readStoredTheme());

    document.addEventListener('click', function (event) {
        var toggle = event.target.closest ? event.target.closest('.theme-toggle') : null;
        if (!toggle) return;

        var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);

        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch (error) {
            /* storage unavailable - the theme still applies for this view */
        }
    });

    window.TelesoraTheme = { apply: applyTheme, current: readStoredTheme };
})();
