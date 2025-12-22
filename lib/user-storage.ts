"use server"

import type { UserProfile } from "./types"

// In-memory storage - Replace with database in production
const users: UserProfile[] = [
  {
    id: "default-1",
    sheetName: "Carlos Silva",
    displayName: "Carlos Silva",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-2",
    sheetName: "Ana Santos",
    displayName: "Ana Santos",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-3",
    sheetName: "Roberto Lima",
    displayName: "Roberto Lima",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function getAllUsers(): Promise<UserProfile[]> {
  return users.sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export async function getUsers(): Promise<UserProfile[]> {
  return getAllUsers()
}

export async function getUserBySheetName(sheetName: string): Promise<UserProfile | null> {
  return users.find((u) => u.sheetName === sheetName) || null
}

export async function createUser(data: Omit<UserProfile, "id" | "createdAt" | "updatedAt">): Promise<{
  success: boolean
  user?: UserProfile
  error?: string
}> {
  // Validate required fields
  if (!data.sheetName || !data.displayName) {
    return { success: false, error: "Nome da planilha e nome de exibição são obrigatórios" }
  }

  // Check for duplicate sheet name
  const existing = users.find((u) => u.sheetName === data.sheetName)
  if (existing) {
    return { success: false, error: "Já existe um usuário com este nome da planilha" }
  }

  // Validate photo if provided
  if (data.photoUrl) {
    if (!data.photoUrl.startsWith("data:image/") && !data.photoUrl.startsWith("http")) {
      return { success: false, error: "URL da foto inválida" }
    }
  }

  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    sheetName: data.sheetName.trim(),
    displayName: data.displayName.trim(),
    photoUrl: data.photoUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  users.push(newUser)
  return { success: true, user: newUser }
}

export async function updateUser(
  id: string,
  data: Partial<Omit<UserProfile, "id" | "createdAt" | "updatedAt">>,
): Promise<{
  success: boolean
  user?: UserProfile
  error?: string
}> {
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) {
    return { success: false, error: "Usuário não encontrado" }
  }

  // Check for duplicate sheet name if updating
  if (data.sheetName) {
    const existing = users.find((u) => u.sheetName === data.sheetName && u.id !== id)
    if (existing) {
      return { success: false, error: "Já existe um usuário com este nome da planilha" }
    }
  }

  // Validate photo if provided
  if (data.photoUrl !== undefined && data.photoUrl) {
    if (!data.photoUrl.startsWith("data:image/") && !data.photoUrl.startsWith("http")) {
      return { success: false, error: "URL da foto inválida" }
    }
  }

  const updatedUser = {
    ...users[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  users[index] = updatedUser
  return { success: true, user: updatedUser }
}

export async function deleteUser(id: string): Promise<{
  success: boolean
  error?: string
}> {
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) {
    return { success: false, error: "Usuário não encontrado" }
  }

  users.splice(index, 1)
  return { success: true }
}
