"use client"

import type React from "react"
import { useState, useRef, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Upload, Loader2, User } from "lucide-react"
import type { UserProfile } from "@/lib/types"
import { createUserAction, updateUserAction } from "@/app/actions/user-actions"

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingUser?: UserProfile | null
}

export function UserFormModal({ isOpen, onClose, onSuccess, editingUser }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    sheetName: editingUser?.sheetName || "",
    displayName: editingUser?.displayName || "",
    photoUrl: editingUser?.photoUrl || "",
  })
  const [previewUrl, setPreviewUrl] = useState(editingUser?.photoUrl || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione uma imagem válida")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setFormData((prev) => ({ ...prev, photoUrl: base64 }))
      setPreviewUrl(base64)
      setError("")
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (editingUser) {
        await updateUserAction(editingUser.id, formData)
      } else {
        await createUserAction(formData)
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold tracking-tight">{editingUser ? "Editar Usuário" : "Novo Usuário"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="photo" className="text-sm font-semibold">
              Foto do Usuário
            </Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Foto
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Imagem JPG, PNG ou GIF (máx. 5MB)</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheetName" className="text-sm font-semibold">
              Nome da Planilha <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sheetName"
              value={formData.sheetName}
              onChange={(e) => setFormData({ ...formData, sheetName: e.target.value })}
              placeholder="Nome exato como aparece na planilha"
              required
              disabled={!!editingUser}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Este nome deve ser idêntico ao nome usado na planilha Google Sheets
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-semibold">
              Nome de Exibição <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="Nome que aparecerá no ranking"
              required
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">Este nome será exibido no dashboard e ranking</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : editingUser ? (
                "Atualizar"
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
