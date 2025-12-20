'use client';
import { useEffect, useState, useCallback }from 'react';
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

  const fetchData = useCallback(() => {
     if (userLoading) {
      // Don't fetch if the user state is not yet determined
      return;
    }

    if (!user) {
      // If there is no user, clear data and stop loading
      setData(null);
      setLoading(false);
      return;
    }
    
    // If there's a query but the value is undefined, it means we are waiting
    // for a dependency (like user.uid), so we don't execute the query yet.
    if (queryParams && queryParams[2] === undefined) {
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

    setLoading(true);
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

    return unsubscribe;
  }, [firestore, path, user, userLoading, JSON.stringify(queryParams)])

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchData]);

  return { data, loading, forceUpdate: fetchData };
}
