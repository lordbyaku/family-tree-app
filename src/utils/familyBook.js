import * as XLSX from 'xlsx';
const { utils } = XLSX;
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a detailed Excel workbook with family data
 * @param {Array} members - All family members
 * @param {Object} options - Export options
 * @returns {Blob} Excel file blob
 */
export const generateExcelBook = (members, options = {}) => {
    const workbook = utils.book_new();

    // Sheet 1: Members Directory
    const membersData = members.map(m => ({
        'Nama': m.name,
        'Jenis Kelamin': m.gender === 'male' ? 'Laki-laki' : 'Perempuan',
        'Tanggal Lahir': m.birthDate || '',
        'Tanggal Wafat': m.isDeceased ? (m.deathDate || '') : '',
        'Status': m.isDeceased ? 'Meninggal' : 'Masih Hidup',
        'Telepon': m.phone || '',
        'Pekerjaan': m.occupation || '',
        'Domisili': m.address || '',
        'Orang Tua': m.parents?.map(p => {
            const pid = typeof p === 'string' ? p : p?.id;
            return pid ? members.find(parent => parent.id === pid)?.name : null;
        }).filter(Boolean).join(', ') || '',
        'Pasangan': m.spouses?.map(s => {
            const sid = typeof s === 'string' ? s : s?.id;
            return sid ? members.find(spouse => spouse.id === sid)?.name : null;
        }).filter(Boolean).join(', ') || '',
        'Jumlah Anak': m.children?.length || 0,
        'Biografi': m.biography || ''
    }));

    const membersSheet = utils.json_to_sheet(membersData);
    utils.book_append_sheet(workbook, membersSheet, 'Direktori Anggota');

    // Sheet 2: Statistics
    if (options.includeStats) {
        const totalMembers = members.length;
        const males = members.filter(m => m.gender === 'male').length;
        const females = members.filter(m => m.gender === 'female').length;
        const deceased = members.filter(m => m.isDeceased).length;
        const alive = totalMembers - deceased;

        const statsData = [
            { 'Kategori': 'Total Anggota', 'Jumlah': totalMembers },
            { 'Kategori': 'Laki-laki', 'Jumlah': males },
            { 'Kategori': 'Perempuan', 'Jumlah': females },
            { 'Kategori': 'Masih Hidup', 'Jumlah': alive },
            { 'Kategori': 'Sudah Meninggal', 'Jumlah': deceased }
        ];

        const statsSheet = utils.json_to_sheet(statsData);
        utils.book_append_sheet(workbook, statsSheet, 'Statistik');
    }

    // Sheet 3: Relationships
    const relationshipsData = [];
    members.forEach(m => {
        if (m.children && m.children.length > 0) {
            m.children.forEach(childId => {
                const child = members.find(c => c.id === childId);
                if (child) {
                    relationshipsData.push({
                        'Orang Tua': m.name,
                        'Anak': child.name,
                        'Jenis': m.gender === 'male' ? 'Ayah-Anak' : 'Ibu-Anak'
                    });
                }
            });
        }
    });

    if (relationshipsData.length > 0) {
        const relSheet = utils.json_to_sheet(relationshipsData);
        utils.book_append_sheet(workbook, relSheet, 'Hubungan Keluarga');
    }

    return workbook;
};

/**
 * Generate Excel template for importing family data
 * @returns {Blob} Excel file blob with template
 */
