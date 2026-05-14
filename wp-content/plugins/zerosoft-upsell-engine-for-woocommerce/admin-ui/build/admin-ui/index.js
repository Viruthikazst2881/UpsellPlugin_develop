/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/admin-ui/App.js"
/*!*****************************!*\
  !*** ./src/admin-ui/App.js ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ App)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _components_Campaigns__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./components/Campaigns */ "./src/admin-ui/components/Campaigns.js");
/* harmony import */ var _admin_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./admin.css */ "./src/admin-ui/admin.css");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);
/**
 * App.js — Main app shell with tab navigation
 */




const branding = window.upsellData?.branding || {};
const TABS = [{
  id: 'campaigns',
  label: 'Campaigns'
}];
function App() {
  const [activeTab, setActiveTab] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('campaigns');
  const recommendationUrl = window.upsellData?.recommendationPageUrl || '#';
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
    className: "ue-app",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "ue-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
        className: "ue-header__brand",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
          className: "ue-header__logo",
          children: "\uD83D\uDED2"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("h1", {
            className: "ue-header__title",
            children: branding.adminName || 'Smart Upsell'
          })
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("nav", {
        className: "ue-nav",
        children: [TABS.map(tab => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
          className: `ue-nav__tab ${activeTab === tab.id ? 'ue-nav__tab--active' : ''}`,
          onClick: () => setActiveTab(tab.id),
          children: tab.label
        }, tab.id)), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("a", {
          className: "ue-nav__tab ue-nav__tab--link",
          href: recommendationUrl,
          children: "Recommendation"
        })]
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
      className: "ue-content",
      children: activeTab === 'campaigns' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_components_Campaigns__WEBPACK_IMPORTED_MODULE_1__["default"], {})
    })]
  });
}

/***/ },

/***/ "./src/admin-ui/api.js"
/*!*****************************!*\
  !*** ./src/admin-ui/api.js ***!
  \*****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createRule: () => (/* binding */ createRule),
/* harmony export */   deleteRule: () => (/* binding */ deleteRule),
/* harmony export */   getProductsByCategory: () => (/* binding */ getProductsByCategory),
/* harmony export */   getProductsByIds: () => (/* binding */ getProductsByIds),
/* harmony export */   getRules: () => (/* binding */ getRules),
/* harmony export */   getTermsByIds: () => (/* binding */ getTermsByIds),
/* harmony export */   searchCategories: () => (/* binding */ searchCategories),
/* harmony export */   searchProducts: () => (/* binding */ searchProducts),
/* harmony export */   searchTags: () => (/* binding */ searchTags),
/* harmony export */   updateRule: () => (/* binding */ updateRule)
/* harmony export */ });
const {
  apiBase,
  nonce
} = window.upsellData || {};
async function request(path, options = {}) {
  try {
    const res = await fetch(`${apiBase}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-WP-Nonce': nonce
      },
      credentials: 'same-origin',
      ...options
    });
    if (!res.ok) {
      let errorMessage = `Request failed: ${res.status}`;
      try {
        const err = await res.json();
        errorMessage = err.message || errorMessage;
        if (errorMessage === 'Cookie check failed') {
          errorMessage = 'Your WordPress session expired. Refresh the admin page and try again.';
        }
      } catch (e) {
        // Response wasn't JSON
      }
      throw new Error(errorMessage);
    }
    return await res.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
const getRules = () => request('/rules');
const createRule = data => request('/rules', {
  method: 'POST',
  body: JSON.stringify(data)
});
const updateRule = (id, data) => request(`/rules/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});
const deleteRule = id => request(`/rules/${id}`, {
  method: 'DELETE'
});
const searchProducts = q => request(`/products/search?search=${encodeURIComponent(q)}`);
const getProductsByIds = ids => request(`/products/by-ids?ids=${ids.join(',')}`);
const getProductsByCategory = id => request(`/products/by-category?category_id=${id}`);
const searchCategories = q => request(`/categories/search?search=${encodeURIComponent(q)}`);
const searchTags = q => request(`/tags/search?search=${encodeURIComponent(q)}`);
const getTermsByIds = (ids, taxonomy) => request(`/terms/by-ids?ids=${ids}&taxonomy=${taxonomy}`);

/***/ },

/***/ "./src/admin-ui/components/Campaigns.js"
/*!**********************************************!*\
  !*** ./src/admin-ui/components/Campaigns.js ***!
  \**********************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Campaigns)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _api__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../api */ "./src/admin-ui/api.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__);
/**
 * Campaigns.js — Campaign-based upsell/cross-sell manager
 */



const {
  symbol: currencySymbol = '',
  position: currencyPosition = 'left'
} = window.upsellData?.currency || {};
function formatPrice(price) {
  if (!price && price !== 0) return '';
  const formatted = parseFloat(price).toLocaleString();
  switch (currencyPosition) {
    case 'right':
      return formatted + currencySymbol;
    case 'left_space':
      return currencySymbol + '\u00a0' + formatted;
    case 'right_space':
      return formatted + '\u00a0' + currencySymbol;
    default:
      return currencySymbol + formatted;
    // 'left'
  }
}
// ── Constants ─────────────────────────────────────────────────

