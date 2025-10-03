# 🔐 Credenciales de Usuarios - Rent360

## Información General

- **Contraseña común para todos los usuarios**: `12345678`
- **Todos los usuarios están creados automáticamente** al ejecutar `npm run db:seed`
- **Los usuarios tienen diferentes roles** con permisos específicos

## 👥 Lista de Usuarios Disponibles

| Rol                | Email                      | Nombre                 | Dashboard             |
| ------------------ | -------------------------- | ---------------------- | --------------------- |
| 👑 **ADMIN**       | `admin@rent360.cl`         | `Carlos Rodríguez`     | `/admin/dashboard`    |
| 🏠 **OWNER**       | `propietario@rent360.cl`   | `María González`       | `/owner/dashboard`    |
| 🏢 **TENANT**      | `inquilino@rent360.cl`     | `Pedro Sánchez`        | `/tenant/dashboard`   |
| 💼 **BROKER**      | `corredor@rent360.cl`      | `Ana Martínez`         | `/broker/dashboard`   |
| 🏃 **RUNNER**      | `runner@rent360.cl`        | `Diego López`          | `/runner/dashboard`   |
| 🎧 **SUPPORT**     | `soporte@rent360.cl`       | `Soporte Rent360`      | `/support/dashboard`  |
| 🔧 **PROVIDER**    | `proveedor@rent360.cl`     | `ServicioExpress Ltda` | `/provider/dashboard` |
| 🛠️ **MAINTENANCE** | `mantenimiento@rent360.cl` | `Mantención Total SpA` | `/maintenance`        |

## 🚀 Inicio de Sesión Rápido

Para probar diferentes roles, puedes usar estas credenciales en la página de login: `http://localhost:3000/auth/login` o en producción.

### Ejemplos de Uso:

1. **Acceder como Administrador:**
   - Email: `admin@rent360.cl`
   - Password: `12345678`
   - Nombre: Carlos Rodríguez
   - Redirige a: `/admin/dashboard`

2. **Acceder como Propietario:**
   - Email: `propietario@rent360.cl`
   - Password: `12345678`
   - Nombre: María González
   - Redirige a: `/owner/dashboard`

3. **Acceder como Proveedor:**
   - Email: `proveedor@rent360.cl`
   - Password: `12345678`
   - Nombre: ServicioExpress Ltda
   - Redirige a: `/provider/dashboard`

## 📝 Notas Importantes

- **Los usuarios se crean automáticamente** cuando ejecutas el comando de seed
- **Las contraseñas están hasheadas** con bcrypt en la base de datos
- **Todos los usuarios tienen RUT chilenos válidos** para testing
- **Los proveedores y servicios de mantenimiento** tienen perfiles completos creados automáticamente

## 🔧 Comandos para Crear Usuarios

```bash
# Ejecutar seed para crear todos los usuarios
npm run db:seed

# O ejecutar solo seed de usuarios
npm run db:seed:users
```

## 📍 Ubicación del Código

Las credenciales están definidas en el archivo:

- **Archivo**: `scripts/seed-users.ts`
- **Línea**: ~13-61 (definición de usuarios)
- **Contraseña**: Línea 10 (`const hashedPassword = await bcrypt.hash('123456', 12);`)

---

**¡Listo para testing!** 🎯</contents>
</xai:function_call">CREDENCIALES_USUARIOS.md
