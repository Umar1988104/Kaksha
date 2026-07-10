// Takes an image source + crop pixel area from react-easy-crop and returns
// a small, compressed base64 JPEG — sized for storing directly in a
// Firestore document field (keeps us on the free plan, no Storage needed).
export function getCroppedImage(imageSrc, cropPixels, outputSize = 300) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = imageSrc
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = outputSize
      canvas.height = outputSize
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, outputSize, outputSize
      )
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    image.onerror = reject
  })
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
