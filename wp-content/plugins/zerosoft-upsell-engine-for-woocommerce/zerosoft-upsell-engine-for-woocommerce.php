<?php
/**
 * Plugin Name: Zerosoft Upsell Engine for WooCommerce
 * Description: Smart upsell, cross-sell, and recommendation engine for WooCommerce.
 * Version: 1.0.0
 * Author: zerosoft
 * Author URI: https://www.zerosofttech.com/
 * Text Domain: zerosoft-upsell-engine-for-woocommerce
 * Domain Path: /languages
 * Requires at least: 6.4
 * Requires PHP: 7.4
 * Requires Plugins: woocommerce
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if (!defined('ABSPATH')) {
    exit;
}

define('UPSELL_PLUGIN_VERSION', '1.0.0');
define('UPSELL_DB_VERSION', '1.8');
define('UPSELL_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('UPSELL_PLUGIN_URL', plugin_dir_url(__FILE__));
define('SMART_UPSELL_PLUGIN_NAME', 'Zerosoft Upsell Engine for WooCommerce');
define('SMART_UPSELL_ADMIN_NAME', 'Smart Upsell');
define('UPSELL_REQUIRED_CAPABILITY', 'manage_options');

function smart_upsell_is_woocommerce_active(): bool {
    return class_exists('WooCommerce');
}

function smart_upsell_debug_log(string $message): void {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Debug logging is gated behind WP_DEBUG.
        error_log($message);
    }
}

function smart_upsell_load_textdomain(): void {
    // WordPress loads bundled translations automatically for the plugin text domain.
}

function smart_upsell_admin_notice_missing_woocommerce(): void {
    if (!current_user_can('activate_plugins')) {
        return;
    }

    echo '<div class="notice notice-error"><p>';
    echo esc_html__('Zerosoft Upsell Engine for WooCommerce requires WooCommerce to be installed and active.', 'zerosoft-upsell-engine-for-woocommerce');
    echo '</p></div>';
}

function smart_upsell_bootstrap(): void {
    smart_upsell_load_textdomain();

    if (!smart_upsell_is_woocommerce_active()) {
        if (is_admin()) {
            add_action('admin_notices', 'smart_upsell_admin_notice_missing_woocommerce');
        }
        smart_upsell_debug_log('[upsell] WooCommerce not active, plugin bootstrap skipped.');
        return;
    }

    if (is_admin()) {
        new Upsell_Smart_Settings();
    }

    new Upsell_Display_Hooks();
    smart_upsell_debug_log('[upsell] Smart Recommendations Loaded');
}

function smart_upsell_allowed_pages(): array {
    return ['product', 'cart'];
}

function smart_upsell_allowed_smart_pages(): array {
    return ['product', 'cart'];
}

function smart_upsell_allowed_condition_types(): array {
    return ['product', 'category', 'tag'];
}

function smart_upsell_allowed_rule_hooks(): array {
    return [
        'product' => [
            'woocommerce_after_add_to_cart_form',
            'woocommerce_single_product_summary',
        ],
        'cart' => [
            'woocommerce_before_cart_totals',
            'woocommerce_after_cart_totals',
        ],
    ];
}

function smart_upsell_allowed_smart_sources(): array {
    return ['category', 'tags'];
}

function smart_upsell_allowed_smart_hooks(): array {
    return [
        'product' => [
            'woocommerce_after_add_to_cart_form',
            'woocommerce_single_product_summary',
        ],
        'cart' => [
            'woocommerce_before_cart_totals',
            'woocommerce_after_cart_totals',
        ],
    ];
}

function smart_upsell_allowed_smart_layouts(): array {
    return ['grid', 'slider'];
}

function smart_upsell_default_positions_from_hooks(array $allowed_hooks): array {
    $defaults = [];
    foreach ($allowed_hooks as $page => $hooks) {
        if (!empty($hooks) && is_array($hooks)) {
            $defaults[$page] = (string) reset($hooks);
        }
    }

    return $defaults;
}

function smart_upsell_sanitize_pages(array $pages, ?array $allowed_pages = null): array {
    $allowed_pages = is_array($allowed_pages) ? $allowed_pages : smart_upsell_allowed_pages();
    $pages = array_map('sanitize_key', $pages);
    return array_values(array_unique(array_values(array_intersect($pages, $allowed_pages))));
}

function smart_upsell_sanitize_condition_type(?string $condition_type): string {
    $condition_type = sanitize_key((string) $condition_type);
    return in_array($condition_type, smart_upsell_allowed_condition_types(), true) ? $condition_type : 'product';
}

function smart_upsell_sanitize_priority($priority): int {
    return (int) $priority;
}

function smart_upsell_sanitize_rule_display_positions($positions, array $display_pages = []): array {
    $allowed  = smart_upsell_allowed_rule_hooks();
    $defaults = smart_upsell_default_positions_from_hooks($allowed);

    if (!is_array($positions)) {
        $positions = [];
    }
    $display_pages = smart_upsell_sanitize_pages($display_pages);

    $out = [];
    foreach ($display_pages as $page) {
        if (empty($allowed[$page])) {
            continue;
        }

        $value = isset($positions[$page]) ? sanitize_text_field((string) $positions[$page]) : '';
        $out[$page] = (!empty($value) && in_array($value, $allowed[$page], true))
            ? $value
            : ($defaults[$page] ?? '');
    }

    return $out;
}

function smart_upsell_sanitize_smart_sources($sources): array {
    if (!is_array($sources)) {
        $sources = [];
    }

    $allowed = smart_upsell_allowed_smart_sources();
    $sources = array_map('sanitize_key', $sources);
    $sources = array_values(array_unique(array_values(array_intersect($sources, $allowed))));

    return !empty($sources) ? $sources : array_values(array_filter(['category', 'tags'], static function ($source) use ($allowed) {
        return in_array($source, $allowed, true);
    }));
}

require_once UPSELL_PLUGIN_DIR . 'includes/class-upsell-smart-recommendations.php';
require_once UPSELL_PLUGIN_DIR . 'includes/class-upsell-rules-engine.php';
require_once UPSELL_PLUGIN_DIR . 'includes/class-upsell-display-hooks.php';
require_once UPSELL_PLUGIN_DIR . 'includes/admin/class-upsell-smart-settings.php';

add_action('plugins_loaded', 'smart_upsell_bootstrap');

// ACTIVATION / DB
register_activation_hook(__FILE__, 'upsell_plugin_activate');
register_deactivation_hook(__FILE__, 'upsell_plugin_deactivate');
function upsell_plugin_activate(): void {
    upsell_create_tables();
    upsell_set_default_settings();
    update_option('upsell_db_version', UPSELL_DB_VERSION);
}

function upsell_plugin_deactivate(): void {
    delete_transient('upsell_rules_engine_cache');
}

function upsell_set_default_settings(): void {
    if (false === get_option('upsell_smart_enabled', false)) {
        add_option('upsell_smart_enabled', true);
    }
    if (false === get_option('upsell_smart_sources', false)) {
        add_option('upsell_smart_sources', Upsell_Smart_Settings::get_default_sources());
    }
    if (false === get_option('upsell_smart_limit', false)) {
        add_option('upsell_smart_limit', 4);
    }
    if (false === get_option('upsell_smart_layout', false)) {
        add_option('upsell_smart_layout', 'grid');
    }
    if (false === get_option('upsell_smart_pages', false)) {
        add_option('upsell_smart_pages', Upsell_Smart_Settings::get_default_pages());
    }
    if (false === get_option('upsell_smart_display_positions', false)) {
        add_option('upsell_smart_display_positions', Upsell_Smart_Settings::get_default_display_positions());
    }

    $saved_sources = smart_upsell_sanitize_smart_sources((array) get_option('upsell_smart_sources', []));
    update_option('upsell_smart_sources', $saved_sources);
    $saved_pages = smart_upsell_sanitize_pages((array) get_option('upsell_smart_pages', []), smart_upsell_allowed_smart_pages());
    if (empty($saved_pages)) {
        $saved_pages = Upsell_Smart_Settings::get_default_pages();
    }
    update_option('upsell_smart_pages', $saved_pages);

    $saved_positions = get_option('upsell_smart_display_positions', []);
    if (!is_array($saved_positions)) {
        $saved_positions = [];
    }
    $defaults = Upsell_Smart_Settings::get_default_display_positions();
    $sanitized_positions = [];
    foreach ($saved_pages as $page) {
        $sanitized_positions[$page] = $saved_positions[$page] ?? ($defaults[$page] ?? '');
    }
    update_option('upsell_smart_display_positions', Upsell_Smart_Settings::sanitize_display_positions_map($sanitized_positions));
}

function upsell_create_tables(): void {
    global $wpdb;
    $c = $wpdb->get_charset_collate();
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    dbDelta("CREATE TABLE IF NOT EXISTS {$wpdb->prefix}upsell_rules (
        id                BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        rule_name         VARCHAR(255)        NOT NULL,
        rule_type         ENUM('upsell','cross_sell') NOT NULL DEFAULT 'upsell',
        condition_type    ENUM('product','category','tag') NOT NULL DEFAULT 'product',
        condition_value   TEXT                NOT NULL,
        recommended_product_ids LONGTEXT      NULL,
        display_pages     TEXT                NOT NULL,
        display_positions TEXT                NULL,
        priority          INT(11)             NOT NULL DEFAULT 0,
        status            TINYINT(1)          NOT NULL DEFAULT 1,
        created_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id), 
        KEY rule_type (rule_type), 
        KEY status (status)
    ) $c;");

}

function upsell_add_missing_columns() {
    global $wpdb;
    $table = esc_sql($wpdb->prefix . 'upsell_rules');

    // Check if table exists
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Schema inspection is required during plugin upgrades.
    $table_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table));
    if (!$table_exists) {
        return;
    }

    // Get existing columns
    // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Table name is derived from $wpdb->prefix and a fixed suffix, and this reads schema metadata for the plugin table.
    $existing_columns = $wpdb->get_col("SHOW COLUMNS FROM {$table}");

    // Add display_positions column if missing
    if (!in_array('display_positions', $existing_columns)) {
        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange -- Table name is derived from $wpdb->prefix and a fixed suffix, and this is a controlled schema migration for the plugin's own table.
        $wpdb->query("ALTER TABLE {$table} ADD COLUMN display_positions TEXT NULL");
    }

    if (!in_array('recommended_product_ids', $existing_columns, true)) {
        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange -- Table name is derived from $wpdb->prefix and a fixed suffix, and this is a controlled schema migration for the plugin's own table.
        $wpdb->query("ALTER TABLE {$table} ADD COLUMN recommended_product_ids LONGTEXT NULL");
    }
}

// Run column fix on admin_init and plugins_loaded
add_action('admin_init', 'upsell_add_missing_columns');
add_action('plugins_loaded', 'upsell_add_missing_columns');

add_action('plugins_loaded', 'upsell_check_db_version');
function upsell_check_db_version(): void {
    if (get_option('upsell_db_version') === UPSELL_DB_VERSION) return;

    upsell_create_tables();
    upsell_add_missing_columns();
    upsell_migrate_display_positions();
    upsell_migrate_recommendation_products();
    upsell_migrate_related_rule_type();
    update_option('upsell_db_version', UPSELL_DB_VERSION);
}

function upsell_migrate_related_rule_type(): void {
    global $wpdb;
    $table = $wpdb->prefix . 'upsell_rules';
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is derived from $wpdb->prefix with a fixed suffix; migrates legacy 'related' rule_type rows to 'upsell'.
    $wpdb->query(
        "UPDATE {$table} SET rule_type = 'upsell' WHERE rule_type = 'related'"
    );
}

function upsell_migrate_display_positions(): void {
    global $wpdb;
    $table    = esc_sql($wpdb->prefix . 'upsell_rules');
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name is derived from $wpdb->prefix with a fixed suffix.
    $rules    = $wpdb->get_results("SELECT id, display_pages, display_positions FROM {$table}");
    $defaults = upsell_default_display_positions();

    foreach ($rules as $rule) {
        $pages     = json_decode($rule->display_pages, true) ?: [];
        $positions = json_decode($rule->display_positions, true) ?: [];
        $changed   = false;

        foreach ($pages as $page) {
            if (empty($positions[$page]) && isset($defaults[$page])) {
                $positions[$page] = $defaults[$page];
                $changed          = true;
            }
        }
        if ($changed || empty($positions)) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Updates this plugin's custom rules table during a migration step.
            $wpdb->update($table, ['display_positions' => upsell_json_encode($positions)], ['id' => (int) $rule->id], ['%s'], ['%d']);
        }
    }
}

function upsell_migrate_recommendation_products(): void {
    global $wpdb;

    $rules_table = esc_sql($wpdb->prefix . 'upsell_rules');
    $recommendations_table = esc_sql($wpdb->prefix . 'upsell_recommendations');

    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Schema inspection is required during plugin upgrades.
    $recommendations_table_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $recommendations_table));
    if (!$recommendations_table_exists) {
        return;
    }

    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table names are derived from $wpdb->prefix with fixed suffixes for plugin-owned tables.
    $rules = $wpdb->get_results("SELECT id, recommended_product_ids FROM {$rules_table}");

    foreach ($rules as $rule) {
        $existing_ids = upsell_sanitize_recommended_product_ids(json_decode((string) ($rule->recommended_product_ids ?? '[]'), true));
        if (!empty($existing_ids)) {
            continue;
        }

        // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Reads legacy recommendation rows from this plugin's old table during a one-time migration.
        $rows = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT recommended_product_ids
                 FROM {$recommendations_table}
                 WHERE rule_id = %d
                 ORDER BY sort_order ASC, id ASC",
                (int) $rule->id
            )
        );
        // phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

        $recommended_ids = [];
        foreach ($rows as $row) {
            $recommended_ids = upsell_sanitize_recommended_product_ids(json_decode((string) ($row->recommended_product_ids ?? '[]'), true));
            if (!empty($recommended_ids)) {
                break;
            }
        }

        if (empty($recommended_ids)) {
            continue;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Updates this plugin's custom rules table during a migration step.
        $wpdb->update(
            $rules_table,
            ['recommended_product_ids' => upsell_json_encode($recommended_ids)],
            ['id' => (int) $rule->id],
            ['%s'],
            ['%d']
        );
    }
}

// ADMIN
add_action('admin_menu', function () {
    add_menu_page(
        SMART_UPSELL_ADMIN_NAME,
        SMART_UPSELL_ADMIN_NAME,
        'manage_options',
        'upsell-engine',
        function () {
            if (!current_user_can(UPSELL_REQUIRED_CAPABILITY)) {
                wp_die(esc_html__('You do not have permission to access this page.', 'zerosoft-upsell-engine-for-woocommerce'));
            }

            echo '<div class="wrap"><div id="upsell-admin-root"></div></div>';
        },
        'dashicons-cart',
        58
    );

    add_submenu_page('upsell-engine', __('Upsell & Cross-Sell', 'zerosoft-upsell-engine-for-woocommerce'), __('Upsell & Cross-Sell', 'zerosoft-upsell-engine-for-woocommerce'), 'manage_options', 'upsell-engine', function () {
        if (!current_user_can(UPSELL_REQUIRED_CAPABILITY)) {
            wp_die(esc_html__('You do not have permission to access this page.', 'zerosoft-upsell-engine-for-woocommerce'));
        }

        echo '<div class="wrap"><div id="upsell-admin-root"></div></div>';
    });
});

add_action('admin_enqueue_scripts', function ($hook) {
    if (!in_array($hook, ['toplevel_page_upsell-engine', 'upsell-engine_page_upsell-engine'], true) || !current_user_can(UPSELL_REQUIRED_CAPABILITY)) {
        return;
    }

    $asset_file = UPSELL_PLUGIN_DIR . 'admin-ui/build/admin-ui/index.asset.php';
    if (file_exists($asset_file)) {
        $a = include $asset_file;
        wp_enqueue_script('upsell-admin-js', UPSELL_PLUGIN_URL . 'admin-ui/build/admin-ui/index.js', $a['dependencies'], $a['version'], true);
        wp_enqueue_style('upsell-admin-css', UPSELL_PLUGIN_URL . 'admin-ui/build/admin-ui/index.css', [], $a['version']);
        wp_add_inline_style(
            'upsell-admin-css',
            '.ue-summary-row__label{flex-shrink:0}.ue-summary-row__value{min-width:0;overflow-wrap:anywhere;word-break:break-word}'
        );
     wp_localize_script('upsell-admin-js', 'upsellData', [
    'apiBase'    => rest_url('upsell/v1'),
    'nonce'      => wp_create_nonce('wp_rest'),
    'pluginUrl'  => UPSELL_PLUGIN_URL,
    'branding'   => [
        'pluginName' => SMART_UPSELL_PLUGIN_NAME,
        'adminName'  => SMART_UPSELL_ADMIN_NAME,
    ],
    'recommendationPageUrl' => admin_url('admin.php?page=upsell-smart-recommendations'),
    'currency'   => [
        'symbol'   => html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES, 'UTF-8' ),
        'position' => get_option( 'woocommerce_currency_pos', 'left' ),
    ],
   ]);
    }
});

function upsell_admin_permission(): bool {
    return current_user_can(UPSELL_REQUIRED_CAPABILITY);
}

function upsell_json_encode($value): string {
    return (string) wp_json_encode($value);
}

// =========================================================
// REST API - FIXED for partial updates
// =========================================================
add_action('rest_api_init', 'upsell_register_rest_routes');
function upsell_register_rest_routes(): void {
    $ns = 'upsell/v1';
    $ap = 'upsell_admin_permission';

    register_rest_route($ns, '/rules', [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'upsell_api_get_rules',
            'permission_callback' => $ap
        ],
        [
            'methods'             => WP_REST_Server::CREATABLE,
            'callback'            => 'upsell_api_create_rule',
            'permission_callback' => $ap,
            'args'                => upsell_rule_args()
        ]
    ]);

    register_rest_route($ns, '/rules/(?P<id>\d+)', [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'upsell_api_get_rule',
            'permission_callback' => $ap
        ],
        [
            'methods'             => WP_REST_Server::EDITABLE,
            'callback'            => 'upsell_api_update_rule',
            'permission_callback' => $ap,
            'args'                => upsell_update_rule_args()
        ],
        [
            'methods'             => WP_REST_Server::DELETABLE,
            'callback'            => 'upsell_api_delete_rule',
            'permission_callback' => $ap
        ]
    ]);

    register_rest_route($ns, '/products/search', [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'upsell_api_search_products',
            'permission_callback' => $ap,
            'args'                => ['search' => ['required' => false, 'type' => 'string']]
        ]
    ]);

    register_rest_route($ns, '/products/by-ids', [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'upsell_api_get_products_by_ids',
            'permission_callback' => $ap,
            'args'                => ['ids' => ['required' => true, 'type' => 'string']]
        ]
    ]);

    register_rest_route($ns, '/products/by-category', [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'upsell_api_get_products_by_category',
            'permission_callback' => $ap,
            'args'                => ['category_id' => ['required' => true, 'type' => 'integer']]
        ]
    ]);

    register_rest_route($ns, '/categories/search', [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'upsell_api_search_categories',
            'permission_callback' => $ap,
            'args'                => ['search' => ['required' => false, 'type' => 'string']]
        ]
    ]);

    register_rest_route($ns, '/tags/search', [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'upsell_api_search_tags',
            'permission_callback' => $ap,
            'args'                => ['search' => ['required' => false, 'type' => 'string']]
        ]
    ]);

    register_rest_route($ns, '/terms/by-ids', [
        [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => 'upsell_api_get_terms_by_ids',
            'permission_callback' => $ap,
            'args' => [
                'ids'      => ['required' => true, 'type' => 'string'],
                'taxonomy' => ['required' => true, 'type' => 'string', 'enum' => ['product_cat', 'product_tag']]
            ]
        ]
    ]);

}

// =========================================================
// SCHEMA HELPERS
// =========================================================

function upsell_rule_args(): array {
    return [
        'rule_name'         => ['required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_text_field'],
        'rule_type'         => ['required' => true,  'type' => 'string',  'enum' => ['upsell','cross_sell']],
        'condition_type'    => ['required' => true,  'type' => 'string',  'enum' => ['product','category','tag']],
        'condition_value'   => ['required' => true,  'type' => 'string'],
        'recommended_product_ids' => ['required' => true, 'type' => 'array', 'items' => ['type' => 'integer']],
        'display_pages'     => ['required' => true,  'type' => 'array',   'items' => ['type' => 'string']],
        'display_positions' => ['required' => false, 'type' => 'object'],
        'priority'          => ['required' => false, 'type' => 'integer', 'default' => 0],
        'status'            => ['required' => false, 'type' => 'integer', 'default' => 1],
    ];
}

function upsell_update_rule_args(): array {
    return [
        'rule_name'         => ['required' => false, 'type' => 'string',  'sanitize_callback' => 'sanitize_text_field'],
        'rule_type'         => ['required' => false, 'type' => 'string',  'enum' => ['upsell', 'cross_sell']],
        'condition_type'    => ['required' => false, 'type' => 'string',  'enum' => ['product', 'category', 'tag']],
        'condition_value'   => ['required' => false, 'type' => 'string'],
        'recommended_product_ids' => ['required' => false, 'type' => 'array', 'items' => ['type' => 'integer']],
        'display_pages'     => ['required' => false, 'type' => 'array',   'items' => ['type' => 'string']],
        'display_positions' => ['required' => false, 'type' => 'object'],
        'priority'          => ['required' => false, 'type' => 'integer'],
        'status'            => ['required' => false, 'type' => 'integer'],
    ];
}

function upsell_default_display_positions(): array {
    return smart_upsell_default_positions_from_hooks(upsell_allowed_display_positions());
}

function upsell_allowed_display_positions(): array {
    return smart_upsell_allowed_rule_hooks();
}

function upsell_sanitize_display_positions($positions, array $display_pages = []): array {
    return smart_upsell_sanitize_rule_display_positions($positions, $display_pages);
}

function upsell_decode_rule(object $rule): object {
    $pages                   = smart_upsell_sanitize_pages(json_decode($rule->display_pages, true) ?? []);
    $rule->display_pages     = $pages;
    $raw_pos                 = json_decode($rule->display_positions ?? '', true) ?? [];
    $rule->display_positions = upsell_sanitize_display_positions($raw_pos, (array)$pages);
    $recommended_ids         = json_decode((string) ($rule->recommended_product_ids ?? '[]'), true);
    $rule->recommended_product_ids = upsell_sanitize_recommended_product_ids($recommended_ids);
    $rule->status            = (int) $rule->status;
    $rule->priority          = smart_upsell_sanitize_priority($rule->priority ?? 0);
    $rule->id                = (int) $rule->id;
    return $rule;
}

function upsell_rule_is_valid(object $rule): bool {
    if (empty($rule->display_pages)) {
        return false;
    }

    if (empty($rule->recommended_product_ids)) {
        return false;
    }

    return in_array((string) ($rule->condition_type ?? ''), smart_upsell_allowed_condition_types(), true);
}

// =========================================================
// RULES CRUD
// =========================================================
// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQL.NotPrepared

function upsell_api_get_rules(WP_REST_Request $req): WP_REST_Response {
    global $wpdb;
    $t      = $wpdb->prefix . 'upsell_rules';
    $status = $req->get_param('status');
    $where  = $status !== null ? $wpdb->prepare('WHERE status = %d', (int)$status) : '';
    $rules  = $wpdb->get_results("SELECT * FROM $t $where ORDER BY priority DESC, created_at DESC") ?: [];
    $decoded = array_map('upsell_decode_rule', $rules);
    $decoded = array_values(array_filter($decoded, 'upsell_rule_is_valid'));
    return rest_ensure_response($decoded);
}

function upsell_api_get_rule(WP_REST_Request $req): WP_REST_Response|WP_Error {
    global $wpdb;
    $rule = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}upsell_rules WHERE id = %d", (int)$req['id']));
    if (!$rule) {
        return new WP_Error('not_found', __('Rule not found', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 404]);
    }

    $decoded = upsell_decode_rule($rule);
    return upsell_rule_is_valid($decoded)
        ? rest_ensure_response($decoded)
        : new WP_Error('not_found', __('Rule not available', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 404]);
}

function upsell_api_create_rule(WP_REST_Request $req): WP_REST_Response|WP_Error {
    global $wpdb;
    $t      = $wpdb->prefix . 'upsell_rules';
    $pages  = smart_upsell_sanitize_pages((array) $req->get_param('display_pages'));
    if (empty($pages)) {
        return new WP_Error('invalid_pages', __('At least one allowed display page is required.', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 400]);
    }

    $condition_type = smart_upsell_sanitize_condition_type((string) $req->get_param('condition_type'));
    if ($condition_type !== (string) $req->get_param('condition_type')) {
        return new WP_Error('invalid_condition_type', __('This trigger type is not available.', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 400]);
    }

    $recommended_ids = upsell_sanitize_recommended_product_ids($req->get_param('recommended_product_ids'));
    if (empty($recommended_ids)) {
        return new WP_Error('invalid_recommended_products', __('At least one recommended product is required.', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 400]);
    }

    $pos    = is_array($req->get_param('display_positions')) ? $req->get_param('display_positions') : [];
    $defs   = upsell_default_display_positions();
    foreach ($pages as $pg) {
        if (empty($pos[$pg])) {
            $pos[$pg] = $defs[$pg] ?? '';
        }
    }

    $data = [
        'rule_name'         => sanitize_text_field((string) $req->get_param('rule_name')),
        'rule_type'         => sanitize_key((string) $req->get_param('rule_type')),
        'condition_type'    => $condition_type,
        'condition_value'   => sanitize_text_field((string) $req->get_param('condition_value')),
        'recommended_product_ids' => upsell_json_encode($recommended_ids),
        'display_pages'     => upsell_json_encode($pages),
        'display_positions' => upsell_json_encode(upsell_sanitize_display_positions($pos, $pages)),
        'priority'          => smart_upsell_sanitize_priority($req->get_param('priority') ?? 0),
        'status'            => (int)($req->get_param('status') ?? 1),
    ];

    $result = $wpdb->insert($t, $data);
    if ($result === false) {
        return new WP_Error('db_error', sprintf(
            /* translators: %s: database error message. */
            __('Could not create rule: %s', 'zerosoft-upsell-engine-for-woocommerce'),
            $wpdb->last_error
        ), ['status' => 500]);
    }

    $new = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id = %d", $wpdb->insert_id));
    Upsell_Rules_Engine::flush_rules_cache();
    return rest_ensure_response(upsell_decode_rule($new));
}

