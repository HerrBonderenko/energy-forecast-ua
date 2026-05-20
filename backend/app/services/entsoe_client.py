"""
ENTSO-E Transparency Platform API клієнт.
Україна EIC: 10Y1001C--00003F (UA_IPS)
"""

import os
import aiohttp
import datetime
import xml.etree.ElementTree as ET

ENTSOE_URL = "https://web-api.tp.entsoe.eu/api"
UKRAINE_EIC = "10Y1001C--00003F"


def _get_token() -> str | None:
    token = os.getenv("ENTSOE_TOKEN", "").strip()
    if not token or token == "YOUR_TOKEN_HERE":
        return None
    return token


def is_configured() -> bool:
    return _get_token() is not None


def _parse_xml(xml_text: str) -> list[dict]:
    """Парсинг XML відповіді ENTSO-E."""
    results = []
    try:
        root = ET.fromstring(xml_text)
        ns = root.tag.split("}")[0] + "}" if "}" in root.tag else ""

        for ts_node in root.findall(f".//{ns}TimeSeries"):
            for period in ts_node.findall(f".//{ns}Period"):
                start_elem = period.find(f".//{ns}timeInterval/{ns}start")
                if start_elem is None:
                    continue
                ts_start = datetime.datetime.fromisoformat(
                    start_elem.text.replace("Z", "+00:00")
                )
                for point in period.findall(f".//{ns}Point"):
                    pos_elem = point.find(f"{ns}position")
                    qty_elem = point.find(f"{ns}quantity")
                    if pos_elem is None or qty_elem is None:
                        continue
                    pos = int(pos_elem.text)
                    qty = float(qty_elem.text)
                    ts = ts_start + datetime.timedelta(hours=pos - 1)
                    results.append({
                        "timestamp": ts.isoformat(),
                        "value_mw": qty,
                        "value_gw": round(qty / 1000.0, 3),
                    })
    except ET.ParseError:
        pass
    return results


async def fetch_actual_load(
    start: datetime.datetime,
    end: datetime.datetime,
) -> list[dict]:
    """Фактичне споживання для України за період."""
    token = _get_token()
    if not token:
        return []

    params = {
        "securityToken": token,
        "documentType": "A65",
        "processType": "A16",
        "outBiddingZone_Domain": UKRAINE_EIC,
        "periodStart": start.strftime("%Y%m%d%H%M"),
        "periodEnd":   end.strftime("%Y%m%d%H%M"),
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                ENTSOE_URL, params=params,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as resp:
                if resp.status != 200:
                    return []
                xml_text = await resp.text()
        return _parse_xml(xml_text)
    except Exception:
        return []


async def fetch_base_load_curve() -> list[float] | None:
    """
    Отримати середній добовий профіль навантаження за останні 7 днів.
    Повертає список з 24 значень (ГВт) або None якщо недоступно.
    """
    now = datetime.datetime.utcnow().replace(
        minute=0, second=0, microsecond=0
    )
    # Беремо останні 7 днів
    end = now
    start = now - datetime.timedelta(days=7)

    data = await fetch_actual_load(start, end)
    if not data:
        return None

    # Рахуємо середнє по кожній годині доби
    hourly_sums = [0.0] * 24
    hourly_counts = [0] * 24

    for point in data:
        ts = datetime.datetime.fromisoformat(
            point["timestamp"].replace("Z", "+00:00")
        )
        h = ts.hour
        hourly_sums[h] += point["value_gw"]
        hourly_counts[h] += 1

    curve = []
    for h in range(24):
        if hourly_counts[h] > 0:
            curve.append(round(hourly_sums[h] / hourly_counts[h], 3))
        else:
            curve.append(None)

    # Якщо є пропуски — заповнюємо інтерполяцією
    for i in range(24):
        if curve[i] is None:
            prev = curve[(i - 1) % 24]
            next_ = curve[(i + 1) % 24]
            if prev and next_:
                curve[i] = round((prev + next_) / 2, 3)
            elif prev:
                curve[i] = prev
            else:
                curve[i] = 13.0  # fallback

    return curve
