# Análisis de la historia clínica pediátrica

## 1. Fuente revisada

Documento analizado: `HC PEDIATRICA.docx`.

También se revisó el ejemplo `Formato de Nota de Ingreso-2.pdf`. Su análisis y los ajustes propuestos para SAMPLE, exploración física, laboratorios y plantillas de síntomas se encuentran en [NOTA_INGRESO.md](NOTA_INGRESO.md).

El archivo es una plantilla narrativa de Word con 66 controles rellenables. Los controles no tienen alias ni etiquetas técnicas y prácticamente todos son texto libre. Por lo tanto, el documento sirve como referencia clínica y visual, pero no puede transformarse automáticamente en un esquema de base de datos sin normalizar sus conceptos.

No se encontraron tablas estructuradas en el contenido principal. La información se presenta mediante párrafos con campos incrustados.

## 2. Conclusión principal

El documento no representa todo el expediente propuesto. Contiene principalmente:

- antecedentes heredofamiliares;
- antecedentes personales no patológicos;
- alimentación e higiene;
- micciones y evacuaciones;
- neurodesarrollo;
- vacunación;
- antecedentes perinatales;
- antecedentes personales patológicos;
- signos vitales;
- somatometría;
- laboratorios;
- estudios de imagenología.

No incluye explícitamente:

- motivo de consulta;
- padecimiento actual;
- exploración física completa;
- diagnósticos;
- tratamientos o indicaciones;
- evolución y pronóstico;
- fecha y responsable de la consulta.

Estos elementos deben mantenerse en el módulo de consultas aunque no aparezcan en esta plantilla, porque forman parte de los requerimientos originales.

## 3. Separación recomendada de información

### Datos generales del paciente

Se capturan al crear el expediente y no deben duplicarse dentro de la historia:

- nombre y apellidos;
- edad digitada y unidad;
- fecha de nacimiento opcional;
- sexo, pendiente de confirmar;
- datos de contacto y tutor, pendientes de confirmar;
- pediatra propietario;
- fecha de registro y estado.

### Historia clínica principal

Existirá una historia clínica actual por paciente, editable y con auditoría. Contendrá los antecedentes familiares, no patológicos, nutricionales, perinatales y patológicos.

### Datos de cada consulta

Los siguientes datos deben registrarse en cada atención y no sobrescribirse globalmente:

- edad del paciente en ese momento;
- signos vitales;
- somatometría;
- laboratorios descritos durante la consulta;
- resultados de imagenología descritos durante la consulta;
- motivo, padecimiento, exploración, diagnósticos y tratamientos;
- fecha y pediatra responsable.

## 4. Mapeo de campos del documento

## 4.1 Antecedentes heredofamiliares

### Informante

- nombre o identificación del informante;
- parentesco con el paciente;
- confiabilidad de la información, si el especialista la requiere.

El documento solamente incluye “Informante”, por lo que el detalle exacto debe confirmarse.

### Madre

- edad;
- lugar de origen;
- lugar de residencia;
- escolaridad;
- lengua;
- ocupación;
- religión;
- toxicomanías;
- detalle de toxicomanías;
- comorbilidades;
- grupo sanguíneo o hemotipo.

### Padre

- edad;
- escolaridad;
- lengua;
- ocupación;
- religión;
- toxicomanías;
- detalle de toxicomanías;
- comorbilidades;
- grupo sanguíneo o hemotipo.

La plantilla parece omitir origen y residencia del padre. Se debe confirmar si fue accidental.

### Otros familiares

- hermanos;
- abuelos.

En el documento son áreas de texto libre. Debe confirmarse si se requiere registrar a cada familiar individualmente o solamente un resumen clínico.

## 4.2 Antecedentes personales no patológicos

### Residencia y vivienda

- lugar de origen;
- lugar de residencia;
- tipo o condición de vivienda;
- servicios disponibles;
- servicios faltantes;
- combustible o medio utilizado para cocinar;
- fuente o condición del agua;
- tipo o disponibilidad de baño;
- personas con quienes cohabita;
- condiciones de habitación o hacinamiento;
- convivencia con animales;
- exposición a biomasa.

