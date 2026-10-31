<p align="center">
  <img src="public/favicon.svg" width="88" height="88" alt="Logo VisionBoost" />
</p>

<h1 align="center">VisionBoost</h1>

<p align="center">
  Hapus background dan upscale gambar dengan AI yang berjalan 100% di browser.<br />
  Gratis, tanpa login, dan gambar Anda tidak pernah diunggah ke server.
</p>

<p align="center">
  <a href="https://hendrazulpiadi.github.io/visionboost/"><strong>Buka Demo</strong></a>
</p>

<p align="center">
  <a href="#fitur">Fitur</a> ·
  <a href="#cara-kerja">Cara Kerja</a> ·
  <a href="#mulai">Mulai</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#troubleshooting">Troubleshooting</a>
</p>

---

## Tentang

VisionBoost adalah studio gambar berbasis AI yang seluruh pemrosesannya terjadi di perangkat pengguna (edge AI). Tidak ada backend, tidak ada API berbayar, dan tidak ada gambar yang dikirim ke server. Model AI diunduh sekali ke cache browser, lalu digunakan berulang kali secara offline.

## Fitur

- **Hapus Background otomatis** — mendeteksi subjek utama (orang, produk, hewan) dan menghasilkan PNG transparan.
- **Warna background baru** — pilih transparan, putih, hitam, abu-abu, biru, hijau, kuning, pink, atau warna kustom.
- **AI Upscaler 2x dan 4x** — merekonstruksi detail piksel, bukan sekadar memperbesar gambar.
- **Slider sebelum/sesudah** — bandingkan hasil dengan gambar asli secara interaktif.
- **Ekspor PNG atau JPG** — PNG untuk transparansi, JPG untuk ukuran file lebih kecil.
- **100% lokal dan privat** — pemrosesan di Web Worker, tanpa unggahan gambar.
- **Akselerasi hardware** — WebGPU/WebGL jika tersedia, fallback ke WASM (CPU).
- **Panduan penggunaan** — muncul otomatis pada kunjungan pertama, bisa dibuka lagi lewat tombol **Petunjuk**.
- **UI responsif bertema gelap** — nyaman di desktop maupun ponsel.

## Cara Kerja

1. Pilih alat **Hapus Background** atau **Upscale Gambar**, lalu unggah gambar.
2. Pada pemakaian pertama, browser mengunduh model AI. Langkah ini **membutuhkan internet**.
3. Model disimpan di cache browser, sehingga pemakaian berikutnya lebih cepat dan tidak perlu unduh ulang.
4. Inferensi berjalan di **Web Worker** agar antarmuka tetap responsif.
5. Hasil ditampilkan pada slider sebelum/sesudah dan diunduh langsung dari browser.

## Model AI

| Fitur | Model | Perkiraan ukuran unduhan |
| --- | --- | --- |
| Hapus Background (GPU) | ISNet FP16 via `@imgly/background-removal` | ±40–80 MB |
| Hapus Background (CPU) | ISNet Quint8 via `@imgly/background-removal` | Lebih kecil dari versi FP16 |
| Upscale 2x | `Xenova/swin2SR-lightweight-x2-64` | ±7 MB |
| Upscale 4x | `Xenova/swin2SR-compressed-sr-x4-48` | ±22 MB |
| Runtime | ONNX Runtime Web (WASM/WebGPU) | ±23 MB |

Ukuran dapat berubah mengikuti versi model dan runtime. Unduhan model berasal dari CDN model (Hugging Face dan img.ly); gambar pengguna tidak ikut dikirim.

## Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| UI | React 18, Vite 6, Tailwind CSS 3, lucide-react |
| Hapus background | `@imgly/background-removal` 1.7 (ISNet) |
| Upscaling | `@huggingface/transformers` 3.3 (Swin2SR) |
| Inference runtime | `onnxruntime-web` (WebGPU, WebGL, WASM) |
| Worker | Web Worker modular (`src/workers/ai.worker.js`) |

## Mulai

### Prasyarat

- Node.js 18 atau lebih baru (disarankan 20/22)
- npm 9 atau lebih baru

### Instalasi

```bash
git clone https://github.com/hendrazulpiadi/visionboost.git
cd visionboost
npm install --legacy-peer-deps
npm run dev
```

Buka `http://localhost:5173`.

> `--legacy-peer-deps` diperlukan karena `@imgly/background-removal` mendeklarasikan peer `onnxruntime-web@1.21.0`, sedangkan `@huggingface/transformers` memakai versi dev `1.21.0-dev.20250206-d981b153d3`. Tanpa flag ini, npm dapat gagal dengan `ERESOLVE`.

> Gunakan `localhost`, bukan `127.0.0.1`. Vite secara default hanya listen di IPv6 (`::1`). Jika ingin mengakses lewat `127.0.0.1`, jalankan `npm run dev -- --host 127.0.0.1`.

### Script

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan dev server dengan hot reload |
| `npm run build` | Membuat build produksi di folder `dist/` |
| `npm run preview` | Menjalankan preview build produksi secara lokal |

### Catatan Windows: path mengandung `&`

