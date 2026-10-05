import React, { useState, useEffect, useRef } from 'react';
import SearchableSelect from './components/SearchableSelect';
import AudioRecorder from './components/AudioRecorder';
import TranscriptView from './components/TranscriptView';
import AudioPlayer from './components/AudioPlayer';
import { INPUT_LANGUAGES, TARGET_LANGUAGES } from './constants/languages';
import './App.css';

export default function App() {
    const [inputLangCode, setInputLangCode] = useState('auto');
    const [outputLangCode, setOutputLangCode] = useState('ru');
    const [detectedLanguage, setDetectedLanguage] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const debounceTimerRef = useRef(null);
    const isRecordingRef = useRef(false);

    const currentOutputLanguage =
        TARGET_LANGUAGES.find((lang) => lang.code === outputLangCode) || TARGET_LANGUAGES[0];

    const synthesizeSpeech = async (textToSpeak, targetLang) => {
        if (!textToSpeak || !textToSpeak.trim()) return;

        setIsLoading(true);
        setStatus(`Translating and synthesizing audio for ${targetLang.label}...`);

        try {
            const synthRes = await fetch('http://localhost:5000/api/synthesize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textToSpeak.trim(),
                    voiceCode: targetLang.voiceCode,
                }),
            });

            if (!synthRes.ok) throw new Error('Speech synthesis failed');

            const headerTranslation = synthRes.headers.get('X-Translated-Text');
            if (headerTranslation) {
                setTranslatedText(decodeURIComponent(headerTranslation));
            }

            const synthBlob = await synthRes.blob();
            const url = URL.createObjectURL(synthBlob);
            setAudioUrl(url);
            setStatus('Complete');
        } catch (err) {
            console.error(err);
            setStatus(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTranscriptChange = (newText) => {
        setTranscript(newText);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (!newText.trim()) {
            setTranslatedText('');
            setAudioUrl(null);
            setStatus('');
            return;
        }

        debounceTimerRef.current = setTimeout(() => {
            synthesizeSpeech(newText, currentOutputLanguage);
        }, 750);
    };

    const handleOutputLanguageChange = (newCode) => {
        setOutputLangCode(newCode);
        const newTarget = TARGET_LANGUAGES.find((lang) => lang.code === newCode) || TARGET_LANGUAGES[0];

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (transcript.trim() && !isRecordingRef.current) {
            synthesizeSpeech(transcript, newTarget);
        }
    };

    const handleRecordingComplete = async (audioBlob) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        isRecordingRef.current = false;
        setIsLoading(true);
        setAudioUrl(null);
        setTranscript('');
        setTranslatedText('');
        setDetectedLanguage(null);
        setStatus('Transcribing speech...');

        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('language', inputLangCode === 'auto' ? '' : inputLangCode);

        try {
            const transcribeRes = await fetch('http://localhost:5000/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!transcribeRes.ok) throw new Error('Speech transcription failed');

            const transcribeData = await transcribeRes.json();
            setTranscript(transcribeData.transcript);
            setDetectedLanguage(transcribeData.detectedLanguage);

            if (!transcribeData.transcript) {
                setStatus('No speech detected. Please speak again.');
                setIsLoading(false);
                return;
            }

            await synthesizeSpeech(transcribeData.transcript, currentOutputLanguage);
        } catch (err) {
            console.error(err);
            setStatus(`Error: ${err.message}`);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="app-container">
            <header>
                <h1>Multilingual Speech Translation</h1>
                <p>Real-time speech-to-text, translation, and neural playback</p>
            </header>

            <main className="card">
                <div className="language-panel">
                    <SearchableSelect
                        label="Input Language"
                        options={INPUT_LANGUAGES}
                        selectedValue={inputLangCode}
                        onSelect={setInputLangCode}
                        disabled={isLoading}
                    />
                    <SearchableSelect
                        label="Translate To"
                        options={TARGET_LANGUAGES}
                        selectedValue={outputLangCode}
                        onSelect={handleOutputLanguageChange}
                        disabled={isLoading}
                    />
                </div>

                <AudioRecorder
                    onRecordingComplete={handleRecordingComplete}
                    disabled={isLoading}
                />

                {status && <div className="status-indicator">{status}</div>}

                <TranscriptView
                    transcript={transcript}
                    onTranscriptChange={handleTranscriptChange}
                    detectedLanguage={detectedLanguage}
                    disabled={isLoading}
                />

                {translatedText && (
                    <div className="transcript-box translation-box">
                        <h3>Translation ({currentOutputLanguage.label}):</h3>
                        <p className="transcript-text">{translatedText}</p>
                    </div>
                )}

                <AudioPlayer
                    audioUrl={audioUrl}
                    outputLanguage={currentOutputLanguage}
                />
            </main>
        </div>
    );
}