function upsell_api_update_rule(WP_REST_Request $req): WP_REST_Response|WP_Error {
    global $wpdb;
    $t  = $wpdb->prefix . 'upsell_rules';
    $id = (int)$req['id'];

    $existing = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id = %d", $id));
    if (!$existing) {
        return new WP_Error('not_found', __('Rule not found', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 404]);
    }

    $data = [];

    if ($req->has_param('rule_name')) {
        $data['rule_name'] = sanitize_text_field($req->get_param('rule_name'));
    }

    if ($req->has_param('rule_type')) {
        $rule_type = $req->get_param('rule_type');
        if (in_array($rule_type, ['upsell', 'cross_sell'])) {
            $data['rule_type'] = $rule_type;
        }
    }

    if ($req->has_param('condition_type')) {
        $cond_type = smart_upsell_sanitize_condition_type((string) $req->get_param('condition_type'));
        if ($cond_type !== (string) $req->get_param('condition_type')) {
            return new WP_Error('invalid_condition_type', __('This trigger type is not available.', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 400]);
        }
        $data['condition_type'] = $cond_type;
    }

    if ($req->has_param('condition_value')) {
        $data['condition_value'] = sanitize_text_field((string) $req->get_param('condition_value'));
    }

    if ($req->has_param('recommended_product_ids')) {
        $recommended_ids = upsell_sanitize_recommended_product_ids($req->get_param('recommended_product_ids'));
        if (empty($recommended_ids)) {
            return new WP_Error('invalid_recommended_products', __('At least one recommended product is required.', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 400]);
        }
        $data['recommended_product_ids'] = upsell_json_encode($recommended_ids);
    }

    if ($req->has_param('priority')) {
        $data['priority'] = smart_upsell_sanitize_priority($req->get_param('priority'));
    }

    if ($req->has_param('status')) {
        $data['status'] = (int)$req->get_param('status');
    }

    if ($req->has_param('display_pages')) {
        $pages = smart_upsell_sanitize_pages((array) $req->get_param('display_pages'));
        if (empty($pages)) {
            return new WP_Error('invalid_pages', __('At least one allowed display page is required.', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 400]);
        }

        $data['display_pages'] = upsell_json_encode($pages);

        $positions = [];
        if ($req->has_param('display_positions')) {
            $positions = (array) $req->get_param('display_positions');
        } elseif (isset($existing->display_positions) && $existing->display_positions) {
            $positions = json_decode($existing->display_positions, true) ?: [];
        }

        $data['display_positions'] = upsell_json_encode(upsell_sanitize_display_positions($positions, $pages));
    } elseif ($req->has_param('display_positions')) {
        $pages = smart_upsell_sanitize_pages(json_decode($existing->display_pages, true) ?: []);
        $positions = (array) $req->get_param('display_positions');
        $data['display_positions'] = upsell_json_encode(upsell_sanitize_display_positions($positions, $pages));
    }

    if (empty($data)) {
        return rest_ensure_response(upsell_decode_rule($existing));
    }

    $result = $wpdb->update($t, $data, ['id' => $id]);

    if ($result === false) {
        return new WP_Error(
            'db_error',
            sprintf(
                /* translators: %s: database error message. */
                __('Could not update rule. Database error: %s', 'zerosoft-upsell-engine-for-woocommerce'),
                $wpdb->last_error
            ),
            ['status' => 500]
        );
    }

    $updated = $wpdb->get_row($wpdb->prepare("SELECT * FROM $t WHERE id = %d", $id));
    Upsell_Rules_Engine::flush_rules_cache();

    return rest_ensure_response(upsell_decode_rule($updated));
}

