# Multilingual Speech Loop (STT -> Transcript -> TTS Echo)

A full-stack, real-time multilingual speech application built with React, Node.js, and local open-source machine learning models.

The application listens to spoken input across 15 global and low-resource languages, transcribes the speech into the exact native script using `faster-whisper`, displays the formatted transcript (with automatic RTL/LTR script rendering), and echoes the text back in speech using neural voice synthesis (`edge-tts`).

The entire pipeline runs without paid API dependencies or third-party usage limits.

---

## Supported Languages (15)

| Language | ISO Code | Script Direction | Neural Voice |
| --- | --- | --- | --- |
| **Russian** | `ru` | LTR | Svetlana (Neural) |
| **Portuguese** | `pt` | LTR | Francisca (Neural) |
| **Spanish** | `es` | LTR | Elvira (Neural) |
| **Afrikaans** | `af` | LTR | Adri (Neural) |
| **Vietnamese** | `vi` | LTR | HoaiMy (Neural) |
| **Hindi** | `hi` | LTR | Swara (Neural) |
| **Chinese (Mandarin)** | `zh` | LTR | Xiaoxiao (Neural) |
| **Arabic** | `ar` | RTL | Zariyah (Neural) |
| **Persian (Farsi)** | `fa` | RTL | Dilara (Neural) |
| **Amharic** | `am` | LTR | Mekdes (Neural) |
| **Indonesian** | `id` | LTR | Gadis (Neural) |
| **Kazakh** | `kk` | LTR | Aigul (Neural) |
| **Thai** | `th` | LTR | Premwadee (Neural) |
| **Swahili** | `sw` | LTR | Zuri (Neural) |
| **Uzbek** | `uz` | LTR | Madina (Neural) |

---

## Architecture Overview

```text
User Speech (Mic)
      │
      ▼
MediaRecorder (React) ──> Web Audio API Visualizer (Live Waveform)
      │
      ▼ [multipart/form-data]
Express API Proxy (/api/transcribe)
      │
      ▼
FFmpeg Preprocessing (16kHz, Mono WAV Normalization)
      │
      ▼
faster-whisper (CTranslate2 int8 CPU/GPU inference)
      │
      ▼
Native Script Transcript Rendered in React UI
      │
      ▼ [JSON Payload]
Express Synthesis Route (/api/synthesize)
      │
      ▼
edge-tts Python Service (Language-Specific Neural Voice)
      │
      ▼
Audio Playback Buffer Streams back to React Audio Player

```

---

## Project Structure

```text
multilingual-speech-app/
│
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioPlayer.jsx     # Native audio playback
│   │   │   ├── AudioRecorder.jsx   # Stream capture and controls
│   │   │   ├── AudioVisualizer.jsx # Canvas-based real-time voice visualizer
│   │   │   ├── LanguageSelector.jsx# Target language picker
│   │   │   └── TranscriptView.jsx  # Native script viewer (RTL & LTR)
│   │   ├── constants/
│   │   │   └── languages.js        # ISO language configs & voice maps
│   │   ├── App.jsx                 # Pipeline controller
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend Processing Engine
│   ├── venv/                   # Python Virtual Environment
│   ├── uploads/                # Temporary audio chunk processing
│   ├── server.js               # Express API (/transcribe & /synthesize)
│   ├── transcribe.py           # faster-whisper extraction & inference
│   ├── synthesize.py           # edge-tts neural voice generation
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md

```

---

## Prerequisites

* **Node.js** (v18.x or later)
* **Python** (v3.10 to v3.12)
* **FFmpeg** installed and accessible in your system `PATH` (required for audio decoding)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/awrya-cmd/multilingual-speech-app.git
cd multilingual-speech-app

```

### 2. Backend Setup (`server`)

Open a terminal in the `server` directory:

```bash
cd server
npm install

```

Create and activate a Python virtual environment:

* **Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1

```


* **Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate

```



Install the Python dependencies:

```bash
pip install faster-whisper edge-tts "av==12.3.0"

```

Configure your environment file:

```bash
cp .env.example .env

```

Start the backend server:

```bash
npm start

```

The server will start listening at `http://localhost:5000`.

---

### 3. Frontend Setup (`client`)

Open a new terminal tab in the `client` directory:

```bash
cd client
npm install
npm run dev

```

The Vite dev server will start at `http://localhost:5173`.

---

## Usage Guide

1. Open `http://localhost:5173` in your browser (Google Chrome or Microsoft Edge recommended for `MediaRecorder` support).
2. Select your desired language from the dropdown menu (e.g., **Hindi**, **Russian**, **Amharic**).
3. Click **Start Recording** and allow microphone access when prompted.
4. Speak naturally. The visualizer bar will react to your vocal cadence in real time.
5. Click **Stop Recording**.
6. The app will:
* Extract and normalize the audio stream to 16kHz mono.
* Run `faster-whisper` transcription.
* Output the exact transcript in the native writing system.
* Trigger the neural voice model and automatically play back the spoken echo.
