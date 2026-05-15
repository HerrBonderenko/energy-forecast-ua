"""
Open-Meteo API — безкоштовний без токену.
Документація: https://open-meteo.com/en/docs
"""

import aiohttp
import datetime

# Київ — приблизний центр України
KYIV_LAT = 50.45
KYIV_LON = 30.52


async def fetch_current_weather() -> dict:
    """Поточна погода для Києва."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={KYIV_LAT}&longitude={KYIV_LON}"
        f"&current=temperature_2m,cloud_cover,wind_speed_10m,relative_humidity_2m,surface_pressure"
        f"&timezone=Europe/Kyiv"
    )
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=10) as resp:
            data = await resp.json()
            c = data.get("current", {})
            return {
                "temperature": c.get("temperature_2m"),
                "cloud_cover": c.get("cloud_cover"),
                "wind_speed": c.get("wind_speed_10m"),
                "humidity": c.get("relative_humidity_2m"),
                "pressure": c.get("surface_pressure"),
                "time": c.get("time"),
            }


async def fetch_forecast_weather(hours: int = 24) -> list[dict]:
    """Прогноз погоди на N годин для Києва."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={KYIV_LAT}&longitude={KYIV_LON}"
        f"&hourly=temperature_2m,cloud_cover,wind_speed_10m,relative_humidity_2m"
        f"&forecast_days=8"
        f"&timezone=Europe/Kyiv"
    )
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=10) as resp:
            data = await resp.json()
            h = data.get("hourly", {})
            result = []
            times = h.get("time", [])[:hours]
            for i, t in enumerate(times):
                result.append({
                    "timestamp": t,
                    "temperature": h["temperature_2m"][i],
                    "cloud_cover": h["cloud_cover"][i],
                    "wind_speed": h["wind_speed_10m"][i],
                    "humidity": h["relative_humidity_2m"][i],
                })
            return result


async def fetch_historical_weather(
    start_date: str,
    end_date: str,
) -> list[dict]:
    """Історична погода з Open-Meteo Archive."""
    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={KYIV_LAT}&longitude={KYIV_LON}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&hourly=temperature_2m,cloud_cover,wind_speed_10m"
        f"&timezone=Europe/Kyiv"
    )
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=30) as resp:
            data = await resp.json()
            h = data.get("hourly", {})
            result = []
            for i, t in enumerate(h.get("time", [])):
                result.append({
                    "timestamp": t,
                    "temperature": h["temperature_2m"][i],
                    "cloud_cover": h["cloud_cover"][i],
                    "wind_speed": h["wind_speed_10m"][i],
                })
            return result
