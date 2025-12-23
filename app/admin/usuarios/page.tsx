"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, User, Loader2 } from "lucide-react"
import { UserFormModal } from "@/components/admin/user-form-modal"
import { DeleteConfirmationModal } from "@/components/admin/delete-confirmation-modal"

import { getUsersAction, deleteUserAction } from "@/app/actions/user-actions"
import type { UserProfile } from "@/lib/types"

import { DashboardShell } from "@/components/dashboard-shell"

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null)

  const fetchUsers = async () => {
    try {
      // Use Server Action instead of API route
      const data = await getUsersAction()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.sheetName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleDelete = (user: UserProfile) => {
    setDeletingUser(user)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return
    // Use Server Action
    await deleteUserAction(deletingUser.id)
    await fetchUsers()
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingUser(null)
  }

  return (
    <DashboardShell>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-1">Configure fotos e nomes de exibição para o ranking de vendas</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome de exibição ou nome da planilha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button onClick={() => setIsFormOpen(true)} size="lg" className="h-12">
              <Plus className="w-5 h-5 mr-2" />
              Novo Usuário
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Carregando usuários...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="p-12 text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum usuário encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? "Tente buscar por outro termo" : "Comece criando um novo usuário"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Usuário
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="p-6 hover:shadow-lg transition-all duration-300 border border-border/50 bg-card/60 backdrop-blur-sm group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl || "/placeholder.svg"}
                        alt={user.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg tracking-tight truncate">{user.displayName}</h3>
                    <p className="text-sm text-muted-foreground truncate" title={user.sheetName.toUpperCase()}>
                      Planilha: {user.sheetName.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Atualizado em {new Date(user.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user)}
                    className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="flex-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <UserFormModal isOpen={isFormOpen} onClose={handleFormClose} onSuccess={fetchUsers} editingUser={editingUser} />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false)
          setDeletingUser(null)
        }}
        onConfirm={handleDeleteConfirm}
        userName={deletingUser?.displayName || ""}
      />
    </DashboardShell>
  )
}
