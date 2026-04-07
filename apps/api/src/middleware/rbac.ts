import type { Request, Response, NextFunction } from 'express'
import { can, Action, Resource, ScopeFilter } from '@msas/shared'

/**
 * RBAC middleware factory. Checks the policy table and attaches scopeFilter
 * to req for controllers to use when filtering results.
 */
export function authorize(action: Action, resource: Resource) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' })
      return
    }

    const scopeFilter = can(req.user.role, action, resource)
    if (scopeFilter === false) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    // Attach scope so controllers can filter data accordingly
    ;(req as Request & { scopeFilter: ScopeFilter }).scopeFilter = scopeFilter
    next()
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient role' })
      return
    }
    next()
  }
}
