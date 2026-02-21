'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { coupons } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface CouponForm {
  code: string;
  type: string;
  value: string;
  maxUses: string;
  minOrder: string;
  expiresAt: string;
  isActive: boolean;
}

const emptyForm: CouponForm = {
  code: '',
  type: 'percentage',
  value: '',
  maxUses: '',
  minOrder: '',
  expiresAt: '',
  isActive: true,
};

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    coupons.list(token, page)
      .then((res) => { setItems(res.data); setMeta(res.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token, page]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: String(c.value),
      maxUses: c.maxUses ? String(c.maxUses) : '',
      minOrder: c.minOrder ? String(c.minOrder) : '',
      expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!token) return;
    const payload: any = {
      code: form.code,
      type: form.type,
      value: Number(form.value),
      isActive: form.isActive,
    };
    if (form.maxUses) payload.maxUses = Number(form.maxUses);
    if (form.minOrder) payload.minOrder = Number(form.minOrder);
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();

    if (editId) {
      await coupons.update(editId, payload, token);
    } else {
      await coupons.create(payload, token);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!token || !deleteId) return;
    await coupons.remove(deleteId, token);
    setDeleteId(null);
    load();
  };

  const handleToggleActive = async (c: any) => {
    if (!token) return;
    await coupons.update(c.id, { isActive: !c.isActive }, token);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Creer un coupon
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Chargement...</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Aucun coupon cree.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead>Min. commande</TableHead>
                <TableHead>Expire</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {c.type === 'percentage' ? '%' : 'MAD'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.value}{c.type === 'percentage' ? '%' : ' MAD'}
                  </TableCell>
                  <TableCell>
                    {c.usedCount || 0}{c.maxUses ? ` / ${c.maxUses}` : ''}
                  </TableCell>
                  <TableCell>{c.minOrder ? `${c.minOrder} MAD` : '-'}</TableCell>
                  <TableCell>
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fr-MA') : '-'}
                  </TableCell>
                  <TableCell>
                    <Switch checked={c.isActive} onCheckedChange={() => handleToggleActive(c)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Modifier le coupon' : 'Creer un coupon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code</Label>
              <Input placeholder="EX: PROMO20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (MAD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valeur</Label>
                <Input type="number" placeholder="20" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max utilisations</Label>
                <Input type="number" placeholder="Illimite" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
              </div>
              <div>
                <Label>Min. commande (MAD)</Label>
                <Input type="number" placeholder="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Date d&apos;expiration</Label>
              <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!form.code || !form.value}>
              {editId ? 'Modifier' : 'Creer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le coupon</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Etes-vous sur de vouloir supprimer ce coupon ? Cette action est irreversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
