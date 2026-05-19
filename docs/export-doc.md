# 导出 JSON 字段说明

当前导出文件为 JSON 格式，文件名类似 `pipe-lines-2026-04-27T12-34-56-789Z.json`。

导出结果顶层包含 2 个字段：

- `coordinateSystem`
- `segments`

## JSON 示例

```json
{
	"coordinateSystem": {
		"unit": "meter",
		"provider": "AMap JSAPI",
		"method": "AMap.LngLat.distance axis projection",
		"originLngLat": {
			"lng": 116.397428,
			"lat": 39.90923
		},
		"originLogical": {
			"x": 0,
			"y": 0
		},
		"axis": {
			"x": "east",
			"y": "north"
		}
	},
	"segments": [
		{
			"id": 1,
			"startLngLat": {
				"lng": 116.397428,
				"lat": 39.90923
			},
			"endLngLat": {
				"lng": 116.397528,
				"lat": 39.90933
			},
			"start": {
				"x": 0,
				"y": 0
			},
			"end": {
				"x": 8.532,
				"y": 11.124
			},
			"length": 14.018,
			"angleDeg": 52.51,
			"customData": [
				{ "key": "材质", "value": "PVC" },
				{ "key": "直径", "value": "100mm" }
			]
		}
	]
}
```

## 顶层字段

### `coordinateSystem`

描述本次导出所使用的逻辑坐标系定义。

#### `coordinateSystem.unit`

- 类型：`string`
- 当前固定值：`"meter"`
- 含义：逻辑坐标的长度单位是米。

#### `coordinateSystem.provider`

- 类型：`string`
- 当前固定值：`"AMap JSAPI"`
- 含义：逻辑坐标转换过程中使用的地图能力提供方。

#### `coordinateSystem.method`

- 类型：`string`
- 当前固定值：`"AMap.LngLat.distance axis projection"`
- 含义：坐标转换方法说明。
- 说明：表示先以基准点建立局部东-北坐标系，再使用高德 `AMap.LngLat.distance()` 计算目标点在东西方向和南北方向上的投影距离。

#### `coordinateSystem.originLngLat`

- 类型：`object`
- 含义：逻辑坐标系原点对应的经纬度坐标。
- 说明：当前实现中，原点取第一条线段起点的经纬度。

##### `coordinateSystem.originLngLat.lng`

- 类型：`number`
- 含义：原点经度。
- 坐标系：GCJ-02（高德地图经纬度坐标系）。

##### `coordinateSystem.originLngLat.lat`

- 类型：`number`
- 含义：原点纬度。
- 坐标系：GCJ-02（高德地图经纬度坐标系）。

#### `coordinateSystem.originLogical`

- 类型：`object`
- 含义：逻辑坐标系原点的逻辑坐标值。
- 说明：根据需求，该值固定为 `(0, 0)`。

##### `coordinateSystem.originLogical.x`

- 类型：`number`
- 当前固定值：`0`
- 含义：原点的逻辑 x 坐标。

##### `coordinateSystem.originLogical.y`

- 类型：`number`
- 当前固定值：`0`
- 含义：原点的逻辑 y 坐标。

#### `coordinateSystem.axis`

- 类型：`object`
- 含义：逻辑坐标轴方向定义。

##### `coordinateSystem.axis.x`

- 类型：`string`
- 当前固定值：`"east"`
- 含义：逻辑坐标系的 x 轴正方向为正东。

##### `coordinateSystem.axis.y`

- 类型：`string`
- 当前固定值：`"north"`
- 含义：逻辑坐标系的 y 轴正方向为正北。

### `segments`

- 类型：`array`
- 含义：已绘制线段列表。
- 说明：数组中每一项表示一条独立线段，顺序与用户绘制完成的顺序一致。

## 线段字段

`segments` 数组中的每一项都具有以下字段。

### `segments[].id`

- 类型：`number`
- 含义：线段序号，从 `1` 开始递增。
- 说明：仅用于导出结果中的顺序标识，不代表数据库主键。

### `segments[].startLngLat`

- 类型：`object`
- 含义：线段起点的原始经纬度。

#### `segments[].startLngLat.lng`

- 类型：`number`
- 含义：起点经度。
- 坐标系：GCJ-02。

#### `segments[].startLngLat.lat`

- 类型：`number`
- 含义：起点纬度。
- 坐标系：GCJ-02。

### `segments[].endLngLat`

- 类型：`object`
- 含义：线段终点的原始经纬度。

#### `segments[].endLngLat.lng`

- 类型：`number`
- 含义：终点经度。
- 坐标系：GCJ-02。

#### `segments[].endLngLat.lat`

- 类型：`number`
- 含义：终点纬度。
- 坐标系：GCJ-02。

### `segments[].start`

- 类型：`object`
- 含义：线段起点的逻辑坐标。
- 单位：米。

#### `segments[].start.x`

- 类型：`number`
- 含义：起点逻辑 x 坐标。
- 方向：向东为正，向西为负。

#### `segments[].start.y`

- 类型：`number`
- 含义：起点逻辑 y 坐标。
- 方向：向北为正，向南为负。

### `segments[].end`

- 类型：`object`
- 含义：线段终点的逻辑坐标。
- 单位：米。

#### `segments[].end.x`

- 类型：`number`
- 含义：终点逻辑 x 坐标。
- 方向：向东为正，向西为负。

#### `segments[].end.y`

- 类型：`number`
- 含义：终点逻辑 y 坐标。
- 方向：向北为正，向南为负。

### `segments[].length`

- 类型：`number`
- 含义：线段长度。
- 单位：米。
- 说明：基于逻辑坐标起终点的欧氏距离计算得到。

### `segments[].angleDeg`

- 类型：`number`
- 含义：线段方向角。
- 单位：度。
- 说明：使用 `atan2(deltaY, deltaX)` 计算。

角度定义如下：

- `0` 表示正东。
- `90` 表示正北。
- `180` 或 `-180` 表示正西。
- `-90` 表示正南。
- 取值范围为 `[-180, 180]`。

### `segments[].customData`

- 类型：`array`
- 含义：线段的自定义键值对数据。
- 说明：用户右键线段后可添加任意键值对，数组中每项包含 `key`（键名）和 `value`（值）字段。未添加自定义数据时为空数组 `[]`。

#### `segments[].customData[].key`

- 类型：`string`
- 含义：键名。不允许为空。

#### `segments[].customData[].value`

- 类型：`string`
- 含义：值。不允许为空。

## 补充说明

- 所有逻辑坐标数值当前保留 3 位小数。
- 当没有任何线段时，不会生成导出文件。
- 第一条线段的起点一定对应逻辑原点 `(0, 0)`。
