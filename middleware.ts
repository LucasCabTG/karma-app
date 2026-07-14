// Archivo: middleware.ts (Prueba Definitiva)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  console.log('--- ¡¡¡PRUEBA DEFINITIVA DE MIDDLEWARE!!! --- RUTA:', req.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};