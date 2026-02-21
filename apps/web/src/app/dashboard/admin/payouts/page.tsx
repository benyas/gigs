'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { payouts } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Clock, CheckCircle2, Wallet, Lock } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  processing: 'En cours',
  completed: 'Termine',
  failed: 'Echoue',
};

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
};

export default function AdminPayoutsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  async function loadData() {
    try {
      const status = filter === 'all' ? undefined : filter;
      const [p, s] = await Promise.all([
        payouts.list(token!, page, status),
        payouts.stats(token!),
      ]);
      setData(p.data);
      setMeta(p.meta);
      setStats(s);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { if (token) loadData(); }, [filter, page]);

  async function handleComplete(id: string) {
    setActionLoading(id);
    try {
      await payouts.complete(id, token!);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
    setActionLoading(null);
  }

  async function handleCreatePayout() {
    if (!providerId || !amount) return;
    setActionLoading('create');
    try {
      await payouts.create(providerId, parseFloat(amount), token!);
      setDialogOpen(false);
      setProviderId('');
      setAmount('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
    setActionLoading(null);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des virements</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau virement
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayouts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total verse</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPaidOut?.toFixed(2)} MAD</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Soldes disponibles</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAvailableBalance?.toFixed(2)} MAD</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En escrow</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.totalEscrowBalance?.toFixed(2)} MAD</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="pending">En attente</SelectItem>
          <SelectItem value="processing">En cours</SelectItem>
          <SelectItem value="completed">Termines</SelectItem>
        </SelectContent>
      </Select>

      {/* Payouts Table */}
      {data.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Aucun virement</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prestataire</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((payout: any) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-medium">
                    {payout.provider?.profile?.name || payout.providerId?.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div>{new Date(payout.createdAt).toLocaleDateString('fr-MA')}</div>
                    {payout.processedAt && (
                      <div className="text-xs text-muted-foreground">
                        Traite: {new Date(payout.processedAt).toLocaleDateString('fr-MA')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-lg font-semibold">{payout.amount.toFixed(2)} MAD</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusBadge[payout.status] || ''}>
                      {STATUS_LABELS[payout.status] || payout.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {payout.status !== 'completed' && payout.status !== 'failed' && (
                      <Button
                        size="sm"
                        onClick={() => handleComplete(payout.id)}
                        disabled={actionLoading === payout.id}
                      >
                        {actionLoading === payout.id ? '...' : 'Marquer termine'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      )}

      {/* Create Payout Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau virement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID du prestataire</Label>
              <Input placeholder="ID du prestataire" value={providerId} onChange={(e) => setProviderId(e.target.value)} />
            </div>
            <div>
              <Label>Montant (MAD)</Label>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreatePayout} disabled={actionLoading === 'create' || !providerId || !amount}>
              {actionLoading === 'create' ? 'Creation...' : 'Creer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
