# 📋 Reporte de Pruebas QA — NutriVision AI

**Rama:** `feature-qa`
**Sprint:** 4
**Fecha:** 13/05/2026
**Tester:** QA / Tester
**Versión:** 1.0.0

---

## 1. Resumen Ejecutivo

| Métrica | Valor |
|---|---|
| Total de casos de prueba | 16 |
| ✅ Pasaron | 14 |
| ❌ Fallaron | 2 |
| ⚠️ Bloqueados | 0 |
| Cobertura de flujos críticos | 100% |

---

## 2. Comprobación del Sistema

En el Sprint 4 se revisó que la aplicación pudiera abrirse y ejecutarse en varios dispositivos. Durante el Sprint 3 se tuvo un problema con la API de Gemini que impedía el escaneo de alimentos, pero fue identificado y corregido. Gracias a esa corrección, en este Sprint 4 los usuarios ya no tienen ese problema al momento de escanear sus comidas.

Las pruebas se realizaron con **tres dispositivos móviles nuevos** que no habían probado la aplicación. Al inicio no abría nada porque fallaban unas cosas del código del dev del Sprint 4, pero tras las correcciones necesarias se generó el QR correctamente y se comprobó que la aplicación corre completamente en todos los dispositivos.

---

## 3. Entorno de Pruebas

| Campo | Detalle |
|---|---|
| Plataforma | iOS / Android (Expo Go) |
| Dispositivos | 3 dispositivos móviles nuevos |
| Framework | React Native + Expo SDK |
| Base de datos | SQLite local |
| IA | Google Gemini 2.5 Flash |
| Conexión | WiFi activa durante pruebas de IA |

---

## 4. Funciones Críticas Evaluadas

- Inicio de sesión
- Registro de usuario
- Validación de formularios
- Navegación principal
- Escaneo de alimentos con IA
- Historial de comidas
- Perfil médico (diabetes)
- Conexión a internet y errores

---

## 5. Casos de Prueba

### 🔐 Módulo 1 — Inicio de Sesión

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 1.1 | Login con datos válidos | 1. Abrir Login. 2. Ingresar correo válido. 3. Ingresar contraseña correcta. 4. Presionar "Iniciar Sesión" | El sistema permite el acceso | Acceso realizado correctamente, pantalla principal cargada | ✅ |
| 1.2 | Login con campos vacíos | 1. Abrir Login. 2. Dejar correo y contraseña vacíos. 3. Presionar "Iniciar Sesión" | Mensaje de error, acceso bloqueado | La aplicación bloqueó el acceso y mostró advertencia | ✅ |
| 1.3 | Login con contraseña incorrecta | 1. Ingresar correo registrado. 2. Ingresar contraseña incorrecta. 3. Presionar "Iniciar Sesión" | Mensaje de credenciales inválidas | Mensaje de acceso denegado mostrado correctamente | ✅ |

---

### 📝 Módulo 2 — Registro de Usuario

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 2.1 | Registro con datos válidos | 1. Ingresar nombre, correo, contraseña, edad y peso válidos. 2. Seleccionar "Sí" en diabetes. 3. Aceptar términos. 4. Presionar "Continuar" | El sistema guarda la información | El registro se completó correctamente | ✅ |
| 2.2 | Registro sin aceptar términos | 1. Completar formulario. 2. NO marcar términos y condiciones. 3. Presionar "Continuar" | El sistema impide el avance | La aplicación mostró mensaje de advertencia | ✅ |
| 2.3 | Contraseñas que no coinciden | 1. Ingresar contraseña. 2. Confirmar con una diferente. 3. Presionar "Continuar" | Mensaje de error de contraseñas distintas | Advertencia mostrada correctamente | ✅ |

---

### 🩺 Módulo 3 — Perfil Médico

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 3.1 | Seleccionar "Sí" en diabetes | 1. En el formulario seleccionar "Sí" en la pregunta de diabetes | Aparecen opciones de tipo de diabetes | Opciones Tipo 1, Tipo 2, Gestacional y Pre.Diabetes mostradas | ✅ |
| 3.2 | Seleccionar "No" en diabetes | 1. Seleccionar "No" en la pregunta de diabetes | Las opciones adicionales se ocultan | Opciones ocultadas correctamente | ✅ |

