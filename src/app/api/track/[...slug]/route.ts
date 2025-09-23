import { type NextRequest } from 'next/server'

// Force this route to be treated as dynamic without needing the params argument
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Instead of using `params.slug`, we derive the path from the request URL.
    // This is a more stable approach that avoids the "sync-dynamic-apis" error.
    const slug = request.nextUrl.pathname.replace('/api/track/', '')
    const mixpanelApiHost = 'https://api.mixpanel.com'
    const url = new URL(`${mixpanelApiHost}/${slug}`)
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.append(key, value)
    })

    const body = await request.text()

    console.log(`Proxying Mixpanel request to ${url.toString()}`)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: request.headers,
      body: body,
    })

    const responseText = await response.text()

    if (!response.ok || responseText.trim() === '0') {
      console.error(
        'Mixpanel proxy error',
        JSON.stringify({
          url: url.toString(),
          status: response.status,
          body: responseText,
        })
      )
    }

    return new Response(responseText, {
      status: response.status,
    })
  } catch (error) {
    console.error('Error proxying Mixpanel request:', error)
    return new Response('Error proxying request', { status: 500 })
  }
}
