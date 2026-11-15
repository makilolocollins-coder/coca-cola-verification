
const SUPABASE_URL =
  "https://wnjxfwqvxwxnksbyvvug.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_weQHFJ5OcI1YB0Xc04ubsg_F_8AMzoS";

export type VerificationPayload = {
  qr_token: string;
  barcode: string;
  latitude: number;
  longitude: number;
};

export type VerificationResponse = {
  verification: string;
  identifiers_match?: boolean;
  product?: {
    brand?: string;
    product_name?: string;
    packaging?: string;
    batch_number?: string;
    serial_number?: string;
  };
  previous_scans_24h?: number;
  risk_score?: number;
  risk_level?: string;
  risk_reasons?: string[];
  location_recorded?: boolean;
  latitude?: number;
  longitude?: number;
  note?: string;
  error?: string;
};

export async function verifyBottle(
  payload: VerificationPayload
): Promise<VerificationResponse> {
  if (!payload.qr_token?.trim()) {
    throw new Error("Please scan the bottle QR code.");
  }

  if (!payload.barcode?.trim()) {
    throw new Error("Please scan the product barcode.");
  }

  if (
    !Number.isFinite(payload.latitude) ||
    !Number.isFinite(payload.longitude)
  ) {
    throw new Error("A valid GPS location is required.");
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/rapid-service`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
          qr_token: payload.qr_token.trim(),
          barcode: payload.barcode.trim(),
          latitude: payload.latitude,
          longitude: payload.longitude,
        }),
      }
    );

    const responseText = await response.text();

    let result: VerificationResponse;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        "The verification server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        result.error ||
          `Verification failed (HTTP ${response.status}).`
      );
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("Network request failed") ||
        error.message.includes("fetch")
      ) {
        throw new Error(
          "Unable to connect to VERITY. Check your internet connection."
        );
      }

      throw error;
    }

    throw new Error(
      "An unexpected verification error occurred."
    );
  }
}