---

### 🍽️ Módulo 4 — Escaneo de Alimentos con IA

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 4.1 | Escaneo de comida | 1. Tomar foto de un plato de comida. 2. Esperar procesamiento | La IA detecta alimentos y calcula carbohidratos | El sistema identificó correctamente los alimentos | ✅ |
| 4.2 | Alerta de azúcar elevado | 1. Escanear alimento con alto contenido de azúcar (pastel, refresco) | Alerta crítica de azúcar mostrada | Modal de alerta apareció correctamente | ✅ |
| 4.3 | Escaneo sin conexión a internet | 1. Desactivar WiFi. 2. Intentar escanear imagen | Mensaje claro de error de conexión | Error genérico sin mensaje claro al usuario | ❌ |

---

### 📊 Módulo 5 — Historial de Comidas

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 5.1 | Revisar comidas guardadas | 1. Escanear comida. 2. Confirmar análisis. 3. Ir a historial | La comida debe aparecer registrada | El historial mostró correctamente la información | ✅ |

---

### 🧭 Módulo 6 — Navegación

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 6.1 | Cambiar entre pestañas | 1. Cambiar entre Inicio, Progreso y Perfil varias veces | Navegación fluida y estable | Navegación estable en los 3 dispositivos probados | ✅ |

---

### 💥 Módulo 7 — Estrés

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 7.1 | Presionar "Continuar" varias veces | 1. Presionar el botón de continuar o guardar múltiples veces rápido | Ejecutar una sola acción | Botón se deshabilita durante la operación, sin duplicados | ✅ |
| 7.2 | Diseño en distintos tamaños de pantalla | 1. Probar la app en los 3 dispositivos de diferente tamaño | Diseño adaptable sin elementos cortados | UI correcta en todos los dispositivos probados | ✅ |

---

### 🔑 Módulo 8 — Recuperación de Contraseña

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 8.1 | Recuperar contraseña con correo registrado | 1. Ir a "¿Olvidaste tu contraseña?". 2. Ingresar correo registrado. 3. Ingresar nueva contraseña. 4. Confirmar y enviar | Contraseña restablecida, redirección a Login | Proceso completado correctamente | ✅ |
| 8.2 | Recuperar contraseña con correo no registrado | 1. Ingresar correo que no existe. 2. Presionar "Restablecer" | Mensaje de cuenta no encontrada | Mensaje de error mostrado correctamente | ✅ |

---

## 6. Resumen General de Resultados

| Función | Estado |
|---|---|
| Login | ✅ Correcto |
| Registro | ✅ Correcto |
| Validación de términos | ✅ Correcto |
| Perfil médico (diabetes) | ✅ Correcto |
| Escaneo IA | ✅ Correcto |
| Alerta de azúcar | ✅ Correcto |
| Historial | ✅ Correcto |
| Navegación | ✅ Correcto |
| Recuperación de contraseña | ✅ Correcto |
| Escaneo sin internet | ❌ Mejorar |

---

## 7. Bugs Detectados

| ID | Módulo | Severidad | Descripción | Estado |
|---|---|---|---|---|
| BUG-001 | API Gemini | 🔴 Alta | El endpoint `/v1beta/` no soportaba el modelo usado. **Corregido en Sprint 4** cambiando a `/v1/` | ✅ Resuelto |
| BUG-002 | Escaneo IA | 🔴 Alta | Sin conexión a internet el error no se comunica claramente al usuario | Abierto |

---

## 8. Conclusión

Las pruebas realizadas sobre las funciones críticas de NutriVision AI demostraron que el sistema cuenta con una base funcional estable para el flujo principal del usuario. El bug crítico del Sprint 3 relacionado con la API fue corregido exitosamente en el Sprint 4, permitiendo que el escaneo de alimentos funcione correctamente en todos los dispositivos probados.

Las principales áreas de mejora se encuentran en el manejo de errores de red y la validación avanzada de formularios. Ninguno de los bugs abiertos bloquea el uso principal de la aplicación.

---

*Reporte generado por el rol QA/Tester — Sprint 4 — NutriVision AI*
