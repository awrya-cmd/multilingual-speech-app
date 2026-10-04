import sys
import asyncio
import edge_tts

VOICE_MAP = {
    'ru-RU': 'ru-RU-SvetlanaNeural',
    'pt-BR': 'pt-BR-FranciscaNeural',
    'es-ES': 'es-ES-ElviraNeural',
    'af-ZA': 'af-ZA-AdriNeural',
    'vi-VN': 'vi-VN-HoaiMyNeural',
    'hi-IN': 'hi-IN-SwaraNeural',
    'cmn-CN': 'zh-CN-XiaoxiaoNeural',
    'ar-XA': 'ar-SA-ZariyahNeural',
    'fa-IR': 'fa-IR-DilaraNeural',
    'am-ET': 'am-ET-MekdesNeural',
    'id-ID': 'id-ID-GadisNeural',
    'kk-KZ': 'kk-KZ-AigulNeural',
    'th-TH': 'th-TH-PremwadeeNeural',
    'sw-KE': 'sw-KE-ZuriNeural',
    'uz-UZ': 'uz-UZ-MadinaNeural',
}

async def generate_speech(text, voice_code, output_path):
    voice = VOICE_MAP.get(voice_code, 'en-US-JennyNeural')
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(1)

    text_input = sys.argv[1]
    voice_code = sys.argv[2]
    out_file = sys.argv[3]
    asyncio.run(generate_speech(text_input, voice_code, out_file))