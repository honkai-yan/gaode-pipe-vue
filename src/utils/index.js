import { appRuntime } from "@/runtime/appRuntime";

/**
 * 经纬度转容器像素坐标
 * @param {Array} lnglat 经纬度坐标
 * @returns 指定经纬度在地图容器中的像素坐标
 */
export function lnglat2contaner(lnglat) {
  if (!appRuntime.mapInstance) {
    console.error("地图对象无效");
    return [];
  }
  return appRuntime.mapInstance.lngLatToContainer(lnglat);
}

/**
 * 容器像素坐标转经纬度
 * @param {Array} containerPos 容器像素坐标
 * @returns 指定容器像素坐标对应的经纬度
 */
export function container2lnglat(containerPos) {
  if (!appRuntime.mapInstance) {
    console.error("地图对象无效");
    return [];
  }
  return appRuntime.mapInstance.containerToLngLat(containerPos);
}

/**
 * 判断两个经纬度是否相等，数据格式为：[lng, lat]或{lng, lat}
 * @param {Array | Object} lnglat1 第一个经纬度
 * @param {Array | Object} lnglat2 第二个经纬度
 * @returns
 */
export function SameLnglat(lnglat1, lnglat2) {
  if (Array.isArray(lnglat1) && Array.isArray(lnglat2))
    return lnglat1[0] === lnglat2[0] && lnglat1[1] === lnglat2[1];
  return lnglat1.lng === lnglat2.lng && lnglat1.lat === lnglat2.lat;
}

/**
 * 计算两个像素坐标之间的距离
 * @param {Array | Object} pos1 像素位置1
 * @param {Array | Object} pos2 像素位置2
 * @returns 两个像素坐标之间的直线距离
 */
export function pixelPosDistance(pos1, pos2) {
  let dx, dy;
  if (Array.isArray(pos1) && Array.isArray(pos2)) {
    dx = pos1[0] - pos2[0];
    dy = pos1[1] - pos2[1];
  } else {
    dx = pos1.x - pos2.x;
    dy = pos1.y - pos2.y;
  }
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 从线段数组中收集所有独立端点坐标，独立端点指的是在所有线段的端点中，去重后的坐标集合
 * @param {Array} lines 每条线段的两个端点组成的数组，每个端点是经纬度坐标数组，示例：[[[100,104], [102,100]], [[102,100], [99,108]]]
 */
export function collectEndpoints(lines) {
  // 扁平化数组并去重，将所有重复端点全部删除
  const flatted = [];
  lines.forEach((val) => {
    flatted.push(val[0]);
    flatted.push(val[1]);
  });
  const uniqueEndpoints = flatted.filter((val) => {
    const count = flatted.reduce(
      (total, cur) => (SameLnglat(cur, val) ? total + 1 : total),
      0,
    );
    return count === 1;
  });
  return uniqueEndpoints;
}
