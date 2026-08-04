import React, { useState, useRef } from "react";
import { 
  X, Download, Printer, CheckCircle2, UserPlus, ShieldCheck, 
  TrendingUp, ShoppingBag, Wallet, ArrowDown, ArrowRight, Sparkles, FileText, Building2, HelpCircle
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  webName?: string;
}

export default function WorkflowModal({ isOpen, onClose, webName = "HEDTRO JEANS" }: WorkflowModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Programmatic jsPDF generation as a fallback or high-quality export
  const generateProgrammaticPdf = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 12;

    // Header Box
    pdf.setFillColor(23, 23, 23);
    pdf.rect(10, y, pageWidth - 20, 22, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`BAGAN ALUR KERJA SISTEM - ${webName.toUpperCase()}`, 14, y + 9);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(200, 200, 200);
    pdf.text("Panduan Resmi Operasional: Pendaftaran Member s/d Penarikan Dana (WD)", 14, y + 16);

    y += 28;

    workflowSteps.forEach((step) => {
      // Check page split
      if (y > 255) {
        pdf.addPage();
        y = 12;
      }

      // Step Box
      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(220, 220, 220);
      pdf.roundedRect(10, y, pageWidth - 20, 36, 2, 2, "FD");

      // Red Top Line
      pdf.setFillColor(196, 18, 48);
      pdf.rect(10, y, pageWidth - 20, 2.5, "F");

      // Step Title & Description
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(step.title, 14, y + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(71, 85, 105);
      pdf.text(step.description, 14, y + 13);

      // Points
      let ptY = y + 18;
      pdf.setFontSize(7.5);
      step.points.forEach((pt) => {
        pdf.setTextColor(196, 18, 48);
        pdf.text("•", 14, ptY);
        pdf.setTextColor(30, 41, 59);
        const lines = pdf.splitTextToSize(pt, pageWidth - 32);
        pdf.text(lines, 18, ptY);
        ptY += (lines.length * 3.8);
      });

      y += 41;
    });

    // Footer Info Box
    if (y > 260) {
      pdf.addPage();
      y = 12;
    }
    pdf.setFillColor(23, 23, 23);
    pdf.rect(10, y, pageWidth - 20, 16, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(245, 158, 11);
    pdf.text("RINGKASAN INTEGRASI SISTEM & HAK USAHA", 14, y + 6);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(200, 200, 200);
    pdf.text(`Sistem ${webName} menggunakan database Supabase PostgreSQL real-time, kalkulasi bonus otomatis, dan pencairan WD resmi.`, 14, y + 11);

    pdf.save(`Alur_Kerja_Sistem_${webName.replace(/\s+/g, "_")}.pdf`);
  };

  // Function to handle PDF generation
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);

      if (pdfContainerRef.current) {
        const canvas = await html2canvas(pdfContainerRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          onclone: (clonedDoc) => {
            // Strip oklch references in style tags to avoid html2canvas parser crash
            const styleElements = clonedDoc.querySelectorAll("style");
            styleElements.forEach((style) => {
              if (style.innerHTML.includes("oklch")) {
                style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, "#333333");
              }
            });

            // Replace oklch in computed or inline styles
            const allEls = clonedDoc.querySelectorAll("*");
            allEls.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.style && htmlEl.style.cssText && htmlEl.style.cssText.includes("oklch")) {
                htmlEl.style.cssText = htmlEl.style.cssText.replace(/oklch\([^)]+\)/g, "#333333");
              }
            });
          }
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 10) / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 5;

        pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`Alur_Kerja_Sistem_${webName.replace(/\s+/g, "_")}.pdf`);
      } else {
        generateProgrammaticPdf();
      }
    } catch (err) {
      console.warn("Gagal merender HTML Canvas due to CSS parser, switching to programmatic jsPDF fallback:", err);
      generateProgrammaticPdf();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const workflowSteps = [
    {
      step: 1,
      title: "1. PENDAFTARAN MEMBER (REGISTRASI)",
      icon: UserPlus,
      color: "from-blue-600 to-indigo-700",
      badgeBg: "bg-blue-100 text-blue-900 border-blue-300",
      badgeText: "Tahap Awal",
      description: "Calon member mendaftar ke dalam sistem untuk membuat akun bisnis.",
      points: [
        "Calon member mendaftar via link referral sponsor (?ref=username) atau menu pendaftaran.",
        "Mengisi data diri: Nama Lengkap, Username, Email, No. WhatsApp, Password, & ID Sponsor.",
        "Status akun awal saat pendaftaran berhasil: Member Baru (Non-Aktif / Free)."
      ]
    },
    {
      step: 2,
      title: "2. AKTIVASI & PEMBELIAN PAKET PERDANA",
      icon: ShieldCheck,
      color: "from-emerald-600 to-teal-700",
      badgeBg: "bg-emerald-100 text-emerald-900 border-emerald-300",
      badgeText: "Aktivasi Hak Usaha",
      description: "Member mengaktifkan status Hak Usaha Premium untuk membuka semua komisi.",
      points: [
        "Member memilih Paket Hak Usaha Premium (Termasuk Paket Perdana Produk Jeans Premium HEDTRO).",
        "Member melakukan pembayaran via Deposit / Transfer Bank resmi.",
        "Admin / Sistem melakukan konfirmasi verifikasi pembayaran.",
        "Status member berubah otomatis menjadi MEMBER PREMIUM (AKTIF) dan terpasang di Pohon Jaringan Binary (Kiri / Kanan)."
      ]
    },
    {
      step: 3,
      title: "3. PENGEMBANGAN JARINGAN & BONUS KOMISI",
      icon: TrendingUp,
      color: "from-purple-600 to-violet-700",
      badgeBg: "bg-purple-100 text-purple-900 border-purple-300",
      badgeText: "Perhitungan Otomatis",
      description: "Sistem secara otomatis menghitung dan membagikan bonus komisi secara real-time.",
      points: [
        "Bonus Sponsor Direct: Diterima sponsor langsung setiap merekrut member aktif baru (Rp 40.000).",
        "Bonus Pasangan (Pairing): Diterima saat terjadi keseimbangan omset cabang Kiri & Kanan (Rp 20.000).",
        "Bonus Level / Generasi: Bagi hasil pasif pertumbuhan titik hingga kedalaman 10 level (Rp 15.000).",
        "Semua komisi otomatis terakumulasi langsung ke SALDO UTAMA MEMBER."
      ]
    },
    {
      step: 4,
      title: "4. BELANJA REPEAT ORDER (RO) E-COMMERCE",
      icon: ShoppingBag,
      color: "from-amber-600 to-orange-700",
      badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
      badgeText: "Harga Khusus Member",
      description: "Fasilitas belanja produk fashion jeans kualitas tinggi dengan harga diskon member.",
      points: [
        "Member Premium menikmati HARGA KHUSUS MEMBER di Katalog Toko Belanja.",
        "Setiap transaksi Repeat Order (RO) dari jaringan member akan menghasilkan Bonus RO (Rp 5.000/transaksi) untuk upline.",
        "Sistem menerbitkan invoice resmi, nomor resi pengiriman, dan status pengiriman barang."
      ]
    },
    {
      step: 5,
      title: "5. PENGAJUAN PENARIKAN DANA (WITHDRAWAL / WD)",
      icon: Wallet,
      color: "from-rose-600 to-red-700",
      badgeBg: "bg-rose-100 text-rose-900 border-rose-300",
      badgeText: "Pengajuan Saldo",
      description: "Member mencairkan komisi hasil usaha langsung ke rekening bank pribadi.",
      points: [
        "Member melengkapi data rekening bank di profil (Nama Bank, No. Rekening, Nama Pemilik).",
        "Member masuk ke menu Penarikan Dana (WD) di Dashboard Member & menginput nominal penarikan.",
        "Sistem memeriksa batas minimal WD dan saldo mencukupi.",
        "Pengajuan WD berhasil terbuat dengan status PENDING dan dibekukan sementara hingga diproses Admin."
      ]
    },
    {
      step: 6,
      title: "6. VERIFIKASI ADMIN & TRANSFER REKENING",
      icon: CheckCircle2,
      color: "from-blue-700 to-slate-900",
      badgeBg: "bg-blue-100 text-blue-900 border-blue-300",
      badgeText: "Selesai / Sukses",
      description: "Admin memproses transfer dana dan memperbarui status transaksi.",
      points: [
        "Admin menerima notifikasi pengajuan WD di Manajemen Penarikan Dana (Admin Dashboard).",
        "Admin memverifikasi keabsahan data rekening member dan mentransfer dana ke rekening bank tujuan.",
        "Admin mengubah status pengajuan menjadi 'DISETUJUI' (APPROVED).",
        "Member menerima dana di rekening bank & riwayat pencairan dana tercatat secara transparan di Laporan Mutasi."
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-neutral-200 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        
        {/* Header Modal */}
        <div className="bg-neutral-900 text-white px-5 sm:px-8 py-5 flex items-center justify-between border-b border-neutral-800 print:bg-white print:text-black print:p-0 print:border-b-2 print:border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C41230] flex items-center justify-center text-white shadow-md font-display font-black text-lg">
              HJ
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black uppercase font-display tracking-tight text-white print:text-black">
                BAGAN ALUR KERJA SISTEM {webName.toUpperCase()}
              </h2>
              <p className="text-xs text-neutral-400 font-medium print:text-neutral-600">
                Panduan Resmi Operasional: Pendaftaran Member s/d Penarikan Dana (WD)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-[#C41230] hover:bg-[#A00E26] text-white px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              title="Unduh sebagai file PDF"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? "Menyiapkan PDF..." : "UNDUH PDF"}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 border border-neutral-700"
              title="Cetak langsung"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">CETAK</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              title="Tutup Modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body / Printable Ref Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-8 bg-slate-50" ref={pdfContainerRef}>
          
          {/* Header Banner inside PDF/Diagram */}
          <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white p-5 rounded-xl border border-neutral-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#C41230] text-white px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest mb-2">
                <Sparkles className="w-3 h-3" /> OFFICIAL WORKFLOW SCHEME
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-tight">
                Mekanisme Lengkap Sistem Bisnis & Pembayaran
              </h1>
              <p className="text-xs text-neutral-300 mt-1 max-w-2xl">
                Dokumen petunjuk alur kerja transparan untuk member dan pengelola platform {webName}.
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-neutral-700 sm:pl-6 shrink-0">
              <span className="text-[10px] font-mono text-neutral-400 uppercase block">STATUS SISTEM</span>
              <span className="text-xs font-extrabold text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> FULLY OPERATIONAL
              </span>
            </div>
          </div>

          {/* Workflow Steps Container with Flow Arrows */}
          <div className="space-y-4 relative">
            {workflowSteps.map((step, index) => {
              const IconComp = step.icon;
              const isLast = index === workflowSteps.length - 1;

              return (
                <React.Fragment key={step.step}>
                  {/* Step Card */}
                  <div className="bg-white border-2 border-neutral-200 rounded-2xl p-5 shadow-xs hover:border-neutral-400 transition relative overflow-hidden group">
                    {/* Top Accent Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${step.color}`}></div>
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      
                      {/* Left Header Info */}
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shrink-0 shadow-md font-black text-xl font-display`}>
                          <IconComp className="w-6 h-6" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${step.badgeBg}`}>
                              {step.badgeText}
                            </span>
                            <span className="text-xs font-mono font-bold text-neutral-400">STAGE 0{step.step} / 06</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-black uppercase font-display text-neutral-900 tracking-tight">
                            {step.title}
                          </h3>
                          <p className="text-xs text-neutral-600 mt-0.5 font-medium">
                            {step.description}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Bullet Points Grid */}
                    <div className="mt-4 pt-4 border-t border-neutral-100 bg-slate-50/70 p-3.5 rounded-xl border">
                      <ul className="space-y-2">
                        {step.points.map((pt, i) => (
                          <li key={i} className="text-xs text-neutral-700 font-medium flex items-start gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-[#C41230] shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* Flow Directional Arrow indicator (if not last) */}
                  {!isLast && (
                    <div className="flex items-center justify-center my-2">
                      <div className="bg-white border-2 border-neutral-300 rounded-full p-2 text-[#C41230] shadow-sm flex items-center justify-center gap-2">
                        <ArrowDown className="w-5 h-5 animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-700 pr-1">
                          LANJUT KE TAHAP 0{step.step + 1}
                        </span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Diagram Summary Box */}
          <div className="bg-neutral-900 text-white rounded-2xl p-6 border border-neutral-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wider">
              <FileText className="w-5 h-5" /> RINGKASAN INTEGRASI & KEAMANAN SISTEM
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Sistem HEDTRO JEANS telah dilengkapi dengan basis data Supabase PostgreSQL berkecepatan tinggi, integrasi perhitungan bonus binary otomatis real-time, perlindungan transaksi tingkat lanjut, serta validasi riwayat mutasi transparan. Seluruh pencairan dana (WD) diproses langsung oleh Admin dengan garansi verifikasi rekening ganda.
            </p>

            <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center text-[10px] text-neutral-400 gap-2 font-mono">
              <span>DOKUMEN RESMI WORKFLOW - GENERATED JULY 2026</span>
              <span>HEDTRO JEANS OFFICIAL PLATFORM</span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-neutral-100 border-t border-neutral-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-neutral-600 font-medium text-center sm:text-left flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#C41230]" />
            <span>Klik tombol **UNDUH PDF** untuk mengunduh berkas bagan ini ke perangkat Anda.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-[#C41230] hover:bg-[#A00E26] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? "Memproses PDF..." : "UNDUH DOKUMEN PDF"}</span>
            </button>
            <button
              onClick={onClose}
              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
