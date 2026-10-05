import sys
import io
import json
import subprocess
import numpy as np
from faster_whisper import WhisperModel

# Ensure UTF-8 output across all platforms
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

LANGUAGE_NAMES = {
    'af': 'Afrikaans', 'am': 'Amharic', 'ar': 'Arabic', 'zh': 'Chinese',
    'en': 'English', 'hi': 'Hindi', 'id': 'Indonesian', 'kk': 'Kazakh',
    'fa': 'Persian', 'pt': 'Portuguese', 'ru': 'Russian', 'es': 'Spanish',
    'sw': 'Swahili', 'th': 'Thai', 'uz': 'Uzbek', 'vi': 'Vietnamese'
}

def decode_audio_in_memory(raw_bytes: bytes) -> np.ndarray:
    """Use FFmpeg to decode incoming stream bytes into 16kHz mono float32 array in RAM."""
    cmd = [
        "ffmpeg", "-y", "-i", "pipe:0",
        "-f", "s16le", "-acodec", "pcm_s16le",
        "-ar", "16000", "-ac", "1",
        "pipe:1"
    ]
    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL
    )
    out_bytes, _ = process.communicate(input=raw_bytes)
    
    if process.returncode != 0:
        raise RuntimeError("FFmpeg in-memory audio decoding failed")

    # Convert PCM s16le bytes to float32 normalized for Whisper (-1.0 to 1.0)
    audio = np.frombuffer(out_bytes, np.int16).flatten().astype(np.float32) / 32768.0
    return audio

def transcribe_stream(chosen_lang: str = None):
    try:
        raw_audio_bytes = sys.stdin.buffer.read()
        if not raw_audio_bytes:
            sys.stderr.write("STT Error: Empty audio stream received\n")
            sys.exit(1)

        audio_array = decode_audio_in_memory(raw_audio_bytes)

        use_auto = (not chosen_lang) or (chosen_lang.strip().lower() in ["auto", "", "null", "undefined"])
        target_lang = None if use_auto else chosen_lang.strip().lower()

        segments, info = whisper_model.transcribe(
            audio_array,
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

if __name__ == "__main__":
    lang_arg = sys.argv[1] if len(sys.argv) > 1 else None
    transcribe_stream(lang_arg)