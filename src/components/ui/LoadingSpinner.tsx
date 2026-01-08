import React, { memo } from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
    fullScreen?: boolean;
}

/**
 * LoadingSpinner - Reusable loading indicator
 * Memoized since it has no dynamic content based on props
 */
const LoadingSpinner = memo(function LoadingSpinner({
    size = 'medium',
    message,
    fullScreen = false,
}: LoadingSpinnerProps): React.JSX.Element {
    const containerClass = fullScreen ? 'spinner-fullscreen' : 'spinner-container';

    return (
        <div className={containerClass}>
            <div className={`spinner spinner-${size}`} />
            {message && <p className="spinner-message">{message}</p>}
        </div>
    );
});

export default LoadingSpinner;
