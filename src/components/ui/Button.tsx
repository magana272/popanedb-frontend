import React, { memo, ButtonHTMLAttributes } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: string;
    fullWidth?: boolean;
}

/**
 * Button - Reusable button component with variants
 * Memoized to prevent unnecessary re-renders
 */
const Button = memo(function Button({
    children,
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    icon,
    fullWidth = false,
    disabled,
    className = '',
    ...props
}: ButtonProps): JSX.Element {
    const classNames = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth ? 'btn-full-width' : '',
        isLoading ? 'btn-loading' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classNames}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <span className="btn-spinner" />}
            {icon && !isLoading && <span className="btn-icon">{icon}</span>}
            {children}
        </button>
    );
});

export default Button;
