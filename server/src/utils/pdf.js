import PDFDocument from 'pdfkit';

export function streamPdf(res, title, rows) {
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replaceAll(' ', '-')}.pdf"`);

  doc.pipe(res);
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();
  rows.forEach(([label, value]) => {
    doc.fontSize(10).fillColor('#55615c').text(label);
    doc.fontSize(13).fillColor('#13201b').text(String(value ?? ''));
    doc.moveDown(0.6);
  });
  doc.end();
}
