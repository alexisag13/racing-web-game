# 📤 Cómo Subir a GitHub

## Paso 1: Crear Repositorio en GitHub

1. Ve a https://github.com
2. Inicia sesión (o crea una cuenta si no tienes)
3. Haz clic en el botón **"+"** arriba a la derecha
4. Selecciona **"New repository"**
5. Configura:
   - **Repository name**: `racing-web-game` (o el nombre que quieras)
   - **Description**: "Juego de carreras 3D multijugador con Babylon.js"
   - **Public** o **Private** (como prefieras)
   - **NO** marques "Initialize this repository with a README" (ya tienes uno)
6. Haz clic en **"Create repository"**

## Paso 2: Conectar tu Repositorio Local

Después de crear el repositorio, GitHub te mostrará una página con comandos. Copia la URL que aparece (algo como `https://github.com/TU-USUARIO/racing-web-game.git`).

Luego ejecuta estos comandos en tu terminal (PowerShell):

```powershell
# Agregar el repositorio remoto (reemplaza con TU URL)
git remote add origin https://github.com/TU-USUARIO/racing-web-game.git

# Subir todo a GitHub
git push -u origin main
```

## Paso 3: Invitar a tu Amigo

1. Ve a tu repositorio en GitHub
2. Haz clic en **"Settings"** (arriba a la derecha)
3. En el menú izquierdo, haz clic en **"Collaborators"**
4. Haz clic en **"Add people"**
5. Escribe el nombre de usuario de GitHub de tu amigo
6. Haz clic en **"Add [nombre] to this repository"**
7. Tu amigo recibirá un email de invitación

## Paso 4: Tu Amigo Clona el Repositorio

Tu amigo debe ejecutar:

```bash
# Clonar el repositorio
git clone https://github.com/TU-USUARIO/racing-web-game.git

# Entrar a la carpeta
cd racing-web-game

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

## 🔄 Flujo de Trabajo Colaborativo

### Cuando TÚ hagas cambios:

```powershell
# Ver qué archivos cambiaron
git status

# Agregar todos los cambios
git add .

# Hacer commit con mensaje descriptivo
git commit -m "Descripción de lo que hiciste"

# Subir a GitHub
git push
```

### Cuando tu AMIGO haga cambios:

Él hará lo mismo:
```bash
git add .
git commit -m "Su descripción"
git push
```

### Cuando quieras BAJAR los cambios de tu amigo:

```powershell
# Bajar los últimos cambios
git pull
```

## ⚠️ Consejos Importantes

1. **Siempre haz `git pull` ANTES de empezar a trabajar** para tener la última versión
2. **Haz commits frecuentes** con mensajes claros
3. **Comunícate con tu amigo** para no trabajar en los mismos archivos al mismo tiempo
4. Si hay conflictos, Git te avisará y tendrás que resolverlos manualmente

## 🆘 Comandos Útiles

```powershell
# Ver el historial de commits
git log --oneline

# Ver qué cambió en un archivo
git diff nombre-archivo.ts

# Deshacer cambios locales (antes de commit)
git restore nombre-archivo.ts

# Ver el estado actual
git status

# Ver los repositorios remotos configurados
git remote -v
```

## 📝 Ejemplo de Sesión de Trabajo

```powershell
# 1. Bajar últimos cambios
git pull

# 2. Trabajar en tu código...
# (editar archivos, probar, etc.)

# 3. Ver qué cambiaste
git status

# 4. Agregar cambios
git add .

# 5. Hacer commit
git commit -m "Arreglé las gradas y agregué más árboles"

# 6. Subir a GitHub
git push

# 7. Avisar a tu amigo que subiste cambios
```

## 🎯 Para las Gradas

Cuando tu amigo arregle las gradas, él hará:

```bash
# Editar src/game/track.ts
# Probar con npm run dev
git add src/game/track.ts
git commit -m "Rediseñé las gradas estilo F1"
git push
```

Y tú bajarás sus cambios con:
```powershell
git pull
```

¡Listo! Ahora pueden trabajar juntos en el proyecto. 🚀
