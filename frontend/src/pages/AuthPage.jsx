import { useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import * as api from "@/lib/api"

const COPY = {
  login: {
    title: "Sign in",
    description: "Name and password. That's the whole form.",
    submit: "Sign in",
    pending: "Signing in",
  },
  register: {
    title: "Create account",
    description: "Pick a name nobody has taken yet.",
    submit: "Create account",
    pending: "Creating account",
  },
}

export function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState("login")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copy = COPY[mode]

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result =
        mode === "login"
          ? await api.login(name, password)
          : await api.register(name, password)

      onAuthenticated(result)
    } catch (submitError) {
      // the backend sends { error } for a single message and { details: [] }
      // for Joi validation failures — show whichever we got
      setError(submitError.details?.join(". ") ?? submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList>
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            {/* Both tabs render the same form. Keeping one <form> means the typed
                values survive switching tabs instead of being wiped. */}
            <TabsContent value={mode} forceMount>
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="font-display text-3xl tracking-tight">
                    {copy.title}
                  </CardTitle>
                  <CardDescription>{copy.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="name">Trainer name</Label>
                      <Input
                        id="name"
                        name="name"
                        autoComplete="username"
                        placeholder="ash"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        aria-invalid={Boolean(error)}
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={
                          mode === "login" ? "current-password" : "new-password"
                        }
                        placeholder="••••••••"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={Boolean(error)}
                        required
                      />
                      {mode === "register" && (
                        <p className="text-muted-foreground text-xs">
                          8 characters or more.
                        </p>
                      )}
                    </div>

                    {error && <ErrorNotice message={error} />}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" />
                          {copy.pending}
                        </>
                      ) : (
                        copy.submit
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-muted-foreground mt-6 text-center text-xs">
            {mode === "login" ? "No account yet?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() =>
                handleModeChange(mode === "login" ? "register" : "login")
              }
              className="text-foreground underline-offset-4 hover:underline"
            >
              {mode === "login" ? "Create one" : "Sign in instead"}
            </button>
          </p>

          <p className="text-muted-foreground/70 mt-3 text-center text-xs">
            <a href="#/donut" className="underline-offset-4 hover:underline">
              Lab: ASCII donut
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

// role="alert" makes screen readers announce this the moment it appears,
// which a plain <div> would not do.
function ErrorNotice({ message }) {
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/8 text-destructive flex items-start gap-2.5 border px-3 py-2.5 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Real sprites, not a gradient. Sprite files are served straight from the PokeAPI
// repo and named by pokedex number, so no API call and no loading state — just
// <img> tags the browser caches.
const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"

const SPRITE_IDS = [
  1, 4, 7, 10, 16, 19, 23, 25, 27, 35, 37, 39,
  41, 43, 50, 52, 54, 58, 60, 63, 66, 69, 72, 74,
  77, 79, 81, 84, 86, 90, 92, 95, 98, 100, 104, 108,
  111, 114, 116, 118, 120, 123, 129, 133, 138, 143, 147, 150,
]

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[oklch(0.14_0.02_300)] lg:flex lg:flex-col lg:justify-between lg:p-12">
      <SpriteWall />

      {/* scrim so the type stays readable over the sprites */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,oklch(0.14_0.02_300)_30%,oklch(0.14_0.02_300/0.86)_52%,oklch(0.14_0.02_300/0.25)_88%,transparent_100%)]"
      />

      <div className="relative">
        <div className="inline-flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
          <span className="bg-primary size-1.5" />
          151 sprites, one database
        </div>
      </div>

      <div className="relative">
        <h1 className="font-display text-6xl leading-[0.92] font-semibold tracking-tight text-white xl:text-7xl">
          Pokémon
          <span className="block text-white/30">Collection</span>
        </h1>
        <p className="mt-6 max-w-sm text-lg leading-relaxed text-white/55">
          A side project for learning Postgres and session auth. The Pokémon are
          the excuse.
        </p>
      </div>

      <dl className="relative grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
        <Stat label="Sessions last" value="24 hours" />
        <Stat label="Passwords" value="bcrypt" />
        <Stat label="Tokens" value="Revocable" />
      </dl>
    </aside>
  )
}

function SpriteWall() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-6 -right-10 -left-10 grid grid-cols-7 gap-3 opacity-80"
    >
      {SPRITE_IDS.map((id) => (
        <img
          key={id}
          src={`${SPRITE_BASE}/${id}.png`}
          alt=""
          loading="lazy"
          width={96}
          height={96}
          // pixelated keeps the sprites crisp instead of blurring them when scaled;
          // onError hides any that fail so a dead URL leaves a gap, not a broken icon
          className="pixelated size-full"
          onError={(event) => {
            event.currentTarget.style.visibility = "hidden"
          }}
        />
      ))}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-[0.7rem] tracking-wide text-white/40 uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-medium text-white/85">{value}</dd>
    </div>
  )
}
