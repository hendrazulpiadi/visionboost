import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Cpu,
  Download,
  FileImage,
  HelpCircle,
  ImageIcon,
  Layers,
  Loader2,
  Lock,
  Maximize2,
  RefreshCw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
  Zap,
} from 'lucide-react'
import UploadZone from './components/UploadZone.jsx'
import BeforeAfterSlider from './components/BeforeAfterSlider.jsx'
import UsageGuide from './components/UsageGuide.jsx'
import {
  runAI,
  supportsWebGL,
  supportsWebGPU,
} from './lib/aiClient.js'

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const GUIDE_KEY = 'visionboost:guide-seen'

function shouldShowGuide() {
  try {
    return window.localStorage.getItem(GUIDE_KEY) !== '1'
  } catch {
    return true
  }
}

const BG_PRESETS = [
  { name: 'Transparan', value: 'transparent' },
  { name: 'Putih', value: '#ffffff' },
  { name: 'Hitam', value: '#000000' },
  { name: 'Abu-abu', value: '#e4e4e7' },
  { name: 'Biru', value: '#2563eb' },
  { name: 'Hijau', value: '#10b981' },
  { name: 'Kuning', value: '#f59e0b' },
  { name: 'Pink', value: '#ec4899' },
]

const MODES = {
  remove: {
    title: 'Hapus Background',
    short: 'Remove BG',
    description:
      'Pisahkan subjek dari latar belakang secara otomatis. Hasil transparan atau beri warna baru.',
    icon: Scissors,
    accent: 'from-violet-500/20 to-fuchsia-500/10 text-violet-200',
  },
  upscale: {
    title: 'Upscale Gambar',
    short: 'AI Upscaler',
    description:
      'Perbesar resolusi 2x atau 4x dengan rekonstruksi detail piksel oleh AI, bukan sekadar blur.',
    icon: Maximize2,
    accent: 'from-cyan-400/20 to-emerald-400/10 text-cyan-200',
  },
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

function ProgressOverlay({ progress }) {
  const percent = Math.round(progress.percent || 0)
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 rounded-2xl bg-ink-950/80 p-6 backdrop-blur-md">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 animate-pulseGlow rounded-full bg-violet-500/30 blur-2xl" />
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - percent / 100)}`}
            className="transition-all duration-500 ease-out"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="55%" stopColor="#e879f9" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute text-xl font-bold tabular-nums text-white">
          {percent}%
        </span>
      </div>

      <div className="max-w-xs space-y-1 text-center">
        <p className="text-sm font-semibold text-white">{progress.message}</p>
        <p className="text-xs text-zinc-400">
          AI berjalan di perangkat Anda. Jangan tutup tab ini.
        </p>
      </div>

      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 transition-all duration-500"
          style={{ width: `${Math.max(percent, 3)}%` }}
        />
      </div>
    </div>
  )
}

function ToolCard({ mode, onSelect }) {
  const meta = MODES[mode]
  const Icon = meta.icon
  const isRemove = mode === 'remove'

  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055] hover:shadow-[0_30px_60px_-30px_rgba(139,92,246,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/5 blur-2xl transition-opacity group-hover:bg-violet-500/10" />
      <div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br ${meta.accent}`}
      >
        <Icon size={22} />
      </div>

      <h3 className="text-lg font-bold text-white">{meta.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
        {meta.description}
      </p>

      <ul className="mt-4 space-y-1.5 text-[13px] text-zinc-400">
        {(isRemove
          ? ['Deteksi subjek otomatis', 'Output transparan / warna solid', 'Tepi rambut & produk rapi']
          : ['Skala 2x dan 4x', 'Model AI quantized ringan', 'Detail piksel direkonstruksi']
        ).map((item) => (
          <li key={item} className="flex items-center gap-2">
            <Check size={13} className="shrink-0 text-emerald-400" />
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-violet-300">
        Pilih gambar
        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-1"
        />
      </div>
    </button>
  )
}

function SegmentedScale({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[2, 4].map((option) => {
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`relative rounded-xl border px-3 py-3 text-left transition-all ${
              active
                ? 'border-violet-400/60 bg-violet-500/15 text-white shadow-[0_0_0_1px_rgba(167,139,250,0.35)]'
                : 'border-white/10 bg-white/[0.03] text-zinc-300 hover:border-white/20'
            }`}
          >
            <span className="flex items-center justify-between">
              <span className="text-base font-bold">{option}x</span>
              {active && <Check size={14} className="text-violet-300" />}
            </span>
            <span className="mt-0.5 block text-[11px] text-zinc-400">
              {option === 2 ? 'Cepat, tajam' : 'Maksimal detail'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function App() {
  const [mode, setMode] = useState(null)
  const [image, setImage] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({
    percent: 0,
    message: '',
    stage: '',
  })
  const [error, setError] = useState('')
  const [bgColor, setBgColor] = useState('transparent')
  const [scale, setScale] = useState(2)
  const [format, setFormat] = useState('png')
  const [stale, setStale] = useState(false)
  const [gpuReady, setGpuReady] = useState(true)
  const [glReady, setGlReady] = useState(true)
  const [showWarning, setShowWarning] = useState(false)
  const [showGuide, setShowGuide] = useState(shouldShowGuide)

  useEffect(() => {
    const gpu = supportsWebGPU()
    const gl = supportsWebGL()
    setGpuReady(gpu)
    setGlReady(gl)
    setShowWarning(!gpu && !gl)
  }, [])

  useEffect(() => {
    const url = image?.url
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [image?.url])

  useEffect(() => {
    const url = result?.url
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [result?.url])

  const resetWorkspace = useCallback(() => {
    setImage(null)
    setResult(null)
    setError('')
    setBusy(false)
    setBgColor('transparent')
    setScale(2)
    setFormat('png')
    setStale(false)
  }, [])

  const goHome = useCallback(() => {
    resetWorkspace()
    setMode(null)
  }, [resetWorkspace])

  const closeGuide = useCallback(() => {
    setShowGuide(false)
    try {
      window.localStorage.setItem(GUIDE_KEY, '1')
    } catch {
      /* storage tidak tersedia */
    }
  }, [])

  const selectMode = (next) => {
    resetWorkspace()
    setMode(next)
  }

  const startRemove = useCallback(
    async (file) => {
      const source = file || image?.file
      if (!source) return
      setBusy(true)
      setError('')
      setResult(null)
      setProgress({ percent: 0, message: 'Menyiapkan AI Engine...', stage: 'prepare' })

      try {
        const buffer = await source.arrayBuffer()
        const response = await runAI(
          'remove-bg',
          {
            buffer,
            mime: source.type || 'image/png',
            useGpu: gpuReady,
          },
          {
            transfer: [buffer],
            onProgress: (update) =>
              setProgress({
                percent: update.percent,
                message: update.message,
                stage: update.stage,
              }),
          },
        )
        const url = URL.createObjectURL(response.blob)
        setResult({
          blob: response.blob,
          url,
          width: response.width,
          height: response.height,
          mode: 'remove',
        })
        setFormat('png')
      } catch (err) {
        setError(err.message || 'Gagal menghapus background.')
      } finally {
        setBusy(false)
      }
    },
    [gpuReady, image?.file],
  )

  const startUpscale = useCallback(
    async (file) => {
      const source = file || image?.file
      if (!source) return
      setBusy(true)
      setError('')
      setProgress({ percent: 0, message: 'Menyiapkan model upscaler...', stage: 'prepare' })

      try {
        const buffer = await source.arrayBuffer()
        const response = await runAI(
          'upscale',
          {
            buffer,
            mime: source.type || 'image/png',
            scale,
          },
          {
            transfer: [buffer],
            onProgress: (update) =>
              setProgress({
                percent: update.percent,
                message: update.message,
                stage: update.stage,
              }),
          },
        )
        const url = URL.createObjectURL(response.blob)
        setResult({
          blob: response.blob,
          url,
          width: response.width,
          height: response.height,
          resized: response.resized,
          inputWidth: response.inputWidth,
          inputHeight: response.inputHeight,
          scale,
          mode: 'upscale',
        })
        setStale(false)
        setFormat('png')
      } catch (err) {
        setError(err.message || 'Gagal melakukan upscale.')
      } finally {
        setBusy(false)
      }
    },
    [image?.file, scale],
  )

  const handleFile = useCallback(
    async (file) => {
      setError('')

      const type = file.type || ''
      const extension = file.name.split('.').pop()?.toLowerCase()
      const validType =
        ACCEPTED.includes(type) || ['jpg', 'jpeg', 'png', 'webp'].includes(extension)

      if (!validType) {
        setError('Format tidak didukung. Gunakan JPG, PNG, atau WebP.')
        return
      }

      if (file.size > MAX_SIZE) {
        setError('Ukuran file melebihi 10 MB. Kompres gambar terlebih dahulu.')
        return
      }

      try {
        const bitmap = await createImageBitmap(file)
        const meta = {
          file,
          url: URL.createObjectURL(file),
          width: bitmap.width,
          height: bitmap.height,
          name: file.name,
          size: file.size,
        }
        bitmap.close()
        setImage(meta)
        setResult(null)
        setBgColor('transparent')
        setStale(false)

        if (mode === 'remove') {
          startRemove(file)
        }
      } catch {
        setError('Gambar tidak dapat dibaca. Coba file lain.')
      }
    },
    [mode, startRemove],
  )

  const handleScaleChange = (next) => {
    setScale(next)
    if (result?.mode === 'upscale' && result.scale !== next) setStale(true)
  }

  const handleDownload = async () => {
    if (!result || stale) return

    const extension = format === 'jpeg' ? 'jpg' : 'png'
    const baseName = image?.name?.replace(/\.[^.]+$/, '') || 'visionboost'
    const suffix = result.mode === 'remove' ? '-nobg' : `-${result.scale}x`
    const filename = `${baseName}${suffix}.${extension}`

    let blob = result.blob
    const needsComposite =
      (result.mode === 'remove' && bgColor !== 'transparent') ||
      format === 'jpeg'

    if (needsComposite) {
      const bitmap = await createImageBitmap(result.blob)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')

      if (result.mode === 'remove' || format === 'jpeg') {
        context.fillStyle =
          result.mode === 'remove' && bgColor !== 'transparent'
            ? bgColor
            : '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
      }

      context.drawImage(bitmap, 0, 0)
      bitmap.close()

      blob = await new Promise((resolve) =>
        canvas.toBlob(
          resolve,
          format === 'jpeg' ? 'image/jpeg' : 'image/png',
          0.95,
        ),
      )
    }

    const link = document.createElement('a')
    const downloadUrl = URL.createObjectURL(blob)
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500)
  }

  const outputSize = useMemo(() => {
    if (!image) return null
    const cap = scale === 4 ? 768 : 1280
    const longest = Math.max(image.width, image.height)
    const ratio = longest > cap ? cap / longest : 1
    return {
      width: Math.round(image.width * ratio) * scale,
      height: Math.round(image.height * ratio) * scale,
      downscaled: ratio < 1,
      cap,
    }
  }, [image, scale])

  const canProcess = Boolean(image) && !busy

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <button
            type="button"
            onClick={goHome}
            className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25">
              <Sparkles size={18} />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-sm font-bold tracking-tight text-white">
                VisionBoost
              </span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                AI Studio
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="chip transition-colors hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              aria-label="Petunjuk penggunaan"
            >
              <HelpCircle size={12} className="text-violet-300" />
              <span className="hidden sm:inline">Petunjuk</span>
            </button>
            <span className="chip hidden sm:inline-flex">
              <ShieldCheck size={12} className="text-emerald-400" />
              100% lokal
            </span>
            <span className="chip hidden md:inline-flex">
              <Cpu size={12} className="text-cyan-300" />
              {gpuReady ? 'WebGPU siap' : 'WASM mode'}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {!mode && (
          <div className="space-y-12">
            <section className="mx-auto max-w-3xl text-center">
              <span className="chip mx-auto border-violet-400/20 bg-violet-500/10 text-violet-200">
                <Zap size={12} />
                AI berjalan di browser Anda
              </span>
              <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                Hapus background &{' '}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                  tajamkan gambar
                </span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg">
                Dua alat AI dalam satu studio. Gratis, tanpa login, dan gambar
                Anda tidak pernah meninggalkan perangkat.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-400">
                <span className="chip">
                  <Lock size={12} className="text-emerald-400" /> Tanpa upload
                </span>
                <span className="chip">
                  <Layers size={12} className="text-violet-300" /> Model di-cache
                </span>
                <span className="chip">
                  <Zap size={12} className="text-amber-300" /> WebGPU / WASM
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
              >
                <HelpCircle size={12} className="text-violet-300" />
                Baru di sini?
                <span className="font-semibold text-violet-300">
                  Baca petunjuk penggunaan
                </span>
              </button>
            </section>

            {showWarning && (
              <div className="mx-auto flex max-w-3xl items-start gap-3 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
                <div className="flex-1">
                  <p className="font-semibold">Perangkat mungkin lebih lambat</p>
                  <p className="mt-0.5 text-amber-100/70">
                    WebGPU/WebGL tidak terdeteksi. AI akan berjalan di CPU
                    (WASM) dan proses bisa memakan waktu lebih lama.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWarning(false)}
                  className="rounded-md p-1 text-amber-200/70 hover:bg-white/10 hover:text-white"
                  aria-label="Tutup peringatan"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <section className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
              <ToolCard mode="remove" onSelect={selectMode} />
              <ToolCard mode="upscale" onSelect={selectMode} />
            </section>

            <section className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: 'Privasi mutlak',
                  text: 'Gambar diproses lokal di browser. Tidak ada server, tidak ada unggahan.',
                  color: 'text-emerald-300',
                },
                {
                  icon: Zap,
                  title: 'Ringan & cepat',
                  text: 'Model quantized disimpan di cache browser. Kunjungan berikutnya instan.',
                  color: 'text-amber-300',
                },
                {
                  icon: Wand2,
                  title: 'Hasil berkualitas',
                  text: 'AI rekonstruksi detail dan merapikan tepi objek, bukan sekadar resize.',
                  color: 'text-violet-300',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                  >
                    <Icon size={17} className={item.color} />
                    <p className="mt-2 text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      {item.text}
                    </p>
                  </div>
                )
              })}
            </section>
          </div>
        )}

        {mode && !image && (
          <div className="mx-auto max-w-3xl">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="btn-ghost mb-6 !px-3 !py-2 text-xs"
            >
              <ArrowLeft size={14} />
              Kembali
            </button>

            <div className="mb-6 text-center">
              <span className="chip mb-4 border-white/10 bg-white/5 text-zinc-300">
                {mode === 'remove' ? (
                  <Scissors size={12} />
                ) : (
                  <Maximize2 size={12} />
                )}
                {MODES[mode].short}
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {MODES[mode].title}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
                {MODES[mode].description}
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 p-3.5 text-sm text-red-100">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-300" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="rounded p-0.5 text-red-200/70 hover:bg-white/10 hover:text-white"
                  aria-label="Tutup pesan"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <UploadZone onFile={handleFile} mode={mode} />

            <p className="mt-4 text-center text-[11px] text-zinc-500">
              {mode === 'remove'
                ? 'Proses dimulai otomatis setelah gambar dipilih. AI Engine diunduh sekali pada pemakaian pertama.'
                : 'Setelah gambar dipilih, tentukan skala 2x atau 4x. AI Engine diunduh sekali pada pemakaian pertama.'}
            </p>
          </div>
        )}

        {mode && image && (
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={goHome}
                className="btn-ghost !px-3 !py-2 text-xs"
              >
                <ArrowLeft size={14} />
                Alat lain
              </button>

              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <FileImage size={15} className="shrink-0 text-zinc-400" />
                <div className="min-w-0">
                  <p className="max-w-[180px] truncate text-xs font-medium text-zinc-200 sm:max-w-[260px]">
                    {image.name}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {image.width} × {image.height} px · {formatBytes(image.size)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="card relative flex min-h-[380px] flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br ${
                        MODES[mode].accent
                      }`}
                    >
                      {mode === 'remove' ? (
                        <Scissors size={13} />
                      ) : (
                        <Maximize2 size={13} />
                      )}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {result ? 'Preview hasil' : 'Preview'}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {result
                          ? `${result.width} × ${result.height} px`
                          : 'Geser slider untuk membandingkan'}
                      </p>
                    </div>
                  </div>
                  {result && !busy && (
                    <span className="chip border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                      <Check size={11} /> Selesai
                    </span>
                  )}
                </div>

                <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
                  {result ? (
                    <BeforeAfterSlider
                      before={image.url}
                      after={result.url}
                      background={
                        result.mode === 'remove' ? bgColor : 'transparent'
                      }
                      aspect={image.width / image.height}
                    />
                  ) : (
                    <div className="flex w-full items-center justify-center">
                      <img
                        src={image.url}
                        alt="Gambar yang diunggah"
                        className="max-h-[62vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                      />
                    </div>
                  )}

                  {busy && <ProgressOverlay progress={progress} />}
                </div>

                {result?.mode === 'upscale' && result.resized && (
                  <div className="border-t border-white/5 px-4 py-2.5 text-[11px] text-zinc-500">
                    Input disesuaikan ke {result.inputWidth} × {result.inputHeight}{' '}
                    px agar stabil. Hasil akhir {result.width} × {result.height} px.
                  </div>
                )}

                {error && (
                  <div className="m-4 flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-100">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-300" />
                    <span className="flex-1">{error}</span>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="rounded p-0.5 text-red-200/70 hover:bg-white/10 hover:text-white"
                      aria-label="Tutup pesan"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </section>

              <aside className="space-y-4">
                <div className="card p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-300">
                      {mode === 'remove' ? <Scissors size={14} /> : <Maximize2 size={14} />}
                    </span>
                    <h2 className="text-sm font-bold text-white">
                      {MODES[mode].title}
                    </h2>
                  </div>

                  {mode === 'remove' ? (
                    <div className="space-y-4">
                      <div>
                        <p className="label mb-2">Warna background</p>
                        <div className="flex flex-wrap gap-2">
                          {BG_PRESETS.map((preset) => {
                            const active = bgColor === preset.value
                            return (
                              <button
                                key={preset.value}
                                type="button"
                                title={preset.name}
                                aria-label={preset.name}
                                onClick={() => setBgColor(preset.value)}
                                className={`swatch ${
                                  preset.value === 'transparent'
                                    ? 'checkerboard'
                                    : ''
                                } ${
                                  active
                                    ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-ink-900'
                                    : ''
                                }`}
                                style={
                                  preset.value === 'transparent'
                                    ? undefined
                                    : { backgroundColor: preset.value }
                                }
                              >
                                {active && (
                                  <Check
                                    size={13}
                                    className={`absolute inset-0 m-auto ${
                                      preset.value === '#ffffff' ||
                                      preset.value === '#e4e4e7'
                                        ? 'text-ink-900'
                                        : 'text-white'
                                    }`}
                                  />
                                )}
                              </button>
                            )
                          })}
                          <label
                            className="swatch flex cursor-pointer items-center justify-center overflow-hidden bg-[conic-gradient(from_0deg,#f87171,#fbbf24,#34d399,#22d3ee,#a78bfa,#f472b6,#f87171)]"
                            title="Warna kustom"
                          >
                            <input
                              type="color"
                              value={
                                bgColor === 'transparent' ? '#ffffff' : bgColor
                              }
                              onChange={(event) => setBgColor(event.target.value)}
                              className="h-0 w-0 opacity-0"
                              aria-label="Pilih warna kustom"
                            />
                          </label>
                        </div>
                        <p className="mt-2 text-[11px] text-zinc-500">
                          Pilih transparan untuk PNG dengan alpha.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => startRemove()}
                        disabled={!canProcess}
                        className="btn-primary w-full"
                      >
                        {busy ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <RefreshCw size={15} />
                        )}
                        {result ? 'Proses Ulang' : 'Hapus Background'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="label mb-2">Skala upscale</p>
                        <SegmentedScale value={scale} onChange={handleScaleChange} />
                      </div>

                      {outputSize && (
                        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-zinc-400">
                          Estimasi hasil:{' '}
                          <span className="font-semibold text-zinc-200">
                            {outputSize.width} × {outputSize.height} px
                          </span>
                          {outputSize.downscaled && (
                            <span className="mt-1 block text-amber-300/80">
                              Sisi terpanjang dibatasi {outputSize.cap} px agar
                              proses stabil di browser.
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => startUpscale()}
                        disabled={!canProcess}
                        className="btn-primary w-full"
                      >
                        {busy ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Zap size={15} />
                        )}
                        {stale
                          ? `Proses Upscale ${scale}x`
                          : result
                            ? 'Upscale Ulang'
                            : `Upscale ${scale}x`}
                      </button>

                      {stale && (
                        <p className="text-[11px] text-amber-300/80">
                          Skala berubah. Proses ulang untuk memperbarui hasil.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-5 border-t border-white/5 pt-4">
                    <p className="label mb-2">Format unduhan</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'png', label: 'PNG', hint: 'Kualitas penuh' },
                        { value: 'jpeg', label: 'JPG', hint: 'Ukuran kecil' },
                      ].map((option) => {
                        const active = format === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormat(option.value)}
                            className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                              active
                                ? 'border-violet-400/50 bg-violet-500/15 text-white'
                                : 'border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20'
                            }`}
                          >
                            <span className="block text-xs font-semibold">
                              {option.label}
                            </span>
                            <span className="block text-[10px] opacity-70">
                              {option.hint}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={!result || busy || stale}
                      className="btn-primary mt-3 w-full"
                    >
                      <Download size={15} />
                      Unduh Gambar
                    </button>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-400"
                    />
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">
                        Privasi terjaga
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
                        Gambar Anda diproses secara lokal di perangkat ini. Tidak
                        ada gambar yang diunggah ke server.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <Cpu size={11} />
                    Model AI di-cache otomatis di browser
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetWorkspace()
                  }}
                  className="btn-ghost w-full !py-2 text-xs"
                >
                  <ImageIcon size={14} />
                  Ganti gambar
                </button>
              </aside>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 text-[11px] text-zinc-600 sm:flex-row sm:px-6">
          <p>VisionBoost — AI lokal untuk kreator.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck size={11} />
            Tanpa server · Tanpa login · Tanpa biaya
          </p>
        </div>
      </footer>

      <UsageGuide open={showGuide} onClose={closeGuide} />
    </div>
  )
}

export default App
