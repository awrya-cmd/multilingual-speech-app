import sys
import io
import json
import asyncio
import urllib.parse
import requests
import edge_tts

# Handle cross-platform stdio
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

VOICE_MAP = {
    'en': ('en-US-JennyNeural', 'en'),
    'en-US': ('en-US-JennyNeural', 'en'),
    'ru': ('ru-RU-SvetlanaNeural', 'ru'),
    'ru-RU': ('ru-RU-SvetlanaNeural', 'ru'),
    'pt': ('pt-BR-FranciscaNeural', 'pt'),
    'pt-BR': ('pt-BR-FranciscaNeural', 'pt'),
    'es': ('es-ES-ElviraNeural', 'es'),
    'es-ES': ('es-ES-ElviraNeural', 'es'),
    'af': ('af-ZA-AdriNeural', 'af'),
    'af-ZA': ('af-ZA-AdriNeural', 'af'),
    'vi': ('vi-VN-HoaiMyNeural', 'vi'),
    'vi-VN': ('vi-VN-HoaiMyNeural', 'vi'),
    'hi': ('hi-IN-SwaraNeural', 'hi'),
    'hi-IN': ('hi-IN-SwaraNeural', 'hi'),
    'zh': ('zh-CN-XiaoxiaoNeural', 'zh-CN'),
    'cmn-CN': ('zh-CN-XiaoxiaoNeural', 'zh-CN'),
    'ar': ('ar-SA-ZariyahNeural', 'ar'),
    'ar-XA': ('ar-SA-ZariyahNeural', 'ar'),
    'fa': ('fa-IR-DilaraNeural', 'fa'),
    'fa-IR': ('fa-IR-DilaraNeural', 'fa'),
    'am': ('am-ET-MekdesNeural', 'am'),
    'am-ET': ('am-ET-MekdesNeural', 'am'),
    'id': ('id-ID-GadisNeural', 'id'),
    'id-ID': ('id-ID-GadisNeural', 'id'),
    'kk': ('kk-KZ-AigulNeural', 'kk'),
    'kk-KZ': ('kk-KZ-AigulNeural', 'kk'),
    'th': ('th-TH-PremwadeeNeural', 'th'),
    'th-TH': ('th-TH-PremwadeeNeural', 'th'),
    'sw': ('sw-KE-ZuriNeural', 'sw'),
    'sw-KE': ('sw-KE-ZuriNeural', 'sw'),
    'uz': ('uz-UZ-MadinaNeural', 'uz'),
    'uz-UZ': ('uz-UZ-MadinaNeural', 'uz'),
}

def translate_free(text: str, target_lang: str) -> str:
    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": "auto",
            "tl": target_lang,
            "dt": "t",
            "q": text,
        }
        headers = {"User-Agent": "Mozilla/5.0"}
        resp = requests.get(url, params=params, headers=headers, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            translated = "".join([segment[0] for segment in data[0] if segment[0]])
            if translated.strip():
                return translated.strip()
    except Exception as e:
        sys.stderr.write(f"Google RPC error: {str(e)}\n")

    try:
        encoded = urllib.parse.quote(text)
        url = f"https://api.mymemory.translated.net/get?q={encoded}&langpair=autodetect|{target_lang}"
        resp = requests.get(url, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            translated = data.get("responseData", {}).get("translatedText", "")
            if translated and not translated.startswith("MYMEMORY WARNING"):
                return translated.strip()
    except Exception as e:
        sys.stderr.write(f"MyMemory error: {str(e)}\n")

    return text

async def run_pipeline(text: str, voice_code: str):
    voice_info = VOICE_MAP.get(voice_code, ('en-US-JennyNeural', 'en'))
    voice = voice_info[0]
    target_lang = voice_info[1]

    translated_text = translate_free(text, target_lang)

    # Send the translated text metadata via stderr line prefix so stdout stays clean pure binary
    sys.stderr.write(f"META_TRANSLATION:{json.dumps({'translated_text': translated_text}, ensure_ascii=False)}\n")
    sys.stderr.flush()

    communicate = edge_tts.Communicate(translated_text, voice)
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            sys.stdout.buffer.write(chunk["data"])
            sys.stdout.buffer.flush()

if __name__ == "__main__":
    try:
        raw_in = sys.stdin.read()
        payload = json.loads(raw_in)
        text_input = payload.get("text", "").strip()
        voice_code = payload.get("voiceCode", "")

        if not text_input:
            sys.exit(0)

        asyncio.run(run_pipeline(text_input, voice_code))
    except Exception as e:
        sys.stderr.write(f"TTS Error: {str(e)}\n")
        sys.exit(1)