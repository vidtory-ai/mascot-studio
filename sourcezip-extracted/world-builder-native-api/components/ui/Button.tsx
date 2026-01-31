import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center px-5 py-2.5 border text-sm font-bold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105';
    
    const variantClasses = {
        primary: 'text-white bg-blue-500 hover:bg-blue-600 focus:ring-blue-400 border-transparent',
        secondary: 'text-slate-700 bg-white hover:bg-slate-50 focus:ring-blue-400 border-slate-300',
        danger: 'text-white bg-red-500 hover:bg-red-600 focus:ring-red-400 border-transparent',
    };

    return (
        <button
            type="button"
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};