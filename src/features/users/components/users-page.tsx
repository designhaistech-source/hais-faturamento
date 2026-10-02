import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";

import { AppModal } from "@/components/app-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { EmptyStateCard } from "@/components/empty-state-card";
import { SearchField, SelectField } from "@/components/form-field";
import { FilterCard } from "@/components/filter-card";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DataTable,
  DataTableBody,
  DataTableCard,
  DataTableCardFields,
  DataTableCardHeader,
  DataTableCardList,
  DataTableCell,
  DataTableDesktop,
  DataTableHead,
  DataTableHeader,
  DataTableRoot,
  DataTableRow,
} from "@/components/data-table";

import { NewUserModal } from "./new-user-modal";
import { HOSPITALS, hospitalName, INITIAL_USERS, type AppUser, type NewUserInput } from "../data/users";

const COLUMNS = ["Nome", "E-mail", "CPF", "Hospital", "Ações"] as const;

export function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [viewing, setViewing] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState<AppUser | null>(null);

  const actions = {
    onView: setViewing,
    onEdit: (user: AppUser) => {
      setEditing(user);
      setModalOpen(true);
    },
    onDelete: setDeleting,
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const digits = term.replace(/\D/g, "");
    return users.filter((user) => {
      if (hospitalFilter !== "all" && user.hospitalId !== hospitalFilter) return false;
      if (!term) return true;
      // CPF é comparado só por dígitos para aceitar a busca com ou sem máscara.
      return (
        user.name.toLowerCase().includes(term) ||
        (digits.length > 0 && user.cpf.replace(/\D/g, "").includes(digits))
      );
    });
  }, [users, search, hospitalFilter]);

  const activeCount = (search.trim() ? 1 : 0) + (hospitalFilter !== "all" ? 1 : 0);
  function clearFilters() {
    setSearch("");
    setHospitalFilter("all");
  }

  function handleSave(input: NewUserInput) {
    const target = editing;
    setUsers((previous) => {
      const next = target
        ? previous.map((user) => (user.id === target.id ? { ...user, ...input } : user))
        : [...previous, { id: crypto.randomUUID(), ...input }];
      return next.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    });
    setModalOpen(false);
    setEditing(null);
    toast.success(target ? "Alterações salvas com sucesso." : "Usuário cadastrado com sucesso.");
  }

  function handleDelete() {
    if (!deleting) return;
    setUsers((previous) => previous.filter((user) => user.id !== deleting.id));
    toast.success(`Usuário ${deleting.name} excluído.`);
    setDeleting(null);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="usuarios" />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 space-y-6 p-6 pb-16">
          <AppBreadcrumb />
          <PageHeader
            title="Usuários"
            description="Gerencie os usuários e seus respectivos hospitais."
            actions={
              <Button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus aria-hidden="true" />
                Cadastrar usuário
              </Button>
            }
          />

          <FilterCard
            id="users-filters"
            variant="bar"
            activeCount={activeCount}
            onClear={clearFilters}
            clearDisabled={activeCount === 0}
            barColumnsClassName="lg:grid-cols-[minmax(0,1fr)_16rem_auto] lg:gap-4"
          >
            <SearchField
              id="users-search"
              label="Buscar"
              fieldClassName="sm:col-span-2 lg:col-span-1"
              placeholder="Buscar por nome ou CPF"
              value={search}
              clearable
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch("")}
            />
            <SelectField
              id="users-hospital-filter"
              label="Hospital"
              className="sm:col-span-2 lg:col-span-1"
              value={hospitalFilter}
              options={[
                { value: "all", label: "Todos os hospitais" },
                ...HOSPITALS.map((hospital) => ({ value: hospital.id, label: hospital.name })),
              ]}
              onValueChange={setHospitalFilter}
            />
          </FilterCard>

          {filtered.length === 0 ? (
            <EmptyStateCard
              icon={<Users className="size-10" aria-hidden="true" />}
              title="Nenhum usuário encontrado"
              description="Ajuste os filtros para ver outros resultados."
              action={
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              }
            />
          ) : (
            <DataTable>
              <DataTableDesktop>
                <DataTableRoot>
                  <DataTableHeader>
                    <tr>
                      {COLUMNS.map((column) => (
                        <DataTableHead key={column} className={column === "Ações" ? "text-right" : undefined}>
                          {column}
                        </DataTableHead>
                      ))}
                    </tr>
                  </DataTableHeader>
                  <DataTableBody>
                    {filtered.map((user) => (
                      <DataTableRow key={user.id}>
                        <DataTableCell className="font-medium text-foreground">{user.name}</DataTableCell>
                        <DataTableCell>{user.email}</DataTableCell>
                        <DataTableCell className="font-mono">{user.cpf || "—"}</DataTableCell>
                        <DataTableCell>{hospitalName(user.hospitalId)}</DataTableCell>
                        <DataTableCell className="text-right">
                          <UserActions user={user} {...actions} />
                        </DataTableCell>
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTableRoot>
              </DataTableDesktop>
              <DataTableCardList divided>
                {filtered.map((user) => (
                  <DataTableCard key={user.id} flat className="space-y-1.5 py-2.5">
                    <DataTableCardHeader
                      title={user.name}
                      subtitle={user.email}
                      trailing={<UserActions user={user} {...actions} />}
                    />
                    <DataTableCardFields
                      fields={[
                        { label: "CPF", value: user.cpf || "—" },
                        { label: "Hospital", value: hospitalName(user.hospitalId) },
                      ]}
                    />
                  </DataTableCard>
                ))}
              </DataTableCardList>
            </DataTable>
          )}
        </main>
        <SiteFooter />
      </div>

      <NewUserModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        existingEmails={users
          .filter((user) => user.id !== editing?.id)
          .map((user) => user.email.toLowerCase())}
        initialValues={
          editing
            ? { name: editing.name, email: editing.email, cpf: editing.cpf, hospitalId: editing.hospitalId }
            : undefined
        }
        onCreate={handleSave}
      />

      <AppModal
        open={viewing !== null}
        onOpenChange={(open) => !open && setViewing(null)}
        title="Detalhes do usuário"
        icon={<UserRound className="size-5" aria-hidden="true" />}
        size="md"
      >
        {viewing && (
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: "Nome completo", value: viewing.name },
              { label: "E-mail", value: viewing.email },
              { label: "CPF", value: viewing.cpf || "Não informado", mono: true },
              { label: "Hospital", value: hospitalName(viewing.hospitalId) },
            ].map((item) => (
              <div key={item.label} className="min-w-0">
                <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
                <dd className={`mt-1 break-words text-sm text-foreground ${item.mono ? "font-mono" : ""}`}>
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </AppModal>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir usuário?"
        description={
          <>
            O usuário <strong className="text-foreground">{deleting?.name}</strong> será excluído do
            sistema. Esta ação não poderá ser desfeita.
          </>
        }
        confirmLabel="Excluir usuário"
        onConfirm={handleDelete}
      />
    </div>
  );
}

interface UserActionsProps {
  user: AppUser;
  onView: (user: AppUser) => void;
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
}

function UserActions({ user, onView, onEdit, onDelete }: UserActionsProps) {
  const items = [
    { label: "Ver detalhes", icon: Eye, onClick: onView },
    { label: "Editar usuário", icon: Pencil, onClick: onEdit },
    {
      label: "Excluir usuário",
      icon: Trash2,
      onClick: onDelete,
    },
  ];
  return (
    <TooltipProvider delayDuration={150}>
      <div className="inline-flex items-center gap-1">
        {items.map(({ label, icon: Icon, onClick }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${label}: ${user.name}`}
                onClick={() => onClick(user)}
              >
                <Icon className="size-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
