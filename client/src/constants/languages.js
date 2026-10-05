const RAW_LANGUAGES = [
    { code: 'af', label: 'Afrikaans', voiceCode: 'af-ZA', voiceName: 'Adri' },
    { code: 'am', label: 'Amharic', voiceCode: 'am-ET', voiceName: 'Mekdes' },
    { code: 'ar', label: 'Arabic', voiceCode: 'ar-XA', voiceName: 'Zariyah' },
    { code: 'zh', label: 'Chinese', voiceCode: 'cmn-CN', voiceName: 'Xiaoxiao' },
    { code: 'en', label: 'English', voiceCode: 'en-US', voiceName: 'Jenny' },
    { code: 'hi', label: 'Hindi', voiceCode: 'hi-IN', voiceName: 'Swara' },
    { code: 'id', label: 'Indonesian', voiceCode: 'id-ID', voiceName: 'Gadis' },
    { code: 'kk', label: 'Kazakh', voiceCode: 'kk-KZ', voiceName: 'Aigul' },
    { code: 'fa', label: 'Persian', voiceCode: 'fa-IR', voiceName: 'Dilara' },
    { code: 'pt', label: 'Portuguese', voiceCode: 'pt-BR', voiceName: 'Francisca' },
    { code: 'ru', label: 'Russian', voiceCode: 'ru-RU', voiceName: 'Svetlana' },
    { code: 'es', label: 'Spanish', voiceCode: 'es-ES', voiceName: 'Elvira' },
    { code: 'sw', label: 'Swahili', voiceCode: 'sw-KE', voiceName: 'Zuri' },
    { code: 'th', label: 'Thai', voiceCode: 'th-TH', voiceName: 'Premwadee' },
    { code: 'uz', label: 'Uzbek', voiceCode: 'uz-UZ', voiceName: 'Madina' },
    { code: 'vi', label: 'Vietnamese', voiceCode: 'vi-VN', voiceName: 'HoaiMy' },
];

export const TARGET_LANGUAGES = [...RAW_LANGUAGES].sort((a, b) =>
    a.label.localeCompare(b.label)
);

export const INPUT_LANGUAGES = [
    { code: 'auto', label: 'Auto Detect', voiceCode: null, voiceName: null },
    ...TARGET_LANGUAGES,
];

export const SUPPORTED_LANGUAGES = TARGET_LANGUAGES;
export default TARGET_LANGUAGES;