export const generateExcelTemplate = () => {
    const workbook = utils.book_new();

    // Template data dengan contoh
    const templateData = [
        {
            'Nama': 'Contoh: Budi Santoso',
            'Jenis Kelamin': 'Laki-laki',
            'Tanggal Lahir': '01/01/1950',
            'Tempat Lahir': 'Jakarta',
            'Tanggal Wafat': '',
            'Status': 'Masih Hidup',
            'Telepon': '081234567890',
            'Email': 'budi@email.com',
            'Pekerjaan': 'Dokter',
            'Pendidikan': 'S1 Kedokteran',
            'Domisili': 'Jl. Sudirman No. 1, Jakarta',
            'Orang Tua': 'Nama Ayah, Nama Ibu',
            'Pasangan': 'Nama Pasangan',
            'Biografi': 'Cerita singkat tentang kehidupan'
        },
        {
            'Nama': '',
            'Jenis Kelamin': '',
            'Tanggal Lahir': '',
            'Tempat Lahir': '',
            'Tanggal Wafat': '',
            'Status': '',
            'Telepon': '',
            'Email': '',
            'Pekerjaan': '',
            'Pendidikan': '',
            'Domisili': '',
            'Orang Tua': '',
            'Pasangan': '',
            'Biografi': ''
        }
    ];

    const templateSheet = utils.json_to_sheet(templateData);

    // Set column widths
    templateSheet['!cols'] = [
        { wch: 25 },  // Nama
        { wch: 15 },  // Jenis Kelamin
        { wch: 15 },  // Tanggal Lahir
        { wch: 20 },  // Tempat Lahir
        { wch: 15 },  // Tanggal Wafat
        { wch: 15 },  // Status
        { wch: 15 },  // Telepon
        { wch: 25 },  // Email
        { wch: 20 },  // Pekerjaan
        { wch: 20 },  // Pendidikan
        { wch: 30 },  // Domisili
        { wch: 30 },  // Orang Tua
        { wch: 25 },  // Pasangan
        { wch: 40 }   // Biografi
    ];

    utils.book_append_sheet(workbook, templateSheet, 'Data Keluarga');

    // Sheet 2: Instruksi
    const instruksiData = [
        { 'Kolom': 'Nama', 'Wajib': 'YA', 'Format': 'Text', 'Contoh': 'Budi Santoso', 'Keterangan': 'Nama lengkap anggota keluarga' },
        { 'Kolom': 'Jenis Kelamin', 'Wajib': 'YA', 'Format': 'Laki-laki / Perempuan', 'Contoh': 'Laki-laki', 'Keterangan': 'Harus persis: "Laki-laki" atau "Perempuan"' },
        { 'Kolom': 'Tanggal Lahir', 'Wajib': 'YA', 'Format': 'DD/MM/YYYY', 'Contoh': '15/08/1945', 'Keterangan': 'Format tanggal Indonesia' },
        { 'Kolom': 'Tempat Lahir', 'Wajib': 'Tidak', 'Format': 'Text', 'Contoh': 'Jakarta', 'Keterangan': 'Kota/tempat kelahiran' },
        { 'Kolom': 'Tanggal Wafat', 'Wajib': 'Tidak', 'Format': 'DD/MM/YYYY', 'Contoh': '12/02/2020', 'Keterangan': 'Kosongkan jika masih hidup' },
        { 'Kolom': 'Status', 'Wajib': 'YA', 'Format': 'Masih Hidup / Meninggal', 'Contoh': 'Masih Hidup', 'Keterangan': 'Status kehidupan saat ini' },
        { 'Kolom': 'Telepon', 'Wajib': 'Tidak', 'Format': 'Text/Number', 'Contoh': '081234567890', 'Keterangan': 'Nomor telepon/HP' },
        { 'Kolom': 'Email', 'Wajib': 'Tidak', 'Format': 'Text', 'Contoh': 'email@domain.com', 'Keterangan': 'Alamat email' },
        { 'Kolom': 'Pekerjaan', 'Wajib': 'Tidak', 'Format': 'Text', 'Contoh': 'Dokter', 'Keterangan': 'Profesi/pekerjaan' },
        { 'Kolom': 'Pendidikan', 'Wajib': 'Tidak', 'Format': 'Text', 'Contoh': 'S1 Kedokteran', 'Keterangan': 'Pendidikan terakhir' },
        { 'Kolom': 'Domisili', 'Wajib': 'Tidak', 'Format': 'Text', 'Contoh': 'Jl. Sudirman No. 1', 'Keterangan': 'Alamat tempat tinggal' },
        { 'Kolom': 'Orang Tua', 'Wajib': 'Tidak', 'Format': 'Nama, Nama', 'Contoh': 'Ayah Budi, Ibu Budi', 'Keterangan': 'Nama orang tua (pisahkan dengan koma). Nama HARUS SAMA dengan kolom Nama' },
        { 'Kolom': 'Pasangan', 'Wajib': 'Tidak', 'Format': 'Nama', 'Contoh': 'Siti Rahayu', 'Keterangan': 'Nama pasangan. Nama HARUS SAMA dengan kolom Nama' },
        { 'Kolom': 'Biografi', 'Wajib': 'Tidak', 'Format': 'Text', 'Contoh': 'Cerita kehidupan...', 'Keterangan': 'Cerita singkat kehidupan anggota' }
    ];

    const instruksiSheet = utils.json_to_sheet(instruksiData);
    instruksiSheet['!cols'] = [
        { wch: 20 },
        { wch: 10 },
        { wch: 25 },
        { wch: 25 },
        { wch: 60 }
    ];
    utils.book_append_sheet(workbook, instruksiSheet, 'Instruksi');

    // Sheet 3: Tips & Catatan Penting
    const tipsData = [
        { 'No': 1, 'Tips': 'URUTAN INPUT', 'Detail': 'Input dari generasi tertua ke termuda (Kakek-Nenek dulu, baru anak-cucu)' },
        { 'No': 2, 'Tips': 'NAMA HARUS SAMA', 'Detail': 'Untuk relasi (Orang Tua & Pasangan), nama HARUS PERSIS SAMA dengan yang ada di kolom Nama' },
        { 'No': 3, 'Tips': 'FORMAT TANGGAL', 'Detail': 'Gunakan format DD/MM/YYYY, contoh: 15/08/1945 untuk 15 Agustus 1945' },
        { 'No': 4, 'Tips': 'JENIS KELAMIN', 'Detail': 'Harus tepat: "Laki-laki" atau "Perempuan" (dengan huruf besar di awal)' },
        { 'No': 5, 'Tips': 'STATUS', 'Detail': 'Harus tepat: "Masih Hidup" atau "Meninggal"' },
        { 'No': 6, 'Tips': 'MULTIPLE ORANG TUA', 'Detail': 'Pisahkan dengan koma, contoh: "Ahmad Santoso, Siti Aminah"' },
        { 'No': 7, 'Tips': 'HAPUS BARIS CONTOH', 'Detail': 'Sebelum import, HAPUS baris pertama yang berisi "Contoh: Budi Santoso"' },
        { 'No': 8, 'Tips': 'BACKUP DATA', 'Detail': 'Selalu backup data existing sebelum import data baru' },
        { 'No': 9, 'Tips': 'IMPORT BERTAHAP', 'Detail': 'Untuk data banyak, import bertahap per 20-30 orang lebih aman' },
        { 'No': 10, 'Tips': 'CEK HASIL', 'Detail': 'Setelah import, cek pohon keluarga untuk memastikan relasi sudah benar' }
    ];

    const tipsSheet = utils.json_to_sheet(tipsData);
    tipsSheet['!cols'] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 80 }
    ];
    utils.book_append_sheet(workbook, tipsSheet, 'Tips Penting');

    return workbook;
};

