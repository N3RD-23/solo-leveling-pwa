// netlify/functions/sheets.js
// Proxy to Google Apps Script to avoid CORS in the browser.

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok:false, error:'POST only' }), {
      status: 405,
      headers: { 'content-type': 'application/json' }
    });
  }

  const GOOGLE_EXEC_URL = process.env.GOOGLE_EXEC_URL; // set this in Netlify env

  if (!GOOGLE_EXEC_URL) {
    return new Response(JSON.stringify({ ok:false, error:'GOOGLE_EXEC_URL not set' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }

  // Keep requests “simple” (urlencoded) so no preflight from the browser.
  const bodyText = await req.text();
  const headers = { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' };

  try {
    const res = await fetch(GOOGLE_EXEC_URL, {
      method: 'POST',
      headers,
      body: bodyText,
      redirect: 'follow'
    });

    const text = await res.text();

    // Try to parse JSON (Apps Script must return JSON from doPost)
    let data;
    try { data = JSON.parse(text); }
    catch {
      return new Response(JSON.stringify({
        ok:false,
        error:'Apps Script returned non-JSON (is your Web App set to "Anyone" and /exec?)'
      }), { status: 502, headers: { 'content-type': 'application/json' }});
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
};
