import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { appConfig } from '@/lib/app-config'
import { isNative } from '@/lib/platform'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { logger } from '@/lib/logger'

export const Route = createFileRoute('/login')({
  component: Login,
})

interface SessionData {
  user?: {
    id: string
    email: string
    name?: string
  }
}

function Login() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [session, setSession] = useState<SessionData | null>(null)

  useEffect(() => {
    // Check if already logged in
    authClient.getSession().then((s) => {
      setSession(s.data)
      if (s.data) {
        // Already logged in, redirect to home
        navigate({ to: '/' })
      }
    })
  }, [navigate])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        // On native, better-auth-capacitor converts this to gmatrix://auth/callback
        callbackURL: isNative() ? '/auth/callback' : '/',
      })
      // On native, signIn.social returns { redirect: false } — the capacitor
      // plugin handles the OAuth flow via system browser + deep link callback.
      // Session is stored in Capacitor Preferences and picked up automatically.
      if (result.error) {
        logger.error('Login failed:', result.error)
        setIsLoading(false)
      }
    } catch (error: unknown) {
      logger.error('Login failed:', error)
      setIsLoading(false)
    }
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t('login.alreadyLoggedIn')}</CardTitle>
            <CardDescription>{t('login.redirecting')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md rounded-2xl shadow-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-foreground">{t('login.welcomeTo', { appName: appConfig.appName })}</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {appConfig.tagline}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits Section */}
          <div className="space-y-3 p-4 bg-background rounded-xl">
            <h3 className="font-semibold text-sm text-foreground">{t('login.whySignIn')}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('login.voteWeight')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('login.earnPoints')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('login.trackHistory')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{t('login.accessLeaderboard')}</span>
              </li>
            </ul>
          </div>

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('login.signingIn')}
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('login.continueGoogle')}
              </>
            )}
          </Button>

          {/* Continue as Guest */}
          <div className="text-center">
            <Button variant="link" asChild>
              <Link to="/">
                {t('login.continueGuest')}
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {t('login.guestNote')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
