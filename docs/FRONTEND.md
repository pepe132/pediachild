# Plan del frontend — PediaChild

## 1. Responsabilidad

El frontend será una aplicación web responsive, minimalista y con estructura visual tipo SaaS. Estará optimizada inicialmente para computadora de escritorio, pero permitirá trabajar también desde tabletas y celulares. El pediatra podrá iniciar sesión, administrar pacientes y citas, y capturar o consultar expedientes clínicos.

Se construirá una sola aplicación React para todos los dispositivos. No se necesita una aplicación móvil nativa en el MVP; la adaptación dependerá de la estructura de componentes y del CSS responsive.

## 2. Tecnologías

- **React + TypeScript**: interfaz y tipado.
- **Vite**: entorno de desarrollo y compilación.
- **React Router**: navegación.
- **TanStack Query**: comunicación, caché y sincronización con la API.
- **React Hook Form + Zod**: formularios y validación.
- **Vitest + React Testing Library**: pruebas de componentes y flujos.
- **CSS sencillo o Tailwind CSS**: decisión visual pendiente.

La interfaz validará para ayudar al usuario, pero el backend continuará siendo la autoridad definitiva.

## 3. Rutas iniciales

```text
/login
/patients
/patients/new
/patients/:patientId
/patients/:patientId/edit
/patients/:patientId/consultations/new
/consultations/:consultationId/edit
/appointments
/appointments/new
/appointments/:appointmentId/edit
```

Las rutas distintas de `/login` serán privadas. Si no existe una sesión válida, la aplicación enviará al usuario al inicio de sesión.

## 4. Pantallas

### Inicio de sesión

- Campo de correo o usuario.
- Contraseña.
- Botón para iniciar sesión.
- Mensaje claro ante credenciales inválidas o problemas de conexión.
- Indicador de envío para evitar intentos duplicados.

### Todos los pacientes

Será la pantalla principal después de iniciar sesión.

La primera propuesta es una tabla de escritorio con las columnas:

- nombre completo;
- última edad registrada, incluyendo unidad;
- fecha de última consulta;
- fecha de registro;
- estado, si se decide mostrar pacientes inactivos;
- acción para abrir el expediente.

La tabla incluirá:

- búsqueda por nombre;
- filtros separados por fecha de registro y fecha de consulta;
- ordenamiento por columnas acordadas;
- paginación;
- cantidad de resultados;
- botón “Nuevo paciente”;
- fila seleccionable para abrir el detalle.

Los filtros se reflejarán preferentemente en la URL para poder regresar al listado sin perderlos. La búsqueda puede esperar unos milisegundos antes de consultar la API para evitar una petición por cada tecla.

Estados que deben diseñarse:

- cargando;
- sin pacientes registrados;
- sin resultados para los filtros;
- error de conexión;
- sesión vencida.

En pantallas estrechas la tabla podrá desplazarse horizontalmente o transformarse en tarjetas, sin modificar el flujo principal.

### Nuevo paciente y expediente

- Datos generales.
- Nombre del paciente.
- Edad capturada manualmente.
- Selector de unidad: días, meses o años.
- Fecha de nacimiento opcional.
- Datos del tutor, cuando se confirmen.
- Historia clínica dividida por secciones.
- Primera consulta, si el flujo definitivo indica que se captura al mismo tiempo.
- Mensajes de validación junto a cada campo.
- Confirmación visible al guardar.

Si el formulario de historia clínica es extenso, se dividirá en secciones o pasos y se advertirá al usuario antes de abandonar cambios sin guardar.

Las secciones y preguntas clínicas identificadas en el formato recibido están documentadas en [HISTORIA_CLINICA.md](HISTORIA_CLINICA.md). No se construirá un único formulario continuo con 66 cajas de texto; se utilizarán secciones, selecciones y listas repetibles según el tipo de información.

### Detalle del paciente

La historia clínica ya está disponible desde el expediente en una pantalla responsive independiente. Permite crear y editar informante, desarrollo, antecedentes heredofamiliares, no patológicos, nutricionales, perinatales, vacunación y antecedentes patológicos.

- Encabezado con datos generales y última edad registrada.
- Acciones para editar al paciente y crear una consulta.
- Historia clínica.
- Historial cronológico de consultas.
- Signos vitales de cada consulta.
- Diagnósticos.
- Tratamientos.
- Pediatra responsable y fecha de cada registro.

Cada consulta podrá mostrarse en un bloque expandible para evitar una pantalla excesivamente larga.

### Nueva consulta y edición

- Fecha de consulta.
- Edad actual digitada y unidad.
- Motivo y notas.
- Padecimiento actual y exploración física como texto libre.

### Receta médica imprimible