const RULE_TYPES = [{
  value: 'upsell',
  label: 'Upsell',
  desc: 'Suggest a higher-value product',
  icon: '⬆'
}, {
  value: 'cross_sell',
  label: 'Cross-sell',
  desc: 'Suggest complementary products',
  icon: '🔗'
}];
const ALL_LOCATIONS = [{
  value: 'product',
  label: 'Product page',
  group: 'product',
  icon: '📦'
}, {
  value: 'cart',
  label: 'Cart page',
  group: 'cart',
  icon: '🛒'
}];
const DISPLAY_HOOK_OPTIONS = {
  product: [{
    value: 'woocommerce_after_add_to_cart_form',
    label: 'After add to cart form (default)'
  }, {
    value: 'woocommerce_single_product_summary',
    label: 'Inside product summary'
  }],
  cart: [{
    value: 'woocommerce_before_cart_totals',
    label: 'Before cart totals (default)'
  }, {
    value: 'woocommerce_after_cart_totals',
    label: 'After cart totals'
  }]
};
const DEFAULT_DISPLAY_POSITIONS = {
  product: 'woocommerce_after_add_to_cart_form',
  cart: 'woocommerce_before_cart_totals'
};
const CONDITION_TYPES = [{
  value: 'product',
  label: 'Specific product',
  hint: 'Show when a specific product is viewed or in cart',
  icon: '📦'
}, {
  value: 'category',
  label: 'Product category',
  hint: 'Show for any product in selected categories',
  icon: '📂'
}, {
  value: 'tag',
  label: 'Product tag',
  hint: 'Show for any product with selected tags',
  icon: '🏷️'
}];
const EMPTY_CAMPAIGN = {
  name: '',
  ruleType: 'upsell',
  conditionType: 'product',
  triggerProduct: null,
  triggerCategories: [],
  triggerTags: [],
  recProducts: [],
  pages: ['product', 'cart'],
  displayPositions: {
    ...DEFAULT_DISPLAY_POSITIONS
  },
  priority: 0,
  originalConditionType: '',
  originalConditionValue: '',
  status: 1
};
const PAGE_SECTION_LABELS = {
  all: 'All campaigns',
  product: 'Product page',
  cart: 'Cart page'
};
const CAMPAIGN_TYPE_CARDS = [{
  id: 'upsell',
  title: 'Upsell',
  description: 'Show higher-value product suggestions.',
  pageSection: 'all',
  ruleType: 'upsell',
  pages: ['product', 'cart']
}, {
  id: 'cross-sell',
  title: 'Cross-sell',
  description: 'Show complementary product suggestions.',
  pageSection: 'all',
  ruleType: 'cross_sell',
  pages: ['product', 'cart']
}];
const QUICK_TEMPLATES = [{
  id: 'quick-upsell',
  label: 'Upsell',
  ruleType: 'upsell',
  pages: ['product', 'cart'],
  conditionType: 'product'
}, {
  id: 'quick-cross-sell',
  label: 'Cross-sell',
  ruleType: 'cross_sell',
  pages: ['product', 'cart'],
  conditionType: 'product'
}];

// ── Helpers ───────────────────────────────────────────────────

function isActive(rule) {
  return parseInt(rule.status, 10) === 1;
}

// Session state persistence
function loadViewState() {
  try {
    const s = window.sessionStorage.getItem('upsell_admin_view_state');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
function saveViewState(state) {
  try {
    state ? window.sessionStorage.setItem('upsell_admin_view_state', JSON.stringify(state)) : window.sessionStorage.removeItem('upsell_admin_view_state');
  } catch {}
}

// ── Hooks ─────────────────────────────────────────────────────

function useSearch(fn) {
  const [query, setQuery] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [results, setResults] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const run = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((() => {
    let t;
    return q => {
      clearTimeout(t);
      t = setTimeout(async () => {
        if (!q || q.length < 2) {
          setResults([]);
          return;
        }
        setLoading(true);
        try {
          setResults(await fn(q));
        } catch {} finally {
          setLoading(false);
        }
      }, 400);
    };
  })(), []);
  return {
    query,
    results,
    loading,
    search: q => {
      setQuery(q);
      run(q);
    },
    clear: () => {
      setQuery('');
      setResults([]);
    }
  };
}

// ── Small components ──────────────────────────────────────────

function ProductCard({
  p,
  selected,
  onToggle
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    className: `ue-prod-card ${selected ? 'ue-prod-card--sel' : ''}`,
    onClick: () => onToggle(p),
    children: [p.image ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("img", {
      src: p.image,
      alt: p.name,
      className: "ue-prod-card__img"
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: "ue-prod-card__img ue-prod-card__img--ph"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: "ue-prod-card__name",
      children: p.name
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: "ue-prod-card__price",
      children: formatPrice(p.price)
    }), selected && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: "ue-prod-card__check",
      children: "\u2713"
    })]
  });
}
function Chip({
  label,
  count,
  onRemove
}) {
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
    className: "ue-chip",
    children: [label, count !== undefined && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
      className: "ue-chip__count",
      children: ["(", count, ")"]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
      onClick: onRemove,
      children: "\u2715"
    })]
  });
}
function SearchDropdown({
  results,
  onSelect,
  selected = []
}) {
  if (!results.length) return null;
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
    className: "ue-dropdown",
    children: results.map(r => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: `ue-dropdown__item ${selected.find(s => s.id === r.id) ? 'ue-dropdown__item--sel' : ''}`,
      onClick: () => onSelect(r),
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
        className: "ue-dropdown__name",
        children: r.name
      }), r.count !== undefined && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
        className: "ue-dropdown__meta",
        children: [r.count, " products"]
      })]
    }, r.id))
  });
}

// ── Recommended Products Picker ───────────────────────────────

