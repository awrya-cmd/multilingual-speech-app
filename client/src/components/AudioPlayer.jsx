import React from 'react';

export default function AudioPlayer({ audioUrl, language }) {
    if (!audioUrl) return null;

    return (
        <div className="audio-player-box">
            <h4>Synthesized Audio ({language.label}):</h4>
            <audio controls src={audioUrl} autoPlay />
        </div>
    );
}