// Archivo: middleware.ts (Prueba Definitiva)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  console.log('--- ¡¡¡PRUEBA DEFINITIVA DE MIDDLEWARE!!! --- RUTA:', req.nextUrl.pathname);
  return NextResponse.next();
}