function RecPicker({
  recProducts,
  onAdd,
  onRemove
}) {
  const [mode, setMode] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('search');
  const [catQuery, setCatQuery] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [catResults, setCatResults] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [catLoading, setCatLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [selectedCat, setSelectedCat] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [catProds, setCatProds] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [catProdsLoad, setCatProdsLoad] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const prodSearch = useSearch(_api__WEBPACK_IMPORTED_MODULE_1__.searchProducts);
  const catDebounce = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useCallback)((() => {
    let t;
    return q => {
      clearTimeout(t);
      t = setTimeout(async () => {
        if (!q || q.length < 2) {
          setCatResults([]);
          return;
        }
        setCatLoading(true);
        try {
          setCatResults(await (0,_api__WEBPACK_IMPORTED_MODULE_1__.searchCategories)(q));
        } catch {} finally {
          setCatLoading(false);
        }
      }, 400);
    };
  })(), []);
  async function pickCategory(cat) {
    setSelectedCat(cat);
    setCatQuery(cat.name);
    setCatResults([]);
    setCatProdsLoad(true);
    try {
      setCatProds(await (0,_api__WEBPACK_IMPORTED_MODULE_1__.getProductsByCategory)(cat.id));
    } catch {
      setCatProds([]);
    } finally {
      setCatProdsLoad(false);
    }
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "ue-mode-tabs",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
        className: `ue-mode-tab ${mode === 'search' ? 'ue-mode-tab--active' : ''}`,
        onClick: () => setMode('search'),
        children: "\uD83D\uDD0D Search by name"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
        className: `ue-mode-tab ${mode === 'category' ? 'ue-mode-tab--active' : ''}`,
        onClick: () => setMode('category'),
        children: "\uD83D\uDCC2 Browse by category"
      })]
    }), recProducts.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: "ue-rec-chips",
      children: recProducts.map(p => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "ue-rec-chip",
        children: [p.image && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("img", {
          src: p.image,
          alt: ""
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
          children: p.name
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
          onClick: () => onRemove(p.id),
          children: "\u2715"
        })]
      }, p.id))
    }), mode === 'search' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "ue-search-wrap",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
        className: "ue-input",
        placeholder: "Type product name\u2026",
        value: prodSearch.query,
        onChange: e => prodSearch.search(e.target.value)
      }), prodSearch.loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
        className: "ue-loading-text",
        children: "Searching\u2026"
      }), prodSearch.results.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
        className: "ue-prod-grid ue-prod-grid--search",
        children: prodSearch.results.map(p => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(ProductCard, {
          p: p,
          selected: !!recProducts.find(r => r.id === p.id),
          onToggle: onAdd
        }, p.id))
      })]
    }), mode === 'category' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      children: !selectedCat ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "ue-search-wrap",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
          className: "ue-input",
          placeholder: "Search category name\u2026",
          value: catQuery,
          onChange: e => {
            setCatQuery(e.target.value);
            catDebounce(e.target.value);
          }
        }), catLoading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
          className: "ue-loading-text",
          children: "Searching\u2026"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(SearchDropdown, {
          results: catResults,
          onSelect: pickCategory
        })]
      }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "ue-cat-header",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
            children: ["\uD83D\uDCC2 ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("strong", {
              children: selectedCat.name
            }), " ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
              className: "ue-muted",
              children: ["(", selectedCat.count, " products)"]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            style: {
              display: 'flex',
              gap: '8px'
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
              className: "ue-btn ue-btn--green",
              onClick: () => catProds.forEach(p => onAdd(p)),
              children: "+ Add all"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
              className: "ue-btn ue-btn--ghost",
              onClick: () => {
                setSelectedCat(null);
                setCatQuery('');
                setCatProds([]);
              },
              children: "Change"
            })]
          })]
        }), catProdsLoad ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
          className: "ue-loading-text",
          children: "Loading products\u2026"
        }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
          className: "ue-prod-grid",
          style: {
            marginTop: '12px'
          },
          children: catProds.map(p => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(ProductCard, {
            p: p,
            selected: !!recProducts.find(r => r.id === p.id),
            onToggle: onAdd
          }, p.id))
        })]
      })
    })]
  });
}

// ── Campaign Editor ───────────────────────────────────────────