function upsell_api_delete_rule(WP_REST_Request $req): WP_REST_Response|WP_Error {
    global $wpdb;
    $id = (int)$req['id'];
    $result = $wpdb->delete($wpdb->prefix . 'upsell_rules', ['id' => $id], ['%d']);
    if ($result === false) {
        return new WP_Error('db_error', __('Could not delete rule', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 500]);
    }
    Upsell_Rules_Engine::flush_rules_cache();
    return rest_ensure_response(['deleted' => true, 'id' => $id]);
}

// =========================================================
// PRODUCT / CATEGORY / TAG ENDPOINTS
// =========================================================

function upsell_api_search_products(WP_REST_Request $req): WP_REST_Response|WP_Error {
// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQL.NotPrepared
    if (!class_exists('WooCommerce')) {
        return new WP_Error('woocommerce_missing', __('WooCommerce not active', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 500]);
    }

    $search = sanitize_text_field($req->get_param('search') ?? '');
    // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- Product lookup is intentionally filtered by taxonomy for this endpoint.
    $ids = get_posts([
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => 20,
        's'              => $search,
        'fields'         => 'ids'
    ]);

    $out = [];
    foreach ($ids as $id) {
        $p = wc_get_product($id);
        if ($p) {
            $out[] = [
                'id'    => $id,
                'name'  => $p->get_name(),
                'price' => $p->get_price(),
                'image' => get_the_post_thumbnail_url($id, 'thumbnail'),
                'sku'   => $p->get_sku()
            ];
        }
    }
    return rest_ensure_response($out);
}

