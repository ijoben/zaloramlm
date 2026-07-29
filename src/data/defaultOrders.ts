import { Order } from "../types";

export const DEFAULT_ORDERS: Order[] = [
  {
    id: 1001,
    invoice_no: "INV-20260728-001",
    user_id: 2,
    username: "budi",
    fullname: "Budi Santoso",
    phone: "081234567891",
    address: "Jl. Sudirman No. 45, Jakarta Selatan, DKI Jakarta",
    product_name: "Paket Perdana Member - Hedtro Selvedge Slim Fit Denim",
    amount: 550000,
    payment_method: "QRIS / Transfer Bank",
    status: "DIKIRIM",
    courier: "JNE REGULER",
    tracking_number: "JNE-003482194021",
    notes: "Paket telah diserahkan ke kurir JNE Tomang Jakarta. Estimasi sampai 1-2 hari kerja.",
    created_at: "2026-07-28T09:15:00Z",
    updated_at: "2026-07-28T14:20:00Z",
    steps: [
      { title: "Pesanan Dikonfirmasi & Pembayaran Lunas", time: "28 Jul 2026 09:15 WIB", done: true, description: "Pembayaran terverifikasi via QRIS" },
      { title: "Gudang Memproses & Quality Control Produk", time: "28 Jul 2026 10:30 WIB", done: true, description: "Celana Jeans Hedtro Slim Fit lolos QC" },
      { title: "Paket Diserahkan ke Ekspedisi JNE Tomang", time: "28 Jul 2026 11:45 WIB", done: true, description: "Paket di-scan di Hub Logistik Jakarta" },
      { title: "Dalam Pengiriman Kurir Menuju Alamat Tujuan", time: "28 Jul 2026 14:20 WIB", done: true, description: "Kurir JNE sedang menuju lokasi tujuan" },
      { title: "Pesanan Diterima Pemesan", time: "Estimasi Hari Ini", done: false, description: "Menunggu konfirmasi penerimaan" }
    ]
  },
  {
    id: 1002,
    invoice_no: "INV-20260728-002",
    user_id: 3,
    username: "citra",
    fullname: "Citra Lestari",
    phone: "081234567892",
    address: "Jl. Dago No. 112, Bandung, Jawa Barat",
    product_name: "Paket Perdana Member - Hedtro Skinny Stretch Black Denim",
    amount: 550000,
    payment_method: "Transfer BCA",
    status: "SELESAI",
    courier: "J&T Express",
    tracking_number: "JT-88290192301",
    notes: "Pesanan telah diterima dengan baik oleh Citra Lestari.",
    created_at: "2026-07-27T10:00:00Z",
    updated_at: "2026-07-28T16:00:00Z",
    steps: [
      { title: "Pesanan Dikonfirmasi & Pembayaran Lunas", time: "27 Jul 2026 10:00 WIB", done: true, description: "Pembayaran BCA terverifikasi" },
      { title: "Gudang Memproses & Packing Box Hedtro", time: "27 Jul 2026 11:15 WIB", done: true, description: "Paking dus eksklusif Hedtro Jeans" },
      { title: "Paket Diserahkan ke Kurir J&T Express", time: "27 Jul 2026 13:00 WIB", done: true, description: "Kurir J&T mengambil paket dari gudang" },
      { title: "Paket Tiba di Drop Point Bandung", time: "28 Jul 2026 08:30 WIB", done: true, description: "Transit di Hub Bandung" },
      { title: "Pesanan Berhasil Diterima Pemesan", time: "28 Jul 2026 16:00 WIB", done: true, description: "Diterima langsung oleh pemilik" }
    ]
  },
  {
    id: 1003,
    invoice_no: "INV-20260729-003",
    user_id: 4,
    username: "dewi",
    fullname: "Dewi Anggraini",
    phone: "081234567893",
    address: "Jl. Pemuda No. 88, Semarang, Jawa Tengah",
    product_name: "Repeat Order (RO) - Hedtro Regular Raw Blue Denim",
    amount: 350000,
    payment_method: "QRIS",
    status: "DIPROSES",
    courier: "SiCepat REG",
    tracking_number: "SC-9910293021",
    notes: "Sedang dilakukan paking rapi & inspeksi jahitan di gudang pusat.",
    created_at: "2026-07-29T08:00:00Z",
    updated_at: "2026-07-29T08:30:00Z",
    steps: [
      { title: "Pesanan Dikonfirmasi & Pembayaran Lunas", time: "29 Jul 2026 08:00 WIB", done: true, description: "QRIS otomatis sukses" },
      { title: "Gudang Memproses & Packing Box Hedtro", time: "29 Jul 2026 08:30 WIB", done: true, description: "Proses paking dan sortir produk" },
      { title: "Penyerahan ke Kurir Ekspedisi", time: "Menunggu Penjemputan Kurir", done: false, description: "Sudah di-booking nomor resi SiCepat" },
      { title: "Dalam Pengiriman", time: "Estimasi Besok", done: false, description: "-" },
      { title: "Pesanan Diterima", time: "-", done: false, description: "-" }
    ]
  }
];