function CampaignEditor({
  campaign,
  onSave,
  onCancel
}) {
  const [form, setForm] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(campaign);
  const [saving, setSaving] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
  const [notice, setNotice] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)({
    msg: '',
    type: 'success'
  });
  const [openSection, setOpenSection] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('offer');
  const triggerProdSearch = useSearch(_api__WEBPACK_IMPORTED_MODULE_1__.searchProducts);
  const catSearch = useSearch(_api__WEBPACK_IMPORTED_MODULE_1__.searchCategories);
  const tagSearch = useSearch(_api__WEBPACK_IMPORTED_MODULE_1__.searchTags);
  function setF(k, v) {
    setForm(f => ({
      ...f,
      [k]: v
    }));
  }
  function togglePage(page) {
    setForm(f => {
      const newPages = f.pages.includes(page) ? f.pages.filter(p => p !== page) : [...f.pages, page];
      const newPositions = {
        ...f.displayPositions
      };
      if (!f.pages.includes(page)) newPositions[page] = newPositions[page] || DEFAULT_DISPLAY_POSITIONS[page];
      return {
        ...f,
        pages: newPages,
        displayPositions: newPositions
      };
    });
  }
  function setDisplayPosition(page, hook) {
    setForm(f => ({
      ...f,
      displayPositions: {
        ...f.displayPositions,
        [page]: hook
      }
    }));
  }
  function getHookLabel(page, hook) {
    const found = (DISPLAY_HOOK_OPTIONS[page] || []).find(opt => opt.value === hook);
    return found ? found.label : hook || 'Default';
  }
  function setCondType(t) {
    setForm(f => ({
      ...f,
      conditionType: t,
      triggerProduct: null,
      triggerCategories: [],
      triggerTags: []
    }));
    triggerProdSearch.clear();
    catSearch.clear();
    tagSearch.clear();
  }
  function addCat(c) {
    setForm(f => f.triggerCategories.find(x => x.id === c.id) ? f : {
      ...f,
      triggerCategories: [...f.triggerCategories, c]
    });
    catSearch.clear();
  }
  function remCat(id) {
    setForm(f => ({
      ...f,
      triggerCategories: f.triggerCategories.filter(c => c.id !== id)
    }));
  }
  function addTag(t) {
    setForm(f => f.triggerTags.find(x => x.id === t.id) ? f : {
      ...f,
      triggerTags: [...f.triggerTags, t]
    });
    tagSearch.clear();
  }
  function remTag(id) {
    setForm(f => ({
      ...f,
      triggerTags: f.triggerTags.filter(t => t.id !== id)
    }));
  }
  function addRec(p) {
    setForm(f => f.recProducts.find(x => x.id === p.id) ? f : {
      ...f,
      recProducts: [...f.recProducts, p]
    });
  }
  function remRec(id) {
    setForm(f => ({
      ...f,
      recProducts: f.recProducts.filter(p => p.id !== id)
    }));
  }
  function buildCondValue() {
    switch (form.conditionType) {
      case 'product':
        if (form.triggerProduct) return String(form.triggerProduct.id);
        if (form.id && form.originalConditionType === 'product' && form.originalConditionValue) return String(form.originalConditionValue);
        return '0';
      case 'category':
        if (form.triggerCategories.length) return form.triggerCategories.map(c => c.id).join(',');
        if (form.id && form.originalConditionType === 'category' && form.originalConditionValue) return String(form.originalConditionValue);
        return '0';
      case 'tag':
        if (form.triggerTags.length) return form.triggerTags.map(t => t.id).join(',');
        if (form.id && form.originalConditionType === 'tag' && form.originalConditionValue) return String(form.originalConditionValue);
        return '0';
      default:
        return '0';
    }
  }
  const isEdit = !!form.id;
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    saveViewState({
      mode: isEdit ? 'edit' : 'create',
      campaign: form
    });
  }, [form, isEdit]);
  async function save() {
    if (!form.name.trim()) {
      setNotice({
        msg: 'Enter a campaign name.',
        type: 'error'
      });
      return;
    }
    if (!form.recProducts.length) {
      setNotice({
        msg: 'Select at least one recommended product.',
        type: 'error'
      });
      return;
    }
    if (!form.pages.length) {
      setNotice({
        msg: 'Select at least one display location.',
        type: 'error'
      });
      return;
    }
    if (form.conditionType === 'category' && !form.triggerCategories.length) {
      setNotice({
        msg: 'Select at least one category.',
        type: 'error'
      });
      return;
    }
    if (form.conditionType === 'tag' && !form.triggerTags.length) {
      setNotice({
        msg: 'Select at least one tag.',
        type: 'error'
      });
      return;
    }
    setSaving(true);
    setNotice({
      msg: '',
      type: 'success'
    });
    try {
      const finalPositions = {};
      form.pages.forEach(page => {
        finalPositions[page] = form.displayPositions?.[page] || DEFAULT_DISPLAY_POSITIONS[page];
      });
      const payload = {
        rule_name: form.name.trim(),
        rule_type: form.ruleType,
        condition_type: form.conditionType === 'any' ? 'product' : form.conditionType,
        condition_value: buildCondValue(),
        recommended_product_ids: form.recProducts.map(p => p.id),
        display_pages: form.pages,
        display_positions: finalPositions,
        priority: Math.min(10, Math.max(0, Number(form.priority || 0))),
        status: parseInt(form.status, 10)
      };
      if (form.id) {
        await (0,_api__WEBPACK_IMPORTED_MODULE_1__.updateRule)(form.id, payload);
      } else {
        await (0,_api__WEBPACK_IMPORTED_MODULE_1__.createRule)(payload);
      }
      if (isEdit) setNotice({
        msg: 'Campaign updated successfully!',
        type: 'success'
      });
      onSave();
    } catch (e) {
      setNotice({
        msg: e.message,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    className: "ue-editor",
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "ue-editor__header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
        className: "ue-back-btn",
        onClick: onCancel,
        children: "\u2190 Back"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "ue-editor__title-wrap",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
          className: "ue-campaign-name-input",
          placeholder: "Campaign name\u2026",
          value: form.name,
          onChange: e => setF('name', e.target.value)
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
          className: "ue-type-pills",
          children: RULE_TYPES.map(t => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("button", {
            className: `ue-type-pill ${form.ruleType === t.value ? 'ue-type-pill--active' : ''}`,
            onClick: () => setF('ruleType', t.value),
            title: t.desc,
            children: [t.icon, " ", t.label]
          }, t.value))
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "ue-editor__actions",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("label", {
          className: "ue-toggle-wrap",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
            className: "ue-toggle-label",
            children: parseInt(form.status, 10) === 1 ? 'Active' : 'Inactive'
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
            className: `ue-toggle ${parseInt(form.status, 10) === 1 ? 'ue-toggle--on' : ''}`,
            onClick: () => setF('status', parseInt(form.status, 10) === 1 ? 0 : 1),
            children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
              className: "ue-toggle__dot"
            })
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
          className: "ue-btn ue-btn--primary",
          onClick: save,
          disabled: saving,
          children: saving ? 'Saving…' : isEdit ? 'Update' : 'Save & Close'
        })]
      })]
    }), notice.msg && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: `ue-notice ue-notice--${notice.type}`,
      children: notice.msg
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "ue-editor__body",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "ue-editor__main",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "ue-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-section__head",
            onClick: () => setOpenSection(openSection === 'offer' ? '' : 'offer'),
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-section__icon",
              children: "\uD83C\uDF81"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-section__title",
              children: "Offer"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-section__arrow",
              children: openSection === 'offer' ? '▲' : '▼'
            })]
          }), openSection === 'offer' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-section__body",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              className: "ue-field",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
                className: "ue-label",
                children: "Display locations"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
                className: "ue-hint",
                children: "Where should this campaign appear?"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                className: "ue-location-grid",
                children: ALL_LOCATIONS.map(loc => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                  className: `ue-location-card ${form.pages.includes(loc.value) ? 'ue-location-card--active' : ''}`,
                  onClick: () => togglePage(loc.value),
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                    className: "ue-location-card__icon",
                    children: loc.icon
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                    className: "ue-location-card__label",
                    children: loc.label
                  }), form.pages.includes(loc.value) && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                    className: "ue-location-card__check",
                    children: "\u2713"
                  })]
                }, loc.value))
              })]
            }), form.pages.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              className: "ue-field",
              style: {
                marginTop: '16px'
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
                className: "ue-label",
                children: "Display position"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
                className: "ue-hint",
                children: "Choose the exact WooCommerce hook for each selected page."
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                className: "ue-position-grid",
                children: form.pages.map(page => {
                  const options = DISPLAY_HOOK_OPTIONS[page] || [];
                  const currentValue = form.displayPositions?.[page] || DEFAULT_DISPLAY_POSITIONS[page];
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                    className: "ue-position-item",
                    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                      className: "ue-position-item__label",
                      children: ALL_LOCATIONS.find(l => l.value === page)?.label || page
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("select", {
                      className: "ue-select",
                      value: currentValue,
                      onChange: e => setDisplayPosition(page, e.target.value),
                      children: options.map(opt => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("option", {
                        value: opt.value,
                        children: opt.label
                      }, opt.value))
                    })]
                  }, `pos-${page}`);
                })
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              className: "ue-field",
              style: {
                marginTop: '24px'
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
                className: "ue-label",
                children: "Recommended products"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
                className: "ue-hint",
                children: "Products to show as recommendations."
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(RecPicker, {
                recProducts: form.recProducts,
                onAdd: addRec,
                onRemove: remRec
              })]
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "ue-section",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-section__head",
            onClick: () => setOpenSection(openSection === 'conditions' ? '' : 'conditions'),
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-section__icon",
              children: "\u2699\uFE0F"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-section__title",
              children: "Conditions"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-section__badge",
              children: "optional"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-section__arrow",
              children: openSection === 'conditions' ? '▲' : '▼'
            })]
          }), openSection === 'conditions' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-section__body",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("p", {
              className: "ue-hint",
              children: ["Set a trigger condition. Leave as ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("strong", {
                children: "Any product"
              }), " to always show."]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              className: "ue-cond-types",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                className: `ue-cond-type ${form.conditionType === 'any' ? 'ue-cond-type--active' : ''}`,
                onClick: () => setCondType('any'),
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                  children: "\uD83C\uDF10"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                    className: "ue-cond-type__label",
                    children: "All product"
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                    className: "ue-cond-type__hint",
                    children: "Always show"
                  })]
                })]
              }), CONDITION_TYPES.map(ct => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                className: `ue-cond-type ${form.conditionType === ct.value ? 'ue-cond-type--active' : ''}`,
                onClick: () => setCondType(ct.value),
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                  children: ct.icon
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                    className: "ue-cond-type__label",
                    children: ct.label
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                    className: "ue-cond-type__hint",
                    children: ct.hint
                  })]
                })]
              }, ct.value))]
            }), form.conditionType === 'product' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              className: "ue-field",
              style: {
                marginTop: '16px'
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("label", {
                className: "ue-label",
                children: ["Trigger product ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                  className: "ue-muted",
                  children: "(leave empty = any product)"
                })]
              }), form.triggerProduct ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                className: "ue-selected-prod",
                children: [form.triggerProduct.image && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("img", {
                  src: form.triggerProduct.image,
                  alt: ""
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                  children: form.triggerProduct.name
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
                  onClick: () => setF('triggerProduct', null),
                  children: "\u2715 Remove"
                })]
              }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                className: "ue-search-wrap",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
                  className: "ue-input",
                  placeholder: "Search products\u2026",
                  value: triggerProdSearch.query,
                  onChange: e => triggerProdSearch.search(e.target.value)
                }), triggerProdSearch.loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                  className: "ue-loading-text",
                  children: "Searching\u2026"
                }), triggerProdSearch.results.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                  className: "ue-prod-grid ue-prod-grid--search",
                  children: triggerProdSearch.results.map(p => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(ProductCard, {
                    p: p,
                    selected: form.triggerProduct?.id === p.id,
                    onToggle: p => {
                      setF('triggerProduct', p);
                      triggerProdSearch.clear();
                    }
                  }, p.id))
                })]
              })]
            }), form.conditionType === 'category' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              className: "ue-field",
              style: {
                marginTop: '16px'
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
                className: "ue-label",
                children: "Trigger categories"
              }), form.triggerCategories.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                className: "ue-chips",
                children: form.triggerCategories.map(c => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(Chip, {
                  label: c.name,
                  count: c.count,
                  onRemove: () => remCat(c.id)
                }, c.id))
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                className: "ue-search-wrap",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
                  className: "ue-input",
                  placeholder: "Search categories\u2026",
                  value: catSearch.query,
                  onChange: e => catSearch.search(e.target.value)
                }), catSearch.loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                  className: "ue-loading-text",
                  children: "Searching\u2026"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(SearchDropdown, {
                  results: catSearch.results,
                  selected: form.triggerCategories,
                  onSelect: addCat
                })]
              })]
            }), form.conditionType === 'tag' && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              className: "ue-field",
              style: {
                marginTop: '16px'
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
                className: "ue-label",
                children: "Trigger tags"
              }), form.triggerTags.length > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                className: "ue-chips",
                children: form.triggerTags.map(t => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(Chip, {
                  label: t.name,
                  count: t.count,
                  onRemove: () => remTag(t.id)
                }, t.id))
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                className: "ue-search-wrap",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
                  className: "ue-input",
                  placeholder: "Search tags\u2026",
                  value: tagSearch.query,
                  onChange: e => tagSearch.search(e.target.value)
                }), tagSearch.loading && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                  className: "ue-loading-text",
                  children: "Searching\u2026"
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(SearchDropdown, {
                  results: tagSearch.results,
                  selected: form.triggerTags,
                  onSelect: addTag
                })]
              })]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              className: "ue-field",
              style: {
                marginTop: '16px'
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("label", {
                className: "ue-label",
                children: "Priority"
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
                className: "ue-hint",
                children: "Rules with higher priority are displayed first."
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
                className: "ue-input",
                type: "number",
                min: "0",
                max: "10",
                step: "1",
                value: form.priority ?? 0,
                onChange: e => {
                  const v = e.target.value;
                  setF('priority', v === '' ? '' : Math.min(10, Math.max(0, parseInt(v) || 0)));
                },
                onBlur: e => setF('priority', Math.min(10, Math.max(0, parseInt(e.target.value) || 0))),
                placeholder: "0"
              })]
            })]
          })]
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "ue-editor__sidebar",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "ue-sidebar-card",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h4", {
            className: "ue-sidebar-card__title",
            children: "Campaign summary"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-summary-row",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__label",
              children: "Type"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__value",
              children: RULE_TYPES.find(t => t.value === form.ruleType)?.label
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-summary-row",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__label",
              children: "Locations"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__value",
              children: form.pages.length ? form.pages.map(p => ALL_LOCATIONS.find(l => l.value === p)?.label).join(', ') : '—'
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-summary-row",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__label",
              children: "Positions"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__value",
              children: form.pages.length ? form.pages.map(p => `${ALL_LOCATIONS.find(l => l.value === p)?.label}: ${getHookLabel(p, form.displayPositions?.[p])}`).join('; ') : '—'
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-summary-row",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__label",
              children: "Products"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__value",
              children: form.recProducts.length ? `${form.recProducts.length} selected` : '—'
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-summary-row",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__label",
              children: "Trigger"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__value",
              children: form.conditionType === 'any' || form.conditionType === 'product' && !form.triggerProduct ? 'Any product' : form.conditionType === 'product' ? form.triggerProduct.name : form.conditionType === 'category' ? `${form.triggerCategories.length} categories` : `${form.triggerTags.length} tags`
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-summary-row",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__label",
              children: "Priority"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
              className: "ue-summary-row__value",
              children: form.priority ?? 0
            })]
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "ue-sidebar-card",
          style: {
            marginTop: '12px'
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h4", {
            className: "ue-sidebar-card__title",
            children: "\uD83D\uDCA1 Tips"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("ul", {
            className: "ue-tips",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("li", {
              children: ["Use ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("strong", {
                children: "Category"
              }), " trigger to show accessories for all phones at once"]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("li", {
              children: ["Use ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("strong", {
                children: "Browse by category"
              }), " to add all accessories in one click"]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("li", {
              children: ["Enable on ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("strong", {
                children: "Cart"
              }), " for maximum visibility"]
            })]
          })]
        })]
      })]
    })]
  });
}

