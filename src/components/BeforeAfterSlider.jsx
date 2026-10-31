import { useCallback, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function BeforeAfterSlider({
  before,
  after,
  background = 'transparent',
  aspect = 1,
  beforeLabel = 'Sebelum',
  afterLabel = 'Sesudah',
}) {
  const [position, setPosition] = useState(50)
  const [dragging, setDragging] = useState(false)
  const containerRef = useRef(null)

  const updateFromClientX = useCallback((clientX) => {
    const node = containerRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    if (!rect.width) return
    const next = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(100, Math.max(0, next)))
  }, [])

  const handlePointerDown = (event) => {
    event.preventDefault()
    containerRef.current?.setPointerCapture?.(event.pointerId)
    setDragging(true)
    updateFromClientX(event.clientX)
  }

  const handlePointerMove = (event) => {
    if (!dragging) return
    updateFromClientX(event.clientX)
  }

  const stopDragging = (event) => {
    setDragging(false)
    containerRef.current?.releasePointerCapture?.(event.pointerId)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setPosition((p) => Math.max(0, p - 2))
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setPosition((p) => Math.min(100, p + 2))
    } else if (event.key === 'Home') {
      setPosition(0)
    } else if (event.key === 'End') {
      setPosition(100)
    }
  }

  const afterStyle =
    background === 'transparent'
      ? { backgroundColor: undefined }
      : { backgroundColor: background }

  return (
    <div
      className="flex w-full items-center justify-center"
      style={{ minHeight: 200 }}
    >
      <div
        ref={containerRef}
        role="slider"
        tabIndex={0}
        aria-label="Perbandingan gambar sebelum dan sesudah"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onKeyDown={handleKeyDown}
        className="relative w-full touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
        style={{
          aspectRatio: aspect,
          width: `min(100%, calc(66vh * ${aspect}))`,
          cursor: dragging ? 'grabbing' : 'ew-resize',
        }}
      >
        <img
          src={before}
          alt="Gambar sebelum diproses"
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain"
        />

        <div
          className={`absolute inset-0 ${
            background === 'transparent' ? 'checkerboard' : ''
          }`}
          style={{ clipPath: `inset(0 0 0 ${position}%)`, ...afterStyle }}
        >
          <img
            src={after}
            alt="Gambar setelah diproses"
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>

        <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/80 backdrop-blur">
          {beforeLabel}
        </span>
        <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/80 backdrop-blur">
          {afterLabel}
        </span>

        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/90 shadow-[0_0_18px_rgba(139,92,246,0.9)]"
          style={{ left: `${position}%` }}
        >
          <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/95 text-ink-900 shadow-xl">
            <ChevronLeft size={15} strokeWidth={2.5} />
            <ChevronRight size={15} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  )
}
