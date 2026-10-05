import React from 'react';

export default function TranscriptView({
    transcript,
    onTranscriptChange,
    detectedLanguage,
    disabled
}) {
    if (!transcript && transcript !== '') return null;

    const isRtl = detectedLanguage === 'Arabic' || detectedLanguage === 'Persian';

    return (
        <div className="transcript-box">
            <div style={{ marginBottom: '8px' }}>
                <h3>
                    Transcript {detectedLanguage ? `(Detected: ${detectedLanguage})` : ''}:
                </h3>
            </div>

            <textarea
                value={transcript}
                onChange={(e) => onTranscriptChange(e.target.value)}
                rows={4}
                dir={isRtl ? 'rtl' : 'ltr'}
                style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #fde68a',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                }}
                disabled={disabled}
                placeholder="Type or speak to generate audio..."
            />
        </div>
    );
}