<?php

if (!defined('ABSPATH')) {
    exit;
}

class Upsell_Display_Hooks {

    private Upsell_Rules_Engine $engine;
    private Upsell_Smart_Recommendations $smart_recommendations;
    private array $rendered = [];

    public function __construct() {
        $this->engine = new Upsell_Rules_Engine();
        $this->smart_recommendations = new Upsell_Smart_Recommendations();
        $this->register_hooks();
    }

    private function register_hooks(): void {
        if (!class_exists('WooCommerce')) {
            return;
        }

        foreach ($this->get_display_hook_configs() as $hook => $config) {
            if (!empty($config['callback'])) {
                add_action($hook, [$this, $config['callback']], (int) ($config['priority'] ?? 10));
            }
        }

        // Assets
        add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        add_action('wp_footer',          [$this, 'pass_widget_to_js'], 5);
    }

    public function enqueue_frontend_assets(): void {
        if (!is_woocommerce() && !is_cart()) return;

        $script_dependencies = ['jquery'];

        if (wp_script_is('wc-add-to-cart', 'registered')) {
            $script_dependencies[] = 'wc-add-to-cart';
        }

        if (is_cart() && wp_script_is('wc-cart-fragments', 'registered')) {
            $script_dependencies[] = 'wc-cart-fragments';
            wp_enqueue_script('wc-cart-fragments');
        }

        wp_enqueue_style('upsell-frontend', UPSELL_PLUGIN_URL . 'assets/css/upsell-frontend.css', [], $this->get_asset_version('assets/css/upsell-frontend.css'));
        wp_enqueue_script(
            'upsell-frontend-js',
            UPSELL_PLUGIN_URL . 'assets/js/upsell-frontend.js',
            array_values(array_unique($script_dependencies)),
            $this->get_asset_version('assets/js/upsell-frontend.js'),
            true
        );

        if (is_cart()) {
            wp_enqueue_script(
                'smart-recommendations',
                UPSELL_PLUGIN_URL . 'assets/js/smart-recommendations.js',
                ['jquery'],
                '2.0',
                true
            );
        }

        wp_localize_script('upsell-frontend-js', 'upsellFrontend', [
            'apiBase'   => rest_url('upsell/v1'),
            'nonce'     => wp_create_nonce('wp_rest'),
            'sessionId' => $this->get_session_id(),
            'page'      => $this->get_current_page(),
        ]);
    }

    private function get_asset_version(string $relative_path): string {
        $full_path = UPSELL_PLUGIN_DIR . ltrim($relative_path, '/\\');
        if (file_exists($full_path)) {
            $modified = filemtime($full_path);
            if ($modified !== false) {
                return (string) $modified;
            }
        }

        return UPSELL_PLUGIN_VERSION;
    }

