'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { admin } from '@/lib/api';
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
import {
  Users,
  Briefcase,
  Calendar,
  Star,
  ShieldCheck,
  AlertTriangle,
  Ticket,
  Tag,
  MapPin,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    admin.stats(token)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground">{stats.users.providers} prestataires, {stats.users.clients} clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Services</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gigs.total}</div>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Avis</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviews.total}</div>
            <p className="text-xs text-muted-foreground">Note moyenne: {stats.reviews.avgRating?.toFixed(1) || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Breakdown */}
      {stats.bookings.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repartition des reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(['pending', 'accepted', 'in_progress', 'completed', 'cancelled'] as const).map((s) => {
                const count = stats.bookings[s] || 0;
                const pct = stats.bookings.total > 0 ? (count / stats.bookings.total) * 100 : 0;
                return (
                  <div key={s} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{s.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-2 rounded-full ${
                          s === 'completed' ? 'bg-green-500' :
                          s === 'pending' ? 'bg-yellow-500' :
                          s === 'cancelled' ? 'bg-red-500' :
                          s === 'in_progress' ? 'bg-purple-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Acces rapide</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/admin/users', label: 'Utilisateurs', icon: Users, desc: `${stats.users.total} utilisateurs` },
            { href: '/admin/gigs', label: 'Services', icon: Briefcase, desc: `${stats.gigs.total} services` },
            { href: '/admin/bookings', label: 'Reservations', icon: Calendar, desc: `${stats.bookings.pending} en attente` },
            { href: '/admin/verifications', label: 'Verifications', icon: ShieldCheck, desc: 'Gerer les documents' },
            { href: '/admin/disputes', label: 'Litiges', icon: AlertTriangle, desc: 'Resoudre les litiges' },
            { href: '/admin/coupons', label: 'Coupons', icon: Ticket, desc: 'Gerer les promos' },
            { href: '/admin/categories', label: 'Categories', icon: Tag, desc: 'Ajouter / modifier' },
            { href: '/admin/cities', label: 'Villes', icon: MapPin, desc: 'Ajouter / modifier' },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="no-underline">
              <Card className="transition-colors hover:bg-accent">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
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
                    <TableCell className="font-medium">{b.gig?.title?.substring(0, 40) || '-'}</TableCell>
                    <TableCell>{b.client?.profile?.name || '-'}</TableCell>
                    <TableCell>{new Date(b.createdAt).toLocaleDateString('fr-MA')}</TableCell>
                    <TableCell>{b.totalPrice} MAD</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusBadge[b.status] || ''}>
                        {b.status}
                      </Badge>
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
