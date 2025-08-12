export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'POST only' }), {
      status: 405,
      headers: { 'content-type': 'application/json' }
    });
  }

  const GOOGLE_EXEC_URL = process.env.GOOGLE_EXEC_URL;
  if (!GOOGLE_EXEC_URL) {
    return new Response(JSON.stringify({ ok: false, error: 'GOOGLE_EXEC_URL not set' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  try {
    const bodyText = await req.text();

    // Follow redirects explicitly (Google returns 302 → script.googleusercontent.com)
    const res = await fetch(GOOGLE_EXEC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: bodyText,
      redirect: 'follow' // THIS is the important part
    });

    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'Upstream returned non-JSON',
        snippet: text.slice(0, 300) // show start of HTML if it’s HTML
      }), {
        status: 502,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
