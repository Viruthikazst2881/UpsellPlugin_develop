/**
 * index.js — Entry point
 * Mounts the React app into #upsell-admin-root
 */
import { render } from '@wordpress/element';
import App from './App';
import './admin.css';

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('upsell-admin-root');
    if (root) {
        render(<App />, root);
    }
});