Algunos textos de la plantilla son ambiguos —por ejemplo “habita en casa”, “cuenta con” y “no cuentan con”—, por lo que deben convertirse en preguntas explícitas antes de diseñar el formulario.

### Alimentación

- duración de lactancia materna exclusiva;
- inicio de alimentación complementaria;
- incorporación a dieta familiar;
- comidas actuales por día;
- recordatorio de alimentos consumidos en las últimas 24 horas.

Frecuencia semanal, expresada en días de 0 a 7:

- carnes rojas;
- pollo;
- huevo;
- leche;
- pescado;
- cereales;
- tortilla;
- leguminosas;
- verduras;
- frutas;
- refresco;
- pan.

### Higiene

- frecuencia de baño;
- frecuencia de cambio de ropa interior y exterior;
- cepillados dentales al día.

### Eliminación

- micciones;
- evacuaciones al día;
- tipo en escala de Bristol.

El documento menciona Bristol, pero no muestra opciones. El formulario digital debe usar una selección de 1 a 7 si el pediatra confirma que esa es la escala requerida.

### Neurodesarrollo

El documento solamente contiene el encabezado “Neurodesarrollo”. Es necesario definir si se capturará:

- como nota libre;
- por hitos y edad de adquisición;
- mediante una escala pediátrica concreta;
- mediante indicadores normal/anormal y observaciones.

### Vacunación

Actualmente es texto libre. Debe decidirse entre:

- resumen de esquema completo, incompleto o desconocido con observaciones; o
- registro estructurado de cada vacuna, dosis y fecha.

Para el MVP se recomienda un estado general y observaciones, salvo que el especialista solicite cartilla estructurada.

## 4.3 Antecedentes perinatales

El encabezado indica que la información corresponde a la madre.

- número de consultas prenatales;
- ultrasonidos prenatales y hallazgos;
- vacunas maternas;
- enfermedades crónico-degenerativas maternas;
- vía de nacimiento;
- hospital o clínica de nacimiento;
- edad gestacional;
- peso al nacer;
- talla al nacer;
- APGAR;
- tamices;
- hospitalizaciones perinatales.

Los siguientes campos deben normalizarse:

- Capurro expresado en semanas y, opcionalmente, días;
- vía de nacimiento como selección más observaciones;
- APGAR separado por minuto, por ejemplo 1 y 5 minutos;
- peso en gramos o kilogramos, con una sola unidad acordada;
- talla en centímetros;
- tamices como registros repetibles o como resumen.

## 4.4 Antecedentes personales patológicos

- alergias;
- cirugías;
- traumatismos;
- enfermedades exantemáticas;
- hospitalizaciones.

La plantilla inicia alergias, cirugías y traumatismos con “Negadas/Negados”. En la aplicación no deben ser textos prellenados que puedan pasar inadvertidos. Se recomienda para cada rubro:

- estado: `DENIED`, `PRESENT` o `UNKNOWN`;
- descripción obligatoria cuando el estado sea `PRESENT`.

Esto evita interpretar un campo vacío como una negación clínica.

## 4.5 Signos vitales por consulta

Campos presentes:

- frecuencia cardiaca, lpm;
- frecuencia respiratoria, rpm;
- tensión arterial, mmHg;
- saturación de oxígeno, porcentaje;
- pulsos;
- llenado capilar, segundos.

La tensión arterial debe dividirse en sistólica y diastólica para almacenarse y validarse correctamente.

Se agregará temperatura en grados Celsius.

“Pulsos” se capturará como descripción libre.

## 4.6 Somatometría por consulta

- peso en kilogramos;
- talla en centímetros;
- peso para la edad (`P/E`);
- peso para la talla (`P/T`);
- talla para la edad (`T/E`);
- diagnóstico nutricional.

`P/E`, `P/T` y `T/E` se registrarán como percentiles. Los valores de referencia indicados por el especialista son 3, 15, 50, 85 y 97.

El PDF de curvas fue revisado. Confirma curvas separadas por sexo, edad e indicador, pero solo contiene gráficas y no tablas numéricas para calcular resultados con seguridad. Se guardarán las mediciones originales y se distinguirán los percentiles manuales de los calculados. El análisis y modelo propuesto están en [CURVAS_OMS.md](CURVAS_OMS.md).

