'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { disputes } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Gavel, ChevronDown, ChevronUp } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

export default function AdminDisputesPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolveTarget, setResolveTarget] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [favorOf, setFavorOf] = useState('');

  const load = () => {
    if (!token) return;
    setLoading(true);
    const status = tab === 'all' ? undefined : tab;
    disputes.listAdmin(token, page, status)
      .then((res) => { setItems(res.data); setMeta(res.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { load(); }, [token, tab, page]);

  const handleResolve = async () => {
    if (!token || !resolveTarget || !resolution || !favorOf) return;
    await disputes.resolve(resolveTarget.id, resolution, favorOf, token);
    setResolveTarget(null);
    setResolution('');
    setFavorOf('');
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Litiges</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="open">Ouverts</TabsTrigger>
          <TabsTrigger value="resolved">Resolus</TabsTrigger>
          <TabsTrigger value="closed">Fermes</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Aucun litige trouve.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reservation</TableHead>
                <TableHead>Initiateur</TableHead>
                <TableHead>Raison</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d: any) => (
                <>
                  <TableRow key={d.id} className="cursor-pointer" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                    <TableCell className="font-medium">
                      {d.booking?.gig?.title?.substring(0, 30) || d.bookingId?.substring(0, 8)}
                    </TableCell>
                    <TableCell>{d.initiator?.profile?.name || 'N/A'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{d.reason}</TableCell>
                    <TableCell>{new Date(d.createdAt).toLocaleDateString('fr-MA')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[d.status] || ''}>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm">
                          {expanded === d.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {d.status === 'open' && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setResolveTarget(d); }}>
                            <Gavel className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded === d.id && (
                    <TableRow key={`${d.id}-detail`}>
                      <TableCell colSpan={6} className="bg-muted/50 p-4">
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-semibold">Raison complete:</span>
                            <p className="text-sm text-muted-foreground">{d.reason}</p>
                          </div>
                          {d.messages?.length > 0 && (
                            <div>
                              <span className="text-sm font-semibold">Messages ({d.messages.length}):</span>
                              <div className="mt-1 space-y-1">
                                {d.messages.map((m: any, i: number) => (
                                  <div key={i} className="rounded bg-background p-2 text-sm">
                                    <span className="font-medium">{m.sender?.profile?.name || 'Utilisateur'}:</span>{' '}
                                    {m.content}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {d.resolution && (
                            <div>
                              <span className="text-sm font-semibold">Resolution:</span>
                              <p className="text-sm text-muted-foreground">{d.resolution}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
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

      {/* Resolve Dialog */}
      <Dialog open={!!resolveTarget} onOpenChange={() => { setResolveTarget(null); setResolution(''); setFavorOf(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resoudre le litige</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Resolution</Label>
              <Textarea
                placeholder="Expliquez la decision..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
            </div>
            <div>
              <Label>En faveur de</Label>
              <Select value={favorOf} onValueChange={setFavorOf}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="provider">Prestataire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResolveTarget(null); setResolution(''); setFavorOf(''); }}>Annuler</Button>
            <Button onClick={handleResolve} disabled={!resolution.trim() || !favorOf}>Resoudre</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
