"""
Open-Meteo API — безкоштовний без токену.
Документація: https://open-meteo.com/en/docs
"""

import aiohttp
import datetime

KYIV_LAT = 50.45
KYIV_LON  = 30.52

# Сезонні fallback значення для Києва (якщо API недоступний)
_TEMP_BY_MONTH  = {1:-3, 2:-2, 3:3, 4:11, 5:18, 6:22, 7:24, 8:23, 9:17, 10:10, 11:4, 12:-1}
_CLOUD_BY_MONTH = {1:70, 2:65, 3:60, 4:55, 5:50, 6:45, 7:40, 8:42, 9:55, 10:65, 11:75, 12:75}
_WIND_BY_MONTH  = {1:6,  2:6,  3:7,  4:6,  5:5,  6:4,  7:4,  8:4,  9:5,  10:6,  11:6,  12:6}


def _fallback_current() -> dict:
    """Сезонні значення якщо API недоступний."""
    month = datetime.datetime.now().month
    return {
        "temperature": _TEMP_BY_MONTH.get(month, 10),
        "cloud_cover": _CLOUD_BY_MONTH.get(month, 50),
        "wind_speed":  _WIND_BY_MONTH.get(month, 5),
        "humidity":    65,
        "pressure":    1013,
        "time":        datetime.datetime.now().strftime("%Y-%m-%dT%H:%M"),
        "source":      "fallback",
    }


async def fetch_current_weather() -> dict:
    """Поточна погода для Києва."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={KYIV_LAT}&longitude={KYIV_LON}"
        f"&current=temperature_2m,cloud_cover,wind_speed_10m,relative_humidity_2m,surface_pressure"
        f"&timezone=Europe/Kyiv"
    )
    try:
        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                data = await resp.json()
                c = data.get("current", {})

                # Якщо API повернув null — використовуємо fallback
                temp = c.get("temperature_2m")
                if temp is None:
                    return _fallback_current()

                return {
                    "temperature": temp,
                    "cloud_cover": c.get("cloud_cover"),
                    "wind_speed":  c.get("wind_speed_10m"),
                    "humidity":    c.get("relative_humidity_2m"),
                    "pressure":    c.get("surface_pressure"),
                    "time":        c.get("time"),
                    "source":      "api",
                }
    except Exception as e:
        print(f"⚠ fetch_current_weather error: {e}")
        return _fallback_current()


async def fetch_forecast_weather(hours: int = 24) -> list[dict]:
    """Прогноз погоди на N годин для Києва."""
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={KYIV_LAT}&longitude={KYIV_LON}"
        f"&hourly=temperature_2m,cloud_cover,wind_speed_10m,relative_humidity_2m"
        f"&forecast_days=8"
        f"&timezone=Europe/Kyiv"
    )
    try:
        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                data = await resp.json()
                h = data.get("hourly", {})
                result = []
                times = h.get("time", [])[:hours]
                for i, t in enumerate(times):
                    result.append({
                        "timestamp":   t,
                        "temperature": h["temperature_2m"][i],
                        "cloud_cover": h["cloud_cover"][i],
                        "wind_speed":  h["wind_speed_10m"][i],
                        "humidity":    h["relative_humidity_2m"][i],
                    })
                return result
    except Exception as e:
        print(f"⚠ fetch_forecast_weather error: {e}")
        # Fallback — генеруємо типовий добовий профіль
        month = datetime.datetime.now().month
        base_temp  = _TEMP_BY_MONTH.get(month, 10)
        base_cloud = _CLOUD_BY_MONTH.get(month, 50)
        base_wind  = _WIND_BY_MONTH.get(month, 5)
        result = []
        now = datetime.datetime.now().replace(minute=0, second=0, microsecond=0)
        for i in range(hours):
            ts = now + datetime.timedelta(hours=i)
            # Добовий цикл температури: вночі холодніше, вдень тепліше
            hour_delta = -2 if 0 <= ts.hour < 6 else (2 if 12 <= ts.hour < 18 else 0)
            result.append({
                "timestamp":   ts.strftime("%Y-%m-%dT%H:%M"),
                "temperature": base_temp + hour_delta,
                "cloud_cover": base_cloud,
                "wind_speed":  base_wind,
                "humidity":    65,
            })
        return result


async def fetch_historical_weather(start_date: str, end_date: str) -> list[dict]:
    """Історична погода з Open-Meteo Archive."""
    url = (
        f"https://archive-api.open-meteo.com/v1/archive"
        f"?latitude={KYIV_LAT}&longitude={KYIV_LON}"
        f"&start_date={start_date}&end_date={end_date}"
        f"&hourly=temperature_2m,cloud_cover,wind_speed_10m"
        f"&timezone=Europe/Kyiv"
    )
    try:
        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                data = await resp.json()
                h = data.get("hourly", {})
                result = []
                for i, t in enumerate(h.get("time", [])):
                    result.append({
                        "timestamp":   t,
                        "temperature": h["temperature_2m"][i],
                        "cloud_cover": h["cloud_cover"][i],
                        "wind_speed":  h["wind_speed_10m"][i],
                    })
                return result
    except Exception as e:
        print(f"⚠ fetch_historical_weather error: {e}")
        return []
