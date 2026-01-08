import React, { memo } from 'react';
import './Card.css';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    selected?: boolean;
    hoverable?: boolean;
}

/**
 * Card - Reusable card container component
 * Memoized for performance optimization
 */
const Card = memo(function Card({
    children,
    className = '',
    onClick,
    selected = false,
    hoverable = false,
}: CardProps): React.JSX.Element {
    const classNames = [
        'card',
        selected ? 'card-selected' : '',
        hoverable || onClick ? 'card-hoverable' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classNames}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
            {children}
        </div>
    );
});

// Card Header sub-component
const CardHeader = memo(function CardHeader({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element {
    return <div className={`card-header ${className}`}>{children}</div>;
});

// Card Body sub-component
const CardBody = memo(function CardBody({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element {
    return <div className={`card-body ${className}`}>{children}</div>;
});

// Card Footer sub-component
const CardFooter = memo(function CardFooter({
    children,
    className = '',
}: {
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element {
    return <div className={`card-footer ${className}`}>{children}</div>;
});

export { Card, CardHeader, CardBody, CardFooter };
export default Card;
