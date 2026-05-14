<?php
/**
 * Smart Product Recommendations Service
 */

if (!defined('ABSPATH')) {
    exit;
}

class Upsell_Smart_Recommendations {

    private function normalize_product_ids(array $product_ids): array {
        return array_values(array_unique(array_filter(array_map('intval', $product_ids))));
    }

    private function normalize_term_ids(array $term_ids): array {
        return array_values(array_unique(array_filter(array_map('intval', $term_ids))));
    }

    private function get_product_term_ids(int $product_id, string $taxonomy): array {
        if ($product_id <= 0) {
            return [];
        }

        $terms = wp_get_post_terms($product_id, $taxonomy, ['fields' => 'ids']);
        if (is_wp_error($terms) || empty($terms)) {
            return [];
        }

        return $this->normalize_term_ids((array) $terms);
    }

    private function get_term_ancestors_and_children(int $term_id, string $taxonomy): array {
        $related = [$term_id];

        $ancestors = get_ancestors($term_id, $taxonomy, 'taxonomy');
        if (!empty($ancestors)) {
            $related = array_merge($related, array_map('intval', $ancestors));
        }

        $children = get_term_children($term_id, $taxonomy);
        if (!is_wp_error($children) && !empty($children)) {
            $related = array_merge($related, array_map('intval', $children));
        }

        return $this->normalize_term_ids($related);
    }

    private function get_root_term_id(int $term_id, string $taxonomy): int {
        $ancestors = get_ancestors($term_id, $taxonomy, 'taxonomy');
        if (empty($ancestors)) {
            return $term_id;
        }

        return (int) end($ancestors);
    }

    private function get_root_term_ids(array $term_ids, string $taxonomy): array {
        $roots = [];
        foreach ($term_ids as $term_id) {
            $roots[] = $this->get_root_term_id((int) $term_id, $taxonomy);
        }
        return $this->normalize_term_ids($roots);
    }

    private function get_category_context(array $seed_product_ids): array {
        $exact = [];
        foreach ($seed_product_ids as $seed_product_id) {
            $exact = array_merge($exact, $this->get_product_term_ids((int) $seed_product_id, 'product_cat'));
        }
        $exact = $this->normalize_term_ids($exact);

        $related = [];
        foreach ($exact as $term_id) {
            $related = array_merge($related, $this->get_term_ancestors_and_children((int) $term_id, 'product_cat'));
        }
        $related = $this->normalize_term_ids($related);

        $root_ids = $this->get_root_term_ids($exact, 'product_cat');
        $accessory_roots = $this->get_accessory_root_term_ids($root_ids);
        $accessory_terms = [];
        foreach ($accessory_roots as $root_id) {
            $accessory_terms = array_merge($accessory_terms, $this->get_term_ancestors_and_children((int) $root_id, 'product_cat'));
        }
        $accessory_terms = $this->normalize_term_ids($accessory_terms);

        return [
            'exact'           => $exact,
            'related'         => array_values(array_diff($related, $exact)),
            'root_ids'        => $root_ids,
            'accessory_roots' => $accessory_roots,
            'accessory_terms' => array_values(array_diff($accessory_terms, $exact)),
        ];
    }

    private function get_strict_category_context(array $seed_product_ids): array {
        $category_context = $this->get_category_context($seed_product_ids);

        return [
            'exact'           => $category_context['exact'],
            'related'         => [],
            'root_ids'        => $category_context['root_ids'],
            'accessory_roots' => [],
            'accessory_terms' => [],
        ];
    }

    private function get_accessory_root_term_ids(array $seed_root_ids): array {
        if (empty($seed_root_ids)) {
            return [];
        }

        $root_terms = get_terms([
            'taxonomy'   => 'product_cat',
            'hide_empty' => false,
            'parent'     => 0,
        ]);

        if (is_wp_error($root_terms) || empty($root_terms)) {
            return [];
        }

        $seed_roots = [];
        foreach ($seed_root_ids as $root_id) {
            $term = get_term((int) $root_id, 'product_cat');
            if ($term && !is_wp_error($term)) {
                $seed_roots[] = strtolower($term->slug . ' ' . $term->name);
            }
        }

        $targets = [];
        foreach ($seed_roots as $label) {
            $is_computing = preg_match('/laptop|computer|desktop|pc/', $label);
            $is_mobile = preg_match('/mobile|phone|smartphone|tablet/', $label);

            foreach ($root_terms as $root_term) {
                $root_label = strtolower($root_term->slug . ' ' . $root_term->name);

                if ($is_computing) {
                    if (preg_match('/accessor|cooling/', $root_label) && !preg_match('/mobile|phone/', $root_label)) {
                        $targets[] = (int) $root_term->term_id;
                    }
                }

                if ($is_mobile) {
                    if (preg_match('/mobile.*accessor|phone.*accessor|accessor.*mobile|accessor.*phone/', $root_label)) {
                        $targets[] = (int) $root_term->term_id;
                    }
                }
            }
        }

        return $this->normalize_term_ids($targets);
    }

