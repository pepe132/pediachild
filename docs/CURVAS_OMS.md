# Análisis de las curvas de crecimiento de la OMS

## Fuente recibida

Se revisó `curvas_oms.pdf`, un anexo gráfico de curvas de crecimiento publicado en el material AEPap 2009. El archivo contiene 11 páginas con las líneas de referencia de los percentiles 3, 15, 50, 85 y 97.

El PDF sirve para confirmar qué gráficas espera consultar el pediatra, pero no contiene tablas numéricas ni parámetros de cálculo. Por seguridad clínica, no se deben obtener valores automáticos leyendo o digitalizando visualmente las líneas del PDF.

## Indicadores y rangos encontrados

Las curvas están separadas para niñas y niños e incluyen:

| Indicador | Rango mostrado |
| --- | --- |
| Peso para la edad | nacimiento a 10 años |
| Longitud para la edad | nacimiento a 2 años |
| Estatura para la edad | 2 a 19 años |
| Perímetro cefálico para la edad | nacimiento a 5 años |
| Peso para la longitud | nacimiento a 2 años |
| Peso para la estatura | 2 a 5 años |
| IMC para la edad | nacimiento a 19 años |

No todos los indicadores cubren hasta los 19 años. En particular, el PDF solo muestra peso para la edad hasta los 10 años y peso para longitud o estatura hasta los 5 años.

También se observaron inconsistencias en el anexo: no aparece una gráfica de IMC para la edad de niñas de 2 a 5 años y, en la gráfica de niños de nacimiento a 5 años, una etiqueta parece repetir el percentil 97 en la línea naranja superior. Estas observaciones deben verificarse contra la fuente oficial antes de implementar cualquier cálculo o gráfica.

## Conclusión funcional

El sistema no debe limitar la captura a elegir uno de los cinco percentiles impresos. Una medición real puede quedar entre dos curvas. La aplicación debe guardar siempre la medición original y, si se automatiza el cálculo, mostrar un percentil calculado o su intervalo, sin sustituir el dato medido.

Para calcular percentiles automáticamente se necesita una fuente numérica oficial y validada de la OMS, con sus parámetros o tablas por sexo y edad. El PDF recibido no basta para implementar ese cálculo. Hasta integrar y probar esa referencia, el MVP puede permitir que el pediatra escriba el percentil o seleccione una banda de referencia manualmente, identificándolo como resultado manual.

## Datos necesarios

Cada medición antropométrica debe conservar:

- fecha y hora de medición;
- peso en kilogramos;
- longitud o estatura en centímetros;
- tipo de medición: longitud recostada o estatura de pie;
- perímetro cefálico en centímetros, si se confirma su uso;
- IMC calculado en kg/m², cuando existan peso y talla válidos;
- sexo utilizado por la curva de referencia;
- edad exacta al momento de la medición;
- percentil registrado manualmente o calculado;
- origen del resultado: `MANUAL` o `CALCULATED`;
- indicador al que corresponde;
- nombre y versión de la referencia utilizada.

La edad digitada en días, meses o años puede mantenerse como dato clínico visible. Sin embargo, para un cálculo automático preciso se requiere la fecha de nacimiento y la fecha de medición. También se requiere el sexo correspondiente a las curvas. Si falta cualquiera de esos datos, el backend no debe inventar un percentil automático.

## Modelo recomendado

`anthropometric_measurements` guardará los valores originales de una consulta:

- `id`;
- `consultation_id`;
- `measured_at`;
- `weight_kg`;
- `length_height_cm`;
- `measurement_position` (`RECUMBENT_LENGTH` o `STANDING_HEIGHT`);
- `head_circumference_cm`, opcional;
- `bmi`, derivado y opcional;
- `created_at`, `updated_at`.

`growth_assessments` guardará uno o varios resultados asociados a la medición:

- `id`;
- `anthropometric_measurement_id`;
- `indicator` (`WEIGHT_FOR_AGE`, `LENGTH_HEIGHT_FOR_AGE`, `WEIGHT_FOR_LENGTH_HEIGHT`, `HEAD_CIRCUMFERENCE_FOR_AGE` o `BMI_FOR_AGE`);
- `percentile`, opcional;
- `percentile_band`, opcional;
- `result_source` (`MANUAL` o `CALCULATED`);
- `reference_name` y `reference_version`, obligatorios para resultados calculados;
- `notes`, opcional.

Separar mediciones y evaluaciones permite recalcular con una referencia corregida sin alterar el peso o la talla originales.

## Presentación futura

El frontend podrá dibujar una curva interactiva y colocar sobre ella las mediciones históricas del paciente. Para hacerlo correctamente deberá usar el conjunto numérico validado, no imágenes recortadas del PDF. Primero se implementarán captura, historial y validaciones; la gráfica puede incorporarse después sin cambiar el modelo.

## Confirmaciones del especialista

- Se automatizarán los percentiles usando referencias oficiales OMS.
- Se capturarán peso, talla, IMC y perímetro cefálico.
- Se mostrarán gráficas históricas de peso y talla.
- En pacientes prematuros se utilizará edad corregida hasta los dos años.

Queda pendiente confirmar que sexo y fecha de nacimiento serán obligatorios, pues las referencias OMS se seleccionan por sexo y edad exacta.
