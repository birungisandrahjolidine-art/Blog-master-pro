/* Admin review bell: badge, dropdown panel, polling, and new-story alerts. */
(function () {
    'use strict';

    var bell = document.getElementById('nav-notify');
    var button = document.getElementById('nav-notify-btn');
    var panel = document.getElementById('nav-notify-panel');
    var badge = document.getElementById('nav-notify-badge');
    var meta = document.getElementById('nav-notify-meta');
    var list = document.getElementById('nav-notify-list');
    var empty = document.getElementById('nav-notify-empty');

    if (!bell || !button || !panel || !list) return;

    var ENDPOINT = '/notifications/pending';
    var POLL_INTERVAL = 60000;
    var SEEN_KEY = 'telesora-review-seen';
    var lastCount = readSeen();
    var isOpen = false;
    var pollTimer = null;

    function readSeen() {
        try {
            var raw = sessionStorage.getItem(SEEN_KEY);
            if (raw === null) return null;
            var value = parseInt(raw, 10);
            return isNaN(value) ? null : value;
        } catch (error) {
            return null;
        }
    }

    function writeSeen(count) {
        try {
            sessionStorage.setItem(SEEN_KEY, String(count));
        } catch (error) {
            /* storage unavailable - alerts simply repeat next reload */
        }
    }

    function relativeTime(iso) {
        if (!iso) return '';

        var then = Date.parse(iso);
        if (isNaN(then)) return '';

        var minutes = Math.round((Date.now() - then) / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return minutes + ' min ago';

        var hours = Math.round(minutes / 60);
        if (hours < 24) return hours === 1 ? '1 hour ago' : hours + ' hours ago';

        var days = Math.round(hours / 24);
        if (days < 7) return days === 1 ? 'Yesterday' : days + ' days ago';

        return new Date(then).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function buildItem(item) {
        var li = document.createElement('li');
        li.className = 'nav-notify-item';

        var link = document.createElement('a');
        link.className = 'nav-notify-link';
        link.href = '/dashboard#pending-heading';

        var avatar = document.createElement('span');
        avatar.className = 'nav-notify-avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = (item.author || 'A').charAt(0).toUpperCase();

        var copy = document.createElement('span');
        copy.className = 'nav-notify-copy';

        var title = document.createElement('strong');
        title.className = 'nav-notify-story';
        title.textContent = item.title;

        var sub = document.createElement('span');
        sub.className = 'nav-notify-sub';

        var who = document.createElement('span');
        who.textContent = item.author || 'Anonymous';
        sub.appendChild(who);

        var when = document.createElement('span');
        when.className = 'nav-notify-time';
        when.textContent = relativeTime(item.createdAt);
        if (when.textContent) sub.appendChild(when);

        if (item.media && item.media !== 'none') {
            var chip = document.createElement('span');
            chip.className = 'nav-notify-chip';
            chip.textContent = item.media === 'video' ? 'Video' : 'Image';
            sub.appendChild(chip);
        }

        copy.appendChild(title);
        copy.appendChild(sub);
        link.appendChild(avatar);
        link.appendChild(copy);
        li.appendChild(link);

        return li;
    }

    function render(data) {
        var count = typeof data.count === 'number' ? data.count : 0;
        var items = Array.isArray(data.items) ? data.items : [];

        if (badge) {
            badge.textContent = count > 9 ? '9+' : String(count);
            badge.hidden = count === 0;
        }

        if (meta) {
            meta.textContent = count === 0 ? 'All clear' : count + (count === 1 ? ' story waiting' : ' stories waiting');
        }

        list.textContent = '';
        items.forEach(function (item) {
            list.appendChild(buildItem(item));
        });

        if (empty) empty.hidden = items.length > 0;

        button.setAttribute('aria-label', count === 0 ? 'Review notifications - nothing waiting' : 'Review notifications - ' + count + ' waiting');
        bell.classList.toggle('has-items', count > 0);

        if (lastCount !== null && count > lastCount && items.length) {
            announce(items[0], count);
        }

        lastCount = count;
        writeSeen(count);
    }

    function announce(item, count) {
        var toast = document.createElement('div');
        toast.className = 'nav-toast';
        toast.setAttribute('role', 'status');

        var heading = document.createElement('strong');
        heading.textContent = count === 1 ? 'New story for review' : count + ' stories for review';

        var body = document.createElement('span');
        body.textContent = item.title + ' by ' + item.author;

        var link = document.createElement('a');
        link.href = '/dashboard#pending-heading';
        link.textContent = 'Review now';

        toast.appendChild(heading);
        toast.appendChild(body);
        toast.appendChild(link);
        document.body.appendChild(toast);

        requestAnimationFrame(function () {
            toast.classList.add('is-visible');
        });

        setTimeout(function () {
            toast.classList.remove('is-visible');
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 320);
        }, 9000);
    }

    function load() {
        return fetch(ENDPOINT, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        })
            .then(function (response) {
                if (!response.ok) throw new Error('Request failed with ' + response.status);
                return response.json();
            })
            .then(render)
            .catch(function () {
                /* the bell keeps its previous state when the request fails */
            });
    }

    function setOpen(next) {
        isOpen = next;
        panel.hidden = !next;
        bell.classList.toggle('is-open', next);
        button.setAttribute('aria-expanded', String(next));

        if (next) {
            var firstFocusable = panel.querySelector('a, button');
            if (firstFocusable) firstFocusable.focus();
        }
    }

    button.addEventListener('click', function (event) {
        event.stopPropagation();
        setOpen(!isOpen);
        if (isOpen) load();
    });

    panel.addEventListener('click', function (event) {
        event.stopPropagation();
    });

    document.addEventListener('click', function () {
        if (isOpen) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape' || !isOpen) return;
        setOpen(false);
        button.focus();
    });

    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) load();
    });

    load();
    pollTimer = window.setInterval(load, POLL_INTERVAL);
    window.addEventListener('beforeunload', function () {
        if (pollTimer) window.clearInterval(pollTimer);
    });
})();
