import React, { useState, useRef } from 'react';
import AudioVisualizer from './AudioVisualizer';

export default function AudioRecorder({ onRecordingComplete, disabled }) {
    const [isRecording, setIsRecording] = useState(false);
    const [activeStream, setActiveStream] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            setActiveStream(stream);

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 128000,
            });

            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
                setActiveStream(null);
            };

            mediaRecorderRef.current.start(250);
            setIsRecording(true);
        } catch (err) {
            console.error('Microphone error:', err);
            alert('Could not access microphone. Please grant permission.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="recorder-container">
            <div className="button-group">
                {!isRecording ? (
                    <button
                        className="btn btn-record"
                        onClick={startRecording}
                        disabled={disabled}
                    >
                        Start Recording
                    </button>
                ) : (
                    <button className="btn btn-stop" onClick={stopRecording}>
                        Stop Recording
                    </button>
                )}
            </div>

            {isRecording && <AudioVisualizer stream={activeStream} isRecording={isRecording} />}
        </div>
    );
}