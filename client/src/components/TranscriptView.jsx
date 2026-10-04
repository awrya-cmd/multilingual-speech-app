import React from 'react';

export default function TranscriptView({ transcript, language }) {
    if (!transcript) return null;

    return (
        <div className="transcript-box">
            <h3>Transcript ({language.label}):</h3>
            <p
                className="transcript-text"
                dir={language.dir}
                style={{ textAlign: language.dir === 'rtl' ? 'right' : 'left' }}
            >
                {transcript}
            </p>
        </div>
    );
}