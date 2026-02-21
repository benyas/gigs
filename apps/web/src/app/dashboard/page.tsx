'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { gigs, bookings } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Clock,
  Calendar,
  Star,
  MessageSquare,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  active: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-blue-100 text-blue-700',
};

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [myGigs, setMyGigs] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isProvider = user?.role === 'provider';

  useEffect(() => {
    if (!token) return;
    const promises: Promise<any>[] = [
      bookings.list(token).catch(() => ({ data: [] })),
    ];
    if (isProvider) {
      promises.push(gigs.mine(token).catch(() => []));
    }
    Promise.all(promises).then(([b, g]) => {
      setMyBookings(b.data || []);
      if (g) setMyGigs(g);
      setLoading(false);
    });
  }, [token, isProvider]);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  }

  const pendingBookings = myBookings.filter((b) => b.status === 'pending').length;
  const activeGigs = myGigs.filter((g) => g.status === 'active').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour, {user?.profile?.name?.split(' ')[0] || 'Utilisateur'}
        </h1>
        <p className="text-sm text-muted-foreground">Bienvenue sur votre tableau de bord</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isProvider && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Services actifs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeGigs}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total reservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myBookings.length}</div>
          </CardContent>
        </Card>
        {isProvider && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Note</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {user?.profile?.ratingAvg?.toFixed(1) || '-'}
              </div>
              <p className="text-xs text-muted-foreground">{user?.profile?.ratingCount || 0} avis</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/messages"><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Messages</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/my-bookings">Mes reservations</Link>
        </Button>
        {isProvider && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/gigs">Mes services</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/analytics"><BarChart3 className="mr-1.5 h-3.5 w-3.5" />Statistiques</Link>
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/settings"><Settings className="mr-1.5 h-3.5 w-3.5" />Parametres</Link>
        </Button>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Provider: my gigs */}
        {isProvider && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mes services</h2>
              <Button size="sm" asChild>
                <Link href="/create-gig"><Plus className="mr-1.5 h-3.5 w-3.5" />Nouveau</Link>
              </Button>
            </div>
            {myGigs.length > 0 ? (
              <div className="space-y-2">
                {myGigs.slice(0, 5).map((gig) => (
                  <Card key={gig.id}>
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <Link href={`/gig/${gig.slug}`} className="text-sm font-medium hover:underline">{gig.title}</Link>
                        <div className="text-xs text-muted-foreground">
                          {gig.category?.name} &middot; {gig.basePrice} MAD
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={statusBadge[gig.status] || ''}>{gig.status}</Badge>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/gigs/${gig.id}/edit`}>Modifier</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {myGigs.length > 5 && (
                  <Link href="/dashboard/gigs" className="text-sm text-primary hover:underline">
                    Voir tous ({myGigs.length})
                  </Link>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                  Aucun service. <Link href="/create-gig" className="text-primary hover:underline">Creez votre premier service</Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Bookings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Reservations recentes</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/my-bookings">Tout voir</Link>
            </Button>
          </div>
          {myBookings.length > 0 ? (
            <div className="space-y-2">
              {myBookings.slice(0, 5).map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="flex items-center justify-between p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{booking.gig?.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(booking.scheduledAt).toLocaleDateString('fr-MA')} &middot; {booking.totalPrice} MAD
                      </div>
                    </div>
                    <Badge variant="secondary" className={statusBadge[booking.status] || ''}>
                      {booking.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                {isProvider ? 'Aucune reservation pour le moment.' : (
                  <>Aucune reservation. <Link href="/browse" className="text-primary hover:underline">Parcourir les services</Link></>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
