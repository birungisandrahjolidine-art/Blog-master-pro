(function () {
    'use strict';

    /* ------------------------------------------------------ Status dropdowns */

    function closeDropdowns(except) {
        var open = document.querySelectorAll('.status-dropdown.is-open');
        Array.prototype.forEach.call(open, function (dropdown) {
            if (dropdown === except) return;
            dropdown.classList.remove('is-open');
            var toggle = dropdown.querySelector('.status-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
    }

    Array.prototype.forEach.call(document.querySelectorAll('.status-dropdown'), function (dropdown) {
        var toggle = dropdown.querySelector('.status-toggle');
        var menu = dropdown.querySelector('.status-menu');
        if (!toggle || !menu) return;

        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            var isOpen = dropdown.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            closeDropdowns(dropdown);
        });

        menu.addEventListener('click', function (event) {
            event.stopPropagation();
        });

        dropdown.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            dropdown.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.focus();
        });
    });

    document.addEventListener('click', function () {
        closeDropdowns();
    });

    /* ------------------------------------------- Search, filter, and sorting */

    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-story-card]'));
    if (!cards.length) return;

    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-story-section]'));
    var searchInput = document.getElementById('story-search');
    var searchClear = document.getElementById('search-clear');
    var sortSelect = document.getElementById('story-sort');
    var authorSelect = document.getElementById('story-author');
    var mediaSelect = document.getElementById('story-media');
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll('.filter-tab'));
    var resultsStatus = document.getElementById('results-status');
    var noResults = document.getElementById('no-results');
    var clearFilters = document.getElementById('clear-filters');

    var state = { query: '', status: 'all', sort: 'newest', author: 'all', media: 'all' };

    cards.forEach(function (card) {
        if (card.hasAttribute('data-search-index')) return;
        var blob = card.getAttribute('data-search');
        if (!blob) blob = card.textContent || '';
        card.setAttribute('data-search-index', blob.toLowerCase());
    });

    function matchesQuery(card) {
        if (!state.query) return true;
        return (card.getAttribute('data-search-index') || '').indexOf(state.query) !== -1;
    }

    function matchesAuthor(card) {
        if (state.author === 'all') return true;
        return (card.getAttribute('data-author') || '') === state.author;
    }

    function matchesMedia(card) {
        if (state.media === 'all') return true;
        return (card.getAttribute('data-media') || 'none') === state.media;
    }

    function passesRefinement(card) {
        return matchesQuery(card) && matchesAuthor(card) && matchesMedia(card);
    }

    function cardTime(card) {
        var raw = card.getAttribute('data-created');
        var value = raw ? Date.parse(raw) : NaN;
        return isNaN(value) ? 0 : value;
    }

    function sortCards() {
        sections.forEach(function (section) {
            var container = section.querySelector('.story-grid, .reviewed-grid');
            if (!container) return;

            var items = Array.prototype.slice.call(container.querySelectorAll('[data-story-card]'));
            if (items.length < 2) return;

            items.sort(function (a, b) {
                if (state.sort === 'title') {
                    return (a.getAttribute('data-title') || '').localeCompare(b.getAttribute('data-title') || '', undefined, { sensitivity: 'base' });
                }
                if (state.sort === 'oldest') {
                    return cardTime(a) - cardTime(b);
                }
                return cardTime(b) - cardTime(a);
            });

            items.forEach(function (card) {
                container.appendChild(card);
            });
        });
    }

    function render() {
        var perStatus = { all: 0, pending: 0, approved: 0, rejected: 0 };
        var visibleTotal = 0;

        cards.forEach(function (card) {
            var refined = passesRefinement(card);
            var status = card.getAttribute('data-status');

            if (refined) {
                perStatus.all += 1;
                if (perStatus[status] !== undefined) perStatus[status] += 1;
            }

            var show = refined && (state.status === 'all' || status === state.status);
            card.hidden = !show;
            if (show) visibleTotal += 1;
        });

        filterButtons.forEach(function (button) {
            var key = button.getAttribute('data-filter');
            var countEl = button.querySelector('[data-filter-count]');
            if (countEl) countEl.textContent = String(perStatus[key] || 0);

            var isActive = key === state.status;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        var isFiltering = Boolean(state.query) || state.status !== 'all' || state.author !== 'all' || state.media !== 'all';

        sections.forEach(function (section) {
            var visible = section.querySelectorAll('[data-story-card]:not([hidden])').length;
            var countEl = section.querySelector('[data-section-count]');
            if (countEl) countEl.textContent = String(visible);
            section.hidden = isFiltering && visible === 0;
        });

        if (noResults) noResults.hidden = !(isFiltering && visibleTotal === 0);

        if (searchClear) searchClear.hidden = !state.query;

        if (resultsStatus) {
            resultsStatus.textContent = isFiltering
                ? 'Showing ' + visibleTotal + ' of ' + cards.length + ' stories.'
                : '';
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            state.query = searchInput.value.trim().toLowerCase();
            render();
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', function () {
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
            }
            state.query = '';
            render();
        });
    }

    filterButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            state.status = button.getAttribute('data-filter') || 'all';
            render();
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            state.sort = sortSelect.value;
            sortCards();
        });
    }

    if (authorSelect) {
        authorSelect.addEventListener('change', function () {
            state.author = authorSelect.value || 'all';
            render();
        });
    }

    if (mediaSelect) {
        mediaSelect.addEventListener('change', function () {
            state.media = mediaSelect.value || 'all';
            render();
        });
    }

    if (clearFilters) {
        clearFilters.addEventListener('click', function () {
            state.query = '';
            state.status = 'all';
            state.author = 'all';
            state.media = 'all';
            if (searchInput) searchInput.value = '';
            if (authorSelect) authorSelect.value = 'all';
            if (mediaSelect) mediaSelect.value = 'all';
            render();
            if (searchInput) searchInput.focus();
        });
    }

    sortCards();
    render();
})();
