import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string
) {
  return async function ProtectedComponent(props: P) {
    const user = await getCurrentUser()

    if (!user) {
      redirect('/login')
    }

    if (!hasPermission(user.role, requiredPermission)) {
      redirect('/unauthorized')
    }

    return <WrappedComponent {...props} />
  }
}

// Uso:
// export default withPermission(UserSettings, PERMISSIONS.settings.manage)
