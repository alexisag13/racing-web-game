# 📋 Reporte de Pruebas QA — NutriVision AI
**Rama:** `feature-qa`  
**Sprint:** 3  
**Fecha:** 13/05/2026  
**Tester:** QA / Tester  
**Versión de la app:** 1.0.0  

---

## 1. Resumen Ejecutivo

| Métrica | Valor |
|---|---|
| Total de casos de prueba | 35 |
| ✅ Pasaron | 28 |
| ❌ Fallaron | 5 |
| ⚠️ Bloqueados | 2 |
| Cobertura de flujos críticos | 100% |

---

## 2. Entorno de Pruebas

| Campo | Detalle |
|---|---|
| Plataforma | iOS (Expo Go) |
| Dispositivo | iPhone / Simulador iOS |
| Framework | React Native + Expo SDK |
| Base de datos | SQLite local (expo-sqlite) |
| IA | Google Gemini 2.5 Flash (`v1`) |
| Conexión | WiFi activa durante pruebas de IA |

---

## 3. Flujos Probados

1. Autenticación (Registro, Login, Logout, Recuperar contraseña)
2. Escaneo de comida con IA (cámara y galería)
3. Alerta de azúcar
4. Guardado de registros y progreso diario
5. Progreso semanal (gráficas)
6. Escaneo corporal IA
7. Diagnóstico médico IA
8. Edición de perfil
9. Accesibilidad
10. Tema (modo oscuro / claro)

---

## 4. Casos de Prueba

---

### 🔐 MÓDULO 1 — Autenticación

---

#### TC-001 — Registro exitoso con datos válidos
| Campo | Detalle |
|---|---|
| **Precondición** | App abierta en pantalla de bienvenida |
| **Pasos** | 1. Ir a Registro. 2. Llenar todos los campos con datos válidos. 3. Aceptar términos. 4. Presionar "Finalizar Registro" |
| **Datos de prueba** | Nombre: Juan Pérez, Email: juan@test.com, Password: test123, Peso: 75, Altura: 175, Sin diabetes |
| **Resultado esperado** | Modal de éxito "¡Bienvenido a NutriVision!" y redirección al Dashboard |
| **Resultado obtenido** | ✅ PASÓ — Modal mostrado correctamente, usuario redirigido al tab de inicio |

---

#### TC-002 — Registro con correo ya existente
| Campo | Detalle |
|---|---|
| **Precondición** | Existe un usuario registrado con el correo juan@test.com |
| **Pasos** | 1. Ir a Registro. 2. Ingresar el mismo correo ya registrado. 3. Presionar "Finalizar Registro" |
| **Datos de prueba** | Email: juan@test.com (duplicado) |
| **Resultado esperado** | Modal de error indicando que el correo ya está en uso |
| **Resultado obtenido** | ✅ PASÓ — Error mostrado correctamente |

---

#### TC-003 — Registro con contraseñas que no coinciden
| Campo | Detalle |
|---|---|
| **Precondición** | App en pantalla de Registro |
| **Pasos** | 1. Ingresar contraseña "abc123". 2. Ingresar confirmación "xyz999". 3. Presionar "Finalizar Registro" |
| **Resultado esperado** | Modal de advertencia "Contraseñas Diferentes" |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-004 — Registro sin aceptar términos
| Campo | Detalle |
|---|---|
| **Precondición** | App en pantalla de Registro con todos los campos llenos |
| **Pasos** | 1. Llenar todos los campos. 2. NO marcar el checkbox de términos. 3. Presionar "Finalizar Registro" |
| **Resultado esperado** | Botón deshabilitado (opacidad reducida) o advertencia |
| **Resultado obtenido** | ✅ PASÓ — Botón con opacidad 0.6 y deshabilitado |

---

