// -----------------------------------------------------------
// 1. DATABASE HARGA PEKERJAAN & KONSTANTA
// -----------------------------------------------------------
const HARGA_PEKERJAAN = {
    "A001": { 
        nama: "Jasa Gambar Plumbing (Luas < 400m²)", 
        satuan: "m²", 
        harga: 10000
    },
    "A002": {
        nama: "Jasa Gambar Plumbing (Luas > 400m²)", 
        satuan: "m²", 
        harga: 8500
    },
    "A003": { 
        nama: "Jasa Gambar Talang Air (Luas < 400m²)", 
        satuan: "m²", 
        harga: 10000 
    },
    "A004": { 
        nama: "Jasa Gambar Talang Air (Luas > 400m²)", 
        satuan: "m²", 
        harga: 8500 
    },
    "B001": { 
        nama: "Jasa Gambar Kanopi (Luas < 400m²)", 
        satuan: "m²", 
        harga: 10000 
    },
    "B002": { 
        nama: "Jasa Gambar Kanopi (Luas > 400m²)", 
        satuan: "m²", 
        harga: 8500 
    },
    "B003": { 
        nama: "Jasa Gambar untuk Pengecoran Jalan (Luas < 400m²)", 
        satuan: "m²", 
        harga: 10000 
    },
    "B004": { 
        nama: "Jasa Gambar untuk Pengecoran Jalan (Luas > 400m²)", 
        satuan: "m²", 
        harga: 8500 
    },
    "B005": { 
        nama: "Jasa Gambar Ulang Ruangan 2D (Luas < 400m²)", 
        satuan: "m²", 
        harga: 15000 
    },
    "B006": { 
        nama: "Jasa Gambar Ulang Ruangan 2D (Luas > 400m²)", 
        satuan: "m²", 
        harga: 13000 
    },
    "B007": { 
        nama: "Jasa Gambar Ulang Ruangan 3D (Luas < 400m²)", 
        satuan: "m²", 
        harga: 18000 
    },
    "B008": { 
        nama: "Jasa Gambar Ulang Ruangan 3D (Luas > 400m²)", 
        satuan: "m²", 
        harga: 15000 
    },
    "B009": { 
        nama: "Jasa Gambar Ulang Ruangan 2D+3D (Luas > 400m²)", 
        satuan: "m²", 
        harga: 25000 
    },
    "B0010": { 
        nama: "Jasa Gambar Ulang Ruangan 2D+3D (Luas > 400m²)", 
        satuan: "m²", 
        harga: 22000 
    }
};

const KODE_REFERAL_VALID = "ASKARYA10"; // Kode Referal yang memberikan diskon 10%
const DISKON_PERSEN = 0.1; // 10%
let nextRowId = 2; // ID awal untuk baris pekerjaan berikutnya

// -----------------------------------------------------------
// 2. FUNGSI UTILITAS
// -----------------------------------------------------------

// Format angka ke mata uang Rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka).replace("Rp", "").trim();
};

// -----------------------------------------------------------
// 3. FUNGSI MANIPULASI DOM (UI)
// -----------------------------------------------------------

const isiOpsiPekerjaan = () => {
    const selects = document.querySelectorAll('.item-pekerjaan');
    selects.forEach(select => {
        while (select.options.length > 1) { select.remove(1); } // Hapus opsi lama
        
        for (const kode in HARGA_PEKERJAAN) {
            const item = HARGA_PEKERJAAN[kode];
            const option = document.createElement('option');
            option.value = kode;
            option.textContent = item.nama;
            select.appendChild(option);
        }
    });
};

const tambahBarisPekerjaan = () => {
    const container = document.getElementById('daftar-pekerjaan');
    const newRow = document.createElement('div');
    newRow.className = 'pekerjaan-row form-group';
    newRow.dataset.id = nextRowId;
    
    newRow.innerHTML = `
        <hr style="border: 0; border-top: 1px dashed #ced4da;">
        <label>Pekerjaan ${nextRowId}:</label>
        <select class="item-pekerjaan"></select>
        <label>Luas Pekerjaan (m²):</label>
        <input type="number" class="luas-input" min="0.01" step="0.01" value="1" required>
        <button type="button" class="btn btn-danger" style="margin-top:10px;" onclick="hapusBarisPekerjaan(${nextRowId})">Hapus</button>
    `;
    
    container.appendChild(newRow);
    nextRowId++;
    isiOpsiPekerjaan();
};

const hapusBarisPekerjaan = (id) => {
    const row = document.querySelector(`.pekerjaan-row[data-id="${id}"]`);
    if (row) { row.remove(); }
};

// -----------------------------------------------------------
// 4. FUNGSI GENERATE BOQ
// -----------------------------------------------------------

