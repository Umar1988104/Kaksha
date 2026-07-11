import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, onAuthStateChanged,
  reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signOut
} from 'firebase/auth'
import { doc, deleteDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still checking, null = logged out

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return unsub
  }, [])

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const signup = (email, password) => createUserWithEmailAndPassword(auth, email, password)
  const logout = () => signOut(auth)
  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  // Deleting an account is a "sensitive" operation — Firebase requires the
  // user to have signed in recently, so we re-verify their password first.
  // This only removes their own login + profile doc; it does NOT touch an
  // organization's shared data (students, fees, etc.), since that belongs
  // to the org, not to any one account.
  async function deleteAccount(password) {
    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(auth.currentUser, credential)
    await deleteDoc(doc(db, 'users', user.uid)).catch(() => {})
    await deleteUser(auth.currentUser)
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, resetPassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