#### TC-005 — Registro con contraseña menor a 6 caracteres
| Campo | Detalle |
|---|---|
| **Precondición** | App en pantalla de Registro |
| **Pasos** | 1. Ingresar contraseña "abc". 2. Presionar "Finalizar Registro" |
| **Resultado esperado** | Modal de advertencia "Contraseña Débil" |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-006 — Login con credenciales correctas
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario registrado en la BD local |
| **Pasos** | 1. Ir a Login. 2. Ingresar correo y contraseña correctos. 3. Presionar "Iniciar Sesión" |
| **Resultado esperado** | Redirección al Dashboard `/(tabs)` |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-007 — Login con contraseña incorrecta
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario registrado en la BD local |
| **Pasos** | 1. Ingresar correo correcto y contraseña incorrecta. 2. Presionar "Iniciar Sesión" |
| **Resultado esperado** | Modal "Acceso Denegado" |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-008 — Login con campos vacíos
| Campo | Detalle |
|---|---|
| **Precondición** | App en pantalla de Login |
| **Pasos** | 1. Dejar ambos campos vacíos. 2. Presionar "Iniciar Sesión" |
| **Resultado esperado** | Modal "Campos Incompletos" |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-009 — Logout desde perfil
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario con sesión activa |
| **Pasos** | 1. Ir a tab Perfil. 2. Presionar "Cerrar Sesión". 3. Confirmar en el modal |
| **Resultado esperado** | Redirección a pantalla de Login, sesión eliminada |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-010 — Recuperar contraseña con correo registrado
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario registrado con correo juan@test.com |
| **Pasos** | 1. Ir a "¿Olvidaste tu contraseña?". 2. Ingresar correo registrado. 3. Ingresar nueva contraseña válida. 4. Confirmar contraseña. 5. Presionar "Restablecer Contraseña" |
| **Resultado esperado** | Modal de éxito y redirección a Login |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-011 — Recuperar contraseña con correo no registrado
| Campo | Detalle |
|---|---|
| **Precondición** | App en pantalla de recuperación |
| **Pasos** | 1. Ingresar correo que no existe en la BD. 2. Presionar "Restablecer Contraseña" |
| **Resultado esperado** | Modal "Cuenta No Encontrada" |
| **Resultado obtenido** | ✅ PASÓ |

---

### 🍽️ MÓDULO 2 — Escaneo de Comida con IA

---

#### TC-012 — Escaneo de comida desde cámara (flujo completo)
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario logueado, conexión a internet activa |
| **Pasos** | 1. En Dashboard presionar "Tomar foto". 2. Conceder permiso de cámara. 3. Tomar foto de un platillo. 4. Esperar análisis de Gemini |
| **Resultado esperado** | Lista de alimentos detectados con calorías, proteínas, carbos, grasas y azúcares |
| **Resultado obtenido** | ✅ PASÓ — Gemini devuelve JSON correctamente con `v1/gemini-2.5-flash` |

---

#### TC-013 — Escaneo de comida desde galería
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario logueado, imagen de comida en galería |
| **Pasos** | 1. Presionar "Galería". 2. Seleccionar imagen de comida. 3. Esperar análisis |
| **Resultado esperado** | Resultados nutricionales mostrados correctamente |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-014 — Alerta de azúcar elevado
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario logueado |
| **Pasos** | 1. Escanear imagen de alimento con alto contenido de azúcar (ej. pastel, refresco) |
| **Resultado esperado** | Modal "ALERTA CRÍTICA: Nivel de Azúcar Elevado" con detalle de alimentos |
| **Resultado obtenido** | ✅ PASÓ — AlertModal aparece cuando `alertaAzucar = true` |

---

#### TC-015 — Escaneo de imagen sin comida
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario logueado |
| **Pasos** | 1. Escanear imagen que no contiene comida (ej. paisaje, objeto) |
| **Resultado esperado** | Mensaje "No se encontraron alimentos" |
| **Resultado obtenido** | ✅ PASÓ — Gemini devuelve `[]` y se muestra el mensaje correcto |

---

#### TC-016 — Guardar registro de comida
| Campo | Detalle |
|---|---|
| **Precondición** | Análisis de comida completado y visible en pantalla |
| **Pasos** | 1. Presionar "Guardar registro diario" |
| **Resultado esperado** | Modal de éxito, progreso del día actualizado, resultado limpiado de pantalla |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-017 — Escaneo sin conexión a internet
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario logueado, WiFi desactivado |
| **Pasos** | 1. Intentar escanear imagen desde galería sin conexión |
| **Resultado esperado** | Mensaje de error de conexión visible al usuario |
| **Resultado obtenido** | ❌ FALLÓ — La app muestra un error genérico sin mensaje claro al usuario. Se recomienda mejorar el manejo del error de red |

---

#### TC-018 — Retomar escaneo (botón X sobre imagen)
| Campo | Detalle |
|---|---|
| **Precondición** | Imagen cargada en Dashboard |
| **Pasos** | 1. Presionar el botón X (close) sobre la imagen |
| **Resultado esperado** | Imagen y resultado eliminados, vuelve al estado inicial |
| **Resultado obtenido** | ✅ PASÓ |

---

### 📊 MÓDULO 3 — Progreso Nutricional

---

#### TC-019 — Progreso del día se actualiza al guardar
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario con al menos un registro guardado hoy |
| **Pasos** | 1. Guardar un registro de comida. 2. Observar el gráfico circular de calorías en Dashboard |
| **Resultado esperado** | El contador de calorías y macros del día se incrementa correctamente |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-020 — Pantalla de Progreso carga datos al enfocar tab
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario con registros del día y de la semana |
| **Pasos** | 1. Guardar un registro en Dashboard. 2. Cambiar al tab "Progreso" |
| **Resultado esperado** | PieChart y BarChart muestran datos actualizados |
| **Resultado obtenido** | ✅ PASÓ — `useFocusEffect` recarga datos al enfocar |

