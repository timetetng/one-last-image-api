# One Last Image API

这是一个基于 `node-canvas` 的 Serverless API 服务，用于将上传的图片处理成具有特殊艺术风格（如“最后一张照片”风格、线稿、浮雕等）的图像。

本项目已配置为可直接在 Vercel 上一键部署。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftimetetng%2Fone-last-image-api)

## 目录

- [One Last Image API](#one-last-image-api)
  - [目录](#目录)
  - [Vercel 快速部署指南](#vercel-快速部署指南)
    - [重要：部署前置条件](#重要部署前置条件)
    - [Vercel 项目配置](#vercel-项目配置)
  - [API 使用文档](#api-使用文档)
    - [端点 (Endpoint)](#端点-endpoint)
    - [请求格式](#请求格式)
    - [请求体 (Body)](#请求体-body)
    - [配置参数 (`config`) 详解](#配置参数-config-详解)
  - [API 请求示例 (curl)](#api-请求示例-curl)
    - [示例 1：使用默认配置](#示例-1使用默认配置)
    - [示例 2：自定义配置（浮雕、无水印）](#示例-2自定义配置浮雕无水印)
    - [示例 3：自定义配置（彩色水印）](#示例-3自定义配置彩色水印)

---

## Vercel 快速部署指南

点击上方的 "Deploy with Vercel" 按钮，Vercel 会自动克隆你的仓库并开始部署。

### 重要：部署前置条件

在部署**之前**或**之后**，你必须确保满足以下几个条件，否则部署会失败或 API 无法正常运行：

1.  **Node.js 版本：**
    * 你的 `package.json` 必须指定 `"node": "20.x"`。
    * `node-canvas` 库在 Node 22.x 上缺少预编译包，会导致编译失败。使用 Node 20.x (LTS) 可以确保 Vercel 拉取到正确的预编译依赖。

2.  **资源文件 (Assets)：**
    * API 启动时需要加载必要的资源文件。请确保 `html/` 目录下包含：
    * `html/one-last-image-logo2.png`：水印 Logo 素材。
    * `html/pencil-texture.jpg`：铅笔纹理素材。**注意：** 原始仓库中的 `pencil-texture.psd` 无法被 `node-canvas` 读取，**必须将其转换为 `.jpg` 格式**，否则 API 会返回 500 错误。

### Vercel 项目配置

Vercel 会自动读取项目中的配置文件：

* **`vercel.json`**：
    * `installCommand`：指定使用 `bash build-vercel.sh && npm install`，这是为了在 `npm install` 之前，通过 `build-vercel.sh` 安装 `node-canvas` 所需的系统依赖（如 `cairo`, `pango`, `jpeg` 等）。
    * `functions`：配置了 Serverless 函数的最大执行时间 `maxDuration` 为 30 秒。
* **Vercel 仪表盘设置**：
    * 请在你的 Vercel 项目设置 (Settings -> General) 中，将 **Node.js Version** 也手动选为 **20.x**。这可以消除部署日志中的版本不一致警告。

---

## API 使用文档

### 端点 (Endpoint)

* **URL:** `/api/generate` (例如 `https://your-project.vercel.app/api/generate`)
* **Method:** `POST`

### 请求格式

请求必须使用 `multipart/form-data` 格式。

### 请求体 (Body)

| 字段名 | 类型 | 必需 | 描述 |
| :--- | :--- | :--- | :--- |
| `image` | File | 是 | 必需。用户上传的原始图片文件（如 .jpg, .png 等）。 |
| `config` | String | 否 | 必需。一个 **JSON 字符串**，用于覆盖 `oneLastImageAPI.js` 中的默认参数。如果不提供，则使用 `defaultStyle`。 |

### 配置参数 (`config`) 详解

`config` 字段接收一个 JSON 字符串，可以覆盖以下任意参数（所有参数均来自 `oneLastImageAPI.js` 中的 `defaultStyle`）：

| 参数名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `zoom` | Number | `1` | 缩放比例。最终图片的尺寸会是 (原始尺寸 / zoom)。 |
| `light` | Number | `0` | 亮度调整（在卷积计算前）。 |
| `shadeLimit` | Number | `108` | （调子）阴影的阈值，值越小，阴影越多。 |
| `shadeLight` | Number | `80` | （调子）阴影的强度。 |
| `shade` | Boolean | `true` | 是否启用调子（阴影）效果。 |
| `kuma` | Boolean | `true` | 是否启用 "Kiss" 渐变（彩色）效果。 |
| `hajimei` | Boolean | `false` | 是否使用彩色的 Hajimei 水印（截取 Logo 素材的下半部分）。 |
| `watermark` | Boolean | `true` | 是否在右下角添加水印。 |
| `convoluteName` | String | `'一般'` | 卷积矩阵的名称。可选值：`'精细'`, `'一般'`, `'稍粗'`, `'超粗'`, `'极粗'`, `'浮雕'`。 |
| `convolute1Diff` | Boolean | `true` | 是否启用卷积差异计算。 |
| `convoluteName2`| String | `null` | 第二个卷积矩阵的名称（如果 `convolute1Diff` 为 true）。 |
| `lightCut` | Number | `128` | 亮部切割阈值。 |
| `darkCut` | Number | `118` | 暗部切割阈值。 |
| `denoise` | Boolean | `true` | 是否在卷积前进行一次 9 宫格降噪处理。 |

---

## API 请求示例 (curl)

`curl` 是一个通用的命令行工具，可用于测试 API。

假设你已将项目部署到 Vercel，获得了 URL `https://your-project-name.vercel.app`，并且你有一张名为 `my-photo.jpg` 的本地图片。

### 示例 1：使用默认配置

这将使用 API 的默认样式（`kuma: true`, `watermark: true` 等）处理图片。

```bash
curl -X POST "https://<YOUR_DEPLOYMENT_URL>/api/generate" \
     -F "image=@my-photo.jpg" \
     --output output_default.jpg
```
* `https://<YOUR_DEPLOYMENT_URL>`：替换为你自己的 Vercel 部署 URL 或自定义域名。
* `-F "image=@my-photo.jpg"`：上传当前目录下的 `my-photo.jpg` 文件。
* `--output output_default.jpg`：将返回的图片保存为 `output_default.jpg`。

### 示例 2：自定义配置（浮雕、无水印）

这将发送一个 `config` 字段，请求“浮雕”效果，并关闭 Kuma 渐变和水印。

```bash
# 准备 config JSON 字符串
CONFIG_JSON='{"convoluteName": "浮雕", "kuma": false, "watermark": false}'

curl -X POST "https://<YOUR_DEPLOYMENT_URL>/api/generate" \
     -F "image=@my-photo.jpg" \
     -F "config=${CONFIG_JSON}" \
     --output output_emboss.jpg
```
* `-F "config=${CONFIG_JSON}"`：将 JSON 字符串作为 `config` 字段发送。

### 示例 3：自定义配置（彩色水印）

这将请求 `hajimei: true` 来获取彩色的水印。

```bash
# 准备 config JSON 字符串
CONFIG_JSON='{"hajimei": true}'

curl -X POST "https://<YOUR_DEPLOYMENT_URL>/api/generate" \
     -F "image=@my-photo.jpg" \
     -F "config=${CONFIG_JSON}" \
     --output output_hajimei.jpg
```