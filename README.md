# DaraNet ISP Customer & Billing Management System

DaraNet Billing System adalah platform manajemen pelanggan dan sistem penagihan (billing) bulanan terintegrasi yang dirancang khusus untuk operasional penyedia layanan internet lokal (ISP) dan RTRW-Net. 

Sistem ini memudahkan pengelolaan status pelanggan, perhitungan paket internet, pengelolaan potongan biaya, otomatisasi penagihan bulanan, pencetakan kuitansi otomatis, hingga ekspor PDF instan.

---

## 🚀 Fitur Utama

- **📊 Dashboard Keuangan Real-Time**: Memantau proyeksi pendapatan bulanan (*Monthly Recurring Revenue*), total dana terkumpul, tagihan tertunggak, serta presentase kolektibilitas tagihan secara visual.
- **👥 Manajemen Pelanggan (CRM)**:
  - Pencatatan profil pelanggan (Nama, Alamat, Kontak WA).
  - Manajemen paket internet dinamis (kecepatan bandwidth, harga).
  - Konfigurasi teknis jaringan (Static IP Address, PPPoE Secret Username & Password).
  - Pengelolaan potongan biaya pelanggan (recurring discount/potongan bulanan).
  - Siklus status otomatis (*ACTIVE*, *GRACE PERIOD*, *SUSPENDED / ISOLIR*).
- **💳 Sistem Penagihan Massal (Bulk Billing Generator)**: Menerbitkan tagihan bulanan secara massal ke seluruh pelanggan aktif hanya dengan satu klik pada periode bulan yang dipilih.
- **📝 Cetak Kuitansi & Invoice Profesional**: 
  - Layout dokumen cetak kuitansi/invoice A4 yang bersih dan rapi.
  - Stempel tanda lunas (*PAID*) dan belum bayar (*UNPAID*) otomatis.
  - Rincian kalkulasi subtotal dan potongan biaya pelanggan.
- **📄 Ekspor PDF Instan**: Tombol khusus **Unduh PDF** pada halaman kuitansi untuk mengunduh dokumen secara langsung sebagai berkas PDF di sisi klien menggunakan pustaka `html2pdf.js`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Engine**: [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) (Loaded Client-Side)
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy / SSL**: Traefik (integrasi cloudflare resolver)

---

## 📦 Panduan Instalasi & Menjalankan Aplikasi

Aplikasi ini telah sepenuhnya dikontainerisasi menggunakan **Docker**. Anda tidak perlu menginstal Node.js atau PostgreSQL secara lokal di mesin Anda.

### Prasyarat
Pastikan Anda sudah menginstal:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Langkah-Langkah Menjalankan

1. **Clone repositori ini**:
   ```bash
   git clone <URL_REPOSITORI_ANDA>
   cd daranett-billing
   ```

2. **Jalankan container menggunakan Docker Compose**:
   ```bash
   docker compose up --build -d
   ```
   *Perintah ini akan membangun image aplikasi, menyiapkan database PostgreSQL, menyinkronkan skema Prisma database, melakukan seeding data awal (mock packages & customers), dan menyalakan server.*

3. **Akses aplikasi di browser**:
   Buka alamat berikut di browser Anda:
   * **Lokal**: [http://localhost:3000](http://localhost:3000)
   * **Domain Produksi (jika diaktifkan via Traefik)**: `https://daranett.demo.daragroup.cloud`

---

## 📂 Struktur Folder Proyek

```text
daranett-billing/
├── prisma/                  # Skema database & script data awal (seeding)
│   ├── schema.prisma        # Definisi relasi database (Customer, Package, Invoice)
│   └── seed.js              # Script pembuat data uji coba awal
├── src/
│   ├── app/                 # Halaman & Rute Next.js App Router
│   │   ├── api/             # API Endpoints (Billing, Customers, Packages, Auth)
│   │   ├── billing/         # Halaman manajemen keuangan & halaman cetak/print
│   │   ├── customers/       # Halaman kelola pelanggan & tambah baru
│   │   ├── packages/        # Halaman konfigurasi paket internet
│   │   └── globals.css      # Desain CSS kustom (Dark Mode & Print CSS)
│   └── lib/                 # Konfigurasi database db.js & logika auto-billing
├── Dockerfile               # Konfigurasi container image Next.js
├── docker-compose.yml       # Konfigurasi multi-container (App, DB, Network)
├── entrypoint.sh            # Script startup container (Prisma sync, Seed, Build, Start)
└── package.json             # Modul dependensi aplikasi
```

---

## 🔒 Lisensi
Proyek ini dilisensikan di bawah [MIT License](LICENSE). Hak Cipta © 2026 DaraNet ISP.
