const pipelines = new Map()

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

function report(id, stage, percent, message) {
  self.postMessage({
    id,
    type: 'progress',
    stage,
    percent: clamp(Math.round(percent), 0, 100),
    message,
  })
}

async function removeBg(id, { buffer, mime, useGpu }) {
  const { removeBackground } = await import('@imgly/background-removal')

  const blob = new Blob([buffer], { type: mime })

  const config = {
    device: useGpu ? 'gpu' : 'cpu',
    model: useGpu ? 'isnet_fp16' : 'isnet_quint8',
    output: { format: 'image/png' },
    progress: (key, current, total) => {
      if (key.startsWith('fetch:')) {
        const pct = total ? (current / total) * 62 : 0
        report(id, 'download', pct, `Mengunduh AI Engine... ${Math.round(pct)}%`)
      } else if (key === 'compute:decode') {
        report(id, 'inference', 68, 'Membaca gambar...')
      } else if (key === 'compute:inference') {
        report(id, 'inference', 78, 'AI mendeteksi subjek utama...')
      } else if (key === 'compute:mask') {
        report(id, 'inference', 90, 'Merapikan tepi objek...')
      } else if (key === 'compute:encode') {
        report(id, 'encode', 96, 'Menyiapkan hasil...')
      }
    },
  }

  report(id, 'prepare', 1, 'Menyiapkan AI Engine...')
  const outBlob = await removeBackground(blob, config)

  const bitmap = await createImageBitmap(outBlob)
  report(id, 'done', 100, 'Selesai!')

  return {
    blob: outBlob,
    width: bitmap.width,
    height: bitmap.height,
  }
}

function getPipeline(scale, id) {
  if (pipelines.has(scale)) return pipelines.get(scale)

  const promise = (async () => {
    const { pipeline } = await import('@huggingface/transformers')
    const model =
      scale === 4
        ? 'Xenova/swin2SR-compressed-sr-x4-48'
        : 'Xenova/swin2SR-lightweight-x2-64'

    report(id, 'download', 2, 'Menyiapkan model upscaler...')

    const pipe = await pipeline('image-to-image', model, {
      dtype: 'q8',
      device: 'wasm',
      progress_callback: (info) => {
        if (info.status === 'progress' && info.total) {
          const pct = 5 + (info.loaded / info.total) * 45
          report(id, 'download', pct, `Mengunduh model AI... ${Math.round(pct)}%`)
        }
      },
    })

    return pipe
  })()

  pipelines.set(scale, promise)
  promise.catch(() => pipelines.delete(scale))
  return promise
}

async function resizeIfNeeded(RawImage, src, cap) {
  const longest = Math.max(src.width, src.height)
  if (longest <= cap) return { src, resized: false }

  const ratio = cap / longest
  const width = Math.max(1, Math.round(src.width * ratio))
  const height = Math.max(1, Math.round(src.height * ratio))

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src.toCanvas(), 0, 0, src.width, src.height, 0, 0, width, height)

  return { src: RawImage.fromCanvas(canvas), resized: true }
}

async function upscale(id, { buffer, mime, scale }) {
  const { RawImage } = await import('@huggingface/transformers')

  report(id, 'prepare', 1, 'Membaca gambar...')
  const blob = new Blob([buffer], { type: mime })
  let src = await RawImage.fromBlob(blob)

  const cap = scale === 4 ? 768 : 1280
  const resizedResult = await resizeIfNeeded(RawImage, src, cap)
  src = resizedResult.src

  const upscaler = await getPipeline(scale, id)
  report(id, 'inference', 52, 'AI merekonstruksi detail piksel...')

  const tileSize = scale === 4 ? 384 : 512
  const overlap = 24
  const tilesX = Math.ceil(src.width / tileSize)
  const tilesY = Math.ceil(src.height / tileSize)
  const totalTiles = tilesX * tilesY

  let outBlob

  if (totalTiles === 1) {
    const output = await upscaler(src)
    report(id, 'encode', 96, 'Menyiapkan hasil...')
    outBlob = await output.toBlob('image/png')
  } else {
    const srcCanvas = src.toCanvas()
    const outCanvas = new OffscreenCanvas(src.width * scale, src.height * scale)
    const ctx = outCanvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    let done = 0
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const sx = tx * tileSize
        const sy = ty * tileSize
        const tw = Math.min(tileSize, src.width - sx)
        const th = Math.min(tileSize, src.height - sy)

        const marginLeft = Math.min(overlap, sx)
        const marginTop = Math.min(overlap, sy)
        const marginRight = Math.min(overlap, src.width - (sx + tw))
        const marginBottom = Math.min(overlap, src.height - (sy + th))

        const rx = sx - marginLeft
        const ry = sy - marginTop
        const rw = tw + marginLeft + marginRight
        const rh = th + marginTop + marginBottom

        const tileCanvas = new OffscreenCanvas(rw, rh)
        const tileCtx = tileCanvas.getContext('2d')
        tileCtx.drawImage(srcCanvas, rx, ry, rw, rh, 0, 0, rw, rh)

        const tileImage = RawImage.fromCanvas(tileCanvas)
        const tileOut = await upscaler(tileImage)
        const tileOutCanvas = tileOut.toCanvas()

        const cropX = marginLeft * scale
        const cropY = marginTop * scale
        const cropW = tw * scale
        const cropH = th * scale

        ctx.drawImage(
          tileOutCanvas,
          cropX,
          cropY,
          cropW,
          cropH,
          sx * scale,
          sy * scale,
          cropW,
          cropH,
        )

        done++
        const pct = 52 + (done / totalTiles) * 44
        report(
          id,
          'inference',
          pct,
          `Memproses detail ${done}/${totalTiles}...`,
        )
      }
    }

    report(id, 'encode', 97, 'Menyiapkan hasil...')
    outBlob = await outCanvas.convertToBlob({ type: 'image/png' })
  }

  const bitmap = await createImageBitmap(outBlob)
  report(id, 'done', 100, 'Selesai!')

  return {
    blob: outBlob,
    width: bitmap.width,
    height: bitmap.height,
    resized: resizedResult.resized,
    inputWidth: src.width,
    inputHeight: src.height,
  }
}

self.onmessage = async (event) => {
  const { id, action, payload } = event.data
  if (!id) return

  try {
    let result
    if (action === 'remove-bg') {
      result = await removeBg(id, payload)
    } else if (action === 'upscale') {
      result = await upscale(id, payload)
    } else {
      throw new Error(`Aksi tidak dikenal: ${action}`)
    }
    self.postMessage({ id, type: 'result', ...result })
  } catch (error) {
    console.error('[AI Worker]', error)
    self.postMessage({
      id,
      type: 'error',
      message:
        error?.message ||
        'Terjadi kesalahan saat memproses gambar. Coba gambar lain atau muat ulang halaman.',
    })
  }
}
