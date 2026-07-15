import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(undefined) // undefined = loading, null = no profile doc yet (needs onboarding)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const snap = await getDoc(doc(db, 'users', user.uid))
    setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user === undefined) return // auth still loading
    refreshProfile()
  }, [user, refreshProfile])

  const role = profile?.role || null // 'head' | 'teacher' | 'parent'
  const mode = profile?.mode || null // 'solo' | 'org'
  const orgId = profile?.orgId || null
  const linkedStudentIds = profile?.linkedStudentIds || []

  // Who can actually add/edit/delete data:
  // - Head: yes, always
  // - Solo teacher: yes, it's their own personal space
  // - Org teacher: no, view + suggest only — EXCEPT attendance, which every
  //   teacher marks day-to-day regardless of role.
  // - Parent: never — read-only view of their own linked child only.
  const canEdit = role === 'head' || mode === 'solo'
  const isHead = role === 'head'
  const isOrgTeacher = role === 'teacher' && mode === 'org'
  const isParent = role === 'parent'
  const canMarkAttendance = canEdit || isOrgTeacher

  return (
    <RoleContext.Provider value={{ profile, loading, role, mode, orgId, linkedStudentIds, canEdit, canMarkAttendance, isHead, isOrgTeacher, isParent, refreshProfile }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
