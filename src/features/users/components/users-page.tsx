import { useMemo, useState } from "react";
import { MoreHorizontal, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { EmptyStateCard } from "@/components/empty-state-card";
import { SearchField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { hospitalName, INITIAL_USERS, type AppUser, type NewUserInput } from "../data/users";

const COLUMNS = ["Nome", "E-mail", "CPF", "Hospital", "Ações"] as const;

export function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.name, user.email, user.cpf, hospitalName(user.hospitalId)].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [users, search]);

  function handleCreate(input: NewUserInput) {
    setUsers((previous) =>
      [...previous, { id: crypto.randomUUID(), ...input }].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR"),
      ),
    );
    setModalOpen(false);
    toast.success("Usuário cadastrado com sucesso.");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar activeKey="usuarios" />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <main className="flex-1 space-y-6 p-6 pb-16">
          <AppBreadcrumb />
          <PageHeader title="Usuários" description="Gerencie os usuários e seus respectivos hospitais." />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchField
              id="users-search"
              aria-label="Pesquisar usuário"
              placeholder="Pesquisar usuário"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              clearable
              fieldClassName="w-full sm:max-w-sm"
            />
            <Button type="button" onClick={() => setModalOpen(true)}>
              <Plus aria-hidden="true" />
              Cadastrar usuário
            </Button>
          </div>

          {filtered.length === 0 ? (
            <EmptyStateCard
              icon={<Users className="size-10" aria-hidden="true" />}
              title="Nenhum usuário encontrado"
              description="Ajuste a pesquisa para ver outros resultados."
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
                          <UserActions user={user} />
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
                      trailing={<UserActions user={user} />}
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
        onOpenChange={setModalOpen}
        existingEmails={users.map((user) => user.email.toLowerCase())}
        onCreate={handleCreate}
      />
    </div>
  );
}

function UserActions({ user }: { user: AppUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Ações de ${user.name}`}>
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => toast("Edição de usuário ainda não disponível.")}>
          Editar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
