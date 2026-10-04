import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

// Local faster-whisper STT
app.post('/api/transcribe', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    const audioPath = path.resolve(req.file.path);
    const lang = req.body.language || 'en';

    console.log(`[STT] Processing audio for language: ${lang}`);

    execFile(
        pythonExecutable,
        [transcribeScript, audioPath, lang],
        { maxBuffer: 1024 * 1024 * 10 },
        (error, stdout, stderr) => {
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }

            if (error) {
                console.error('[STT Error]:', stderr || error.message);
                return res.status(500).json({ error: 'Transcription failed' });
            }

            const transcript = stdout.trim();
            console.log(`[STT Output - ${lang}]:`, transcript);
            res.json({ transcript });
        }
    );
});

// Local edge-tts TTS
app.post('/api/synthesize', (req, res) => {
    const { text, voiceCode } = req.body;

    if (!text || !voiceCode) {
        return res.status(400).json({ error: 'Text and voiceCode are required.' });
    }

    const outputPath = path.join(uploadDir, `tts_${Date.now()}.mp3`);

    execFile(pythonExecutable, [synthesizeScript, text, voiceCode, outputPath], (error, stdout, stderr) => {
        if (error) {
            console.error('TTS error:', stderr || error.message);
            return res.status(500).json({ error: 'Speech synthesis failed' });
        }

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