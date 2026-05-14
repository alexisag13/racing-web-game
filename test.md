[# 📋 Reporte de Pruebas QA — NutriVision AI

**Rama:** `feature-qa`
**Sprint:** 4
**Fecha:** 13/05/2026
**Tester:** QA / Tester
**Versión:** 1.0.0

---

## 1. Resumen Ejecutivoa

| Métrica | Valor |
|---|---|
| Total de casos de prueba | 34 |
| ✅ Pasaron | 27 |
| ❌ Fallaron | 5 |
| ⚠️ Bloqueados | 2 |
| Cobertura de flujos críticos | 100% |

---

## 2. Comprobación del Sistema

En el Sprint 4 se verificó que la aplicación pudiera abrirse y ejecutarse en varios dispositivos. Durante el Sprint 3 se detectó un problema con la API de Gemini que impedía el escaneo de alimentos. El error fue identificado y corregido: el endpoint usaba `/v1beta/` cuando debía usar `/v1/`, ya que el modelo `gemini-2.5-flash` solo está disponible en la versión estable de la API.

Las pruebas se realizaron con **tres dispositivos móviles nuevos** que no habían probado la aplicación. Al inicio hubo problemas al ejecutar el código del dev del Sprint 4, pero tras las correcciones se generó el QR correctamente y se verificó que la app corre de forma completa en todos los dispositivos.

---

## 3. Entorno de Pruebas

| Campo | Detalle |
|---|---|
| Plataforma | iOS / Android (Expo Go) |
| Dispositivos | 3 dispositivos móviles nuevos |
| Framework | React Native + Expo SDK |
| Base de datos | SQLite local (expo-sqlite) |
| IA | Google Gemini 2.5 Flash (`v1`) |
| Conexión | WiFi activa durante pruebas de IA |

---

## 4. Casos de Prueba

### 🔐 Módulo 1 — Inicio de Sesión

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 1.1 | Login con datos válidos | 1. Abrir Login. 2. Ingresar correo válido. 3. Ingresar contraseña correcta. 4. Presionar "Iniciar Sesión" | Acceso correcto al Dashboard | Acceso realizado correctamente, Dashboard cargado | ✅ |
| 1.2 | Login con campos vacíos | 1. Abrir Login. 2. Dejar ambos campos vacíos. 3. Presionar "Iniciar Sesión" | Mensaje de error, acceso bloqueado | Modal "Campos Incompletos" mostrado correctamente | ✅ |
| 1.3 | Login con contraseña incorrecta | 1. Ingresar correo registrado. 2. Ingresar contraseña incorrecta. 3. Presionar "Iniciar Sesión" | Mensaje de credenciales inválidas | Modal "Acceso Denegado" mostrado | ✅ |
| 1.4 | Login con formato de correo inválido | 1. Ingresar "usuariosindominio". 2. Presionar "Iniciar Sesión" | Modal "Correo Inválido" | Validación con regex funcionó correctamente | ✅ |

---

### � Módulo 2 — Registro de Usuario

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 2.1 | Registro con datos válidos | 1. Llenar todos los campos. 2. Aceptar términos. 3. Presionar "Finalizar Registro" | Registro exitoso, redirección al Dashboard | Modal de bienvenida mostrado, usuario redirigido | ✅ |
| 2.2 | Registro sin aceptar términos | 1. Completar formulario. 2. NO marcar términos. 3. Presionar "Finalizar Registro" | Sistema impide el avance | Botón deshabilitado con opacidad reducida | ✅ |
| 2.3 | Contraseñas que no coinciden | 1. Ingresar contraseña "abc123". 2. Confirmar con "xyz999". 3. Presionar "Finalizar Registro" | Modal "Contraseñas Diferentes" | Advertencia mostrada correctamente | ✅ |
| 2.4 | Contraseña menor a 6 caracteres | 1. Ingresar contraseña "abc". 2. Presionar "Finalizar Registro" | Modal "Contraseña Débil" | Advertencia mostrada correctamente | ✅ |
| 2.5 | Correo ya registrado | 1. Intentar registrar un correo existente en la BD | Error de correo duplicado | Modal de error mostrado correctamente | ✅ |

---

### 🩺 Módulo 3 — Perfil Médico

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 3.1 | Seleccionar "Sí" en diabetes | 1. En formulario seleccionar "Sí" en diabetes | Aparecen opciones de tipo de diabetes | Tipo 1, Tipo 2, Gestacional, Pre.Diabetes mostrados | ✅ |
| 3.2 | Seleccionar "No" en diabetes | 1. Seleccionar "No" en diabetes | Opciones de tipo se ocultan | Opciones ocultadas, campo limpiado | ✅ |
| 3.3 | IMC calculado correctamente | 1. Registrar peso 75 kg y altura 175 cm. 2. Ir a Perfil | IMC = 24.5, categoría "Normal" | Cálculo correcto mostrado con categoría | ✅ |

---

### 🍽️ Módulo 4 — Escaneo de Alimentos con IA

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 4.1 | Escaneo desde cámara | 1. Presionar "Tomar foto". 2. Conceder permiso. 3. Tomar foto de comida. 4. Esperar análisis | IA detecta alimentos y calcula macros | Alimentos identificados correctamente. Bug `v1beta` corregido en Sprint 4 | ✅ |
| 4.2 | Escaneo desde galería | 1. Presionar "Galería". 2. Seleccionar imagen de comida. 3. Esperar análisis | Resultados nutricionales mostrados | Análisis completado sin errores | ✅ |
| 4.3 | Alerta de azúcar elevado | 1. Escanear alimento con alto azúcar (pastel, refresco) | Modal "ALERTA CRÍTICA: Nivel de Azúcar Elevado" | AlertModal apareció cuando `alertaAzucar = true` | ✅ |
| 4.4 | Imagen sin comida | 1. Escanear imagen sin alimentos (paisaje, objeto) | Mensaje "No se encontraron alimentos" | Gemini devuelve `[]`, mensaje mostrado correctamente | ✅ |
| 4.5 | Escaneo sin conexión | 1. Desactivar WiFi. 2. Intentar escanear imagen | Mensaje claro de error de conexión | Error genérico sin mensaje claro al usuario | ❌ |

---

### 📊 Módulo 5 — Historial de Comidas

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 5.1 | Guardar registro de comida | 1. Escanear comida. 2. Presionar "Guardar registro diario". 3. Ir a Progreso | Historial actualizado con el registro | Historial y progreso del día actualizados | ✅ |
| 5.2 | Sin registros (usuario nuevo) | 1. Ingresar con usuario nuevo. 2. Ir al tab "Progreso" | Gráficas muestran 0 sin errores | Valores en 0 mostrados, sin crashes | ✅ |
| 5.3 | Recarga al enfocar tab | 1. Guardar registro en Dashboard. 2. Cambiar al tab "Progreso" | Datos actualizados al enfocar | `useFocusEffect` recarga datos correctamente | ✅ |

---

### 👤 Módulo 6 — Perfil y Edición

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 6.1 | Editar nombre | 1. Ir a Perfil → "Editar Información". 2. Cambiar nombre. 3. Guardar | Nombre actualizado en Perfil | Actualización guardada en SQLite correctamente | ✅ |
| 6.2 | Peso fuera de rango | 1. Ingresar peso = 10 kg. 2. Presionar "Guardar Cambios" | Modal "Peso Fuera de Rango" | Advertencia mostrada correctamente | ✅ |
| 6.3 | Cerrar sesión | 1. Ir a Perfil. 2. Presionar "Cerrar Sesión". 3. Confirmar | Redirección a Login, sesión eliminada | Logout exitoso, usuario redirigido | ✅ |

---

### 🤖 Módulo 7 — IA Corporal y Diagnóstico

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 7.1 | Escaneo corporal desde Perfil | 1. Ir a Perfil → "Iniciar Escaneo Corporal". 2. Seleccionar imagen. 3. Confirmar actualización | Estimación de peso y altura, perfil actualizado | Gemini devolvió estimaciones correctas | ✅ |
| 7.2 | Rellenar con diagnóstico médico | 1. En Registro presionar "Rellenar con Diagnóstico". 2. Seleccionar imagen de documento | Campos auto-rellenados con datos del documento | No se contaba con imagen de documento médico real | ⚠️ |

---

### 🧭 Módulo 8 — Navegación

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 8.1 | Cambiar tabs repetidamente | 1. Cambiar entre Inicio, Progreso y Perfil varias veces | Navegación fluida sin crashes | Navegación estable en los 3 dispositivos | ✅ |
| 8.2 | Cerrar modales | 1. Abrir modal de Términos. 2. Presionar cierre o swipe down | Modal se cierra sin errores | iOS correcto. Android: swipe no responde al primer intento | ⚠️ |

---

### 💥 Módulo 9 — Pruebas de Estrés

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 9.1 | Presionar botón varias veces | 1. Presionar "Guardar" o "Continuar" múltiples veces rápido | Una sola acción ejecutada | Botón deshabilitado con `isSubmitting = true` durante operación | ✅ |
| 9.2 | API Key inválida | 1. Cambiar key en `.env`. 2. Reiniciar Expo. 3. Intentar escanear | Error claro sin crash | Mensaje "La clave de API no está configurada", app estable | ✅ |
| 9.3 | Guardar sin sesión activa | 1. Forzar sesión nula. 2. Intentar guardar registro | Modal "Sesión Requerida" sin crash | Protección funcionó correctamente | ✅ |

---

### ♿ Módulo 10 — Accesibilidad y Tema

| ID | Caso de Prueba | Pasos | Resultado Esperado | Resultado Obtenido | Estado |
|---|---|---|---|---|---|
| 10.1 | Activar texto grande | 1. Abrir Accesibilidad. 2. Activar "Texto grande". 3. Navegar por la app | Fuente aumentada en toda la app | Toggle guardado en AsyncStorage pero cambio visual no aplica en tiempo real | ❌ |
| 10.2 | Persistencia de preferencias | 1. Activar "Alto contraste". 2. Cerrar app. 3. Reabrir | Preferencias mantenidas | AsyncStorage persiste correctamente | ✅ |
| 10.3 | Toggle modo oscuro/claro | 1. Ir a Perfil. 2. Presionar Switch de tema | Toda la UI cambia instantáneamente | Cambio de tema aplicado sin reiniciar | ✅ |
| 10.4 | Diseño adaptable | 1. Probar en dispositivos de diferente tamaño de pantalla | UI adaptable sin elementos cortados | UI correcta en los 3 dispositivos probados | ✅ |

---

## 5. Bugs Detectados

| ID | Módulo | Severidad | Descripción | Estado |
|---|---|---|---|---|
| BUG-001 | API Gemini | 🔴 Alta | Endpoint `v1beta` no soportaba `gemini-2.5-flash`. **Corregido en Sprint 4** cambiando a `/v1/` | ✅ Resuelto |
| BUG-002 | Escaneo IA | 🔴 Alta | Sin conexión a internet el error no se comunica claramente al usuario | Abierto |
| BUG-003 | Accesibilidad | 🟡 Media | Toggle "Texto grande" guarda el valor pero no aplica el cambio visual en tiempo real | Abierto |
| BUG-004 | Progreso | 🟡 Media | Gráfica semanal muestra grasas en el eje Y, no calorías. Título poco claro | Abierto |
| BUG-005 | Perfil | 🟢 Baja | Campo "Objetivo" hardcodeado como "Bajar de peso" para todos los usuarios | Abierto |
| BUG-006 | Perfil | 🟢 Baja | "Racha" hardcodeada como "12 Días", no se calcula dinámicamente | Abierto |

---

## 6. Funcionalidades No Implementadas

| Funcionalidad | Pantalla | Observación |
|---|---|---|
| Login con Google / Apple / Facebook | LoginScreen | Botones visibles en UI pero sin funcionalidad |
| Botón "VER MÁS" en gráfica semanal | ExploreScreen | Sin acción al presionar |
| Racha dinámica | ProfileScreen | Valor hardcodeado en "12 Días" |
| Objetivo personalizado | ProfileScreen | Valor hardcodeado en "Bajar de peso" |

---

## 7. Validación del Flujo Principal

| Flujo | Estado |
|---|---|
| Welcome → Register → Dashboard | ✅ |
| Welcome → Login → Dashboard | ✅ |
| Dashboard → Escanear → Guardar | ✅ |
| Dashboard → Progreso → Perfil | ✅ |
| Perfil → Editar → Guardar | ✅ |
| Perfil → Logout → Login | ✅ |
| Login → Forgot Password → Login | ✅ |

---

## 8. Conclusión

Las pruebas sobre las funciones críticas de NutriVision AI demostraron que el sistema tiene una base funcional estable. El bug crítico del Sprint 3 relacionado con el endpoint de Gemini fue corregido exitosamente en el Sprint 4, permitiendo que el escaneo de alimentos funcione en todos los dispositivos probados.

Las áreas de mejora son el manejo de errores de red, la accesibilidad en tiempo real y los datos dinámicos del perfil. Ninguno de los bugs abiertos bloquea el uso principal de la aplicación.

---

*Reporte generado por el rol QA/Tester — Sprint 4 — NutriVision AI*
](https://github.com/alexisag13/racing-web-game/blob/main/test.md)
