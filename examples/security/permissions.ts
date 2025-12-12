// Definição de permissões
export const PERMISSIONS = {
  users: {
    create: 'users:create',
    read: 'users:read',
    update: 'users:update',
    delete: 'users:delete',
  },
  billing: {
    read: 'billing:read',
    manage: 'billing:manage',
  },
  settings: {
    read: 'settings:read',
    manage: 'settings:manage',
  },
} as const

// Roles e suas permissões
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    ...Object.values(PERMISSIONS.users),
    ...Object.values(PERMISSIONS.billing),
    ...Object.values(PERMISSIONS.settings),
  ],
  admin: [
    ...Object.values(PERMISSIONS.users),
    PERMISSIONS.billing.read,
    ...Object.values(PERMISSIONS.settings),
  ],
  member: [
    PERMISSIONS.users.read,
    PERMISSIONS.settings.read,
  ],
  viewer: [
    PERMISSIONS.users.read,
  ],
}

// Função de checagem
export function hasPermission(
  userRole: string,
  permission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || []
  return permissions.includes(permission)
}
