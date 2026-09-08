import PDFDocument from 'pdfkit';

/**
 * Generates a professional PDF billing report.
 * Returns a Buffer containing the PDF data.
 *
 * @param {Object} params
 * @param {string} params.dateStr - Human readable date string (e.g., "23 Juni 2026")
 * @param {Object} params.dueTodayCustomers - Map of customerId -> { customer, invoices, totalAmount }
 * @param {Object} params.overdueCustomers - Map of customerId -> { customer, invoices, totalAmount }
 * @param {string[]} params.todayKeys - Keys of dueTodayCustomers
 * @param {string[]} params.overdueKeys - Keys of overdueCustomers
 * @param {number} params.totalTodayAmount
 * @param {number} params.totalOverdueAmount
 * @param {number} params.todayCount
 * @param {number} params.overdueCount
 * @param {Function} params.formatRupiah
 * @param {Function} params.getReadableMonth
 * @returns {Promise<Buffer>}
 */
export async function generateBillingPDF({
  dateStr,
  dueTodayCustomers,
  overdueCustomers,
  todayKeys,
  overdueKeys,
  totalTodayAmount,
  totalOverdueAmount,
  todayCount,
  overdueCount,
  formatRupiah,
  getReadableMonth,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
        info: {
          Title: `Laporan Penagihan DaraNet - ${dateStr}`,
          Author: 'DaraNet ISP Billing System',
          Subject: 'Laporan Tunggakan Pelanggan',
        }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ── Color palette ──
      const colors = {
        primary: '#1a1a2e',      // Dark navy
        secondary: '#16213e',    // Darker navy
        accent: '#0f3460',       // Blue accent
        highlight: '#e94560',    // Rose/red for overdue
        teal: '#00b4d8',         // Teal for due today
        gold: '#f4a261',         // Gold/amber for totals
        white: '#ffffff',
        lightGray: '#f0f0f5',
        mediumGray: '#6c757d',
        darkText: '#2d2d2d',
        tableBorder: '#dee2e6',
        tableHeaderBg: '#1a1a2e',
        tableAltRow: '#f8f9fc',
        successGreen: '#2ecc71',
        warningOrange: '#e67e22',
      };

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const contentWidth = pageWidth - 80; // 40 margin each side

      // ── Helper: Draw rounded rectangle ──
      const drawRoundedRect = (x, y, w, h, r, fillColor, strokeColor) => {
        doc.save();
        doc.roundedRect(x, y, w, h, r);
        if (fillColor) {
          doc.fill(fillColor);
        }
        if (strokeColor) {
          doc.roundedRect(x, y, w, h, r);
          doc.strokeColor(strokeColor).lineWidth(0.5).stroke();
        }
        doc.restore();
      };

      // ══════════════════════════════════════════
      // PAGE 1: HEADER & SUMMARY
      // ══════════════════════════════════════════

      // ── Top Header Bar ──
      doc.save();
      doc.rect(0, 0, pageWidth, 100).fill(colors.primary);
      // Gradient overlay line
      doc.rect(0, 95, pageWidth, 5).fill(colors.teal);
      doc.restore();

      // Company Name
      doc.font('Helvetica-Bold').fontSize(22).fillColor(colors.white);
      doc.text('DARANET ISP', 40, 25, { continued: false });

      // Subtitle
      doc.font('Helvetica').fontSize(10).fillColor('#90caf9');
      doc.text('Sistem Billing & Penagihan Otomatis', 40, 52);

      // Report Title (right aligned)
      doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.white);
      doc.text('LAPORAN PENAGIHAN', pageWidth - 300, 25, { width: 260, align: 'right' });
      doc.font('Helvetica').fontSize(10).fillColor('#90caf9');
      doc.text(dateStr, pageWidth - 300, 47, { width: 260, align: 'right' });

      // Report ID
      const reportId = `RPT-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}`;
      doc.font('Helvetica').fontSize(8).fillColor('#7986cb');
      doc.text(`No. Laporan: ${reportId}`, pageWidth - 300, 65, { width: 260, align: 'right' });

      let currentY = 120;

      // ── Summary Cards ──
      const cardWidth = (contentWidth - 30) / 4;
      const cardHeight = 70;
      const cardStartX = 40;

      // Card 1: Jatuh Tempo Hari Ini (count)
      drawRoundedRect(cardStartX, currentY, cardWidth, cardHeight, 6, '#e3f2fd', '#90caf9');
      doc.font('Helvetica').fontSize(8).fillColor(colors.mediumGray);
      doc.text('JATUH TEMPO HARI INI', cardStartX + 12, currentY + 12, { width: cardWidth - 24 });
      doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.accent);
      doc.text(`${todayCount}`, cardStartX + 12, currentY + 30, { width: cardWidth - 24 });
      doc.font('Helvetica').fontSize(8).fillColor(colors.mediumGray);
      doc.text('pelanggan', cardStartX + 12, currentY + 53, { width: cardWidth - 24 });

      // Card 2: Jatuh Tempo Hari Ini (amount)
      drawRoundedRect(cardStartX + cardWidth + 10, currentY, cardWidth, cardHeight, 6, '#e0f7fa', '#4dd0e1');
      doc.font('Helvetica').fontSize(8).fillColor(colors.mediumGray);
      doc.text('NOMINAL JATUH TEMPO', cardStartX + cardWidth + 22, currentY + 12, { width: cardWidth - 24 });
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#00838f');
      doc.text(formatRupiah(totalTodayAmount), cardStartX + cardWidth + 22, currentY + 32, { width: cardWidth - 24 });

      // Card 3: Menunggak (count)
      drawRoundedRect(cardStartX + (cardWidth + 10) * 2, currentY, cardWidth, cardHeight, 6, '#fce4ec', '#ef9a9a');
      doc.font('Helvetica').fontSize(8).fillColor(colors.mediumGray);
      doc.text('PELANGGAN MENUNGGAK', cardStartX + (cardWidth + 10) * 2 + 12, currentY + 12, { width: cardWidth - 24 });
      doc.font('Helvetica-Bold').fontSize(20).fillColor(colors.highlight);
      doc.text(`${overdueCount}`, cardStartX + (cardWidth + 10) * 2 + 12, currentY + 30, { width: cardWidth - 24 });
      doc.font('Helvetica').fontSize(8).fillColor(colors.mediumGray);
      doc.text('pelanggan', cardStartX + (cardWidth + 10) * 2 + 12, currentY + 53, { width: cardWidth - 24 });

      // Card 4: Grand Total
      drawRoundedRect(cardStartX + (cardWidth + 10) * 3, currentY, cardWidth, cardHeight, 6, colors.primary, null);
      doc.font('Helvetica').fontSize(8).fillColor('#90caf9');
      doc.text('GRAND TOTAL OUTSTANDING', cardStartX + (cardWidth + 10) * 3 + 12, currentY + 12, { width: cardWidth - 24 });
      doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.white);
      doc.text(formatRupiah(totalTodayAmount + totalOverdueAmount), cardStartX + (cardWidth + 10) * 3 + 12, currentY + 32, { width: cardWidth - 24 });

      currentY += cardHeight + 25;

      // ══════════════════════════════════════════
      // TABLE SECTION
      // ══════════════════════════════════════════

      // Table columns definition (landscape A4 has ~760 usable width)
      const columns: Array<{ label: string; width: number; align: 'center' | 'left' | 'right' | 'justify' }> = [
        { label: 'No', width: 30, align: 'center' },
        { label: 'Nama Pelanggan', width: 130, align: 'left' },
        { label: 'No. WA', width: 95, align: 'left' },
        { label: 'Wilayah/Rute', width: 95, align: 'left' },
        { label: 'Bulan Tagihan', width: 85, align: 'center' },
        { label: 'Paket', width: 90, align: 'left' },
        { label: 'Nominal', width: 80, align: 'right' },
        { label: 'Diskon', width: 60, align: 'right' },
        { label: 'Total Bayar', width: 85, align: 'right' },
        { label: 'Status', width: 85, align: 'center' },
      ];

      const tableX = 40;
      const rowHeight = 22;
      const headerHeight = 28;

      // Collect all rows data
      const allRows = [];

      // Due today rows
      for (const customerId of todayKeys) {
        const item = dueTodayCustomers[customerId];
        const cust = item.customer;
        for (const inv of item.invoices) {
          const netAmount = inv.amount - (inv.discount || 0);
          allRows.push({
            name: cust.name,
            phone: cust.phone,
            wilayah: cust.wilayah || '-',
            month: getReadableMonth(inv.month),
            paket: cust.package?.name || '-',
            amount: formatRupiah(inv.amount),
            discount: formatRupiah(inv.discount || 0),
            netAmount: formatRupiah(netAmount),
            status: 'Jatuh Tempo',
            statusType: 'today',
          });
        }
      }

      // Overdue rows
      for (const customerId of overdueKeys) {
        const item = overdueCustomers[customerId];
        const cust = item.customer;
        for (const inv of item.invoices) {
          const netAmount = inv.amount - (inv.discount || 0);
          allRows.push({
            name: cust.name,
            phone: cust.phone,
            wilayah: cust.wilayah || '-',
            month: getReadableMonth(inv.month),
            paket: cust.package?.name || '-',
            amount: formatRupiah(inv.amount),
            discount: formatRupiah(inv.discount || 0),
            netAmount: formatRupiah(netAmount),
            status: 'Menunggak',
            statusType: 'overdue',
          });
        }
      }

      // Function to draw table header
      const drawTableHeader = (y) => {
        // Header background
        drawRoundedRect(tableX, y, contentWidth, headerHeight, 4, colors.tableHeaderBg, null);

        let colX = tableX;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.white);
        for (const col of columns) {
          doc.text(col.label, colX + 4, y + 9, {
            width: col.width - 8,
            align: col.align,
          });
          colX += col.width;
        }
        return y + headerHeight;
      };

      // Function to draw a data row
      const drawTableRow = (row, index, y) => {
        const isAlt = index % 2 === 1;

        // Row background
        if (isAlt) {
          doc.save();
          doc.rect(tableX, y, contentWidth, rowHeight).fill(colors.tableAltRow);
          doc.restore();
        }

        // Row bottom border
        doc.save();
        doc.moveTo(tableX, y + rowHeight).lineTo(tableX + contentWidth, y + rowHeight)
          .strokeColor(colors.tableBorder).lineWidth(0.3).stroke();
        doc.restore();

        let colX = tableX;
        const values = [
          String(index + 1),
          row.name,
          row.phone,
          row.wilayah,
          row.month,
          row.paket,
          row.amount,
          row.discount,
          row.netAmount,
          row.status,
        ];

        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          const val = values[i];

          // Status column special styling
          if (i === columns.length - 1) {
            const statusColor = row.statusType === 'overdue' ? colors.highlight : colors.teal;
            const statusBg = row.statusType === 'overdue' ? '#fce4ec' : '#e0f7fa';

            // Status badge
            const badgeW = col.width - 12;
            const badgeH = 14;
            const badgeX = colX + 6;
            const badgeY = y + (rowHeight - badgeH) / 2;
            drawRoundedRect(badgeX, badgeY, badgeW, badgeH, 3, statusBg, statusColor);

            doc.font('Helvetica-Bold').fontSize(6.5).fillColor(statusColor);
            doc.text(val, badgeX, badgeY + 3.5, { width: badgeW, align: 'center' });
          } else {
            doc.font(i === 1 ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor(colors.darkText);
            doc.text(val, colX + 4, y + 7, {
              width: col.width - 8,
              align: col.align,
            });
          }

          colX += col.width;
        }

        return y + rowHeight;
      };

      // Function to check if we need a new page
      const checkNewPage = (y, neededHeight) => {
        if (y + neededHeight > pageHeight - 60) {
          doc.addPage();
          // Draw a thin top accent bar on new pages
          doc.save();
          doc.rect(0, 0, pageWidth, 4).fill(colors.teal);
          doc.restore();
          return 20; // reset Y
        }
        return y;
      };

      // ── Draw "Jatuh Tempo Hari Ini" section ──
      if (todayKeys.length > 0) {
        currentY = checkNewPage(currentY, headerHeight + rowHeight + 30);

        // Section title
        doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.teal);
        doc.text('📅  JATUH TEMPO HARI INI', tableX, currentY);
        doc.font('Helvetica').fontSize(8).fillColor(colors.mediumGray);
        doc.text(`${todayCount} pelanggan — ${formatRupiah(totalTodayAmount)}`, tableX + 200, currentY + 2);
        currentY += 18;

        // Draw thin accent line
        doc.save();
        doc.moveTo(tableX, currentY).lineTo(tableX + 200, currentY)
          .strokeColor(colors.teal).lineWidth(2).stroke();
        doc.restore();
        currentY += 8;

        currentY = drawTableHeader(currentY);

        let todayRowIndex = 0;
        for (const customerId of todayKeys) {
          const item = dueTodayCustomers[customerId];
          for (const inv of item.invoices) {
            currentY = checkNewPage(currentY, rowHeight + 5);
            if (currentY < 25) {
              currentY = drawTableHeader(currentY);
            }
            const row = {
              name: item.customer.name,
              phone: item.customer.phone,
              wilayah: item.customer.wilayah || '-',
              month: getReadableMonth(inv.month),
              paket: item.customer.package?.name || '-',
              amount: formatRupiah(inv.amount),
              discount: formatRupiah(inv.discount || 0),
              netAmount: formatRupiah(inv.amount - (inv.discount || 0)),
              status: 'Jatuh Tempo',
              statusType: 'today',
            };
            currentY = drawTableRow(row, todayRowIndex, currentY);
            todayRowIndex++;
          }
        }

        currentY += 20;
      }

      // ── Draw "Menunggak" section ──
      if (overdueKeys.length > 0) {
        currentY = checkNewPage(currentY, headerHeight + rowHeight + 30);

        // Section title
        doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.highlight);
        doc.text('🚨  PELANGGAN MENUNGGAK', tableX, currentY);
        doc.font('Helvetica').fontSize(8).fillColor(colors.mediumGray);
        doc.text(`${overdueCount} pelanggan — ${formatRupiah(totalOverdueAmount)}`, tableX + 220, currentY + 2);
        currentY += 18;

        // Draw thin accent line
        doc.save();
        doc.moveTo(tableX, currentY).lineTo(tableX + 200, currentY)
          .strokeColor(colors.highlight).lineWidth(2).stroke();
        doc.restore();
        currentY += 8;

        currentY = drawTableHeader(currentY);

        let overdueRowIndex = 0;
        for (const customerId of overdueKeys) {
          const item = overdueCustomers[customerId];
          for (const inv of item.invoices) {
            currentY = checkNewPage(currentY, rowHeight + 5);
            if (currentY < 25) {
              currentY = drawTableHeader(currentY);
            }
            const row = {
              name: item.customer.name,
              phone: item.customer.phone,
              wilayah: item.customer.wilayah || '-',
              month: getReadableMonth(inv.month),
              paket: item.customer.package?.name || '-',
              amount: formatRupiah(inv.amount),
              discount: formatRupiah(inv.discount || 0),
              netAmount: formatRupiah(inv.amount - (inv.discount || 0)),
              status: 'Menunggak',
              statusType: 'overdue',
            };
            currentY = drawTableRow(row, overdueRowIndex, currentY);
            overdueRowIndex++;
          }
        }
      }

      // ══════════════════════════════════════════
      // FOOTER on every page
      // ══════════════════════════════════════════
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);

        // Footer line
        doc.save();
        doc.moveTo(40, pageHeight - 35).lineTo(pageWidth - 40, pageHeight - 35)
          .strokeColor(colors.tableBorder).lineWidth(0.5).stroke();
        doc.restore();

        // Footer text
        doc.font('Helvetica').fontSize(7).fillColor(colors.mediumGray);
        doc.text(
          `Laporan Penagihan DaraNet ISP — Digenerate otomatis pada ${dateStr}`,
          40, pageHeight - 28, { width: contentWidth / 2, align: 'left' }
        );
        doc.text(
          `Halaman ${i + 1} dari ${totalPages}`,
          pageWidth / 2, pageHeight - 28, { width: contentWidth / 2, align: 'right' }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
