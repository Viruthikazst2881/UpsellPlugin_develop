(function ($) {
    'use strict';

    if (typeof upsellFrontend === 'undefined') return;

    var page   = upsellFrontend.page;

    // =========================================================
    // CLOSE BUTTON — cart banner
    // =========================================================

    // =========================================================
    // THEME INHERITANCE
    // =========================================================

    function syncThemeStyles() {
        var reference = document.querySelector(
            '.single_add_to_cart_button,' +
            '.woocommerce a.button,' +
            '.woocommerce button.button,' +
            '.button.alt,' +
            '.button'
        );
        var root = document.documentElement;
        var bodyStyles = window.getComputedStyle(document.body);
        var referenceStyles = reference ? window.getComputedStyle(reference) : bodyStyles;
        var linkReference = document.querySelector(
            '.woocommerce-loop-product__link,' +
            '.product a,' +
            '.entry-summary a,' +
            '.woocommerce a'
        );
        var linkStyles = linkReference ? window.getComputedStyle(linkReference) : bodyStyles;

        root.style.setProperty('--upsell-theme-text', bodyStyles.color || '#1d2327');
        root.style.setProperty('--upsell-theme-surface', bodyStyles.backgroundColor || '#ffffff');
        root.style.setProperty('--upsell-theme-muted', bodyStyles.color || '#666666');
        root.style.setProperty('--upsell-theme-card-bg', bodyStyles.backgroundColor || '#ffffff');
        root.style.setProperty('--upsell-theme-subtle-bg', bodyStyles.backgroundColor || '#f6f7f7');
        root.style.setProperty('--upsell-theme-border', referenceStyles.borderColor || 'rgba(0,0,0,0.12)');
        root.style.setProperty('--upsell-theme-link', linkStyles.color || bodyStyles.color || '#2271b1');
        root.style.setProperty('--upsell-theme-button-bg', referenceStyles.backgroundColor || '#2271b1');
        root.style.setProperty('--upsell-theme-button-text', referenceStyles.color || '#ffffff');
        root.style.setProperty('--upsell-theme-button-border', referenceStyles.borderColor || 'transparent');
        root.style.setProperty('--upsell-theme-button-radius', referenceStyles.borderRadius || '6px');
        root.style.setProperty('--upsell-theme-button-font', referenceStyles.fontFamily || bodyStyles.fontFamily || 'inherit');
        root.style.setProperty('--upsell-theme-font', bodyStyles.fontFamily || 'inherit');
    }

    // =========================================================
    // CAROUSELS
    // =========================================================

    function equalizeCarouselItems(track) {
        if (!track) {
            return;
        }

        var items = Array.prototype.slice.call(track.children || []);
        if (!items.length) {
            return;
        }

        items.forEach(function (item) {
            item.style.minHeight = '';
        });

        var tallest = 0;
        items.forEach(function (item) {
            tallest = Math.max(tallest, item.offsetHeight || 0);
        });

        if (tallest > 0) {
            items.forEach(function (item) {
                item.style.minHeight = tallest + 'px';
            });
        }
    }

    function initCarousels() {
        $('[data-upsell-carousel]').each(function () {
            var track = this;
            if (track.dataset.upsellCarouselReady === '1') return;
            track.dataset.upsellCarouselReady = '1';

            var shell = track.closest('.upsell-carousel-shell');
            if (!shell) return;

            var prev = shell.querySelector('[data-upsell-prev]');
            var next = shell.querySelector('[data-upsell-next]');
            if (!prev || !next) return;

            var prevIcon = prev.querySelector('span[aria-hidden="true"]');
            var nextIcon = next.querySelector('span[aria-hidden="true"]');
            if (prevIcon) {
                prevIcon.innerHTML = '&#8249;';
            }
            if (nextIcon) {
                nextIcon.innerHTML = '&#8250;';
            }

            function getStep() {
                var item = track.querySelector('.upsell-card, .upsell-smart-recommendations__item');
                if (!item) {
                    return Math.max(track.clientWidth * 0.85, 220);
                }

                var styles = window.getComputedStyle(track);
                var gap = parseFloat(styles.columnGap || styles.gap || 0);
                return item.getBoundingClientRect().width + gap;
            }

            function updateNav() {
                var maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0);
                var hideNav = maxScroll <= 4;

                equalizeCarouselItems(track);
                shell.classList.toggle('upsell-carousel-shell--static', hideNav);
                prev.disabled = hideNav || track.scrollLeft <= 4;
                next.disabled = hideNav || track.scrollLeft >= (maxScroll - 4);
            }

            prev.addEventListener('click', function () {
                track.scrollBy({ left: -getStep(), behavior: 'smooth' });
            });

            next.addEventListener('click', function () {
                track.scrollBy({ left: getStep(), behavior: 'smooth' });
            });

            track.addEventListener('scroll', updateNav, { passive: true });
            $(window).on('resize', updateNav);
            Array.prototype.forEach.call(track.querySelectorAll('img'), function (img) {
                if (!img.complete) {
                    img.addEventListener('load', updateNav, { once: true });
                }
            });

            if ('ResizeObserver' in window) {
                var resizeObserver = new ResizeObserver(updateNav);
                resizeObserver.observe(track);
            }

            updateNav();
        });
    }

    function normalizeCartWidgetLayout() {
        if (page !== 'cart') {
            return;
        }

        document.querySelectorAll('.upsell-smart-recommendations--cart').forEach(function (widget) {
            widget.classList.add('upsell-smart-recommendations--compact');

            var pill = widget.querySelector('.upsell-smart-recommendations__pill');
            if (pill) {
                pill.style.display = 'none';
            }

            var shell = widget.querySelector('.upsell-carousel-shell');
            var grid = widget.querySelector('.upsell-smart-recommendations__grid');
            if (shell) {
                shell.style.overflow = 'hidden';
            }
            if (grid) {
                grid.style.display = 'flex';
                grid.style.flexDirection = 'row';
                grid.style.flexWrap = 'nowrap';
                grid.style.gap = '12px';
                grid.style.overflowX = 'auto';
                grid.style.overflowY = 'hidden';
                grid.style.scrollBehavior = 'smooth';
                grid.style.scrollSnapType = 'x proximity';
                grid.style.paddingBottom = '2px';
                grid.style.transform = '';
                grid.style.transition = '';
                grid.style.willChange = 'auto';
            }

            widget.querySelectorAll('.upsell-smart-recommendations__item').forEach(function (item) {
                item.style.display = 'grid';
                item.style.gridTemplateColumns = '92px 1fr';
                item.style.alignItems = 'stretch';
                item.style.minWidth = '260px';
                item.style.maxWidth = '260px';
                item.style.flex = '0 0 260px';
                item.style.scrollSnapAlign = 'start';
            });

            widget.querySelectorAll('.upsell-smart-recommendations__image-link').forEach(function (link) {
                link.style.width = '92px';
                link.style.minWidth = '92px';
                link.style.maxWidth = '92px';
                link.style.alignSelf = 'stretch';
            });

            widget.querySelectorAll('.upsell-smart-recommendations__btn').forEach(function (btn) {
                btn.style.display = 'flex';
                btn.style.width = '100%';
                btn.style.maxWidth = '100%';
                btn.style.justifyContent = 'center';
                btn.style.textDecoration = 'none';
            });

            setupCartTransformSlider(widget);
        });
    }

    function setupCartTransformSlider(widget) {
        var shell = widget.querySelector('.upsell-carousel-shell');
        var track = widget.querySelector('[data-upsell-carousel]');
        if (!shell || !track) {
            return;
        }

        if (track.dataset.upsellTransformSliderReady === '1') {
            updateCartTransformSlider(widget);
            return;
        }

        track.dataset.upsellTransformSliderReady = '1';

        var prev = shell.querySelector('[data-upsell-prev]');
        var next = shell.querySelector('[data-upsell-next]');

        function move(direction) {
            var step = getCartSliderStep(track);
            track.scrollBy({ left: direction * step, behavior: 'smooth' });
            window.setTimeout(function () {
                updateCartTransformSlider(widget);
            }, 180);
        }

        if (prev) {
            prev.addEventListener('click', function (event) {
                event.preventDefault();
                move(-1);
            });
        }

        if (next) {
            next.addEventListener('click', function (event) {
                event.preventDefault();
                move(1);
            });
        }

        track.addEventListener('scroll', function () {
            updateCartTransformSlider(widget);
        }, { passive: true });

        updateCartTransformSlider(widget);
    }

    function getCartSliderStep(track) {
        var item = track.querySelector('.upsell-smart-recommendations__item');
        if (!item) {
            return Math.max(track.clientWidth * 0.8, 220);
        }

        var gap = 12;
        try {
            var styles = window.getComputedStyle(track);
            gap = parseFloat(styles.columnGap || styles.gap || 12) || 12;
        } catch (e) {}

        return item.getBoundingClientRect().width + gap;
    }

    function updateCartTransformSlider(widget) {
        var shell = widget.querySelector('.upsell-carousel-shell');
        var track = widget.querySelector('[data-upsell-carousel]');
        if (!shell || !track) {
            return;
        }

        var prev = shell.querySelector('[data-upsell-prev]');
        var next = shell.querySelector('[data-upsell-next]');
        var maxOffset = Math.max(track.scrollWidth - track.clientWidth, 0);
        var current = Math.max(0, Math.min(track.scrollLeft || 0, maxOffset));

        if (prev) {
            prev.disabled = current <= 2;
        }
        if (next) {
            next.disabled = current >= (maxOffset - 2);
        }
    }

    function bindCarouselFallbackControls() {
        $(document).on('click', '[data-upsell-prev], [data-upsell-next]', function (event) {
            var button = event.currentTarget;
            var shell = button.closest('.upsell-carousel-shell');
            if (!shell) {
                return;
            }

            var track = shell.querySelector('[data-upsell-carousel]');
            if (!track) {
                return;
            }

            var cartWidget = button.closest('.upsell-smart-recommendations--cart');
            if (cartWidget) {
                return;
            }

            var item = track.querySelector('.upsell-card, .upsell-smart-recommendations__item');
            var gap = 12;
            try {
                var styles = window.getComputedStyle(track);
                gap = parseFloat(styles.columnGap || styles.gap || 12) || 12;
            } catch (e) {}

            var step = item ? (item.getBoundingClientRect().width + gap) : Math.max(track.clientWidth * 0.85, 220);
            var direction = button.hasAttribute('data-upsell-prev') ? -1 : 1;
            track.scrollBy({ left: direction * step, behavior: 'smooth' });
        });
    }

    function scheduleUiRefresh(delay) {
        window.clearTimeout(scheduleUiRefresh._timer);
        scheduleUiRefresh._timer = window.setTimeout(function () {
            syncThemeStyles();
            if (typeof window.upsellRefreshInjectedWidgets === 'function') {
                window.upsellRefreshInjectedWidgets(page);
            }
            normalizeCartWidgetLayout();
            initCarousels();
        }, typeof delay === 'number' ? delay : 120);
    }

    function runInitialUiSetup() {
        if (runInitialUiSetup._done) {
            return;
        }

        runInitialUiSetup._done = true;
        syncThemeStyles();
        bindCarouselFallbackControls();
        scheduleUiRefresh(0);
    }

    function observeDynamicWidgets() {
        if (!('MutationObserver' in window) || !document.body) {
            return;
        }

        var observer = new MutationObserver(function (mutations) {
            var shouldRefresh = false;

            mutations.forEach(function (mutation) {
                if (shouldRefresh) {
                    return;
                }

                Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
                    if (shouldRefresh || !node || node.nodeType !== 1) {
                        return;
                    }

                    if (
                        node.matches('[data-upsell-carousel], .upsell-widget, .upsell-smart-recommendations, .cart_totals, .wc-block-cart, .wc-block-cart__sidebar') ||
                        node.querySelector('[data-upsell-carousel], .upsell-widget, .upsell-smart-recommendations')
                    ) {
                        shouldRefresh = true;
                    }
                });
            });

            if (shouldRefresh) {
                scheduleUiRefresh(80);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function startCartStabilizer() {
        if (page !== 'cart') {
            return;
        }

        var attempts = 0;
        var maxAttempts = 24;
        var interval = window.setInterval(function () {
            attempts += 1;
            scheduleUiRefresh(0);

            if (attempts >= maxAttempts) {
                window.clearInterval(interval);
            }
        }, 400);
    }

    function waitForCartContainers() {
        if (page !== 'cart') {
            return;
        }

        var attempts = 0;
        var maxAttempts = 30;
        var interval = window.setInterval(function () {
            attempts += 1;

            var cartTotals = document.querySelector('.cart_totals, .wc-block-cart__sidebar');
            var collaterals = document.querySelector('.cart-collaterals, .wc-block-cart, .wp-block-woocommerce-cart');

            if (cartTotals || collaterals) {
                scheduleUiRefresh(0);
            }

            if (attempts >= maxAttempts || (cartTotals && collaterals)) {
                window.clearInterval(interval);
            }
        }, 350);
    }

    function observeCartContainers() {
        if (page !== 'cart' || !('ResizeObserver' in window)) {
            return;
        }

        var targets = document.querySelectorAll('.cart_totals, .cart-collaterals, .wc-block-cart__sidebar, .wc-block-cart, .wp-block-woocommerce-cart');
        if (!targets.length) {
            return;
        }

        var observer = new ResizeObserver(function () {
            scheduleUiRefresh(40);
        });

        Array.prototype.forEach.call(targets, function (target) {
            observer.observe(target);
        });
    }

    // =========================================================
    // INIT
    // =========================================================

    $(document).ready(function () {
        runInitialUiSetup();

        window.setTimeout(function () {
            scheduleUiRefresh(0);
        }, 120);

        if (page === 'cart') {
            [150, 450, 900, 1400, 2000].forEach(function (delay) {
                window.setTimeout(function () {
                    scheduleUiRefresh(0);
                }, delay);
            });
            startCartStabilizer();
            waitForCartContainers();
            observeCartContainers();
        }

        $(window).on('load', function () {
            scheduleUiRefresh(60);
        });

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () {
                scheduleUiRefresh(60);
            });
        }

        $(document.body).on('updated_wc_div updated_cart_totals wc_fragments_loaded wc_fragments_refreshed updated_cart_fragments applied_coupon removed_coupon', function () {
            scheduleUiRefresh(60);
        });

        $(document).ajaxComplete(function (event, xhr, settings) {
            var requestUrl = settings && settings.url ? String(settings.url) : '';
            var requestData = settings && settings.data ? String(settings.data) : '';

            if (
                requestUrl.indexOf('wc-ajax=update_order_review') !== -1 ||
                requestUrl.indexOf('wc-ajax=get_refreshed_fragments') !== -1 ||
                requestData.indexOf('update_cart') !== -1 ||
                requestData.indexOf('woocommerce_update_cart') !== -1 ||
                requestData.indexOf('apply_coupon') !== -1 ||
                requestData.indexOf('remove_coupon') !== -1
            ) {
                scheduleUiRefresh(60);
            }
        });

        document.addEventListener('upsell:widgets-injected', function () {
            scheduleUiRefresh(0);
        });

        observeDynamicWidgets();
    });

}(jQuery));
