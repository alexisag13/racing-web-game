# Gradas Mejoradas - Detalladas y Realistas

## ✅ Mejoras Implementadas

Las gradas ahora son **MUCHO MÁS DETALLADAS Y REALISTAS**, similares a las de circuitos profesionales como Monza, Spa-Francorchamps o Silverstone.

## 🏟️ Características de las Gradas Mejoradas

### 1. **Estructura Metálica Completa**
- **Columnas principales** de acero (0.5m × 0.5m)
  - Material PBR metálico (metallic: 0.85, roughness: 0.35)
  - Color gris acero realista
  - Reciben sombras para mayor realismo

- **Vigas diagonales de soporte**
  - Cada 3 columnas para estabilidad visual
  - Inclinación de 15° para efecto estructural
  - Refuerzan la apariencia de construcción real

### 2. **Escalones Detallados (Tiers)**
- **Base de concreto** en cada escalón
  - Material PBR concreto (roughness: 0.90)
  - Color gris concreto realista
  - 60% de la altura del tier

- **Asientos individuales**
  - Simulados con boxes pequeños (0.5m × 0.4m × 0.5m)
  - Material plástico azul (Color3(0.12, 0.35, 0.80))
  - Espaciados cada 0.6m
  - Posicionados en la parte superior de cada escalón

### 3. **Barandillas de Seguridad**
- **Barandillas horizontales**
  - En la parte superior y cada 4 filas
  - Material metálico brillante (metallic: 0.75, roughness: 0.25)
  - 0.15m de altura × 0.08m de profundidad

- **Postes verticales**
  - Cada 4 metros a lo largo de la grada
  - 1 metro de altura
  - Conectan con las barandillas horizontales

### 4. **Techo/Cubierta Metálica**
- **Estructura del techo**
  - Cubre toda la grada + 2m extra
  - Ligera inclinación (5°) para drenaje de lluvia
  - Material acero con acabado metálico

- **Soportes verticales del techo**
  - 4 vigas principales (0.4m × 3m × 0.4m)
  - Posicionadas detrás de la grada
  - Elevan el techo 3m sobre la última fila

### 5. **Paneles Publicitarios**
- **Panel frontal**
  - 80% del ancho de la grada
  - 2m de altura × 0.1m de profundidad
  - Color blanco con emisión sutil
  - Posicionado en la parte frontal

## 📍 Ubicaciones Estratégicas (Ajustadas a la Pista Nueva)

### 1. **Grada Principal - Zona de Meta**
- **Posición**: x: -40, z: -80
- **Orientación**: Mirando hacia la recta principal
- **Dimensiones**: 80m de ancho × 12 tiers
- **Capacidad visual**: ~960 asientos
- **Vista**: Línea de meta y recta principal completa

### 2. **Grada Este - Curva Rápida**
- **Posición**: x: 420, z: -320
- **Orientación**: Exterior de la curva rápida
- **Dimensiones**: 50m de ancho × 8 tiers
- **Capacidad visual**: ~500 asientos
- **Vista**: Sector de curvas rápidas estilo Eau Rouge

### 3. **Grada Recta Trasera Norte**
- **Posición**: x: 150, z: 210
- **Orientación**: Lado norte de la recta trasera
- **Dimensiones**: 60m de ancho × 10 tiers
- **Capacidad visual**: ~750 asientos
- **Vista**: Recta trasera larga (~1.5 km)

### 4. **Grada Recta Trasera Sur**
- **Posición**: x: -150, z: 210
- **Orientación**: Lado sur de la recta trasera
- **Dimensiones**: 60m de ancho × 10 tiers
- **Capacidad visual**: ~750 asientos
- **Vista**: Recta trasera desde ángulo complementario

### 5. **Grada Oeste - Sector Técnico**
- **Posición**: x: -430, z: -180
- **Orientación**: Exterior de curvas técnicas
- **Dimensiones**: 45m de ancho × 8 tiers
- **Capacidad visual**: ~450 asientos
- **Vista**: Sector técnico con esses y horquilla

## 🎨 Materiales PBR Realistas

### Acero Estructural
```typescript
albedoColor: Color3(0.70, 0.72, 0.75)
metallic: 0.85
roughness: 0.35
```

### Asientos (Plástico Azul)
```typescript
albedoColor: Color3(0.12, 0.35, 0.80)
metallic: 0.0
roughness: 0.65
```

### Concreto
```typescript
albedoColor: Color3(0.55, 0.55, 0.58)
metallic: 0.0
roughness: 0.90
```

### Barandillas (Acero Inoxidable)
```typescript
albedoColor: Color3(0.85, 0.85, 0.88)
metallic: 0.75
roughness: 0.25
```

## 📊 Detalles Técnicos

### Dimensiones por Grada
- **Tier Height**: 0.8m (altura de cada escalón)
- **Tier Depth**: 1.2m (profundidad de cada escalón)
- **Columnas**: Espaciadas cada 6m
- **Asientos**: Espaciados cada 0.6m
- **Barandillas**: Cada 4 filas + parte superior

### Optimización
- ✅ **Columnas merged** en un solo mesh por grada
- ✅ **Escalones de concreto merged** en un solo mesh
- ✅ **Asientos merged** en un solo mesh
- ✅ **Barandillas merged** en un solo mesh
- ✅ **Soportes del techo merged** en un solo mesh
- **Total**: ~6-7 meshes por grada (muy optimizado)

### Capacidad Total del Circuito
- Grada Principal: ~960 asientos
- Grada Este: ~500 asientos
- Grada Norte: ~750 asientos
- Grada Sur: ~750 asientos
- Grada Oeste: ~450 asientos
- **TOTAL**: ~3,410 asientos visuales

## 🎯 Comparación: Antes vs Ahora

### Antes (Gradas Simples)
- ❌ Solo boxes simples para asientos
- ❌ Columnas básicas sin detalles
- ❌ Techo plano sin soportes
- ❌ Sin barandillas
- ❌ Sin estructura de concreto
- ❌ Sin asientos individuales

### Ahora (Gradas Detalladas)
- ✅ Estructura metálica completa con vigas diagonales
- ✅ Base de concreto en cada escalón
- ✅ Asientos individuales simulados
- ✅ Barandillas de seguridad cada 4 filas
- ✅ Techo con soportes verticales e inclinación
- ✅ Paneles publicitarios frontales
- ✅ Materiales PBR realistas
- ✅ Sombras y reflejos correctos

## 🚀 Resultado Visual

Las gradas ahora se ven como **tribunas profesionales de F1/MotoGP**:
- Estructura metálica visible y realista
- Escalones de concreto con asientos azules
- Barandillas de seguridad brillantes
- Techo metálico con soportes
- Paneles publicitarios en la base
- Sombras dinámicas que realzan la profundidad
- Ubicadas estratégicamente sin bloquear la pista

## 📁 Archivo Modificado
- `src/game/track.ts`
  - Función `buildGrandstands()` completamente reescrita
  - Nueva función `buildDetailedGrandstand()` con todos los detalles
  - Función `rotatePoint()` para posicionamiento correcto

## 🎮 Cómo Probar
```bash
npm run dev
```

Las gradas ahora son mucho más impresionantes y realistas, similares a las de circuitos profesionales reales.
