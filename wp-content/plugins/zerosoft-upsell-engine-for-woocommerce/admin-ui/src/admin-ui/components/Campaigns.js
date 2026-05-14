/**
 * Campaigns.js — Campaign-based upsell/cross-sell manager
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import {
    getRules, createRule, updateRule, deleteRule,
    searchProducts, getProductsByIds, getProductsByCategory,
    searchCategories, searchTags, getTermsByIds,
} from '../api';

const { symbol: currencySymbol = '', position: currencyPosition = 'left' } =
    window.upsellData?.currency || {};

function formatPrice( price ) {
    if ( ! price && price !== 0 ) return '';
    const formatted = parseFloat( price ).toLocaleString();
    switch ( currencyPosition ) {
        case 'right':            return formatted + currencySymbol;
        case 'left_space':       return currencySymbol + '\u00a0' + formatted;
        case 'right_space':      return formatted + '\u00a0' + currencySymbol;
        default:                 return currencySymbol + formatted; // 'left'
    }
}
// ── Constants ─────────────────────────────────────────────────

const RULE_TYPES = [
    { value: 'upsell',     label: 'Upsell',    desc: 'Suggest a higher-value product',  icon: '⬆' },
    { value: 'cross_sell', label: 'Cross-sell', desc: 'Suggest complementary products', icon: '🔗' },
];

const ALL_LOCATIONS = [
    { value: 'product',  label: 'Product page',  group: 'product',  icon: '📦' },
    { value: 'cart',     label: 'Cart page',      group: 'cart',     icon: '🛒' },
];

const DISPLAY_HOOK_OPTIONS = {
    product: [
        { value: 'woocommerce_after_add_to_cart_form', label: 'After add to cart form (default)' },
        { value: 'woocommerce_single_product_summary', label: 'Inside product summary' },
    ],
    cart: [
        { value: 'woocommerce_before_cart_totals', label: 'Before cart totals (default)' },
        { value: 'woocommerce_after_cart_totals',  label: 'After cart totals' },
    ],
};

const DEFAULT_DISPLAY_POSITIONS = {
    product:  'woocommerce_after_add_to_cart_form',
    cart:     'woocommerce_before_cart_totals',
};

const CONDITION_TYPES = [
    { value: 'product',  label: 'Specific product', hint: 'Show when a specific product is viewed or in cart', icon: '📦' },
    { value: 'category', label: 'Product category', hint: 'Show for any product in selected categories',       icon: '📂' },
    { value: 'tag',      label: 'Product tag',       hint: 'Show for any product with selected tags',          icon: '🏷️' },
];

const EMPTY_CAMPAIGN = {
    name:              '',
    ruleType:          'upsell',
    conditionType:     'product',
    triggerProduct:    null,
    triggerCategories: [],
    triggerTags:       [],
    recProducts:       [],
    pages:             ['product', 'cart'],
    displayPositions:  { ...DEFAULT_DISPLAY_POSITIONS },
    priority:          0,
    originalConditionType:  '',
    originalConditionValue: '',
    status:            1,
};

const PAGE_SECTION_LABELS = {
    all:      'All campaigns',
    product:  'Product page',
    cart:     'Cart page',
};

const CAMPAIGN_TYPE_CARDS = [
    { id: 'upsell',     title: 'Upsell',      description: 'Show higher-value product suggestions.',      pageSection: 'all', ruleType: 'upsell',     pages: ['product', 'cart'] },
    { id: 'cross-sell', title: 'Cross-sell',  description: 'Show complementary product suggestions.',     pageSection: 'all', ruleType: 'cross_sell', pages: ['product', 'cart'] },
];

const QUICK_TEMPLATES = [
    { id: 'quick-upsell',      label: 'Upsell',      ruleType: 'upsell',     pages: ['product', 'cart'], conditionType: 'product' },
    { id: 'quick-cross-sell',  label: 'Cross-sell',  ruleType: 'cross_sell', pages: ['product', 'cart'], conditionType: 'product' },
];

// ── Helpers ───────────────────────────────────────────────────

function isActive(rule) {
    return parseInt(rule.status, 10) === 1;
}

// Session state persistence
function loadViewState() {
    try {
        const s = window.sessionStorage.getItem('upsell_admin_view_state');
        return s ? JSON.parse(s) : null;
    } catch { return null; }
}

function saveViewState(state) {
    try {
        state
            ? window.sessionStorage.setItem('upsell_admin_view_state', JSON.stringify(state))
            : window.sessionStorage.removeItem('upsell_admin_view_state');
    } catch {}
}

// ── Hooks ─────────────────────────────────────────────────────

function useSearch(fn) {
    const [query,   setQuery]   = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const run = useCallback((() => {
        let t;
        return (q) => {
            clearTimeout(t);
            t = setTimeout(async () => {
                if (!q || q.length < 2) { setResults([]); return; }
                setLoading(true);
                try { setResults(await fn(q)); } catch {}
                finally { setLoading(false); }
            }, 400);
        };
    })(), []);

    return {
        query, results, loading,
        search: (q) => { setQuery(q); run(q); },
        clear:  ()  => { setQuery(''); setResults([]); },
    };
}

// ── Small components ──────────────────────────────────────────

function ProductCard({ p, selected, onToggle }) {
    return (
        <div className={`ue-prod-card ${selected ? 'ue-prod-card--sel' : ''}`} onClick={() => onToggle(p)}>
            {p.image
                ? <img src={p.image} alt={p.name} className="ue-prod-card__img" />
                : <div className="ue-prod-card__img ue-prod-card__img--ph" />
            }
            <div className="ue-prod-card__name">{p.name}</div>
            <div className="ue-prod-card__price">{formatPrice( p.price )}</div>
            {selected && <div className="ue-prod-card__check">✓</div>}
        </div>
    );
}

function Chip({ label, count, onRemove }) {
    return (
        <span className="ue-chip">
            {label}
            {count !== undefined && <span className="ue-chip__count">({count})</span>}
            <button onClick={onRemove}>✕</button>
        </span>
    );
}

function SearchDropdown({ results, onSelect, selected = [] }) {
    if (!results.length) return null;
    return (
        <div className="ue-dropdown">
            {results.map(r => (
                <div key={r.id}
                    className={`ue-dropdown__item ${selected.find(s => s.id === r.id) ? 'ue-dropdown__item--sel' : ''}`}
                    onClick={() => onSelect(r)}>
                    <span className="ue-dropdown__name">{r.name}</span>
                    {r.count !== undefined && <span className="ue-dropdown__meta">{r.count} products</span>}
                </div>
            ))}
        </div>
    );
}

// ── Recommended Products Picker ───────────────────────────────

function RecPicker({ recProducts, onAdd, onRemove }) {
    const [mode,         setMode]         = useState('search');
    const [catQuery,     setCatQuery]     = useState('');
    const [catResults,   setCatResults]   = useState([]);
    const [catLoading,   setCatLoading]   = useState(false);
    const [selectedCat,  setSelectedCat]  = useState(null);
    const [catProds,     setCatProds]     = useState([]);
    const [catProdsLoad, setCatProdsLoad] = useState(false);
    const prodSearch = useSearch(searchProducts);

    const catDebounce = useCallback((() => {
        let t;
        return (q) => {
            clearTimeout(t);
            t = setTimeout(async () => {
                if (!q || q.length < 2) { setCatResults([]); return; }
                setCatLoading(true);
                try { setCatResults(await searchCategories(q)); } catch {}
                finally { setCatLoading(false); }
            }, 400);
        };
    })(), []);

    async function pickCategory(cat) {
        setSelectedCat(cat);
        setCatQuery(cat.name);
        setCatResults([]);
        setCatProdsLoad(true);
        try { setCatProds(await getProductsByCategory(cat.id)); }
        catch { setCatProds([]); }
        finally { setCatProdsLoad(false); }
    }

    return (
        <div>
            <div className="ue-mode-tabs">
                <button className={`ue-mode-tab ${mode === 'search'   ? 'ue-mode-tab--active' : ''}`} onClick={() => setMode('search')}>🔍 Search by name</button>
                <button className={`ue-mode-tab ${mode === 'category' ? 'ue-mode-tab--active' : ''}`} onClick={() => setMode('category')}>📂 Browse by category</button>
            </div>

            {recProducts.length > 0 && (
                <div className="ue-rec-chips">
                    {recProducts.map(p => (
                        <div key={p.id} className="ue-rec-chip">
                            {p.image && <img src={p.image} alt="" />}
                            <span>{p.name}</span>
                            <button onClick={() => onRemove(p.id)}>✕</button>
                        </div>
                    ))}
                </div>
            )}

            {mode === 'search' && (
                <div className="ue-search-wrap">
                    <input className="ue-input" placeholder="Type product name…"
                        value={prodSearch.query} onChange={e => prodSearch.search(e.target.value)} />
                    {prodSearch.loading && <span className="ue-loading-text">Searching…</span>}
                    {prodSearch.results.length > 0 && (
                        <div className="ue-prod-grid ue-prod-grid--search">
                            {prodSearch.results.map(p => (
                                <ProductCard key={p.id} p={p}
                                    selected={!!recProducts.find(r => r.id === p.id)}
                                    onToggle={onAdd} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {mode === 'category' && (
                <div>
                    {!selectedCat ? (
                        <div className="ue-search-wrap">
                            <input className="ue-input" placeholder="Search category name…"
                                value={catQuery} onChange={e => { setCatQuery(e.target.value); catDebounce(e.target.value); }} />
                            {catLoading && <span className="ue-loading-text">Searching…</span>}
                            <SearchDropdown results={catResults} onSelect={pickCategory} />
                        </div>
                    ) : (
                        <div>
                            <div className="ue-cat-header">
                                <span>📂 <strong>{selectedCat.name}</strong> <span className="ue-muted">({selectedCat.count} products)</span></span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="ue-btn ue-btn--green" onClick={() => catProds.forEach(p => onAdd(p))}>+ Add all</button>
                                    <button className="ue-btn ue-btn--ghost" onClick={() => { setSelectedCat(null); setCatQuery(''); setCatProds([]); }}>Change</button>
                                </div>
                            </div>
                            {catProdsLoad ? <p className="ue-loading-text">Loading products…</p> : (
                                <div className="ue-prod-grid" style={{ marginTop: '12px' }}>
                                    {catProds.map(p => (
                                        <ProductCard key={p.id} p={p}
                                            selected={!!recProducts.find(r => r.id === p.id)}
                                            onToggle={onAdd} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Campaign Editor ───────────────────────────────────────────

function CampaignEditor({ campaign, onSave, onCancel }) {
    const [form,        setForm]        = useState(campaign);
    const [saving,      setSaving]      = useState(false);
    const [notice,      setNotice]      = useState({ msg: '', type: 'success' });
    const [openSection, setOpenSection] = useState('offer');

    const triggerProdSearch = useSearch(searchProducts);
    const catSearch         = useSearch(searchCategories);
    const tagSearch         = useSearch(searchTags);

    function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

    function togglePage(page) {
        setForm(f => {
            const newPages     = f.pages.includes(page) ? f.pages.filter(p => p !== page) : [...f.pages, page];
            const newPositions = { ...f.displayPositions };
            if (!f.pages.includes(page)) newPositions[page] = newPositions[page] || DEFAULT_DISPLAY_POSITIONS[page];
            return { ...f, pages: newPages, displayPositions: newPositions };
        });
    }

    function setDisplayPosition(page, hook) {
        setForm(f => ({ ...f, displayPositions: { ...f.displayPositions, [page]: hook } }));
    }

    function getHookLabel(page, hook) {
        const found = (DISPLAY_HOOK_OPTIONS[page] || []).find(opt => opt.value === hook);
        return found ? found.label : (hook || 'Default');
    }

    function setCondType(t) {
        setForm(f => ({ ...f, conditionType: t, triggerProduct: null, triggerCategories: [], triggerTags: [] }));
        triggerProdSearch.clear(); catSearch.clear(); tagSearch.clear();
    }

    function addCat(c) { setForm(f => f.triggerCategories.find(x => x.id === c.id) ? f : { ...f, triggerCategories: [...f.triggerCategories, c] }); catSearch.clear(); }
    function remCat(id){ setForm(f => ({ ...f, triggerCategories: f.triggerCategories.filter(c => c.id !== id) })); }
    function addTag(t) { setForm(f => f.triggerTags.find(x => x.id === t.id) ? f : { ...f, triggerTags: [...f.triggerTags, t] }); tagSearch.clear(); }
    function remTag(id){ setForm(f => ({ ...f, triggerTags: f.triggerTags.filter(t => t.id !== id) })); }
    function addRec(p) { setForm(f => f.recProducts.find(x => x.id === p.id) ? f : { ...f, recProducts: [...f.recProducts, p] }); }
    function remRec(id){ setForm(f => ({ ...f, recProducts: f.recProducts.filter(p => p.id !== id) })); }

    function buildCondValue() {
        switch (form.conditionType) {
            case 'product':
                if (form.triggerProduct) return String(form.triggerProduct.id);
                if (form.id && form.originalConditionType === 'product' && form.originalConditionValue)
                    return String(form.originalConditionValue);
                return '0';
            case 'category':
                if (form.triggerCategories.length) return form.triggerCategories.map(c => c.id).join(',');
                if (form.id && form.originalConditionType === 'category' && form.originalConditionValue)
                    return String(form.originalConditionValue);
                return '0';
            case 'tag':
                if (form.triggerTags.length) return form.triggerTags.map(t => t.id).join(',');
                if (form.id && form.originalConditionType === 'tag' && form.originalConditionValue)
                    return String(form.originalConditionValue);
                return '0';
            default: return '0';
        }
    }

    const isEdit = !!form.id;

    useEffect(() => {
        saveViewState({ mode: isEdit ? 'edit' : 'create', campaign: form });
    }, [form, isEdit]);

    async function save() {
        if (!form.name.trim())        { setNotice({ msg: 'Enter a campaign name.',                    type: 'error' }); return; }
        if (!form.recProducts.length) { setNotice({ msg: 'Select at least one recommended product.', type: 'error' }); return; }
        if (!form.pages.length)       { setNotice({ msg: 'Select at least one display location.',    type: 'error' }); return; }
        if (form.conditionType === 'category' && !form.triggerCategories.length) { setNotice({ msg: 'Select at least one category.', type: 'error' }); return; }
        if (form.conditionType === 'tag'      && !form.triggerTags.length)       { setNotice({ msg: 'Select at least one tag.',      type: 'error' }); return; }

        setSaving(true);
        setNotice({ msg: '', type: 'success' });
        try {
            const finalPositions = {};
            form.pages.forEach(page => {
                finalPositions[page] = form.displayPositions?.[page] || DEFAULT_DISPLAY_POSITIONS[page];
            });

            const payload = {
                rule_name:         form.name.trim(),
                rule_type:         form.ruleType,
                condition_type:    form.conditionType === 'any' ? 'product' : form.conditionType,
                condition_value:   buildCondValue(),
                recommended_product_ids: form.recProducts.map(p => p.id),
                display_pages:     form.pages,
                display_positions: finalPositions,
                priority:          Math.min(10, Math.max(0, Number(form.priority || 0))),
                status:            parseInt(form.status, 10),
            };

            if (form.id) {
                await updateRule(form.id, payload);
            } else {
                await createRule(payload);
            }

            if (isEdit) setNotice({ msg: 'Campaign updated successfully!', type: 'success' });
            onSave();
        } catch (e) {
            setNotice({ msg: e.message, type: 'error' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="ue-editor">
            <div className="ue-editor__header">
                <button className="ue-back-btn" onClick={onCancel}>← Back</button>
                <div className="ue-editor__title-wrap">
                    <input
                        className="ue-campaign-name-input"
                        placeholder="Campaign name…"
                        value={form.name}
                        onChange={e => setF('name', e.target.value)}
                    />
                    <div className="ue-type-pills">
                        {RULE_TYPES.map(t => (
                            <button key={t.value}
                                className={`ue-type-pill ${form.ruleType === t.value ? 'ue-type-pill--active' : ''}`}
                                onClick={() => setF('ruleType', t.value)}
                                title={t.desc}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="ue-editor__actions">
                    <label className="ue-toggle-wrap">
                        <span className="ue-toggle-label">{parseInt(form.status, 10) === 1 ? 'Active' : 'Inactive'}</span>
                        <div className={`ue-toggle ${parseInt(form.status, 10) === 1 ? 'ue-toggle--on' : ''}`}
                            onClick={() => setF('status', parseInt(form.status, 10) === 1 ? 0 : 1)}>
                            <div className="ue-toggle__dot" />
                        </div>
                    </label>
                    <button className="ue-btn ue-btn--primary" onClick={save} disabled={saving}>
                        {saving ? 'Saving…' : (isEdit ? 'Update' : 'Save & Close')}
                    </button>
                </div>
            </div>

            {notice.msg && <div className={`ue-notice ue-notice--${notice.type}`}>{notice.msg}</div>}

            <div className="ue-editor__body">
                <div className="ue-editor__main">

                    {/* OFFER SECTION */}
                    <div className="ue-section">
                        <div className="ue-section__head" onClick={() => setOpenSection(openSection === 'offer' ? '' : 'offer')}>
                            <span className="ue-section__icon">🎁</span>
                            <span className="ue-section__title">Offer</span>
                            <span className="ue-section__arrow">{openSection === 'offer' ? '▲' : '▼'}</span>
                        </div>

                        {openSection === 'offer' && (
                            <div className="ue-section__body">
                                <div className="ue-field">
                                    <label className="ue-label">Display locations</label>
                                    <p className="ue-hint">Where should this campaign appear?</p>
                                    <div className="ue-location-grid">
                                        {ALL_LOCATIONS.map(loc => (
                                            <div key={loc.value}
                                                className={`ue-location-card ${form.pages.includes(loc.value) ? 'ue-location-card--active' : ''}`}
                                                onClick={() => togglePage(loc.value)}>
                                                <span className="ue-location-card__icon">{loc.icon}</span>
                                                <span className="ue-location-card__label">{loc.label}</span>
                                                {form.pages.includes(loc.value) && <span className="ue-location-card__check">✓</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {form.pages.length > 0 && (
                                    <div className="ue-field" style={{ marginTop: '16px' }}>
                                        <label className="ue-label">Display position</label>
                                        <p className="ue-hint">Choose the exact WooCommerce hook for each selected page.</p>
                                        <div className="ue-position-grid">
                                            {form.pages.map(page => {
                                                const options      = DISPLAY_HOOK_OPTIONS[page] || [];
                                                const currentValue = form.displayPositions?.[page] || DEFAULT_DISPLAY_POSITIONS[page];
                                                return (
                                                    <div className="ue-position-item" key={`pos-${page}`}>
                                                        <span className="ue-position-item__label">
                                                            {ALL_LOCATIONS.find(l => l.value === page)?.label || page}
                                                        </span>
                                                        <select className="ue-select" value={currentValue}
                                                            onChange={e => setDisplayPosition(page, e.target.value)}>
                                                            {options.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="ue-field" style={{ marginTop: '24px' }}>
                                    <label className="ue-label">Recommended products</label>
                                    <p className="ue-hint">Products to show as recommendations.</p>
                                    <RecPicker recProducts={form.recProducts} onAdd={addRec} onRemove={remRec} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CONDITIONS SECTION */}
                    <div className="ue-section">
                        <div className="ue-section__head" onClick={() => setOpenSection(openSection === 'conditions' ? '' : 'conditions')}>
                            <span className="ue-section__icon">⚙️</span>
                            <span className="ue-section__title">Conditions</span>
                            <span className="ue-section__badge">optional</span>
                            <span className="ue-section__arrow">{openSection === 'conditions' ? '▲' : '▼'}</span>
                        </div>

                        {openSection === 'conditions' && (
                            <div className="ue-section__body">
                                <p className="ue-hint">Set a trigger condition. Leave as <strong>Any product</strong> to always show.</p>

                                <div className="ue-cond-types">
                                    <div className={`ue-cond-type ${form.conditionType === 'any' ? 'ue-cond-type--active' : ''}`}
                                        onClick={() => setCondType('any')}>
                                        <span>🌐</span>
                                        <div>
                                            <div className="ue-cond-type__label">All product</div>
                                            <div className="ue-cond-type__hint">Always show</div>
                                        </div>
                                    </div>
                                    {CONDITION_TYPES.map(ct => (
                                        <div key={ct.value}
                                            className={`ue-cond-type ${form.conditionType === ct.value ? 'ue-cond-type--active' : ''}`}
                                            onClick={() => setCondType(ct.value)}>
                                            <span>{ct.icon}</span>
                                            <div>
                                                <div className="ue-cond-type__label">{ct.label}</div>
                                                <div className="ue-cond-type__hint">{ct.hint}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {form.conditionType === 'product' && (
                                    <div className="ue-field" style={{ marginTop: '16px' }}>
                                        <label className="ue-label">Trigger product <span className="ue-muted">(leave empty = any product)</span></label>
                                        {form.triggerProduct ? (
                                            <div className="ue-selected-prod">
                                                {form.triggerProduct.image && <img src={form.triggerProduct.image} alt="" />}
                                                <span>{form.triggerProduct.name}</span>
                                                <button onClick={() => setF('triggerProduct', null)}>✕ Remove</button>
                                            </div>
                                        ) : (
                                            <div className="ue-search-wrap">
                                                <input className="ue-input" placeholder="Search products…"
                                                    value={triggerProdSearch.query}
                                                    onChange={e => triggerProdSearch.search(e.target.value)} />
                                                {triggerProdSearch.loading && <span className="ue-loading-text">Searching…</span>}
                                                {triggerProdSearch.results.length > 0 && (
                                                    <div className="ue-prod-grid ue-prod-grid--search">
                                                        {triggerProdSearch.results.map(p => (
                                                            <ProductCard key={p.id} p={p}
                                                                selected={form.triggerProduct?.id === p.id}
                                                                onToggle={p => { setF('triggerProduct', p); triggerProdSearch.clear(); }} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {form.conditionType === 'category' && (
                                    <div className="ue-field" style={{ marginTop: '16px' }}>
                                        <label className="ue-label">Trigger categories</label>
                                        {form.triggerCategories.length > 0 && (
                                            <div className="ue-chips">
                                                {form.triggerCategories.map(c => <Chip key={c.id} label={c.name} count={c.count} onRemove={() => remCat(c.id)} />)}
                                            </div>
                                        )}
                                        <div className="ue-search-wrap">
                                            <input className="ue-input" placeholder="Search categories…"
                                                value={catSearch.query} onChange={e => catSearch.search(e.target.value)} />
                                            {catSearch.loading && <span className="ue-loading-text">Searching…</span>}
                                            <SearchDropdown results={catSearch.results} selected={form.triggerCategories} onSelect={addCat} />
                                        </div>
                                    </div>
                                )}

                                {form.conditionType === 'tag' && (
                                    <div className="ue-field" style={{ marginTop: '16px' }}>
                                        <label className="ue-label">Trigger tags</label>
                                        {form.triggerTags.length > 0 && (
                                            <div className="ue-chips">
                                                {form.triggerTags.map(t => <Chip key={t.id} label={t.name} count={t.count} onRemove={() => remTag(t.id)} />)}
                                            </div>
                                        )}
                                        <div className="ue-search-wrap">
                                            <input className="ue-input" placeholder="Search tags…"
                                                value={tagSearch.query} onChange={e => tagSearch.search(e.target.value)} />
                                            {tagSearch.loading && <span className="ue-loading-text">Searching…</span>}
                                            <SearchDropdown results={tagSearch.results} selected={form.triggerTags} onSelect={addTag} />
                                        </div>
                                    </div>
                                )}

                                <div className="ue-field" style={{ marginTop: '16px' }}>
                                    <label className="ue-label">Priority</label>
                                    <p className="ue-hint">Rules with higher priority are displayed first.</p>
                                    <input
                                        className="ue-input"
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="1"
                                        value={form.priority ?? 0}
                                        onChange={e => {
                                            const v = e.target.value;
                                            setF('priority', v === '' ? '' : Math.min(10, Math.max(0, parseInt(v) || 0)));
                                        }}
                                        onBlur={e => setF('priority', Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="ue-editor__sidebar">
                    <div className="ue-sidebar-card">
                        <h4 className="ue-sidebar-card__title">Campaign summary</h4>
                        <div className="ue-summary-row">
                            <span className="ue-summary-row__label">Type</span>
                            <span className="ue-summary-row__value">{RULE_TYPES.find(t => t.value === form.ruleType)?.label}</span>
                        </div>
                        <div className="ue-summary-row">
                            <span className="ue-summary-row__label">Locations</span>
                            <span className="ue-summary-row__value">
                                {form.pages.length ? form.pages.map(p => ALL_LOCATIONS.find(l => l.value === p)?.label).join(', ') : '—'}
                            </span>
                        </div>
                        <div className="ue-summary-row">
                            <span className="ue-summary-row__label">Positions</span>
                            <span className="ue-summary-row__value">
                                {form.pages.length
                                    ? form.pages.map(p => `${ALL_LOCATIONS.find(l => l.value === p)?.label}: ${getHookLabel(p, form.displayPositions?.[p])}`).join('; ')
                                    : '—'}
                            </span>
                        </div>
                        <div className="ue-summary-row">
                            <span className="ue-summary-row__label">Products</span>
                            <span className="ue-summary-row__value">{form.recProducts.length ? `${form.recProducts.length} selected` : '—'}</span>
                        </div>
                        <div className="ue-summary-row">
                            <span className="ue-summary-row__label">Trigger</span>
                            <span className="ue-summary-row__value">
                                {form.conditionType === 'any' || (form.conditionType === 'product' && !form.triggerProduct)
                                    ? 'Any product'
                                    : form.conditionType === 'product'  ? form.triggerProduct.name
                                    : form.conditionType === 'category' ? `${form.triggerCategories.length} categories`
                                    : `${form.triggerTags.length} tags`}
                            </span>
                        </div>
                        <div className="ue-summary-row">
                            <span className="ue-summary-row__label">Priority</span>
                            <span className="ue-summary-row__value">{form.priority ?? 0}</span>
                        </div>
                    </div>

                    <div className="ue-sidebar-card" style={{ marginTop: '12px' }}>
                        <h4 className="ue-sidebar-card__title">💡 Tips</h4>
                        <ul className="ue-tips">
                            <li>Use <strong>Category</strong> trigger to show accessories for all phones at once</li>
                            <li>Use <strong>Browse by category</strong> to add all accessories in one click</li>
                            <li>Enable on <strong>Cart</strong> for maximum visibility</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Campaign List ─────────────────────────────────────────────

export default function Campaigns() {
    const savedState = loadViewState();

    const [rules,           setRules]           = useState([]);
    const [loading,         setLoading]         = useState(true);
    const [view,            setView]            = useState(savedState?.mode || 'list');
    const [editData,        setEditData]        = useState(savedState?.campaign || null);
    const [activeTab,       setActiveTab]       = useState('all');
    const [notice,          setNotice]          = useState(null);
    const [selectedSection, setSelectedSection] = useState('all');
    const [searchQuery,     setSearchQuery]     = useState('');
    const [typeFilter,      setTypeFilter]      = useState('all');

    useEffect(() => { fetchAll(); }, []);

    async function fetchAll() {
        setLoading(true);
        try {
            const rulesData = await getRules();
            setRules(rulesData);
        } catch (e) {
            showNotice('error', e.message);
        } finally {
            setLoading(false);
        }
    }

    function showNotice(type, msg) {
        setNotice({ type, msg });
        setTimeout(() => setNotice(null), 4000);
    }

    async function openEdit(rule) {
        const condType = rule.condition_type || 'product';
        const ids      = (rule.condition_value || '').split(',').map(v => parseInt(v.trim(), 10)).filter(Boolean);

        let recProducts = [];
        if (rule.recommended_product_ids?.length) {
            try {
                const fetched = await getProductsByIds(rule.recommended_product_ids);
                recProducts   = fetched.length ? fetched : rule.recommended_product_ids.map(id => ({ id, name: `Product #${id}` }));
            } catch {
                recProducts = rule.recommended_product_ids.map(id => ({ id, name: `Product #${id}` }));
            }
        }

        let triggerProduct = null;
        if (condType === 'product' && ids[0]) {
            try {
                const f = await getProductsByIds([ids[0]]);
                triggerProduct = f[0] || { id: ids[0], name: `Product #${ids[0]}` };
            } catch {
                triggerProduct = { id: ids[0], name: `Product #${ids[0]}` };
            }
        }

        let triggerCategories = [];
        let triggerTags       = [];
        if (condType === 'category' && ids.length) {
            try {
                const terms   = await getTermsByIds(ids.join(','), 'product_cat');
                triggerCategories = terms.length ? terms : ids.map(id => ({ id, name: `Category #${id}`, count: 0 }));
            } catch {
                triggerCategories = ids.map(id => ({ id, name: `Category #${id}`, count: 0 }));
            }
        }
        if (condType === 'tag' && ids.length) {
            try {
                const terms = await getTermsByIds(ids.join(','), 'product_tag');
                triggerTags = terms.length ? terms : ids.map(id => ({ id, name: `Tag #${id}`, count: 0 }));
            } catch {
                triggerTags = ids.map(id => ({ id, name: `Tag #${id}`, count: 0 }));
            }
        }

        const pages            = Array.isArray(rule.display_pages) ? rule.display_pages : JSON.parse(rule.display_pages || '["product","cart"]');
        const storedPositions  = rule.display_positions || {};
        const displayPositions = {};
        pages.forEach(page => { displayPositions[page] = storedPositions[page] || DEFAULT_DISPLAY_POSITIONS[page]; });

        setEditData({
            id:                     rule.id,
            name:                   rule.rule_name,
            ruleType:               rule.rule_type,
            conditionType:          condType === 'product' && (!ids[0] || rule.condition_value === '0') ? 'any' : condType,
            originalConditionType:  condType,
            originalConditionValue: rule.condition_value || '',
            triggerProduct,
            triggerCategories,
            triggerTags,
            recProducts,
            pages,
            displayPositions,
            priority: Number(rule.priority ?? 0),
            status:   parseInt(rule.status, 10),
        });
        setView('edit');
    }

    async function handleDelete(rule) {
        if (!confirm(`Delete "${rule.rule_name}"?`)) return;
        try {
            await deleteRule(rule.id);
            showNotice('success', 'Campaign deleted.');
            fetchAll();
        } catch (e) {
            showNotice('error', e.message);
        }
    }

    async function handleToggle(rule) {
        const newStatus    = isActive(rule) ? 0 : 1;
        const previousRules = [...rules];
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: newStatus } : r));
        try {
            await updateRule(rule.id, { status: newStatus });
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

    const filtered = rules
        .filter(r => activeTab === 'active' ? isActive(r) : activeTab === 'inactive' ? !isActive(r) : true)
        .filter(r => (typeFilter === 'all' || r.rule_type === typeFilter) && (!searchQuery.trim() || (r.rule_name || '').toLowerCase().includes(searchQuery.toLowerCase())));

    const counts = {
        all:      rules.length,
        active:   rules.filter(r => isActive(r)).length,
        inactive: rules.filter(r => !isActive(r)).length,
    };

    const RULE_TYPE_LABEL = { upsell: 'Upsell', cross_sell: 'Cross-sell' };
    const RULE_TYPE_COLOR = { upsell: 'blue',   cross_sell: 'green' };

    function condLabel(rule) {
        const val = rule.condition_value || '';
        if (rule.condition_type === 'category') return 'Category';
        if (rule.condition_type === 'tag')      return 'Tag';
        if (val === '0' || !val)                return 'Any product';
        return `Product #${val}`;
    }

    function hookLabel(page, hook) {
        return (DISPLAY_HOOK_OPTIONS[page] || []).find(opt => opt.value === hook)?.label || hook || 'Default';
    }

    function startCreateFromCard(card) {
        const pos = {};
        card.pages.forEach(page => { pos[page] = DEFAULT_DISPLAY_POSITIONS[page]; });
        setEditData({ ...EMPTY_CAMPAIGN, name: card.title, ruleType: card.ruleType, pages: card.pages, displayPositions: pos, status: 1 });
        setView('create');
    }

    function startQuickTemplate(template) {
        const pos = {};
        template.pages.forEach(page => { pos[page] = DEFAULT_DISPLAY_POSITIONS[page]; });
        setEditData({ ...EMPTY_CAMPAIGN, name: template.label, ruleType: template.ruleType, conditionType: template.conditionType, pages: template.pages, displayPositions: pos, status: 1 });
        setView('create');
    }

    if (view === 'create') {
        return <CampaignEditor campaign={editData || { ...EMPTY_CAMPAIGN }}
            onSave={onSaved} onCancel={() => { saveViewState(null); setEditData(null); setView('chooseType'); }} />;
    }
    if (view === 'edit' && editData) {
        return <CampaignEditor campaign={editData}
            onSave={onSavedEdit} onCancel={() => { saveViewState(null); setView('list'); setEditData(null); }} />;
    }
    if (view === 'chooseType') {
        const visibleCards = CAMPAIGN_TYPE_CARDS.filter(c => selectedSection === 'all' || c.pageSection === selectedSection);
        return (
            <div className="ue-type-picker">
                <div className="ue-type-picker__header">
                    <button className="ue-back-btn" onClick={() => setView('list')}>← Back</button>
                    <h2 className="ue-type-picker__title">Choose campaign type...</h2>
                </div>
                <div className="ue-quick-start">
                    <div className="ue-quick-start__text">
                        <strong>Quick start</strong>
                        <span>Create a campaign in 3 steps: choose template, add products, save.</span>
                    </div>
                    <div className="ue-quick-start__actions">
                        {QUICK_TEMPLATES.map(t => (
                            <button key={t.id} className="ue-btn ue-btn--ghost" onClick={() => startQuickTemplate(t)}>{t.label}</button>
                        ))}
                    </div>
                </div>
                <div className="ue-type-picker__layout">
                    <aside className="ue-type-picker__sidebar">
                        {Object.entries(PAGE_SECTION_LABELS).map(([key, label]) => (
                            <button key={key}
                                className={`ue-type-picker__section ${selectedSection === key ? 'ue-type-picker__section--active' : ''}`}
                                onClick={() => setSelectedSection(key)}>
                                {label}
                            </button>
                        ))}
                    </aside>
                    <div className="ue-type-picker__cards">
                        {visibleCards.map(card => (
                            <div className="ue-type-card" key={card.id}>
                                <h3 className="ue-type-card__title">{card.title}</h3>
                                <p className="ue-type-card__desc">{card.description}</p>
                                <button className="ue-btn ue-btn--primary" onClick={() => startCreateFromCard(card)}>Create Campaign</button>
                            </div>
                        ))}
                        {visibleCards.length === 0 && (
                            <div className="ue-empty">
                                <h3>No campaign types in this section</h3>
                                <p>Select another section from the left menu.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {notice && <div className={`ue-notice ue-notice--${notice.type}`}>{notice.msg}</div>}

            <div className="ue-list-header">
                <h2 className="ue-list-header__title">Campaigns</h2>
                <button className="ue-btn ue-btn--primary ue-btn--lg"
                    onClick={() => { saveViewState(null); setEditData(null); setSelectedSection('all'); setView('chooseType'); }}>
                    + Create new campaign
                </button>
            </div>

            <div className="ue-tabs">
                {[['all','All'],['active','Active'],['inactive','Inactive']].map(([key, label]) => (
                    <button key={key}
                        className={`ue-tab ${activeTab === key ? 'ue-tab--active' : ''}`}
                        onClick={() => setActiveTab(key)}>
                        {label} <span className="ue-tab__count">({counts[key]})</span>
                    </button>
                ))}
            </div>

            <div className="ue-toolbar">
                <input className="ue-input ue-toolbar__search"
                    placeholder="Search campaigns by name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)} />
                <select className="ue-select ue-toolbar__filter" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="all">All types</option>
                    <option value="upsell">Upsell</option>
                    <option value="cross_sell">Cross-sell</option>
                </select>
            </div>

            {loading ? (
                <div className="ue-empty"><p>Loading campaigns…</p></div>
            ) : filtered.length === 0 ? (
                <div className="ue-empty">
                    <div className="ue-empty__icon">🛒</div>
                    <h3>No campaigns yet</h3>
                    <p>Create your first campaign to start showing upsell recommendations.</p>
                    <button className="ue-btn ue-btn--primary"
                        onClick={() => { saveViewState(null); setEditData(null); setSelectedSection('all'); setView('chooseType'); }}>
                        + Create new campaign
                    </button>
                </div>
            ) : (
                <div className="ue-campaign-list">
                    {filtered.map(rule => {
                        const recIds           = rule.recommended_product_ids || [];
                        const pages            = Array.isArray(rule.display_pages) ? rule.display_pages : JSON.parse(rule.display_pages || '[]');
                        const displayPositions = rule.display_positions || {};
                        const active           = isActive(rule);

                        return (
                            <div key={rule.id} className={`ue-campaign-row ${!active ? 'ue-campaign-row--inactive' : ''}`}>
                                <div className="ue-campaign-row__left">
                                    <div className={`ue-toggle ${active ? 'ue-toggle--on' : ''}`}
                                        onClick={() => handleToggle(rule)}
                                        title={active ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
                                        <div className="ue-toggle__dot" />
                                    </div>
                                    <div className="ue-campaign-row__info">
                                        <div className="ue-campaign-row__name">
                                            {rule.rule_name}
                                            <span className={`ue-badge ue-badge--${RULE_TYPE_COLOR[rule.rule_type] || 'gray'}`}>
                                                {RULE_TYPE_LABEL[rule.rule_type] || rule.rule_type}
                                            </span>
                                        </div>
                                        <div className="ue-campaign-row__meta">
                                            <span className="ue-meta-item">🎯 {condLabel(rule)}</span>
                                            <span className="ue-meta-item">📦 {recIds.length} product{recIds.length !== 1 ? 's' : ''}</span>
                                            <span className="ue-meta-item">⬆ Priority {Number(rule.priority ?? 0)}</span>
                                            <span className="ue-meta-item">📍 {pages.map(p => ALL_LOCATIONS.find(l => l.value === p)?.label || p).join(', ')}</span>
                                            <span className="ue-meta-item">🧭 {pages.map(p => hookLabel(p, displayPositions[p])).join(', ')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="ue-campaign-row__actions">
                                    <button className="ue-btn ue-btn--ghost"        onClick={() => openEdit(rule)}>Edit</button>
                                    <button className="ue-btn ue-btn--danger-ghost" onClick={() => handleDelete(rule)}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
