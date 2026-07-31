# Protect content and read user data

Clerk provides a set of [hooks and helpers](https://clerk.com/docs/reference/nextjs/overview.md#client-side-helpers) that you can use to protect content and read user data in your Next.js application. Here are examples of how to use these helpers in both the client and server-side to get you started.

## Server-side

### App Router

[auth()](https://clerk.com/docs/reference/nextjs/app-router/auth.md) and [currentUser()](https://clerk.com/docs/reference/nextjs/app-router/current-user.md) are App Router-specific helpers that you can use inside of your Route Handlers, Middleware, Server Components, and Server Actions.

- The `auth()` helper will return the [`Auth`](https://clerk.com/docs/reference/backend/types/auth-object.md) object of the currently active user.
- The `currentUser()` helper will return the [`Backend User`](https://clerk.com/docs/reference/backend/types/backend-user.md) object of the currently active user, which includes helpful information like the user's name or email address. **It does count towards the [Backend API request rate limit](https://clerk.com/docs/guides/how-clerk-works/system-limits.md)** so it's recommended to use the [useUser()](https://clerk.com/docs/nextjs/reference/hooks/use-user.md) hook on the client side when possible and only use `currentUser()` when you specifically need user data in a server context. For more information on this helper, see the [currentUser()](https://clerk.com/docs/reference/nextjs/app-router/current-user.md) reference.

The following example uses the [auth()](https://clerk.com/docs/reference/nextjs/app-router/auth.md) helper to validate an authenticated user and the `currentUser()` helper to access the `Backend User` object for the authenticated user.

> Any requests from a Client Component to a Route Handler will read the session from cookies and will not need the token sent as a Bearer token.

**Server components and actions**

filename: app/page.tsx
```tsx
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function Page() {
  // Use `auth()` to access `isAuthenticated` - if false, the user is not signed in
  const { isAuthenticated } = await auth()

  // Protect the route by checking if the user is signed in
  if (!isAuthenticated) {
    return <div>Sign in to view this page</div>
  }

  // Get the Backend User object when you need access to the user's information
  const user = await currentUser()

  // Use `user` to render user details or create UI elements
  return <div>Welcome, {user.firstName}!</div>
}
```

**Route Handler**

> The [`Backend User`](https://clerk.com/docs/reference/backend/types/backend-user.md) object includes a `privateMetadata` field that should not be exposed to the frontend. Avoid passing the full user object returned by `currentUser()` to the frontend. Instead, pass only the specified fields you need.

filename: app/api/user/route.ts
```tsx
import { NextResponse } from 'next/server'
import { currentUser, auth } from '@clerk/nextjs/server'

export async function GET() {
  // Use `auth()` to access `isAuthenticated` - if false, the user is not signed in
  const { isAuthenticated } = await auth()

  // Protect the route by checking if the user is signed in
  if (!isAuthenticated) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Use `currentUser()` to get the Backend User object
  const user = await currentUser()

  // Add your Route Handler's logic with the returned `user` object

  return NextResponse.json(
    { userId: user.id, email: user.emailAddresses[0].emailAddress },
    { status: 200 },
  )
}
```

### Pages Router

For Next.js applications using the Pages Router, the [getAuth()](https://clerk.com/docs/reference/nextjs/pages-router/get-auth.md) helper will return the [`Auth`](https://clerk.com/docs/reference/backend/types/auth-object.md) object of the currently active user, which contains important information like the current user's session ID, user ID, and Organization ID, as well as the `isAuthenticated` property which can be used to protect your API routes.

In some cases, you may need the full [`Backend User`](https://clerk.com/docs/reference/backend/types/backend-user.md) object of the currently active user. This is helpful if you want to render information, like their first and last name, directly from the server.

The `clerkClient()` helper returns an instance of [`clerkClient`](https://clerk.com/docs/reference/backend/overview.md), which exposes Clerk's Backend API resources through methods such as the [`getUser()`](https://clerk.com/docs/reference/backend/user/get-user.md){{ target: '_blank' }} method. This method returns the full `Backend User` object. **It does count towards the [Backend API request rate limit](https://clerk.com/docs/guides/how-clerk-works/system-limits.md)** so it's recommended to use the [useUser()](https://clerk.com/docs/nextjs/reference/hooks/use-user.md) hook on the client side when possible and only use `getUser()` when you specifically need user data in a server context.

In the following example, the `userId` is passed to the `getUser()` method to get the user's full `Backend User` object.

**API Route**

filename: pages/api/auth.ts
```tsx
import { getAuth, clerkClient } from '@clerk/nextjs/server'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use `getAuth()` to access `isAuthenticated` and the user's ID
  const { isAuthenticated, userId } = getAuth(req)

  // Protect the route by checking if the user is signed in
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Initialize `clerkClient`
  const client = await clerkClient()

  // Use the `getUser()` method to get the user's full `Backend User` object
  const user = await client.users.getUser(userId)

  return res.status(200).json({ user })
}
```

**getServerSideProps**

The `buildClerkProps()` function is used in your Next.js application's `getServerSideProps` to pass authentication state from the server to the client. It returns props that get spread into the `<ClerkProvider>` component. This enables Clerk's client-side helpers, such as `useAuth()`, to correctly determine the user's authentication status during server-side rendering.

filename: pages/example.tsx
```tsx
import { getAuth, buildClerkProps } from '@clerk/nextjs/server'
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // Use `getAuth()` to access `isAuthenticated` and the user's ID
  const { isAuthenticated, userId } = getAuth(ctx.req)

  // Protect the route by checking if the user is signed in
  if (!isAuthenticated) {
    return {
      redirect: {
        destination: '/sign-in',
        permanent: false,
      },
    }
  }

  // Initialize `clerkClient`
  const client = await clerkClient()

  // Use the `getUser()` method to get the user's full `Backend User` object
  const user = await client.users.getUser(userId)

  // Pass the `user` object to buildClerkProps()
  return { props: { ...buildClerkProps(ctx.req, { user }) } }
}
```

## Client-side

### `useAuth()`

The following example uses the [useAuth()](https://clerk.com/docs/nextjs/reference/hooks/use-auth.md) hook to access the current auth state, as well as helper methods to manage the current session.

filename: example.tsx
```tsx
export default function Example() {
  const { isLoaded, isSignedIn, userId, sessionId, getToken } = useAuth()

  const fetchExternalData = async () => {
    // Use `getToken()` to get the current user's session token
    const token = await getToken()

    // Use `token` to fetch data from an external API
    const response = await fetch('https://api.example.com/data', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    return response.json()
  }

  // Use `isLoaded` to check if Clerk is loaded
  if (!isLoaded) {
    return <div>Loading...</div>
  }

  // Use `isSignedIn` to check if the user is signed in
  if (!isSignedIn) {
    // You could also add a redirect to the sign-in page here
    return <div>Sign in to view this page</div>
  }

  return (
    <div>
      Hello, {userId}! Your current active session is {sessionId}.
    </div>
  )
}
```

### `useUser()`

The following example demonstrates how to use the [useUser()](https://clerk.com/docs/nextjs/reference/hooks/use-user.md) hook to access the [User](https://clerk.com/docs/nextjs/reference/objects/user.md) object, which contains the current user's data such as their ID.

filename: app/page.tsx
```tsx
'use client'

import { useUser } from '@clerk/nextjs'

export default function Page() {
  const { isSignedIn, user, isLoaded } = useUser()

  // Handle loading state
  if (!isLoaded) return <div>Loading...</div>

  // Protect the page from unauthenticated users
  if (!isSignedIn) return <div>Sign in to view this page</div>

  return <div>Hello {user.id}!</div>
}
```
