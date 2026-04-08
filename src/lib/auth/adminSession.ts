const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getAdminSessionSigningSecret() {
  return process.env.ADMIN_SESSION_SIGNING_KEY || process.env.APPWRITE_API_KEY || "";
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export async function createAdminSessionMarker(sessionSecret: string) {
  const signingSecret = getAdminSessionSigningSecret();
  if (!signingSecret || !sessionSecret) return "";

  const key = await importSigningKey(signingSecret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(sessionSecret));
  return toHex(signature);
}

export async function verifyAdminSessionMarker(sessionSecret: string, marker: string) {
  if (!sessionSecret || !marker) return false;
  const expected = await createAdminSessionMarker(sessionSecret);
  return expected.length > 0 && expected === marker;
}