// ── Campaign List ─────────────────────────────────────────────

function Campaigns() {
  const savedState = loadViewState();
  const [rules, setRules] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)([]);
  const [loading, setLoading] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(true);
  const [view, setView] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(savedState?.mode || 'list');
  const [editData, setEditData] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(savedState?.campaign || null);
  const [activeTab, setActiveTab] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('all');
  const [notice, setNotice] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
  const [selectedSection, setSelectedSection] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('all');
  const [searchQuery, setSearchQuery] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('');
  const [typeFilter, setTypeFilter] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useState)('all');
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    fetchAll();
  }, []);
  async function fetchAll() {
    setLoading(true);
    try {
      const rulesData = await (0,_api__WEBPACK_IMPORTED_MODULE_1__.getRules)();
      setRules(rulesData);
    } catch (e) {
      showNotice('error', e.message);
    } finally {
      setLoading(false);
    }
  }
  function showNotice(type, msg) {
    setNotice({
      type,
      msg
    });
    setTimeout(() => setNotice(null), 4000);
  }
  async function openEdit(rule) {
    const condType = rule.condition_type || 'product';
    const ids = (rule.condition_value || '').split(',').map(v => parseInt(v.trim(), 10)).filter(Boolean);
    let recProducts = [];
    if (rule.recommended_product_ids?.length) {
      try {
        const fetched = await (0,_api__WEBPACK_IMPORTED_MODULE_1__.getProductsByIds)(rule.recommended_product_ids);
        recProducts = fetched.length ? fetched : rule.recommended_product_ids.map(id => ({
          id,
          name: `Product #${id}`
        }));
      } catch {
        recProducts = rule.recommended_product_ids.map(id => ({
          id,
          name: `Product #${id}`
        }));
      }
    }
    let triggerProduct = null;
    if (condType === 'product' && ids[0]) {
      try {
        const f = await (0,_api__WEBPACK_IMPORTED_MODULE_1__.getProductsByIds)([ids[0]]);
        triggerProduct = f[0] || {
          id: ids[0],
          name: `Product #${ids[0]}`
        };
      } catch {
        triggerProduct = {
          id: ids[0],
          name: `Product #${ids[0]}`
        };
      }
    }
    let triggerCategories = [];
    let triggerTags = [];
    if (condType === 'category' && ids.length) {
      try {
        const terms = await (0,_api__WEBPACK_IMPORTED_MODULE_1__.getTermsByIds)(ids.join(','), 'product_cat');
        triggerCategories = terms.length ? terms : ids.map(id => ({
          id,
          name: `Category #${id}`,
          count: 0
        }));
      } catch {
        triggerCategories = ids.map(id => ({
          id,
          name: `Category #${id}`,
          count: 0
        }));
      }
    }
    if (condType === 'tag' && ids.length) {
      try {
        const terms = await (0,_api__WEBPACK_IMPORTED_MODULE_1__.getTermsByIds)(ids.join(','), 'product_tag');
        triggerTags = terms.length ? terms : ids.map(id => ({
          id,
          name: `Tag #${id}`,
          count: 0
        }));
      } catch {
        triggerTags = ids.map(id => ({
          id,
          name: `Tag #${id}`,
          count: 0
        }));
      }
    }
    const pages = Array.isArray(rule.display_pages) ? rule.display_pages : JSON.parse(rule.display_pages || '["product","cart"]');
    const storedPositions = rule.display_positions || {};
    const displayPositions = {};
    pages.forEach(page => {
      displayPositions[page] = storedPositions[page] || DEFAULT_DISPLAY_POSITIONS[page];
    });
    setEditData({
      id: rule.id,
      name: rule.rule_name,
      ruleType: rule.rule_type,
      conditionType: condType === 'product' && (!ids[0] || rule.condition_value === '0') ? 'any' : condType,
      originalConditionType: condType,
      originalConditionValue: rule.condition_value || '',
      triggerProduct,
      triggerCategories,
      triggerTags,
      recProducts,
      pages,
      displayPositions,
      priority: Number(rule.priority ?? 0),
      status: parseInt(rule.status, 10)
    });
    setView('edit');
  }
  async function handleDelete(rule) {
    if (!confirm(`Delete "${rule.rule_name}"?`)) return;
    try {
      await (0,_api__WEBPACK_IMPORTED_MODULE_1__.deleteRule)(rule.id);
      showNotice('success', 'Campaign deleted.');
      fetchAll();
    } catch (e) {
      showNotice('error', e.message);
    }
  }
  async function handleToggle(rule) {
    const newStatus = isActive(rule) ? 0 : 1;
    const previousRules = [...rules];
    setRules(prev => prev.map(r => r.id === rule.id ? {
      ...r,
      status: newStatus
    } : r));
    try {
      await (0,_api__WEBPACK_IMPORTED_MODULE_1__.updateRule)(rule.id, {
        status: newStatus
      });
      await fetchAll();
      showNotice('success', `Campaign ${newStatus === 1 ? 'activated' : 'deactivated'}`);
    } catch (e) {
      setRules(previousRules);
      showNotice('error', `Failed to ${newStatus === 1 ? 'activate' : 'deactivate'} campaign: ${e.message}`);
    }
  }
  function onSaved() {
    saveViewState(null);
    setView('list');
    setEditData(null);
    showNotice('success', 'Campaign saved successfully!');
    fetchAll();
  }
  function onSavedEdit() {
    fetchAll();
    showNotice('success', 'Campaign updated successfully!');
  }
  const filtered = rules.filter(r => activeTab === 'active' ? isActive(r) : activeTab === 'inactive' ? !isActive(r) : true).filter(r => (typeFilter === 'all' || r.rule_type === typeFilter) && (!searchQuery.trim() || (r.rule_name || '').toLowerCase().includes(searchQuery.toLowerCase())));
  const counts = {
    all: rules.length,
    active: rules.filter(r => isActive(r)).length,
    inactive: rules.filter(r => !isActive(r)).length
  };
  const RULE_TYPE_LABEL = {
    upsell: 'Upsell',
    cross_sell: 'Cross-sell'
  };
  const RULE_TYPE_COLOR = {
    upsell: 'blue',
    cross_sell: 'green'
  };
  function condLabel(rule) {
    const val = rule.condition_value || '';
    if (rule.condition_type === 'category') return 'Category';
    if (rule.condition_type === 'tag') return 'Tag';
    if (val === '0' || !val) return 'Any product';
    return `Product #${val}`;
  }
  function hookLabel(page, hook) {
    return (DISPLAY_HOOK_OPTIONS[page] || []).find(opt => opt.value === hook)?.label || hook || 'Default';
  }
  function startCreateFromCard(card) {
    const pos = {};
    card.pages.forEach(page => {
      pos[page] = DEFAULT_DISPLAY_POSITIONS[page];
    });
    setEditData({
      ...EMPTY_CAMPAIGN,
      name: card.title,
      ruleType: card.ruleType,
      pages: card.pages,
      displayPositions: pos,
      status: 1
    });
    setView('create');
  }
  function startQuickTemplate(template) {
    const pos = {};
    template.pages.forEach(page => {
      pos[page] = DEFAULT_DISPLAY_POSITIONS[page];
    });
    setEditData({
      ...EMPTY_CAMPAIGN,
      name: template.label,
      ruleType: template.ruleType,
      conditionType: template.conditionType,
      pages: template.pages,
      displayPositions: pos,
      status: 1
    });
    setView('create');
  }
  if (view === 'create') {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(CampaignEditor, {
      campaign: editData || {
        ...EMPTY_CAMPAIGN
      },
      onSave: onSaved,
      onCancel: () => {
        saveViewState(null);
        setEditData(null);
        setView('chooseType');
      }
    });
  }
  if (view === 'edit' && editData) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(CampaignEditor, {
      campaign: editData,
      onSave: onSavedEdit,
      onCancel: () => {
        saveViewState(null);
        setView('list');
        setEditData(null);
      }
    });
  }
  if (view === 'chooseType') {
    const visibleCards = CAMPAIGN_TYPE_CARDS.filter(c => selectedSection === 'all' || c.pageSection === selectedSection);
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "ue-type-picker",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "ue-type-picker__header",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
          className: "ue-back-btn",
          onClick: () => setView('list'),
          children: "\u2190 Back"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h2", {
          className: "ue-type-picker__title",
          children: "Choose campaign type..."
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "ue-quick-start",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "ue-quick-start__text",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("strong", {
            children: "Quick start"
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
            children: "Create a campaign in 3 steps: choose template, add products, save."
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
          className: "ue-quick-start__actions",
          children: QUICK_TEMPLATES.map(t => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
            className: "ue-btn ue-btn--ghost",
            onClick: () => startQuickTemplate(t),
            children: t.label
          }, t.id))
        })]
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
        className: "ue-type-picker__layout",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("aside", {
          className: "ue-type-picker__sidebar",
          children: Object.entries(PAGE_SECTION_LABELS).map(([key, label]) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
            className: `ue-type-picker__section ${selectedSection === key ? 'ue-type-picker__section--active' : ''}`,
            onClick: () => setSelectedSection(key),
            children: label
          }, key))
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: "ue-type-picker__cards",
          children: [visibleCards.map(card => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-type-card",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h3", {
              className: "ue-type-card__title",
              children: card.title
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
              className: "ue-type-card__desc",
              children: card.description
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
              className: "ue-btn ue-btn--primary",
              onClick: () => startCreateFromCard(card),
              children: "Create Campaign"
            })]
          }, card.id)), visibleCards.length === 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-empty",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h3", {
              children: "No campaign types in this section"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
              children: "Select another section from the left menu."
            })]
          })]
        })]
      })]
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    children: [notice && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: `ue-notice ue-notice--${notice.type}`,
      children: notice.msg
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "ue-list-header",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h2", {
        className: "ue-list-header__title",
        children: "Campaigns"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
        className: "ue-btn ue-btn--primary ue-btn--lg",
        onClick: () => {
          saveViewState(null);
          setEditData(null);
          setSelectedSection('all');
          setView('chooseType');
        },
        children: "+ Create new campaign"
      })]
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: "ue-tabs",
      children: [['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([key, label]) => /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("button", {
        className: `ue-tab ${activeTab === key ? 'ue-tab--active' : ''}`,
        onClick: () => setActiveTab(key),
        children: [label, " ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
          className: "ue-tab__count",
          children: ["(", counts[key], ")"]
        })]
      }, key))
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "ue-toolbar",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("input", {
        className: "ue-input ue-toolbar__search",
        placeholder: "Search campaigns by name...",
        value: searchQuery,
        onChange: e => setSearchQuery(e.target.value)
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("select", {
        className: "ue-select ue-toolbar__filter",
        value: typeFilter,
        onChange: e => setTypeFilter(e.target.value),
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("option", {
          value: "all",
          children: "All types"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("option", {
          value: "upsell",
          children: "Upsell"
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("option", {
          value: "cross_sell",
          children: "Cross-sell"
        })]
      })]
    }), loading ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: "ue-empty",
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
        children: "Loading campaigns\u2026"
      })
    }) : filtered.length === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
      className: "ue-empty",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
        className: "ue-empty__icon",
        children: "\uD83D\uDED2"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("h3", {
        children: "No campaigns yet"
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("p", {
        children: "Create your first campaign to start showing upsell recommendations."
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
        className: "ue-btn ue-btn--primary",
        onClick: () => {
          saveViewState(null);
          setEditData(null);
          setSelectedSection('all');
          setView('chooseType');
        },
        children: "+ Create new campaign"
      })]
    }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: "ue-campaign-list",
      children: filtered.map(rule => {
        const recIds = rule.recommended_product_ids || [];
        const pages = Array.isArray(rule.display_pages) ? rule.display_pages : JSON.parse(rule.display_pages || '[]');
        const displayPositions = rule.display_positions || {};
        const active = isActive(rule);
        return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
          className: `ue-campaign-row ${!active ? 'ue-campaign-row--inactive' : ''}`,
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-campaign-row__left",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
              className: `ue-toggle ${active ? 'ue-toggle--on' : ''}`,
              onClick: () => handleToggle(rule),
              title: active ? 'Active — click to deactivate' : 'Inactive — click to activate',
              children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
                className: "ue-toggle__dot"
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
              className: "ue-campaign-row__info",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                className: "ue-campaign-row__name",
                children: [rule.rule_name, /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("span", {
                  className: `ue-badge ue-badge--${RULE_TYPE_COLOR[rule.rule_type] || 'gray'}`,
                  children: RULE_TYPE_LABEL[rule.rule_type] || rule.rule_type
                })]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
                className: "ue-campaign-row__meta",
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
                  className: "ue-meta-item",
                  children: ["\uD83C\uDFAF ", condLabel(rule)]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
                  className: "ue-meta-item",
                  children: ["\uD83D\uDCE6 ", recIds.length, " product", recIds.length !== 1 ? 's' : '']
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
                  className: "ue-meta-item",
                  children: ["\u2B06 Priority ", Number(rule.priority ?? 0)]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
                  className: "ue-meta-item",
                  children: ["\uD83D\uDCCD ", pages.map(p => ALL_LOCATIONS.find(l => l.value === p)?.label || p).join(', ')]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("span", {
                  className: "ue-meta-item",
                  children: ["\uD83E\uDDED ", pages.map(p => hookLabel(p, displayPositions[p])).join(', ')]
                })]
              })]
            })]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
            className: "ue-campaign-row__actions",
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
              className: "ue-btn ue-btn--ghost",
              onClick: () => openEdit(rule),
              children: "Edit"
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
              className: "ue-btn ue-btn--danger-ghost",
              onClick: () => handleDelete(rule),
              children: "Delete"
            })]
          })]
        }, rule.id);
      })
    })]
  });
}

/***/ },

/***/ "./src/admin-ui/admin.css"
/*!********************************!*\
  !*** ./src/admin-ui/admin.css ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "react/jsx-runtime"
/*!**********************************!*\
  !*** external "ReactJSXRuntime" ***!
  \**********************************/
(module) {

module.exports = window["ReactJSXRuntime"];

/***/ },

/***/ "@wordpress/element"
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
(module) {

module.exports = window["wp"]["element"];

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./src/admin-ui/index.js ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _App__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./App */ "./src/admin-ui/App.js");
/* harmony import */ var _admin_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./admin.css */ "./src/admin-ui/admin.css");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "react/jsx-runtime");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__);
/**
 * index.js — Entry point
 * Mounts the React app into #upsell-admin-root
 */




document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('upsell-admin-root');
  if (root) {
    (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.render)(/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)(_App__WEBPACK_IMPORTED_MODULE_1__["default"], {}), root);
  }
});
})();

/******/ })()
;
//# sourceMappingURL=index.js.map