function upsell_api_search_categories(WP_REST_Request $req): WP_REST_Response {
    $search = sanitize_text_field($req->get_param('search') ?? '');
    $terms  = get_terms([
        'taxonomy'   => 'product_cat',
        'hide_empty' => false,
        'search'     => $search,
        'number'     => 20
    ]);

    if (is_wp_error($terms)) {
        return rest_ensure_response([]);
    }

    $result = array_map(function ($term) {
        return [
            'id'    => $term->term_id,
            'name'  => $term->name,
            'slug'  => $term->slug,
            'count' => $term->count
        ];
    }, $terms);

    return rest_ensure_response($result);
}

function upsell_api_search_tags(WP_REST_Request $req): WP_REST_Response {
    $search = sanitize_text_field($req->get_param('search') ?? '');
    $terms  = get_terms([
        'taxonomy'   => 'product_tag',
        'hide_empty' => false,
        'search'     => $search,
        'number'     => 20
    ]);

    if (is_wp_error($terms)) {
        return rest_ensure_response([]);
    }

    $result = array_map(function ($term) {
        return [
            'id'    => $term->term_id,
            'name'  => $term->name,
            'slug'  => $term->slug,
            'count' => $term->count
        ];
    }, $terms);

    return rest_ensure_response($result);
}

