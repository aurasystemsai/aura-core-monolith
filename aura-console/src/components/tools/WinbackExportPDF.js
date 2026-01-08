// aura-console/src/components/tools/WinbackExportPDF.js
// PDF export utility for Abandoned Checkout Winback
import jsPDF from 'jspdf';

export function exportCampaignPDF(campaign) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Abandoned Checkout Winback Campaign', 10, 16);
  doc.setFontSize(12);
  doc.text(`Name: ${campaign.name || ''}`, 10, 30);
  doc.text(`Channel: ${campaign.channel || ''}`, 10, 38);
  doc.text(`Segment: ${campaign.segment || ''}`, 10, 46);
  doc.text(`Schedule: ${campaign.schedule || ''}`, 10, 54);
  doc.text(`Variant: ${campaign.variant || ''}`, 10, 62);
  doc.text(`Status: ${campaign.status || ''}`, 10, 70);
  doc.text('Template:', 10, 82);
  doc.setFontSize(10);
  doc.text(campaign.template || '', 10, 90, { maxWidth: 180 });
  doc.save(`${campaign.name || 'campaign'}.pdf`);
}
