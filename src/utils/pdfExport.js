import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate PDF Book using a sandboxed iframe to avoid Tailwind CSS v4 OKLCH color parsing errors.
 */
export const generatePDFBook = async (members, options = {}) => {
    const { includeStats = true, includePhotos = true } = options;
    const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();

    // 1. Create a sandboxed iframe to render content without global CSS interference
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '800px';
    iframe.style.height = '1000px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    background: #ffffff; 
                    margin: 0; 
                    padding: 0;
                    color: #1e293b;
                }
                .pdf-page {
                    width: 794px;
                    padding: 40px;
                    box-sizing: border-box;
                    background: #ffffff;
                }
                .header {
                    background: #1e293b;
                    color: #ffffff;
                    padding: 40px 20px;
                    text-align: center;
                    border-radius: 12px;
                    margin-bottom: 30px;
                }
                .section-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #1e293b;
                    border-bottom: 3px solid #3b82f6;
                    display: inline-block;
                    padding-bottom: 8px;
                    margin-bottom: 24px;
                    margin-top: 20px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .stat-card {
                    background: #ffffff;
                    padding: 25px;
                    border-radius: 12px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                }
                .stat-value { font-size: 40px; font-weight: bold; color: #3b82f6; }
                .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; }
                
                .member-card {
                    background: #ffffff;
                    padding: 25px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 20px;
                    display: flex;
                    gap: 20px;
                }
                .member-photo {
                    width: 90px;
                    height: 90px;
                    border-radius: 12px;
                    object-fit: cover;
                    border: 3px solid #ffffff;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .photo-placeholder {
                    width: 90px;
                    height: 90px;
                    border-radius: 12px;
                    background: #6366f1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    font-size: 32px;
                    font-weight: bold;
                }
                .member-info { flex: 1; }
                .member-name { font-size: 20px; font-weight: bold; margin: 0 0 5px 0; color: #0f172a; }
                .member-meta { font-size: 13px; color: #64748b; margin-bottom: 12px; }
                .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .detail-item { background: #f8fafc; padding: 10px; border-radius: 8px; font-size: 12px; }
                .detail-label { display: block; color: #6366f1; font-weight: bold; font-size: 10px; text-transform: uppercase; }
                .detail-value { font-weight: bold; }
                .biography { 
                    margin-top: 15px; 
                    padding: 15px; 
                    background: #fffbeb; 
                    border-left: 4px solid #f59e0b; 
                    border-radius: 4px; 
                    font-size: 12px; 
                    color: #92400e; 
                    font-style: italic;
                }
                .footer { text-align: center; color: #94a3b8; font-size: 10px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div id="pdf-content"></div>
        </body>
        </html>
    `);
    iframeDoc.close();

    const renderToIframe = async (html) => {
        const container = iframeDoc.getElementById('pdf-content');
        container.innerHTML = html;

        // Waiting for images
        const images = container.getElementsByTagName('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }));

        // Stability delay
        await new Promise(r => setTimeout(r, 200));

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = pdf.getImageProperties(imgData);
        const pdfImgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        return { imgData, pdfImgHeight };
    };

    // --- COVER PAGE ---
    const stats = includeStats ? `
        <div class="section-title">Statistik Keluarga</div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${members.length}</div>
                <div class="stat-label">Total Anggota</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${members.filter(m => !m.isDeceased).length}</div>
                <div class="stat-label">Masih Hidup</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${members.filter(m => m.gender === 'male').length}</div>
                <div class="stat-label">Laki-laki</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${members.filter(m => m.gender === 'female').length}</div>
                <div class="stat-label">Perempuan</div>
            </div>
        </div>
    ` : '';

    const coverHtml = `
        <div class="pdf-page">
            <div class="header">
                <h1>BUKU KELUARGA</h1>
                <p>Dokumentasi Sejarah & Silsilah Keluarga</p>
                <div style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
                    Dicetak pada: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </div>
            </div>
            ${stats}
        </div>
    `;

    const coverResult = await renderToIframe(coverHtml);
    pdf.addImage(coverResult.imgData, 'JPEG', 0, 0, pdfWidth, coverResult.pdfImgHeight);

    // --- MEMBER PAGES ---
    const MEMBERS_PER_PAGE = 3;
    for (let i = 0; i < sortedMembers.length; i += MEMBERS_PER_PAGE) {
        pdf.addPage();
        const chunk = sortedMembers.slice(i, i + MEMBERS_PER_PAGE);

        const membersHtml = `
            <div class="pdf-page">
                <div class="section-title">Direktori Anggota (${i + 1} - ${i + chunk.length})</div>
                ${chunk.map(m => {
            const spouseNames = (m.spouses || []).map(s => members.find(sp => sp.id === (typeof s === 'string' ? s : s.id))?.name).filter(Boolean);
            const parentNames = (m.parents || []).map(p => members.find(par => par.id === (typeof p === 'string' ? p : p.id))?.name).filter(Boolean);

            return `
                        <div class="member-card">
                            <div class="member-header">
                                ${includePhotos && m.photo
                    ? `<img src="${m.photo}" crossOrigin="anonymous" class="member-photo">`
                    : `<div class="photo-placeholder">${m.name.charAt(0).toUpperCase()}</div>`
                }
                            </div>
                            <div class="member-info">
                                <div class="member-name">${m.name} ${m.isDeceased ? '🕊️' : ''}</div>
                                <div class="member-meta">
                                    ${m.gender === 'male' ? 'Laki-laki' : 'Perempuan'} &bull; ${m.birthDate || '?'} ${m.isDeceased ? ` s/d ${m.deathDate || '?'}` : ' (Masih Hidup)'}
                                </div>
                                <div class="detail-grid">
                                    <div class="detail-item"><span class="detail-label">Telepon</span>${m.phone || '-'}</div>
                                    <div class="detail-item"><span class="detail-label">Pekerjaan</span>${m.occupation || '-'}</div>
                                    <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">Domisili</span>${m.address || '-'}</div>
                                    <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">Orang Tua</span>${parentNames.join(', ') || '-'}</div>
                                    <div class="detail-item" style="grid-column: span 2;"><span class="detail-label">Pasangan</span>${spouseNames.join(', ') || '-'}</div>
                                </div>
                                ${m.biography ? `<div class="biography"><strong>&📜 Biografi:</strong><br>"${m.biography}"</div>` : ''}
                            </div>
                        </div>
                    `;
        }).join('')}
                <div class="footer">Halaman ${pdf.internal.getNumberOfPages()} &bull; Buku Keluarga</div>
            </div>
        `;

        const result = await renderToIframe(membersHtml);
        pdf.addImage(result.imgData, 'JPEG', 0, 0, pdfWidth, result.pdfImgHeight);
    }

    // Cleanup
    document.body.removeChild(iframe);
    return pdf;
};
