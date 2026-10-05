import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    exposedHeaders: ['X-Translated-Text'],
}));

app.use(express.json());

// In-memory file storage - zero hard drive writes
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cross-platform Python resolver
const venvWindowsPath = path.join(__dirname, 'venv', 'Scripts', 'python.exe');
const venvPosixPath = path.join(__dirname, 'venv', 'bin', 'python');

let pythonExecutable;
if (fs.existsSync(venvWindowsPath)) {
    pythonExecutable = venvWindowsPath;
} else if (fs.existsSync(venvPosixPath)) {
    pythonExecutable = venvPosixPath;
} else {
    pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
}

const transcribeScript = path.join(__dirname, 'transcribe.py');
const synthesizeScript = path.join(__dirname, 'synthesize.py');

// 1. In-Memory Transcription Route
app.post('/api/transcribe', upload.single('audio'), (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No audio data received.' });
    }

    const inputLang = req.body.language || '';
    const pyProcess = spawn(pythonExecutable, [transcribeScript, inputLang]);

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString('utf-8');
    });

    pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString('utf-8');
    });

    pyProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('[STT Error]:', stderrData);
            return res.status(500).json({ error: 'Transcription failed' });
        }

        try {
            const result = JSON.parse(stdoutData.trim());
            res.json({
                transcript: result.transcript,
                detectedLanguage: result.detected_language,
                detectedCode: result.detected_code,
            });
        } catch (parseErr) {
            console.error('Failed to parse STT output:', stdoutData);
            res.status(500).json({ error: 'Invalid transcription format' });
        }
    });

    // Pipe the browser's audio buffer directly to Python stdin
    pyProcess.stdin.write(req.file.buffer);
    pyProcess.stdin.end();
});

// 2. In-Memory Synthesis Route
app.post('/api/synthesize', (req, res) => {
    const { text, voiceCode } = req.body;

    if (!text || !voiceCode) {
        return res.status(400).json({ error: 'Text and voiceCode are required.' });
    }

    const pyProcess = spawn(pythonExecutable, [synthesizeScript]);
    let translatedText = text;
    let headersSent = false;

    pyProcess.stderr.on('data', (data) => {
        const lines = data.toString('utf-8').split('\n');
        for (const line of lines) {
            if (line.startsWith('META_TRANSLATION:')) {
                try {
                    const meta = JSON.parse(line.replace('META_TRANSLATION:', ''));
                    translatedText = meta.translated_text;
                } catch (_) { }
            }
        }
    });

    pyProcess.stdout.on('data', (chunk) => {
        if (!headersSent) {
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('X-Translated-Text', encodeURIComponent(translatedText));
            headersSent = true;
        }
        res.write(chunk);
    });

    pyProcess.on('close', (code) => {
        if (code !== 0) {
            if (!headersSent) {
                return res.status(500).json({ error: 'Speech synthesis failed' });
            }
        }
        res.end();
    });

    // Send request JSON to Python stdin
    pyProcess.stdin.write(JSON.stringify({ text, voiceCode }));
    pyProcess.stdin.end();
});

app.listen(PORT, () => {
    console.log(`Backend server running in-memory on http://localhost:${PORT}`);
});