    public function pass_widget_to_js(): void {
        $page = $this->get_current_page();
        if (!$page) return;

        $context = $this->get_page_context($page);
        if ($page === 'product' && empty($context['product_id'])) {
            return;
        }

        $recs = $page === 'cart'
            ? $this->get_cart_page_recommendations($context)
            : $this->engine->get_recommendations($context);
        $hook_configs = $this->get_display_hook_configs();

        $hook_widgets = [];

        if (!empty($recs)) {
            $grouped_recs = $this->group_recommendations_by_hook_and_type($recs);

            foreach ($grouped_recs as $group_key => $hook_recs) {
                $first_rec = $hook_recs[0] ?? [];
                $hook      = $first_rec['display_hook'] ?? '';
                $rule_type = $first_rec['rule_type'] ?? 'upsell';

                if (!empty($this->rendered[$this->get_rendered_group_key($page, $hook, $rule_type)])) continue;

                $products = $this->get_all_products($hook_recs);
                if (empty($products)) continue;

                ob_start();
                $this->render_html($page, $products, $this->build_rule_map($hook_recs), $hook_recs);
                $html = ob_get_clean();
                if (!$html) continue;

                $hook_config = $hook_configs[$hook] ?? ['selectors' => [], 'placement' => 'before'];

                $hook_widgets[] = [
                    'hook'      => $hook,
                    'widgetKey' => $group_key,
                    'ruleType'  => $rule_type,
                    'html'      => $html,
                    'selectors' => $hook_config['selectors'],
                    'placement' => $hook_config['placement'],
                    'fallbackSelectors' => $page === 'cart' ? $this->get_cart_fallback_selectors() : [],
                    'fallbackPlacement' => $page === 'cart' ? 'after' : '',
                ];
            }
        }

        $smart_widget = $this->build_smart_widget_for_js($page, $context, $hook_configs);
        if (!empty($smart_widget)) {
            $hook_widgets[] = $smart_widget;
        }

        if (empty($hook_widgets)) return;
        $inline_bootstrap = '(function(){'
            . 'var widgets=' . wp_json_encode($hook_widgets) . ';'
            . 'var page=' . wp_json_encode($page) . ';'
            . 'window.upsellInjectedWidgets=window.upsellInjectedWidgets||{};'
            . 'window.upsellInjectedWidgets[page]=widgets;'
            . 'function inject(){var injectedAny=false;widgets.forEach(function(widget){var widgetId="upsell-js-"+widget.widgetKey.replace(/[^a-z0-9_-]/gi,"-");if(document.getElementById(widgetId))return;var selectors=widget.selectors||[];var placement=widget.placement||"before";var inserted=false;function insertIntoTarget(el,targetPlacement){var wrapper=document.createElement("div");wrapper.id=widgetId;wrapper.innerHTML=widget.html;if(targetPlacement==="prepend"){el.insertAdjacentElement("afterbegin",wrapper);}else if(targetPlacement==="append"){el.appendChild(wrapper);}else if(targetPlacement==="after"){el.insertAdjacentElement("afterend",wrapper);}else{el.parentNode.insertBefore(wrapper,el);}}for(var i=0;i<selectors.length;i++){var el=document.querySelector(selectors[i]);if(el){insertIntoTarget(el,placement);injectedAny=true;inserted=true;break;}}if(!inserted&&page==="cart"){var fallbackSelectors=widget.fallbackSelectors||[];var fallbackPlacement=widget.fallbackPlacement||"after";for(var j=0;j<fallbackSelectors.length;j++){var fallbackEl=document.querySelector(fallbackSelectors[j]);if(fallbackEl){insertIntoTarget(fallbackEl,fallbackPlacement);injectedAny=true;break;}}}});if(injectedAny){document.dispatchEvent(new CustomEvent("upsell:widgets-injected",{detail:{page:page}}));}}'
            . 'window.upsellRefreshInjectedWidgets=function(targetPage){var pages=window.upsellInjectedWidgets||{};if(targetPage&&pages[targetPage]){widgets=pages[targetPage];inject();return;}Object.keys(pages).forEach(function(pageKey){widgets=pages[pageKey]||[];inject();});};'
            . 'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",inject);}else{inject();}'
            . 'window.addEventListener("load",inject);'
            . 'if(page==="cart"){var attempts=0;var maxAttempts=12;var timer=window.setInterval(function(){attempts+=1;inject();if(attempts>=maxAttempts){window.clearInterval(timer);}},400);}'
            . '})();';
        wp_add_inline_script('upsell-frontend-js', $inline_bootstrap, 'after');
    }

    // =========================================================
    // PHP HOOK RENDERERS
    // =========================================================

