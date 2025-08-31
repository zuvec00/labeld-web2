import { Timestamp } from "firebase/firestore";

export interface UserModel {
  uid: string;
  email: string;
  username: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;

  isBrand: boolean;
  brandSpaceSetupComplete: boolean;
  profileSetupComplete: boolean;

  brandName?: string | null;
  brandCategory?: string | null;
  brandCoverImageUrl?: string | null;

  isVerified: boolean;
  followersCount: number;
  followingCount: number;

  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

// (Optional) Firestore converter if you want strongly-typed reads/writes:
// import { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";
// export const userConverter: FirestoreDataConverter<UserDoc> = {
//   toFirestore: (u: UserDoc) => u,
//   fromFirestore: (snap: QueryDocumentSnapshot, options: SnapshotOptions) => {
//     const data = snap.data(options) as any;
//     return { uid: snap.id, ...data } as UserDoc;
//   },
// };
