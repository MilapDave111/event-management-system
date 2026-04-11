import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react'; 
import { useAuth } from '../../../model/auth/auth.context';
import toast from 'react-hot-toast';
import '../../../view/styles/Dashboard.css';
import '../../../view/styles/Management.css';

const ViewTicket = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Milap's Logic: Extracting registration from router state
    const registration = location.state?.registration;

    // Safety: If no registration data, redirect back to dashboard
    if (!registration) {
        return <Navigate to="/dashboard/user" />;
    }

    // Milap's Logic: Convert Canvas to PNG and Download
    const downloadQR = () => {
        try {
            const canvas = document.querySelector("#event-qr-code");
            if (!canvas) {
                toast.error("QR Code not generated yet");
                return;
            }

            // Create a temporary canvas to add a white background for the PNG
            const downloadCanvas = document.createElement("canvas");
            const ctx = downloadCanvas.getContext("2d");
            downloadCanvas.width = canvas.width + 40;
            downloadCanvas.height = canvas.height + 40;

            // Fill background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
            
            // Draw the QR code onto the new canvas
            ctx.drawImage(canvas, 20, 20);

            const pngFile = downloadCanvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            
            // Generate filename based on event title
            const fileName = registration.title ? registration.title.replace(/\s+/g, '_') : 'Event';
            downloadLink.download = `${fileName}_Pass.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            
            toast.success("Ticket Image Saved!");
        } catch (err) {
            console.error(err);
            toast.error("Download failed");
        }
    };

    return (
        <div className="db-container" style={{ paddingTop: '40px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Sakshi's UI: Navigation back button */}
            <button 
                className="mgmt-cancel-btn" 
                style={{ alignSelf: 'flex-start', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={() => navigate(-1)}
            > 
                <span style={{fontSize: '18px'}}>←</span> Back to Dashboard 
            </button>

            {/* Sakshi's UI: Centered Ticket Card */}
            <div id="printable-ticket" className="stat-card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                <h2 style={{ color: '#47B599', marginBottom: '5px', fontWeight: '800' }}>
                    {registration.title || "Event Pass"}
                </h2>
                <p className="stat-label" style={{ marginBottom: '25px', color: '#64748b' }}>
                    📅 {registration.event_date ? new Date(registration.event_date).toLocaleDateString() : "Upcoming Event"}
                </p>

                {/* QR Section with Sakshi's dashed border styling */}
                <div style={{ margin: '10px auto 25px auto', display: 'inline-block', border: '2px dashed #cbd5e1', padding: '15px', borderRadius: '20px', background: '#f8fafc' }}>
                    <QRCodeCanvas 
                        id="event-qr-code" 
                        value={registration.qr_token || registration.ticket_token || "NO_TOKEN"} 
                        size={220} 
                        level="H" 
                        includeMargin={true} 
                    />
                </div>

                {/* Attendee Info Section */}
                <div style={{ textAlign: 'left', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                    <div style={{ marginBottom: '12px' }}>
                        <p className="stat-label" style={{ fontSize: '11px', marginBottom: '4px' }}>ATTENDEE</p>
                        <p style={{ color: '#1e293b', fontWeight: '700', fontSize: '16px', margin: 0 }}>{user?.full_name}</p>
                    </div>
                    
                    <div>
                        <p className="stat-label" style={{ fontSize: '11px', marginBottom: '4px' }}>PASS TOKEN</p>
                        <p style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px', margin: 0, wordBreak: 'break-all' }}>
                            {registration.qr_token || registration.ticket_token}
                        </p>
                    </div>
                </div>

                {/* Milap's Logic: Action Button styled as a modern pill */}
                <button 
                    onClick={downloadQR}
                    className="update-pill-btn pill-btn-success"
                    style={{ width: '100%', marginTop: '35px', padding: '16px', borderRadius: '14px', fontWeight: '700', fontSize: '15px' }}
                >
                    📥 Download QR Pass
                </button>
                
                <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '20px' }}>
                    Please present this digital pass at the venue entrance.
                </p>
            </div>
        </div>
    );
};

export default ViewTicket;