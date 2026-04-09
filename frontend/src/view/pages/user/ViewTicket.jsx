import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

const ViewTicket = ({ registration }) => {
  if (!registration || !registration.qr_token) {
    return <div className="p-10 text-center text-red-500">Ticket data missing. Please register again.</div>;
  }

  // Function to convert SVG to PNG and download
  const downloadQR = () => {
    const svg = document.getElementById("event-qr-code");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // Set high resolution for the download
    img.onload = () => {
      canvas.width = 500;
      canvas.height = 500;
      ctx.fillStyle = "white"; // Add white background to the image
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 50, 50, 400, 400); // Center the QR on the canvas
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${registration.title || 'Event'}_Ticket.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    // Encode SVG to base64 for the Image object
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="ticket-card border-2 border-gray-300 rounded-xl p-8 max-w-sm mx-auto text-center shadow-2xl bg-white">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{registration.title || "Event Ticket"}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {registration.event_date ? new Date(registration.event_date).toLocaleDateString() : "Invalid Date"}
        </p>
      </div>
      
      <div className="qr-container bg-gray-50 p-6 inline-block border-2 border-dashed border-gray-200 rounded-lg mb-6">
        <QRCodeSVG 
          id="event-qr-code" 
          value={registration.qr_token} 
          size={200} 
          level="H" // High error correction for better scanning
          includeMargin={true}
        />
      </div>
      
      <div className="space-y-3">
        <button 
          onClick={downloadQR}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
        >
          📥 Download QR Image
        </button>
        
        <p className="text-xs text-gray-400">
          Present this QR code at the entrance to mark your attendance.
        </p>
      </div>
    </div>
  );
};

export default ViewTicket;