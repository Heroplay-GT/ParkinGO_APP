import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SeedSpacesService {

  constructor(private firestore: Firestore) {}

  async seedSpaces() {
    const spaces = [
      // 🚗 Car spaces
      { code: 'A1', vehicleType: 'Car', status: 'Available', pricePerHour: 5500 },
      { code: 'A2', vehicleType: 'Car', status: 'Available', pricePerHour: 5500 },
      { code: 'A3', vehicleType: 'Car', status: 'Available', pricePerHour: 5500 },
      { code: 'A4', vehicleType: 'Car', status: 'Available', pricePerHour: 5500 },

      // 🏍️ Motorcycle spaces
      { code: 'M1', vehicleType: 'Motorcycle', status: 'Available', pricePerHour: 3000 },
      { code: 'M2', vehicleType: 'Motorcycle', status: 'Available', pricePerHour: 3000 },
      { code: 'M3', vehicleType: 'Motorcycle', status: 'Available', pricePerHour: 3000 },
      { code: 'M4', vehicleType: 'Motorcycle', status: 'Available', pricePerHour: 3000 },

      // 🚲 Bicycle spaces
      { code: 'B1', vehicleType: 'Bicycle', status: 'Available', pricePerHour: 2000 },
      { code: 'B2', vehicleType: 'Bicycle', status: 'Available', pricePerHour: 2000 },
      { code: 'B3', vehicleType: 'Bicycle', status: 'Available', pricePerHour: 2000 },
      { code: 'B4', vehicleType: 'Bicycle', status: 'Available', pricePerHour: 2000 },
    ];

    const spacesRef = collection(this.firestore, 'spaces');

    for (const space of spaces) {
      await addDoc(spacesRef, space);
      console.log(`✅ Added space: ${space.code}`);
    }

    console.log('🎉 All spaces added successfully!');
  }
}
