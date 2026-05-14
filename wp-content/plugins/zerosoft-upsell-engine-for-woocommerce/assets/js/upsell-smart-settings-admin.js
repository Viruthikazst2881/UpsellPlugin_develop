document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.upsell-search-picker').forEach(function(picker) {
        var input = picker.querySelector('.upsell-search-picker__input');
        var items = Array.prototype.slice.call(picker.querySelectorAll('.upsell-search-picker__item'));
        var empty = picker.querySelector('.upsell-search-picker__empty');
        var results = picker.querySelector('.upsell-product-picker__search-results');
        var genericResults = picker.querySelector('.upsell-search-picker__results');
        var showOnInputOnly = picker.getAttribute('data-show-on-input') === '1';
        if (!input) {
            return;
        }

        function filterItems() {
            var term = (input.value || '').toLowerCase().trim();
            var shouldShow = showOnInputOnly ? term.length > 0 : (term.length > 0 || !results);
            var visibleCount = 0;

            items.forEach(function(item) {
                var haystack = (item.getAttribute('data-search') || '').toLowerCase();
                var visible = !term || haystack.indexOf(term) !== -1;
                item.classList.toggle('is-hidden', !visible);
                if (visible) {
                    visibleCount++;
                }
            });

            if (empty) {
                empty.style.display = shouldShow && visibleCount === 0 ? 'block' : 'none';
            }

            if (results) {
                results.classList.toggle('is-hidden', !shouldShow);
            }

            if (genericResults) {
                genericResults.classList.toggle('is-hidden', !shouldShow);
            }
        }

        input.addEventListener('input', filterItems);
        filterItems();
    });

    document.querySelectorAll('.upsell-product-picker').forEach(function(picker) {
        var tabs = Array.prototype.slice.call(picker.querySelectorAll('.upsell-product-picker__tab'));
        var searchPanel = picker.querySelector('[data-panel="search"]');
        var categoryPanel = picker.querySelector('[data-panel="category"]');
        var categorySearch = picker.querySelector('.upsell-category-picker__search');
        var categoryButtons = Array.prototype.slice.call(picker.querySelectorAll('.upsell-category-picker__item'));
        var productGroups = Array.prototype.slice.call(picker.querySelectorAll('.upsell-category-picker__products'));

        function setProductPickerMode(target) {
            tabs.forEach(function(btn) { btn.classList.toggle('is-active', btn.getAttribute('data-target') === target); });
            if (searchPanel) {
                searchPanel.classList.toggle('is-hidden', target !== 'search');
            }
            if (categoryPanel) {
                categoryPanel.classList.toggle('is-hidden', target !== 'category');
            }

            var searchInput = picker.querySelector('[data-panel="search"] .upsell-search-picker__input');
            var searchResults = picker.querySelector('.upsell-product-picker__search-results');
            if (target === 'search' && searchInput && searchResults) {
                searchResults.classList.toggle('is-hidden', !(searchInput.value || '').trim().length);
            }

            if (target === 'category') {
                var firstVisibleCategory = null;
                categoryButtons.forEach(function(button) {
                    if (!button.classList.contains('is-hidden') && !firstVisibleCategory) {
                        firstVisibleCategory = button;
                    }
                });
                if (firstVisibleCategory) {
                    firstVisibleCategory.click();
                }
            }
        }

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                setProductPickerMode(tab.getAttribute('data-target'));
            });
        });

        categoryButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                var target = button.getAttribute('data-category');
                categoryButtons.forEach(function(btn) { btn.classList.toggle('is-active', btn === button); });
                productGroups.forEach(function(group) {
                    group.classList.toggle('is-hidden', group.getAttribute('data-category-products') !== target);
                });
            });
        });

        if (categorySearch) {
            categorySearch.addEventListener('input', function() {
                var term = (categorySearch.value || '').toLowerCase().trim();
                var firstVisible = null;
                categoryButtons.forEach(function(button) {
                    var haystack = (button.getAttribute('data-search') || '').toLowerCase();
                    var visible = !term || haystack.indexOf(term) !== -1;
                    button.classList.toggle('is-hidden', !visible);
                    if (visible && !firstVisible) {
                        firstVisible = button;
                    }
                });

                if (firstVisible && !firstVisible.classList.contains('is-active')) {
                    firstVisible.click();
                }
            });
        }

        var activeTab = picker.querySelector('.upsell-product-picker__tab.is-active');
        setProductPickerMode(activeTab ? activeTab.getAttribute('data-target') : 'search');
    });
});
