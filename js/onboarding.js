/**
 * First-run welcome. Completion is stored in a new localStorage key
 * and never rewrites tenant, settings, or backup keys.
 */
(function () {
    var DONE_KEY = 'tenantManagementOnboardingDone';
    var CARD_KEY = 'tenantManagementGettingStartedDismissed';
    var TONES = ['violet', 'blue', 'teal', 'green', 'violet'];

    var root = document.getElementById('onboarding');
    if (!root || window.__tenantOnboardingBound) return;
    window.__tenantOnboardingBound = true;

    var dialog = root.querySelector('[role="dialog"]');
    var track = document.getElementById('onboardingTrack');
    var viewport = document.getElementById('onboardingViewport');
    var dots = document.getElementById('onboardingDots');
    var nav = document.getElementById('onboardingNav');
    var startPanel = document.getElementById('onboardingStart');
    var live = document.getElementById('onboardingLive');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.onboarding-slide'));
    var index = 0;
    var lastFocus = null;
    var gesture = null;

    function storageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (err) {
            return null;
        }
    }

    function storageSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (err) {
            /* Private mode can block storage. The tour still closes. */
        }
    }

    function isDone() {
        return storageGet(DONE_KEY) === '1';
    }

    function markDone() {
        storageSet(DONE_KEY, '1');
    }

    function hasExistingAppData() {
        try {
            var raw = localStorage.getItem('tenantManagementData');
            if (!raw) return false;
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return false;
            var keys = ['tenants', 'payments', 'expenses', 'notices'];
            for (var i = 0; i < keys.length; i++) {
                if (Array.isArray(parsed[keys[i]]) && parsed[keys[i]].length > 0) return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    }

    function buildingIsEmpty() {
        if (typeof appState === 'undefined' || !appState) return true;
        return (!appState.tenants || appState.tenants.length === 0) &&
            (!appState.payments || appState.payments.length === 0) &&
            (!appState.expenses || appState.expenses.length === 0) &&
            (!appState.notices || appState.notices.length === 0);
    }

    function updateGettingStartedCard() {
        var card = document.getElementById('gettingStartedCard');
        if (!card) return;
        var show = buildingIsEmpty() && storageGet(CARD_KEY) !== '1';
        card.hidden = !show;
    }

    function headingText(slideIndex) {
        var heading = slides[slideIndex] && slides[slideIndex].querySelector('h2');
        return heading ? heading.textContent : '';
    }

    function isVisible(el) {
        if (!el || el.disabled || el.hidden) return false;
        if (el.closest('[hidden]')) return false;
        var style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function focusable() {
        return Array.prototype.slice.call(root.querySelectorAll('button, [href], input, select, textarea')).filter(isVisible);
    }

    function setBackgroundInert(on) {
        var children = document.body.children;
        for (var i = 0; i < children.length; i++) {
            if (children[i] === root) continue;
            if (on) children[i].setAttribute('inert', '');
            else children[i].removeAttribute('inert');
        }
    }

    function render() {
        var tone = TONES[index] || 'violet';
        TONES.forEach(function (name) {
            root.classList.remove('tone-' + name);
        });
        root.classList.add('tone-' + tone);
        if (track) track.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
        if (nav) {
            nav.classList.toggle('is-first', index === 0);
            nav.classList.toggle('is-last', index === slides.length - 1);
        }
        if (startPanel) startPanel.hidden = index !== slides.length - 1;
        slides.forEach(function (slide, slideIndex) {
            var heading = slide.querySelector('h2');
            if (heading && !heading.id) heading.id = 'onboardingHeading' + slideIndex;
            slide.setAttribute('aria-hidden', slideIndex === index ? 'false' : 'true');
        });
        var currentHeading = slides[index] && slides[index].querySelector('h2');
        if (dialog && currentHeading) dialog.setAttribute('aria-labelledby', currentHeading.id);
        if (dots) {
            Array.prototype.forEach.call(dots.querySelectorAll('.onboarding-dot'), function (dot, dotIndex) {
                if (dotIndex === index) dot.setAttribute('aria-current', 'true');
                else dot.removeAttribute('aria-current');
            });
        }
        if (live) live.textContent = headingText(index);
    }

    function go(nextIndex) {
        if (nextIndex < 0 || nextIndex >= slides.length) return;
        index = nextIndex;
        render();
    }

    function isOpen() {
        return !root.hidden;
    }

    function openOnboardingGuide() {
        index = 0;
        lastFocus = document.activeElement;
        root.hidden = false;
        root.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('onboarding-open');
        if (typeof hideLoading === 'function') hideLoading();
        setBackgroundInert(true);
        render();
        var skip = document.getElementById('onboardingSkip');
        if (skip) skip.focus();
    }

    function closeOnboarding() {
        root.hidden = true;
        root.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('onboarding-open');
        setBackgroundInert(false);
        if (typeof hideLoading === 'function') hideLoading();
        updateGettingStartedCard();
        if (lastFocus && typeof lastFocus.focus === 'function') {
            lastFocus.focus();
        }
    }

    function finish() {
        markDone();
        closeOnboarding();
    }

    function hasStoredRecords() {
        if (typeof appState === 'undefined' || !appState) return false;
        return (appState.tenants && appState.tenants.length > 0) ||
            (appState.payments && appState.payments.length > 0) ||
            (appState.expenses && appState.expenses.length > 0) ||
            (appState.notices && appState.notices.length > 0);
    }

    function startWithSample() {
        if (typeof loadSampleData !== 'function') return;
        var hadRealData = typeof appState !== 'undefined' && appState.tenants && appState.tenants.length > 0 && !appState.isSampleData;
        loadSampleData();
        if (hadRealData && !appState.isSampleData) return;
        markDone();
        closeOnboarding();
        if (typeof showTab === 'function') showTab('dashboard');
    }

    function startEmpty() {
        if (hasStoredRecords()) {
            if (!window.confirm('להתחיל מאפס ולמחוק את הנתונים ששמורים במכשיר?')) return;
            appState.tenants = [];
            appState.payments = [];
            appState.expenses = [];
            appState.activities = [];
            appState.notices = [];
            appState.isSampleData = false;
            if (appState.selectedTenants && appState.selectedTenants.clear) appState.selectedTenants.clear();
            if (appState.selectedPayments && appState.selectedPayments.clear) appState.selectedPayments.clear();
            if (typeof saveDataToStorage === 'function') saveDataToStorage();
            if (typeof refreshAfterLocalDataChange === 'function') refreshAfterLocalDataChange();
        }
        markDone();
        closeOnboarding();
        if (typeof showTab === 'function') showTab('dashboard');
    }

    function goStep(step) {
        if (step === 'tenant') {
            if (typeof showTab === 'function') showTab('tenants');
            if (typeof addTenant === 'function') addTenant();
            return;
        }
        if (step === 'payment') {
            if (typeof showTab === 'function') showTab('payments');
            return;
        }
        if (step === 'expense') {
            if (typeof showTab === 'function') showTab('expenses');
            if (typeof addExpense === 'function') addExpense();
        }
    }

    function bind(id, handler) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', handler);
    }

    function maybeShowOnboarding() {
        if (isDone() || hasExistingAppData()) return;
        openOnboardingGuide();
    }

    if (dots) {
        slides.forEach(function (slide, slideIndex) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'onboarding-dot';
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-label', 'שקופית ' + (slideIndex + 1) + ' מתוך ' + slides.length + ': ' + headingText(slideIndex));
            var mark = document.createElement('i');
            mark.setAttribute('aria-hidden', 'true');
            button.appendChild(mark);
            button.addEventListener('click', function () {
                go(slideIndex);
            });
            dots.appendChild(button);
        });
    }

    bind('onboardingSkip', finish);
    bind('onboardingNext', function () { go(index + 1); });
    bind('onboardingBack', function () { go(index - 1); });
    bind('onboardingSample', startWithSample);
    bind('onboardingEmpty', startEmpty);
    bind('openOnboardingFromSettings', openOnboardingGuide);
    bind('openOnboardingSidebar', openOnboardingGuide);
    bind('openOnboardingFromMenu', function () {
        if (typeof closeMoreMenu === 'function') closeMoreMenu();
        openOnboardingGuide();
    });
    bind('dismissGettingStarted', function () {
        storageSet(CARD_KEY, '1');
        updateGettingStartedCard();
    });

    var gettingStarted = document.getElementById('gettingStartedCard');
    if (gettingStarted) {
        gettingStarted.addEventListener('click', function (event) {
            var step = event.target.closest('[data-start-step]');
            if (!step) return;
            goStep(step.getAttribute('data-start-step'));
        });
    }

    if (viewport) {
        viewport.addEventListener('pointerdown', function (event) {
            if (event.target.closest('button, a, input, textarea, select')) return;
            gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
        });
        viewport.addEventListener('pointerup', function (event) {
            if (!gesture || gesture.id !== event.pointerId) return;
            var dx = event.clientX - gesture.x;
            var dy = event.clientY - gesture.y;
            gesture = null;
            if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
            if (dx < 0) go(index + 1);
            else go(index - 1);
        });
        viewport.addEventListener('pointercancel', function () {
            gesture = null;
        });
    }

    document.addEventListener('keydown', function (event) {
        if (!isOpen()) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            finish();
            return;
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            go(index + 1);
            return;
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            go(index - 1);
            return;
        }
        if (event.key !== 'Tab') return;
        var items = focusable();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    if (typeof refreshLocalDataNotices === 'function') {
        var previousRefresh = refreshLocalDataNotices;
        refreshLocalDataNotices = function () {
            previousRefresh();
            updateGettingStartedCard();
        };
    }

    window.openOnboardingGuide = openOnboardingGuide;
    window.updateGettingStartedCard = updateGettingStartedCard;

    function boot() {
        updateGettingStartedCard();
        maybeShowOnboarding();
    }

    if (document.readyState === 'complete') {
        boot();
    } else {
        document.addEventListener('DOMContentLoaded', boot);
    }
})();
