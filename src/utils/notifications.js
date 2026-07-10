import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase'

export async function sendNotification({ orgId, targetUid, type, title, message, link }) {
  if (!targetUid) return // nothing to notify if we don't know who the head/teacher is
  await addDoc(collection(db, 'notifications'), {
    orgId,
    targetUid,
    type,
    title,
    message,
    link: link || null,
    read: false,
    createdAt: new Date().toISOString()
  })
}
