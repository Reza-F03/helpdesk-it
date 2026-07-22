// PATCH untuk downloadLogsReport() - Convert ke Excel
// Copy paste function ini untuk replace downloadLogsReport() di dashboard.js

/**
 * Download Logs Report as Excel (.xlsx)
 */
async function downloadLogsReport(buttonElement) {
    // Validate parameters
    if (!buttonElement) {
        console.error('[downloadLogsReport] ERROR: buttonElement is undefined');
        alert('Error: Button element tidak ditemukan');
        return;
    }

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        alert('Library Excel belum ter-load. Refresh halaman dan coba lagi.');
        return;
    }

    try {
        console.log('[downloadLogsReport] START');
        console.log('[downloadLogsReport] API_BASE_URL:', API_BASE_URL);
        console.log('[downloadLogsReport] authToken:', authToken ? 'ada' : 'TIDAK ADA');
        
        // Show loading indicator
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '⏳ Memproses...';
        buttonElement.disabled = true;
        
        // Fetch logs with pagination (max 100 per request due to validation)
        let allLogs = [];
        let page = 1;
        let hasMore = true;
        const limit = 100; // Max allowed by validation
        
        console.log('[downloadLogsReport] Fetching logs with pagination...');
        
        while (hasMore) {
            const url = `${API_BASE_URL}/logs?page=${page}&limit=${limit}`;
            console.log(`[downloadLogsReport] Fetching page ${page}: ${url}`);
            
            const response = await fetch(url, {
                headers: { 
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`[downloadLogsReport] Page ${page} response status:`, response.status);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Handle different response structures
            const logs = Array.isArray(data.data)
                ? data.data
                : Array.isArray(data.data?.logs)
                    ? data.data.logs
                    : [];
            
            console.log(`[downloadLogsReport] Page ${page} found ${logs.length} logs`);
            
            if (logs.length > 0) {
                allLogs = allLogs.concat(logs);
                page++;
                // If we got less than limit, no more pages
                hasMore = logs.length === limit;
            } else {
                hasMore = false;
            }
            
            // Safety limit - max 10 pages (1000 logs)
            if (page > 10) {
                console.log('[downloadLogsReport] Reached safety limit (10 pages)');
                hasMore = false;
            }
        }
        
        console.log(`[downloadLogsReport] Total logs fetched: ${allLogs.length}`);
        
        if (allLogs.length === 0) {
            alert('Tidak ada data log untuk di-download');
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
            return;
        }
        
        // Prepare Excel data
        const excelData = [
            // Header row
            ['No', 'Tanggal & Waktu', 'Aksi', 'Deskripsi', 'User', 'Role User', 'Nomor Tiket', 'Judul Tiket']
        ];
        
        // Data rows
        allLogs.forEach((log, index) => {
            excelData.push([
                index + 1,
                formatDateTimeForExport(log.created_at),
                translateAction(log.action),
                translateDescription(log.description) || '-',
                log.user?.full_name || '-',
                log.user?.role ? translateRole(log.user.role) : '-',
                log.ticket?.ticket_number || '-',
                log.ticket?.title || '-'
            ]);
        });
        
        // Create worksheet and workbook
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 5 },   // No
            { wch: 20 },  // Tanggal & Waktu
            { wch: 18 },  // Aksi
            { wch: 40 },  // Deskripsi
            { wch: 20 },  // User
            { wch: 12 },  // Role User
            { wch: 25 },  // Nomor Tiket
            { wch: 40 }   // Judul Tiket
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Log Aktivitas');
        
        // Generate Excel file and download
        XLSX.writeFile(wb, `Log_Aktivitas_${formatDateForFilename()}.xlsx`);
        
        console.log('[downloadLogsReport] Download complete');
        alert(`✅ ${allLogs.length} log aktivitas berhasil di-download!\n\nFile: Log_Aktivitas_${formatDateForFilename()}.xlsx`);
        
        // Restore button
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
        
    } catch (error) {
        console.error('[downloadLogsReport] CATCH ERROR');
        console.error('[downloadLogsReport] Error type:', error.constructor.name);
        console.error('[downloadLogsReport] Error message:', error.message);
        console.error('[downloadLogsReport] Error stack:', error.stack);
        
        let errorMessage = 'Gagal download log aktivitas';
        
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            errorMessage = 'Gagal menghubungi server. Pastikan:\n' +
                          '1. Koneksi internet aktif\n' +
                          '2. Server berjalan di ' + API_BASE_URL + '\n' +
                          '3. Token login masih valid';
        } else if (error.message) {
            errorMessage += ': ' + error.message;
        }
        
        alert(errorMessage);
        
        if (buttonElement) {
            buttonElement.textContent = '📥 Download';
            buttonElement.disabled = false;
        }
    }
}
