'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { profile } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Briefcase, Calendar, CheckCircle2, Star } from 'lucide-react';

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    profile.stats(token)
      .then(setStats)
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  }

  if (error) {
    return <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!stats) return null;

  const completionRate = stats.bookings.total > 0
    ? Math.round((stats.bookings.completed / stats.bookings.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-sm text-muted-foreground">Suivez vos performances</p>
      </div>

      {/* Earnings Card */}
      <Card className="border-0 bg-gradient-to-br from-primary to-emerald-800 text-white">
        <CardContent className="flex flex-wrap justify-around gap-6 p-6">
          <div className="text-center">
            <div className="mb-1 text-sm font-medium opacity-75">Revenus totaux</div>
            <div className="text-3xl font-extrabold tracking-tight">
              {Number(stats.earnings.total).toLocaleString('fr-MA')}
              <span className="ml-1 text-base font-medium">MAD</span>
            </div>
          </div>
          <div className="text-center">
            <div className="mb-1 text-sm font-medium opacity-75">Ce mois</div>
            <div className="text-3xl font-extrabold tracking-tight">
              {Number(stats.earnings.thisMonth).toLocaleString('fr-MA')}
              <span className="ml-1 text-base font-medium">MAD</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Services</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.gigs.total}</div>
            <p className="text-xs text-muted-foreground">{stats.gigs.active} actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bookings.total}</div>
            <p className="text-xs text-muted-foreground">{stats.bookings.pending} en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terminees</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.bookings.completed}</div>
            <p className="text-xs text-muted-foreground">{completionRate}% taux de completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avis</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.reviews.total}</div>
            <p className="text-xs text-muted-foreground">{stats.reviews.avgRating?.toFixed(1) || '-'}/5 moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      {stats.recentBookings?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservations recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentBookings.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.gig?.title?.substring(0, 35) || '-'}</TableCell>
                    <TableCell>{b.client?.profile?.name || 'Client'}</TableCell>
                    <TableCell>{new Date(b.createdAt).toLocaleDateString('fr-MA')}</TableCell>
                    <TableCell>{b.totalPrice} MAD</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusBadge[b.status] || ''}>{b.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
