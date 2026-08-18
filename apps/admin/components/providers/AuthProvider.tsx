"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase/client"

interface AuthContextType { user: User | null; loading: boolean }

const AuthContext = createContext<AuthContextType>({user:null,loading:true})

// How long to wait for Firebase's first auth-state report before rendering the
// UI anyway. Generous enough for a slow token refresh, short enough that a
// blocked one doesn't look like a hung page.
const AUTH_INIT_TIMEOUT_MS = 6000

export function AuthProvider(props: Readonly<{children: React.ReactNode}>){
    const { children } = props
    const [user,setUser]= useState<User|null>(null)
    const [loading,setLoading] = useState<boolean>(true)

    useEffect(()=>{
        // Watchdog: for a signed-in user Firebase resolves the persisted session
        // from IndexedDB and refreshes the ID token before it reports an auth
        // state. If either step hangs — a privacy/ad-blocking extension blocking
        // securetoken.googleapis.com, or IndexedDB unavailable — the callback
        // never fires and every screen gated on `loading` spins forever. (This is
        // why the login page can hang in a normal tab yet work in incognito,
        // where there's no persisted session and extensions are usually off.)
        // After the timeout we stop blocking the UI; the listener below still
        // updates `user` if it resolves late.
        const watchdog = setTimeout(()=> setLoading(false), AUTH_INIT_TIMEOUT_MS)

        const unsubs = onAuthStateChanged(auth,(user)=>{
            clearTimeout(watchdog)
            setUser(user)
            setLoading(false)
        })

        return ()=>{
            clearTimeout(watchdog)
            unsubs()
        };
    }, [])

    return (
        <AuthContext.Provider value={{user,loading}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = ()=> useContext(AuthContext)

