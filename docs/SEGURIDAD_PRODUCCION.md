# Seguridad para producción

Estado técnico al 10 de septiembre de 2026.

## Implementado

- Contraseñas con `scrypt`, salt aleatorio y longitud mínima de 12 caracteres para cuentas nuevas.
- Sesiones opacas de 256 bits; en base de datos sólo se conserva SHA-256 del token.
- Cookies `HttpOnly`, `Secure` y `SameSite=None` en producción.
- Protección de operaciones de escritura comprobando el `Origin` del frontend.
- CORS limitado a `FRONTEND_URL`, Helmet y límite JSON de 1 MB.
- Límites globales y específicos para autenticación.
- Máximo de cinco sesiones simultáneas y revocación total al cambiar contraseña.
- Consultas SQL parametrizadas. Ordenamientos y filtros se eligen mediante enums validados.
- Bitácora inmutable de operaciones autenticadas de escritura.
- Versiones inmutables previas a cada modificación de consulta e historia clínica.
- Nuevas cuentas bloqueadas hasta aprobación manual de la cédula profesional.
- Dependencias de producción auditadas sin vulnerabilidades conocidas al momento de esta revisión.

## Operación obligatoria antes de pacientes reales

- Configurar un `SESSION_SECRET` aleatorio y distinto por ambiente.
- Configurar `FRONTEND_URL` con el origen exacto, sin diagonal final.
- Verificar la cédula en el Registro Nacional de Profesionistas antes de ejecutar `SPECIALIST_EMAIL=correo npm run approve:specialist`.
- Contratar respaldos automáticos, cifrados y con restauraciones de prueba.
- Definir retención y eliminación conforme al expediente clínico y obligaciones legales.
- Publicar aviso de privacidad y recabar el consentimiento aplicable para datos sensibles.
- Definir responsables, inventario de datos, análisis de riesgo y procedimiento de respuesta a vulneraciones.

## Integraciones aún bloqueantes

- Proveedor de correo transaccional y dominio remitente para verificación y recuperación de contraseña.
- Decisión de segundo factor: aplicación TOTP recomendada; SMS sólo como alternativa.
- Revisión jurídica y, cuando corresponda, evaluación/certificación del sistema conforme a NOM-004 y NOM-024. El software no debe anunciarse como “certificado” sin el proceso formal.

Referencias: [LFPDPPP](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf), [NOM-004-SSA3-2012](https://www.dof.gob.mx/nota_detalle.php?codigo=5272787&fecha=15/10/2012) y [NOM-024](https://dof.gob.mx/normasOficiales/4956/SALUD1/SALUD1.html).
