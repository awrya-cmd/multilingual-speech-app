import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile, spawn } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and expose custom header for translated text
app.use(cors({
    exposedHeaders: ['X-Translated-Text'],
}));

app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.webm';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
const upload = multer({ storage });

const pythonExecutable = path.join(__dirname, 'venv', 'Scripts', 'python.exe');
const transcribeScript = path.join(__dirname, 'transcribe.py');
const synthesizeScript = path.join(__dirname, 'synthesize.py');

// 1. Transcription Route
app.post('/api/transcribe', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    const audioPath = path.resolve(req.file.path);
    const inputLang = req.body.language || '';

    console.log(`[STT] Processing audio (Language constraint: ${inputLang || 'auto'})...`);

    execFile(
        pythonExecutable,
        [transcribeScript, audioPath, inputLang],
        { maxBuffer: 1024 * 1024 * 10 },
        (error, stdout, stderr) => {
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }

            if (error) {
                console.error('[STT Error]:', stderr || error.message);
                return res.status(500).json({ error: 'Transcription failed' });
            }

            try {
                const result = JSON.parse(stdout.trim());
                console.log(`[STT Output - ${result.detected_language} (${result.detected_code})]:`, result.transcript);
                res.json({
                    transcript: result.transcript,
                    detectedLanguage: result.detected_language,
                    detectedCode: result.detected_code,
                });
            } catch (parseErr) {
                console.error('Failed to parse STT output:', stdout);
                res.status(500).json({ error: 'Invalid transcription format' });
            }
        }
    );
});

// 2. Translation & Synthesis Route
app.post('/api/synthesize', (req, res) => {
    const { text, voiceCode } = req.body;

    if (!text || !voiceCode) {
        return res.status(400).json({ error: 'Text and voiceCode are required.' });
    }

    const outputPath = path.join(uploadDir, `tts_${Date.now()}.mp3`);
    const pyProcess = spawn(pythonExecutable, [synthesizeScript]);

    const payload = JSON.stringify({
        text,
        voiceCode,
        outputPath,
    });

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdin.write(payload);
    pyProcess.stdin.end();

    pyProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
    });

    pyProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('TTS error:', stderrData);
            return res.status(500).json({ error: 'Speech synthesis failed' });
        }

        let translatedText = text;
        try {
            const parsed = JSON.parse(stdoutData.trim());
            translatedText = parsed.translated_text;
        } catch (_) { }

        res.setHeader('X-Translated-Text', encodeURIComponent(translatedText));
        res.sendFile(outputPath, (err) => {
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
            if (err && !res.headersSent) {
                res.status(500).json({ error: 'Failed to stream audio file' });
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});