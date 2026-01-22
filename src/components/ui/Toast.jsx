import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setIsVisible(true));

        const timer = setTimeout(() => {
            setIsVisible(false);
            // Wait for exit animation to finish before calling onClose
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColors = {
        success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
        error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
        warning: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    };

    const icons = {
        success: <CheckCircle size={20} className="text-green-600 dark:text-green-400" />,
        error: <AlertCircle size={20} className="text-red-600 dark:text-red-400" />,
        info: <Info size={20} className="text-blue-600 dark:text-blue-400" />,
        warning: <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />,
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-95'
                } ${bgColors[type] || bgColors.info} max-w-sm`}
            role="alert"
        >
            <div className="shrink-0">{icons[type] || icons.info}</div>
            <p className="text-sm font-medium">{message}</p>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
                className="ml-auto shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
            >
                <X size={16} className="opacity-60" />
            </button>
        </div>
    );
};

export default Toast;