    public function render_product_page(): void {
        $current_hook = current_filter();
        smart_upsell_debug_log('[upsell] render_product_page hook=' . $current_hook . ' product_id=' . (int) get_the_ID());

        $product_id = get_the_ID() ?: get_queried_object_id();
        if (!$product_id) {
            smart_upsell_debug_log('[upsell] render_product_page missing product_id');
            return;
        }

        $recs = $this->engine->get_recommendations([
            'product_id' => $product_id,
            'page'       => 'product',
            'cart_items' => $this->get_cart_item_ids(),
        ]);

        if (empty($recs)) {
            $this->render_smart_recommendations_once('product', [
                'page'       => 'product',
                'product_id' => $product_id,
                'user_id'    => get_current_user_id(),
                'cart_items' => $this->get_cart_item_ids(),
            ]);
            return;
        }

        // Filter recs for current hook
        $recs = $this->filter_recs_for_current_hook($recs, 'product');
        if (empty($recs)) {
            $this->render_smart_recommendations_once('product', [
                'page'       => 'product',
                'product_id' => $product_id,
                'user_id'    => get_current_user_id(),
                'cart_items' => $this->get_cart_item_ids(),
            ]);
            return;
        }

        $grouped_recs = $this->group_recommendations_by_hook_and_type($recs);
        foreach ($grouped_recs as $group_key => $group) {
            $first_rec = $group[0] ?? [];
            $rendered_key = $this->get_rendered_group_key(
                'product',
                (string) ($first_rec['display_hook'] ?? $current_hook),
                (string) ($first_rec['rule_type'] ?? 'upsell')
            );
            if (!empty($this->rendered[$rendered_key])) continue;

            $products = $this->get_all_products($group);
            if (empty($products)) continue;

            $this->rendered[$rendered_key] = true;
            $this->render_html('product', $products, $this->build_rule_map($group), $group);
        }

        $this->render_smart_recommendations_once('product', [
            'page'       => 'product',
            'product_id' => $product_id,
            'user_id'    => get_current_user_id(),
            'cart_items' => $this->get_cart_item_ids(),
        ]);
    }

    public function render_cart_page(): void {
        $current_hook = current_filter();
        $cart_item_ids = $this->get_cart_item_ids();
        smart_upsell_debug_log('[upsell] render_cart_page hook=' . $current_hook . ' cart_items=' . count($cart_item_ids));

        $recs = $this->get_cart_page_recommendations([
            'product_id' => 0,
            'page'       => 'cart',
            'cart_items' => $cart_item_ids,
        ]);

        if (!empty($recs)) {
            $recs = $this->filter_recs_for_current_hook($recs, 'cart');
            if (!empty($recs)) {
                $grouped_recs = $this->group_recommendations_by_hook_and_type($recs);
                foreach ($grouped_recs as $group_key => $group) {
                    $first_rec = $group[0] ?? [];
                    $rendered_key = $this->get_rendered_group_key(
                        'cart',
                        (string) ($first_rec['display_hook'] ?? $current_hook),
                        (string) ($first_rec['rule_type'] ?? 'upsell')
                    );
                    if (!empty($this->rendered[$rendered_key])) continue;

                    $products = $this->get_all_products($group);
                    if (empty($products)) continue;

                    $this->rendered[$rendered_key] = true;
                    $this->render_html('cart', $products, $this->build_rule_map($group), $group);
                }
            }
        }

        $this->render_smart_recommendations_once('cart', [
            'page'       => 'cart',
            'product_id' => 0,
            'user_id'    => get_current_user_id(),
            'cart_items' => $cart_item_ids,
        ]);
    }

    private function filter_recs_for_current_hook(array $recs, string $page): array {
        $current_hook = current_filter();
        if (empty($current_hook)) return $recs;

        $defaults = [
            'product'  => 'woocommerce_after_add_to_cart_form',
            'cart'     => 'woocommerce_before_cart_totals',
        ];

        return array_values(array_filter($recs, function ($rec) use ($current_hook, $page, $defaults) {
            $target = trim((string) ($rec['display_hook'] ?? ''));
            if ($target === '') $target = $defaults[$page] ?? '';
            return $target === $current_hook;
        }));
    }

    private function render_smart_recommendations_once(string $page, array $context): void {
        $current_hook = current_filter();
        $target_hook = $this->get_smart_display_hook_for_page($page);
        if ($target_hook && $current_hook && $current_hook !== $target_hook) {
            return;
        }

        $rendered_key = 'smart|' . $page;
        if (!empty($this->rendered[$rendered_key])) {
            return;
        }

        $this->rendered[$rendered_key] = true;
        $this->smart_recommendations->render(array_merge($context, [
            'display_hook' => $target_hook,
        ]));
    }

    private function get_smart_display_hook_for_page(string $page): string {
        $positions = upsell_get_smart_setting('display_positions', Upsell_Smart_Settings::get_default_display_positions());
        if (is_array($positions) && !empty($positions[$page])) {
            return (string) $positions[$page];
        }

        $defaults = Upsell_Smart_Settings::get_default_display_positions();
        return (string) ($defaults[$page] ?? '');
    }

