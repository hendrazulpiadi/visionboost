Berikut adalah *Product Requirements Document* (PRD) untuk aplikasi web yang memiliki fitur **Image Upscaling** (peningkatan resolusi gambar) dan **Background Removal** (penghapus latar belakang).

Untuk memenuhi kriteria "efektif dan ringan", kita akan kembali menggunakan pendekatan **Edge AI (In-Browser Processing)** menggunakan WebAssembly (WASM) dan WebGPU. Pendekatan ini memungkinkan model AI berjalan langsung di *browser* pengguna tanpa perlu server GPU yang mahal.

---

# Product Requirements Document (PRD)

**Nama Produk:** VisionBoost / PicMagic (Nama Sementara)
**Platform:** Web Application (Desktop & Mobile Browser)
**Tujuan Utama:** Menyediakan alat berbasis AI yang cepat, gratis (tanpa biaya server), dan menjaga privasi pengguna untuk menghapus latar belakang dan meningkatkan resolusi gambar yang pecah/blur.

## 1. Ringkasan Eksekutif

Kreator konten, pemilik toko online, dan desainer sering kali memiliki gambar dengan resolusi rendah atau membutuhkan objek tanpa latar belakang. Solusi yang ada di pasaran sering berbayar mahal atau membutuhkan instalasi *software* berat. Aplikasi ini dirancang untuk memecahkan masalah tersebut dengan membawa pemrosesan AI langsung ke *browser* perangkat pengguna, menjadikannya sangat ringan, aman, dan tanpa biaya langganan.

## 2. Rekomendasi Teknologi (Tech Stack)

Fokus utama adalah performa dan efisiensi biaya (bebas biaya server API).

* **Frontend UI:** Vite + React.js dan Tailwind CSS (Cepat dalam *development*, sangat ringan, dan *state management* yang baik untuk memuat model AI).
* **AI Engine (Background Removal):** `@imgly/background-removal` atau `Transformers.js` (Hugging Face). Berjalan di klien menggunakan WebAssembly (WASM).
* **AI Engine (Upscaling):** `Transformers.js` menggunakan model Super-Resolution ringan (misal: Swin2SR atau Real-ESRGAN versi *quantized*).
* **Akselerasi Hardware:** Menggunakan **WebGPU** atau **WebGL** agar proses AI menggunakan kartu grafis (GPU) bawaan dari laptop/HP pengguna, bukan CPU, sehingga prosesnya jauh lebih cepat.
* **Penyimpanan Model:** IndexedDB (Saat pertama kali buka, aplikasi akan mengunduh model AI berukuran ~30-50MB. Model ini akan disimpan di *cache browser*, sehingga kunjungan kedua akan instan tanpa perlu unduh ulang).

## 3. Fitur Utama (Functional Requirements)

1. **Modul Unggah Gambar (Upload Module):**
* Mendukung format JPG, PNG, dan WebP.
* Batas maksimal ukuran file awal: 10MB (agar browser tidak *crash*).


2. **Fitur Hapus Latar Belakang (Remove BG):**
* Proses otomatis mengenali subjek utama (manusia, produk, hewan).
* Opsi untuk memberikan warna *background* baru (warna solid) atau membiarkannya transparan (PNG).


3. **Fitur Image Upscaling (AI Enlarger):**
* Opsi peningkatan resolusi: **2x** dan **4x**.
* AI akan menambahkan detail pixel yang hilang (bukan sekadar diperbesar, tapi dipertajam).


4. **Interactive Preview (Slider Sebelum & Sesudah):**
* Menampilkan UI *slider* yang bisa digeser ke kiri/kanan untuk membandingkan gambar asli (*Before*) dan hasil AI (*After*).


5. **Ekspor & Unduh:**
* Menyimpan hasil editan ke perangkat dengan format PNG (jika transparan) atau JPG kualitas tinggi.



## 4. Syarat Antarmuka & Pengalaman Pengguna (UI/UX)

* **Tema:** Disarankan menggunakan mode gelap (*Dark Mode*) atau netral gelap karena sangat cocok untuk aplikasi pengeditan foto (membuat warna gambar lebih menonjol).
* **Status Loading yang Jelas:** Karena memuat model AI di *browser* membutuhkan waktu beberapa detik pada kunjungan pertama, berikan animasi loading persentase (contoh: "Memuat AI Engine... 45%") agar pengguna tidak mengira web rusak.
* **Workspace Dinamis:** Setelah gambar diunggah, layar terbagi menjadi area kerja (tengah) dan panel kontrol alat di sebelah kanan atau bawah.
* **Perlindungan Privasi (Trust Badge):** Tampilkan teks kecil yang jelas: *"Gambar Anda diproses secara lokal di perangkat ini. Tidak ada gambar yang diunggah ke server."* Ini adalah nilai jual yang besar.

## 5. Alur Pengguna (User Flow)

1. **Beranda:** Pengguna melihat dua pilihan utama: "Hapus Background" atau "Upscale Gambar".
2. **Unggah:** Pengguna memasukkan gambar.
3. **Inisialisasi (Hanya sekali):** Sistem mengunduh model AI ke *cache browser*.
4. **Pemrosesan:**
* Jika pengguna memilih *Remove BG*, AI memotong gambar dalam 2-5 detik.
* Jika memilih *Upscale*, AI memproses piksel dalam 5-15 detik.


5. **Review:** Pengguna menggunakan *slider* untuk melihat hasil.
6. **Selesai:** Klik "Unduh Gambar".

## 6. Kebutuhan Non-Fungsional

* **Offloading UI:** Pemrosesan AI **wajib** diletakkan di dalam *Web Worker*. Jika diletakkan di *main thread*, halaman web akan macet/lag saat AI sedang menganalisis gambar.
* **Fall-back (Cadangan):** Jika perangkat pengguna terlalu tua dan tidak mendukung WebGL/WebGPU, munculkan pesan peringatan bahwa proses mungkin memakan waktu lebih lama.
* **Responsif:** UI untuk *slider before/after* harus merespons sentuhan (touch-friendly) untuk pengguna *smartphone*.

## 7. Metrik Kesuksesan

* **Performa Waktu:** Hapus background selesai di bawah 5 detik. Upscale 2x selesai di bawah 10 detik (di perangkat standar).
* **Akurasi Tepi (Edge Accuracy):** Untuk penghapus latar belakang, helaian rambut atau tepi produk harus terpotong dengan rapi (tidak bergerigi kasar).
* **User Retention:** Berapa banyak pengguna yang kembali menggunakan *tool* ini (karena cepat dan tidak butuh login).

---

**Catatan untuk Developer (Strategi Keringanan):**
Karena model Upscaling AI cukup berat, pastikan menggunakan model *quantized* (8-bit atau INT8) melalui `Transformers.js`. Ini akan memangkas ukuran file model dari ~200MB menjadi hanya sekitar ~30MB tanpa banyak mengorbankan kualitas visual, sehingga sangat ideal dan ringan untuk dimuat pada aplikasi berbasis web.