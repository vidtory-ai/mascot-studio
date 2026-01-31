import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

export const Input: React.FC<InputProps> = ({ label, id, className = '', ...props }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-bold text-slate-600 mb-1.5">
                {label}
            </label>
            <input
                id={id}
                className={`w-full px-4 py-2 bg-white border-2 border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-800 ${className}`}
                {...props}
            />
        </div>
    );
};