Jika folder proyek berada di path yang mengandung karakter `&` (misalnya `C:\Users\...\app remove bg & apscaling img`), `npm run` dapat gagal karena `cmd.exe` memotong path. Buat file `.npmrc` di root proyek:

```ini
script-shell=C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe
```

File `.npmrc` bersifat lokal dan tidak di-commit karena path PowerShell hanya berlaku di Windows.

## Struktur Proyek

```text
.
├─ public/
│  ├─ favicon.svg
│  ├─ favicon-32.png
│  ├─ favicon.ico
│  └─ apple-touch-icon.png
├─ src/
│  ├─ components/
│  │  ├─ UploadZone.jsx
│  │  ├─ BeforeAfterSlider.jsx
│  │  └─ UsageGuide.jsx
│  ├─ lib/
│  │  └─ aiClient.js
│  ├─ workers/
│  │  └─ ai.worker.js
│  ├─ App.jsx
│  ├─ index.css
│  └─ main.jsx
├─ .github/workflows/deploy.yml
├─ index.html
├─ package.json
├─ tailwind.config.js
├─ postcss.config.js
└─ vite.config.js
```

## Format dan Batasan

- Format input: **JPG, PNG, WebP**
- Ukuran file maksimum: **10 MB**
- Upscale: sisi terpanjang input dibatasi **1280 px** untuk 2x dan **768 px** untuk 4x agar stabil di browser.
- Gambar besar diproses per tile (512 px untuk 2x, 384 px untuk 4x) dengan overlap 24 px.
- Output: **PNG** (mendukung transparansi) atau **JPG** (kualitas 0.95, background putih).
- Nama file hasil: `nama-asli-nobg.png` atau `nama-asli-2x.png` / `nama-asli-4x.png`.

## Deployment

### GitHub Pages

Workflow `.github/workflows/deploy.yml` akan build dan deploy otomatis setiap push ke branch `main`.

1. Push proyek ke GitHub.
2. Buka **Settings → Pages** pada repositori.
3. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
4. Push ke `main` atau jalankan workflow secara manual dari tab **Actions**.

`vite.config.js` memakai `base: './'` sehingga aset tetap dimuat dengan benar saat aplikasi berada di subpath seperti `https://username.github.io/nama-repo/`.

### Catatan performa multithread

GitHub Pages tidak mengirim header COOP/COEP, sehingga ONNX Runtime berjalan single-thread (lebih lambat). Untuk mengaktifkan multithreading, host di platform yang bisa mengatur header:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Contoh untuk Netlify, simpan sebagai `public/_headers`:

```text
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

## Troubleshooting

**`npm install` gagal dengan `ERESOLVE`**
- Gunakan `npm install --legacy-peer-deps`. Konflik peer berasal dari perbedaan versi `onnxruntime-web` antara `@imgly/background-removal` dan `@huggingface/transformers`.

**Proses AI berhenti di "Mengunduh AI Engine..."**
- Pastikan internet aktif saat pemakaian pertama.
- Izinkan akses ke `huggingface.co`, `staticimgly.com`, dan CDN terkait.
- Nonaktifkan sementara adblocker atau ekstensi privasi yang memblokir fetch model.
- Jika unduhan terputus, muat ulang halaman lalu coba lagi.

**Ingin mengunduh ulang model**
- Buka DevTools → Application → Storage, hapus data situs (Cache Storage/IndexedDB) untuk origin aplikasi, lalu muat ulang.

**Proses sangat lambat atau browser kehabisan memori**
- Tutup tab lain, gunakan gambar yang lebih kecil, dan pilih upscale 2x.
- Gunakan Chrome/Edge terbaru agar WebGPU aktif.
- Di perangkat RAM kecil, proses 4x pada gambar besar bisa gagal.

**`127.0.0.1` tidak bisa dibuka**
- Gunakan `http://localhost:5173` atau jalankan `npm run dev -- --host 127.0.0.1`.

**`npm run dev` error di Windows karena path `&`**
- Tambahkan `.npmrc` seperti pada bagian [Catatan Windows](#catatan-windows-path-mengandung-).

**Favicon belum berubah**
- Lakukan hard refresh (`Ctrl+F5`) atau buka tab baru. Browser meng-cache favicon secara agresif.

## Privasi

- Gambar diproses sepenuhnya di browser dan tidak pernah diunggah.
- Tidak ada login, analitik, atau database pengguna.
- Yang diunduh hanya file model AI. Server CDN model dapat melihat permintaan unduhan (IP dan user agent), tetapi tidak menerima gambar Anda.

## Kredit

- [@imgly/background-removal](https://github.com/imgly/background-removal-js) dan model ISNet.
- [Transformers.js](https://github.com/huggingface/transformers.js) dan model Swin2SR dari [Xenova](https://huggingface.co/Xenova).
- [ONNX Runtime Web](https://onnxruntime.ai/).
- Ikon antarmuka dari [lucide](https://lucide.dev/).

## Lisensi

Belum ada lisensi open source yang ditetapkan. Repositori ini bersifat privat (`"private": true` pada `package.json`). Hubungi pemilik repositori untuk penggunaan ulang.
