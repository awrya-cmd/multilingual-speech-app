import React, { useState } from 'react';
import { LANGUAGES } from './constants/languages';
import LanguageSelector from './components/LanguageSelector';
import AudioRecorder from './components/AudioRecorder';
import TranscriptView from './components/TranscriptView';
import AudioPlayer from './components/AudioPlayer';
import './App.css';

export default function App() {
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
    const [transcript, setTranscript] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAudioReady = async (audioBlob) => {
        setLoading(true);
        setStatus(`Transcribing ${selectedLanguage.label}...`);
        setTranscript('');
        setAudioUrl(null);

        try {
            // 1. Send Audio to local Faster-Whisper backend
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('language', selectedLanguage.code);

            const sttResponse = await fetch('http://localhost:5000/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!sttResponse.ok) throw new Error('Speech-to-text failed');
            const { transcript: recognizedText } = await sttResponse.json();

            if (!recognizedText || recognizedText.trim().length === 0) {
                setStatus('No speech detected. Please try speaking again.');
                setLoading(false);
                return;
            }

            setTranscript(recognizedText);
            setStatus(`Synthesizing speech in ${selectedLanguage.label}...`);

            // 2. Synthesize transcript back into audio via Google TTS
            const ttsResponse = await fetch('http://localhost:5000/api/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: recognizedText,
                    voiceCode: selectedLanguage.voice,
                }),
            });

            if (!ttsResponse.ok) throw new Error('Text-to-speech synthesis failed');

            const audioBuffer = await ttsResponse.arrayBuffer();
            const playbackBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
            setAudioUrl(URL.createObjectURL(playbackBlob));
            setStatus('Complete!');
        } catch (err) {
            console.error(err);
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="app-container">
            <header>
                <h1>Multilingual Speech Loop</h1>
                <p>Speech-to-Text &rarr; Transcript &rarr; Text-to-Speech Echo</p>
            </header>

            <section className="card">
                <LanguageSelector
                    selectedLanguage={selectedLanguage}
                    onSelectLanguage={setSelectedLanguage}
                    disabled={loading}
                />

                <AudioRecorder
                    onRecordingComplete={handleAudioReady}
                    disabled={loading}
                    selectedLanguage={selectedLanguage}
                />

                {status && <div className="status-indicator">{status}</div>}

                <TranscriptView
                    transcript={transcript}
                    language={selectedLanguage}
                />

                <AudioPlayer
                    audioUrl={audioUrl}
                    language={selectedLanguage}
                />
            </section>
        </main>
    );
}