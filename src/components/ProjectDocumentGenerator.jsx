import { useState, useRef } from "react";
import {
  Download,
  X,
  Plus,
  FileText,
  Settings,
  Moon,
  Sun,
  Trash2,
  Camera,
  Edit2,
  Eye,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Briefcase,
  FileCheck,
} from "lucide-react";
import { PDFGenerator } from "../utils/pdfGenerator";
import ImageEditor from "./ImageEditor";

const ProjectDocumentGenerator = () => {
  const [projectMode, setProjectMode] = useState("beforeAfter"); // "beforeAfter" or "progress"
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: "Proyek 1",
      mode: "beforeAfter",
      beforePhotos: [],
      afterPhotos: [],
      progressPhotos: { "0%": [], "50%": [], "100%": [] },
    },
  ]);
  const [headerText, setHeaderText] = useState("PEKERJAAN");
  const [subTitleText, setSubTitleText] = useState(
    "Pekerjaan Pemasangan aluminium"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [nextProjectId, setNextProjectId] = useState(2);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfFilename, setPdfFilename] = useState("");
  const [activeTab, setActiveTab] = useState("projects");
  const [pdfAccordionOpen, setPdfAccordionOpen] = useState(false);

  const addProject = () => {
    setProjects([
      ...projects,
      {
        id: nextProjectId,
        name: `Proyek ${nextProjectId}`,
        mode: projectMode,
        beforePhotos: [],
        afterPhotos: [],
        progressPhotos: { "0%": [], "50%": [], "100%": [] },
      },
    ]);
    setNextProjectId(nextProjectId + 1);
  };

  const removeProject = (projectId) => {
    setProjects(projects.filter((p) => p.id !== projectId));
  };

  const updateProjectName = (projectId, newName) => {
    setProjects(
      projects.map((project) =>
        project.id === projectId ? { ...project, name: newName } : project
      )
    );
  };

  const updateProjectMode = (projectId, newMode) => {
    setProjects(
      projects.map((project) =>
        project.id === projectId ? { ...project, mode: newMode } : project
      )
    );
  };

  const handleFileUpload = (projectId, type, files) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = {
          id: Date.now() + Math.random(),
          file: file,
          data: e.target.result,
          name: file.name,
          size: file.size,
        };

        setProjects(
          projects.map((project) => {
            if (project.id === projectId) {
              // Handle progress mode (0%, 50%, 100%)
              if (type === "0%" || type === "50%" || type === "100%") {
                return {
                  ...project,
                  progressPhotos: {
                    ...project.progressPhotos,
                    [type]: [...project.progressPhotos[type], photoData],
                  },
                };
              }
              // Handle before/after mode
              return {
                ...project,
                [type === "before" ? "beforePhotos" : "afterPhotos"]: [
                  ...(type === "before"
                    ? project.beforePhotos
                    : project.afterPhotos),
                  photoData,
                ],
              };
            }
            return project;
          })
        );
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (projectId, type, photoId) => {
    setProjects(
      projects.map((project) => {
        if (project.id === projectId) {
          // Handle progress mode
          if (type === "0%" || type === "50%" || type === "100%") {
            return {
              ...project,
              progressPhotos: {
                ...project.progressPhotos,
                [type]: project.progressPhotos[type].filter(
                  (photo) => photo.id !== photoId
                ),
              },
            };
          }
          // Handle before/after mode
          return {
            ...project,
            [type === "before" ? "beforePhotos" : "afterPhotos"]: (type ===
            "before"
              ? project.beforePhotos
              : project.afterPhotos
            ).filter((photo) => photo.id !== photoId),
          };
        }
        return project;
      })
    );
  };

  const openImageEditor = (projectId, type, photoId) => {
    const project = projects.find((p) => p.id === projectId);
    let photos;

    // Handle progress mode
    if (type === "0%" || type === "50%" || type === "100%") {
      photos = project.progressPhotos[type];
    } else {
      // Handle before/after mode
      photos = type === "before" ? project.beforePhotos : project.afterPhotos;
    }

    const photo = photos.find((p) => p.id === photoId);
    if (photo) {
      setEditingPhoto({ projectId, type, photoId, photo });
    }
  };

  const handleImageSave = (editedPhotoData) => {
    if (!editingPhoto) return;

    const { projectId, type, photoId } = editingPhoto;
    setProjects(
      projects.map((project) => {
        if (project.id === projectId) {
          // Handle progress mode
          if (type === "0%" || type === "50%" || type === "100%") {
            return {
              ...project,
              progressPhotos: {
                ...project.progressPhotos,
                [type]: project.progressPhotos[type].map((photo) =>
                  photo.id === photoId
                    ? { ...photo, ...editedPhotoData }
                    : photo
                ),
              },
            };
          }
          // Handle before/after mode
          const photosKey = type === "before" ? "beforePhotos" : "afterPhotos";
          return {
            ...project,
            [photosKey]: project[photosKey].map((photo) =>
              photo.id === photoId ? { ...photo, ...editedPhotoData } : photo
            ),
          };
        }
        return project;
      })
    );

    setEditingPhoto(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const generateDocument = async () => {
    if (projects.length === 0) {
      alert("Tambahkan minimal satu proyek terlebih dahulu!");
      return;
    }

    setIsLoading(true);

    try {
      const pdf = await PDFGenerator.generateDocument(
        headerText,
        subTitleText,
        projects
      );

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const filename = `${headerText}_${timestamp}.pdf`;

      // Show preview in accordion
      const blob = pdf.output("blob");
      setPdfPreview(blob);
      setPdfFilename(filename);
      setPdfAccordionOpen(true);
      setActiveTab("pdf");
    } catch (error) {
      console.error("Error generating document:", error);
      alert("Terjadi kesalahan saat membuat dokumen. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfPreview) {
      const url = URL.createObjectURL(pdfPreview);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert("Dokumen PDF berhasil didownload!");
    }
  };

  const PhotoCard = ({ photo, onEdit, onRemove }) => (
    <div className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-blue-400 transition-all duration-300">
      <img
        src={photo.data}
        alt={photo.name}
        className="w-full h-40 object-cover"
      />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
        <button
          onClick={onEdit}
          className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-all duration-300"
          title="Edit Foto"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={onRemove}
          className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-all duration-300"
          title="Hapus Foto"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      <div className="p-2 bg-white/5">
        <p className="text-xs text-gray-300 truncate" title={photo.name}>
          {photo.name}
        </p>
        <p className="text-xs text-gray-500">{formatFileSize(photo.size)}</p>
      </div>
    </div>
  );

  const PhotoSection = ({ title, photos, projectId, type, color, emoji }) => {
    const fileInputRef = useRef(null);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4
            className={`text-xl font-bold flex items-center ${
              color === "green"
                ? "text-green-400"
                : color === "orange"
                ? "text-orange-400"
                : color === "blue"
                ? "text-blue-400"
                : color === "purple"
                ? "text-purple-400"
                : "text-yellow-400"
            }`}
          >
            {emoji || (color === "green" ? "✅" : "📋")} {title}
          </h4>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 flex items-center gap-2 hover:scale-105 ${
              color === "green"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                : color === "orange"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                : color === "blue"
                ? "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                : color === "purple"
                ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                : "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
            }`}
          >
            <ImagePlus className="w-5 h-5" />
            Tambah Foto
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(projectId, type, e.target.files)}
          />
        </div>

        {photos.length === 0 ? (
          <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center">
            <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              Belum ada foto {title.toLowerCase()}
            </p>
            <p className="text-gray-500 text-sm">
              Klik tombol "Tambah Foto" untuk upload
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onEdit={() => openImageEditor(projectId, type, photo.id)}
                onRemove={() => removePhoto(projectId, type, photo.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const ProjectCard = ({ project, projectIndex }) => {
    // Determine project mode
    const mode = project.mode || "beforeAfter";

    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-1">
            <span className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-lg font-bold">
              {projectIndex + 1}
            </span>
            <input
              type="text"
              value={project.name}
              onChange={(e) => updateProjectName(project.id, e.target.value)}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-semibold text-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Nama Pekerjaan"
            />
          </div>
          {projects.length > 1 && (
            <button
              onClick={() => removeProject(project.id)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-300 ml-4"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mode Selector per Project */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => updateProjectMode(project.id, "beforeAfter")}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              mode === "beforeAfter"
                ? "bg-gradient-to-r from-orange-500 to-green-500 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            <span>📋✅</span>
            <span className="text-sm">Before & After</span>
          </button>
          <button
            onClick={() => updateProjectMode(project.id, "progress")}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              mode === "progress"
                ? "bg-gradient-to-r from-blue-500 via-yellow-500 to-green-500 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            <span>🔵🟡🟢</span>
            <span className="text-sm">0-50-100%</span>
          </button>
        </div>

        {mode === "beforeAfter" ? (
          <div className="space-y-8">
            <PhotoSection
              title="Before (Sebelum)"
              photos={project.beforePhotos}
              projectId={project.id}
              type="before"
              color="orange"
              emoji="📋"
            />

            <div className="border-t border-white/10 pt-8">
              <PhotoSection
                title="After (Sesudah)"
                photos={project.afterPhotos}
                projectId={project.id}
                type="after"
                color="green"
                emoji="✅"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <PhotoSection
              title="Progress 0%"
              photos={project.progressPhotos["0%"]}
              projectId={project.id}
              type="0%"
              color="blue"
              emoji="🔵"
            />

            <div className="border-t border-white/10 pt-8">
              <PhotoSection
                title="Progress 50%"
                photos={project.progressPhotos["50%"]}
                projectId={project.id}
                type="50%"
                color="yellow"
                emoji="🟡"
              />
            </div>

            <div className="border-t border-white/10 pt-8">
              <PhotoSection
                title="Progress 100%"
                photos={project.progressPhotos["100%"]}
                projectId={project.id}
                type="100%"
                color="green"
                emoji="🟢"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Pembuat Laporan Proyek
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Dokumentasi Proyek
          </h2>
          <p
            className={`text-xl max-w-2xl mx-auto ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Upload foto sebelum dan sesudah pekerjaan, buat laporan PDF otomatis
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("projects")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === "projects"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Kelola Proyek
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === "pdf"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              <FileCheck className="w-5 h-5" />
              Lihat & Download PDF
              {pdfPreview && (
                <span className="ml-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "projects" && (
            <>
              {/* Header Configuration */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <Settings className="w-6 h-6 mr-3 text-blue-400" />
                  Informasi Umum
                </h3>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      📋 Judul Dokumen
                    </label>
                    <input
                      type="text"
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        isDarkMode
                          ? "bg-white/10 border-white/20 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="PEKERJAAN"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      📝 Deskripsi
                    </label>
                    <input
                      type="text"
                      value={subTitleText}
                      onChange={(e) => setSubTitleText(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 ${
                        isDarkMode
                          ? "bg-white/10 border-white/20 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="Pekerjaan Pemasangan aluminium"
                    />
                  </div>
                </div>
              </div>

              {/* Projects */}
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  projectIndex={index}
                />
              ))}

              {/* Add Project Button */}
              <div className="text-center mb-8">
                <button
                  onClick={addProject}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Tambah Proyek Baru
                </button>
              </div>

              {/* Generate Button */}
              <div className="text-center">
                <button
                  onClick={generateDocument}
                  disabled={isLoading}
                  className="inline-flex items-center px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full font-bold text-white text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  ) : (
                    <Eye className="w-6 h-6 mr-3" />
                  )}
                  {isLoading ? "Membuat PDF..." : "Buat & Lihat PDF"}
                </button>
              </div>
            </>
          )}

          {activeTab === "pdf" && (
            <div className="space-y-6">
              {!pdfPreview ? (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-16 border border-white/20 text-center">
                  <FileText className="w-24 h-24 text-gray-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-3 text-gray-300">
                    Belum Ada PDF
                  </h3>
                  <p className="text-gray-400 mb-6 text-lg">
                    Silakan kelola proyek terlebih dahulu, lalu klik "Buat &
                    Lihat PDF"
                  </p>
                  <button
                    onClick={() => setActiveTab("projects")}
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-full font-semibold text-white transition-all duration-300"
                  >
                    <Briefcase className="w-5 h-5 mr-2" />
                    Kelola Proyek
                  </button>
                </div>
              ) : (
                <>
                  {/* PDF Info & Download */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                          <FileCheck className="w-6 h-6 text-green-400" />
                          PDF Siap!
                        </h3>
                        <p className="text-gray-400">{pdfFilename}</p>
                      </div>
                      <button
                        onClick={handleDownloadPDF}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-semibold text-white transition-all duration-300 flex items-center gap-2 hover:scale-105"
                      >
                        <Download className="w-5 h-5" />
                        Download PDF
                      </button>
                    </div>
                  </div>

                  {/* PDF Preview */}
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <button
                      onClick={() => setPdfAccordionOpen(!pdfAccordionOpen)}
                      className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all duration-300"
                    >
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Eye className="w-6 h-6 text-blue-400" />
                        Preview Dokumen
                      </h3>
                      {pdfAccordionOpen ? (
                        <ChevronUp className="w-6 h-6" />
                      ) : (
                        <ChevronDown className="w-6 h-6" />
                      )}
                    </button>

                    {pdfAccordionOpen && (
                      <div className="p-6 pt-0">
                        <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
                          <iframe
                            src={URL.createObjectURL(pdfPreview)}
                            className="w-full h-[800px]"
                            title="PDF Preview"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Loading Modal */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-sm w-full mx-4 border border-white/20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                Membuat PDF...
              </h3>
              <p className="text-gray-300">Mohon tunggu sebentar</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      {editingPhoto && (
        <ImageEditor
          imageData={editingPhoto.photo.data}
          imageName={editingPhoto.photo.name}
          onSave={handleImageSave}
          onClose={() => setEditingPhoto(null)}
        />
      )}
    </div>
  );
};

export default ProjectDocumentGenerator;
