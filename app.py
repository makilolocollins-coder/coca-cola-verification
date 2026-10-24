
import streamlit as st
import requests
import pandas as pd
import cv2
import numpy as np

st.set_page_config(page_title="Coca-Cola Verification", page_icon="🥤", layout="wide")

BASE = "https://wnjxfwqvxwxnksbyvvug.supabase.co"
VERIFY_URL = f"{BASE}/functions/v1/rapid-service"
LOOKUP_URL = f"{BASE}/functions/v1/smart-action"
PUBLIC_KEY = "sb_publishable_weQHFJ5OcI1YB0Xc04ubsg_F_8AMzoS"

def get_secret(key, default=""):
    try:
        return st.secrets.get(key, default)
    except Exception:
        return default

def api_headers():
    return {
        "apikey": PUBLIC_KEY,
        "Authorization": f"Bearer {PUBLIC_KEY}",
        "Content-Type": "application/json",
    }

def read_response(response):
    try:
        data = response.json()
    except Exception:
        data = {"message": response.text[:400]}
    if not response.ok:
        raise RuntimeError(
            f"HTTP {response.status}: "
            f"{data.get('error') or data.get('message') or data}"
        )
    return data

def decode_qr(upload):
    if not upload:
        return ""
    raw = np.frombuffer(upload.getvalue(), dtype=np.uint8)
    image = cv2.imdecode(raw, cv2.IMREAD_COLOR)
    if image is None:
        return ""
    detector = cv2.QRCodeDetector()
    value, points, _ = detector.detectAndDecode(image)
    return value.strip()

st.markdown("""
<style>
.stApp {background-color:#f5f6f8}
h1,h2,h3 {color:#b5121b}
</style>
""", unsafe_allow_html=True)

st.title("🥤 Coca-Cola Product Verification")
st.caption("Check registered identifiers, product catalogue information, and scan risk indicators.")

verify_tab, lookup_tab, admin_tab = st.tabs([
    "🔎 Verify bottle", "📦 Product lookup", "📊 Admin dashboard"
])

with verify_tab:
    st.subheader("Bottle verification")

    image = st.file_uploader(
        "Upload QR-code image",
        type=["png", "jpg", "jpeg", "webp"],
        key="qr_image"
    )

    decoded = ""
    if image:
        try:
            decoded = decode_qr(image)
            if decoded:
                st.success("QR code decoded. Check the token below.")
            else:
                st.warning("QR not detected. Try a clearer image.")
        except Exception as exc:
            st.error(f"Image reading failed: {exc}")

    qr_token = st.text_input(
        "QR token",
        value=decoded,
        key="token"
    )
    serial = st.text_input(
        "Bottle serial number",
        placeholder="e.g. CC-DEMO-00000042"
    )
    barcode = st.text_input(
        "Barcode digits",
        placeholder="Enter the barcode printed on the bottle"
    )

    st.markdown("**Optional scan location**")
    town = st.text_input("Town / locality")
    region = st.text_input("State / region")
    country = st.text_input("Country", value="Nigeria")
    col1, col2 = st.columns(2)
    latitude = col1.text_input("Latitude (optional)")
    longitude = col2.text_input("Longitude (optional)")

    st.caption(
        "If QR decoding fails, enter the QR token manually. "
        "This form does not automatically capture GPS coordinates."
    )

    if st.button("Verify bottle", type="primary", use_container_width=True):
        if not serial.strip() or not qr_token.strip() or not barcode.strip():
            st.error("Enter the serial number, QR token, and barcode.")
        else:
            payload = {
                "serial_number": serial.strip(),
                "qr_token": qr_token.strip(),
                "barcode": barcode.strip(),
                "town": town.strip(),
                "region": region.strip(),
                "country": country.strip(),
                "scan_place": ", ".join(
                    x.strip() for x in [town, region, country] if x.strip()
                ),
            }
            try:
                if latitude.strip():
                    payload["latitude"] = float(latitude)
                if longitude.strip():
                    payload["longitude"] = float(longitude)

                with st.spinner("Verifying identifiers..."):
                    response = requests.post(
                        VERIFY_URL,
                        headers=api_headers(),
                        json=payload,
                        timeout=30
                    )
                    result = read_response(response)

                st.session_state["last_result"] = result

                if (
                    str(result.get("verification", "")).upper() == "REGISTERED"
                    and result.get("identifiers_match") is True
                ):
                    st.success("Identifiers matched a registered record.")
                else:
                    st.warning("The response did not confirm a registered match.")

                st.json(result)
                st.caption(
                    "A registry match does not independently prove that "
                    "the physical bottle is genuine."
                )
            except Exception as exc:
                st.error(f"Verification failed: {exc}")

