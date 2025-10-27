![小明日香确实可爱](simple.jpg)

# 🧸「# One Last Image API」卢浮宫生成器 API

One Last Image 卢浮宫生成器 API 是一个可快速部署在 Vercel 上的 Serverless API 服务，将 **赛璐珞风格** **动画截图** 或 **插画**，转换成 One Last Kiss 封面风格的图片。

> **重要声明**
> 
> **本项目仅为 API 封装的二次开发和部署教程**


**原项目 Github 地址: https://github.com/itorr/one-last-image**

喜欢的话麻烦给原仓库和本仓库点一个 Star⭐ 哦~

本项目已配置为可直接在 Vercel 上一键部署。

⬇⬇⬇**点击下方按钮一键部署**⬇⬇⬇

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ftimetetng%2Fone-last-image-api)

## 目录

- [🧸「# One Last Image API」卢浮宫生成器 API](#-one-last-image-api卢浮宫生成器-api)
  - [目录](#目录)
  - [一、Vercel 快速部署指南](#一vercel-快速部署指南)
    - [Vercel 项目配置](#vercel-项目配置)
    - [部署之后](#部署之后)
    - [添加自定义域(可选)](#添加自定义域可选)
  - [二、API 使用文档](#二api-使用文档)
    - [端点 (Endpoint)](#端点-endpoint)
    - [请求格式](#请求格式)
    - [请求体 (Body)](#请求体-body)
    - [配置参数 (`config`) 详解](#配置参数-config-详解)
  - [三、API 请求示例 (curl)](#三api-请求示例-curl)
    - [示例 1：使用默认配置](#示例-1使用默认配置)
    - [示例 2：自定义配置（浮雕、无水印）](#示例-2自定义配置浮雕无水印)
    - [示例 3：自定义配置（彩色水印）](#示例-3自定义配置彩色水印)

---

## 一、Vercel 快速部署指南

点击上方的 "Deploy with Vercel" 按钮，跳转到 Vercel。如果你未绑定你的 github 账号，请在这之前完成授权绑定。

继续到之前的页面，此时命名你的仓库并点击 Create 按钮，Vercel 会自动 fork 本仓库并开始部署。





### Vercel 项目配置

Vercel 会自动读取项目中的配置文件，默认不需要你进行配置，如果你有更自定义的需要，可以自行修改配置项：

* **`vercel.json`**：
    * `installCommand`：指定使用 `bash build-vercel.sh && npm install`，这是为了在 `npm install` 之前，通过 `build-vercel.sh` 安装 `node-canvas` 所需的系统依赖（如 `cairo`, `pango`, `jpeg` 等）。
    * `functions`：配置了 Serverless 函数的最大执行时间 `maxDuration` 为 30 秒。

### 部署之后

成功部署之后，Vercel 会自动分配一个域名用于访问，例如: `https://your-project.vercel.app`；

你接下来的请求 URL 就是这个域名加上`/api/generate`路由

### 添加自定义域(可选)
如果你有自己的域名可以点击**添加自定义域**，输入你想要配置的域名

然后在你域名 DNS 服务商那里添加一个 CNAME 记录指向 Vercel 提供的域名即可。

回到 Vercel 确认，Vercel 会自动检测 DNS 有效性，检测成功后会自动配置 SSL 证书。

一切就绪！你可以使用你的自定义域名访问这个 API 端点！


---

## 二、API 使用文档

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
| `zoom` | Number | `1` | 缩放比例 |
| `light` | Number | `0` | 亮度调整（在卷积计算前）。 |
| `shadeLimit` | Number | `108` | 阴影的阈值，值越小，阴影越多。 |
| `shadeLight` | Number | `80` | 阴影的强度。 |
| `shade` | Boolean | `true` | 是否启用阴影效果。 |
| `kuma` | Boolean | `true` | 是否启用 "Kiss" 渐变（彩色）效果。 |
| `hajimei` | Boolean | `false` | 是否使用彩色水印 |
| `watermark` | Boolean | `true` | 是否在右下角添加水印。 |
| `convoluteName` | String | `'一般'` | 卷积矩阵的名称。可选值：`'精细'`, `'一般'`, `'稍粗'`, `'超粗'`, `'极粗'`, `'浮雕'`。 |
| `convolute1Diff` | Boolean | `true` | 是否启用卷积差异计算。 |
| `convoluteName2`| String | `null` | 第二个卷积矩阵的名称（如果 `convolute1Diff` 为 true）。 |
| `lightCut` | Number | `128` | 亮部切割阈值。 |
| `darkCut` | Number | `118` | 暗部切割阈值。 |
| `denoise` | Boolean | `true` | 是否在卷积前进行一次 9 宫格降噪处理。 |

---

## 三、API 请求示例 (curl)

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