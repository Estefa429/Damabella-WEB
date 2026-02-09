# 🔧 GUÍA RÁPIDA - NORMALIZACIÓN DE DATOS

## ¿Qué es normalización?

Funciones PURAS que validan y transforman datos sin modificar localStorage:
- ✅ Lee datos crudos
- ✅ Valida integridad
- ✅ Retorna datos limpios
- ❌ NUNCA modifica origen

## 📦 Usando Normalizers

### En dashboardHelpers:

```typescript
// Importar
import {
  normalizarVentas,
  ventasContables,
  ventasDelMesActual,
} from './normalizers';

// Usar
export function getVentasDelMes(): number {
  const ventasRaw = getVentas();
  const clientesRaw = getClientes();

  const ventasNorm = normalizarVentas(ventasRaw);
  const clientesNorm = normalizarClientes(clientesRaw);

  // Filtrar: solo ventas completadas donde cliente existe
  const ventasDelMes = ventasDelMesActual(
    ventasContables(ventasNorm, clientesNorm)
  );

  return ventasDelMes.reduce((sum, v) => sum + v.total, 0);
}
```

## 📊 Tipos Principales

### VentaNormalizada
```typescript
{
  id: string | number;
  clienteId: string | number;
  clienteNombre: string;
  estado: 'COMPLETADA' | 'ANULADA' | 'DEVUELTA';
  total: number;
  fechaISO: string;
  esContable: boolean; // estado === 'COMPLETADA'
}
```

### PedidoNormalizado
```typescript
{
  id: string | number;
  clienteId: string | number;
  estado: 'PENDIENTE' | 'ANULADO' | 'CONVERTIDO_A_VENTA';
  total: number;
  fechaCreacion: string;
  convertidoAVenta: boolean;
}
```

### ClienteNormalizado
```typescript
{
  id: string | number;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
  fechaCreacion: string;
}
```

## 🎯 Funciones Comunes

### Normalizar Datos
```typescript
// Un elemento
const clienteNorm = normalizarCliente(clienteRaw);

// Lista
const clientesNorm = normalizarClientes(clientesRaw);
```

### Filtrar por Contabilidad
```typescript
// Solo ventas que impactan contabilidad (COMPLETADA + cliente existe)
const ventasContables = ventasContables(ventasNorm, clientesNorm);

// Devoluciones del mes actual
const devoluciones = devolucionesDelMesActual(ventasNorm);

// Pedidos que todavía no se han convertido
const pendientes = pedidosPendientes(pedidosNorm);

// Clientes activos
const activos = clientesActivos(clientesNorm);
```

### Validar Referencias
```typescript
// ¿Esta venta tiene un cliente válido?
if (ventaTieneClienteValido(venta, clientesNorm)) {
  console.log('Venta válida');
}

// ¿Este pedido tiene cliente?
if (pedidoTieneClienteValido(pedido, clientesNorm)) {
  console.log('Pedido válido');
}
```

### Auditaría
```typescript
// Ver qué datos están corruptos
const reporte = auditarIntegridad(
  normalizarClientes(clientesRaw),
  normalizarPedidos(pedidosRaw),
  normalizarVentas(ventasRaw)
);

console.log(reporte);
// Output:
// {
//   clientesHuerfanos: [],
//   pedidosSinCliente: ['ID 5'],
//   ventasSinCliente: [],
// }
```

## ⚠️ Reglas de Oro

1. **SIEMPRE validar cliente:**
   ```typescript
   ❌ // MAL - No verifica si cliente existe
   const venta = ventasRaw.find(v => v.total > 1000);
   
   ✅ // BIEN - Valida que cliente exista
   const venta = ventasContables(ventasNorm, clientesNorm)
     .find(v => v.total > 1000);
   ```

2. **NUNCA modificar datos crudos:**
   ```typescript
   ❌ // MAL
   ventasRaw[0].estado = 'COMPLETADA'; // Modifica localStorage!
   
   ✅ // BIEN
   const ventaNorm = normalizarVenta(ventasRaw[0]);
   // ventaNorm.estado ya está normalizado
   ```

3. **Normalizar ANTES de usar:**
   ```typescript
   ❌ // MAL
   if (venta.estado === 'completada') { ... }
   
   ✅ // BIEN
   const ventaNorm = normalizarVenta(venta);
   if (ventaNorm.estado === 'COMPLETADA') { ... }
   ```

## 🔄 Flujo Típico

```
1. getVentas() → raw data de localStorage
2. normalizarVentas() → VentaNormalizada[]
3. ventasContables() → filtra válidas
4. ventasDelMesActual() → filtra mes actual
5. reduce() → suma totales
6. retorna número limpio
```

## 📍 Dónde Usar

- ✅ **dashboardHelpers** - Cálculos para Dashboard
- ✅ **Dashboard** - Mostrar datos normalizados
- ✅ **Reportes** - Siempre normalizar antes
- ✅ **Validaciones** - Usar validadores
- ❌ **Managers** - NO usar aquí (managers manejan datos brutos)
- ❌ **localStorage** - NO modificar directamente

## 🐛 Debugging

```typescript
// Ver qué se está procesando
const ventasNorm = normalizarVentas(ventasRaw);
console.log('Ventas normalizadas:', ventasNorm);

// Ver qué se filtra
const ventasContables = ventasContables(ventasNorm, clientesNorm);
console.log('Ventas contables:', ventasContables);

// Ver problemas de integridad
const reporte = auditarIntegridad(clientesNorm, pedidosNorm, ventasNorm);
if (reporte.pedidosSinCliente.length > 0) {
  console.warn('⚠️ Hay pedidos sin cliente válido:', reporte.pedidosSinCliente);
}
```

## 📚 Archivos Clave

```
src/features/dashboard/utils/
├── normalizers.ts          ← Funciones de normalización
├── dashboardHelpers.ts     ← Usa normalizers para cálculos
└── pages/Dashboard.tsx     ← UI que usa helpers
```

## ✅ Checklist para Nueva Feature

Si agregás una nueva función en dashboardHelpers:

- [ ] Importar normalizers necesarios
- [ ] Normalizar datos ANTES de procesarlos
- [ ] Validar referencias de cliente
- [ ] Filtrar datos inválidos
- [ ] Agregar console.log con [DASHBOARD] prefix
- [ ] Compilar: `npm run build` (0 errores)
- [ ] Testear en navegador

## 🚀 Performance Tips

```typescript
// ❌ Lento - normaliza en cada render
const ventasNorm = normalizarVentas(getVentas());

// ✅ Rápido - normaliza una sola vez con useMemo
const ventasNorm = useMemo(
  () => normalizarVentas(getVentas()),
  [refreshTrigger] // Solo recalcula si refreshTrigger cambia
);
```

---

**¿Dudas?** Ver `NORMALIZACION_COMPLETADA_FASE3.md` para documentación completa.