    private function get_page_context(string $page): array {
        return [
            'product_id' => $page === 'product' ? (get_queried_object_id() ?: get_the_ID() ?: 0) : 0,
            'page'       => $page,
            'cart_items' => $this->get_cart_item_ids(),
        ];
    }

    private function build_smart_widget_for_js(string $page, array $context, array $hook_configs): array {
        $rendered_key = 'smart|' . $page;
        if (!empty($this->rendered[$rendered_key])) {
            return [];
        }

        ob_start();
        $this->smart_recommendations->render(array_merge($context, [
            'user_id' => get_current_user_id(),
            'display_hook' => $this->get_smart_display_hook_for_page($page),
        ]));
        $html = ob_get_clean();
        if (!$html) {
            return [];
        }

        $hook = $this->get_smart_display_hook_for_page($page);
        $hook_config = $hook_configs[$hook] ?? ['selectors' => [], 'placement' => 'before'];

        return [
            'hook'      => $hook,
            'widgetKey' => 'smart|' . $page,
            'ruleType'  => 'smart',
            'html'      => $html,
            'selectors' => $hook_config['selectors'],
            'placement' => $hook_config['placement'],
            'fallbackSelectors' => $page === 'cart' ? $this->get_cart_fallback_selectors() : [],
            'fallbackPlacement' => $page === 'cart' ? 'after' : '',
        ];
    }

    private function get_cart_fallback_selectors(): array {
        return [
            '.shop_table',
            'table.shop_table',
            '[class*="cart-total"]',
            '[class*="cart_total"]',
            '[class*="cart-totals"]',
            '[class*="cart_totals"]',
            '[class*="cart-summary"]',
            '[class*="order-summary"]',
            '[class*="cart-sidebar"]',
            '[data-cart-totals]',
            '[data-cart-summary]',
            '.cart-collaterals',
            '.cart_totals',
            '.wc-block-cart__sidebar',
            '.wc-block-cart-items',
            'form.woocommerce-cart-form',
            '.woocommerce-cart-form',
            '.wc-block-cart',
            '.wp-block-woocommerce-cart',
            '.woocommerce-cart',
            '.woocommerce',
            '.site-main',
            'main',
        ];
    }

    private function get_cart_page_recommendations(array $context): array {
        $context['page'] = 'cart';
        $recs = $this->engine->get_recommendations($context);
        if (!empty($recs) || empty($context['cart_items'])) {
            return $recs;
        }

        $fallback_recs = [];
        $cart_items = array_values(array_unique(array_map('intval', (array) ($context['cart_items'] ?? []))));
        $cart_hook = 'woocommerce_before_cart_totals';

        foreach ($cart_items as $cart_product_id) {
            if ($cart_product_id <= 0) {
                continue;
            }

            $product_context = $context;
            $product_context['page'] = 'product';
            $product_context['product_id'] = $cart_product_id;

            foreach ($this->engine->get_recommendations($product_context) as $rec) {
                $rule_id = (int) ($rec['rule_id'] ?? 0);
                $rule_type = (string) ($rec['rule_type'] ?? 'upsell');
                $group_key = $rule_id . '|' . $rule_type;

                if (!isset($fallback_recs[$group_key])) {
                    $rec['display_hook'] = $cart_hook;
                    $fallback_recs[$group_key] = $rec;
                    continue;
                }

                $merged_ids = array_values(array_unique(array_merge(
                    array_map('intval', (array) ($fallback_recs[$group_key]['product_ids'] ?? [])),
                    array_map('intval', (array) ($rec['product_ids'] ?? []))
                )));

                $fallback_recs[$group_key]['product_ids'] = $merged_ids;
            }
        }

        return array_values($fallback_recs);
    }

    // =========================================================
    // HTML RENDERING - FIXED to respect rule_type
    // =========================================================

