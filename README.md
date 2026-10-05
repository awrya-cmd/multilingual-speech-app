# Multilingual Speech Translation Loop

A 100% free, end-to-end speech-to-speech translation loop built with React (Vite), Node.js Express, `faster-whisper`, and `edge-tts`.

---

## Features

- **Local Speech-to-Text**: Transcribes audio locally on CPU using `faster-whisper` (zero API keys).
- **Flexible Language Control**: Choose auto-detection or enforce a specific input language.
- **Searchable Language Selection**: Dual dropdowns with inline search, alphabetically organized.
- **Editable Transcript**: Modify text directly; speech auto-regenerates with an intelligent debounce pause.
- **Neural Voice Output**: Reads the translation aloud using Microsoft `edge-tts` neural voices.
- **Dynamic Visualizer**: 4-bar vertical pill audio modulator rendered in a butter-yellow theme.

---

## Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9 - v3.11 recommended)
- **FFmpeg** installed and accessible in your system `PATH`

---

## Project Structure

```text
multilingual-speech-app/
├── client/              # React frontend (Vite)
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── constants/
│       ├── App.jsx
│       └── App.css
├── server/              # Node.js + Python backend
│   ├── package.json
│   ├── server.js
│   ├── transcribe.py
│   ├── synthesize.py
│   └── uploads/
├── .gitignore
└── README.md

```

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone [https://github.com/](https://github.com/)<your-username>/<your-repo-name>.git
cd multilingual-speech-app

```

### 2. Backend Setup

Navigate into the `server` directory, create a virtual environment, and install dependencies:

```bash
cd server
npm install

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install Python packages
pip install faster-whisper edge-tts requests

```

### 3. Frontend Setup

Open a new terminal, navigate into the `client` directory, and install dependencies:

```bash
cd client
npm install

```

---

## Running the Application

### 1. Start the Backend

From the `server` folder:

```bash
npm start

```

*Server runs on `http://localhost:5000`.*

### 2. Start the Frontend

From the `client` folder:

```bash
npm run dev

```

*App opens on `http://localhost:5173`.*

---

## How It Works

1. **Record Audio**: Speak via the browser microphone; audio is captured as `.webm`.
2. **STT (Speech-to-Text)**: Node calls `transcribe.py` where `faster-whisper` transcribes audio into native script.
3. **Translation**: The transcript translates automatically to the selected target language.
4. **TTS (Text-to-Speech)**: `synthesize.py` uses Microsoft Edge Neural Voice models to generate clean `.mp3` audio.
5. **Interactive Loop**: Any edits made inside the transcript textarea automatically translate and re-synthesize speech after you pause typing.
