import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

const StaffScanTab = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize the scanner instance once on mount
  useEffect(() => {
    scannerRef.current = new Html5Qrcode("reader");
    
    return () => {
      // Robust cleanup to ensure camera hardware is released
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startCamera = async () => {
    setScanResult(null);
    setIsScannerActive(true);
    
    // Give React a tiny bit of time to render the 'reader' div before starting
    setTimeout(async () => {
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          { 
            fps: 15, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 
          },
          onScanSuccess
        );
      } catch (err) {
        console.error("Camera start error:", err);
        toast.error("Camera access denied. Check browser permissions.");
        setIsScannerActive(false);
      }
    }, 100);
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScannerActive(false);
      } catch (err) {
        console.warn("Scanner was already stopped.");
      }
    } else {
      setIsScannerActive(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    // Stop camera immediately to prevent double-scans and save battery
    await stopCamera();

    if (navigator.vibrate) navigator.vibrate(100);

    try {
      const res = await api.post('/events/staff/scan-ticket', { qr_token: decodedText });
      toast.success(res.data.message || "Attendance Marked!");
      setScanResult({ message: res.data.message, success: true });
    } catch (err) {
      const errMsg = err.response?.data?.message || "Invalid QR Code";
      toast.error(errMsg);
      setScanResult({ message: errMsg, success: false });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // If camera is running, we must stop it before scanning a file
    if (isScannerActive) await stopCamera();

    setIsProcessing(true);
    try {
      const decodedText = await scannerRef.current.scanFile(file, true);
      await onScanSuccess(decodedText);
    } catch (err) {
      toast.error("No valid QR code found in that image.");
    } finally {
      setIsProcessing(false);
      // Clear input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        <div className="bg-emerald-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Staff Scanner</h2>
          <p className="text-emerald-100 text-xs mt-1">Verification Portal</p>
        </div>

        <div className="relative bg-zinc-900 aspect-square flex items-center justify-center overflow-hidden">
          
          {/* THE FIX: Use opacity/z-index instead of 'hidden' to keep the element's size active */}
          <div 
            id="reader" 
            className="w-full h-full object-cover transition-opacity duration-300"
            style={{ 
                opacity: isScannerActive ? 1 : 0, 
                position: isScannerActive ? 'relative' : 'absolute',
                zIndex: isScannerActive ? 10 : 1
            }}
          ></div>
          
          {/* Placeholder UI when camera is OFF */}
          {!isScannerActive && !isProcessing && (
            <div className="text-center p-10 z-20">
              <div className="mb-6 opacity-20">
                <svg className="w-24 h-24 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <button 
                onClick={startCamera}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95"
              >
                OPEN CAMERA
              </button>
            </div>
          )}

          {/* Close Button when camera is ON */}
          {isScannerActive && (
             <button 
                onClick={stopCamera} 
                className="absolute top-4 right-4 z-[30] bg-white/20 hover:bg-red-500 text-white w-10 h-10 rounded-full backdrop-blur-md transition-colors flex items-center justify-center font-bold"
             >
                ✕
             </button>
          )}

          {/* Scanning Animation Overlay */}
          {isScannerActive && !isProcessing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="w-[250px] h-[250px] border-2 border-emerald-400 rounded-lg shadow-[0_0_0_999px_rgba(0,0,0,0.6)] relative">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-scan-line"></div>
              </div>
            </div>
          )}

          {/* Processing Mask */}
          {isProcessing && (
            <div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center text-white z-[40] backdrop-blur-md">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-500 border-t-transparent mb-4"></div>
              <p className="font-bold tracking-widest text-emerald-400">VERIFYING...</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 flex flex-col items-center gap-6">
          {scanResult && (
            <div className={`w-full p-4 rounded-2xl text-center font-black shadow-inner border ${
              scanResult.success ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {scanResult.message.toUpperCase()}
            </div>
          )}

          
        </div>
      </div>
    </div>
  );
};

export default StaffScanTab;