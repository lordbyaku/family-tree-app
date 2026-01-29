import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate PDF Book by rendering HTML visually (canvas) to preserve styles and encoding.
 * @param {Array} members 
 * @param {Object} options 
 * @returns {Promise<jsPDF>}
 */
export const generatePDFBook = async (members, options = {}) => {
    const { includeStats = true, includePhotos = true } = options;

    // Sort members by name
    const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));

    // A4 dimensions in pixel (approximate for 96 DPI)
    // A4 is 210mm x 297mm. jsPDF uses mm. html2canvas uses px.
    // We will render at a fixed width (e.g. 800px) and scale it down to PDF.
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();

    // CSS Styles copied from HTML Export to match the look
    const styles = `
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
        background: white;
        width: 794px; /* A4 width at 96dpi approx */
        margin: 0 auto;
        padding: 40px;
        box-sizing: border-box;
    `;

    const headerStyle = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 20px;
        text-align: center;
        border-radius: 10px;
        margin-bottom: 30px;
    `;

    const cardStyle = `
        background: white;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        page-break-inside: avoid;
    `;

    // Helper to create a container
    const createContainer = () => {
        const div = document.createElement('div');
        div.style.cssText = `
            position: absolute; 
            left: -9999px; 
            top: 0; 
            width: 794px; /* A4 width */
            background: #f8fafc; /* Slate-50 */
        `;
        document.body.appendChild(div);
        return div;
    };

    /**
     * Render a component to canvas and add to PDF
     */
    const addToPdf = async (element) => {
        // Wait for images to load in this element
        const images = element.getElementsByTagName('img');
        const imagePromises = Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        });
        await Promise.all(imagePromises);

        // Small extra delay for rendering stability
        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(element, {
            scale: 2, // Retinal quality
            useCORS: true, // Handle images
            logging: false,
            backgroundColor: '#f8fafc'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const imgProps = pdf.getImageProperties(imgData);
        const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfImgHeight);
    };

    // --- PAGE 1: COVER & STATS ---
    const coverContainer = createContainer();

    // Stats HTML Generator
    let statsHtml = '';
    if (includeStats) {
        const total = members.length;
        const males = members.filter(m => m.gender === 'male').length;
        const females = members.filter(m => m.gender === 'female').length;
        const deceased = members.filter(m => m.isDeceased).length;
        const alive = total - deceased;

        statsHtml = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 30px;">
                <div style="padding: 15px; background: white; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${total}</div>
                    <div style="font-size: 12px; color: #64748b;">Total Anggota</div>
                </div>
                <div style="padding: 15px; background: white; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: bold; color: #22c55e;">${alive}</div>
                    <div style="font-size: 12px; color: #64748b;">Masih Hidup</div>
                </div>
                <div style="padding: 15px; background: white; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${males}</div>
                    <div style="font-size: 12px; color: #64748b;">Laki-laki</div>
                </div>
                <div style="padding: 15px; background: white; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: bold; color: #ec4899;">${females}</div>
                    <div style="font-size: 12px; color: #64748b;">Perempuan</div>
                </div>
            </div>
        `;
    }

    coverContainer.innerHTML = `
        <div style="${styles}">
            <div style="${headerStyle}">
                <h1 style="font-size: 36px; margin: 0 0 10px 0;">📖 Buku Keluarga</h1>
                <p style="font-size: 18px; margin: 0; opacity: 0.9;">Dokumentasi Lengkap Silsilah Keluarga</p>
                <p style="margin-top: 20px; font-size: 14px;">Dibuat pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
            </div>
            ${statsHtml}
        </div>
    `;

    await addToPdf(coverContainer);
    document.body.removeChild(coverContainer);

    // --- MEMBER PAGES ---
    // We fit approx 4 members per page to match the HTML look nicely
    const MEMBERS_PER_PAGE = 4;

    for (let i = 0; i < sortedMembers.length; i += MEMBERS_PER_PAGE) {
        pdf.addPage();

        const chunk = sortedMembers.slice(i, i + MEMBERS_PER_PAGE);
        const pageContainer = createContainer();

        let cardsHtml = chunk.map((m, idx) => {
            const globalIndex = i + idx + 1;

            // Photo handling
            const photoHtml = (includePhotos && m.photo)
                ? `<img src="${m.photo}" crossOrigin="anonymous" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #667eea; display: block;">`
                : `<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: bold;">${m.name.charAt(0).toUpperCase()}</div>`;

            // Spouses
            const spouseNames = (m.spouses || []).map(s => {
                const sid = typeof s === 'string' ? s : s?.id;
                const spouse = sid ? members.find(sp => sp.id === sid) : null;
                return spouse?.name || null;
            }).filter(Boolean);

            // Parents
            const parentNames = (m.parents || []).map(p => {
                const pid = typeof p === 'string' ? p : p?.id;
                const parent = pid ? members.find(par => par.id === pid) : null;
                return parent?.name || null;
            }).filter(Boolean);

            return `
                <div style="${cardStyle}">
                    <div style="display: flex; gap: 20px; align-items: flex-start;">
                        <div style="flex-shrink: 0;">
                            ${photoHtml}
                            <div style="margin-top: 10px; background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin: 10px auto 0;">${globalIndex}</div>
                        </div>
                        <div style="flex: 1;">
                            <h2 style="margin: 0 0 5px 0; font-size: 18px; color: #1e293b;">
                                ${m.name} ${m.isDeceased ? '🕊️' : ''}
                            </h2>
                            <div style="color: #64748b; font-size: 13px; margin-bottom: 15px;">
                                ${m.gender === 'male' ? 'Laki-laki' : 'Perempuan'} | 
                                ${m.birthDate || '?'} ${m.isDeceased ? `- ${m.deathDate || '?'}` : '- Sekarang'}
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
                                ${m.phone ? `<div><strong>📞 Telepon:</strong><br>${m.phone}</div>` : ''}
                                ${m.occupation ? `<div><strong>💼 Pekerjaan:</strong><br>${m.occupation}</div>` : ''}
                                ${m.address ? `<div style="grid-column: span 2;"><strong>📍 Domisili:</strong> ${m.address}</div>` : ''}
                                ${parentNames.length > 0 ? `<div style="grid-column: span 2;"><strong>Orang Tua:</strong> ${parentNames.join(', ')}</div>` : ''}
                                ${spouseNames.length > 0 ? `<div style="grid-column: span 2;"><strong>Pasangan:</strong> ${spouseNames.join(', ')}</div>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        pageContainer.innerHTML = `
            <div style="${styles}">
                <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">Direktori Anggota (${i + 1} - ${i + chunk.length})</h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    ${cardsHtml}
                </div>
                <div style="text-align: center; color: #94a3b8; font-size: 10px; margin-top: 40px;">
                    Halaman ${Math.floor(i / MEMBERS_PER_PAGE) + 2} - Buku Keluarga
                </div>
            </div>
        `;



        await addToPdf(pageContainer);
        document.body.removeChild(pageContainer);
    }

    return pdf;
};