Cada consulta tendrá una acción para abrir una receta en formato de impresión. La receta tomará del expediente el nombre y edad del paciente, y de la consulta la fecha, medidas, diagnósticos y tratamientos con dosis, vía, frecuencia, duración e indicaciones. Los datos profesionales ya vienen impresos en la papelería de la pediatra, por lo que la aplicación no los repetirá.

Estado: implementada para la hoja preimpresa `RecetasLizPediatriaBosquesMediaCarta.pdf`, de media carta horizontal. Imprime únicamente los datos variables: paciente, edad, fecha, PC, FC, FR, temperatura, peso, talla, IMC, alergias, tratamientos e impresión diagnóstica (`Idx`). Incluye calibración horizontal y vertical persistente por navegador.
- Sección SAMPLE opcional si el especialista confirma su uso cotidiano.
- Signos vitales con unidades visibles.
- Somatometría con peso, longitud o estatura y posición de medición.
- Percentiles identificados claramente como registrados por el pediatra o calculados por el sistema.
- Lista dinámica de diagnósticos.
- Lista dinámica de tratamientos.
- Adjuntos de fotografía o captura para laboratorios e imagenología.
- Posibilidad de agregar o retirar filas antes de guardar.
- Confirmación antes de abandonar cambios.

Las guías de redacción por síntoma podrán ofrecerse después como plantillas opcionales. Nunca se marcarán como hallazgos del paciente hasta que el pediatra las seleccione, edite y guarde.

El especialista confirmó que los valores, diagnósticos y tratamientos podrán modificarse y que no necesita ver quién realizó cada cambio. Los archivos mostrarán progreso, tipo, tamaño y opción de retirar antes de guardar.

### Agenda y citas

Al crear una cita sin paciente preseleccionado, el formulario utiliza un buscador remoto por nombre o apellido en lugar de cargar todos los pacientes en un `<select>`. Muestra resultados paginados y conserva el paciente bloqueado cuando la cita se abre desde su expediente o se está editando.

- Agenda filtrada inicialmente por día y rango de fechas.
- Citas ordenadas por hora.
- Identificación visual de estado: programada, confirmada, atendida, cancelada o inasistencia.
- Creación de cita seleccionando un paciente existente.
- Edición y reprogramación.
- Acciones para cancelar o marcar inasistencia.
- Acción “Iniciar consulta” para una cita programada o confirmada.
- Acceso al paciente y a la consulta vinculada.

La primera versión utilizará una lista o agenda diaria sencilla. Una vista compleja de calendario semanal o mensual podrá añadirse después sin cambiar el modelo de datos.

## 5. Componentes iniciales

- `AppLayout`
- `ProtectedRoute`
- `PageHeader`
- `PatientTable`
- `PatientFilters`
- `Pagination`
- `PatientForm`
- `ClinicalHistoryForm`
- `ConsultationForm`
- `VitalSignsFields`
- `DiagnosisListFields`
- `TreatmentListFields`
- `ConsultationTimeline`
- `AppointmentList`
- `AppointmentForm`
- `AppointmentStatusBadge`
- `FormField`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `ConfirmDialog`

Los componentes se crearán cuando sean necesarios; esta lista define responsabilidades y no obliga a construir abstracciones anticipadamente.

## 6. Estructura propuesta

```text
frontend/
├── public/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── patients/
│   │   ├── appointments/
│   │   └── consultations/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── styles/
│   ├── types/
│   └── main.tsx
├── .env.example
├── package.json
└── vite.config.ts
```

Cada funcionalidad podrá agrupar sus componentes, hooks, tipos, consultas y validaciones específicas.

## 7. Manejo de formularios

- React Hook Form controlará el estado de los formularios.
- Zod proporcionará validaciones inmediatas.
- Los errores devueltos por la API se asociarán con su campo cuando sea posible.
- El botón de guardar se deshabilitará mientras la solicitud esté en curso.
- No se borrará el formulario si ocurre un error de red.
- Se advertirá al usuario cuando intente salir con cambios pendientes.
- Los diagnósticos y tratamientos se manejarán como listas dinámicas.
- Todos los valores clínicos mostrarán claramente su unidad.

## 8. Comunicación con la API

- TanStack Query administrará consultas y mutaciones.
- La sesión se enviará mediante cookie segura.
- La aplicación no almacenará tokens de autenticación en `localStorage`.
- Al guardar se invalidarán solamente las consultas afectadas.
- Los filtros y la paginación se enviarán al backend; no se cargarán todos los pacientes para filtrarlos en el navegador.
- Una respuesta de sesión vencida llevará al usuario al login sin mostrar detalles internos.

## 9. Diseño visual

### Estructura tipo SaaS

En escritorio se utilizará una estructura general como la siguiente:

