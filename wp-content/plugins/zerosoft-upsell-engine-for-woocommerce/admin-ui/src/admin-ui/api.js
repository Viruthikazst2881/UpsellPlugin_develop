const { apiBase, nonce } = window.upsellData || {};

async function request(path, options = {}) {
    try {
        const res = await fetch(`${apiBase}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': nonce,
            },
            credentials: 'same-origin',
            ...options,
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

export const getRules            = ()          => request('/rules');
export const createRule          = (data)      => request('/rules', { method: 'POST', body: JSON.stringify(data) });
export const updateRule          = (id, data)  => request(`/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRule          = (id)        => request(`/rules/${id}`, { method: 'DELETE' });

export const searchProducts      = (q)         => request(`/products/search?search=${encodeURIComponent(q)}`);
export const getProductsByIds    = (ids)        => request(`/products/by-ids?ids=${ids.join(',')}`);
export const getProductsByCategory = (id)      => request(`/products/by-category?category_id=${id}`);
export const searchCategories    = (q)          => request(`/categories/search?search=${encodeURIComponent(q)}`);
export const searchTags          = (q)          => request(`/tags/search?search=${encodeURIComponent(q)}`);
export const getTermsByIds       = (ids, taxonomy) => request(`/terms/by-ids?ids=${ids}&taxonomy=${taxonomy}`);
