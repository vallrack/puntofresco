# **App Name**: Punto Fresco

## Core Features:

- Multi-user Login: Secure access with email/password, managed by Firebase Auth.
- Role-Based Permissions: Differentiated access levels for Super Admin, Admin, and Vendor.
- Visual Product Catalog: Master product registry with name, SKU/barcode, image (Firebase Storage), category, purchase price, selling price, current stock, and minimum stock.
- Real-Time Stock Updates: Automatic stock adjustments upon sales and purchase registration.
- Low Stock Alerts: Visual notifications for items below minimum stock levels.
- Fast Sales Terminal (POS): Quick search by name or barcode scan; automatic calculation of subtotals, taxes, and totals.
- Sales Data Backup: Offline Persistence in Firestore will ensure that sales can be made even without a network connection.

## Style Guidelines:

- Primary color: Green (#27AE60) for positive actions (e.g., sell, save).
- Background color: Matte black (#121212) for a modern dark theme.
- Accent color: Yellow (#F1C40F) for alerts and editable fields.
- Body and headline font: 'Inter' for a clean, contemporary look. Note: currently only Google Fonts are supported.
- Simple, minimalist icons for product categories and actions.
- Dark mode base with Oxford Gray.
- Subtle transitions and feedback animations for interactions.