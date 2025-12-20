'use client';
import { useEffect, useState, useMemo } from 'react';
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

  // Memoize queryParams to prevent re-running the effect on every render
  const memoizedQuery = useMemo(() => queryParams, [JSON.stringify(queryParams)]);

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }

    let q: Query;
    const collectionRef = collection(firestore, path);
    
    if (memoizedQuery) {
      const [field, op, value] = memoizedQuery;
      // If the query is dependent on a value that isn't ready (e.g., user.uid is null/undefined), we must wait.
      // Do not proceed to execute a query with a null/undefined value, as it will return no results.
      if (!value) {
         setLoading(true); // Keep loading state
         setData(null); // Ensure no stale data is shown
         return; // Wait for user.uid to be available
      }
      q = query(collectionRef, where(field, op, value));
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

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [firestore, path, userLoading, memoizedQuery]);

  const forceUpdate = () => {
     // This is a dummy function now, as useEffect handles updates.
     // If a manual refetch is truly needed, we would need to add a state to trigger the effect.
     // For now, the real-time nature of onSnapshot makes this less critical.
     console.log("forceUpdate called, but data is real-time.");
  }

  return { data, loading, forceUpdate };
}
