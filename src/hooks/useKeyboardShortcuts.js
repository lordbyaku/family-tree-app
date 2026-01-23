import { useEffect } from 'react';

const useKeyboardShortcuts = ({
    setIsFormOpen,
    setIsStatsOpen,
    setIsRelOpen,
    setIsAuditLogOpen,
    setViewingMemberId,
    setEditingMemberId,
    canUndo,
    canRedo,
    undo,
    redo,
    lastAction,
    toast
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                setIsFormOpen(false);
                setIsStatsOpen(false);
                setIsRelOpen(false);
                setIsAuditLogOpen(false);
                setViewingMemberId(null);
                setEditingMemberId(null);
            }

            // '/' or 'Ctrl+F' to focus search
            if (e.key === '/' || (e.ctrlKey && e.key === 'f')) {
                // Only if not already typing in an input/textarea
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    document.querySelector('input[placeholder="Cari anggota..."]')?.focus();
                }
            }

            // Undo: Ctrl+Z
            if (e.ctrlKey && e.key === 'z') {
                if (canUndo) {
                    e.preventDefault();
                    undo();
                    toast.info(`Undo: ${lastAction}`);
                }
            }

            // Redo: Ctrl+Y
            if (e.ctrlKey && e.key === 'y') {
                if (canRedo) {
                    e.preventDefault();
                    redo();
                    toast.info(`Redo: ${lastAction}`);
                }
            }

            // Audit Log: Ctrl+L
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                setIsAuditLogOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canUndo, canRedo, undo, redo, lastAction, toast, setIsFormOpen, setIsStatsOpen, setIsRelOpen, setIsAuditLogOpen, setViewingMemberId, setEditingMemberId]);
};

export default useKeyboardShortcuts;
