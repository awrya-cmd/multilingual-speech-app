import sys
import os
import io
import subprocess
from faster_whisper import WhisperModel

# Ensure UTF-8 stream handling for Windows console/PowerShell
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Same initialization as your reference code
whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

def extract_audio(input_path: str, output_wav_path: str):
    """Replicates extract_audio_from_video from your reference code."""
    command = [
        "ffmpeg", "-y", "-i", input_path,
        "-vn", "-ar", "16000", "-ac", "1",
        output_wav_path
    ]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def transcribe(input_audio_path: str, language: str):
    temp_audio_path = input_audio_path.rsplit(".", 1)[0] + "_audio.wav"

    try:
        extract_audio(input_audio_path, temp_audio_path)

        # Transcribe using exact parameters from your reference code
        segments, info = whisper_model.transcribe(
            temp_audio_path,
            language=language if language else None,
            task="transcribe",
            beam_size=3,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
            word_timestamps=True
        )

        transcript_list = []
        for seg in segments:
            transcript_list.append(seg.text)

        transcript = " ".join(transcript_list).strip()
        print(transcript)

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
    lang = sys.argv[2] if len(sys.argv) > 2 else None
    transcribe(audio_file, lang)