function upsell_api_get_products_by_ids(WP_REST_Request $req): WP_REST_Response {
    $ids_string = sanitize_text_field($req->get_param('ids') ?? '');
    $ids        = array_filter(array_map('intval', explode(',', $ids_string)));

    if (empty($ids)) {
        return rest_ensure_response([]);
    }

    $out = [];
    foreach ($ids as $id) {
        $p = wc_get_product($id);
        if ($p) {
            $out[] = [
                'id'    => $id,
                'name'  => $p->get_name(),
                'price' => $p->get_price(),
                'image' => get_the_post_thumbnail_url($id, 'thumbnail'),
                'sku'   => $p->get_sku()
            ];
        }
    }
    return rest_ensure_response($out);
}

function upsell_api_get_products_by_category(WP_REST_Request $req): WP_REST_Response {
    $cat = (int) $req->get_param('category_id');
    if (!$cat) {
        return rest_ensure_response([]);
    }

    $ids = get_posts([
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => 50,
        'fields'         => 'ids',
        // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- This endpoint intentionally filters products by category.
        'tax_query'      => [[
            'taxonomy' => 'product_cat',
            'field'    => 'term_id',
            'terms'    => $cat
        ]]
    ]);

    $out = [];
    foreach ($ids as $id) {
        $p = wc_get_product($id);
        if ($p) {
            $out[] = [
                'id'    => $id,
                'name'  => $p->get_name(),
                'price' => $p->get_price(),
                'image' => get_the_post_thumbnail_url($id, 'thumbnail'),
                'sku'   => $p->get_sku()
            ];
        }
    }
    return rest_ensure_response($out);
}

