import jsPDF from 'jspdf';

/**
 * Generate a comprehensive Family Book in PDF format
 * @param {Array} members - All family members
 * @param {Object} options - Export options
 * @returns {Blob} PDF file blob
 */
export const generatePDFBook = (members, options = {}) => {
    // Default options
    const { includeStats = true } = options;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let yPos = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace = 20) => {
        if (yPos + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            return true;
        }
        return false;
    };

    // Helper function to draw line
    const drawLine = (y) => {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
    };

    // === COVER PAGE ===
    doc.setFillColor(102, 126, 234); // Purple gradient start
    doc.rect(0, 0, pageWidth, 80, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('📖 Buku Keluarga', pageWidth / 2, 40, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Dokumentasi Lengkap Silsilah Keluarga', pageWidth / 2, 55, { align: 'center' });

    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.setFontSize(10);
    doc.text(`Dibuat pada: ${dateStr}`, pageWidth / 2, 70, { align: 'center' });

    // Statistics section on cover
    if (includeStats) {
        yPos = 100;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Statistik Keluarga', pageWidth / 2, yPos, { align: 'center' });

        yPos += 15;
        const totalMembers = members.length;
        const males = members.filter(m => m.gender === 'male').length;
        const females = members.filter(m => m.gender === 'female').length;
        const deceased = members.filter(m => m.isDeceased).length;
        const alive = totalMembers - deceased;

        const stats = [
            { label: 'Total Anggota', value: totalMembers, color: [59, 130, 246] },
            { label: 'Laki-laki', value: males, color: [34, 197, 94] },
            { label: 'Perempuan', value: females, color: [236, 72, 153] },
            { label: 'Masih Hidup', value: alive, color: [34, 197, 94] },
            { label: 'Sudah Meninggal', value: deceased, color: [156, 163, 175] }
        ];

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        stats.forEach((stat, idx) => {
            const x = margin + (idx % 2) * (contentWidth / 2);
            const y = yPos + Math.floor(idx / 2) * 20;

            doc.setDrawColor(...stat.color);
            doc.setFillColor(...stat.color);
            doc.rect(x, y - 5, 4, 8, 'F');

            doc.setTextColor(0, 0, 0);
            doc.text(`${stat.label}:`, x + 8, y);
            doc.setFont('helvetica', 'bold');
            doc.text(`${stat.value}`, x + 60, y);
            doc.setFont('helvetica', 'normal');
        });
    }

    // === MEMBER DIRECTORY ===
    doc.addPage();
    yPos = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('Direktori Anggota Keluarga', margin, yPos);
    yPos += 10;
    drawLine(yPos);
    yPos += 10;

    // Sort members by name
    const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));

    sortedMembers.forEach((member, index) => {
        checkPageBreak(50); // Increased space check

        // Member card background
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, yPos, contentWidth, 45, 2, 2, 'F'); // Increased height

        // Member number
        doc.setFillColor(102, 126, 234);
        doc.circle(margin + 8, yPos + 8, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}`, margin + 8, yPos + 10, { align: 'center' });

        // Member name
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const nameText = member.isDeceased ? `${member.name} 🕊️` : member.name;
        doc.text(nameText, margin + 18, yPos + 10);

        // Member details
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);

        let detailY = yPos + 18;
        const leftColX = margin + 18;
        const lineHeight = 5;

        // Gender and dates
        const genderText = member.gender === 'male' ? 'Laki-laki' : 'Perempuan';
        const dateText = member.birthDate
            ? (member.isDeceased
                ? `${member.birthDate} - ${member.deathDate || '?'}`
                : `${member.birthDate} - Sekarang`)
            : 'Tanggal lahir tidak diketahui';
        doc.text(`${genderText} | ${dateText}`, leftColX, detailY);
        detailY += lineHeight;

        // Phone - ONLY if exists
        if (member.phone) {
            doc.text(`📞 ${member.phone}`, leftColX, detailY);
            detailY += lineHeight;
        }

        // Occupation & Address
        const occupationAddr = [
            member.occupation ? `💼 ${member.occupation}` : null,
            member.address ? `📍 ${member.address}` : null
        ].filter(Boolean).join(' | ');

        if (occupationAddr) {
            // Check text width to prevent overflow
            const splitText = doc.splitTextToSize(occupationAddr, contentWidth - 25);
            doc.text(splitText, leftColX, detailY);
            detailY += (lineHeight * splitText.length);
        }

        // Parents
        if (member.parents && member.parents.length > 0) {
            const parentNames = member.parents.map(p => {
                const pid = typeof p === 'string' ? p : p?.id;
                const parent = pid ? members.find(parent => parent.id === pid) : null;
                return parent?.name || null;
            }).filter(Boolean).join(', ');

            if (parentNames) {
                const text = `Orang Tua: ${parentNames}`;
                const splitText = doc.splitTextToSize(text, contentWidth - 25);
                doc.text(splitText, leftColX, detailY);
                detailY += (lineHeight * splitText.length);
            }
        }

        // Spouses - IMPROVED LOGIC
        const spouseNames = (member.spouses || []).map(s => {
            const sid = typeof s === 'string' ? s : s?.id;
            const spouse = sid ? members.find(sp => sp.id === sid) : null;
            return spouse?.name || null;
        }).filter(Boolean);

        if (spouseNames.length > 0) {
            const text = `Pasangan: ${spouseNames.join(', ')}`;
            const splitText = doc.splitTextToSize(text, contentWidth - 25);
            doc.text(splitText, leftColX, detailY);
            detailY += (lineHeight * splitText.length);
        }

        yPos += 50; // Increased vertical spacing between cards
    });

    // === RELATIONSHIP NETWORK ===
    doc.addPage();
    yPos = margin;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text('Jaringan Hubungan Keluarga', margin, yPos);
    yPos += 10;
    drawLine(yPos);
    yPos += 15;

    // Build relationship data
    const relationships = [];
    members.forEach(m => {
        if (m.children && m.children.length > 0) {
            m.children.forEach(childId => {
                const child = members.find(c => c.id === childId);
                if (child) {
                    relationships.push({
                        parent: m.name,
                        child: child.name,
                        type: m.gender === 'male' ? 'Ayah-Anak' : 'Ibu-Anak'
                    });
                }
            });
        }
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    if (relationships.length > 0) {
        doc.text(`Total ${relationships.length} hubungan orang tua-anak tercatat`, margin, yPos);
        yPos += 10;

        relationships.slice(0, 100).forEach((rel, idx) => { // Increased limit
            checkPageBreak(8);
            doc.setFontSize(9);
            doc.text(`${idx + 1}.`, margin, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text(rel.parent, margin + 8, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text('→', margin + 70, yPos); // Arrow
            doc.setFont('helvetica', 'bold');
            doc.text(rel.child, margin + 78, yPos);

            // Align type to right
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`(${rel.type})`, margin + 140, yPos);
            doc.setTextColor(0, 0, 0);

            yPos += 6;
        });

        if (relationships.length > 100) {
            yPos += 5;
            doc.setTextColor(156, 163, 175);
            doc.text(`... dan ${relationships.length - 100} hubungan lainnya`, margin, yPos);
        }
    } else {
        doc.setTextColor(156, 163, 175);
        doc.text('Tidak ada data hubungan orang tua-anak', margin, yPos);
    }


    // === FOOTER ON EACH PAGE ===
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Halaman ${i} dari ${totalPages} | Buku Keluarga - ${dateStr}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    return doc;
};
