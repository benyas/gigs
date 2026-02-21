import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async generateInvoice(bookingId: string): Promise<Buffer> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        gig: {
          include: {
            provider: { include: { profile: true } },
            category: true,
          },
        },
        client: { include: { profile: true } },
        transactions: { where: { type: 'charge', status: 'completed' } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Auto-assign invoice number if not set
    if (!booking.invoiceNumber) {
      const last = await this.prisma.booking.findFirst({
        where: { invoiceNumber: { not: null } },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      });
      const nextNumber = (last?.invoiceNumber || 0) + 1;
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { invoiceNumber: nextNumber },
      });
      booking.invoiceNumber = nextNumber;
    }

    return this.buildPdf(booking);
  }

  private buildPdf(booking: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const invoiceNo = `GIG-${String(booking.invoiceNumber).padStart(6, '0')}`;
      const createdAt = new Date(booking.createdAt);
      const scheduledAt = new Date(booking.scheduledAt);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('Gigs.ma', 50, 50);
      doc.fontSize(10).font('Helvetica').text('Plateforme de services au Maroc', 50, 78);
      doc.moveDown(2);

      // Invoice title
      doc.fontSize(20).font('Helvetica-Bold').text('FACTURE', 50, 130);
      doc.fontSize(10).font('Helvetica');
      doc.text(`N° ${invoiceNo}`, 50, 155);
      doc.text(`Date: ${createdAt.toLocaleDateString('fr-MA')}`, 50, 170);

      // Provider info (right side)
      doc.fontSize(12).font('Helvetica-Bold').text('Prestataire', 350, 130);
      doc.fontSize(10).font('Helvetica');
      doc.text(booking.gig.provider.profile?.name || 'N/A', 350, 148);
      doc.text(booking.gig.provider.email || booking.gig.provider.phone, 350, 163);

      // Client info
      doc.fontSize(12).font('Helvetica-Bold').text('Client', 50, 210);
      doc.fontSize(10).font('Helvetica');
      doc.text(booking.client.profile?.name || 'N/A', 50, 228);
      doc.text(booking.client.email || booking.client.phone, 50, 243);
      doc.text(booking.address, 50, 258);

      // Divider
      doc.moveTo(50, 290).lineTo(545, 290).stroke();

      // Table header
      const tableTop = 310;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Date prévue', 280, tableTop);
      doc.text('Montant', 450, tableTop, { width: 95, align: 'right' });

      doc.moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).stroke();

      // Table row
      const rowY = tableTop + 28;
      doc.font('Helvetica');
      doc.text(booking.gig.title, 50, rowY, { width: 220 });
      doc.text(`${booking.gig.category.name}`, 50, rowY + 15, { width: 220 });
      doc.text(scheduledAt.toLocaleDateString('fr-MA'), 280, rowY);
      doc.text(`${booking.totalPrice.toFixed(2)} MAD`, 450, rowY, { width: 95, align: 'right' });

      // Subtotals
      const subtotalY = rowY + 50;
      doc.moveTo(350, subtotalY).lineTo(545, subtotalY).stroke();

      doc.font('Helvetica');
      doc.text('Sous-total', 350, subtotalY + 10);
      doc.text(`${booking.totalPrice.toFixed(2)} MAD`, 450, subtotalY + 10, { width: 95, align: 'right' });

      if (booking.discountAmount && booking.discountAmount > 0) {
        doc.text(`Remise (${booking.couponCode || ''})`, 350, subtotalY + 28);
        doc.text(`-${booking.discountAmount.toFixed(2)} MAD`, 450, subtotalY + 28, { width: 95, align: 'right' });
      }

      const finalPrice = booking.totalPrice - (booking.discountAmount || 0);
      const platformFee = finalPrice * 0.1;
      const totalY = subtotalY + (booking.discountAmount ? 55 : 35);

      doc.text('Frais de service (10%)', 350, totalY);
      doc.text(`${platformFee.toFixed(2)} MAD`, 450, totalY, { width: 95, align: 'right' });

      doc.moveTo(350, totalY + 20).lineTo(545, totalY + 20).stroke();
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total TTC', 350, totalY + 28);
      doc.text(`${(finalPrice + platformFee).toFixed(2)} MAD`, 450, totalY + 28, { width: 95, align: 'right' });

      // Payment status
      const statusY = totalY + 60;
      const chargeTransaction = booking.transactions?.[0];
      doc.fontSize(10).font('Helvetica');
      doc.text(
        `Statut: ${chargeTransaction ? 'Payé' : 'En attente'}`,
        50,
        statusY,
      );
      if (chargeTransaction) {
        doc.text(
          `Réf. paiement: ${chargeTransaction.cmiOrderId || chargeTransaction.id}`,
          50,
          statusY + 15,
        );
      }
      doc.text(`Statut réservation: ${booking.status}`, 50, statusY + 30);

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#666666');
      doc.text(
        'Gigs.ma — Plateforme de mise en relation de prestataires de services',
        50,
        750,
        { align: 'center' },
      );
      doc.text(
        'Ce document est généré automatiquement et ne constitue pas une facture fiscale.',
        50,
        762,
        { align: 'center' },
      );

      doc.end();
    });
  }
}