function upsell_api_get_terms_by_ids(WP_REST_Request $req): WP_REST_Response|WP_Error {
    $ids_string = sanitize_text_field($req->get_param('ids') ?? '');
    $ids        = array_filter(array_map('intval', explode(',', $ids_string)));
    $taxonomy   = sanitize_text_field($req->get_param('taxonomy'));

    if (empty($ids)) {
        return rest_ensure_response([]);
    }

    if (!in_array($taxonomy, ['product_cat', 'product_tag'])) {
        return new WP_Error('invalid_taxonomy', __('Invalid taxonomy', 'zerosoft-upsell-engine-for-woocommerce'), ['status' => 400]);
    }

    $terms = get_terms([
        'taxonomy'   => $taxonomy,
        'include'    => $ids,
        'hide_empty' => false
    ]);

    if (is_wp_error($terms)) {
        return rest_ensure_response([]);
    }

    $result = [];
    foreach ($terms as $term) {
        $result[] = [
            'id'    => $term->term_id,
            'name'  => $term->name,
            'slug'  => $term->slug,
            'count' => $term->count
        ];
    }

    return rest_ensure_response($result);
}

function upsell_sanitize_recommended_product_ids($ids): array {
    if (!is_array($ids)) {
        return [];
    }

    return array_values(array_unique(array_filter(array_map('intval', $ids))));
}

/**
 * Helper function to get Smart Recommendations settings
 *
 * @param string $key     Setting key
 * @param mixed  $default Default value if setting not found
 * @return mixed Setting value or default
 */
function upsell_get_smart_setting($key = '', $default = null) {
    if (empty($key)) {
        smart_upsell_debug_log('[upsell] get_smart_setting called with empty key');
        return $default;
    }

    $option_key = "upsell_smart_{$key}";
    $value      = get_option($option_key, $default);

    smart_upsell_debug_log(sprintf(
        '[upsell] get_smart_setting key=%s option=%s value=%s default=%s',
        $key,
        $option_key,
        wp_json_encode($value),
        wp_json_encode($default)
    ));

    if ($value === false) {
        return $default;
    }

    return $value;
}
