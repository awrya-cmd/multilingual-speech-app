import React, { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ label, options, selectedValue, onSelect, disabled }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selectedOption = options.find((opt) => opt.code === selectedValue) || options[0];

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (code) => {
        onSelect(code);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="searchable-select-group" ref={containerRef}>
            <label className="select-label">{label}</label>
            <button
                type="button"
                className="select-trigger"
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                disabled={disabled}
            >
                <span>{selectedOption?.label}</span>
                <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="select-dropdown">
                    <div className="search-input-wrapper">
                        <input
                            ref={inputRef}
                            type="text"
                            className="search-input"
                            placeholder="Type to search language..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="options-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt.code}
                                    className={`option-item ${opt.code === selectedValue ? 'selected' : ''}`}
                                    onClick={() => handleSelect(opt.code)}
                                >
                                    {opt.label}
                                </div>
                            ))
                        ) : (
                            <div className="no-options">No language found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}