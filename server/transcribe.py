import sys
import os
import io
import json
import subprocess
from faster_whisper import WhisperModel

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

LANGUAGE_NAMES = {
    'af': 'Afrikaans', 'am': 'Amharic', 'ar': 'Arabic', 'zh': 'Chinese',
    'en': 'English', 'hi': 'Hindi', 'id': 'Indonesian', 'kk': 'Kazakh',
    'fa': 'Persian', 'pt': 'Portuguese', 'ru': 'Russian', 'es': 'Spanish',
    'sw': 'Swahili', 'th': 'Thai', 'uz': 'Uzbek', 'vi': 'Vietnamese'
}

def extract_audio(input_path: str, output_wav_path: str):
    command = [
        "ffmpeg", "-y", "-i", input_path,
        "-vn", "-ar", "16000", "-ac", "1",
        output_wav_path
    ]
    # stdin/stdout/stderr mapped safely for all platforms
    subprocess.run(
        command,
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.DEVNULL
    )

def transcribe(input_audio_path: str, chosen_lang: str = None):
    temp_audio_path = input_audio_path.rsplit(".", 1)[0] + "_audio.wav"

    try:
        extract_audio(input_audio_path, temp_audio_path)

        use_auto = (not chosen_lang) or (chosen_lang.strip().lower() in ["auto", "", "null", "undefined"])
        target_lang = None if use_auto else chosen_lang.strip().lower()

        segments, info = whisper_model.transcribe(
            temp_audio_path,
            language=target_lang,
            task="transcribe",
            beam_size=3,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            word_timestamps=True
        )

        transcript_list = [seg.text for seg in segments]
        full_transcript = " ".join(transcript_list).strip()

        detected_code = info.language if use_auto else target_lang
        full_name = LANGUAGE_NAMES.get(detected_code, detected_code.upper() if detected_code else "Unknown")

        result = {
            "detected_code": detected_code,
            "detected_language": full_name,
            "language_probability": round(info.language_probability, 2) if hasattr(info, 'language_probability') else 1.0,
            "is_auto": use_auto,
            "transcript": full_transcript
        }
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        sys.stderr.write(f"STT Error: {str(e)}\n")
        sys.exit(1)
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    audio_file = sys.argv[1]
    lang_arg = sys.argv[2] if len(sys.argv) > 2 else None
    transcribe(audio_file, lang_arg)