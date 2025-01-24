import { createClient } from 'npm:@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush'
import { encodeBase64Url } from 'jsr:@std/encoding@0.224.0/base64url'
import { corsHeaders } from '../_shared/cors.ts'
import vapidKeysJson from '../_shared/vapid.json' assert { type: 'json' }

// Interfaces
interface Notification {
  id: string
  org_id: string
  body: string
  url: string
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: Notification
  schema: 'public'
}

// Constants
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const vapidKeys = await webpush.importVapidKeys(vapidKeysJson, { extractable: false })
const appServer = await webpush.ApplicationServer.new({
  contactInformation: 'mailto:hichemdahi57@gmail.com',
  vapidKeys
})

// Utility Functions
const setCorsHeaders = () => {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return headers
}

const handleOptionsRequest = () => new Response(null, { status: 204, headers: corsHeaders })

const getPublicVapidKey = async () => {
  const publicKey = encodeBase64Url(await crypto.subtle.exportKey('raw', vapidKeys.publicKey))
  return new Response(JSON.stringify(publicKey), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })
}

const fetchSubscriptions = async (orgId: string) => {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('org_id', orgId)

  if (error) {
    console.error('Error fetching subscriptions:', error)
    throw new Error('Failed to fetch subscriptions')
  }
  return data || []
}

const sendNotification = async (subscription, record) => {
  const subscriber = appServer.subscribe(subscription)

  try {
    await subscriber.pushTextMessage(JSON.stringify(record), {})
  } catch (err) {
    console.error('Error sending notification:', err)
  }
}

// Main Function
Deno.serve(async (req) => {
  const url = new URL(req.url)
  const headers = setCorsHeaders()

  try {
    if (req.method === 'OPTIONS') {
      return handleOptionsRequest()
    }

    if (url.pathname.includes('/api/vapid')) {
      return await getPublicVapidKey()
    }

    const payload: WebhookPayload = await req.json()

    if (!payload || !payload.record || !payload.record.org_id) {
      return new Response('Invalid payload', { status: 400, headers })
    }

    const subscriptions = await fetchSubscriptions(payload.record.org_id)

    if (subscriptions.length === 0) {
      return new Response('No subscriptions found', { status: 404, headers })
    }

    for (const { endpoint, p256dh, auth } of subscriptions) {
      const subscription = { endpoint, keys: { p256dh, auth } }
      try {
        await sendNotification(subscription, payload.record)
      } catch (error) {
        // Log the error and continue with the next subscription
        console.error(
          'Failed to send notification to:',
          subscription.endpoint,
          'Error:',
          error.message
        )
      }
    }

    return new Response('Notification sent', { status: 200, headers })
  } catch (error) {
    console.error('Error processing request:', error.message)
    return new Response('Internal Server Error', { status: 500, headers })
  }
})
