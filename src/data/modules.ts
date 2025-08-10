// src/data/modules.ts
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../app/firebase";

export type ModuleDoc = {
  id: string;
  title: string;
  kind: "history" | "story" | "blog";
  bibleVersion: "KJV" | "NKJV";
  updatedAt: number;           // store as millis since epoch
  contentHtml: string;         // sanitized HTML you author
  quiz: any[];                 // {type:'mcq'|'fitb', ...}
};

export async function fetchModules(): Promise<ModuleDoc[]> {
  if (!db) return [];
  const q = query(collection(db, "modules"), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ModuleDoc, "id">) }));
}
