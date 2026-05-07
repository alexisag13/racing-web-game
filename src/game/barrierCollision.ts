/**
 * Coche aproximado como disco en XZ frente a barreras tipo caja orientada (arcade).
 */

export type OrientedBoxCollider = {
  readonly cx: number;
  readonly cz: number;
  readonly yaw: number;
  readonly halfW: number;
  readonly halfD: number;
};

export function depenetrateCircleOBB(
  px: number,
  pz: number,
  radius: number,
  box: OrientedBoxCollider,
): { x: number; z: number; nx: number; nz: number } | null {
  const dx = px - box.cx;
  const dz = pz - box.cz;
  const yaw = box.yaw;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const lx = cos * dx + sin * dz;
  const lz = -sin * dx + cos * dz;

  const hw = box.halfW;
  const hd = box.halfD;

  const inside = lx >= -hw && lx <= hw && lz >= -hd && lz <= hd;

  if (inside) {
    const dLeft = lx + hw;
    const dRight = hw - lx;
    const dBot = lz + hd;
    const dTop = hd - lz;
    const m = Math.min(dLeft, dRight, dBot, dTop);
    if (m >= radius - 1e-5) {
      return null;
    }
    let nxLoc = 0;
    let nzLoc = 0;
    if (m === dLeft) {
      nxLoc = -1;
      nzLoc = 0;
    } else if (m === dRight) {
      nxLoc = 1;
      nzLoc = 0;
    } else if (m === dBot) {
      nxLoc = 0;
      nzLoc = -1;
    } else {
      nxLoc = 0;
      nzLoc = 1;
    }
    const push = radius - m + 0.035;
    const wx = cos * nxLoc - sin * nzLoc;
    const wz = sin * nxLoc + cos * nzLoc;
    return {
      x: px + wx * push,
      z: pz + wz * push,
      nx: wx,
      nz: wz,
    };
  }

  const qx = Math.max(-hw, Math.min(hw, lx));
  const qz = Math.max(-hd, Math.min(hd, lz));
  const dlx = lx - qx;
  const dlz = lz - qz;
  const dist = Math.hypot(dlx, dlz);
  if (dist >= radius - 1e-5 || dist < 1e-10) {
    return null;
  }
  const push = radius - dist + 0.035;
  const nlx = dlx / dist;
  const nlz = dlz / dist;
  const wx = cos * nlx - sin * nlz;
  const wz = sin * nlx + cos * nlz;
  return {
    x: px + wx * push,
    z: pz + wz * push,
    nx: wx,
    nz: wz,
  };
}
