import { useState } from "react";
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PDFPreview = ({ pdfBlob, filename, onClose, onDownload }) => {
  const [scale, setScale] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = () => {
    onDownload();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/10 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Preview PDF</h2>
            <span className="text-gray-400 text-sm">{filename}</span>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            <span className="px-3 py-1 bg-white/10 rounded-lg text-white font-semibold min-w-[70px] text-center">
              {(scale * 100).toFixed(0)}%
            </span>

            <button
              onClick={handleZoomIn}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-300"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-white/20 mx-2"></div>

            <button
              onClick={handleDownload}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg text-white font-semibold transition-all duration-300 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="bg-white shadow-2xl mx-auto transition-transform duration-300"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              width: "210mm",
              minHeight: "297mm",
            }}
          >
            <iframe
              src={pdfUrl}
              className="w-full h-[297mm] border-0"
              title="PDF Preview"
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-t border-white/10 p-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-400 text-sm">
            💡 Tips: Gunakan scroll untuk melihat seluruh dokumen
          </p>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;
