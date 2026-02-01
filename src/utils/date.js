
/**
 * Utility to parse various date formats used in the app (YYYY-MM-DD or DD/MM/YYYY)
 * Returns or creates a Date object if possible, otherwise returns null.
 */
export const parseDateString = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;

    // Handle YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateStr);
    }

    // Handle DD/MM/YYYY
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // JS Date expects YYYY, MM (0-indexed), DD
            return new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
        }
    }

    // Handle other ISO formats
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Returns only the year from a date string (handles DD/MM/YYYY and YYYY-MM-DD)
 */
export const getYearFromDateString = (dateStr) => {
    if (!dateStr) return '';

    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        return parts[parts.length - 1]; // Year is usually the last part
    }

    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        // If YYYY-MM-DD, year is first part. If some use DD-MM-YYYY, it's last part.
        // Usually Supabase uses YYYY-MM-DD.
        return parts[0].length === 4 ? parts[0] : parts[2];
    }

    return dateStr;
};

/**
 * Format date for display (Indonesian format DD/MM/YYYY)
 */
export const formatDateDisplay = (dateStr) => {
    const date = parseDateString(dateStr);
    if (!date) return dateStr || '';

    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();

    return `${d}/${m}/${y}`;
};

/**
 * Calculate age based on birthDate
 */
export const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const birth = parseDateString(birthDate);
    if (!birth) return 0;

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

/**
 * Check if the given date is today (ignoring year)
 */
export const isBirthdayToday = (birthDate) => {
    if (!birthDate) return false;
    const birth = parseDateString(birthDate);
    if (!birth) return false;

    const today = new Date();
    return birth.getDate() === today.getDate() &&
        birth.getMonth() === today.getMonth();
};

/**
 * Generate WhatsApp Greeting Message
 */
export const generateWhatsAppGreeting = (name, age, treeSlug) => {
    return encodeURIComponent(`Selamat Ulang Tahun yang ke-${age}, ${name}! 🎂🥳\n\nSemoga panjang umur, sehat selalu, dan murah rezeki. Aamiin.\n\nSalam Hangat,\nKeluarga Besar ${treeSlug !== 'default' ? treeSlug : ''}`);
};
