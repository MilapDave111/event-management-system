import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const PlatformGovernance = () => {
    const [categories, setCategories] = useState([]);
    const [newCat, setNewCat] = useState("");
    const [commission, setCommission] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // CORRECT SYNTAX: use await, NOT async
            const [catRes, setRes] = await Promise.all([
                api.get('/admin/categories'),
                api.get('/admin/settings')
            ]);

            setCategories(catRes.data);

            // Defensive check to find the specific setting
            if (setRes.data && Array.isArray(setRes.data)) {
                const commSetting = setRes.data.find(s => s.key === 'commission_rate');
                if (commSetting && commSetting.value) {
                    setCommission(commSetting.value.percentage);
                }
            }
        } catch (err) {
            if (err.response && err.response.status === 403) {
                alert("Access Denied: You are not a Super Admin. Please check your database role.");
            } else {
                console.error("Data load failed:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const addCategory = async () => {
        if (!newCat) return;
        try {
            await api.post('/admin/categories', { name: newCat });
            setNewCat("");
            loadData(); // Refresh list
        } catch (err) {
            alert("Failed to add category");
        }
    };

    const updateCommission = async () => {
        try {
            await api.put('/admin/settings/commission_rate', { 
                value: { percentage: Number(commission) } 
            });
            alert("Commission Updated");
        } catch (err) {
            alert("Update failed: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading Governance Controls...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>Platform Governance</h2>
            
            <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h3>Global Commission (%)</h3>
                <input 
                    type="number" 
                    value={commission} 
                    onChange={(e) => setCommission(e.target.value)} 
                    style={{ padding: '5px', marginRight: '10px' }}
                />
                <button onClick={updateCommission}>Save Commission</button>
            </div>

            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
                <h3>Event Categories</h3>
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        value={newCat} 
                        onChange={(e) => setNewCat(e.target.value)} 
                        placeholder="New Category Name" 
                        style={{ padding: '5px', marginRight: '10px' }}
                    />
                    <button onClick={addCategory}>Add</button>
                </div>
                <ul>
                    {categories.map(c => (
                        <li key={c.id} style={{ marginBottom: '5px' }}>{c.name}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default PlatformGovernance;