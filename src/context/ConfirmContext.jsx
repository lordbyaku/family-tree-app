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
        type: 'danger'
    });

    const confirm = useCallback(({ title, message, onConfirm, type = 'danger' }) => {
        setState({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setState(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    }, []);

    const close = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <ConfirmationDialog
                isOpen={state.isOpen}
                title={state.title}
                message={state.message}
                onConfirm={state.onConfirm}
                onCancel={close}
                type={state.type}
            />
        </ConfirmContext.Provider>
    );
};
