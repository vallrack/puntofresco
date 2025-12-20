// lib/firebase-admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

let adminApp: App | undefined;

// TEMPORAL: Credenciales hardcodeadas para desarrollo
const FIREBASE_CONFIG = {
  projectId: "punto-fresco-f0c35",
  clientEmail: "firebase-adminsdk-fbsvc@punto-fresco-f0c35.iam.gserviceaccount.com",
  privateKey: `-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCTyyfHdROIFHgU\n5RXCi9c9YFoQO2uEV83ZUATXDXUFZfcJ2Ees1azrji9mz2mqQy9+tPQMQ1ZY2lpj\nNVsZjt9/QXJtkCnaie7MgZTg9Z0YiBqIRNpP7hdAXvrKKDTEQH+JgDOBucwB66K5\nl9zXq/1o5hjtXv5C8rWYxtxSrUHD81li06CZEUcYwn9QE88OV4DoVsB22l7TVwnh\nfU3s4xvC1JQ+/syVn392BR0M7i05M7ohF8M09Wd+kexSiclfzxwPLPuItMJas95A\nlEejJgKwiFQqsOALGtF5jLytU3A/SJHRybC7omCYLl6ADMxyIQESO+LV2XimAo2Q\nqfuATJKDAgMBAAECggEACkQz/LKAy1SkrMrnEo8VQhG13+fIxbY1ufFJjMjGBrx5\nBymLfRGQxAIp/8nLrMSjAXm/dDSfRGfSnI6hx+o5U0UwFjVL+v7W5ETiGyhko8Yc\nlbe2tJO08MdIQ4+8bp+OXHZX3ZyS89UzBhJrCF5NqaJGPAL7xZnHjJfPyTx404wy\nbHwAHJ9S3rXeEXwWbu2yuDkk2SGiJ0rbxrBF5ZKjFs6MI+rW3T5KojvjbUFtx0FT\n2UKZ7HZrcJd8EhLfCRXyaRcTpvyV4fGUmaygwLbwZh0SejY3eMZ8FHY7xn8YNuG+\nkjOHfa4nlKuQKS3YjEX/KzRJPARwlaq9bjFV1ssOzQKBgQDMQu9Jwbv6iTD91qHo\n2tLzhiTtYywldUg4ZYjVOa2zYOWDN2t+opu3zgKW8UaVZtu1lpDRq/DLHKufsU2N\nllMJ+LpCNG5M1aI3T+0xNU+oMWNRTVJgYkDrx4wyBHB0K/WDyzDsT5Ws8xzsFSzI\nhLxu9oH8dVHBFhGAk8/u0sl7RQKBgQC5OqKKmLi4GqzRuhqaM59zjIuuOpg/yDmN\nKJ15d8TDps+4PWtkNnxEA4cOPVij5sAZUHEAmh8hUPMcfcFxaFC3IQVH/QRAky97\nLTPe4T6THsNblYyD0j2wyIF4XwEHffjqi8AelGN0TvCBBj761sjks/qnzQy65vGU\nWAvl7RbPJwKBgAk4JDDCC8f9FTb/zwMBjW/saBJG3aE7L+1Lt+dX2R01jGZlw/ZN\nRJYBOGCztynbIKOLjjHIfu/L9XsZt5RiapESpuWCFFBnfBDfDKeh7lx7Di6HPOaY\nyLFbqlo/lQvJSCWQsD6aQPkzZ+TH9+N9Cjw/6BILAYujgVq6UTJIVUu5AoGAXdTN\nKCaLVH/20dtTxI+oE5G75Iu8OntEZDSR6Ul5vJ8RFMTQVRigxJeA3/7Fm2m2IFy2\nkdaBNJBcRy+RQdDVKp+onDoY4FlvMRfJ8frqhv6LeiZ84v4q0BYSOBbwX4o6AR7A\nOP10kCO5A7NVTh5l8C0YKc7exwNcl4gups/+wPsCgYAQjyPp4H5mv7uWpxaC93CM\nY8vkS8jrQaRMxEp00/UzQ2NapR8y8zowHK/1QFMDFaj7E41c6YmUS8fKMkFrpbTy\nXRaPhRNa8l4+oQpW7IWU9USd+rk7m9jK6OYSPrjrOLfVKWAFrYCRGCAvjIByR6Lv\nWjHQHc23ba6CUA1XxY0dUA==\n-----END PRIVATE KEY-----`,
  storageBucket: "punto-fresco-f0c35.appspot.com",
};

export function getAdminApp() {
  if (getApps().length === 0) {
    console.log('🔧 Inicializando Firebase Admin...');
    initializeApp({
      credential: cert(FIREBASE_CONFIG),
      storageBucket: FIREBASE_CONFIG.storageBucket,
    });
    console.log('✅ Firebase Admin inicializado correctamente');
  }
  return getApps()[0];
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}