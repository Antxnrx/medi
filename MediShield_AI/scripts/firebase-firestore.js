// Firebase Firestore v9.6.1
// This is a compatibility wrapper to allow using Firebase Firestore with older module formats

// Firebase Firestore is loaded via script tag in popup.html

// Export the Firestore functionality globally for compatibility with v8 SDK
window.firebase = window.firebase || {};
const db = getFirestore();

window.firebase.firestore = () => {
  return {
    collection: (path) => {
      const collectionRef = collection(db, path);
      return {
        doc: (docPath) => {
          const docRef = doc(collectionRef, docPath);
          return {
            collection: (subCollectionPath) => {
              const subCollectionRef = collection(docRef, subCollectionPath);
              return {
                doc: (subDocPath) => {
                  const subDocRef = doc(subCollectionRef, subDocPath || Math.random().toString(36).substring(2, 15));
                  return {
                    set: (data) => setDoc(subDocRef, data),
                    get: () => getDoc(subDocRef)
                  };
                },
                get: () => getDocs(subCollectionRef),
                orderBy: (field, direction) => {
                  const q = query(subCollectionRef, orderBy(field, direction));
                  return {
                    get: () => getDocs(q)
                  };
                }
              };
            },
            set: (data) => setDoc(docRef, data),
            get: () => getDoc(docRef)
          };
        },
        get: () => getDocs(collectionRef),
        orderBy: (field, direction) => {
          const q = query(collectionRef, orderBy(field, direction));
          return {
            get: () => getDocs(q)
          };
        }
      };
    },
    batch: () => {
      const batch = writeBatch(db);
      return {
        set: (docRef, data) => {
          batch.set(docRef, data);
          return batch;
        },
        commit: () => batch.commit()
      };
    },
    FieldValue: {
      serverTimestamp: () => serverTimestamp()
    }
  };
};