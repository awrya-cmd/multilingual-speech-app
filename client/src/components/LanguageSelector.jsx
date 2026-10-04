import React from 'react';
import { LANGUAGES } from '../constants/languages';

export default function LanguageSelector({ selectedLanguage, onSelectLanguage, disabled }) {
    return (
        <div className="selector-container">
            <label htmlFor="language-select"><strong>Target Language:</strong></label>
            <select
                id="language-select"
                value={selectedLanguage.code}
                onChange={(e) => {
                    const match = LANGUAGES.find((l) => l.code === e.target.value);
                    if (match) onSelectLanguage(match);
                }}
                disabled={disabled}
            >
                {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.label} ({lang.code})
                    </option>
                ))}
            </select>
        </div>
    );
}