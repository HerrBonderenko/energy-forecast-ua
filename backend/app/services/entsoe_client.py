"""
ENTSO-E Transparency Platform API клієнт.
Документація: https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html

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
    """Чи налаштований ENTSO-E токен."""
    return _get_token() is not None


async def fetch_actual_load(
    start: datetime.datetime,
    end: datetime.datetime,
) -> list[dict]:
    """
    Фактичне споживання для України за період.

    Args:
        start: початок (UTC)
        end: кінець (UTC)

    Returns:
        список [{timestamp, value_mw}] або порожній список якщо токен не налаштований
    """
    token = _get_token()
    if not token:
        return []

    params = {
        "securityToken": token,
        "documentType": "A65",       # Total Load - actual
        "processType": "A16",         # Realised
        "outBiddingZone_Domain": UKRAINE_EIC,
        "periodStart": start.strftime("%Y%m%d%H%M"),
        "periodEnd":   end.strftime("%Y%m%d%H%M"),
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(ENTSOE_URL, params=params, timeout=30) as resp:
            if resp.status != 200:
                return []
            xml_text = await resp.text()

    # Парсинг XML
    results = []
    try:
        root = ET.fromstring(xml_text)
        # Прибираємо namespace
        ns = root.tag.split("}")[0] + "}" if "}" in root.tag else ""

        for ts_node in root.findall(f".//{ns}TimeSeries"):
            for period in ts_node.findall(f".//{ns}Period"):
                start_elem = period.find(f".//{ns}timeInterval/{ns}start")
                if start_elem is None:
                    continue
                ts_start = datetime.datetime.fromisoformat(start_elem.text.replace("Z", "+00:00"))

                for point in period.findall(f".//{ns}Point"):
                    pos = int(point.find(f"{ns}position").text)
                    qty = float(point.find(f"{ns}quantity").text)
                    ts = ts_start + datetime.timedelta(hours=pos - 1)
                    results.append({
                        "timestamp": ts.isoformat(),
                        "value_mw": qty,
                        "value_gw": round(qty / 1000.0, 3),
                    })
    except ET.ParseError:
        return []

    return results