    private function filter_products_to_category_family(array $product_ids, array $seed_product_ids): array {
        $product_ids = $this->normalize_product_ids($product_ids);
        $seed_product_ids = $this->normalize_product_ids($seed_product_ids);
        if (empty($product_ids) || empty($seed_product_ids)) {
            return [];
        }

        $category_context = $this->get_strict_category_context($seed_product_ids);
        $allowed_roots = $this->normalize_term_ids(array_merge(
            $category_context['root_ids'],
            $category_context['accessory_roots']
        ));
        $allowed_terms = $this->normalize_term_ids(array_merge(
            $category_context['exact'],
            $category_context['related'],
            $category_context['accessory_terms']
        ));

        $filtered = [];
        foreach ($product_ids as $product_id) {
            $candidate_cats = $this->get_product_term_ids((int) $product_id, 'product_cat');
            $candidate_roots = $this->get_root_term_ids($candidate_cats, 'product_cat');

            if (!empty(array_intersect($candidate_roots, $allowed_roots)) || !empty(array_intersect($candidate_cats, $allowed_terms))) {
                $filtered[] = (int) $product_id;
            }
        }

        return $filtered;
    }

    private function get_scored_contextual_recommendations(array $seed_product_ids, bool $include_categories, bool $include_tags, int $limit = 4): array {
        $seed_product_ids = $this->normalize_product_ids($seed_product_ids);
        if (empty($seed_product_ids)) {
            return [];
        }

        $category_context = $include_categories
            ? $this->get_strict_category_context($seed_product_ids)
            : $this->get_category_context($seed_product_ids);
        $seed_tag_ids = [];
        if ($include_tags) {
            foreach ($seed_product_ids as $seed_product_id) {
                $seed_tag_ids = array_merge($seed_tag_ids, $this->get_product_term_ids((int) $seed_product_id, 'product_tag'));
            }
            $seed_tag_ids = $this->normalize_term_ids($seed_tag_ids);
        }

        $cache_key = 'upsell_smart_scored_v2_' . md5(
            implode(',', $seed_product_ids) . '|' .
            implode(',', $category_context['exact']) . '|' .
            implode(',', $category_context['related']) . '|' .
            implode(',', $category_context['accessory_terms']) . '|' .
            implode(',', $seed_tag_ids) . '|' .
            (int) $include_categories . '|' .
            (int) $include_tags . '|' .
            $limit
        );
        $cached = get_transient($cache_key);
        if (is_array($cached)) {
            return $cached;
        }

        $tax_query = ['relation' => 'OR'];
        if ($include_categories) {
            $category_terms = $this->normalize_term_ids(array_merge(
                $category_context['exact'],
                $category_context['related'],
                $category_context['accessory_terms']
            ));
            if (!empty($category_terms)) {
                $tax_query[] = [
                    'taxonomy' => 'product_cat',
                    'field'    => 'term_id',
                    'terms'    => $category_terms,
                ];
            }
        }

        if ($include_tags && !empty($seed_tag_ids)) {
            $tax_query[] = [
                'taxonomy' => 'product_tag',
                'field'    => 'term_id',
                'terms'    => $seed_tag_ids,
            ];
        }

        if (count($tax_query) === 1) {
            return [];
        }

        $query = new WP_Query([
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => max(18, $limit * 6),
            'fields'         => 'ids',
            // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in -- Seed products must be excluded from recommendation results.
            'post__not_in'   => $seed_product_ids,
            // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- Recommendation relevance depends on matching taxonomy terms.
            'tax_query'      => $tax_query,
        ]);

        $scores = [];
        foreach ((array) $query->posts as $candidate_id) {
            $candidate_id = (int) $candidate_id;
            $candidate_cats = $this->get_product_term_ids($candidate_id, 'product_cat');
            $candidate_tags = $include_tags ? $this->get_product_term_ids($candidate_id, 'product_tag') : [];
            $candidate_roots = $this->get_root_term_ids($candidate_cats, 'product_cat');

            $score = 0;
            if ($include_categories) {
                $score += 120 * count(array_intersect($candidate_cats, $category_context['exact']));
                $score += 70 * count(array_intersect($candidate_cats, $category_context['related']));
                $score += 65 * count(array_intersect($candidate_cats, $category_context['accessory_terms']));
            }

            if ($include_tags && !empty($seed_tag_ids)) {
                $score += 45 * count(array_intersect($candidate_tags, $seed_tag_ids));
            }

            $shares_root = !empty(array_intersect($candidate_roots, $category_context['root_ids']));
            $is_accessory = !empty(array_intersect($candidate_roots, $category_context['accessory_roots']))
                || !empty(array_intersect($candidate_cats, $category_context['accessory_terms']));

            if (!$shares_root && !$is_accessory && empty(array_intersect($candidate_tags, $seed_tag_ids))) {
                continue;
            }

            if ($score <= 0) {
                continue;
            }

            $scores[$candidate_id] = $score;
        }

        if (empty($scores)) {
            set_transient($cache_key, [], HOUR_IN_SECONDS);
            return [];
        }

        arsort($scores);
        $product_ids = array_slice(array_keys($scores), 0, $limit);
        set_transient($cache_key, $product_ids, HOUR_IN_SECONDS);
        return $product_ids;
    }

