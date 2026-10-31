import { useEffect } from 'react'
import {
  Check,
  Cpu,
  Download,
  ImageUp,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
  Zap,
} from 'lucide-react'

const STEPS = [
  {
    icon: Wand2,
    title: 'Pilih alat',
    text: 'Pilih "Hapus Background" atau "Upscale Gambar" di beranda.',
  },
  {
    icon: ImageUp,
    title: 'Unggah gambar',
    text: 'Tarik & lepas atau pilih file JPG, PNG, atau WebP (maks. 10 MB).',
  },
  {
    icon: Download,
    title: 'Unduh AI sekali',
    text: 'Saat pertama memakai AI, browser mengunduh mesin AI. Butuh internet hanya di langkah ini.',
  },
  {
    icon: Sparkles,
    title: 'Bandingkan & unduh',
    text: 'Geser slider sebelum/sesudah, lalu klik "Unduh Gambar".',
  },
]

const MODELS = [
  { label: 'Hapus BG', size: '±40–80 MB' },
  { label: 'Upscale 2x', size: '±7 MB' },
  { label: 'Upscale 4x', size: '±22 MB' },
]

const TIPS = [
  'Jangan tutup tab saat AI sedang memproses gambar.',
  'Gunakan gambar maksimal 10 MB agar browser tetap stabil.',
  'WebGPU/WebGL mempercepat proses; tanpa itu AI memakai CPU (lebih lambat).',
  'Hasil Hapus BG bisa transparan (PNG) atau diberi warna solid.',
]

export default function UsageGuide({ open, onClose }) {
  useEffect(() => {
    if (!open) return

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKey)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        onClick={(event) => event.stopPropagation()}
        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-[0_40px_120px_-30px_rgba(139,92,246,0.55)]"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 id="guide-title" className="text-base font-bold text-white sm:text-lg">
                Panduan Singkat
              </h2>
              <p className="text-[11px] text-zinc-400 sm:text-xs">
                VisionBoost menjalankan AI langsung di browser Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
          >
            <X size={17} />
          </button>
        </div>

        <div className="relative max-h-[calc(90vh-4.5rem)] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3.5">
            <p className="flex items-center gap-2 text-xs font-semibold text-amber-100">
              <Zap size={14} className="shrink-0 text-amber-300" />
              Penting: AI perlu diunduh sekali di awal
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-amber-100/80 sm:text-xs">
              Sistem ini bekerja penuh di browser (AI Engine berjalan lokal).
              Saat pertama kali memakai fitur AI, browser akan mengunduh mesin
              AI ke perangkat Anda. Proses ini <strong>butuh internet</strong>{' '}
              dan bisa memakan waktu beberapa detik hingga beberapa menit
              tergantung koneksi. Setelah selesai, model disimpan di cache
              browser sehingga pemakaian berikutnya jauh lebih cepat, bahkan
              tanpa mengunduh ulang.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {MODELS.map((model) => (
                <span
                  key={model.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] text-amber-100/90"
                >
                  <Download size={10} className="text-amber-300" />
                  {model.label}
                  <span className="font-semibold text-white">{model.size}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3"
                >
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 text-violet-200">
                    <Icon size={16} />
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                      {index + 1}
                    </span>
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">{step.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
                      {step.text}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
            <p className="label mb-2">Tips agar lancar</p>
            <ul className="space-y-1.5">
              {TIPS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-400">
                  <Check size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-3.5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-emerald-100">
                Gambar tetap privat
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-100/70">
                Yang diunduh hanya model AI-nya. Gambar Anda diproses secara
                lokal dan tidak pernah diunggah ke server.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-500">
            <Cpu size={11} />
            Berjalan di WebGPU / WebGL / WASM — tanpa instalasi aplikasi.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-primary mt-4 w-full"
          >
            <Sparkles size={15} />
            Mengerti, mulai sekarang
          </button>
        </div>
      </div>
    </div>
  )
}
