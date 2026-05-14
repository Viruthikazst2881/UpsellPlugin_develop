<?php
/**
 * Uninstall Zerosoft Upsell Engine for WooCommerce.
 *
 * @package ZerosoftUpsellEngine
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

global $wpdb;

$upsell_option_names = [
    'upsell_db_version',
    'upsell_smart_enabled',
    'upsell_smart_sources',
    'upsell_smart_limit',
    'upsell_smart_layout',
    'upsell_smart_pages',
    'upsell_smart_display_positions',
];

foreach ($upsell_option_names as $upsell_option_name) {
    delete_option($upsell_option_name);
    delete_site_option($upsell_option_name);
}

delete_transient('upsell_rules_engine_cache');

$upsell_tables = [
    $wpdb->prefix . 'upsell_rules',
];

foreach ($upsell_tables as $upsell_table) {
    $upsell_table = esc_sql($upsell_table);
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery.SchemaChange -- Uninstall must remove only this plugin's custom tables derived from the active site prefix.
    $wpdb->query("DROP TABLE IF EXISTS `{$upsell_table}`");
}
