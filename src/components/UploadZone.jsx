import { useRef, useState } from 'react'
import { ImagePlus, ShieldCheck, UploadCloud } from 'lucide-react'

const ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp'

export default function UploadZone({ onFile, mode = 'remove' }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const openPicker = () => inputRef.current?.click()

  const handleFiles = (files) => {
    const file = files?.[0]
    if (file) onFile(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openPicker()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-violet-400/60 ${
          isDragging
            ? 'border-violet-400/80 bg-violet-500/10'
            : 'border-white/10 bg-white/[0.02] hover:border-violet-400/40 hover:bg-white/[0.04]'
        }`}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-cyan-400/10 text-violet-200 shadow-lg">
          {mode === 'upscale' ? (
            <ImagePlus size={26} />
          ) : (
            <UploadCloud size={26} />
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-base font-semibold text-white">
            {isDragging ? 'Lepaskan gambar di sini' : 'Tarik & lepas gambar'}
          </p>
          <p className="text-sm text-zinc-400">
            atau <span className="font-semibold text-violet-300">pilih file</span>{' '}
            dari perangkat
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-500">
          <span className="chip">JPG</span>
          <span className="chip">PNG</span>
          <span className="chip">WebP</span>
          <span className="chip">Maks. 10 MB</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck size={13} className="text-emerald-400" />
          Diproses lokal, tidak diunggah ke server
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </div>
  )
}
