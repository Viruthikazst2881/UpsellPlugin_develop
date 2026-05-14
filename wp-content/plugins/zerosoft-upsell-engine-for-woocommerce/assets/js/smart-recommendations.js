(function ($) {
    'use strict';

    let initialized = false;
    let observer = null;

    function getWrapper() {
        return document.getElementById('smart-recommendations-wrapper');
    }

    function initSmartRecommendations() {

        const wrapper = getWrapper();
        if (!wrapper || initialized) return;

        initialized = true;

        // Force browser layout calculation
        wrapper.offsetHeight;

        // Recalculate layout AFTER paint
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.dispatchEvent(new Event('resize'));
            });
        });
    }

    /**
     * Observe WooCommerce cart safely (theme independent)
     */
    function observeCartChanges() {

        const cart =
            document.querySelector('form.woocommerce-cart-form') ||
            document.querySelector('.woocommerce');

        if (!cart) return;

        if (observer) observer.disconnect();

        observer = new MutationObserver(() => {
            initialized = false;
            initSmartRecommendations();
        });

        observer.observe(cart, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Initial load
     */
    $(document).ready(function () {
        observeCartChanges();
        initSmartRecommendations();
    });

    /**
     * Official WooCommerce lifecycle events
     */
    $(document.body).on(
        'updated_wc_div updated_cart_totals wc_fragments_loaded wc_fragments_refreshed',
        function () {
            initialized = false;
            initSmartRecommendations();
        }
    );

})(jQuery);