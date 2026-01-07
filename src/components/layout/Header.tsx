import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

// Sun and Moon icons as inline SVGs
const SunIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
);

const MoonIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

interface HeaderProps {
    subtitle?: string;
}

export default function Header({ subtitle }: HeaderProps) {
    const { toggleTheme, isDark } = useTheme();

    return (
        <header className={`header ${isDark ? 'dark' : 'light'}`}>
            <div className="header-container">
                <div className="header-left">
                    <div className="header-brand">
                        <h1 className="header-title">POPANEdb</h1>
                        <span className="header-subtitle">
                            {subtitle || 'Physiological Data Visualization'}
                        </span>
                    </div>
                </div>

                <nav className="header-nav">
                    {['Studies', 'Data', 'Visualization'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="header-nav-link"
                        >
                            {item}
                        </a>
                    ))}
                </nav>

                <button
                    className="theme-toggle"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                    <div className="theme-icon">
                        {isDark ? <SunIcon /> : <MoonIcon />}
                    </div>
                </button>
            </div>
        </header>
    );
}
