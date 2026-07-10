import CameraAltIcon from '@mui/icons-material/CameraAlt'
import CloseIcon from '@mui/icons-material/Close'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScanVoucherResult } from '@/common/schemas/upload-voucher-schema'

interface VoucherScannerProps {
  onScanComplete: (result: ScanVoucherResult, imageData: string) => void
  onCancel: () => void
}

export function VoucherScanner({ onScanComplete, onCancel }: VoucherScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const startCamera = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      setPreview(null)
    } catch {
      setError('Camera access denied. Upload a photo instead.')
    }
  }

  const captureFrame = (): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return null
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.9)
  }

  const scanImage = async (imageData: string) => {
    setIsScanning(true)
    setError(null)
    try {
      const res = await fetch('/api/scan-voucher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? 'Scan failed. Try again or fill in manually.')
        return
      }
      onScanComplete(json.data ?? {}, imageData)
    } catch {
      setError('Scan failed. Check your connection and try again.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleCapture = async () => {
    const imageData = captureFrame()
    if (!imageData) return
    stopCamera()
    setPreview(imageData)
    await scanImage(imageData)
  }

  const handleFile = async (file: File | null) => {
    if (!file?.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = async () => {
      const imageData = reader.result as string
      setPreview(imageData)
      stopCamera()
      await scanImage(imageData)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentScannerIcon sx={{ fontSize: 22, color: '#ff89ad' }} />
          <h3 className="font-headline text-lg font-bold text-gray-900 dark:text-on-surface">Scan Voucher</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            stopCamera()
            onCancel()
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-all hover:bg-gray-100 active:scale-95 dark:text-on-surface-variant dark:hover:bg-white/10"
          aria-label="Cancel scan"
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-on-surface-variant">
        Point your camera at the voucher or upload a photo — we&apos;ll extract the details for you.
      </p>

      {error && (
        <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error" role="alert">
          {error}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 dark:border-white/10 dark:bg-surface-container-high">
        {preview ? (
          <img src={preview} alt="Scanned voucher" className="mx-auto max-h-72 w-full object-contain" />
        ) : cameraActive ? (
          <video ref={videoRef} className="mx-auto max-h-72 w-full object-cover" playsInline muted />
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CameraAltIcon sx={{ fontSize: 32 }} />
            </div>
            <p className="font-medium text-gray-700 dark:text-on-surface">Use camera or upload a photo</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {!cameraActive && !preview && (
          <button
            type="button"
            onClick={startCamera}
            className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white font-label font-semibold text-gray-800 transition-all active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-on-surface"
          >
            <PhotoCameraIcon sx={{ fontSize: 20 }} />
            Open Camera
          </button>
        )}
        {cameraActive && !isScanning && (
          <button
            type="button"
            onClick={handleCapture}
            className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-br from-primary to-primary-container font-headline font-bold text-on-primary transition-all active:scale-95"
          >
            <DocumentScannerIcon sx={{ fontSize: 20 }} />
            Capture & Scan
          </button>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-50 font-label font-semibold text-gray-800 transition-all active:scale-95 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-on-surface"
        >
          Upload Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {isScanning && (
        <p className="text-center text-sm font-medium text-primary animate-pulse">Reading voucher details…</p>
      )}
    </div>
  )
}