with lookup_tab:
    st.subheader("Product catalogue lookup")
    lookup_barcode = st.text_input(
        "Barcode",
        placeholder="Enter 8–14 digits",
        key="lookup_barcode"
    )

    if st.button("Find product details", use_container_width=True):
        digits = "".join(c for c in lookup_barcode if c.isdigit())

        if not 8 <= len(digits) <= 14:
            st.error("Enter a barcode containing 8–14 digits.")
        else:
            try:
                with st.spinner("Searching product catalogue..."):
                    response = requests.post(
                        LOOKUP_URL,
                        headers=api_headers(),
                        json={"barcode": digits},
                        timeout=30
                    )
                    product = read_response(response)

                if not product.get("found"):
                    st.warning(
                        product.get("message", "No catalogue match found.")
                    )
                else:
                    st.subheader(product.get("name", "Product found"))
                    if product.get("image"):
                        st.image(product["image"], width=180)
                    st.json(product)
                    st.caption(
                        "Catalogue information is not proof of authenticity."
                    )
            except Exception as exc:
                st.error(f"Product lookup failed: {exc}")

with admin_tab:
    st.subheader("Admin dashboard")
    st.caption("Scan history and risk monitoring.")

    admin_key = get_secret("SUPABASE_SERVICE_ROLE_KEY", "")

    if not admin_key:
        st.info(
            "The admin dashboard is locked. Configure "
            "SUPABASE_SERVICE_ROLE_KEY in Streamlit Secrets. "
            "Bottle verification and product lookup remain available."
        )
    else:
        limit = st.selectbox(
            "Recent scan records to load",
            [100, 500, 1000, 5000],
            index=1
        )

        if st.button("Load scan history", type="primary"):
            try:
                response = requests.get(
                    f"{BASE}/rest/v1/bottle_scans",
                    headers={
                        "apikey": admin_key,
                        "Authorization": f"Bearer {admin_key}",
                    },
                    params={
                        "select": "*",
                        "order": "scanned_at.desc",
                        "limit": limit,
                    },
                    timeout=30
                )
                rows = read_response(response)
                st.session_state["scan_rows"] = rows
            except Exception as exc:
                st.error(f"Could not load scans: {exc}")

        rows = st.session_state.get("scan_rows")

        if rows is not None:
            df = pd.DataFrame(rows)

            if df.empty:
                st.info("No scan records were returned.")
            else:
                results = (
                    df.get("scan_result", pd.Series(dtype=str))
                    .fillna("").astype(str).str.upper()
                )
                risk_flags = results.str.contains(
                    r"SUSPICIOUS|COUNTERFEIT|RISK|DUPLICATE|UNREGISTERED",
                    regex=True
                ).sum()
                matches = results.str.contains(
                    r"REGISTERED|MATCH", regex=True
                ).sum()

                a, b, c = st.columns(3)
                a.metric("Records loaded", len(df))
                b.metric("Potential risk flags", int(risk_flags))
                c.metric("Registered/matched labels", int(matches))

                if "scanned_at" in df:
                    times = pd.to_datetime(
                        df["scanned_at"], errors="coerce", utc=True
                    )
                    last_day = (
                        times >=
                        pd.Timestamp.now(tz="UTC") - pd.Timedelta(hours=24)
                    ).sum()
                    st.metric(
                        "Scans in last 24 hours",
                        int(last_day),
                        help="Count within the records loaded above."
                    )

                    daily = pd.DataFrame({
                        "day": times.dt.strftime("%Y-%m-%d")
                    }).dropna().groupby("day").size()
                    if not daily.empty:
                        st.subheader("Scans by day")
                        st.bar_chart(daily)

                st.subheader("Recent scan records")
                st.dataframe(df, use_container_width=True, hide_index=True)
                st.download_button(
                    "Download scan history CSV",
                    df.to_csv(index=False).encode("utf-8"),
                    "bottle_scans.csv",
                    "text/csv"
                )

                st.caption(
                    "Risk flags are based on the stored scan_result text. "
                    "They are not a definitive counterfeit classifier."
                )
