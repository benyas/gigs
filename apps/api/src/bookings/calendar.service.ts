import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getBookingIcs(bookingId: string): Promise<string> {
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
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const start = new Date(booking.scheduledAt);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 hours default

    return this.buildIcs([{
      uid: booking.id,
      summary: booking.gig.title,
      description: `Service: ${booking.gig.title}\nPrestataire: ${booking.gig.provider.profile?.name || 'N/A'}\nCategorie: ${booking.gig.category.name}\nPrix: ${booking.totalPrice} MAD`,
      location: booking.address,
      start,
      end,
      created: new Date(booking.createdAt),
    }]);
  }

  async getProviderScheduleIcs(providerId: string): Promise<string> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        gig: { providerId },
        status: { in: ['accepted', 'in_progress'] },
        scheduledAt: { gte: new Date() },
      },
      include: {
        gig: { include: { category: true } },
        client: { include: { profile: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    const events = bookings.map((b) => {
      const start = new Date(b.scheduledAt);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      return {
        uid: b.id,
        summary: `Gigs.ma: ${b.gig.title}`,
        description: `Client: ${b.client.profile?.name || 'N/A'}\nCategorie: ${b.gig.category.name}\nPrix: ${b.totalPrice} MAD\nStatut: ${b.status}`,
        location: b.address,
        start,
        end,
        created: new Date(b.createdAt),
      };
    });

    return this.buildIcs(events, 'Gigs.ma - Mon planning');
  }

  private buildIcs(
    events: {
      uid: string;
      summary: string;
      description: string;
      location: string;
      start: Date;
      end: Date;
      created: Date;
    }[],
    calName = 'Gigs.ma',
  ): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gigs.ma//Booking//FR',
      `X-WR-CALNAME:${calName}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const event of events) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:${event.uid}@gigs.ma`,
        `DTSTART:${this.formatDate(event.start)}`,
        `DTEND:${this.formatDate(event.end)}`,
        `DTSTAMP:${this.formatDate(event.created)}`,
        `SUMMARY:${this.escapeIcs(event.summary)}`,
        `DESCRIPTION:${this.escapeIcs(event.description)}`,
        `LOCATION:${this.escapeIcs(event.location)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      );
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private formatDate(d: Date): string {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  private escapeIcs(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }
}
