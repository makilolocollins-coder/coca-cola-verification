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
const response = await fetch(
"${SUPABASE_URL}/functions/v1/rapid-service",
{
method: "POST",
headers: {
"Content-Type": "application/json",
apikey: SUPABASE_KEY,
Authorization: "Bearer ${SUPABASE_KEY}",
},
body: JSON.stringify(payload),
}
);

const responseText = await response.text();

let data: any;

try {
data = responseText ? JSON.parse(responseText) : {};
} catch {
data = { message: responseText || "The server returned an empty response." };
}

if (!response.ok) {
throw new Error(
data?.error ||
data?.message ||
"Verification request failed (HTTP ${response.status})."
);
}

return data;
}
