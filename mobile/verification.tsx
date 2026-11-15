
const SUPABASE_URL =
  "https://wnjxfwqvxwxnksbyvvug.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_weQHFJ5OcI1YB0Xc04ubsg_F_8AMzoS";

export type VerificationPayload = {
  serial_number: string;
  qr_token: string;
  barcode: string;
  latitude: number;
  longitude: number;
  town?: string;
  region?: string;
  country?: string;
  scan_place?: string;
};

export async function verifyBottle(
  payload: VerificationPayload
) {
  if (
    !Number.isFinite(payload.latitude) ||
    !Number.isFinite(payload.longitude)
  ) {
    throw new Error(
      "Valid GPS coordinates are required for verification."
    );
  }

  if (
    !payload.serial_number?.trim() ||
    !payload.qr_token?.trim()
  ) {
    throw new Error(
      "The serial number and QR verification credential are required."
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${SUPABASE_URL}/functions/v1/rapid-service`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );
  } catch {
    throw new Error(
      "Unable to connect to the verification server. Check your internet connection and try again."
    );
  }

  const responseText = await response.text();

  let data: any = {};

  try {
    data = responseText
      ? JSON.parse(responseText)
      : {};
  } catch {
    data = {
      message:
        responseText ||
        "The server returned an invalid response.",
    };
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Verification failed (HTTP ${response.status}).`
    );
  }

  if (!data || typeof data !== "object") {
    throw new Error(
      "The verification server returned an unexpected response."
    );
  }

  return data;
}
