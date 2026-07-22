import React, { useState, useEffect } from "react";
import { Copy, Check, FileText, Download, HelpCircle, Code, Server, Database, RefreshCw, Archive } from "lucide-react";
import JSZip from "jszip";

export default function PHPSourceViewer() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    fetch("/api/export-php-code")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.files) {
          setFiles(data.files);
          const firstFile = Object.keys(data.files)[0] || "";
          setSelectedFile(firstFile);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat source code PHP", err);
        setLoading(false);
      });
  }, []);

  const handleCopyCode = () => {
    if (!selectedFile || !files[selectedFile]) return;
    navigator.clipboard.writeText(files[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    if (!selectedFile || !files[selectedFile]) return;
    const element = document.createElement("a");
    const file = new Blob([files[selectedFile]], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = selectedFile;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadZip = async () => {
    if (Object.keys(files).length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      Object.entries(files).forEach(([filename, content]) => {
        zip.file(filename, content as string);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = "zalora-denim-mlm-php-hosting.zip";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Gagal mengunduh ZIP", err);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-100 selection:text-blue-900" id="php-viewer-root">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page title and introduction */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-700/30">
          <div className="space-y-2">
            <span className="bg-blue-600/30 text-blue-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-blue-500/20 inline-block">
              Host-Ready PHP Source Code Codebase (14 File Lengkap)
            </span>
            <h2 class="text-3xl font-display font-bold tracking-tight">Eksportir Kode Sumber PHP</h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Seluruh file PHP utuh (<code className="text-blue-400 font-mono">index.php</code>, <code className="text-blue-400 font-mono">config.php</code>, <code className="text-blue-400 font-mono">login.php</code>, <code className="text-blue-400 font-mono">register.php</code>, <code className="text-blue-400 font-mono">dashboard.php</code>, <code className="text-blue-400 font-mono">admin.php</code>, <code className="text-blue-400 font-mono">api.php</code>, <code className="text-blue-400 font-mono">database.sql</code>, dll) siap diunduh & diinstal ke cPanel / Hosting Anda.
            </p>
          </div>
          <button
            onClick={handleDownloadZip}
            disabled={zipping || loading}
            className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition border border-blue-400/30 text-sm shrink-0 disabled:opacity-50"
          >
            {zipping ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Archive className="w-5 h-5" />}
            {zipping ? 'Membuat Paket ZIP...' : 'Download Semua File (.ZIP)'}
          </button>
        </div>

        {/* Installation Instruction Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-slate-900">1. Upload ke Hosting</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Ekstrak / upload file PHP ke folder <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-red-600">public_html</code> hosting Anda menggunakan File Manager cPanel.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-start gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-slate-900">2. Import database.sql</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Buat MySQL database baru di cPanel, lalu buka phpMyAdmin dan lakukan import data menggunakan file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-600">database.sql</code>.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex items-start gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-slate-900">3. Setting File .env</h4>
              <p className="text-xs text-slate-500 leading-relaxed">Ubah isi file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-amber-600">.env</code> dengan rincian nama database, username database, dan password database Anda.</p>
            </div>
          </div>
        </div>

        {/* Browser File explorer */}
        {loading ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center text-slate-400 space-y-4 shadow-sm">
            <RefreshCw className="w-10 h-10 mx-auto text-blue-600 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider">Menyiapkan Source Code PHP untuk Anda...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col lg:flex-row h-[600px]">
            
            {/* Sidebar file list explorer */}
            <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-200/60 bg-slate-50/40 p-4 space-y-3 flex-shrink-0 overflow-y-auto">
              <div className="flex justify-between items-center px-2">
                <h4 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">File Proyek ({Object.keys(files).length})</h4>
              </div>
              <nav className="space-y-1">
                {Object.keys(files).map((filename) => (
                  <button
                    key={filename}
                    onClick={() => {
                      setSelectedFile(filename);
                      setCopied(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                      selectedFile === filename 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{filename}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Code Editor Preview Window */}
            <main className="flex-1 min-w-0 flex flex-col bg-slate-950">
              
              {/* Toolbar */}
              <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between text-slate-400">
                <span className="text-xs font-mono font-bold text-slate-200">{selectedFile}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 transition text-[10px] font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Berhasil Copy!' : 'Copy Code'}
                  </button>
                  <button
                    onClick={handleDownloadSingleFile}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition text-[10px] font-bold shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File Ini
                  </button>
                </div>
              </div>

              {/* Textarea Viewport */}
              <div className="flex-1 p-4 overflow-auto">
                <textarea
                  readOnly
                  value={files[selectedFile] || ""}
                  className="w-full h-full bg-transparent text-slate-200 font-mono text-[11px] leading-relaxed resize-none focus:outline-none select-text pr-2"
                />
              </div>
            </main>

          </div>
        )}

      </div>
    </div>
  );
}

