// Script para limpiar datos ficticios de localStorage
// Ejecutar en la consola del navegador cuando la app esté cargada

console.log('🧹 Iniciando limpieza de datos ficticios...');

// Limpiar compras ficticias
const comprasKey = 'damabella_compras';
const stored = localStorage.getItem(comprasKey);

if (stored) {
  try {
    const comprasData = JSON.parse(stored);
    console.log(`📊 Compras encontradas: ${comprasData.length}`);
    
    // Filtrar solo compras con proveedorNombre válido
    const comprasReales = comprasData.filter(c => {
      const nombre = String(c.proveedorNombre || '').toLowerCase().trim();
      // Excluir patrones como "proveedor a", "proveedor c", etc
      const esFicticio = /^proveedor\s+[a-z]$/i.test(nombre);
      return !esFicticio && nombre !== '' && c.numeroCompra && c.items;
    });
    
    console.log(`✅ Compras reales: ${comprasReales.length}`);
    console.log(`❌ Compras ficticias eliminadas: ${comprasData.length - comprasReales.length}`);
    
    // Guardar compras reales
    localStorage.setItem(comprasKey, JSON.stringify(comprasReales));
    console.log('✅ Datos guardados correctamente');
    
    // Mostrar compras reales
    if (comprasReales.length > 0) {
      console.log('📋 Compras reales guardadas:');
      comprasReales.forEach(c => {
        console.log(`  - ${c.numeroCompra}: ${c.proveedorNombre}`);
      });
    } else {
      console.log('ℹ️ No hay compras reales, tabla vacía');
    }
  } catch (e) {
    console.error('❌ Error al procesar:', e);
  }
} else {
  console.log('ℹ️ No hay compras guardadas');
}

console.log('✅ Limpieza completada. Recarga la página para ver los cambios.');
