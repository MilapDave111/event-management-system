import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../styles/EventManager.css'; 
import { useNavigate } from 'react-router-dom';

// --- 1. Premium AI Feedback Analyzer UI ---
const AiFeedbackSummary = ({ eventsList }) => {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisTriggered, setAnalysisTriggered] = useState(false);

  const handleEventChange = (e) => {
    setSelectedEventId(e.target.value);
    // Reset the AI view when a new event is selected
    setSummary(null);
    setAnalysisTriggered(false);
  };

  const fetchSummary = async () => {
    if (!selectedEventId) {
      toast.error("Please select an event first.");
      return;
    }
    
    setAnalysisTriggered(true);
    setLoading(true);
    
    try {
      const response = await api.get(`/events/${selectedEventId}/ai-summary`);
      setSummary(response.data.summary);
      toast.success(`Analyzed ${response.data.totalReviews} reviews successfully.`);
    } catch (err) {
      console.error("AI Analysis Failed:", err);
      // DIAGNOSTIC UPDATE: We now accurately fetch the EXACT error message from the backend crash.
      // We look for 'error', then 'message', then default to the standard network error string.
      const exactErrorMessage = err.response?.data?.error || err.response?.data?.message || err.message || "Network Error: Could not connect to backend.";
      
      toast.error(exactErrorMessage);
      setAnalysisTriggered(false); // Hide the empty section if it fails
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* AI Control Panel */}
      <div style={aiStyles.controlCard}>
        <div style={aiStyles.headerText}>
          <h3 style={aiStyles.title}>
            <span style={aiStyles.aiIcon}>🧠</span> 
            AI Intelligence Engine
          </h3>
          <p style={aiStyles.subtitle}>
            Select a past event to let our AI automatically process and summarize raw attendee feedback logs into actionable intelligence.
          </p>
        </div>

        <div style={aiStyles.actionRow}>
          <select
            value={selectedEventId}
            onChange={handleEventChange}
            style={aiStyles.selectInput}
          >
            <option value="">-- Select an Event Context --</option>
            {eventsList.map(evt => (
              <option key={evt.id} value={evt.id}>{evt.title}</option>
            ))}
          </select>
          
          <button 
            onClick={fetchSummary} 
            disabled={loading || !selectedEventId}
            style={{
              ...aiStyles.generateBtn,
              opacity: (loading || !selectedEventId) ? 0.6 : 1,
              cursor: (loading || !selectedEventId) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <span style={aiStyles.flexCenter}>
                <svg style={aiStyles.spinner} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4" opacity="0.3"></circle>
                  <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4"></path>
                </svg>
                Processing...
              </span>
            ) : "Run AI Analysis"}
          </button>
        </div>
      </div>

      {/* AI Results Section - ONLY renders when analysis is triggered */}
      {analysisTriggered && (
        <div style={aiStyles.resultsCard}>
          <div style={aiStyles.contentArea}>
            {loading && (
              <div style={aiStyles.skeletonContainer}>
                <div style={{...aiStyles.skeletonLine, width: '40%', height: '24px', marginBottom: '20px'}}></div>
                <div style={{...aiStyles.skeletonLine, width: '100%', height: '80px', marginBottom: '20px'}}></div>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
                  <div style={{...aiStyles.skeletonLine, width: '100%', height: '120px'}}></div>
                  <div style={{...aiStyles.skeletonLine, width: '100%', height: '120px'}}></div>
                </div>
              </div>
            )}

            {!loading && summary && (
              <div style={aiStyles.resultsWrapper}>
                <h3 style={aiStyles.resultsHeader}>✨ AI Sentiment Analysis Report</h3>
                
                {/* Executive Summary & Sentiment */}
                <div style={aiStyles.executiveCard}>
                  <div style={aiStyles.sentimentBadgeContainer}>
                    <span style={aiStyles.sentimentLabel}>Overall Sentiment:</span>
                    <span style={{
                      ...aiStyles.sentimentBadge,
                      background: summary.averageSentiment === 'Positive' ? '#dcfce7' : summary.averageSentiment === 'Negative' ? '#fee2e2' : '#f1f5f9',
                      color: summary.averageSentiment === 'Positive' ? '#166534' : summary.averageSentiment === 'Negative' ? '#991b1b' : '#475569'
                    }}>
                      {summary.averageSentiment}
                    </span>
                  </div>
                  <p style={aiStyles.executiveText}>"{summary.executiveSummary}"</p>
                </div>

                {/* Strengths & Complaints Grid */}
                <div style={aiStyles.gridCards}>
                  <div style={aiStyles.strengthCard}>
                    <h4 style={aiStyles.cardTitleGreen}>
                      <span style={aiStyles.cardIcon}>✅</span> Key Strengths
                    </h4>
                    <ul style={aiStyles.listGreen}>
                      {summary.keyStrengths.map((item, idx) => <li key={idx} style={aiStyles.listItem}>{item}</li>)}
                    </ul>
                  </div>
                  
                  <div style={aiStyles.complaintCard}>
                    <h4 style={aiStyles.cardTitleRed}>
                      <span style={aiStyles.cardIcon}>⚠️</span> Core Complaints
                    </h4>
                    <ul style={aiStyles.listRed}>
                      {summary.coreComplaints.map((item, idx) => <li key={idx} style={aiStyles.listItem}>{item}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Actionable Improvements */}
                <div style={aiStyles.actionCard}>
                   <h4 style={aiStyles.cardTitleIndigo}>
                     <span style={aiStyles.cardIcon}>🎯</span> Strategic Recommendations for Next Event
                   </h4>
                   <ul style={aiStyles.listIndigo}>
                      {summary.actionableImprovements.map((item, idx) => <li key={idx} style={aiStyles.listItem}>{item}</li>)}
                   </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Custom Styles for the AI Analyzer ---
const aiStyles = {
  controlCard: { background: '#fff', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' },
  headerText: { marginBottom: '20px' },
  title: { margin: 0, fontSize: '20px', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  aiIcon: { fontSize: '24px' },
  subtitle: { margin: '5px 0 0 0', color: '#64748b', fontSize: '14px', lineHeight: '1.5' },
  actionRow: { display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' },
  selectInput: { flex: '1 1 auto', minWidth: '250px', padding: '12px 15px', borderRadius: '8px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '15px', color: '#1e293b', background: '#f8fafc', cursor: 'pointer', boxSizing: 'border-box' },
  generateBtn: { background: '#6366f1', color: '#fff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '700', border: 'none', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)', whiteSpace: 'nowrap', height: '47px' },
  flexCenter: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  spinner: { width: '18px', height: '18px', animation: 'spin 1s linear infinite' },
  
  resultsCard: { background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', animation: 'fadeIn 0.4s ease-in-out' },
  resultsHeader: { margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b', fontWeight: '800' },
  contentArea: { position: 'relative' },
  
  // Loading Skeleton
  skeletonContainer: { padding: '10px 0' },
  skeletonLine: { background: '#e2e8f0', borderRadius: '6px', animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' },
  
  // Results UI
  resultsWrapper: { display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s ease-in-out' },
  executiveCard: { background: '#f8fafc', borderLeft: '4px solid #6366f1', padding: '20px', borderRadius: '8px' },
  sentimentBadgeContainer: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  sentimentLabel: { fontWeight: '700', color: '#334155', fontSize: '14px' },
  sentimentBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
  executiveText: { margin: 0, fontSize: '16px', color: '#334155', fontStyle: 'italic', lineHeight: '1.6' },
  
  gridCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  strengthCard: { background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '12px' },
  complaintCard: { background: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '12px' },
  actionCard: { background: '#eef2ff', border: '1px solid #c7d2fe', padding: '20px', borderRadius: '12px' },
  
  cardTitleGreen: { margin: '0 0 15px 0', color: '#166534', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  cardTitleRed: { margin: '0 0 15px 0', color: '#991b1b', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  cardTitleIndigo: { margin: '0 0 15px 0', color: '#3730a3', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' },
  cardIcon: { fontSize: '18px' },
  
  listGreen: { margin: 0, paddingLeft: '20px', color: '#15803d', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' },
  listRed: { margin: 0, paddingLeft: '20px', color: '#b91c1c', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' },
  listIndigo: { margin: 0, paddingLeft: '20px', color: '#4338ca', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' },
  listItem: { lineHeight: '1.5' }
};

// --- 2. Event Manager Dashboard ---
const EventManagerDashboard = () => {
  const navigate = useNavigate();
  const [managerStats, setManagerStats] = useState({
    total_registrations: 0,
    total_attendance: 0,
    pending_tasks: 0,
    live_checkins: 0
  });
  
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inject keyframes for animations if not present
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(styleSheet);

    const fetchManagerData = async () => {
      try {
        setLoading(true);
        const [statsRes, eventsRes] = await Promise.all([
          api.get('/events/manager-stats'),
          api.get('/events/approved') 
        ]);

        if (statsRes.data && statsRes.data.success) {
            setManagerStats(statsRes.data.data); 
        }
        
        if (eventsRes.data) {
           setEventsList(eventsRes.data);
        }

      } catch (err) {
        toast.error("Event operational data sync failed");
      } finally {
        setLoading(false);
      }
    };
    fetchManagerData();

    return () => { document.head.removeChild(styleSheet); };
  }, []);

  if (loading) {
    return <div style={{padding: '40px', color: '#47B599', fontWeight: 'bold'}}>Loading Operational Dashboard...</div>;
  }

  return (
    <div className="manager-container" style={{ width: '100%', paddingBottom: '40px' }}>
      <h2 className="manager-title" style={{ color: '#47B599', marginBottom: '25px', fontWeight: '800', fontSize: '28px' }}>Operational Overview</h2>
      
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderTop: '4px solid #47B599' }}>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Total Registrations</p>
          <h1 style={{ fontSize: '36px', color: '#1e293b', marginTop: '12px', fontWeight: '900' }}>{managerStats.total_registrations}</h1>
        </div>
        
        <div style={{ background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderTop: '4px solid #04befe' }}>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Live Check-ins</p>
          <h1 style={{ fontSize: '36px', color: '#1e293b', marginTop: '12px', fontWeight: '900' }}>{managerStats.live_checkins}</h1>
        </div>
        
        <div style={{ background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderTop: '4px solid #f59e0b' }}>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Pending Tasks</p>
          <h1 style={{ fontSize: '36px', color: '#1e293b', marginTop: '12px', fontWeight: '900' }}>{managerStats.pending_tasks}</h1>
        </div>
        {/* Freny Integration: Active Teams Card */}
       
        <div style={{ background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderTop: '4px solid #8b5cf6' }}>
           <button 
            onClick={() => navigate('/manager/manage-staff', { state: { activeTab: 'view-teams' } })}>
          <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Active Teams</p>
          <h1 style={{ fontSize: '36px', color: '#1e293b', marginTop: '12px', fontWeight: '900' }}>{managerStats.total_teams || 0}</h1>
          </button>
        </div>
       
      </div>

      {/* Embedded AI Component - Now completely self-contained */}
      <AiFeedbackSummary eventsList={eventsList} />
      
    </div>
  );
};

export default EventManagerDashboard;