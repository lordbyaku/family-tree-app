
/**
 * Date Utilities for Birthday Features
 */

/**
 * Checks if a birth date is today (month and day match)
 * @param {string} birthDateStr - ISO date string (YYYY-MM-DD)
 * @returns {boolean}
 */
export const isBirthdayToday = (birthDateStr) => {
    if (!birthDateStr) return false;

    const today = new Date();
    const birthDate = new Date(birthDateStr);

    return today.getDate() === birthDate.getDate() &&
        today.getMonth() === birthDate.getMonth();
};

/**
 * Calculates current age based on birth date
 * @param {string} birthDateStr - ISO date string (YYYY-MM-DD)
 * @returns {number}
 */
export const calculateAge = (birthDateStr) => {
    if (!birthDateStr) return 0;

    const today = new Date();
    const birthDate = new Date(birthDateStr);

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

/**
 * Generates a WhatsApp greeting message
 * @param {string} name - Member name
 * @param {number} age - Calculated age
 * @param {string} familyName - Tree slug or family name
 * @returns {string}
 */
export const generateWhatsAppGreeting = (name, age, familyName) => {
    const greeting = `Halo ${name}, Selamat Ulang Tahun yang ke-${age}! 🎉✨\n\nSemoga panjang umur, sehat selalu, dan dilancarkan rezekinya. Amin. 🤲😇\n\n- Salam hangat dari Silsilah Keluarga ${familyName}.`;
    return encodeURIComponent(greeting);
};
