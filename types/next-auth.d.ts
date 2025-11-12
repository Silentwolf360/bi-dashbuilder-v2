import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      department?: string
      region?: string
      agentCode?: string
      roles?: Array<{
        id: string
        name: string
        description?: string
      }>
    } & DefaultSession["user"]
  }

  interface User {
    department?: string
    region?: string
    agentCode?: string
    roles?: Array<{
      id: string
      name: string
      description?: string
    }>
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    department?: string
    region?: string
    agentCode?: string
    roles?: Array<{
      id: string
      name: string
      description?: string
    }>
  }
}
