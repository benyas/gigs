'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { admin, cities as citiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export default function AdminCitiesPage() {
  const { token } = useAuth();
  const [cityList, setCityList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', region: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const fetchCities = () => {
    citiesApi.list().then(setCityList).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCities(); }, []);

  async function handleCreate() {
    if (!token) return;
    setError('');
    setSaving(true);
    try {
      await admin.createCity({ name: form.name, region: form.region }, token);
      setForm({ name: '', region: '' });
      setDialogOpen(false);
      fetchCities();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!token || !deleteTarget) return;
    try {
      await admin.deleteCity(deleteTarget.id, token);
      setDeleteTarget(null);
      fetchCities();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Villes ({cityList.length})</h1>
        <Button onClick={() => { setForm({ name: '', region: '' }); setError(''); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Chargement...</div>
      ) : cityList.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Aucune ville.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cityList.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell className="text-muted-foreground">{city.region}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(city)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une ville</DialogTitle>
          </DialogHeader>
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="space-y-4">
            <div>
              <Label>Nom de la ville</Label>
              <Input placeholder="Ex: Casablanca" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Region</Label>
              <Input placeholder="Ex: Casablanca-Settat" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.region}>
              {saving ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la ville</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer &quot;{deleteTarget?.name}&quot; ? Cette action est irreversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