También debe confirmarse si se agregarán:

- índice de masa corporal;
- perímetro cefálico;
- percentil o puntaje Z correspondiente;
- superficie corporal.

## 4.7 Laboratorios e imagenología

El documento contiene áreas de texto para:

- laboratorios;
- estudios de imagenología.

En el MVP se conservarán notas escritas de laboratorios e imagenología. La carga de fotografías, capturas y radiografías queda pospuesta; cuando se implemente, los archivos serán privados, pertenecerán a una consulta y deberán validar tipo, tamaño y autorización de acceso.

## 5. Modelo de datos recomendado

No se recomienda una sola tabla con más de 60 columnas ni almacenar toda la historia como un JSON opaco. Se propone un modelo híbrido y modular.

### `clinical_histories`

- `id`;
- `patient_id`, único;
- `informant_name`;
- `informant_relationship`;
- `siblings_history`;
- `grandparents_history`;
- `neurodevelopment_notes`;
- `immunization_status`;
- `immunization_notes`;
- `created_at`, `updated_at`;
- usuario responsable de creación y modificación.

### `family_members_history`

Registros repetibles vinculados a `clinical_histories`:

- `relationship` (`MOTHER`, `FATHER` u otro futuro);
- edad y unidad;
- origen y residencia;
- escolaridad;
- lengua;
- ocupación;
- religión;
- toxicomanías y detalle;
- comorbilidades;
- grupo sanguíneo.

Para el MVP pueden existir solamente madre y padre. La estructura repetible evita duplicar columnas con prefijos `mother_*` y `father_*`.

### `non_pathological_histories`

Relación uno a uno con la historia:

- origen y residencia;
- vivienda;
- servicios disponibles y faltantes;
- combustible de cocina;
- agua y baño;
- cohabitantes y habitación;
- animales;
- exposición a biomasa;
- higiene;
- micciones;
- evacuaciones y Bristol.

### `nutrition_histories`

Relación uno a uno con la historia:

- lactancia exclusiva;
- alimentación complementaria;
- incorporación a dieta familiar;
- comidas por día;
- recordatorio de 24 horas.

### `food_frequencies`

Registros repetibles:

- `nutrition_history_id`;
- `food_type`;
- `days_per_week`, de 0 a 7.

### `perinatal_histories`

Relación uno a uno con la historia:

- consultas y ultrasonidos prenatales;
- vacunas maternas;
- enfermedades maternas;
- vía y lugar de nacimiento;
- edad gestacional;
- peso y talla al nacer;
- APGAR;
- tamices;
- hospitalizaciones.

### `pathological_history_items`

Registros por categoría:

- categoría (`ALLERGY`, `SURGERY`, `TRAUMA`, `EXANTHEMATIC_DISEASE`, `HOSPITALIZATION`);
- estado (`DENIED`, `PRESENT`, `UNKNOWN`);
- descripción.

### Tablas de consulta

Se mantienen separadas:

- `consultations`;
- `vital_signs`;
- `anthropometric_measurements`;
- `diagnoses`;
- `treatments`.

Las notas de laboratorios e imagenología pueden comenzar como columnas de `consultations`. Si después se requieren múltiples resultados estructurados o archivos, se crearán módulos separados.

## 6. Reglas importantes

- Cada historia y consulta debe validarse contra el `pediatrician_id` propietario del paciente.
- Una historia clínica principal pertenece a un solo paciente.
- Un paciente puede tener múltiples consultas.
- Los signos vitales y la somatometría pertenecen a una consulta.
- Un valor vacío no equivale a “negado”.
- Las unidades deben almacenarse o quedar inequívocamente definidas por el campo.
- Las entidades clínicas conservarán sus fechas de modificación.
- El especialista no requiere mostrar autor ni versiones anteriores cuando se modifiquen valores, diagnósticos o tratamientos.
- Los catálogos deben usarse para opciones cerradas; las observaciones clínicas permanecerán como texto.

## 7. Respuestas clínicas

### Respuestas confirmadas

