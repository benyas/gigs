'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { admin } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink } from 'lucide-react';

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-600',
};

export default function AdminGigsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!token) return;
    setLoading(true);
    const status = statusFilter === 'all' ? undefined : statusFilter;
    admin.gigs(token, page, status)
      .then((res) => { setItems(res.data); setMeta(res.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  async function handleStatusChange(gigId: string, status: string) {
    if (!token) return;
    await admin.updateGigStatus(gigId, status, token);
    load();
  }

  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { load(); }, [token, page, statusFilter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Services ({meta.total || 0})</h1>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="active">Actif</SelectItem>
          <SelectItem value="draft">Brouillon</SelectItem>
          <SelectItem value="paused">En pause</SelectItem>
          <SelectItem value="archived">Archive</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Aucun service.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Prestataire</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Reservations</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((gig) => (
                <TableRow key={gig.id}>
                  <TableCell>
                    <Link href={`/gig/${gig.slug}`} className="font-medium hover:underline">
                      {gig.title?.substring(0, 35)}
                    </Link>
                  </TableCell>
                  <TableCell>{gig.provider?.profile?.name || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{gig.category?.name || '-'}</TableCell>
                  <TableCell>{gig.basePrice} MAD</TableCell>
                  <TableCell>{gig._count?.bookings || 0}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusBadge[gig.status] || ''}>
                      {gig.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select value={gig.status} onValueChange={(v) => handleStatusChange(gig.id, v)}>
                      <SelectTrigger className="h-8 w-[110px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="paused">En pause</SelectItem>
                        <SelectItem value="archived">Archive</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      )}
    </div>
  );
}
