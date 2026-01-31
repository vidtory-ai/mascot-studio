import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
}

export const Select: React.FC<SelectProps> = ({ label, id, children, className = '', ...props }) => {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-bold text-slate-600 mb-1.5">
                {label}
            </label>
            <select
                id={id}
                className={`w-full px-3 py-2 bg-white border-2 border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-800 ${className}`}
                {...props}
            >
                {children}
            </select>
        </div>
    );
};