    private function get_term_based_recommendations(array $seed_product_ids, string $taxonomy, int $limit = 4): array {
        $seed_product_ids = $this->normalize_product_ids($seed_product_ids);
        if (empty($seed_product_ids)) {
            return [];
        }

        $term_ids = [];
        foreach ($seed_product_ids as $seed_product_id) {
            $terms = wp_get_post_terms($seed_product_id, $taxonomy, ['fields' => 'ids']);
            if (is_wp_error($terms) || empty($terms)) {
                continue;
            }
            foreach ($terms as $term_id) {
                $term_ids[] = (int) $term_id;
            }
        }

        $term_ids = array_values(array_unique($term_ids));
        if (empty($term_ids)) {
            smart_upsell_debug_log(sprintf('[upsell] get_term_based_recommendations: no %s terms found for seeds=%s', $taxonomy, implode(',', $seed_product_ids)));
            return [];
        }

        $cache_key = 'upsell_smart_terms_' . md5($taxonomy . '|' . implode(',', $seed_product_ids) . '|' . implode(',', $term_ids) . '|' . $limit);
        $cached = get_transient($cache_key);
        if (is_array($cached)) {
            return $cached;
        }

        $query = new WP_Query([
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => $limit,
            'fields'         => 'ids',
            // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in -- Seed products must be excluded from recommendation results.
            'post__not_in'   => $seed_product_ids,
            // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- Recommendation relevance depends on taxonomy overlap.
            'tax_query'      => [[
                'taxonomy' => $taxonomy,
                'field'    => 'term_id',
                'terms'    => $term_ids,
            ]],
        ]);

        $product_ids = $this->normalize_product_ids((array) $query->posts);
        if (empty($product_ids)) {
            smart_upsell_debug_log(sprintf('[upsell] get_term_based_recommendations: query returned 0 products; taxonomy=%s terms=%s', $taxonomy, implode(',', $term_ids)));
        } else {
            smart_upsell_debug_log(sprintf('[upsell] get_term_based_recommendations: found %d products for taxonomy=%s', count($product_ids), $taxonomy));
        }

        set_transient($cache_key, $product_ids, HOUR_IN_SECONDS);
        return $product_ids;
    }

    public function get_products_by_category(int $product_id, int $limit = 4): array {
        return $this->get_term_based_recommendations([$product_id], 'product_cat', $limit);
    }

    public function get_products_by_tags(int $product_id, int $limit = 4): array {
        return $this->get_term_based_recommendations([$product_id], 'product_tag', $limit);
    }