    public function render_html(string $page, array $products, array $rule_map, array $recs): void {
        // IMPORTANT: Get the rule_type from the first recommendation
        // All products in this widget should come from rules of the same type
        $primary_rule_type = !empty($recs) ? $recs[0]['rule_type'] : 'upsell';
        $display_hook = !empty($recs) ? (string) ($recs[0]['display_hook'] ?? '') : '';
        
        // Route to the correct render method based on rule type
        switch ($primary_rule_type) {
            case 'upsell':
                $this->render_upsell_widget($page, $products, $rule_map, $display_hook);
                break;
            case 'cross_sell':
            default:
                $this->render_cross_sell_widget($page, $products, $rule_map, $display_hook);
                break;
        }
    }

    private function get_hook_style_classes(string $display_hook): string {
        $hook_slug = sanitize_html_class(str_replace('woocommerce_', '', $display_hook));
        $compact_hooks = [
            'woocommerce_before_cart_totals',
            'woocommerce_after_cart_totals',
        ];

        $classes = [];
        if ($hook_slug !== '') {
            $classes[] = 'upsell-widget--hook-' . $hook_slug;
        }
        if (in_array($display_hook, $compact_hooks, true)) {
            $classes[] = 'upsell-widget--compact';
        }

        return implode(' ', $classes);
    }

    private function render_carousel_controls(string $label = 'Product recommendations'): void {
        ?>
        <div class="upsell-carousel-nav" aria-label="<?php echo esc_attr($label); ?>">
            <button type="button" class="upsell-carousel-nav__btn upsell-carousel-nav__btn--prev" data-upsell-prev aria-label="<?php esc_attr_e('Previous products', 'zerosoft-upsell-engine-for-woocommerce'); ?>">
                <span aria-hidden="true">â€¹</span>
            </button>
            <button type="button" class="upsell-carousel-nav__btn upsell-carousel-nav__btn--next" data-upsell-next aria-label="<?php esc_attr_e('Next products', 'zerosoft-upsell-engine-for-woocommerce'); ?>">
                <span aria-hidden="true">â€º</span>
            </button>
        </div>
        <?php
    }

    private function get_widget_copy(string $rule_type, string $page): array {
        $copy = [
            'title'    => 'Recommended for you',
            'subtitle' => 'Products selected for this page.',
            'badge'    => 'RECOMMENDED',
            'button'   => 'Add to Cart',
            'caption'  => 'A smart match for your current selection.',
        ];

        if ($rule_type === 'upsell') {
            $variants = [
                'product' => [
                    'title'    => 'Upgrade your selection',
                    'subtitle' => 'Choose a better version with more value.',
                    'badge'    => 'UPGRADE',
                    'button'   => 'Upgrade Now',
                    'caption'  => 'A better version of this product.',
                ],
                'cart' => [
                    'title'    => 'Upgrade your cart',
                    'subtitle' => 'Boost this order with a stronger option.',
                    'badge'    => 'UPGRADE',
                    'button'   => 'Upgrade Now',
                    'caption'  => 'A premium option for your cart.',
                ],
            ];

            return $variants[$page] ?? $copy;
        }

        if ($rule_type === 'cross_sell') {
            $variants = [
                'product' => [
                    'title'    => 'Frequently bought together',
                    'subtitle' => 'Customers often add these with this product.',
                    'badge'    => 'GOES WELL WITH',
                    'button'   => 'Add to Cart',
                    'caption'  => 'A useful companion for this product.',
                ],
                'cart' => [
                    'title'    => 'Complete your cart',
                    'subtitle' => 'These items pair well with what is already in your cart.',
                    'badge'    => 'GOES WELL WITH',
                    'button'   => 'Add to Cart',
                    'caption'  => 'A complementary item for your cart.',
                ],
            ];

            return $variants[$page] ?? $copy;
        }

        $variants = [
            'product' => [
                'title'    => 'Enhance your product',
                'subtitle' => 'Add-ons and extras that improve this product.',
                'badge'    => 'ADD-ON',
                'button'   => 'Add to Cart',
                'caption'  => 'An add-on that enhances your product.',
            ],
            'cart' => [
                'title'    => 'Useful add-ons for your cart',
                'subtitle' => 'Extra items that support what you are already buying.',
                'badge'    => 'ADD-ON',
                'button'   => 'Add to Cart',
                'caption'  => 'A helpful extra for your order.',
            ],
        ];

        return $variants[$page] ?? $copy;
    }

