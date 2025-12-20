'use client';
import { useEffect, useState }from 'react';
import {
  onSnapshot,
  query,
  collection,
  where,
  type Firestore,
  type Query,
  type DocumentData,
} from 'firebase/firestore';

import { useFirestore } from '../provider';

type CollectionOptions = {
  path: string;
  query?: [string, '==', any];
};

/**
 * @name useCollection
 * @description A hook that returns a collection from Firestore.
 * @param options - The collection options.
 * @returns The collection data.
 */
export function useCollection<T extends DocumentData>({
  path,
  query: queryParams,
}: CollectionOptions) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q: Query;

    if (queryParams) {
      q = query(collection(firestore, path), where(...queryParams));
    } else {
      q = query(collection(firestore, path));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as T[];
      setData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, path, JSON.stringify(queryParams)]);

  return { data, loading };
}
