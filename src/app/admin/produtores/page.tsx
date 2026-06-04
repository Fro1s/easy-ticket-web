'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RoleGate } from '@/components/role-gate';
import { ProducerHeader } from '@/components/producer-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminControllerListProducers,
  useAdminControllerCreateProducer,
  useAdminControllerCreateProducerUser,
} from '@/generated/api';

export default function AdminProdutoresPage() {
  const list = useAdminControllerListProducers();
  const producers = list.data?.data.items ?? [];

  const createProducer = useAdminControllerCreateProducer();
  const createUser = useAdminControllerCreateProducerUser();

  const [orgName, setOrgName] = useState('');
  const [orgCnpj, setOrgCnpj] = useState('');

  const [userOrg, setUserOrg] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  function submitOrg() {
    if (orgName.trim().length < 1) return;
    createProducer.mutate(
      { data: { name: orgName.trim(), cnpj: orgCnpj.trim() || undefined } },
      {
        onSuccess: () => {
          toast.success('Organização criada');
          setOrgName('');
          setOrgCnpj('');
          list.refetch();
        },
        onError: () => toast.error('Falha ao criar organização'),
      },
    );
  }

  function submitUser() {
    if (!userOrg || userName.trim().length < 1 || userPassword.length < 8) {
      toast.error('Preencha org, nome e senha (mín. 8).');
      return;
    }
    createUser.mutate(
      {
        producerId: userOrg,
        data: { name: userName.trim(), email: userEmail.trim(), password: userPassword },
      },
      {
        onSuccess: () => {
          toast.success('Login de produtor criado');
          setUserName('');
          setUserEmail('');
          setUserPassword('');
          list.refetch();
        },
        onError: (e: unknown) => {
          const status = (e as { response?: { status?: number } })?.response?.status;
          toast.error(status === 409 ? 'E-mail já em uso' : 'Falha ao criar login');
        },
      },
    );
  }

  return (
    <RoleGate allow={['ADMIN']}>
      {() => (
        <>
          <ProducerHeader scope="admin" />
          <main className="min-h-screen bg-ink-deep px-6 md:px-8 py-10 text-foreground">
            <div className="mx-auto max-w-5xl">
              <div className="font-mono text-[11px] tracking-[2px] uppercase text-accent mb-3">
                GESTÃO DE PRODUTORES
              </div>
              <h1 className="font-display text-[40px] md:text-[48px] font-extrabold leading-[0.95] tracking-[-2px] mb-8">
                Produtores<span className="text-accent">.</span>
              </h1>

              <div className="grid md:grid-cols-2 gap-4 mb-12">
                <div className="border border-border/50 rounded-[6px] p-5 bg-card/40">
                  <h2 className="font-display text-lg font-bold mb-4">Nova organização</h2>
                  <div className="space-y-3">
                    <div>
                      <Label>Nome</Label>
                      <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Ex.: Warung Productions" />
                    </div>
                    <div>
                      <Label>CNPJ (opcional)</Label>
                      <Input value={orgCnpj} onChange={(e) => setOrgCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
                    </div>
                    <Button onClick={submitOrg} disabled={createProducer.isPending}>
                      {createProducer.isPending ? 'Criando…' : 'Criar organização'}
                    </Button>
                  </div>
                </div>

                <div className="border border-border/50 rounded-[6px] p-5 bg-card/40">
                  <h2 className="font-display text-lg font-bold mb-4">Novo login de produtor</h2>
                  <div className="space-y-3">
                    <div>
                      <Label>Organização</Label>
                      <Select
                        value={userOrg}
                        onValueChange={(v) => v && setUserOrg(v)}
                        items={producers.map((p) => ({ value: p.id, label: p.name }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a organização" />
                        </SelectTrigger>
                        <SelectContent>
                          {producers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nome</Label>
                      <Input value={userName} onChange={(e) => setUserName(e.target.value)} />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label>Senha (mín. 8)</Label>
                      <Input type="text" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} />
                    </div>
                    <Button onClick={submitUser} disabled={createUser.isPending}>
                      {createUser.isPending ? 'Criando…' : 'Criar login'}
                    </Button>
                  </div>
                </div>
              </div>

              <h2 className="font-display text-2xl font-bold mb-5">
                Organizações ({producers.length})
              </h2>
              {list.isLoading ? (
                <div className="text-ink-dim">Carregando…</div>
              ) : (
                <ul className="space-y-3">
                  {producers.map((p) => (
                    <li key={p.id} className="border border-border/50 rounded-[6px] p-5 bg-card/40">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="font-display text-lg font-bold">{p.name}</div>
                        <div className="font-mono text-[11px] text-ink-dim uppercase tracking-[1.5px]">
                          {p.eventCount} evento(s)
                        </div>
                      </div>
                      {p.cnpj && <div className="text-sm text-ink-dim mb-2">CNPJ: {p.cnpj}</div>}
                      <div className="text-[13px]">
                        {p.users.length === 0 ? (
                          <span className="text-ink-dim">Sem logins ainda.</span>
                        ) : (
                          <ul className="space-y-1">
                            {p.users.map((u) => (
                              <li key={u.id} className="flex items-center gap-2 text-ink-muted">
                                <span className="font-medium text-foreground">{u.name ?? '—'}</span>
                                <span className="text-ink-dim">·</span>
                                <span>{u.email}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                  {producers.length === 0 && (
                    <li className="text-ink-dim border border-dashed border-border/50 rounded-[6px] p-8 text-center">
                      Nenhuma organização ainda.
                    </li>
                  )}
                </ul>
              )}
            </div>
          </main>
        </>
      )}
    </RoleGate>
  );
}
