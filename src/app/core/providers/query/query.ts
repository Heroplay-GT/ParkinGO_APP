import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class Query {
  constructor(private readonly fs: Firestore) { }

  async create(collectionName: string, data: any) {
    try {
      const collect = collection(this.fs, collectionName);
      await addDoc(collect, data);
    } catch (error) {
      console.error('Error adding document:', (error as any).message);
    }
  }

}
