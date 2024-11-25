// Fetch VAPID public key
export async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/push/api/vapid`)
    if (!response.ok) {
      console.error('Failed to fetch VAPID public key:', response.statusText)
      return null
    }
    return response.json()
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching VAPID public key:', error.message)
    } else {
      console.error('An unknown error occurred:', error)
    }
    return null
  }
}
