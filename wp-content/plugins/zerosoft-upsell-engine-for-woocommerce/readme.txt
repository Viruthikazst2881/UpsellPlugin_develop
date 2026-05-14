=== Zerosoft Upsell Engine for WooCommerce ===
Contributors: zerosoft2026
Tags: woocommerce, upsell, cross-sell, recommendations, ecommerce
Requires at least: 6.4
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Requires Plugins: woocommerce

Smart upsell, cross-sell, and recommendation engine for WooCommerce with rule-based campaigns and an independent Smart Recommendations engine.

== Description ==

Zerosoft Upsell Engine for WooCommerce gives store owners two fully independent, fully free tools to show relevant products to shoppers:

**1. Campaign Manager (rule-based)**

Create manual upsell and cross-sell campaigns that target specific products, categories, or tags. Each campaign lets you hand-pick the recommended products and control exactly where and when they appear.

**2. Smart Recommendations (automated)**

A separate, standalone recommendation engine that automatically suggests products based on shared categories and tags. It runs independently from the Campaign Manager and is configured through its own dedicated settings page: **Smart Upsell → Recommendation** in the WordPress admin.

Both features are completely free and fully functional. There are no locked features, no upgrade prompts, and no premium tiers.

= Campaign Manager Features =

* Create upsell campaigns (suggest higher-value alternatives) and cross-sell campaigns (suggest complementary products)
* Trigger conditions: specific product, product category, or product tag
* Display on product pages and/or the cart page
* Choose the exact WooCommerce hook position for each page (e.g. after add-to-cart form, inside product summary, before/after cart totals)
* Set campaign priority to control display order when multiple campaigns match
* Enable or disable individual campaigns at any time
* Browse and add recommended products by name search or by category

= Smart Recommendations Features =

Smart Recommendations is a fully independent feature with its own admin settings page (**Smart Upsell → Recommendation**). It is not part of the Campaign Manager and is configured separately.

* Automatically suggests products based on shared product categories and tags
* Scored relevance algorithm: exact category matches rank higher than related or accessory categories
* Supports two recommendation sources: category-based and tag-based (either or both can be enabled)
* Two display layouts: grid and slider/carousel
* Configurable product limit (1–12 products)
* Enable or disable display on product pages and cart pages independently
* Configure the exact WooCommerce hook position for each page separately from campaign positions
* Results are cached for performance using WordPress transients

= Where Recommendations Appear =

Both the Campaign Manager and Smart Recommendations support the following display positions:

* **Product page:** After add-to-cart form (`woocommerce_after_add_to_cart_form`) or inside product summary (`woocommerce_single_product_summary`)
* **Cart page:** Before cart totals (`woocommerce_before_cart_totals`) or after cart totals (`woocommerce_after_cart_totals`)

Campaign widgets and Smart Recommendation widgets are rendered separately. If a campaign matches the current page, it is shown first. Smart Recommendations fill in automatically when no matching campaign exists, or alongside campaigns depending on hook position.

= Theme Compatibility =

All frontend widgets inherit the active WooCommerce theme's colours, fonts, and button styles where possible. No external stylesheets or scripts from third-party CDNs are loaded.

== Source Code & Build ==

The plugin source code is included in this package.

For admin assets:

* Build artifacts: `admin-ui/build/admin-ui/index.js` and `admin-ui/build/admin-ui/index.css`
* Build metadata: `admin-ui/build/admin-ui/index.asset.php`
* Build entrypoint/bootstrap file: `admin-ui/admin-ui.php`

For source visibility during review, matching source copies of the admin build assets are included in:

* `admin-ui/src/admin-ui/index.js`
* `admin-ui/src/admin-ui/admin.css`
* `admin-ui/src/admin-ui/App.js`
* `admin-ui/src/admin-ui/api.js`
* `admin-ui/src/admin-ui/components/Campaigns.js`

Inline admin/frontend behaviour has been moved to enqueued assets in:

* `assets/css/upsell-smart-settings-admin.css`
* `assets/js/upsell-smart-settings-admin.js`
* `assets/js/upsell-frontend.js`

This plugin requires WooCommerce to be installed and active.

== Installation ==

1. Upload the plugin folder to the `/wp-content/plugins/` directory, or install it through the WordPress plugins screen.
2. Activate the plugin through the `Plugins` screen in WordPress.
3. Ensure WooCommerce is installed and active.
4. Go to **Smart Upsell → Campaigns** in the WordPress admin to create rule-based upsell and cross-sell campaigns.
5. Go to **Smart Upsell → Recommendation** to configure the independent Smart Recommendations engine.

== Frequently Asked Questions ==

= Does this plugin require WooCommerce? =

Yes. WooCommerce must be installed and active. The plugin will display an admin notice and skip loading if WooCommerce is not detected.

= Are there any paid features or premium upgrades? =

No. All features described in this readme are fully included and functional. There are no locked settings, no licence keys, no upgrade prompts, and no premium tier.

= What is the difference between Campaigns and Smart Recommendations? =

Campaigns are manual rules you create yourself: you choose which products to show, under what conditions, and where. Smart Recommendations is a separate automated engine that analyses product categories and tags to suggest relevant items without any manual configuration. They are two independent systems, each with their own admin screen, and both are fully free.

= Can I use Campaigns and Smart Recommendations at the same time? =

Yes. They operate independently. If a campaign matches the current page context, its widget is rendered. Smart Recommendations render separately based on their own hook position setting. You can enable both simultaneously.

= Does Smart Recommendations require any API keys or external services? =

No. Smart Recommendations uses only your store's existing WooCommerce product data (categories and tags). No data leaves your server and no third-party service is contacted.

= Where can I configure the Smart Recommendations display position? =

Go to **Smart Upsell → Recommendation** in the WordPress admin. There you will find a "Display Hook Position" setting that lets you choose the WooCommerce hook for both product pages and cart pages independently of campaign positions.

= Does the plugin change my WooCommerce theme? =

No. The plugin inherits theme styling where possible so its frontend widgets blend into the active WooCommerce theme.

= Are the frontend assets always loaded? =

Frontend CSS and JavaScript are enqueued only on WooCommerce product pages and the cart page. They are not loaded on other pages.

= Does the plugin store any personal data? =

The plugin stores an anonymous session ID in a WooCommerce session or a first-party cookie (named `upsell_session_id`) for internal recommendation tracking purposes. No personally identifiable information is collected or transmitted.

== Screenshots ==

1. Campaign management screen — create and manage upsell and cross-sell campaigns
2. Campaign editor — choose trigger conditions, display locations, hook positions, and recommended products
3. Smart Recommendations settings page — independent automated recommendation engine configuration
4. Frontend upsell widget on a product page
5. Frontend Smart Recommendations widget on the cart page

== Changelog ==

= 1.0.0 =

* Initial public release.
* Campaign Manager: rule-based upsell and cross-sell campaigns with product, category, and tag trigger conditions.
* Smart Recommendations: independent automated recommendation engine with category and tag scoring, configurable via its own settings page.
* Two display layouts for Smart Recommendations: grid and slider/carousel.
* Theme-adaptive frontend widgets with carousel navigation.
* Configurable WooCommerce hook positions for both campaigns and Smart Recommendations.

== Upgrade Notice ==

= 1.0.0 =

Initial public release.