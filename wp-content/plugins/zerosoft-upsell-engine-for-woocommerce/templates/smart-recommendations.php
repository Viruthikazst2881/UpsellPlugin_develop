<?php
/**
 * Smart Recommendations template
 *
 * @var WC_Product[] $products
 * @var string      $page
 * @var string      $layout
 * @var string      $display_hook
 */

if (!defined('ABSPATH')) {
    exit;
}

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound

if (empty($products) || !is_array($products)) {
    return;
}

$page_slug = sanitize_text_field($page ?? '');
$layout_slug = sanitize_key($layout ?? 'grid');
$hook_slug = sanitize_html_class(str_replace('woocommerce_', '', sanitize_text_field($display_hook ?? '')));
if (!in_array($layout_slug, ['grid', 'slider'], true)) {
    $layout_slug = 'grid';
}

$compact_hooks = [
    'woocommerce_before_cart_totals',
    'woocommerce_after_cart_totals',
];
$is_compact = $page_slug === 'cart' || in_array((string) ($display_hook ?? ''), $compact_hooks, true);

$smart_copy = [
    'product' => [
        'eyebrow'  => __('SMART PICKS', 'zerosoft-upsell-engine-for-woocommerce'),
        'title'    => __('Recommended for you', 'zerosoft-upsell-engine-for-woocommerce'),
        'subtitle' => __('Fresh matches based on this product, its category, and what shoppers usually explore next.', 'zerosoft-upsell-engine-for-woocommerce'),
    ],
    'cart' => [
        'eyebrow'  => __('COMPLETE THE CART', 'zerosoft-upsell-engine-for-woocommerce'),
        'title'    => __('Recommended for your cart', 'zerosoft-upsell-engine-for-woocommerce'),
        'subtitle' => __('Helpful items that fit naturally with what is already in your basket.', 'zerosoft-upsell-engine-for-woocommerce'),
    ],
];

$copy = $smart_copy[$page_slug] ?? $smart_copy['product'];
$product_count = count($products);
$use_carousel = $layout_slug === 'slider' && $product_count > 1;
$is_cart_compact = $page_slug === 'cart';
$container_classes = trim(
    'upsell-smart-recommendations upsell-smart-recommendations--' . $page_slug .
    ' upsell-smart-recommendations--layout-' . $layout_slug .
    ($hook_slug ? ' upsell-smart-recommendations--hook-' . $hook_slug : '') .
    ($is_compact ? ' upsell-smart-recommendations--compact' : '') .
    ' upsell-smart-recommendations--count-' . min($product_count, 4)
);
$grid_classes = 'upsell-smart-recommendations__grid';
if (!$use_carousel) {
    $grid_classes .= ' upsell-smart-recommendations__grid--count-' . min($product_count, 2);
}

$container_style = '';
$header_style = '';
$copy_style = '';
$nav_style = '';
$shell_style = '';
$grid_style = '';
$item_style = '';
$image_style = '';
$body_style = '';
$badge_style = '';
$name_style = '';
$price_style = '';
$button_style = '';
$pill_style = '';
$wrapper_id = $page_slug === 'cart' ? 'smart-recommendations-wrapper' : '';

