import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const PlatformSettings = () => {
    const [categories, setCategories] = useState([]);
    const [settings, setSettings] = useState({ commission_rate: { percentage: 0 } });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // FIXED: Changed 'async Promise.all' to 'await Promise.all'
                const [catRes, setRes] = await Promise.all([
                    api.get('/admin/categories'),
                    api.get('/admin/settings')
                ]);

                setCategories(catRes.data);

                // FIXED: Backend returns an array. We must find the specific key.
                const commissionData = setRes.data.find(s => s.key === 'commission_rate');
                if (commissionData) {
                    setSettings({ commission_rate: commissionData.value });
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Data fetch failed", err);
                setError(err.response?.data?.message || "Access Denied: Super Admin Only");
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpdateCommission = async (newRate) => {
        try {
            // FIXED: Using PUT as per our established backend routes
            await api.put('/admin/settings/commission_rate', { 
                value: { percentage: Number(newRate) } 
            });
            setSettings({ commission_rate: { percentage: Number(newRate) } });
        } catch (err) {
            alert("Failed to update commission: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div style={{padding: '20px'}}>Initializing Governance Controls...</div>;
    
    if (error) return (
        <div style={{color: 'red', padding: '20px'}}>
            <h2>Error</h2>
            <p>{error}</p>
            <p>Check: Are you logged in as 'super_admin' in the database?</p>
        </div>
    );

    return (
        <div className="settings-container" style={{ padding: '20px' }}>
            <h1>Platform Governance</h1>
            
            <section className="config-card" style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '15px' }}>
                <h2>Financial Controls</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label>Global Commission Rate (%)</label>
                    <input 
                        type="number" 
                        value={settings.commission_rate.percentage}
                        onChange={(e) => handleUpdateCommission(e.target.value)}
                        style={{ padding: '8px', width: '80px' }}
                    />
                </div>
            </section>

            <section className="config-card" style={{ border: '1px solid #ddd', padding: '15px' }}>
                <h2>Event Categories</h2>
                {categories.length === 0 ? <p>No categories defined.</p> : (
                    <ul>
                        {categories.map(cat => (
                            <li key={cat.id}>
                                <strong>{cat.name}</strong> {cat.description ? `- ${cat.description}` : ''}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default PlatformSettings;