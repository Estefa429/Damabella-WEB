/**
 * Inicializa el almacenamiento de datos administrativos
 * Crea una cuenta de administrador por defecto si no existe
 */

export function initializeAdminStorage() {
  console.log('🔧 [initializeStorage] Iniciando inicialización del storage...');
  
  // PASO 1: Limpiar datos de usuarios corruptos o mal formados
  console.log('\n📋 [initializeStorage] PASO 1: Verificando integridad de datos...');
  const existingUsers = localStorage.getItem('damabella_users');
  
  let usersToKeep: any[] = [];
  
  if (existingUsers) {
    try {
      const parsed = JSON.parse(existingUsers);
      // Validar que los usuarios tengan email y role (password puede estar en diferentes formatos)
      usersToKeep = parsed.filter((u: any) => u.email && u.role && (u.nombre || u.name));
      
      if (parsed.length !== usersToKeep.length) {
        console.log(`⚠️  [initializeStorage] Se filtraron ${parsed.length - usersToKeep.length} usuarios corruptos`);
      }
    } catch (e) {
      console.log('❌ [initializeStorage] Error parseando usuarios existentes, comenzando desde cero');
    }
  }
  
  // PASO 2: Asegurar que existe el admin
  console.log('\n✨ [initializeStorage] PASO 2: Verificando cuenta de administrador...');
  
  const adminExists = usersToKeep.some(u => u.email === 'admin@damabella.com');
  
  if (!adminExists) {
    console.log('   ⚠️  Admin no existe, creando...');
    usersToKeep.push({
      id: '1',
      nombre: 'Administrador',
      email: 'admin@damabella.com',
      password: 'Admin123#',
      rol: 'Administrador',
      status: 'Activo',
      createdAt: new Date().toISOString(),
    });
    console.log('✅ [initializeStorage] Cuenta de administrador creada');
    console.log('📝 [initializeStorage] - Email: admin@damabella.com');
    console.log('📝 [initializeStorage] - Password: Admin123#');
    console.log('📝 [initializeStorage] - Rol: Administrador');
  } else {
    console.log(`✅ [initializeStorage] Admin ya existe en el sistema`);
  }
  
  console.log(`\n✅ [initializeStorage] Total de usuarios a guardar: ${usersToKeep.length}`);
  
  // PASO 3: Guardar usuarios validados
  console.log('\n💾 [initializeStorage] PASO 3: Guardando usuarios...');
  localStorage.setItem('damabella_users', JSON.stringify(usersToKeep));
  console.log('✅ [initializeStorage] Usuarios guardados en localStorage');
  
  // PASO 4: Mostrar usuarios guardados
  console.log('\n👥 [initializeStorage] PASO 4: Listando usuarios almacenados:');
  usersToKeep.forEach((u: any, idx: number) => {
    console.log(`  [${idx}] ${u.email}`);
    console.log(`       ├─ Nombre: ${u.nombre}`);
    console.log(`       ├─ Rol: ${u.role}`);
    console.log(`       └─ Status: ${u.status}`);
  });
  
  // PASO 5: Crear claves administrativas
  console.log('\n🔑 [initializeStorage] PASO 5: Inicializando claves administrativas...');
  const adminKeys = [
    'damabella_productos',
    'damabella_categorias',
    'damabella_tallas',
    'damabella_colores',
    'damabella_ventas',
    'damabella_pedidos',
    'damabella_proveedores',
    'damabella_clientes',
  ];
  
  adminKeys.forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify([]));
      console.log(`  ✅ ${key}`);
    }
  });
  
  // PASO 6: Mostrar TODO el localStorage
  console.log('\n💾 [initializeStorage] PASO 6: CONTENIDO COMPLETO DE LOCALSTORAGE:');
  console.log('═'.repeat(60));
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      console.log(`\n🔑 ${key}:`);
      try {
        const parsed = JSON.parse(value || '');
        if (Array.isArray(parsed) && parsed.length === 0) {
          console.log('   [] (vacío)');
        } else {
          console.log(parsed);
        }
      } catch (e) {
        console.log(`   ${value}`);
      }
    }
  }
  console.log('\n' + '═'.repeat(60));
  console.log('✅ [initializeStorage] INICIALIZACIÓN COMPLETADA\n');
}

/**
 * Obtiene todos los usuarios del localStorage
 */
export function getAllUsers(): any[] {
  const users = localStorage.getItem('damabella_users');
  const result = users ? JSON.parse(users) : [];
  console.log('📋 [getAllUsers] Total de usuarios:', result.length);
  result.forEach((u: any, idx: number) => {
    const rolField = u.role || u.rol;
    console.log(`  [${idx}] ${u.email}`);
    console.log(`       ├─ Nombre: ${u.nombre || u.name}`);
    console.log(`       ├─ Rol: "${rolField || 'SIN ROLE'}"`);
    console.log(`       ├─ Password: ${u.password ? '(guardada)' : 'undefined'}`);
    console.log(`       ├─ Documento: ${u.documento || 'N/A'}`);
    console.log(`       └─ Status: ${u.status || u.estado || 'undefined'}`);
  });
  return result;
}

