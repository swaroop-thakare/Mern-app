"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function withAuth(Component: React.ComponentType) {
  return function AuthenticatedComponent(props: any) {
    const router = useRouter()

    useEffect(() => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/")
      }
    }, [router])

    return <Component {...props} />
  }
}
