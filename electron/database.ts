import path from 'node:path'
import { app } from 'electron'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Initialize Prisma Client
let prisma: any

export function initDatabase() {
    // Set database path to user data directory for production
    const isDev = process.env.NODE_ENV === 'development'
    const dbPath = isDev
        ? path.join(process.cwd(), 'prisma', 'dev.db')
        : path.join(app.getPath('userData'), 'respresso.db')

    // In production, if the database doesn't exist in userData, copy the template from the app bundle
    if (!isDev) {
        const fs = require('node:fs')
        if (!fs.existsSync(dbPath)) {
            const templatePath = path.join(process.resourcesPath, 'prisma', 'dev.db')
            if (fs.existsSync(templatePath)) {
                fs.copyFileSync(templatePath, dbPath)
            }
        }
    }

    process.env.DATABASE_URL = `file:${dbPath}`

    // Use require to load Prisma Client (fixes ESM issues in Electron)
    const { PrismaClient } = require('@prisma/client')

    prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    })

    return prisma
}

export function getDatabase() {
    if (!prisma) {
        throw new Error('Database not initialized. Call initDatabase() first.')
    }
    return prisma
}

export async function closeDatabase() {
    if (prisma) {
        await prisma.$disconnect()
    }
}
