import { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';

const ConfirmContext = createContext();

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
};

export const ConfirmProvider = ({ children }) => {
    const [state, setState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        onCancel: () => { },
        type: 'danger'
    });

    const confirm = useCallback(({ title, message, onConfirm, type = 'danger', confirmText, cancelText }) => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                title,
                message,
                type,
                confirmText,
                cancelText,
                onConfirm: () => {
                    setState(prev => ({ ...prev, isOpen: false }));
                    if (onConfirm && typeof onConfirm === 'function') onConfirm();
                    resolve(true);
                },
                onCancel: () => {
                    setState(prev => ({ ...prev, isOpen: false }));
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <ConfirmationDialog
                isOpen={state.isOpen}
                title={state.title}
                message={state.message}
                onConfirm={state.onConfirm}
                onCancel={state.onCancel}
                type={state.type}
                confirmText={state.confirmText}
                cancelText={state.cancelText}
            />
        </ConfirmContext.Provider>
    );
};
