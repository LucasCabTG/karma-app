// Archivo: src/app/admin/layout.tsx
import { AdminNavbar } from '@/components/layout/AdminNavbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavbar />
      <main className="w-full">
        {children} {/* Aquí es donde Next.js va a meter el formulario de Cortesías o el Escáner según la URL */}
      </main>
    </div>
  );
}