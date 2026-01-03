import { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Save, X, Move } from "lucide-react";

const ImageEditor = ({ imageData, onSave, onClose, imageName }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState(null);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      drawCanvas(img, scale, position);
    };
    img.src = imageData;
  }, [imageData]);

  useEffect(() => {
    if (image) {
      drawCanvas(image, scale, position);
    }
  }, [scale, position, image]);

  const drawCanvas = (img, currentScale, currentPosition) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    const container = containerRef.current;

    // Set canvas size to container size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scaled dimensions
    const imgAspectRatio = img.width / img.height;
    const canvasAspectRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight;
    if (imgAspectRatio > canvasAspectRatio) {
      drawWidth = canvas.width * 0.8;
      drawHeight = drawWidth / imgAspectRatio;
    } else {
      drawHeight = canvas.height * 0.8;
      drawWidth = drawHeight * imgAspectRatio;
    }

    // Apply scale
    drawWidth *= currentScale;
    drawHeight *= currentScale;

    // Center the image and apply position offset
    const x = (canvas.width - drawWidth) / 2 + currentPosition.x;
    const y = (canvas.height - drawHeight) / 2 + currentPosition.y;

    // Draw image
    ctx.drawImage(img, x, y, drawWidth, drawHeight);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(0.5, Math.min(5, prev + delta)));
  };

  // Touch handlers for pinch-to-zoom
  const getTouchDistance = (touches) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // Pinch gesture
      setLastTouchDistance(getTouchDistance(e.touches));
    } else if (e.touches.length === 1) {
      // Single touch for dragging
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Pinch to zoom
      const newDistance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const delta = (newDistance - lastTouchDistance) * 0.01;
        setScale((prev) => Math.max(0.5, Math.min(5, prev + delta)));
      }
      setLastTouchDistance(newDistance);
    } else if (e.touches.length === 1 && isDragging) {
      // Pan
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      setLastTouchDistance(0);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      const editedFile = new File([blob], imageName, { type: "image/png" });
      const reader = new FileReader();
      reader.onload = (e) => {
        onSave({
          file: editedFile,
          data: e.target.result,
          name: imageName,
          size: blob.size,
        });
      };
      reader.readAsDataURL(blob);
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Edit Foto</h2>
            <p className="text-gray-400 text-sm">
              Zoom dan geser foto sesuai keinginan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-gray-900"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <canvas ref={canvasRef} className="w-full h-full" />

          {/* Info Overlay */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <div className="flex items-center gap-2 text-sm">
              <Move className="w-4 h-4" />
              <span>Zoom: {(scale * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-t border-white/10 bg-slate-800/50">
          <div className="flex items-center justify-between gap-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-300 hover:scale-105"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              <div className="px-4 py-2 bg-white/10 rounded-lg text-white font-semibold min-w-[80px] text-center">
                {(scale * 100).toFixed(0)}%
              </div>

              <button
                onClick={handleZoomIn}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-300 hover:scale-105"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              <button
                onClick={handleReset}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-300 hover:scale-105"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Instructions */}
            <div className="hidden md:block text-gray-400 text-sm">
              <p>💻 Mouse: Scroll untuk zoom, Drag untuk geser</p>
              <p>📱 Touch: Pinch untuk zoom, Geser untuk pindah</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-semibold transition-all duration-300"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all duration-300 flex items-center gap-2 hover:scale-105"
              >
                <Save className="w-5 h-5" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
