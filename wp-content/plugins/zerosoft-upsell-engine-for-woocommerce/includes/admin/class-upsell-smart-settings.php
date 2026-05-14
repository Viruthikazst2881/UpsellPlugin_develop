<?php
/**
 * Smart Recommendations Settings Page
 * 
 * Handles admin settings UI for Smart Recommendations feature.
 * Uses WordPress Settings API for proper settings management.
 */

if (!defined('ABSPATH')) {
    exit;
}

class Upsell_Smart_Settings {

    /**
     * Initialize settings and hooks
     */
    public function __construct() {
        add_action('admin_menu', [$this, 'add_submenu_page']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_settings_assets']);
    }

    /**
     * Add submenu page under Smart Upsell
     */
    public function add_submenu_page(): void {
        add_submenu_page(
            'upsell-engine',
            __('Smart Recommendations', 'zerosoft-upsell-engine-for-woocommerce'),
            __('Recommendation', 'zerosoft-upsell-engine-for-woocommerce'),
            'manage_options',
            'upsell-smart-recommendations',
            [$this, 'render_settings_page']
        );
    }

    public function enqueue_settings_assets(string $hook): void {
        if (!preg_match('/(?:^|_)page_upsell-smart-recommendations$/', $hook)) {
            return;
        }

        wp_enqueue_style(
            'upsell-smart-settings-admin',
            UPSELL_PLUGIN_URL . 'assets/css/upsell-smart-settings-admin.css',
            [],
            UPSELL_PLUGIN_VERSION
        );
        wp_enqueue_script(
            'upsell-smart-settings-admin',
            UPSELL_PLUGIN_URL . 'assets/js/upsell-smart-settings-admin.js',
            [],
            UPSELL_PLUGIN_VERSION,
            true
        );
    }

    /**
     * Register all settings and sections
     */
    public function register_settings(): void {
        $option_group = 'upsell-smart-settings';
        $option_page = 'upsell-smart-settings';

        // Register settings
        register_setting($option_group, 'upsell_smart_enabled', [
            'type'              => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'default'           => true,
        ]);

        register_setting($option_group, 'upsell_smart_sources', [
            'type'              => 'array',
            'sanitize_callback' => [$this, 'sanitize_sources'],
            'default'           => $this->get_default_sources(),
        ]);

        register_setting($option_group, 'upsell_smart_limit', [
            'type'              => 'number',
            'sanitize_callback' => 'absint',
            'default'           => 4,
        ]);

        register_setting($option_group, 'upsell_smart_layout', [
            'type'              => 'string',
            'sanitize_callback' => [$this, 'sanitize_layout'],
            'default'           => 'grid',
        ]);

        register_setting($option_group, 'upsell_smart_pages', [
            'type'              => 'array',
            'sanitize_callback' => [$this, 'sanitize_pages'],
            'default'           => $this->get_default_pages(),
        ]);

        register_setting($option_group, 'upsell_smart_display_positions', [
            'type'              => 'array',
            'sanitize_callback' => [$this, 'sanitize_display_positions'],
            'default'           => $this->get_default_display_positions(),
        ]);

        // Add settings sections
        add_settings_section(
            'upsell_smart_general',
            __('General Settings', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_general_section'],
            $option_page
        );

        add_settings_section(
            'upsell_smart_sources',
            __('Recommendation Sources', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_sources_section'],
            $option_page
        );

        add_settings_section(
            'upsell_smart_display',
            __('Display Settings', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_display_section'],
            $option_page
        );

        add_settings_section(
            'upsell_smart_pages_section',
            __('Page Visibility', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_pages_section'],
            $option_page
        );

        // Add settings fields
        add_settings_field(
            'upsell_smart_enabled',
            __('Enable Smart Recommendations', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_checkbox_field'],
            $option_page,
            'upsell_smart_general',
            ['name' => 'upsell_smart_enabled', 'description' => __('Turn on/off smart product recommendations on the frontend.', 'zerosoft-upsell-engine-for-woocommerce')]
        );

        add_settings_field(
            'upsell_smart_sources',
            __('Recommendation Sources', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_sources_field'],
            $option_page,
            'upsell_smart_sources'
        );

        add_settings_field(
            'upsell_smart_limit',
            __('Products Limit', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_number_field'],
            $option_page,
            'upsell_smart_display',
            ['name' => 'upsell_smart_limit', 'min' => 1, 'max' => 12, 'description' => __('Maximum number of recommended products to display (1-12).', 'zerosoft-upsell-engine-for-woocommerce')]
        );

        add_settings_field(
            'upsell_smart_layout',
            __('Display Layout', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_layout_field'],
            $option_page,
            'upsell_smart_display'
        );

        add_settings_field(
            'upsell_smart_pages',
            __('Display On Pages', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_pages_field'],
            $option_page,
            'upsell_smart_pages_section'
        );

        add_settings_field(
            'upsell_smart_display_positions',
            __('Display Hook Position', 'zerosoft-upsell-engine-for-woocommerce'),
            [$this, 'render_display_positions_field'],
            $option_page,
            'upsell_smart_pages_section'
        );
    }

    /**
     * Render the main settings page
     */
    public function render_settings_page(): void {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have permission to access this page.', 'zerosoft-upsell-engine-for-woocommerce'));
        }

        // Show admin notice if settings were saved
        $settings_updated = filter_input(INPUT_GET, 'settings-updated', FILTER_VALIDATE_BOOLEAN);
        if ($settings_updated) {
            add_settings_error('upsell_smart_messages', 'upsell_smart_message', __('Settings saved successfully.', 'zerosoft-upsell-engine-for-woocommerce'), 'success');
        }

        settings_errors('upsell_smart_messages');
        ?>
        <div class="wrap">
            <div class="upsell-admin-header">
                <div class="upsell-admin-header__brand">
                    <span class="upsell-admin-header__logo" aria-hidden="true">&#128722;</span>
                    <div>
                        <h1 class="upsell-admin-header__title"><?php echo esc_html( SMART_UPSELL_ADMIN_NAME ); ?></h1>
                        <span class="upsell-admin-header__version"><?php echo esc_html( 'v1.0' ); ?></span>
                    </div>
                </div>
                <nav class="upsell-admin-header__nav" aria-label="<?php esc_attr_e( 'Smart Upsell navigation', 'zerosoft-upsell-engine-for-woocommerce' ); ?>">
                    <a class="upsell-admin-header__tab" href="<?php echo esc_url( admin_url( 'admin.php?page=upsell-engine' ) ); ?>">
                        <?php esc_html_e( 'Campaigns', 'zerosoft-upsell-engine-for-woocommerce' ); ?>
                    </a>
                    <a class="upsell-admin-header__tab upsell-admin-header__tab--active" href="<?php echo esc_url( admin_url( 'admin.php?page=upsell-smart-recommendations' ) ); ?>" aria-current="page">
                        <?php esc_html_e( 'Recommendation', 'zerosoft-upsell-engine-for-woocommerce' ); ?>
                    </a>
                </nav>
            </div>
            <form method="post" action="options.php" class="upsell-settings-form">
                <?php
                settings_fields('upsell-smart-settings');
                do_settings_sections('upsell-smart-settings');
                submit_button(esc_html__('Save Settings', 'zerosoft-upsell-engine-for-woocommerce'));
                ?>
            </form>
        </div>
        <?php
    }

    /**
     * Render general settings section description
     */
    public function render_general_section(): void {
        echo '<p>' . esc_html(__('Control the overall Smart Recommendations feature.', 'zerosoft-upsell-engine-for-woocommerce')) . '</p>';
    }

    /**
     * Render sources section description
     */
    public function render_sources_section(): void {
        echo '';
    }

    /**
     * Render display section description
     */
    public function render_display_section(): void {
        echo '<p>' . esc_html(__('Configure how recommendations appear to customers.', 'zerosoft-upsell-engine-for-woocommerce')) . '</p>';
    }

    /**
     * Render pages section description
     */
    public function render_pages_section(): void {
        echo '<p>' . esc_html(__('Choose which pages should display Smart Recommendations.', 'zerosoft-upsell-engine-for-woocommerce')) . '</p>';
    }

    /**
     * Render checkbox field with toggle style
     */
    public function render_checkbox_field($args): void {
        $option_name = $args['name'] ?? '';
        $current = get_option($option_name);
        $description = $args['description'] ?? '';
        ?>
        <label class="toggler-checkbox">
            <input type="checkbox" name="<?php echo esc_attr($option_name); ?>" value="1" <?php checked(1, $current); ?> />
            <span class="toggler-slider"></span>
        </label>
        <?php
        if ($description) {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
    }

    /**
     * Render sources checkbox group
     */
    public function render_sources_field(): void {
        $current = get_option('upsell_smart_sources', $this->get_default_sources());
        $sources = array_intersect_key([
            'category' => __('Recommend by Category', 'zerosoft-upsell-engine-for-woocommerce'),
            'tags'     => __('Recommend by Tags', 'zerosoft-upsell-engine-for-woocommerce'),
        ], array_flip(smart_upsell_allowed_smart_sources()));

        echo '<div class="upsell-checkbox-group upsell-checkbox-group--stacked">';
        foreach ($sources as $key => $label) {
            $checked = !empty($current) && in_array($key, (array) $current);
            ?>
            <label>
                <input type="checkbox" name="upsell_smart_sources[]" value="<?php echo esc_attr($key); ?>" <?php checked($checked, true); ?> />
                <span><?php echo esc_html($label); ?></span>
            </label>
            <?php
        }
        echo '</div>';
    }

    /**
     * Render number field
     */
    public function render_number_field($args): void {
        $option_name = $args['name'] ?? '';
        $current = get_option($option_name);
        $min = $args['min'] ?? 1;
        $max = $args['max'] ?? 12;
        $description = $args['description'] ?? '';
        ?>
        <input type="number" name="<?php echo esc_attr($option_name); ?>" value="<?php echo esc_attr($current); ?>" min="<?php echo esc_attr($min); ?>" max="<?php echo esc_attr($max); ?>" class="small-text" />
        <?php
        if ($description) {
            echo '<p class="description">' . esc_html($description) . '</p>';
        }
    }

    /**
     * Render layout dropdown
     */
    public function render_layout_field(): void {
        $current = get_option('upsell_smart_layout', 'grid');
        $layouts = [
            'grid'   => __('Grid', 'zerosoft-upsell-engine-for-woocommerce'),
            'slider' => __('Slider', 'zerosoft-upsell-engine-for-woocommerce'),
        ];
        $allowed_layouts = smart_upsell_allowed_smart_layouts();
        $layouts = array_intersect_key($layouts, array_flip($allowed_layouts));
        if (!isset($layouts[$current])) {
            $current = array_key_first($layouts) ?: 'grid';
        }
        ?>
        <select name="upsell_smart_layout" class="regular-text">
            <?php
            foreach ($layouts as $key => $label) {
                echo '<option value="' . esc_attr($key) . '" ' . selected($current, $key, false) . '>' . esc_html($label) . '</option>';
            }
            ?>
        </select>
        <p class="description"><?php esc_html_e('Choose how to display recommended products.', 'zerosoft-upsell-engine-for-woocommerce'); ?></p>
        <?php
    }

    /**
     * Render pages checkbox group
     */
    public function render_pages_field(): void {
        $current = get_option('upsell_smart_pages', $this->get_default_pages());
        $pages = self::get_available_pages();

        echo '<div class="upsell-checkbox-group">';
        foreach ($pages as $key => $label) {
            $checked = !empty($current) && in_array($key, (array) $current);
            ?>
            <label>
                <input type="checkbox" name="upsell_smart_pages[]" value="<?php echo esc_attr($key); ?>" <?php checked($checked, true); ?> />
                <span><?php echo esc_html($label); ?></span>
            </label>
            <?php
        }
        echo '</div>';
    }

    public function render_display_positions_field(): void {
        $pages = get_option('upsell_smart_pages', $this->get_default_pages());
        $positions = get_option('upsell_smart_display_positions', $this->get_default_display_positions());
        $hook_options = $this->get_display_hook_options();

        if (empty($pages)) {
            echo '<p class="description">' . esc_html__('Select at least one page above to choose hook positions.', 'zerosoft-upsell-engine-for-woocommerce') . '</p>';
            return;
        }

        echo '<div class="upsell-checkbox-group">';
        foreach ((array) $pages as $page) {
            if (empty($hook_options[$page])) {
                continue;
            }

            $current = $positions[$page] ?? ($this->get_default_display_positions()[$page] ?? '');
            echo '<label style="display:block; align-items:initial;">';
            echo '<span style="display:block; font-weight:600; margin-bottom:6px;">' . esc_html(self::get_available_pages()[$page] ?? $page) . '</span>';
            echo '<select name="upsell_smart_display_positions[' . esc_attr($page) . ']" class="regular-text">';
            foreach ($hook_options[$page] as $value => $label) {
                echo '<option value="' . esc_attr($value) . '" ' . selected($current, $value, false) . '>' . esc_html($label) . '</option>';
            }
            echo '</select>';
            echo '</label>';
        }
        echo '</div>';
        echo '<p class="description">' . esc_html__('Choose the exact WooCommerce hook for Smart Recommendations on each selected page.', 'zerosoft-upsell-engine-for-woocommerce') . '</p>';
    }

    /**
     * Sanitize sources array
     */
    public function sanitize_sources($value): array {
        return smart_upsell_sanitize_smart_sources($value);
    }

    /**
     * Sanitize layout value
     */
    public function sanitize_layout($value): string {
        $allowed = smart_upsell_allowed_smart_layouts();
        $fallback = $allowed[0] ?? 'grid';
        return in_array($value, $allowed, true) ? $value : $fallback;
    }

    /**
     * Sanitize pages array
     */
    public function sanitize_pages($value): array {
        if (!is_array($value)) {
            return $this->get_default_pages();
        }

        $pages = smart_upsell_sanitize_pages($value, smart_upsell_allowed_smart_pages());
        return !empty($pages) ? $pages : $this->get_default_pages();
    }

    public function sanitize_display_positions($value): array {
        return self::sanitize_display_positions_map($value);
    }

    public static function sanitize_display_positions_map($value): array {
        if (!is_array($value)) {
            return self::get_default_display_positions();
        }

        $defaults = self::get_default_display_positions();
        $options = self::get_display_hook_options();
        $sanitized = [];

        foreach ($value as $page => $hook) {
            $page = sanitize_key((string) $page);
            $hook = sanitize_text_field((string) $hook);

            if (empty($options[$page])) {
                continue;
            }

            if (!array_key_exists($hook, $options[$page])) {
                $hook = $defaults[$page] ?? '';
            }

            if ($hook !== '') {
                $sanitized[$page] = $hook;
            }
        }

        foreach ($defaults as $page => $hook) {
            if (empty($sanitized[$page])) {
                $sanitized[$page] = $hook;
            }
        }

        return $sanitized;
    }

    /**
     * Get default sources
     */
    public static function get_default_sources(): array {
        return smart_upsell_sanitize_smart_sources(['category', 'tags']);
    }

    /**
     * Get default pages
     */
    public static function get_default_pages(): array {
        return smart_upsell_allowed_smart_pages();
    }

    public static function get_default_display_positions(): array {
        return smart_upsell_default_positions_from_hooks(self::get_display_hook_map());
    }

    private static function get_display_hook_map(): array {
        return smart_upsell_allowed_smart_hooks();
    }

    public static function get_display_hook_options(): array {
        $labels = [
            'woocommerce_after_add_to_cart_form'       => __('After add to cart form', 'zerosoft-upsell-engine-for-woocommerce'),
            'woocommerce_single_product_summary'       => __('Inside product summary', 'zerosoft-upsell-engine-for-woocommerce'),
            'woocommerce_before_cart_totals'           => __('Before cart totals', 'zerosoft-upsell-engine-for-woocommerce'),
            'woocommerce_after_cart_totals'            => __('After cart totals', 'zerosoft-upsell-engine-for-woocommerce'),
        ];

        $options = [];
        foreach (self::get_display_hook_map() as $page => $hooks) {
            foreach ((array) $hooks as $hook) {
                if (isset($labels[$hook])) {
                    $options[$page][$hook] = $labels[$hook];
                }
            }
        }

        return $options;
    }

    /**
     * Get all available recommendation sources
     */
    public static function get_available_sources(): array {
        return [
            'category' => __('Category', 'zerosoft-upsell-engine-for-woocommerce'),
            'tags'     => __('Tags', 'zerosoft-upsell-engine-for-woocommerce'),
        ];
    }

    public static function get_available_sources_filtered(): array {
        $sources = self::get_available_sources();
        $allowed = smart_upsell_allowed_smart_sources();
        return array_intersect_key($sources, array_flip($allowed));
    }

    /**
     * Get all available pages
     */
    public static function get_available_pages(): array {
        $pages = [
            'product'  => __('Product', 'zerosoft-upsell-engine-for-woocommerce'),
            'cart'     => __('Cart', 'zerosoft-upsell-engine-for-woocommerce'),
        ];
        return array_intersect_key($pages, array_flip(smart_upsell_allowed_smart_pages()));
    }

}
