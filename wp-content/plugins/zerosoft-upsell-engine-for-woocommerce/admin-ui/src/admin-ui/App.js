/**
 * App.js — Main app shell with tab navigation
 */
import { useState } from '@wordpress/element';
import Campaigns from './components/Campaigns';
import './admin.css';

const branding = window.upsellData?.branding || {};

const TABS = [
    { id: 'campaigns', label: 'Campaigns' },
];

export default function App() {
    const [activeTab, setActiveTab] = useState('campaigns');
    const recommendationUrl = window.upsellData?.recommendationPageUrl || '#';

    return (
        <div className="ue-app">
            <div className="ue-header">
                <div className="ue-header__brand">
                    <span className="ue-header__logo">🛒</span>
                    <div>
                        <h1 className="ue-header__title">{branding.adminName || 'Smart Upsell'}</h1>
                    </div>
                </div>
                <nav className="ue-nav">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`ue-nav__tab ${activeTab === tab.id ? 'ue-nav__tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <a
                        className="ue-nav__tab ue-nav__tab--link"
                        href={recommendationUrl}
                    >
                        Recommendation
                    </a>
                </nav>
            </div>

            <div className="ue-content">
                {activeTab === 'campaigns' && <Campaigns />}
            </div>
        </div>
    );
}