```text
┌──────────────┬────────────────────────────────────┐
│ PediaChild   │ Encabezado / usuario               │
├──────────────┼────────────────────────────────────┤
│ Inicio       │                                    │
│ Pacientes    │ Contenido de la pantalla           │
│ Agenda       │                                    │
│ Consultas    │                                    │
│ Configuración│                                    │
└──────────────┴────────────────────────────────────┘
```

La navegación principal incluirá:

- inicio o dashboard;
- pacientes;
- agenda;
- consultas, si se necesita una vista global;
- configuración de la cuenta;
- cierre de sesión.

En celular, la barra lateral se sustituirá por un menú compacto, un panel desplegable o navegación inferior. La elección definitiva se tomará al crear los primeros bocetos.

### Pantalla de inicio

El dashboard podrá mostrar:

- citas del día;
- pacientes registrados recientemente;
- consultas en progreso;
- accesos rápidos para crear paciente o cita.

Las métricas comerciales y administrativas no forman parte del MVP.

### Estilo clínico

El estilo será sobrio, clínico y minimalista:

- navegación sencilla;
- buen contraste y texto legible;
- espacio suficiente entre controles;
- formularios agrupados por tema;
- fondo gris o azul muy claro con superficies blancas;
- azul o turquesa como color principal y una paleta reducida;
- bordes suaves y sombras discretas;
- mensajes claros, evitando códigos técnicos;
- acciones destructivas o delicadas claramente diferenciadas;
- uso limitado de animaciones.

Primero se realizarán bocetos de las cinco pantallas principales antes de elegir detalles visuales definitivos.

### Comportamiento responsive

#### Computadora

- Barra lateral persistente.
- Tablas completas.
- Formularios clínicos con una o dos columnas según la sección.
- Captura completa de historia clínica y consultas.

#### Tableta

- Barra lateral colapsable.
- Tablas simplificadas o con desplazamiento controlado.
- Formularios de una o dos columnas según el espacio disponible.
- Controles con tamaño adecuado para uso táctil.

#### Celular

- Navegación compacta.
- Tabla de pacientes transformada en tarjetas o lista.
- Formularios de una sola columna.
- Diálogos importantes mostrados como paneles o pantallas completas.
- Botones y campos con áreas táctiles suficientes.
- Secciones clínicas plegables para evitar páginas difíciles de recorrer.

En celular se priorizarán agenda, consulta rápida y revisión del expediente. Los formularios clínicos extensos seguirán disponibles, aunque su uso será más cómodo en computadora o tableta.

### Evolución a PWA

Después del MVP se podrá convertir el frontend en una Progressive Web App para que el pediatra pueda instalar un acceso directo en computadora o celular. La primera versión no ofrecerá funcionamiento clínico sin conexión, porque sincronizar expedientes sensibles requiere resolver conflictos, cifrado local y seguridad adicional.

### Alcance SaaS comercial

La apariencia y navegación estarán preparadas para un producto utilizado por distintos pediatras, pero el MVP no incluirá:

- pagos;
- planes o suscripciones;
- facturación;
- autoservicio para registrar cuentas;
- panel comercial del propietario del producto.

Estas funciones podrán incorporarse posteriormente sin alterar el flujo clínico principal.

## 10. Accesibilidad

- Todos los campos tendrán etiqueta visible.
- La aplicación será utilizable con teclado.
- El foco se moverá al primer error relevante al enviar un formulario.
- Los mensajes no dependerán únicamente del color.
- Tablas, botones y diálogos utilizarán elementos semánticos.
- Se mantendrá contraste suficiente en texto y controles.

## 11. Pruebas prioritarias

- Redirección al login sin sesión.
- Inicio de sesión correcto e incorrecto.
- Visualización de la tabla de pacientes.
- Búsqueda, filtros, ordenamiento y paginación.
- Apertura del detalle al seleccionar un paciente.
- Alta y edición de paciente.
- Captura de edad con días, meses o años.
- Creación de una consulta con diagnósticos y tratamientos múltiples.
- Creación, edición, reprogramación y cancelación de citas.
- Inicio de una consulta desde una cita.
- Mensajes de validación.
- Estados de carga, vacío y error.
- Conservación de datos del formulario ante errores de red.

## 12. Criterios visuales de aceptación

- La tabla permite identificar y abrir rápidamente a un paciente.
- El usuario sabe cuándo la aplicación está cargando o guardando.
- Los filtros activos son visibles y fáciles de limpiar.
- Los formularios indican claramente qué campos son obligatorios.
- La unidad de cada signo vital y de la edad siempre es visible.
- El expediente distingue datos generales, historia y consultas.
- El flujo principal puede completarse con teclado.
- La interfaz funciona correctamente en las resoluciones de escritorio acordadas.
- La tabla de pacientes se adapta a tarjetas o lista en celular.
- La navegación continúa siendo utilizable sin barra lateral persistente en pantallas pequeñas.
- Los formularios se muestran en una sola columna cuando el ancho no permite una distribución segura.
