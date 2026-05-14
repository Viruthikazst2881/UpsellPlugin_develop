<?php
/**
 * Upsell Rules Engine
 *
 * Evaluates active rules against the current page context and
 * returns a list of recommended product IDs to display.
 *
 * FIXED: Proper upsell vs cross-sell distinction
 */

if (!defined('ABSPATH')) {
    exit;
}

class Upsell_Rules_Engine {

    private $wpdb;
    private $rules_table;

    public function __construct() {
        global $wpdb;
        $this->wpdb                  = $wpdb;
        $this->rules_table           = $wpdb->prefix . 'upsell_rules';
    }

    /**
     * Get recommendations for the current page context.
     */
    public function get_recommendations(array $context): array {
        $context = $this->normalize_context($context);

        $rules = $this->load_active_rules();
        if (empty($rules)) {
            return [];
        }

        $results = [];

        foreach ($rules as $rule) {
            // Skip rules not configured for this page
            if (!$this->rule_applies_to_page($rule, $context['page'])) {
                continue;
            }

            // Evaluate the rule's condition against the context
            if (!$this->evaluate_condition($rule, $context)) {
                continue;
            }

            // Fetch the recommended product IDs for this rule
            $product_ids = $this->get_product_ids_for_rule($rule, $context);
            if (empty($product_ids)) {
                continue;
            }

            // For upsell rules, ensure recommended products are more expensive than the trigger product
            if ($rule->rule_type === 'upsell') {
                $trigger_product_id = $rule->condition_type === 'product' ? (int) $rule->condition_value : $context['product_id'];
                if ($trigger_product_id) {
                    $trigger_product = wc_get_product($trigger_product_id);
                    if ($trigger_product) {
                        $trigger_price = (float) $trigger_product->get_price();
                        $product_ids = array_filter($product_ids, function($pid) use ($trigger_price) {
                            $product = wc_get_product($pid);
                            if (!$product) {
                                return false;
                            }
                            $rec_price = (float) $product->get_price();
                            return $rec_price > $trigger_price && $rec_price > 0;
                        });
                        $product_ids = array_values($product_ids);
                    }
                }
            }

            // Remove products already in the cart
            $product_ids = $this->filter_cart_products($product_ids, $context['cart_items']);
            if (empty($product_ids)) {
                continue;
            }

            // Remove current product from recommendations
            if ($context['product_id']) {
                $product_ids = array_values(array_filter($product_ids, function($pid) use ($context) {
                    return $pid !== (int) $context['product_id'];
                }));
            }
            if (empty($product_ids)) {
                continue;
            }

          $results[] = [
            'rule_id'      => (int) $rule->id,
            'rule_type'    => $rule->rule_type,  // â† Make sure this is included
            'rule_name'    => $rule->rule_name,
            'priority'     => (int) ($rule->priority ?? 0),
            'product_ids'  => $product_ids,
            'display_hook' => $this->resolve_rule_hook_for_page($rule, $context['page']),
          ];
        }

        return $results;
    }

