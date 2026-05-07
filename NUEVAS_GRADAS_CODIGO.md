# Código Completo para Gradas Nuevas Estilo F1

## Instrucciones
Reemplazar COMPLETAMENTE las funciones `buildGrandstands()` y `buildDetailedGrandstand()` en `src/game/track.ts` con el código de abajo.

## Código a Reemplazar

```typescript
  /**
   * Gradas estilo F1 profesional - DISEÑO COMPLETAMENTE NUEVO
   * Inspiradas en circuitos como Hockenheim, México, Silverstone
   * Gradas MASIVAS por todo el circuito, especialmente en la META
   */
  private buildGrandstands(): void {
    // ══════════════════════════════════════════════════════════
    // ZONA DE META - GRADAS MASIVAS TIPO TÚNEL/BIENVENIDA
    // ══════════════════════════════════════════════════════════
    
    // Grada PRINCIPAL IZQUIERDA - Masiva con techo curvo
    this.buildModernGrandstand({
      x: -35, z: -50, yaw: Math.PI * 0.5,
      width: 150, tiers: 20, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: true, vipSection: true
    });
    
    // Grada PRINCIPAL DERECHA - Masiva con techo curvo
    this.buildModernGrandstand({
      x: 35, z: -50, yaw: Math.PI * 1.5,
      width: 150, tiers: 20, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: true, vipSection: true
    });
    
    // Grada ENTRADA META (detrás) - Efecto túnel
    this.buildModernGrandstand({
      x: 0, z: 20, yaw: Math.PI,
      width: 100, tiers: 12, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    // ══════════════════════════════════════════════════════════
    // RECTA PRINCIPAL - Gradas continuas
    // ══════════════════════════════════════════════════════════
    
    // Lado IZQUIERDO recta principal
    this.buildModernGrandstand({
      x: -35, z: -150, yaw: Math.PI * 0.5,
      width: 100, tiers: 15, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    this.buildModernGrandstand({
      x: -35, z: -250, yaw: Math.PI * 0.5,
      width: 80, tiers: 12, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    // Lado DERECHO recta principal
    this.buildModernGrandstand({
      x: 35, z: -150, yaw: Math.PI * 1.5,
      width: 100, tiers: 15, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    this.buildModernGrandstand({
      x: 35, z: -250, yaw: Math.PI * 1.5,
      width: 80, tiers: 12, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    // ══════════════════════════════════════════════════════════
    // SECTOR ESTE - Curvas rápidas
    // ══════════════════════════════════════════════════════════
    
    this.buildModernGrandstand({
      x: 380, z: -380, yaw: Math.PI * 1.25,
      width: 90, tiers: 14, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    this.buildModernGrandstand({
      x: 450, z: -250, yaw: Math.PI * 1.15,
      width: 70, tiers: 12, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    this.buildModernGrandstand({
      x: 470, z: -100, yaw: Math.PI * 1.0,
      width: 80, tiers: 12, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    // ══════════════════════════════════════════════════════════
    // RECTA TRASERA - Gradas largas
    // ══════════════════════════════════════════════════════════
    
    this.buildModernGrandstand({
      x: 250, z: 200, yaw: Math.PI * 1.5,
      width: 120, tiers: 16, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: true, vipSection: true
    });
    
    this.buildModernGrandstand({
      x: 50, z: 200, yaw: Math.PI * 1.5,
      width: 100, tiers: 14, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    this.buildModernGrandstand({
      x: -150, z: 200, yaw: Math.PI * 1.5,
      width: 100, tiers: 14, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    this.buildModernGrandstand({
      x: -350, z: 180, yaw: Math.PI * 1.6,
      width: 90, tiers: 12, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    // ══════════════════════════════════════════════════════════
    // SECTOR OESTE - Curvas técnicas
    // ══════════════════════════════════════════════════════════
    
    this.buildModernGrandstand({
      x: -470, z: 50, yaw: Math.PI * 0.1,
      width: 80, tiers: 12, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    this.buildModernGrandstand({
      x: -460, z: -100, yaw: Math.PI * 0.2,
      width: 70, tiers: 12, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    this.buildModernGrandstand({
      x: -420, z: -250, yaw: Math.PI * 0.35,
      width: 85, tiers: 14, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
    
    // ══════════════════════════════════════════════════════════
    // SECTOR FINAL - Regreso a meta
    // ══════════════════════════════════════════════════════════
    
    this.buildModernGrandstand({
      x: -150, z: -380, yaw: Math.PI * 0.45,
      width: 75, tiers: 12, tierHeight: 0.7, tierDepth: 1.0,
      hasRoof: true, roofCurved: false, vipSection: false
    });
  }

  /**
   * Construye una grada moderna estilo F1 con diseño profesional
   */
  private buildModernGrandstand(config: {
    x: number; z: number; yaw: number;
    width: number; tiers: number; tierHeight: number; tierDepth: number;
    hasRoof: boolean; roofCurved: boolean; vipSection: boolean;
  }): void {
    const { x, z, yaw, width, tiers, tierHeight, tierDepth, hasRoof, roofCurved, vipSection } = config;
    const position = new Vector3(x, 0, z);
    const totalHeight = tiers * tierHeight;
    const totalDepth = tiers * tierDepth;

    // ══════════════════════════════════════════════════════════
    // MATERIALES MODERNOS
    // ══════════════════════════════════════════════════════════
    
    // Estructura de acero moderna
    const matSteel = new PBRMaterial(`steel_${x}_${z}`, this.scene);
    matSteel.albedoColor = new Color3(0.25, 0.27, 0.30); // Gris oscuro moderno
    matSteel.metallic = 0.90;
    matSteel.roughness = 0.25;
    
    // Asientos rojos brillantes
    const matSeats = new PBRMaterial(`seats_${x}_${z}`, this.scene);
    matSeats.albedoColor = new Color3(0.90, 0.08, 0.05);
    matSeats.metallic = 0.0;
    matSeats.roughness = 0.55;
    matSeats.emissiveColor = new Color3(0.10, 0.01, 0.0);
    
    // Asientos VIP (negros premium)
    const matVIP = new PBRMaterial(`vip_${x}_${z}`, this.scene);
    matVIP.albedoColor = new Color3(0.08, 0.08, 0.10);
    matVIP.metallic = 0.15;
    matVIP.roughness = 0.40;
    
    // Concreto moderno
    const matConcrete = new PBRMaterial(`concrete_${x}_${z}`, this.scene);
    matConcrete.albedoColor = new Color3(0.45, 0.47, 0.50);
    matConcrete.metallic = 0.0;
    matConcrete.roughness = 0.85;
    
    // Vidrio para sección VIP
    const matGlass = new PBRMaterial(`glass_${x}_${z}`, this.scene);
    matGlass.albedoColor = new Color3(0.7, 0.8, 0.9);
    matGlass.metallic = 0.0;
    matGlass.roughness = 0.1;
    matGlass.alpha = 0.3;

    // ══════════════════════════════════════════════════════════
    // ESTRUCTURA PRINCIPAL - Columnas masivas
    // ══════════════════════════════════════════════════════════
    const columnMeshes: Mesh[] = [];
    const numColumns = Math.floor(width / 8) + 1;
    
    for (let i = 0; i < numColumns; i++) {
      const colX = (i / (numColumns - 1) - 0.5) * width;
      
      // Columna principal gruesa
      const col = MeshBuilder.CreateBox(`col_${x}_${z}_${i}`, 
        { width: 0.8, height: totalHeight + 2, depth: 0.8 }, this.scene);
      
      const localPos = new Vector3(colX, (totalHeight + 2) / 2, -totalDepth - 1);
      const rotated = this.rotatePoint(localPos, yaw);
      col.position.copyFrom(position.add(rotated));
      col.rotation.y = yaw;
      columnMeshes.push(col);
      
      // Vigas horizontales cada 4 tiers
      for (let t = 4; t < tiers; t += 4) {
        if (i < numColumns - 1) {
          const beamHeight = t * tierHeight;
          const beam = MeshBuilder.CreateBox(`beam_${x}_${z}_${i}_${t}`, 
            { width: 8, height: 0.4, depth: 0.4 }, this.scene);
          
          const beamPos = new Vector3(colX + 4, beamHeight, -totalDepth - 1);
          const beamRotated = this.rotatePoint(beamPos, yaw);
          beam.position.copyFrom(position.add(beamRotated));
          beam.rotation.y = yaw;
          columnMeshes.push(beam);
        }
      }
    }
    
    const columnsMerged = Mesh.MergeMeshes(columnMeshes, true, true);
    if (columnsMerged) {
      columnsMerged.material = matSteel;
      columnsMerged.receiveShadows = true;
    }

    // ══════════════════════════════════════════════════════════
    // ESCALONES CON ASIENTOS
    // ══════════════════════════════════════════════════════════
    const concreteMeshes: Mesh[] = [];
    const seatMeshes: Mesh[] = [];
    const vipMeshes: Mesh[] = [];
    
    for (let tier = 0; tier < tiers; tier++) {
      const tierY = tier * tierHeight;
      const tierZ = -tier * tierDepth;
      
      // Determinar si es sección VIP (primeras 3 filas si vipSection = true)
      const isVIP = vipSection && tier < 3;
      
      // Base de concreto
      const concrete = MeshBuilder.CreateBox(`concrete_${x}_${z}_${tier}`, 
        { width: width, height: tierHeight * 0.5, depth: tierDepth }, this.scene);
      
      const concretePos = new Vector3(0, tierY + tierHeight * 0.25, tierZ);
      const concreteRotated = this.rotatePoint(concretePos, yaw);
      concrete.position.copyFrom(position.add(concreteRotated));
      concrete.rotation.y = yaw;
      concreteMeshes.push(concrete);
      
      // Asientos individuales
      const numSeats = Math.floor(width / 0.55);
      for (let s = 0; s < numSeats; s++) {
        const seatX = (s / (numSeats - 1) - 0.5) * (width - 1);
        
        // Asiento con respaldo
        const seat = MeshBuilder.CreateBox(`seat_${x}_${z}_${tier}_${s}`, 
          { width: 0.48, height: 0.45, depth: 0.45 }, this.scene);
        
        const seatPos = new Vector3(seatX, tierY + tierHeight * 0.75, tierZ + tierDepth * 0.2);
        const seatRotated = this.rotatePoint(seatPos, yaw);
        seat.position.copyFrom(position.add(seatRotated));
        seat.rotation.y = yaw;
        
        if (isVIP) {
          vipMeshes.push(seat);
        } else {
          seatMeshes.push(seat);
        }
      }
      
      // Pasillos cada 10 filas
      if (tier % 10 === 0 && tier > 0) {
        const aisle = MeshBuilder.CreateBox(`aisle_${x}_${z}_${tier}`, 
          { width: width, height: 0.05, depth: 1.5 }, this.scene);
        
        const aislePos = new Vector3(0, tierY, tierZ - 0.75);
        const aisleRotated = this.rotatePoint(aislePos, yaw);
        aisle.position.copyFrom(position.add(aisleRotated));
        aisle.rotation.y = yaw;
        concreteMeshes.push(aisle);
      }
    }
    
    const concreteMerged = Mesh.MergeMeshes(concreteMeshes, true, true);
    if (concreteMerged) {
      concreteMerged.material = matConcrete;
      concreteMerged.receiveShadows = true;
    }
    
    const seatsMerged = Mesh.MergeMeshes(seatMeshes, true, true);
    if (seatsMerged) {
      seatsMerged.material = matSeats;
      seatsMerged.receiveShadows = true;
    }
    
    if (vipMeshes.length > 0) {
      const vipMerged = Mesh.MergeMeshes(vipMeshes, true, true);
      if (vipMerged) {
        vipMerged.material = matVIP;
        vipMerged.receiveShadows = true;
      }
    }

    // ══════════════════════════════════════════════════════════
    // SECCIÓN VIP CON VIDRIO
    // ══════════════════════════════════════════════════════════
    if (vipSection) {
      const vipGlass = MeshBuilder.CreateBox(`vipglass_${x}_${z}`, 
        { width: width * 0.8, height: 3, depth: 0.1 }, this.scene);
      
      const glassPos = new Vector3(0, 2.5, 2);
      const glassRotated = this.rotatePoint(glassPos, yaw);
      vipGlass.position.copyFrom(position.add(glassRotated));
      vipGlass.rotation.y = yaw;
      vipGlass.material = matGlass;
    }

    // ══════════════════════════════════════════════════════════
    // TECHO MODERNO
    // ══════════════════════════════════════════════════════════
    if (hasRoof) {
      const roofHeight = totalHeight + 4;
      const roofWidth = width + 4;
      const roofDepth = totalDepth + 6;
      
      if (roofCurved) {
        // Techo curvo tipo estadio moderno
        const roof = MeshBuilder.CreateCylinder(`roof_${x}_${z}`, 
          { height: roofWidth, diameter: roofDepth * 1.5, arc: 0.5, tessellation: 24 }, this.scene);
        
        const roofPos = new Vector3(0, roofHeight, -totalDepth * 0.5);
        const roofRotated = this.rotatePoint(roofPos, yaw);
        roof.position.copyFrom(position.add(roofRotated));
        roof.rotation.y = yaw;
        roof.rotation.z = Math.PI * 0.5;
        roof.material = matSteel;
        roof.receiveShadows = true;
      } else {
        // Techo plano inclinado
        const roof = MeshBuilder.CreateBox(`roof_${x}_${z}`, 
          { width: roofWidth, height: 0.3, depth: roofDepth }, this.scene);
        
        const roofPos = new Vector3(0, roofHeight, -totalDepth * 0.5);
        const roofRotated = this.rotatePoint(roofPos, yaw);
        roof.position.copyFrom(position.add(roofRotated));
        roof.rotation.y = yaw;
        roof.rotation.x = -Math.PI * 0.08;
        roof.material = matSteel;
        roof.receiveShadows = true;
      }
      
      // Soportes del techo
      const roofSupports: Mesh[] = [];
      for (let i = 0; i < 6; i++) {
        const supX = (i / 5 - 0.5) * width;
        
        const support = MeshBuilder.CreateBox(`roofsup_${x}_${z}_${i}`, 
          { width: 0.6, height: 4, depth: 0.6 }, this.scene);
        
        const supPos = new Vector3(supX, totalHeight + 2, -totalDepth - 2);
        const supRotated = this.rotatePoint(supPos, yaw);
        support.position.copyFrom(position.add(supRotated));
        support.rotation.y = yaw;
        roofSupports.push(support);
      }
      
      const supMerged = Mesh.MergeMeshes(roofSupports, true, true);
      if (supMerged) {
        supMerged.material = matSteel;
        supMerged.receiveShadows = true;
      }
    }

    // ══════════════════════════════════════════════════════════
    // PANELES PUBLICITARIOS LED
    // ══════════════════════════════════════════════════════════
    const adPanel = MeshBuilder.CreateBox(`ad_${x}_${z}`, 
      { width: width * 0.9, height: 2.5, depth: 0.15 }, this.scene);
    
    const adPos = new Vector3(0, 1.5, 1);
    const adRotated = this.rotatePoint(adPos, yaw);
    adPanel.position.copyFrom(position.add(adRotated));
    adPanel.rotation.y = yaw;
    
    const matAd = new StandardMaterial(`ad_${x}_${z}`, this.scene);
    matAd.diffuseColor = new Color3(0.1, 0.1, 0.15);
    matAd.emissiveColor = new Color3(0.15, 0.15, 0.20);
    adPanel.material = matAd;
  }
```

## Pasos para Implementar

1. Abrir `src/game/track.ts`
2. Buscar la función `private buildGrandstands()` (línea ~395)
3. ELIMINAR completamente `buildGrandstands()` y `buildDetailedGrandstand()` 
4. PEGAR el código de arriba en su lugar
5. Guardar y compilar con `npm run build`

## Características de las Nuevas Gradas

- ✅ **19 gradas** por todo el circuito
- ✅ **Zona de META**: 7 gradas masivas (efecto túnel/bienvenida)
- ✅ Techos curvos estilo estadio moderno
- ✅ Secciones VIP con asientos negros y vidrio
- ✅ Asientos rojos brillantes
- ✅ Estructura de acero gris oscuro moderna
- ✅ Pasillos cada 10 filas
- ✅ Paneles publicitarios LED
- ✅ Columnas masivas (0.8m) con vigas horizontales
- ✅ Optimizado con meshes merged
