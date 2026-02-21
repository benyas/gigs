'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { admin } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ShieldCheck, ShieldOff } from 'lucide-react';

const roleBadge: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  provider: 'bg-blue-100 text-blue-700',
  client: 'bg-gray-100 text-gray-600',
};

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    if (!token) return;
    setLoading(true);
    const role = roleFilter === 'all' ? undefined : roleFilter;
    admin.users(token, page, role, search || undefined)
      .then((res) => { setUsers(res.data); setMeta(res.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { setPage(1); }, [roleFilter]);
  useEffect(() => { fetchUsers(); }, [token, page, roleFilter]);

  async function handleRoleChange(userId: string, role: string) {
    if (!token) return;
    await admin.updateUserRole(userId, role, token);
    fetchUsers();
  }

  async function handleVerify(userId: string, verified: boolean) {
    if (!token) return;
    await admin.verifyUser(userId, verified, token);
    fetchUsers();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Utilisateurs ({meta.total || 0})</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tous les roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les roles</SelectItem>
            <SelectItem value="client">Clients</SelectItem>
            <SelectItem value="provider">Prestataires</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Rechercher (nom, email, telephone)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" onClick={() => { setPage(1); fetchUsers(); }}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Chargement...</div>
      ) : users.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Aucun utilisateur trouve.</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Inscrit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{u.profile?.name || 'Sans nom'}</span>
                      {u.profile?.isVerified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Verifie</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{u.email || '-'}</div>
                    <div className="text-xs text-muted-foreground">{u.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleBadge[u.role] || ''}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u._count?.gigs || 0} services, {u._count?.bookingsAsClient || 0} reservations
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(u.createdAt).toLocaleDateString('fr-MA')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="provider">Prestataire</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerify(u.id, !u.profile?.isVerified)}
                        title={u.profile?.isVerified ? 'Retirer verification' : 'Verifier'}
                      >
                        {u.profile?.isVerified ? (
                          <ShieldOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
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