    /**
     * Load all active rules from DB
     */
    // phpcs:disable WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
    private function load_active_rules(): array {
        $cache_key = 'upsell_active_rules';
        $cached    = wp_cache_get($cache_key, 'zerosoft-upsell-engine-for-woocommerce');

        if ($cached !== false) {
            return $cached;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Reads active rules from this plugin's custom table.
        $rules = $this->wpdb->get_results(
            "SELECT * FROM {$this->rules_table}
             WHERE status = 1
             ORDER BY priority DESC, id ASC"
        );

        foreach ($rules as $rule) {
            $rule->display_pages = json_decode($rule->display_pages, true) ?? [];
            $rule->display_positions = json_decode($rule->display_positions, true) ?? [];
        }

        wp_cache_set($cache_key, $rules, 'zerosoft-upsell-engine-for-woocommerce', 300);
        return $rules;
    }
    // phpcs:enable WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

    /**
     * Check if the rule applies to the given page
     */
    private function rule_applies_to_page(object $rule, string $page): bool {
        if (empty($rule->display_pages)) {
            return false;
        }
        return in_array($page, $rule->display_pages, true);
    }

    /**
     * Resolve the display hook for a rule on a specific page
     */
    private function resolve_rule_hook_for_page(object $rule, string $page): string {
        $defaults = $this->default_display_hooks();
        $positions = is_array($rule->display_positions ?? null) ? $rule->display_positions : [];
        $candidate = isset($positions[$page]) ? (string) $positions[$page] : '';
        if ($candidate) {
            return $candidate;
        }
        return $defaults[$page] ?? '';
    }

    /**
     * Route the rule to the correct condition evaluator
     */
    private function evaluate_condition(object $rule, array $context): bool {
        switch ($rule->condition_type) {
            case 'product':
                return $this->condition_product($rule, $context);

            case 'category':
                return $this->condition_category($rule, $context);

            case 'tag':
                return $this->condition_tag($rule, $context);

            default:
                return false;
        }
    }

    /**
     * Condition: current product matches the rule's condition_value
     */
    private function condition_product(object $rule, array $context): bool {
        $allowed_ids = $this->parse_id_list($rule->condition_value);
        $page = (string) ($context['page'] ?? 'product');

        // If no specific products specified (empty allowed_ids), match any product ("any" condition)
        if (empty($allowed_ids)) {
            return true;
        }

        if ($page === 'product') {
            return $context['product_id'] && in_array((int) $context['product_id'], $allowed_ids, true);
        }

        // Cart – check if any cart item matches
        if (!empty($context['cart_items'])) {
            return !empty(array_intersect($allowed_ids, array_map('intval', $context['cart_items'])));
        }

        return false;
    }

    /**
     * Condition: current product belongs to one of the specified categories
     */
    private function condition_category(object $rule, array $context): bool {
        $page = (string) ($context['page'] ?? 'product');

        if ($page !== 'product') {
            return $this->any_cart_item_in_category(
                $context['cart_items'],
                $this->parse_id_list($rule->condition_value)
            );
        }

        $category_ids = $this->parse_id_list($rule->condition_value);
        $product_terms = wp_get_post_terms(
            $context['product_id'],
            'product_cat',
            ['fields' => 'ids']
        );

        if (is_wp_error($product_terms)) {
            return false;
        }

        return !empty(array_intersect($category_ids, $product_terms));
    }

    /**
     * Condition: current product has one of the specified tags
     */
    private function condition_tag(object $rule, array $context): bool {
        $page = (string) ($context['page'] ?? 'product');

        if ($page !== 'product') {
            return $this->any_cart_item_has_tag(
                $context['cart_items'],
                $this->parse_id_list($rule->condition_value)
            );
        }

        $tag_ids      = $this->parse_id_list($rule->condition_value);
        $product_tags = wp_get_post_terms(
            $context['product_id'],
            'product_tag',
            ['fields' => 'ids']
        );

        if (is_wp_error($product_tags)) {
            return false;
        }

        return !empty(array_intersect($tag_ids, $product_tags));
    }

    /**
     * Get recommended product IDs for a matched rule
     */
    private function get_product_ids_for_rule(object $rule, array $context): array {
        $manual_ids = $this->get_manual_recommendation_ids($rule);
        if (!empty($manual_ids)) {
            return $manual_ids;
        }

        return $this->get_rule_condition_fallback_ids($rule, 8);
    }

    /**
     * Load manually selected recommendation products for a rule when available.
     */
    private function get_manual_recommendation_ids(object $rule): array {
        $recommended_ids = json_decode((string) ($rule->recommended_product_ids ?? '[]'), true);
        if (!is_array($recommended_ids)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map('intval', $recommended_ids))));
    }

    private function get_rule_condition_fallback_ids(object $rule, int $limit = 8): array {
        if ($rule->condition_type === 'category') {
            $category_ids = $this->parse_id_list((string) $rule->condition_value);
            if (empty($category_ids)) {
                return [];
            }
            $q = new WP_Query([
                'post_type'      => 'product',
                'post_status'    => 'publish',
                'posts_per_page' => $limit,
                'fields'         => 'ids',
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- This fallback intentionally narrows products by category terms.
                'tax_query'      => [[
                    'taxonomy' => 'product_cat',
                    'field'    => 'term_id',
                    'terms'    => $category_ids,
                ]],
            ]);
            return array_map('intval', $q->posts ?? []);
        }

        if ($rule->condition_type === 'tag') {
            $tag_ids = $this->parse_id_list((string) $rule->condition_value);
            if (empty($tag_ids)) {
                return [];
            }
            $q = new WP_Query([
                'post_type'      => 'product',
                'post_status'    => 'publish',
                'posts_per_page' => $limit,
                'fields'         => 'ids',
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- This fallback intentionally narrows products by tag terms.
                'tax_query'      => [[
                    'taxonomy' => 'product_tag',
                    'field'    => 'term_id',
                    'terms'    => $tag_ids,
                ]],
            ]);
            return array_map('intval', $q->posts ?? []);
        }

        return [];
    }

    private function normalize_context(array $context): array {
        return array_merge([
            'product_id' => 0,
            'page'       => 'product',
            'cart_items' => [],
        ], $context);
    }

    private function parse_id_list(string $value): array {
        return array_map('intval', array_filter(array_map('trim', explode(',', $value))));
    }

    private function filter_cart_products(array $product_ids, array $cart_items): array {
        if (empty($cart_items)) {
            return $product_ids;
        }
        return array_values(array_diff($product_ids, $cart_items));
    }

    private function default_display_hooks(): array {
        return [
            'product'  => 'woocommerce_after_add_to_cart_form',
            'cart'     => 'woocommerce_before_cart_totals',
        ];
    }

    private function any_cart_item_in_category(array $cart_items, array $category_ids): bool {
        foreach ($cart_items as $product_id) {
            $terms = wp_get_post_terms($product_id, 'product_cat', ['fields' => 'ids']);
            if (!is_wp_error($terms) && !empty(array_intersect($category_ids, $terms))) {
                return true;
            }
        }
        return false;
    }

    private function any_cart_item_has_tag(array $cart_items, array $tag_ids): bool {
        foreach ($cart_items as $product_id) {
            $terms = wp_get_post_terms($product_id, 'product_tag', ['fields' => 'ids']);
            if (!is_wp_error($terms) && !empty(array_intersect($tag_ids, $terms))) {
                return true;
            }
        }
        return false;
    }

    public static function flush_rules_cache(): void {
        wp_cache_delete('upsell_active_rules', 'zerosoft-upsell-engine-for-woocommerce');
    }
}
