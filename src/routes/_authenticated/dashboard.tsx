import { createFileRoute } from '@tanstack/react-router'

/**
 * Example protected dashboard route
 * 
 * This route is protected by the _authenticated layout.
 * Only authenticated users can access /dashboard
 * 
 * To add more protected routes, create files in src/routes/_authenticated/
 */
export const Route = createFileRoute('/_authenticated/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground">
        This is a protected route. Only authenticated users can see this.
      </p>
    </div>
  )
}