const generateBOQ = () => {
    const perusahaan = document.getElementById('perusahaan-pemberi').value;
    const namaPemberi = document.getElementById('nama-pemberi').value;
    const jenisPekerjaan = document.getElementById('jenis-pekerjaan').value;
    const tanggalInput = document.getElementById('tanggal-input').value;
    const kodeReferal = document.getElementById('kode-referal').value.toUpperCase().trim();
    
    const pekerjaanRows = document.querySelectorAll('.pekerjaan-row');
    const boqBody = document.getElementById('boq-body');
    let subtotalEstimasi = 0;
    let boqHtml = '';

    if (!perusahaan || !namaPemberi || !jenisPekerjaan || !tanggalInput) {
        alert("Mohon lengkapi semua data identitas proyek.");
        return;
    }

    // 1. Mengisi Kop Surat
    document.getElementById('boq-perusahaan').textContent = perusahaan;
    document.getElementById('boq-pemberi').textContent = namaPemberi;
    document.getElementById('boq-jenis').textContent = jenisPekerjaan;
    document.getElementById('boq-tanggal').textContent = new Date(tanggalInput).toLocaleDateString('id-ID');
    boqBody.innerHTML = '';
    
    // 2. Iterasi dan Hitung
    let isAnyValidJob = false;
    pekerjaanRows.forEach((row, index) => {
        const select = row.querySelector('.item-pekerjaan');
        const luasInput = row.querySelector('.luas-input');
        
        const kode = select.value;
        const luas = parseFloat(luasInput.value);
        
        if (!kode || !HARGA_PEKERJAAN[kode] || luas <= 0) { return; }

        isAnyValidJob = true;
        const item = HARGA_PEKERJAAN[kode];
        const hargaSatuan = item.harga;
        const jumlahHarga = hargaSatuan * luas;
        subtotalEstimasi += jumlahHarga;

        // Membuat baris BOQ (Sesuai Urutan: No., Uraian, Luas, Satuan, Harga Satuan, Jumlah Harga)
        boqHtml += `
            <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td>${item.nama}</td>
                <td>${luas.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
                <td style="text-align: center;">${item.satuan}</td>
                <td>${formatRupiah(hargaSatuan)}</td>
                <td>${formatRupiah(jumlahHarga)}</td>
            </tr>
        `;
    });
    
    if (!isAnyValidJob) {
        alert("Mohon pilih setidaknya satu Pekerjaan dan masukkan Luas yang valid.");
        document.getElementById('boq-output').style.display = 'none';
        return;
    }

    boqBody.innerHTML = boqHtml;
    document.getElementById('subtotal-estimasi').textContent = formatRupiah(subtotalEstimasi);
    
    // 3. Perhitungan Diskon dan Grand Total
    let diskon = 0;
    let grandTotal = subtotalEstimasi;
    const discountRow = document.getElementById('discount-display');

    if (kodeReferal === KODE_REFERAL_VALID && subtotalEstimasi > 0) {
        diskon = subtotalEstimasi * DISKON_PERSEN;
        grandTotal = subtotalEstimasi - diskon;
        
        discountRow.style.display = 'table-row';
        document.getElementById('discount-amount').textContent = formatRupiah(diskon);
    } else {
        discountRow.style.display = 'none';
    }
    
    document.getElementById('grand-total-estimasi').textContent = formatRupiah(grandTotal);

    // 4. Menampilkan area BOQ
    document.getElementById('boq-output').style.display = 'block';
};


// -----------------------------------------------------------
// 5. FUNGSI DOWNLOAD PDF (GLOBAL SCOPE)
// -----------------------------------------------------------

// Fungsi ini dipanggil oleh tombol 'Download PDF Rekapitulasi'
const downloadPDF = () => { 
    // 1. Ambil Element yang ingin dijadikan PDF
    const content = document.getElementById('boq-output');

    // Cek apakah BOQ sudah di-generate
    if (content.style.display === 'none' || content.innerHTML.trim() === '') {
        alert("Mohon klik tombol 'GENERATE BOQ' terlebih dahulu.");
        return;
    }

    // 2. Sembunyikan tombol download itu sendiri sebelum rendering
    const buttonContainer = document.querySelector('.print-buttons');
    if (buttonContainer) {
        // Sembunyikan semua tombol di container
        buttonContainer.style.display = 'none'; 
    }

    // 3. Render HTML ke Canvas menggunakan html2canvas
    html2canvas(content, {
        scale: 2, // Meningkatkan resolusi untuk hasil yang lebih jernih
        logging: true,
        useCORS: true
    }).then(canvas => {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for unit, 'a4' for size
        
        // Menghitung ukuran elemen dan ukuran PDF (A4: 210 x 297 mm)
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20; // Margin 10mm di kiri dan kanan
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let position = 10; // Posisi awal y dengan margin 10mm

        const imgData = canvas.toDataURL('image/png');

        // Menambahkan gambar ke PDF
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);

        // 4. Unduh file
        pdf.save("Rekap Biaya Jasa AS Karya.pdf");

        // 5. Tampilkan kembali tombol download setelah selesai
        if (buttonContainer) {
            buttonContainer.style.display = 'flex';
        }
    }).catch(error => {
        // Tampilkan kembali tombol jika terjadi error
        const buttonContainer = document.querySelector('.print-buttons');
        if (buttonContainer) {
            buttonContainer.style.display = 'flex';
        }
        console.error("Error saat membuat PDF:", error);
        alert("Gagal mengunduh PDF. Silakan coba Print Out.");
    });
};


// -----------------------------------------------------------
// 6. INISIALISASI
// -----------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    isiOpsiPekerjaan();
});