    public function get_smart_recommendations(array $context = []): array {
        $smart_enabled = (bool) upsell_get_smart_setting('enabled', true);

        // Check if this page should display recommendations
        $enabled_pages = upsell_get_smart_setting('pages', Upsell_Smart_Settings::get_default_pages());
        $current_page = sanitize_text_field($context['page'] ?? '');
        if (!empty($current_page) && !in_array($current_page, (array) $enabled_pages)) {
            return [];
        }

        $context = wp_parse_args($context, [
            'page'       => 'product',
            'product_id' => 0,
            'user_id'    => 0,
            'limit'      => upsell_get_smart_setting('limit', 6),
        ]);

        $product_id = (int) $context['product_id'];
        $user_id    = (int) $context['user_id'];
        $limit      = max(1, min(12, (int) $context['limit']));

        if (!$smart_enabled) {
            return apply_filters('upsell_smart_recommendations', [], $context);
        }
        $sources    = upsell_get_smart_setting('sources', Upsell_Smart_Settings::get_default_sources());
        $cart_items = $this->normalize_product_ids((array) ($context['cart_items'] ?? []));
        $primary_seed_product_ids = $current_page === 'product' && $product_id > 0
            ? [$product_id]
            : $this->normalize_product_ids(array_merge($product_id > 0 ? [$product_id] : [], $cart_items));

        $cache_key = 'upsell_smart_recommendations_v2_' . md5(
            $context['page'] . '|' .
            $product_id . '|' .
            $user_id . '|' .
            $limit . '|' .
            implode(',', $sources) . '|' .
            implode(',', $cart_items) . '|' .
            implode(',', $primary_seed_product_ids)
        );
        $cached = get_transient($cache_key);
        if (is_array($cached)) {
            return apply_filters('upsell_smart_recommendations', $cached, $context);
        }

        $results = [];

        smart_upsell_debug_log('[upsell] get_smart_recommendations: page=' . $current_page . ' product_id=' . $product_id . ' user_id=' . $user_id . ' limit=' . $limit . ' sources=' . implode(',', (array) $sources));

        $use_category_source = in_array('category', (array) $sources, true);
        $use_tag_source = in_array('tags', (array) $sources, true);
        if (count($results) < $limit && !empty($primary_seed_product_ids) && ($use_category_source || $use_tag_source)) {
            if ($use_tag_source && !$use_category_source) {
                $tag_results = $this->get_term_based_recommendations($primary_seed_product_ids, 'product_tag', $limit);
                smart_upsell_debug_log('[upsell] get_smart_recommendations: exact tag results=' . count($tag_results));
                $results = array_merge($results, $tag_results);
            } else {
                $scored = $this->get_scored_contextual_recommendations($primary_seed_product_ids, $use_category_source, $use_tag_source, $limit);
                smart_upsell_debug_log('[upsell] get_smart_recommendations: scored contextual results=' . count($scored));
                $results = array_merge($results, $scored);
            }
        }

        // Fallback: if still no recommendations from selected sources and seed products exist
        if (empty($results) && !empty($primary_seed_product_ids) && ($use_category_source || $use_tag_source)) {
            $fallback = $use_tag_source && !$use_category_source
                ? $this->get_term_based_recommendations($primary_seed_product_ids, 'product_tag', $limit)
                : $this->get_scored_contextual_recommendations($primary_seed_product_ids, $use_category_source, $use_tag_source, $limit);
            smart_upsell_debug_log('[upsell] get_smart_recommendations fallback contextual results=' . count($fallback));
            $results = array_merge($results, $fallback);
        }

        $results = array_values(array_unique(array_filter(array_map('intval', $results))));
        $results = array_slice($results, 0, $limit);

        set_transient($cache_key, $results, HOUR_IN_SECONDS);

        return apply_filters('upsell_smart_recommendations', $results, $context);
    }

    public function render(array $context = []): void {
        $recommended = $this->get_smart_recommendations($context);
        if (empty($recommended)) {
            smart_upsell_debug_log('[upsell] render: no smart recommendations returned for context ' . wp_json_encode($context));
            return;
        }

        $products = array_filter(array_map('wc_get_product', $recommended));

        if (empty($products)) {
            smart_upsell_debug_log('[upsell] render: got recommended ids but no valid products, ids=' . implode(',', $recommended));
            return;
        }

        $template_args = [
            'products'     => $products,
            'page'         => sanitize_text_field($context['page'] ?? ''),
            'layout'       => sanitize_key((string) upsell_get_smart_setting('layout', 'grid')),
            'display_hook' => sanitize_text_field((string) ($context['display_hook'] ?? '')),
        ];

        wc_get_template(
            'smart-recommendations.php',
            $template_args,
            '',
            UPSELL_PLUGIN_DIR . 'templates/'
        );
    }
}
