'use client';
import { useEffect, useState } from 'react';
import {
  onSnapshot,
  doc,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';

import { useFirestore } from '../provider';

type DocOptions = {
  path: string;
  id: string;
};

/**
 * @name useDoc
 * @description A hook that returns a document from Firestore.
 * @param options - The document options.
 * @returns The document data.
 */
export function useDoc<T extends DocumentData>({ path, id }: DocOptions) {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !path) {
      setLoading(false);
      setData(null);
      return;
    }

    const docRef = doc(firestore, path, id);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = {
          ...snapshot.data(),
          id: snapshot.id,
        } as T;
        setData(data);
      } else {
        setData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, path, id]);

  return { data, loading };
}
