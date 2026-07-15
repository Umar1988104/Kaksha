import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase'

export async function sendMessage({ orgId, parentUid, parentName, headUid, studentId, studentName, senderRole, text }) {
  await addDoc(collection(db, 'messages'), {
    orgId,
    parentUid,
    parentName,
    headUid,
    studentId,
    studentName,
    senderRole,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    read: false
  })
}
