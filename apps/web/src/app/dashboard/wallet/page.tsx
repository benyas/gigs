'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { payments } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Wallet, Clock, TrendingUp } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  charge: 'Paiement recu',
  refund: 'Remboursement',
  payout: 'Virement',
  platform_fee: 'Commission',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  completed: 'Termine',
  failed: 'Echoue',
};

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-700',
};

export default function WalletPage() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [token]);

  async function loadData() {
    try {
      const [w, t] = await Promise.all([
        payments.wallet(token!),
        payments.transactions(token!, page),
      ]);
      setWallet(w);
      setTransactions(t.data);
      setMeta(t.meta);
    } catch {}
    setLoading(false);
  }

  async function loadPage(p: number) {
    setPage(p);
    try {
      const t = await payments.transactions(token!, p);
      setTransactions(t.data);
      setMeta(t.meta);
    } catch {}
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Portefeuille</h1>

      {/* Balance Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solde disponible</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{(wallet?.balance || 0).toFixed(2)} MAD</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente (escrow)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{(wallet?.pendingBalance || 0).toFixed(2)} MAD</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total gagne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(wallet?.totalEarned || 0).toFixed(2)} MAD</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Aucune transaction</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{TYPE_LABELS[tx.type] || tx.type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.booking?.gig?.title || '-'}</TableCell>
                    <TableCell>{new Date(tx.createdAt).toLocaleDateString('fr-MA')}</TableCell>
                    <TableCell className={`font-semibold ${tx.type === 'charge' ? 'text-green-600' : tx.type === 'refund' ? 'text-red-600' : ''}`}>
                      {tx.type === 'payout' || tx.type === 'refund' ? '-' : '+'}{tx.amount.toFixed(2)} MAD
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusBadge[tx.status] || ''}>
                        {STATUS_LABELS[tx.status] || tx.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadPage(page - 1)}>Precedent</Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => loadPage(page + 1)}>Suivant</Button>
        </div>
      )}
    </div>
  );
}
