// Fetch VAPID public key
export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push/api/vapid`)
    if (!response.ok) {
      console.error('Failed to fetch VAPID public key:', response.statusText)
      return null
    }
    return response.json()
  } catch (error) {
    console.error('Error fetching VAPID public key:', error.message)
    return null
  }
}
