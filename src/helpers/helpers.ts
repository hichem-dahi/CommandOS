export const formatPrice = (str?: string | number | null) => {
  if (!str) return
  const st1: string | number = str.toString().replace(/\s+/g, '')
  const st2: string | number = new Number(st1).toLocaleString('fr-Fr')
  return st2
}

export async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

export const urlBase64ToUint8Array = (base64String: string) => {
  // Add padding if necessary to make it a valid Base64 string
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  // Decode the base64 string into raw binary data using Buffer (if you're in Node.js) or atob (in the browser)
  const rawData = Buffer.from(base64, 'base64') // If you're in a Node.js environment

  // If you're in the browser, use atob to decode the base64 string:
  // const rawData = atob(base64)

  const outputArray = new Uint8Array(rawData.length)

  // Populate the Uint8Array with the decoded raw data
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData[i]
  }

  return outputArray
}
