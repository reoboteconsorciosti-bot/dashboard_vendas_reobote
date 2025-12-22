// Rate limiting and security utilities
type RateLimitStore = Map<string, { count: number; resetTime: number }>

const rateLimitStore: RateLimitStore = new Map()

export function rateLimit(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>{}]/g, "") // Remove potential XSS characters
    .substring(0, 500) // Limit length
}

export function validateWebhookToken(token: string | null): boolean {
  const validToken = process.env.N8N_WEBHOOK_TOKEN
  if (!validToken) return true // Allow in development
  return token === validToken
}

export function hashPassword(password: string): string {
  // In production, use bcrypt or similar
  // For now, using simple hash
  return Buffer.from(password).toString("base64")
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Audit log type
export interface AuditLog {
  id: string
  timestamp: number
  action: "create" | "update" | "delete"
  resource: string
  userId?: string
  details: string
}

const auditLogs: AuditLog[] = []

export function logAudit(log: Omit<AuditLog, "id" | "timestamp">) {
  auditLogs.push({
    ...log,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  })

  // Keep only last 1000 logs in memory
  if (auditLogs.length > 1000) {
    auditLogs.shift()
  }

  console.log(`[AUDIT] ${log.action.toUpperCase()} ${log.resource} - ${log.details}`)
}

export function getAuditLogs(): AuditLog[] {
  return [...auditLogs].reverse() // Most recent first
}