---

#### TC-021 — Progreso con cero registros (estado vacío)
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario nuevo sin registros |
| **Pasos** | 1. Ir al tab "Progreso" sin haber guardado ningún alimento |
| **Resultado esperado** | Gráficas muestran 0 / meta, sin errores de renderizado |
| **Resultado obtenido** | ✅ PASÓ — Valores en 0 mostrados correctamente |

---

### 👤 MÓDULO 4 — Perfil y Edición

---

#### TC-022 — Editar nombre del perfil
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario logueado |
| **Pasos** | 1. Ir a Perfil → "Editar Información". 2. Cambiar el nombre. 3. Presionar "Guardar Cambios" |
| **Resultado esperado** | Modal de éxito, nombre actualizado en la pantalla de Perfil |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-023 — Editar perfil con peso fuera de rango
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario en pantalla de edición de perfil |
| **Pasos** | 1. Ingresar peso = 10 (fuera del rango 30-300). 2. Presionar "Guardar Cambios" |
| **Resultado esperado** | Modal "Peso Fuera de Rango" |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-024 — Editar perfil con altura fuera de rango
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario en pantalla de edición de perfil |
| **Pasos** | 1. Ingresar altura = 50 (fuera del rango 100-250). 2. Presionar "Guardar Cambios" |
| **Resultado esperado** | Modal "Altura Fuera de Rango" |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-025 — IMC calculado correctamente en perfil
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario con peso y altura registrados |
| **Pasos** | 1. Ir a tab Perfil. 2. Observar el valor de IMC |
| **Resultado esperado** | IMC = peso / (altura_m)². Ej: 75kg / (1.75)² = 24.5 |
| **Resultado obtenido** | ✅ PASÓ — Cálculo correcto y categoría mostrada (Normal, Sobrepeso, etc.) |

---

### 🤖 MÓDULO 5 — IA Corporal y Diagnóstico

---

#### TC-026 — Escaneo corporal desde Perfil
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario logueado, imagen de cuerpo completo en galería |
| **Pasos** | 1. Ir a Perfil → "Iniciar Escaneo Corporal". 2. Seleccionar imagen. 3. Confirmar actualización de datos |
| **Resultado esperado** | Modal con peso y altura estimados, opción de actualizar perfil |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-027 — Rellenar registro con diagnóstico médico
| Campo | Detalle |
|---|---|
| **Precondición** | App en pantalla de Registro, imagen de documento médico disponible |
| **Pasos** | 1. Presionar "Rellenar con Diagnóstico". 2. Seleccionar imagen del documento. 3. Esperar análisis |
| **Resultado esperado** | Campos de nombre, peso y condición médica auto-rellenados |
| **Resultado obtenido** | ⚠️ BLOQUEADO — No se contaba con imagen de documento médico real para la prueba |

---

#### TC-028 — Escaneo corporal desde Registro
| Campo | Detalle |
|---|---|
| **Precondición** | App en pantalla de Registro |
| **Pasos** | 1. Presionar "Escaneo Corporal IA". 2. Seleccionar imagen de cuerpo completo |
| **Resultado esperado** | Campos de peso y altura auto-rellenados con estimación de Gemini |
| **Resultado obtenido** | ✅ PASÓ |

---

### ♿ MÓDULO 6 — Accesibilidad

---

#### TC-029 — Activar texto grande
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario logueado |
| **Pasos** | 1. Abrir pantalla de Accesibilidad. 2. Activar toggle "Texto grande". 3. Cerrar y navegar por la app |
| **Resultado esperado** | Tamaño de fuente aumentado en toda la app |
| **Resultado obtenido** | ❌ FALLÓ — El toggle se guarda en AsyncStorage pero el cambio visual no se aplica en tiempo real en todas las pantallas |

---

#### TC-030 — Persistencia de preferencias de accesibilidad
| Campo | Detalle |
|---|---|
| **Precondición** | Preferencias de accesibilidad configuradas |
| **Pasos** | 1. Activar "Alto contraste". 2. Cerrar la app completamente. 3. Volver a abrir |
| **Resultado esperado** | Las preferencias se mantienen al reabrir la app |
| **Resultado obtenido** | ✅ PASÓ — AsyncStorage persiste correctamente |

---

### 🌙 MÓDULO 7 — Tema

---

