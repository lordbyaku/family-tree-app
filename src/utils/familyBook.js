import XLSX from 'xlsx';

/**
 * Generate a detailed Excel workbook with family data
 * @param {Array} members - All family members
 * @param {Object} options - Export options
 * @returns {Blob} Excel file blob
 */
export const generateExcelBook = (members, options = {}) => {
    const workbook = XLSX.utils.book_new();

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
            const pid = typeof p === 'string' ? p : p.id;
            return members.find(parent => parent.id === pid)?.name;
        }).filter(Boolean).join(', ') || '',
        'Pasangan': m.spouses?.map(s => {
            const sid = typeof s === 'string' ? s : s.id;
            return members.find(spouse => spouse.id === sid)?.name;
        }).filter(Boolean).join(', ') || '',
        'Jumlah Anak': m.children?.length || 0,
        'Biografi': m.biography || ''
    }));

    const membersSheet = XLSX.utils.json_to_sheet(membersData);
    XLSX.utils.book_append_sheet(workbook, membersSheet, 'Direktori Anggota');

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

        const statsSheet = XLSX.utils.json_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistik');
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
        const relSheet = XLSX.utils.json_to_sheet(relationshipsData);
        XLSX.utils.book_append_sheet(workbook, relSheet, 'Hubungan Keluarga');
    }

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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 20px;
            text-align: center;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 3em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        
        /* Stats */
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-card h3 { color: #667eea; font-size: 2.5em; margin-bottom: 10px; }
        .stat-card p { color: #666; font-size: 1.1em; }
        
        /* Members */
        .members { display: grid; gap: 30px; }
        .member-card {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            page-break-inside: avoid;
        }
        .member-header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        .member-photo {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid #667eea;
        }
        .member-photo-placeholder {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 2.5em;
            font-weight: bold;
        }
        .member-info h2 { color: #333; margin-bottom: 5px; }
        .member-info .dates { color: #666; font-size: 0.95em; }
        .member-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .detail-item { padding: 10px; background: #f9f9f9; border-radius: 5px; }
        .detail-item strong { display: block; color: #667eea; margin-bottom: 5px; }
        .biography {
            margin-top: 20px;
            padding: 20px;
            background: #f9f9f9;
            border-left: 4px solid #667eea;
            border-radius: 5px;
            font-style: italic;
        }
        
        /* Print Styles */
        @media print {
            body { background: white; }
            .header { background: #667eea; }
            .member-card { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📖 Buku Keluarga</h1>
            <p>Dokumentasi Lengkap Silsilah Keluarga</p>
            <p style="margin-top: 10px; font-size: 0.9em;">Dibuat pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        ${options.includeStats ? `
        <div class="stats">
            <div class="stat-card">
                <h3>${totalMembers}</h3>
                <p>Total Anggota</p>
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
        
        <div class="members">
            ${members.map(m => `
                <div class="member-card">
                    <div class="member-header">
                        ${options.includePhotos && m.photo ? `
                            <img src="${m.photo}" alt="${m.name}" class="member-photo">
                        ` : `
                            <div class="member-photo-placeholder">
                                ${m.name.charAt(0).toUpperCase()}
                            </div>
                        `}
                        <div class="member-info">
                            <h2>${m.name} ${m.isDeceased ? '🕊️' : ''}</h2>
                            <p class="dates">
                                ${m.birthDate || '?'} ${m.isDeceased ? `- ${m.deathDate || '?'}` : '- Sekarang'}
                            </p>
                        </div>
                    </div>
                    
                    <div class="member-details">
                        <div class="detail-item">
                            <strong>Jenis Kelamin</strong>
                            ${m.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                        </div>
                        ${m.occupation ? `
                            <div class="detail-item">
                                <strong>Pekerjaan</strong>
                                ${m.occupation}
                            </div>
                        ` : ''}
                        ${m.address ? `
                            <div class="detail-item">
                                <strong>Domisili</strong>
                                ${m.address}
                            </div>
                        ` : ''}
                        ${m.parents && m.parents.length > 0 ? `
                            <div class="detail-item">
                                <strong>Orang Tua</strong>
                                ${m.parents.map(p => {
        const pid = typeof p === 'string' ? p : p.id;
        return members.find(parent => parent.id === pid)?.name;
    }).filter(Boolean).join(', ')}
                            </div>
                        ` : ''}
                        ${m.spouses && m.spouses.length > 0 ? `
                            <div class="detail-item">
                                <strong>Pasangan</strong>
                                ${m.spouses.map(s => {
        const sid = typeof s === 'string' ? s : s.id;
        return members.find(spouse => spouse.id === sid)?.name;
    }).filter(Boolean).join(', ')}
                            </div>
                        ` : ''}
                        ${m.children && m.children.length > 0 ? `
                            <div class="detail-item">
                                <strong>Anak (${m.children.length})</strong>
                                ${m.children.map(cid => members.find(c => c.id === cid)?.name).filter(Boolean).join(', ')}
                            </div>
                        ` : ''}
                    </div>
                    
                    ${m.biography ? `
                        <div class="biography">
                            <strong style="color: #667eea; font-style: normal; display: block; margin-bottom: 10px;">Biografi</strong>
                            "${m.biography}"
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    return html;
};
