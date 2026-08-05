import React, { useState } from "react";
import { MLMUser, Order } from "../types";
import { CheckCircle2, Copy, Check, Clock, Upload, ArrowRight, Package, CreditCard, ShieldCheck, Sparkles, Building2, AlertCircle } from "lucide-react";

interface RegistrationSuccessModalProps {
  user: MLMUser;
  order: Order;
  onClose: () => void;
  onGoToUploadProof: (orderId: number) => void;
  settings?: any;
}

export default function RegistrationSuccessModal({
  user,
  order,
  onClose,
  onGoToUploadProof,
  settings
}: RegistrationSuccessModalProps) {
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);

  const bankBca = settings?.companyBankAccount || "1234-5678-90";
  const bankHolderBca = settings?.companyBankHolder || "PT HEDTRO JEANS INDONESIA";
  
  const bankMandiri = settings?.companyBank2Account || "0987-6543-21";
  const bankHolderMandiri = settings?.companyBank2Holder || "PT HEDTRO JEANS INDONESIA";

  const bankBri = settings?.companyBank3Account || "5544-3322-11";
  const bankHolderBri = settings?.companyBank3Holder || "PT HEDTRO JEANS INDONESIA";

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedBank(type);
      setTimeout(() => setCopiedBank(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn" id="reg-success-modal">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden my-6 relative flex flex-col max-h-[90vh]">
        
        {/* Modal Top Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="absolute -left-6 -top-6 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl text-emerald-600 shadow-xl mb-3 ring-4 ring-white/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-black tracking-tight">Pendaftaran Member Berhasil! 🎉</h2>
          <p className="text-emerald-100 text-xs font-medium mt-1">
            Selamat datang di <strong className="text-white font-extrabold">{settings?.webName || "Hedtro Jeans Official Portal"}</strong>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs leading-relaxed">

          {/* User Account Info Bar */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Akun Member Terdaftar</p>
              <h4 className="font-black text-sm text-slate-900">{user.fullname} <span className="text-slate-500 font-normal">(@{user.username})</span></h4>
              <p className="text-[11px] text-slate-600">{user.email} • {user.phone}</p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-xs">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                Free Member (Belum Aktif)
              </span>
            </div>
          </div>

          {/* Invoice & Order Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <span className="font-extrabold text-slate-900 text-xs">Detail Tagihan Invoice Perdana</span>
              </div>
              <span className="font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px]">
                {order.invoice_no || `INV-${order.id}`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Produk Paket Perdana</span>
                <p className="font-bold text-slate-800">{order.product_name}</p>
                {(order.selected_size || order.selected_color) && (
                  <p className="text-[11px] text-slate-500 font-medium">
                    Ukuran: <strong className="text-slate-700">{order.selected_size || '30'}</strong> | Warna: <strong className="text-slate-700">{order.selected_color || 'Indigo Blue Raw'}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tagihan Transfer</span>
                <div className="flex items-center sm:justify-end gap-2">
                  <span className="text-lg font-black text-emerald-600 font-mono">
                    Rp {order.amount ? order.amount.toLocaleString("id-ID") : "550.000"}
                  </span>
                  <button
                    onClick={() => copyToClipboard(String(order.amount || 550000), "amount")}
                    className="p-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition"
                    title="Salin nominal tagihan"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="inline-block bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded border border-amber-300">
                  {order.status || "MENUNGGU_PEMBAYARAN"}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Account Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" /> Rekening Resmi Pembayaran Official
              </h4>
              <span className="text-[10px] font-bold text-slate-500">Pilih salah satu bank</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* BCA */}
              <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-3 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-blue-900 text-xs">BANK BCA</span>
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <p className="font-mono font-extrabold text-slate-900 text-sm mt-1">{bankBca}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">a.n {bankHolderBca}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankBca, "bca")}
                  className="w-full py-1.5 px-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  {copiedBank === "bca" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Salin Rekening
                    </>
                  )}
                </button>
              </div>

              {/* Mandiri */}
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-amber-900 text-xs">BANK MANDIRI</span>
                    <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <p className="font-mono font-extrabold text-slate-900 text-sm mt-1">{bankMandiri}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">a.n {bankHolderMandiri}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankMandiri, "mandiri")}
                  className="w-full py-1.5 px-2 bg-white border border-amber-200 text-amber-800 hover:bg-amber-600 hover:text-white rounded-xl font-bold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  {copiedBank === "mandiri" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Salin Rekening
                    </>
                  )}
                </button>
              </div>

              {/* BRI */}
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-3 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-900 text-xs">BANK BRI</span>
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="font-mono font-extrabold text-slate-900 text-sm mt-1">{bankBri}</p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">a.n {bankHolderBri}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(bankBri, "bri")}
                  className="w-full py-1.5 px-2 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  {copiedBank === "bri" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Salin Rekening
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Next Steps Guide Banner */}
          <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex gap-3 text-blue-900">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <strong className="font-extrabold text-blue-950 block text-xs">Alur Aktivasi Status Member Verified:</strong>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium">
                <li>Lakukan transfer sesuai nominal tagihan (<strong>Rp 550.000</strong>) ke salah satu rekening resmi di atas.</li>
                <li>Unggah bukti foto/screenshot transfer pada menu <strong>Upload Bukti Transfer</strong>.</li>
                <li>Tim Admin akan memverifikasi pembayaran Anda. Setelah disetujui, akun Anda otomatis berubah menjadi <strong className="text-emerald-700">VERIFIED ACTIVE MEMBER</strong> dan pesanan celana jeans perdana langsung dikirimkan!</li>
              </ol>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs text-center"
          >
            Lanjut ke Dashboard Member
          </button>

          <button
            onClick={() => onGoToUploadProof(order.id)}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-emerald-600/30"
          >
            <Upload className="w-4 h-4" />
            Upload Bukti Transfer Sekarang
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