if ($is_cart_compact) {
    $container_style = 'width:100%;margin:24px 0 0;padding:0px;overflow:hidden;';
    $header_style = 'display:flex;flex-direction:column;align-items:flex-start;gap:10px;margin-bottom:0px;';
    $copy_style = 'max-width:100%;';
    $nav_style = 'display:flex;gap:8px;margin:0 0 14px;';
    $shell_style = 'overflow:hidden;';
    $grid_style = 'display:flex;flex-direction:row;flex-wrap:nowrap;align-items:stretch;gap:14px;overflow-x:auto;overflow-y:hidden;scroll-behavior:smooth;scroll-snap-type:x proximity;padding:10px 0 4px;margin:0;-ms-overflow-style:none;scrollbar-width:none;';
    $item_style = 'display:grid;grid-template-columns:96px minmax(0,1fr);align-items:stretch;min-width:286px;max-width:286px;flex:0 0 286px;scroll-snap-align:start;min-height:168px;background:linear-gradient(180deg,var(--upsell-theme-card-bg),var(--upsell-theme-surface));border:1px solid var(--upsell-theme-border);border-radius:14px;overflow:hidden;padding:0;';
    $image_style = 'align-items:center;justify-content:center;width:96px;min-width:96px;max-width:96px;padding:12px;background:radial-gradient(circle at top,var(--upsell-theme-surface),var(--upsell-theme-subtle-bg) 72%);align-self:stretch;';
    $body_style = 'display:flex;flex-direction:column;justify-content:flex-start;padding:12px 12px 12px 0;min-width:0;width:100%;';
    $badge_style = 'display:inline-flex;align-self:flex-start;margin-bottom:10px;padding:5px 9px;border-radius:999px;background:#eff8f0;color:#166534;font-size:11px;font-weight:700;';
    $name_style = 'margin:0 0 0px;font-size:14px;font-weight:600;line-height:1.4;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:0px;';
    $price_style = 'margin:0 0 12px;font-size:14px;font-weight:700;color:var(--upsell-theme-text);';
    $button_style = 'display:flex;align-items:center;justify-content:center;width:100%;max-width:100%;min-width:0;min-height:40px;padding:10px 12px;border-radius:var(--upsell-theme-button-radius);text-decoration:none;margin-top:auto;';
    $pill_style = 'display:none;';
}
?>
<div<?php echo $wrapper_id !== '' ? ' id="' . esc_attr($wrapper_id) . '"' : ''; ?>>
<div class="<?php echo esc_attr($container_classes); ?>"<?php echo $container_style !== '' ? ' style="' . esc_attr($container_style) . '"' : ''; ?>>
    <div class="upsell-smart-recommendations__header"<?php echo $header_style !== '' ? ' style="' . esc_attr($header_style) . '"' : ''; ?>>
        <div class="upsell-smart-recommendations__copy"<?php echo $copy_style !== '' ? ' style="' . esc_attr($copy_style) . '"' : ''; ?>>
            <span class="upsell-smart-recommendations__eyebrow"><?php echo esc_html($copy['eyebrow']); ?></span>
            <h2 class="upsell-smart-recommendations__title"><?php echo esc_html($copy['title']); ?></h2>
            <p class="upsell-smart-recommendations__subtitle"><?php echo esc_html($copy['subtitle']); ?></p>
        </div>
        <span class="upsell-smart-recommendations__pill"<?php echo $pill_style !== '' ? ' style="' . esc_attr($pill_style) . '"' : ''; ?>><?php echo esc_html(strtoupper($layout_slug)); ?></span>
    </div>
    <div class="upsell-carousel-shell"<?php echo $shell_style !== '' ? ' style="' . esc_attr($shell_style) . '"' : ''; ?>>
        <?php if ($use_carousel) : ?>
            <div class="upsell-carousel-nav" aria-label="<?php echo esc_attr($copy['title']); ?>"<?php echo $nav_style !== '' ? ' style="' . esc_attr($nav_style) . '"' : ''; ?>>
                <button type="button" class="upsell-carousel-nav__btn upsell-carousel-nav__btn--prev" data-upsell-prev aria-label="<?php esc_attr_e('Previous products', 'zerosoft-upsell-engine-for-woocommerce'); ?>">
                    <span aria-hidden="true">&#8249;</span>
                </button>
                <button type="button" class="upsell-carousel-nav__btn upsell-carousel-nav__btn--next" data-upsell-next aria-label="<?php esc_attr_e('Next products', 'zerosoft-upsell-engine-for-woocommerce'); ?>">
                    <span aria-hidden="true">&#8250;</span>
                </button>
            </div>
        <?php endif; ?>
        <div class="<?php echo esc_attr($grid_classes . ($use_carousel ? ' upsell-carousel-track' : '')); ?>"<?php echo $use_carousel ? ' data-upsell-carousel' : ''; ?><?php echo $grid_style !== '' ? ' style="' . esc_attr($grid_style) . '"' : ''; ?>>
        <?php foreach ($products as $product) :
            if (!$product || !($product instanceof WC_Product) || !$product->is_visible()) {
                continue;
            }
            $product_url = esc_url($product->get_permalink());
            ?>
            <div class="upsell-smart-recommendations__item"<?php echo $item_style !== '' ? ' style="' . esc_attr($item_style) . '"' : ''; ?>>
                <a href="<?php echo esc_url($product_url); ?>" class="upsell-smart-recommendations__image-link"<?php echo $image_style !== '' ? ' style="' . esc_attr($image_style) . '"' : ''; ?>>
                    <?php echo wp_kses_post($product->get_image('woocommerce_thumbnail', ['alt' => esc_attr($product->get_name())])); ?>
                </a>
                <div class="upsell-smart-recommendations__body"<?php echo $body_style !== '' ? ' style="' . esc_attr($body_style) . '"' : ''; ?>>
                    <span class="upsell-smart-recommendations__badge"<?php echo $badge_style !== '' ? ' style="' . esc_attr($badge_style) . '"' : ''; ?>><?php esc_html_e('Smart match', 'zerosoft-upsell-engine-for-woocommerce'); ?></span>
                    <h3 class="upsell-smart-recommendations__name"<?php echo $name_style !== '' ? ' style="' . esc_attr($name_style) . '"' : ''; ?>><a href="<?php echo esc_url($product_url); ?>"><?php echo esc_html($product->get_name()); ?></a></h3>
                    <div class="upsell-smart-recommendations__price"<?php echo $price_style !== '' ? ' style="' . esc_attr($price_style) . '"' : ''; ?>><?php echo wp_kses_post($product->get_price_html()); ?></div>
                    <?php if ($product->is_in_stock() && $product->is_purchasable()) : ?>
                        <a class="add_to_cart_button ajax_add_to_cart upsell-smart-recommendations__btn" href="<?php echo esc_url($product->add_to_cart_url()); ?>"<?php echo $button_style !== '' ? ' style="' . esc_attr($button_style) . '"' : ''; ?>>
                            <?php echo esc_html($product->add_to_cart_text()); ?>
                        </a>
                    <?php else : ?>
                        <a class="upsell-smart-recommendations__btn upsell-smart-recommendations__btn--ghost" href="<?php echo esc_url($product_url); ?>"<?php echo $button_style !== '' ? ' style="' . esc_attr($button_style) . '"' : ''; ?>><?php esc_html_e('View product', 'zerosoft-upsell-engine-for-woocommerce'); ?></a>
                    <?php endif; ?>
                </div>
            </div>
        <?php endforeach; ?>
        </div>
    </div>
</div>
</div>
<?php // phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound ?>
