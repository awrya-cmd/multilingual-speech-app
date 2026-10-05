import React from 'react';

export default function AudioPlayer({ audioUrl, outputLanguage, selectedLanguage }) {
    if (!audioUrl) return null;

    const language = outputLanguage || selectedLanguage || { label: 'Selected Language' };

    return (
        <div className="audio-player-box">
            <h4>Synthesized Audio ({language.label}):</h4>
            <audio controls autoPlay src={audioUrl}>
                Your browser does not support the audio element.
            </audio>
        </div>
    );
}