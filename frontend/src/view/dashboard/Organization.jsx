import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// --- 1. Premium AI Poster Generator UI ---
const AiPosterGenerator = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const generateImage = () => {
    if (!customPrompt.trim()) {
      toast.error("Prompt cannot be empty.");
      return;
    }

    setIsGenerating(true);
    const finalPrompt = `${customPrompt.trim()}, professional promotional background poster, 4k resolution, empty space for text, no words, no letters`;
    const randomSeed = Math.floor(Math.random() * 1000000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=800&height=1000&nologo=true&seed=${randomSeed}`;
    
    setImageUrl(url);
  };

  return (
    <div style={aiStyles.wrapper}>
      <div style={aiStyles.header}>
        <div style={aiStyles.headerText}>
          <h3 style={aiStyles.title}>
            <span style={aiStyles.sparkleIcon}>✨</span> 
            AI Asset Generator
          </h3>
          <p style={aiStyles.subtitle}>Generate high-resolution promotional backgrounds instantly.</p>
        </div>
      </div>

      <div style={aiStyles.contentGrid}>
        {/* Input Section */}
        <div style={aiStyles.inputSection}>
          <label style={aiStyles.label}>Visual Prompt Description</label>
          <textarea
            rows="4"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder='e.g., "A modern university building made of glass during sunset, cinematic lighting, corporate style"'
            style={{
              ...aiStyles.textarea,
              borderColor: customPrompt ? '#47B599' : '#e2e8f0'
            }}
            disabled={isGenerating}
          />
          <button 
            onClick={generateImage} 
            disabled={isGenerating || !customPrompt.trim()}
            style={{
              ...aiStyles.generateBtn,
              opacity: (isGenerating || !customPrompt.trim()) ? 0.6 : 1,
              cursor: (isGenerating || !customPrompt.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? (
              <span style={aiStyles.flexCenter}>
                <svg style={aiStyles.spinner} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4" opacity="0.3"></circle>
                  <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4"></path>
                </svg>
                Processing AI Request...
              </span>
            ) : "Generate Asset"}
          </button>
        </div>

        {/* Output Section */}
        <div style={aiStyles.previewSection}>
          {!imageUrl && !isGenerating ? (
            <div style={aiStyles.emptyState}>
              <span style={{ fontSize: '32px', marginBottom: '10px', display: 'block' }}>🖼️</span>
              <p style={{ margin: 0, color: '#64748b', fontWeight: '600' }}>Your generated asset will appear here</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>800x1000px resolution</p>
            </div>
          ) : (
            <div style={aiStyles.imageContainer}>
              {isGenerating && (
                <div style={aiStyles.skeletonLoader}>
                  <div style={aiStyles.pulsingBox}></div>
                </div>
              )}
              
              <img 
                src={imageUrl} 
                alt="AI Generated Graphic" 
                style={{
                  ...aiStyles.resultImage,
                  opacity: isGenerating ? 0 : 1,
                  display: isGenerating && !imageUrl ? 'none' : 'block'
                }}
                onLoad={() => setIsGenerating(false)}
                onError={(e) => {
                  if (e.target.src.includes('pollinations')) {
                    toast.error("AI service overloaded. Using high-res fallback.");
                    // e.target.src = `https://picsum.photos/seed/${Math.floor(Math.random() * 100000)}/800/1000`;
                  } else {
                    setIsGenerating(false);
                    setImageUrl(null);
                  }
                }}
              />

              {!isGenerating && imageUrl && (
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  download="AI_Poster_Custom.jpg"
                  style={aiStyles.downloadBtn}
                >
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Download High-Res
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Custom Styles for the AI Generator ---
const aiStyles = {
  wrapper: { background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', marginTop: '30px', border: '1px solid #f1f5f9' },
  header: { borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: '22px', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  sparkleIcon: { color: '#47B599', fontSize: '24px' },
  subtitle: { margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' },
  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
  inputSection: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  textarea: { width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', color: '#1e293b', outline: 'none', transition: 'all 0.2s ease', resize: 'vertical', boxSizing: 'border-box', marginBottom: '20px', lineHeight: '1.5' },
  generateBtn: { background: '#47B599', color: '#fff', padding: '14px 24px', borderRadius: '10px', fontSize: '15px', fontWeight: '700', border: 'none', transition: 'all 0.2s', width: '100%', marginTop: 'auto', boxShadow: '0 4px 6px -1px rgba(71, 181, 153, 0.2)' },
  flexCenter: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  spinner: { width: '20px', height: '20px', animation: 'spin 1s linear infinite' },
  previewSection: { background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px', position: 'relative', overflow: 'hidden' },
  emptyState: { textAlign: 'center' },
  imageContainer: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', padding: '15px', boxSizing: 'border-box' },
  resultImage: { width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', transition: 'opacity 0.4s ease', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  skeletonLoader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', zIndex: 10 },
  pulsingBox: { width: '80%', height: '80%', background: '#e2e8f0', borderRadius: '8px', animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
  downloadBtn: { position: 'absolute', bottom: '25px', display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', transition: 'background 0.2s' }
};

// --- 2. Organization Component ---
const Organization = () => {
  const [stats, setStats] = useState({ 
    total_events: 0, 
    approved_events: 0, 
    pending_events: 0,
    total_registrations: 0,
    total_revenue: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inject the CSS animations required for the AI generator spinner/pulse into the document head
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    `;
    document.head.appendChild(styleSheet);

    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/events/org-stats');
        setStats({
          total_events: res.data.total_events || 0,
          approved_events: res.data.approved_events || 0,
          pending_events: res.data.pending_events || 0,
          total_registrations: res.data.total_registrations || 0,
          total_revenue: parseFloat(res.data.total_revenue) || 0
        });
      } catch (err) {
        console.error("Dashboard Stat Error:", err);
        toast.error("Could not load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    
    return () => { document.head.removeChild(styleSheet); };
  }, []);

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: '#47B599', fontWeight: 'bold', fontSize: '18px'}}>Syncing Institution Data...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Institution Overview</h2>
      
      {/* Primary Financial & Engagement Metrics */}
      <div style={{...styles.statsGrid, marginBottom: '20px'}}>
        <div style={{...styles.statCard, borderTop: '4px solid #10b981', background: '#f0fdf4'}}>
          <p style={{...styles.label, color: '#15803d'}}>Ticket Revenue</p>
          <h1 style={{...styles.statValue, color: '#15803d'}}>₹{stats.total_revenue.toLocaleString()}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #6366f1', background: '#eef2ff'}}>
          <p style={{...styles.label, color: '#4338ca'}}>Total Attendees</p>
          <h1 style={{...styles.statValue, color: '#4338ca'}}>{stats.total_registrations}</h1>
        </div>
      </div>

      {/* Event Lifecycle Metrics */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, borderTop: '4px solid #47B599'}}>
          <p style={styles.label}>Total Events</p>
          <h1 style={styles.statValue}>{stats.total_events}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #04befe'}}>
          <p style={styles.label}>Approved</p>
          <h1 style={styles.statValue}>{stats.approved_events}</h1>
        </div>
        <div style={{...styles.statCard, borderTop: '4px solid #f59e0b'}}>
          <p style={styles.label}>Pending Review</p>
          <h1 style={styles.statValue}>{stats.pending_events}</h1>
        </div>
      </div>
      
      <AiPosterGenerator />
    </div>
  );
};

const styles = {
  container: { width: '100%', paddingBottom: '40px' },
  title: { color: '#47B599', marginBottom: '25px', fontWeight: '800', fontSize: '28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  statCard: { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' },
  label: { color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '36px', color: '#1e293b', marginTop: '12px', fontWeight: '900' }
};

export default Organization;