/**
 * Encuentra un usuario por email
 */
export function findUserByEmail(email: string): any {
  console.log(`\n🔍 [findUserByEmail] Buscando usuario: ${email}`);
  const users = getAllUsers();
  const user = users.find(u => u.email === email);
  
  if (user) {
    const rolField = user.role || user.rol;
    console.log(`✅ [findUserByEmail] Usuario encontrado:`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Nombre: ${user.nombre || user.name}`);
    console.log(`   - Rol: "${rolField || 'SIN ROLE'}"`);
    console.log(`   - Password: ${user.password ? '(guardada)' : 'undefined'}`);
    console.log(`   - Documento: ${user.documento || 'N/A'}`);
    console.log(`   - Status: ${user.status || user.estado || 'undefined'}`);
    console.log(`   - Objeto COMPLETO:`, JSON.stringify(user, null, 2));
  } else {
    console.log(`❌ [findUserByEmail] Usuario NO encontrado: ${email}`);
  }
  
  return user;
}

/**
 * Valida las credenciales de un usuario
 */
export function validateCredentials(email: string, password: string): any | null {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔐 [validateCredentials] VALIDANDO CREDENCIALES`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔒 Password: ${password ? '(ingresada)' : 'VACÍA'}`);
  
  const user = findUserByEmail(email);
  
  if (!user) {
    console.log('❌ [validateCredentials] Usuario no existe\n');
    return null;
  }
  
  // Si el usuario es admin y tiene password undefined, establecerla
  if (user.email === 'admin@damabella.com' && !user.password) {
    console.log('⚠️  [validateCredentials] Admin sin contraseña, asignando...');
    user.password = 'Admin123#';
    // Guardar el cambio en localStorage
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex !== -1) {
      users[userIndex].password = 'Admin123#';
      localStorage.setItem('damabella_users', JSON.stringify(users));
    }
  }
  
  console.log(`\n🔑 [validateCredentials] COMPARANDO CONTRASEÑAS:`);
  console.log(`   - Almacenada: "${user.password}"`);
  console.log(`   - Ingresada:  "${password}"`);
  console.log(`   - ¿Coinciden? ${user.password === password ? '✅ SÍ' : '❌ NO'}`);
  
  if (user.password === password) {
    // Retornar sin incluir la contraseña - mantener rol correcto (puede ser 'role' o 'rol')
    const rolField = user.role || user.rol;
    const { password, ...userWithoutPassword } = user;
    const result = {
      ...userWithoutPassword,
      // Normalizar el rol a 'role'
      role: rolField,
      isAuthenticated: true,
    };
    console.log(`\n✅ [validateCredentials] LOGIN EXITOSO`);
    console.log(`   - Nombre: ${result.nombre || result.name}`);
    console.log(`   - Rol: "${result.role || 'SIN ROLE'}"`);
    console.log(`   - Email: ${result.email}`);
    console.log(`\n📊 [validateCredentials] OBJETO COMPLETO DEL USUARIO:`, JSON.stringify(result, null, 2));
    console.log(`${'='.repeat(60)}\n`);
    return result;
  }
  
  console.log(`\n❌ [validateCredentials] CONTRASEÑA INCORRECTA`);
  console.log(`${'='.repeat(60)}\n`);
  return null;
}

/**
 * Agrega el nuevo super admin al localStorage SIN borrar nada
 */
export function addSuperAdmin() {
  console.log('\n➕ [addSuperAdmin] Verificando si el super admin ya existe...');
  
  const users = getAllUsers();
  const superAdminExists = users.some(u => u.email === 'superadmin@damabella.com');
  
  if (superAdminExists) {
    console.log('✅ [addSuperAdmin] Super admin ya existe en el sistema');
    return;
  }
  
  console.log('➕ [addSuperAdmin] Agregando nuevo super admin...');
  
  const newSuperAdmin = {
    id: '99',
    nombre: 'Super Administrador',
    email: 'superadmin@damabella.com',
    password: 'AdminMaster#2024',
    rol: 'Administrador',
    estado: 'Activo',
    creadoPor: 'Sistema',
    fechaCreacion: '2024-01-15',
  };
  
  // Agregar sin sobrescribir
  users.push(newSuperAdmin);
  localStorage.setItem('damabella_users', JSON.stringify(users));
  
  console.log('✅ [addSuperAdmin] Super admin agregado exitosamente');
  console.log(`   - Email: ${newSuperAdmin.email}`);
  console.log(`   - Rol: ${newSuperAdmin.rol}`);
  console.log(`   - Password: ${newSuperAdmin.password}`);
  console.log('\n👥 [addSuperAdmin] TODOS LOS USUARIOS DESPUÉS DE AGREGAR:');
  getAllUsers();
}