/**
 * Generate an HTML family book
 * @param {Array} members - All family members
 * @param {Object} options - Export options
 * @returns {string} HTML content
 */
export const generateHTMLBook = (members, options = {}) => {
    const totalMembers = members.length;
    const males = members.filter(m => m.gender === 'male').length;
    const females = members.filter(m => m.gender === 'female').length;
    const deceased = members.filter(m => m.isDeceased).length;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buku Keluarga - Silsilah Keluarga</title>
    <style>
        :root {
            --primary: #2563eb;
            --primary-dark: #1e40af;
            --secondary: #64748b;
            --accent: #f59e0b;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #0f172a;
            --text-muted: #475569;
            --border: #e2e8f0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: var(--text-main);
            background: var(--bg);
            padding-bottom: 50px;
        }
        .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 80px 40px;
            text-align: center;
            border-radius: 24px;
            margin-bottom: 50px;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: url('https://www.transparenttextures.com/patterns/cubes.png');
            opacity: 0.1;
        }
        .header h1 { font-size: 3.5em; margin-bottom: 15px; letter-spacing: -0.02em; font-weight: 800; }
        .header p { font-size: 1.25em; opacity: 0.8; font-weight: 300; }
        
        /* Stats */
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 60px;
        }
        .stat-card {
            background: var(--card-bg);
            padding: 30px 20px;
            border-radius: 20px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            text-align: center;
            border: 1px solid var(--border);
            transition: transform 0.3s ease;
        }
        .stat-card h3 { color: var(--primary); font-size: 2.5em; margin-bottom: 5px; font-weight: 700; }
        .stat-card p { color: var(--text-muted); font-size: 0.9em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        
        /* Section Title */
        .section-title {
            font-size: 1.8em;
            font-weight: 700;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid var(--primary);
            display: inline-block;
        }

        /* Members */
        .members { display: grid; grid-template-columns: 1fr; gap: 40px; }
        .member-card {
            background: var(--card-bg);
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
            border: 1px solid var(--border);
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            gap: 30px;
        }
        .member-header {
            display: flex;
            align-items: center;
            gap: 30px;
        }
        .member-photo {
            width: 140px;
            height: 140px;
            border-radius: 24px;
            object-fit: cover;
            border: 4px solid white;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .member-photo-placeholder {
            width: 140px;
            height: 140px;
            border-radius: 24px;
            background: linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3.5em;
            font-weight: 800;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .member-info h2 { font-size: 2.2em; color: var(--text-main); margin-bottom: 8px; font-weight: 800; letter-spacing: -0.02em; }
        .member-info .dates { 
            display: inline-block;
            padding: 6px 16px;
            background: #f1f5f9;
            color: var(--text-muted);
            border-radius: 100px;
            font-size: 0.95em;
            font-weight: 600;
        }
        .member-details { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
            gap: 20px; 
        }
        .detail-item { 
            padding: 20px; 
            background: #f8fafc; 
            border-radius: 16px; 
            border: 1px solid var(--border);
        }
        .detail-item strong { 
            display: block; 
            color: var(--primary); 
            font-size: 0.8em; 
            text-transform: uppercase; 
            letter-spacing: 0.05em;
            margin-bottom: 8px; 
        }
        .detail-item span { font-weight: 600; color: var(--text-main); }
        
        .biography {
            padding: 30px;
            background: #fffbeb;
            border-left: 6px solid var(--accent);
            border-radius: 0 20px 20px 0;
            font-size: 1.1em;
            line-height: 1.7;
            color: #92400e;
        }
        .biography strong { color: var(--accent); display: block; margin-bottom: 10px; font-size: 0.9em; text-transform: uppercase; }
        
        /* Print Styles */
        @media print {
            body { background: white; padding: 0; }
            .container { max-width: 100%; padding: 0; }
            .member-card { 
                box-shadow: none; 
                border: 1px solid #eee; 
                margin-bottom: 20px;
                page-break-inside: avoid;
            }
            .header { border-radius: 0; box-shadow: none; background: #1e293b !important; color: white !important; -webkit-print-color-adjust: exact; }
            .stat-card { border: 1px solid #eee; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Silsilah Keluarga</h1>
            <p>Dokumentasi Sejarah dan Relasi Anggota Keluarga</p>
            <div style="margin-top: 30px; font-size: 0.9em; font-weight: 500; opacity: 0.7;">
                🗓️ Dibuat pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
        
        ${options.includeStats ? `
        <h2 class="section-title">📊 Statistik Keluarga</h2>
        <div class="stats">
            <div class="stat-card">
                <h3>${totalMembers}</h3>
                <p>Anggota</p>
            </div>
            <div class="stat-card">
                <h3>${males}</h3>
                <p>Laki-laki</p>
            </div>
            <div class="stat-card">
                <h3>${females}</h3>
                <p>Perempuan</p>
            </div>
            <div class="stat-card">
                <h3>${totalMembers - deceased}</h3>
                <p>Masih Hidup</p>
            </div>
        </div>
        ` : ''}
        
        <h2 class="section-title">👥 Direktori Anggota</h2>
        <div class="members">
            ${members.map(m => `
                <div class="member-card">
                    <div class="member-header">
                        ${options.includePhotos && m.photo ? `
                            <img src="${m.photo}" alt="${m.name}" class="member-photo" crossOrigin="anonymous">
                        ` : `
                            <div class="member-photo-placeholder">
                                ${m.name.charAt(0).toUpperCase()}
                            </div>
                        `}
                        <div class="member-info">
                            <h2>${m.name} ${m.isDeceased ? '🕊️' : ''}</h2>
                            <span class="dates">
                                ${m.birthDate || 'Tanggal Lahir Tidak Diketahui'} ${m.isDeceased ? `- ${m.deathDate || '?'}` : '(Masih Hidup)'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="member-details">
                        <div class="detail-item">
                            <strong>Jenis Kelamin</strong>
                            <span>${m.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
                        </div>
                        ${m.phone ? `
                            <div class="detail-item">
                                <strong>Nomor Telepon</strong>
                                <span>${m.phone}</span>
                            </div>
                        ` : ''}
                        ${m.occupation ? `
                            <div class="detail-item">
                                <strong>Pekerjaan</strong>
                                <span>${m.occupation}</span>
                            </div>
                        ` : ''}
                        ${m.address ? `
                            <div class="detail-item">
                                <strong>Domisili</strong>
                                <span>${m.address}</span>
                            </div>
                        ` : ''}
                        ${m.parents && m.parents.length > 0 ? `
                            <div class="detail-item">
                                <strong>Orang Tua</strong>
                                <span>${m.parents.map(p => {
        const pid = typeof p === 'string' ? p : p?.id;
        return pid ? members.find(parent => parent.id === pid)?.name : null;
    }).filter(Boolean).join(', ')}</span>
                            </div>
                        ` : ''}
                        ${(() => {
            const spouseNames = (m.spouses || []).map(s => {
                const sid = typeof s === 'string' ? s : s?.id;
                const spouse = sid ? members.find(sp => sp.id === sid) : null;
                return spouse?.name || null;
            }).filter(Boolean);
            return spouseNames.length > 0 ? `
                            <div class="detail-item">
                                <strong>Pasangan</strong>
                                <span>${(m.spouses || []).map(s => {
                const sid = typeof s === 'string' ? s : s?.id;
                return sid ? members.find(spouse => spouse.id === sid)?.name : null;
            }).filter(Boolean).join(', ')}</span>
                            </div>
                        ` : '';
        })()}
                        ${m.children && m.children.length > 0 ? `
                            <div class="detail-item">
                                <strong>Keturunan (${m.children.length})</strong>
                                <span>${m.children.map(cid => members.find(c => c.id === cid)?.name).filter(Boolean).join(', ')}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${m.biography ? `
                        <div class="biography">
                            <strong>📜 Biografi</strong>
                            "${m.biography}"
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div >
    </div >

    <button onclick="window.print()" style="position: fixed; bottom: 30px; right: 30px; padding: 15px 25px; background: #2563eb; color: white; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; box-shadow: 0 10px 15px rgba(0,0,0,0.1); display: flex; items-center: center; gap: 10px; z-index: 1000;" class="no-print">
        <span>🖨️ Cetak / Simpan PDF</span>
    </button>

    <style>
        @media print {
            .no-print { display: none !important; }
        }
    </style>
</body >
</html > `;

    return html;
};

/**
 * Export family book to PDF
 * @param {Array} members - All family members
 * @param {Object} options - Export options
 * @returns {Promise<void>}
 */
export const exportToPDF = async (members, options = {}) => {
    const html = generateHTMLBook(members, options);

    // Create a hidden container to render HTML
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1000px'; // Fixed width for consistent layout
    container.style.background = '#f8fafc';
    container.innerHTML = html;
    document.body.appendChild(container);

    // Wait for all images to load
    const images = container.getElementsByTagName('img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    });
    await Promise.all(imagePromises);

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#f8fafc'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = pdfHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        // Add subsequent pages if content overflows
        while (heightLeft > 0) {
            position = heightLeft - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;
        }

        const treeSlug = members[0]?.tree_slug || 'keluarga';
        pdf.save(`buku - keluarga - ${treeSlug} -${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    } finally {
        document.body.removeChild(container);
    }
};