#### TC-031 — Toggle modo oscuro / claro
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario en tab Perfil |
| **Pasos** | 1. Presionar el Switch de tema. 2. Observar cambio de colores en toda la app |
| **Resultado esperado** | Toda la UI cambia de tema instantáneamente |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-032 — Tema inicial sincronizado con sistema operativo
| Campo | Detalle |
|---|---|
| **Precondición** | Dispositivo con modo oscuro activado en sistema |
| **Pasos** | 1. Abrir la app por primera vez |
| **Resultado esperado** | App inicia en modo oscuro automáticamente |
| **Resultado obtenido** | ✅ PASÓ — ThemeContext detecta preferencia del sistema |

---

### 🔴 MÓDULO 8 — Casos de Error Forzado (Stress Testing)

---

#### TC-033 — Forzar error de API key inválida
| Campo | Detalle |
|---|---|
| **Precondición** | Modificar temporalmente `EXPO_PUBLIC_GEMINI_KEY` con valor inválido |
| **Pasos** | 1. Cambiar la key en `.env`. 2. Reiniciar Expo. 3. Intentar escanear imagen |
| **Resultado esperado** | Mensaje de error claro al usuario, sin crash de la app |
| **Resultado obtenido** | ✅ PASÓ — Se muestra "La clave de API de Gemini no está configurada" |

---

#### TC-034 — Intentar guardar sin usuario en sesión
| Campo | Detalle |
|---|---|
| **Precondición** | Estado de sesión nulo (simulado) |
| **Pasos** | 1. Forzar `user = null` en contexto. 2. Intentar guardar un registro de comida |
| **Resultado esperado** | Modal "Sesión Requerida" sin crash |
| **Resultado obtenido** | ✅ PASÓ |

---

#### TC-035 — Navegación hacia atrás desde pantallas modales
| Campo | Detalle |
|---|---|
| **Precondición** | Usuario en pantalla de Términos o Accesibilidad |
| **Pasos** | 1. Abrir modal de Términos. 2. Presionar botón de cierre o swipe down |
| **Resultado esperado** | Modal se cierra sin errores, regresa a la pantalla anterior |
| **Resultado obtenido** | ⚠️ BLOQUEADO — En Android el swipe down no siempre responde en el primer intento |

---

## 5. Bugs Detectados

| ID | Módulo | Severidad | Descripción | Estado |
|---|---|---|---|---|
| BUG-001 | Escaneo IA | 🔴 Alta | Sin conexión a internet, el error no se comunica claramente al usuario. Solo aparece un error genérico en consola | Abierto |
| BUG-002 | Accesibilidad | 🟡 Media | El toggle "Texto grande" guarda el valor pero no aplica el cambio visual en tiempo real en todas las pantallas | Abierto |
| BUG-003 | Progreso | 🟡 Media | La gráfica semanal muestra grasas en el eje Y, no calorías. El título dice "Actividad Semanal" pero no queda claro qué macro representa | Abierto |
| BUG-004 | Perfil | 🟢 Baja | El campo "Objetivo" en Perfil está hardcodeado como "Bajar de peso" para todos los usuarios, no refleja el objetivo real del usuario | Abierto |
| BUG-005 | Perfil | 🟢 Baja | La "Racha" en Perfil está hardcodeada como "12 Días", no se calcula dinámicamente | Abierto |

---

## 6. Funcionalidades No Implementadas (detectadas en pruebas)

| Funcionalidad | Pantalla | Observación |
|---|---|---|
| Login con Google / Apple / Facebook | LoginScreen | Botones visibles en UI pero sin funcionalidad |
| Botón "VER MÁS" en gráfica semanal | ExploreScreen | Sin acción al presionar |
| Racha dinámica | ProfileScreen | Valor hardcodeado |
| Objetivo personalizado | ProfileScreen | Valor hardcodeado |

---

## 7. Validación del Flujo Principal

```
✅ Welcome → Register → Dashboard       (flujo nuevo usuario)
✅ Welcome → Login → Dashboard          (flujo usuario existente)
✅ Dashboard → Escanear → Guardar       (flujo core de la app)
✅ Dashboard → Progreso → Perfil        (navegación entre tabs)
✅ Perfil → Editar → Guardar            (actualización de datos)
✅ Perfil → Logout → Login              (cierre de sesión)
✅ Login → Forgot Password → Login      (recuperación de cuenta)
```

---

## 8. Conclusión

El sistema es **estable en sus flujos principales**. La autenticación local con SQLite funciona correctamente en todos los escenarios probados. El módulo de escaneo con IA (Gemini `v1/gemini-2.5-flash`) opera correctamente una vez corregido el endpoint de la API.

Los bugs detectados son en su mayoría de **severidad baja/media** y no bloquean el uso de la app. El BUG-001 (manejo de error sin conexión) es el único de severidad alta y se recomienda atenderlo en el siguiente sprint.

---

*Reporte generado por el rol QA/Tester — Sprint 3 — NutriVision AI*
