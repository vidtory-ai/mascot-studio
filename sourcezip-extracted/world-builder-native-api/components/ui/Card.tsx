import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`bg-white shadow-lg rounded-2xl p-4 sm:p-6 ${className}`}>
            {children}
        </div>
    );
};