import { useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Camera, X } from 'lucide-react'
import { fileToDataUrl, getCroppedImage } from '../utils/imageCrop'

export default function PhotoUploader({ value, onChange, size = 84, label }) {
  const fileInputRef = useRef(null)
  const [rawImage, setRawImage] = useState(null) // data URL being cropped
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      alert('Please choose an image under 8MB.')
      return
    }
    const dataUrl = await fileToDataUrl(file)
    setRawImage(dataUrl)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    e.target.value = ''
  }

  async function handleSaveCrop() {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const result = await getCroppedImage(rawImage, croppedAreaPixels)
      onChange(result)
      setRawImage(null)
    } catch (err) {
      alert('Could not process that image — try a different photo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="photo-uploader">
      <div className="photo-uploader__circle" style={{ width: size, height: size }} onClick={() => fileInputRef.current?.click()}>
        {value ? (
          <img src={value} alt="" style={{ width: size, height: size }} />
        ) : (
          <Camera size={size * 0.32} color="#8891A0" />
        )}
        <div className="photo-uploader__badge"><Camera size={12} /></div>
      </div>
      {label && <div className="photo-uploader__label">{label}</div>}
      {value && (
        <button type="button" className="photo-uploader__remove" onClick={() => onChange(null)}>Remove photo</button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

      {rawImage && (
        <div className="modal-overlay" onClick={() => setRawImage(null)}>
          <div className="modal crop-modal" onClick={(e) => e.stopPropagation()}>
            <button className="sheet__close" onClick={() => setRawImage(null)}><X size={18} /></button>
            <h2>Adjust photo</h2>
            <div className="crop-modal__area">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="crop-modal__zoom"
            />
            <div className="modal-form__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setRawImage(null)}>Cancel</button>
              <button type="button" className="btn btn--primary" onClick={handleSaveCrop} disabled={saving}>
                {saving ? 'Saving…' : 'Use this photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
