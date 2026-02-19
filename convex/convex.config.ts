import { defineApp } from 'convex/server'
import betterAuth from '@convex-dev/better-auth/convex.config'
import rateLimiter from '@convex-dev/rate-limiter/convex.config'
import aggregate from '@convex-dev/aggregate/convex.config'
import geospatial from '@convex-dev/geospatial/convex.config'
import actionRetrier from '@convex-dev/action-retrier/convex.config'

const app = defineApp()
app.use(betterAuth)
app.use(rateLimiter)

app.use(aggregate, { name: 'usersAggregate' })
app.use(aggregate, { name: 'productsAggregate' })
app.use(aggregate, { name: 'votesByProduct' })
app.use(aggregate, { name: 'followsByFollower' })
app.use(aggregate, { name: 'followsByFollowing' })

app.use(geospatial)
app.use(actionRetrier)

export default app
