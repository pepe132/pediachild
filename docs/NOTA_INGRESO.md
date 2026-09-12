# Análisis del formato de nota de ingreso

## Fuente revisada

Documento analizado: `Formato de Nota de Ingreso-2.pdf`, de 9 páginas.

El formato combina contenido de naturaleza diferente:

1. una nota inicial de evaluación;
2. signos vitales y somatometría;
3. una exploración física narrativa;
4. resultados de laboratorio e imagen;
5. la historia clínica de ingreso;
6. un banco de textos guía para describir síntomas.

No debe implementarse como un solo formulario ni como una tabla con todos sus renglones.

## Qué confirma del modelo actual

El documento confirma la separación prevista entre:

- historia clínica permanente del paciente: antecedentes familiares, no patológicos, alimentación, neurodesarrollo, vacunación, antecedentes perinatales y patológicos;
- consulta o atención: signos vitales, somatometría, motivo, padecimiento actual, exploración física, laboratorios, imagen, diagnósticos y tratamientos;
- archivos adjuntos: fotografías o capturas de laboratorios y estudios de imagen.

Los campos de signos vitales coinciden con frecuencia cardiaca, frecuencia respiratoria, presión arterial, saturación, pulsos y llenado capilar. Se mantiene la temperatura en Celsius solicitada por el especialista aunque no aparezca en la primera sección del documento.

## Elementos nuevos o más claros

### SAMPLE

La nota inicial incluye el esquema `SAMPLE`:

- `S`: signos y síntomas;
- `A`: alergias;
- `M`: medicamentos;
- `P`: antecedentes pertinentes;
- `L`: última ingesta;
- `E`: eventos relacionados.

Para el MVP se recomienda guardarlo como una sección opcional de la consulta. Puede almacenarse en campos separados para que el formulario sea claro, sin hacerlo obligatorio para todas las consultas.

### Exploración física

El ejemplo contiene una exploración física extensa en prosa: estado neurológico, hidratación, cabeza, ojos, nariz, boca, cuello, tórax, aparato cardiovascular, abdomen, genitales, extremidades, fuerza, pulsos y llenado capilar.

Esto confirma que la exploración física debe mantenerse como texto libre en el MVP. El frontend puede ofrecer una plantilla editable, pero el backend no debe guardar una frase clínica prellenada como si fuera un hallazgo confirmado.

### Laboratorios

El documento propone datos individuales para biometría hemática, química sanguínea y gasometría. Sin embargo, el especialista ya confirmó que quiere notas escritas y archivos adjuntos. Por ello, inicialmente se conservará:

- nota libre de laboratorios;
- nota libre de imagenología;
- adjuntos privados en una fase posterior al MVP;
- fecha opcional del estudio.

No se crearán columnas para HB, HCT, VCM, BUN, electrolitos y cada analito hasta que se solicite comparar o graficar resultados estructurados.

### Neurodesarrollo y escolaridad

El ejemplo registra hitos individuales y también desempeño escolar. Esto refuerza que neurodesarrollo puede requerir:

- resultado o notas de EDI;
- hitos repetibles con estado o edad de adquisición;
- escolaridad, asistencia y observaciones de aprendizaje.

El detalle exacto todavía debe confirmarse con el especialista antes de implementar esta sección.

### Antecedentes perinatales

El ejemplo agrega conceptos no evidentes en el formato anterior:

- gestas, cesáreas, partos y abortos;
- número de gesta del paciente;
- embarazo planeado y deseado;
- momento de percepción del embarazo;
- ingesta de hematínicos;
- VIH y VDRL;
- amenaza de aborto o parto pretérmino;
- hipertensión, diabetes e infecciones durante el embarazo;
- si lloró y respiró al nacer;
- tamices metabólico, auditivo y cardiológico.

Estos datos pertenecen a la historia clínica permanente, no a cada consulta.

## Banco de síntomas

Las páginas finales contienen textos guía para astenia, crisis convulsivas, dolor, epistaxis, equimosis, estreñimiento, diarrea, fiebre, hematemesis, cuerpo extraño, lesiones dérmicas, palidez, sangrado, sialorrea, somnolencia, tos, traumatismo craneoencefálico y vómito.

No representan síntomas presentes simultáneamente ni campos obligatorios. Son plantillas de redacción con alternativas como inicio súbito o insidioso, progresión, duración, intensidad, desencadenantes y atenuantes.

La implementación recomendada es:

- `reason` como motivo de consulta libre;
- `current_illness` como padecimiento actual libre;
- plantillas opcionales únicamente en el frontend para ayudar a redactar;
- el texto final generado se guarda en la consulta;
- no crear una tabla distinta ni decenas de columnas por cada síntoma.

Así se pueden agregar o corregir plantillas sin migraciones de base de datos.

## Ajuste recomendado para `consultations`

Además de los campos ya previstos, una consulta podrá contener:

- `current_illness`, texto libre;
- `physical_examination`, texto libre;
- `sample_signs_symptoms`, opcional;
- `sample_allergies`, opcional;
- `sample_medications`, opcional;
- `sample_past_history`, opcional;
- `sample_last_intake`, opcional;
- `sample_events`, opcional;
- `laboratory_notes`, opcional;
- `imaging_notes`, opcional.

El esquema SAMPLE podría comenzar como una sola nota si el especialista desea una captura todavía más sencilla. La decisión no afecta la arquitectura general.

## Preguntas que deja el ejemplo

1. ¿SAMPLE se usará en la consulta cotidiana o únicamente en urgencias/ingreso hospitalario?
2. ¿Quiere una plantilla editable de exploración física o siempre empezará con el campo vacío?
3. ¿Desea plantillas de redacción para síntomas en la aplicación o únicamente texto libre?
4. ¿Se debe guardar una segunda toma de signos vitales después de la evaluación?
5. ¿Escolaridad y desempeño escolar formarán parte obligatoria de neurodesarrollo?
6. ¿Los resultados de laboratorio seguirán siendo nota libre o en el futuro necesitará comparar analitos?

## Conclusión

El documento sí es útil y no cambia la arquitectura modular. Confirma que historia clínica y consulta son módulos diferentes, y que una gran parte del contenido clínico debe conservarse como texto libre. El único agregado inmediato potencial es SAMPLE; los textos de síntomas deben tratarse como ayudas de captura del frontend y no como estructura rígida de la base de datos.