    /**
     * UPSELL WIDGET - Shows higher-value product suggestions
     */
    private function render_upsell_widget(string $page, array $products, array $rule_map, string $display_hook = ''): void {
        $copy = $this->get_widget_copy('upsell', $page);
        $hook_classes = $this->get_hook_style_classes($display_hook);
        if ($page === 'cart' && strpos($hook_classes, 'upsell-widget--compact') === false) {
            $hook_classes = trim($hook_classes . ' upsell-widget--compact');
        }
        $product_count = count($products);
        $widget_classes = trim('upsell-widget upsell-widget--upsell upsell-widget--' . $page . ' ' . ($page === 'cart' ? 'upsell-widget--cart-scope ' : '') . $hook_classes . ' upsell-widget--count-' . min($product_count, 4));
        $use_carousel = $product_count > 2;
        $grid_classes = 'upsell-product-grid';
        if (!$use_carousel) {
            $grid_classes .= ' upsell-product-grid--count-' . min($product_count, 3);
        }
        ?>
        <div class="<?php echo esc_attr($widget_classes); ?>">
            <div class="upsell-widget__header">
                <span class="upsell-widget__dot upsell-widget__dot--upgrade"></span>
                <div>
                    <h3 class="upsell-widget__title"><?php echo esc_html($copy['title']); ?></h3>
                    <p class="upsell-widget__sub"><?php echo esc_html($copy['subtitle']); ?></p>
                </div>
            </div>
            <div class="upsell-carousel-shell">
                <?php if ($use_carousel) : ?>
                    <?php $this->render_carousel_controls($copy['title']); ?>
                <?php endif; ?>
                <div class="<?php echo esc_attr($grid_classes . ($use_carousel ? ' upsell-carousel-track' : '')); ?>"<?php echo $use_carousel ? ' data-upsell-carousel' : ''; ?>>
                <?php foreach ($products as $p) :
                    $rule_id = $rule_map[$p['id']]['rule_id'] ?? 0;
                    $caption = $copy['caption'];
                ?>
                    <div class="upsell-card upsell-card--upsell" data-product-id="<?php echo esc_attr($p['id']); ?>" data-rule-id="<?php echo esc_attr($rule_id); ?>">
                        <span class="upsell-badge upsell-badge--upsell"><?php echo esc_html($copy['badge']); ?></span>
                        <a href="<?php echo esc_url($p['url']); ?>" class="upsell-track-click upsell-card__img-wrap">
                            <img src="<?php echo esc_url($p['image']); ?>" alt="<?php echo esc_attr($p['name']); ?>" class="upsell-card__img" loading="lazy" />
                        </a>
                        <div class="upsell-card__body">
                            <a href="<?php echo esc_url($p['url']); ?>" class="upsell-card__name upsell-track-click"><?php echo esc_html($p['name']); ?></a>
                            <div class="upsell-card__price"><?php echo wp_kses_post($p['price_html']); ?></div>
                            <div class="upsell-card__caption upsell-card__caption--upgrade"><?php echo esc_html($caption); ?></div>
                            <?php if ($p['in_stock']) : ?>
                                <a href="<?php echo esc_url($p['add_to_cart_url']); ?>" class="upsell-card__btn upsell-card__btn--upgrade upsell-track-click" data-product-id="<?php echo esc_attr($p['id']); ?>"><?php echo esc_html($copy['button']); ?></a>
                            <?php else : ?>
                                <a href="<?php echo esc_url($p['url']); ?>" class="upsell-card__btn upsell-card__btn--view"><?php esc_html_e('View Product', 'zerosoft-upsell-engine-for-woocommerce'); ?></a>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * CROSS-SELL WIDGET - Shows complementary products
     */
    private function render_cross_sell_widget(string $page, array $products, array $rule_map, string $display_hook = ''): void {
        $copy = $this->get_widget_copy('cross_sell', $page);
        $hook_classes = $this->get_hook_style_classes($display_hook);
        if ($page === 'cart' && strpos($hook_classes, 'upsell-widget--compact') === false) {
            $hook_classes = trim($hook_classes . ' upsell-widget--compact');
        }
        $product_count = count($products);
        $widget_classes = trim('upsell-widget upsell-widget--cross-sell upsell-widget--' . $page . ' ' . ($page === 'cart' ? 'upsell-widget--cart-scope ' : '') . $hook_classes . ' upsell-widget--count-' . min($product_count, 4));
        $use_carousel = $product_count > 2;
        $grid_classes = 'upsell-product-grid';
        if (!$use_carousel) {
            $grid_classes .= ' upsell-product-grid--count-' . min($product_count, 3);
        }
        ?>
        <div class="<?php echo esc_attr($widget_classes); ?>">
            <div class="upsell-widget__header">
                <span class="upsell-widget__dot upsell-widget__dot--cross"></span>
                <div>
                    <h3 class="upsell-widget__title"><?php echo esc_html($copy['title']); ?></h3>
                    <p class="upsell-widget__sub"><?php echo esc_html($copy['subtitle']); ?></p>
                </div>
            </div>
            <div class="upsell-carousel-shell">
                <?php if ($use_carousel) : ?>
                    <?php $this->render_carousel_controls($copy['title']); ?>
                <?php endif; ?>
                <div class="<?php echo esc_attr($grid_classes . ($use_carousel ? ' upsell-carousel-track' : '')); ?>"<?php echo $use_carousel ? ' data-upsell-carousel' : ''; ?>>
                <?php foreach ($products as $p) :
                    $rule_id = $rule_map[$p['id']]['rule_id'] ?? 0;
                    $caption = $copy['caption'];
                ?>
                    <div class="upsell-card upsell-card--cross-sell" data-product-id="<?php echo esc_attr($p['id']); ?>" data-rule-id="<?php echo esc_attr($rule_id); ?>">
                        <span class="upsell-badge upsell-badge--cross_sell"><?php echo esc_html($copy['badge']); ?></span>
                        <a href="<?php echo esc_url($p['url']); ?>" class="upsell-track-click upsell-card__img-wrap">
                            <img src="<?php echo esc_url($p['image']); ?>" alt="<?php echo esc_attr($p['name']); ?>" class="upsell-card__img" loading="lazy" />
                        </a>
                        <div class="upsell-card__body">
                            <a href="<?php echo esc_url($p['url']); ?>" class="upsell-card__name upsell-track-click"><?php echo esc_html($p['name']); ?></a>
                            <div class="upsell-card__price"><?php echo wp_kses_post($p['price_html']); ?></div>
                            <div class="upsell-card__caption upsell-card__caption--cross-sell"><?php echo esc_html($caption); ?></div>
                            <?php if ($p['in_stock']) : ?>
                                <a href="<?php echo esc_url($p['add_to_cart_url']); ?>" class="upsell-card__btn upsell-card__btn--cross-sell upsell-track-click" data-product-id="<?php echo esc_attr($p['id']); ?>"><?php echo esc_html($copy['button']); ?></a>
                            <?php else : ?>
                                <a href="<?php echo esc_url($p['url']); ?>" class="upsell-card__btn upsell-card__btn--view"><?php esc_html_e('View Product', 'zerosoft-upsell-engine-for-woocommerce'); ?></a>
                            <?php endif; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
                </div>
            </div>
        </div>
        <?php
    }

    // =========================================================
    // HELPERS
    // =========================================================

    private function get_current_page(): string {
        if (is_product())                               return 'product';
        if (is_cart())                                  return 'cart';
        return '';
    }

    private function get_display_hook_configs(): array {
        return [
            'woocommerce_after_add_to_cart_form' => [
                'callback'  => 'render_product_page',
                'priority'  => 10,
                'selectors' => ['form.cart', '.woocommerce-variation-add-to-cart', '.cart'],
                'placement' => 'after',
            ],
            'woocommerce_single_product_summary' => [
                'callback'  => 'render_product_page',
                'priority'  => 25,
                'selectors' => ['.woocommerce div.product form.cart', '.entry-summary form.cart', '.woocommerce div.product .product_meta', '.entry-summary .product_meta'],
                'placement' => 'before',
            ],
            'woocommerce_before_cart_totals' => [
                'callback'  => 'render_cart_page',
                'priority'  => 5,
                'selectors' => ['.cart_totals', '.wc-block-cart__sidebar'],
                'placement' => 'prepend',
            ],
            'woocommerce_after_cart_totals' => [
                'callback'  => 'render_cart_page',
                'priority'  => 5,
                'selectors' => ['.cart_totals', '.wc-block-cart__sidebar'],
                'placement' => 'after',
            ],
        ];
    }

    private function group_recommendations_by_hook_and_type(array $recs): array {
        $recs = $this->sort_recommendations_by_priority($recs);
        $grouped = [];

        foreach ($recs as $rec) {
            $hook      = trim((string) ($rec['display_hook'] ?? ''));
            $rule_type = trim((string) ($rec['rule_type'] ?? 'upsell'));
            $key       = $hook . '|' . $rule_type;

            if (!isset($grouped[$key])) {
                $grouped[$key] = [];
            }

            $grouped[$key][] = $rec;
        }

        return $grouped;
    }

    private function sort_recommendations_by_priority(array $recs): array {
        usort($recs, function (array $a, array $b): int {
            $priority_a = (int) ($a['priority'] ?? 0);
            $priority_b = (int) ($b['priority'] ?? 0);

            if ($priority_a !== $priority_b) {
                return $priority_b <=> $priority_a;
            }

            return (int) ($a['rule_id'] ?? 0) <=> (int) ($b['rule_id'] ?? 0);
        });

        return $recs;
    }

    private function get_rendered_group_key(string $page, string $hook, string $rule_type): string {
        return $page . '|' . trim($hook) . '|' . trim($rule_type);
    }

    private function get_all_products(array $recs): array {
        $all_ids = $products = [];
        foreach ($recs as $rec) {
            foreach ($rec['product_ids'] as $pid) {
                if (!in_array($pid, $all_ids, true)) $all_ids[] = $pid;
            }
        }
        foreach ($all_ids as $id) {
            $p = wc_get_product($id);
            if (!$p || !$p->is_visible()) continue;
            $image_id = $p->get_image_id();
            $products[] = [
                'id'              => $id,
                'name'            => $p->get_name(),
                'url'             => get_permalink($id),
                'image'           => $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : wc_placeholder_img_src('woocommerce_thumbnail'),
                'price_html'      => $p->get_price_html(),
                'in_stock'        => $p->is_in_stock(),
                'add_to_cart_url' => $p->add_to_cart_url(),
            ];
        }
        return $products;
    }

    private function build_rule_map(array $recs): array {
        $map = [];
        foreach ($recs as $rec) {
            foreach ($rec['product_ids'] as $pid) {
                if (!isset($map[$pid])) {
                    $map[$pid] = [
                        'rule_id'     => $rec['rule_id'],
                        'rule_type'   => $rec['rule_type'],
                    ];
                }
            }
        }
        return $map;
    }

    private function get_cart_item_ids(): array {
        if (!WC()->cart) return [];
        $ids = [];
        foreach (WC()->cart->get_cart() as $item) {
            $ids[] = (int) $item['product_id'];
        }
        return $ids;
    }

    private function get_session_id(): string {
        if (function_exists('WC') && WC()->session) {
            $session_id = WC()->session->get('upsell_session_id');
            if (empty($session_id)) {
                $session_id = wp_generate_uuid4();
                WC()->session->set('upsell_session_id', $session_id);
            }
            return (string) $session_id;
        }

        $cookie_name = 'upsell_session_id';
        $session_id  = isset($_COOKIE[ $cookie_name ]) ? sanitize_text_field(wp_unslash($_COOKIE[ $cookie_name ])) : '';

        if ($session_id === '') {
            $session_id = wp_generate_uuid4();
            wc_setcookie($cookie_name, $session_id, time() + DAY_IN_SECONDS * 30);
            $_COOKIE[ $cookie_name ] = $session_id;
        }

        return $session_id;
    }
}
