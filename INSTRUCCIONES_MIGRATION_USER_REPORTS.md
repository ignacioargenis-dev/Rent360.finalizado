# Instrucciones para Aplicar Migración de UserReport

## ⚠️ IMPORTANTE: Aplicar Migración en Producción

Se ha agregado el modelo `UserReport` al schema de Prisma para soportar el sistema de reportes de usuarios.

### Pasos para aplicar la migración:

1. **Conectarse al servidor de producción (DigitalOcean)**
2. **Ejecutar el comando de migración:**

```bash
npx prisma migrate deploy
```

O si prefieres generar la migración localmente primero:

```bash
# En desarrollo local:
npx prisma migrate dev --name add_user_reports

# Luego en producción:
npx prisma migrate deploy
```

### Modelo Agregado:

```prisma
model UserReport {
  id              String   @id @default(cuid())
  reporterId      String
  reportedUserId  String
  reason          String   // 'spam', 'harassment', 'inappropriate_content', 'scam', 'fake_profile', 'other'
  description     String
  status          String   @default("PENDING") // 'PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'
  adminNotes      String?
  reviewedBy      String?
  reviewedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  reporter        User     @relation("ReportsCreated", fields: [reporterId], references: [id], onDelete: Cascade)
  reportedUser    User     @relation("ReportsReceived", fields: [reportedUserId], references: [id], onDelete: Cascade)
  reviewer        User?    @relation("ReportsReviewed", fields: [reviewedBy], references: [id], onDelete: SetNull)

  @@map("user_reports")
  @@index([reporterId])
  @@index([reportedUserId])
  @@index([status])
  @@index([createdAt])
}
```

### Cambios en el modelo User:

Se agregaron las siguientes relaciones al modelo User:

```prisma
reportsCreated  UserReport[] @relation("ReportsCreated")
reportsReceived UserReport[] @relation("ReportsReceived")
reportsReviewed UserReport[] @relation("ReportsReviewed")
```

### Verificación:

Después de aplicar la migración, verifica que la tabla se haya creado:

```sql
SELECT * FROM user_reports LIMIT 1;
```

### Notas:

- La migración es segura y no afecta datos existentes
- Solo agrega una nueva tabla y relaciones
- Los reportes se almacenan con timestamp y pueden ser revisados por admins y soporte
