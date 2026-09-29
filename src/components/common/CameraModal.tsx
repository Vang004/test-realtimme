import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
  classNameInfo?: string;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Chụp ảnh thực tế lớp học',
  classNameInfo,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Camera error, trying fallback facingMode', err);
      try {
        // Fallback to any available video stream
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
        setIsInitializing(false);
      } catch (fallbackErr: any) {
        setCameraError(
          'Không thể truy cập camera. Vui lòng cấp quyền truy cập Camera trên trình duyệt của bạn (Quy định bắt buộc chụp trực tiếp, không cho phép tải ảnh từ máy).'
        );
        setIsInitializing(false);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Watermark timestamp and anti-fraud verification
    const now = new Date();
    const timeStr = `${now.toLocaleDateString('vi-VN')} ${now.toLocaleTimeString('vi-VN')}`;
    const watermarkText = `SMART ATTENDANCE LIVE VERIFIED • ${timeStr} • ${classNameInfo || 'LỚP HỌC'}`;

    // Bottom banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, canvas.height - 36, canvas.width, 36);

    ctx.fillStyle = '#38bdf8'; // Sky light blue
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(watermarkText, 16, canvas.height - 13);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-sky-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-100 bg-linear-to-r from-sky-50 to-white px-5 py-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">{title}</h3>
              <p className="text-xs text-sky-700 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Chỉ cho phép chụp camera trực tiếp - Chống gian lận
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 bg-slate-950 flex flex-col items-center justify-center min-h-[360px] relative overflow-hidden">
          {cameraError ? (
            <div className="text-center p-6 text-white max-w-md">
              <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-white mb-2">Không thể bật Camera</h4>
              <p className="text-sm text-slate-300 mb-4">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition"
              >
                Thử kết nối lại
              </button>
            </div>
          ) : capturedImage ? (
            <div className="relative w-full rounded-xl overflow-hidden shadow-inner border border-slate-700">
              <img src={capturedImage} alt="Ảnh chụp thực tế" className="w-full max-h-[380px] object-contain bg-black" />
              <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Đã chụp từ camera thiết bị
              </div>
            </div>
          ) : (
            <div className="relative w-full rounded-xl overflow-hidden shadow-inner border border-slate-800 flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[380px] object-cover"
              />
              
              {/* Viewfinder crosshairs */}
              <div className="absolute inset-6 border-2 border-white/40 border-dashed rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between text-xs text-white/70 font-mono">
                  <span>REC ● LIVE</span>
                  <span>{new Date().toLocaleTimeString('vi-VN')}</span>
                </div>
                <div className="text-center text-xs text-white/80 bg-black/40 py-1 px-2 rounded-md self-center font-medium">
                  {classNameInfo || 'Xác thực không gian lớp học'}
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white">
                  <RefreshCw className="h-8 w-8 animate-spin text-sky-400 mb-2" />
                  <p className="text-sm">Đang khởi động camera...</p>
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-100 p-4 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Thiết bị giảng viên đang hoạt động
          </div>

          <div className="flex items-center gap-2">
            {!capturedImage ? (
              <>
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1"
                  title="Đổi camera trước/sau"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Đổi camera
                </button>
                <button
                  type="button"
                  onClick={takeSnapshot}
                  disabled={isInitializing || !!cameraError}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-md shadow-sky-200 transition flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" /> Chụp ảnh ngay
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" /> Chụp lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 transition flex items-center gap-2"
                >
                  <Check className="h-4 w-4" /> Xác nhận dùng ảnh này
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
