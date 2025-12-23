'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { UserProfile } from "@/lib/types"

export async function getUsersAction(): Promise<UserProfile[]> {
    const users = await prisma.user.findMany({
        orderBy: { name: 'asc' }
    })

    return users.map(user => {
        let optimizedPhotoUrl = undefined
        if (user.photoUrl) {
            optimizedPhotoUrl = `/api/avatar/${user.id}`
        }
        return {
            id: user.id,
            sheetName: user.name, // Name matches "Nome na Planilha"
            displayName: user.name, // In future, if schema adds displayName, use it
            photoUrl: optimizedPhotoUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    })
}

export async function createUserAction(data: { sheetName: string; displayName: string; photoUrl?: string }) {
    // We use sheetName as the 'name' in DB because that's what ties to the webhook data
    const existing = await prisma.user.findFirst({
        where: { name: { equals: data.sheetName, mode: 'insensitive' } }
    })

    if (existing) {
        throw new Error("Usuário já existe")
    }

    await prisma.user.create({
        data: {
            name: data.sheetName,
            photoUrl: data.photoUrl
        }
    })

    revalidatePath('/admin/usuarios')
    revalidatePath('/tv-ranking')
    return { success: true }
}

export async function updateUserAction(id: string, data: { sheetName?: string; displayName?: string; photoUrl?: string }) {
    await prisma.user.update({
        where: { id },
        data: {
            name: data.sheetName,
            photoUrl: data.photoUrl
        }
    })

    revalidatePath('/admin/usuarios')
    revalidatePath('/tv-ranking')
    return { success: true }
}

export async function deleteUserAction(id: string) {
    await prisma.user.delete({
        where: { id }
    })

    revalidatePath('/admin/usuarios')
    revalidatePath('/tv-ranking')
    return { success: true }
}
