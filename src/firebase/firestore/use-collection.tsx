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
import { useUser } from '../auth/use-user';

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
  const { user, loading: userLoading } = useUser();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) {
      // Still waiting for auth state
      return;
    }

    if (!user) {
      // User is not authenticated, don't fetch data
      setData(null);
      setLoading(false);
      return;
    }

    let q: Query;
    const collectionRef = collection(firestore, path);

    if (queryParams) {
      q = query(collectionRef, where(...queryParams));
    } else {
      q = query(collectionRef);
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as T[];
      setData(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching collection: ", error);
      setData(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, path, user, userLoading, JSON.stringify(queryParams)]);

  return { data, loading };
}
