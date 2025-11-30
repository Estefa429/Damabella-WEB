"use client";

import { Toaster as SonnerToaster } from "./sonner";

/**
 * Toaster global para el proyecto usando Sonner.
 * Este archivo reemplaza completamente la versión rota que intentaba usar
 * '@components/ui/toast' y '@components/ui/use-toast', que NO existen.
 *
 * Ahora funciona y coincide con tu estructura:
 * src/components/ui/sonner.tsx
 */

export function Toaster() {
  return <SonnerToaster />;
}