1. `P/E`, `P/T` y `T/E` se manejarán como percentiles, usando como referencias 3, 15, 50, 85 y 97.
2. Se agregará temperatura en grados Celsius.
3. Pulsos será una descripción libre.
4. Neurodesarrollo incluirá tanto hitos del desarrollo como resultado de la prueba EDI.
5. Vacunación tendrá estado completo o incompleto; cuando sea incompleto se indicarán las vacunas faltantes.
6. APGAR será un campo libre único donde el pediatra escribirá los valores.
7. Bristol será una selección entera del 1 al 7.
8. Se podrán modificar valores, diagnósticos y tratamientos; no se necesita mostrar quién realizó el cambio.
9. No existe otro formato. Motivo, padecimiento actual, exploración y campos semejantes serán texto libre.
10. Diagnósticos y tratamientos serán texto libre y repetible, sin catálogo obligatorio.
11. Laboratorios e imagenología conservarán notas escritas; las fotografías o capturas quedan para una fase posterior.
12. Los antecedentes familiares abarcarán madre, padre, abuelos y hermanos; hermanos y abuelos se capturarán como texto libre.
13. El lugar de nacimiento del paciente sustituirá los campos ambiguos de origen y residencia.
14. Vivienda, servicios, agua, sanitario, combustible, baño y cambio de ropa serán texto libre.
15. Las frecuencias alimentarias se capturarán de 0 a 7 días por semana.
16. Consultas y ultrasonidos prenatales serán un solo campo de texto libre.
17. La vía de nacimiento tendrá las opciones `VAGINAL` y `ABDOMINAL_CESAREAN`.
18. Capurro se registrará en semanas y días.
19. Los cinco tamices serán metabólico, auditivo, cardiaco, oftalmológico y de cadera, cada uno con resultado en texto libre.
20. La somatometría incluirá peso, talla, IMC y perímetro cefálico.
21. Se calcularán percentiles con referencias oficiales de la OMS.
22. Para pacientes prematuros se calculará edad corregida hasta los dos años.
23. Se mostrarán gráficas históricas de peso y talla.

### Preguntas todavía pendientes

1. Para calcular percentiles OMS, ¿se pueden hacer obligatorios el sexo y la fecha de nacimiento del paciente? Las tablas oficiales se separan por sexo y utilizan la edad exacta, por lo que el cálculo automático no puede realizarse de forma confiable sin ambos datos.

## 8. Orden de implementación actualizado

### Estado actual del backend

La historia clínica ya incorpora una historia única por paciente, lugar de nacimiento, hitos y EDI separados, antecedentes familiares, no patológicos, nutricionales, perinatales y patológicos. También incluye vía vaginal o abdominal, Capurro en semanas y días, cinco tamices, vacunación, APGAR, Bristol y frecuencia alimentaria. La consulta conserva peso, talla y perímetro cefálico, y el backend calcula el IMC.

1. Hacer obligatorios sexo y fecha de nacimiento, si lo autoriza la pediatra, e integrar las tablas numéricas oficiales OMS para automatizar percentiles.
2. Implementar signos vitales con temperatura Celsius y pulsos como texto libre.
3. Ampliar somatometría con IMC, perímetro cefálico, edad corregida hasta los dos años y gráficas históricas de peso y talla.
4. Después del MVP, implementar archivos privados de laboratorios e imagenología; por ahora se conservarán únicamente notas escritas.
5. Implementar vacunación completa o incompleta y vacunas faltantes.
6. Separar hitos del desarrollo y resultado EDI dentro de neurodesarrollo.
7. Ajustar historia clínica con los cinco tamices, lugar de nacimiento y vía vaginal o abdominal.
8. Mantener edición de consultas, diagnósticos y tratamientos sin mostrar autor de cambio.

No se recomienda replicar las 66 entradas como cajas de texto independientes. Se utilizarán campos numéricos, selecciones, listas repetibles y texto libre según cada concepto.

## 9. Limitación de revisión visual

No fue posible renderizar el documento a imágenes porque el entorno no tiene instaladas las dependencias `pdf2image`, LibreOffice y Poppler requeridas por el renderizador. El análisis se realizó sobre la estructura OOXML, el orden de los párrafos y los controles de contenido internos. Esto es suficiente para modelar los conceptos preliminares, pero no valida la apariencia, saltos de página o alineación visual del formulario original.
