'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { verification } from '@/lib/api';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminVerificationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [viewDoc, setViewDoc] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    if (!token) return;
    setLoading(true);
    const status = tab === 'all' ? undefined : tab;
    verification.listAdmin(token, page, status)
      .then((res) => { setItems(res.data); setMeta(res.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { load(); }, [token, tab, page]);

  const handleApprove = async (id: string) => {
    if (!token) return;
    await verification.review(id, true, token);
    load();
  };

  const handleReject = async () => {
    if (!token || !rejectId) return;
    await verification.review(rejectId, false, token, rejectReason);
    setRejectId(null);
    setRejectReason('');
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Verifications</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="approved">Approuves</TabsTrigger>
          <TabsTrigger value="rejected">Rejetes</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Aucune verification trouvee.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    {v.user?.profile?.name || v.user?.email || 'N/A'}
                  </TableCell>
                  <TableCell className="capitalize">{v.type}</TableCell>
                  <TableCell>{new Date(v.createdAt).toLocaleDateString('fr-MA')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[v.status] || ''}>
                      {v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {v.documentUrl && (
                        <Button variant="ghost" size="sm" onClick={() => setViewDoc(v.documentUrl)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {v.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleApprove(v.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setRejectId(v.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Precedent</Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Suivant</Button>
        </div>
      )}

      {/* View Document Dialog */}
      <Dialog open={!!viewDoc} onOpenChange={() => setViewDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document</DialogTitle>
          </DialogHeader>
          {viewDoc && <img src={viewDoc} alt="Document de verification" className="w-full rounded-md" />}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la verification</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectId(null); setRejectReason(''); }}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>Rejeter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
