import { lazy, Suspense, useEffect, useState } from "react"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthPage } from "@/pages/AuthPage"
import * as api from "@/lib/api"

// Loaded only when someone actually opens #/donut. Three.js is ~525kB, and a
// static import would put all of it in the bundle every visitor downloads just
// to reach the login form. lazy() splits it into its own file fetched on demand.
// The .then() is because AsciiDonut is a named export and lazy() wants a default.
const AsciiDonut = lazy(() =>
  import("@/pages/AsciiDonut").then((module) => ({ default: module.AsciiDonut }))
)

// A router in nine lines. The hash (#/donut) is the one part of the URL the
// browser never sends to the server, so changing it navigates without a reload
// and without needing server-side route config. Enough for a scratch project —
// swap in react-router when you want real paths and history.
function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash)

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash)

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  return route
}

function App() {
  const route = useHashRoute()
  // The whole auth state is this one variable: null = logged out,
  // { token, user } = logged in. It lives in memory only, so a page refresh
  // signs you out. That is deliberate for now — nothing in localStorage means
  // nothing for an injected script to steal.
  const [session, setSession] = useState(null)

  // checked before auth — the lab pages are public
  if (route === "#/donut") {
    // Suspense shows the fallback while that split chunk downloads
    return (
      <Suspense
        fallback={
          <div className="flex min-h-svh items-center justify-center bg-black text-sm text-white/40">
            Loading Three.js…
          </div>
        }
      >
        <AsciiDonut />
      </Suspense>
    )
  }

  if (!session) {
    return <AuthPage onAuthenticated={setSession} />
  }

  return <Dashboard session={session} onSignOut={() => setSession(null)} />
}

// Deliberately bare — this exists to prove the protected route works end to end.
// The real app goes here later.
function Dashboard({ session, onSignOut }) {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    // isActive guards against setting state after the component is gone —
    // React 19 StrictMode runs effects twice in development.
    let isActive = true

    api
      .getMe(session.token)
      .then((data) => {
        if (isActive) setProfile(data.user)
      })
      .catch((fetchError) => {
        if (isActive) setError(fetchError.message)
      })

    return () => {
      isActive = false
    }
  }, [session.token])

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      // deletes the session row so the token stops working immediately
      await api.logout(session.token)
    } catch {
      // even if the call fails, drop it locally — the token expires server-side anyway
    } finally {
      onSignOut()
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-3xl tracking-tight">
            Signed in as {session.user.name}
          </CardTitle>
          <CardDescription>
            The card below came from <code className="text-xs">GET /users/me</code>,
            a route that requires your token.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}

          {profile && (
            <dl className="bg-muted/50 grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
              <dt className="text-muted-foreground">User id</dt>
              <dd className="text-right font-medium">{profile.id}</dd>

              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-right font-medium">{profile.name}</dd>

              <dt className="text-muted-foreground">Joined</dt>
              <dd className="text-right font-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </dd>
            </dl>
          )}

          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
