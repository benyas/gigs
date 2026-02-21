'use client';

import { useEffect, useState } from 'react';
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

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-700',
};

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Acceptee',
  in_progress: 'En cours',
  completed: 'Terminee',
  cancelled: 'Annulee',
  disputed: 'Litige',
};

export default function AdminBookingsPage() {
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
    admin.bookings(token, page, status)
      .then((res) => { setItems(res.data); setMeta(res.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { load(); }, [token, page, statusFilter]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reservations ({meta.total || 0})</h1>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="accepted">Acceptee</SelectItem>
          <SelectItem value="in_progress">En cours</SelectItem>
          <SelectItem value="completed">Terminee</SelectItem>
          <SelectItem value="cancelled">Annulee</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Aucune reservation.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Prestataire</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.gig?.title?.substring(0, 35) || '-'}</TableCell>
                  <TableCell>{b.client?.profile?.name || '-'}</TableCell>
                  <TableCell>{b.gig?.provider?.profile?.name || '-'}</TableCell>
                  <TableCell>{new Date(b.scheduledAt || b.createdAt).toLocaleDateString('fr-MA')}</TableCell>
                  <TableCell>{b.totalPrice} MAD</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusBadge[b.status] || ''}>
                      {statusLabels[b.status] || b.status}
                    </Badge>
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
