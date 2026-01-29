import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate PDF Book by rendering HTML visually (canvas) to preserve styles and encoding.
 * USES HEX COLORS ONLY TO AVOID TAILWIND OKLCH CONFLICTS.
 * @param {Array} members 
 * @param {Object} options 
 * @returns {Promise<jsPDF>}
 */
export const generatePDFBook = async (members, options = {}) => {
    const { includeStats = true, includePhotos = true } = options;

    const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();

    // STRICT VANILLA CSS ONLY - NO TAILWIND CLASSES (Avoids OKLCH errors)
    const styles = {
        container: `font-family: Arial, sans-serif; color: #1e293b; background-color: #ffffff; width: 794px; margin: 0; padding: 40px; box-sizing: border-box;`,
        header: `background-color: #1e293b; color: #ffffff; padding: 40px 20px; text-align: center; border-radius: 12px; margin-bottom: 30px;`,
        sectionTitle: `font-size: 24px; font-weight: bold; color: #1e293b; border-bottom: 3px solid #3b82f6; display: inline-block; padding-bottom: 8px; margin-bottom: 24px; margin-top: 20px;`,
        card: `background-color: #ffffff; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; display: flex; gap: 20px;`,
        photo: `width: 90px; height: 90px; border-radius: 12px; object-fit: cover; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);`,
        photoPlaceholder: `width: 90px; height: 90px; border-radius: 12px; background-color: #6366f1; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 32px; font-weight: bold;`,
        name: `font-size: 20px; font-weight: bold; color: #0f172a; margin: 0 0 4px 0;`,
        dates: `display: inline-block; padding: 4px 12px; background-color: #f1f5f9; color: #64748b; border-radius: 100px; font-size: 12px; font-weight: bold; margin-bottom: 12px;`,
        detailGrid: `display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;`,
        detailItem: `background-color: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #f1f5f9; font-size: 12px;`,
        detailLabel: `display: block; color: #6366f1; font-weight: bold; font-size: 10px; text-transform: uppercase; margin-bottom: 4px;`,
        detailValue: `font-weight: bold; color: #1e293b;`,
        biography: `margin-top: 15px; padding: 15px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 12px; color: #92400e; font-style: italic; line-height: 1.5; text-align: justify;`
    };

    const createContainer = () => {
        const div = document.createElement('div');
        div.style.cssText = `position: absolute; left: -9999px; top: 0; width: 794px; background-color: #ffffff;`;
        document.body.appendChild(div);
        return div;
    };

    const addToPdf = async (element) => {
        const images = element.getElementsByTagName('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
        }));

        // Small delay to ensure layout computation is done
        await new Promise(r => setTimeout(r, 200));

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = pdf.getImageProperties(imgData);
        const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // If height exceeds page (rare for Chunking), it might need adjustment
        // But with 3 members per page, it should fit.
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfImgHeight);
    };

    // --- PAGE 1: COVER ---
    const coverContainer = createContainer();
    const stats = includeStats ? {
        total: members.length,
        males: members.filter(m => m.gender === 'male').length,
        females: members.filter(m => m.gender === 'female').length,
        deceased: members.filter(m => m.isDeceased).length,
        alive: members.length - members.filter(m => m.isDeceased).length
    } : null;

    coverContainer.innerHTML = `
        <div style="${styles.container}">
            <div style="${styles.header}">
                <h1 style="font-size: 42px; margin: 0 0 10px 0; font-weight: bold;">BUKU KELUARGA</h1>
                <p style="font-size: 18px; opacity: 0.8;">Dokumentasi Lengkap Silsilah & Sejarah Keluarga</p>
                <div style="margin-top: 30px; font-size: 14px; opacity: 0.6;">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</div>
            </div>
            ${stats ? `
                <div style="${styles.sectionTitle}">Statistik Keluarga</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 10px;">
                    <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <div style="font-size: 48px; font-weight: bold; color: #3b82f6;">${stats.total}</div>
                        <div style="font-size: 14px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Total Anggota</div>
                    </div>
                    <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <div style="font-size: 48px; font-weight: bold; color: #22c55e;">${stats.alive}</div>
                        <div style="font-size: 14px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Masih Hidup</div>
                    </div>
                    <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <div style="font-size: 48px; font-weight: bold; color: #6366f1;">${stats.males}</div>
                        <div style="font-size: 14px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Laki-laki</div>
                    </div>
                    <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <div style="font-size: 48px; font-weight: bold; color: #ec4899;">${stats.females}</div>
                        <div style="font-size: 14px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Perempuan</div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    await addToPdf(coverContainer);
    document.body.removeChild(coverContainer);

    // --- MEMBERS PAGES ---
    const MEMBERS_PER_PAGE = 3;
    for (let i = 0; i < sortedMembers.length; i += MEMBERS_PER_PAGE) {
        pdf.addPage();
        const pageContainer = createContainer();
        const chunk = sortedMembers.slice(i, i + MEMBERS_PER_PAGE);

        pageContainer.innerHTML = `
            <div style="${styles.container}">
                <div style="${styles.sectionTitle}">Direktori Anggota (${i + 1} - ${i + chunk.length})</div>
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${chunk.map(m => {
            const spouseNames = (m.spouses || []).map(s => members.find(sp => sp.id === (typeof s === 'string' ? s : s.id))?.name).filter(Boolean);
            const parentNames = (m.parents || []).map(p => members.find(par => par.id === (typeof p === 'string' ? p : p.id))?.name).filter(Boolean);

            return `
                            <div style="${styles.card}">
                                <div style="flex-shrink: 0;">
                                    ${(includePhotos && m.photo)
                    ? `<img src="${m.photo}" crossOrigin="anonymous" style="${styles.photo}">`
                    : `<div style="${styles.photoPlaceholder}">${m.name.charAt(0).toUpperCase()}</div>`
                }
                                </div>
                                <div style="flex: 1;">
                                    <h2 style="${styles.name}">${m.name} ${m.isDeceased ? '🕊️' : ''}</h2>
                                    <div style="${styles.dates}">
                                        ${m.gender === 'male' ? 'Laki-laki' : 'Perempuan'} • ${m.birthDate || '?'} ${m.isDeceased ? ` s/d ${m.deathDate || '?'}` : ' (Masih Hidup)'}
                                    </div>
                                    <div style="${styles.detailGrid}">
                                        <div style="${styles.detailItem}"><span style="${styles.detailLabel}">Telepon</span><span style="${styles.detailValue}">${m.phone || '-'}</span></div>
                                        <div style="${styles.detailItem}"><span style="${styles.detailLabel}">Pekerjaan</span><span style="${styles.detailValue}">${m.occupation || '-'}</span></div>
                                        <div style="${styles.detailItem}; grid-column: span 2;"><span style="${styles.detailLabel}">Domisili</span><span style="${styles.detailValue}">${m.address || '-'}</span></div>
                                        <div style="${styles.detailItem}; grid-column: span 2;"><span style="${styles.detailLabel}">Orang Tua</span><span style="${styles.detailValue}">${parentNames.join(', ') || '-'}</span></div>
                                        <div style="${styles.detailItem}; grid-column: span 2;"><span style="${styles.detailLabel}">Pasangan</span><span style="${styles.detailValue}">${spouseNames.join(', ') || '-'}</span></div>
                                    </div>
                                    ${m.biography ? `<div style="${styles.biography}"><strong>📜 Biografi:</strong><br>${m.biography}</div>` : ''}
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
                <div style="text-align: center; color: #94a3b8; font-size: 10px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">Halaman ${pdf.internal.getNumberOfPages()} • Buku Keluarga</div>
            </div>
        `;
        await addToPdf(pageContainer);
        document.body.removeChild(pageContainer);
    }

    return pdf;
};
