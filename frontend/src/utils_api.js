export async function computeRoute(payload) {
  const r = await fetch('/api/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error('Server error: ' + text);
  }
  return await r.json();
}
