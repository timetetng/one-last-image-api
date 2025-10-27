const { createCanvas, loadImage, Image } = require('canvas');
const path = require('path');

// --- 从 document.js 提取的辅助函数和配置 ---

const creatConvoluteCenterHigh = (w, centerV) => {
	const arr = [];
	const c = Math.floor((w * w) / 2);
	for (let x = 0; x < w; x++) {
		for (let y = 0; y < w; y++) {
			let i = x * w + y;
			arr[i] = -1;
			if (i === c) {
				arr[i] = centerV;
			}
		}
	}
	return arr;
}
const creatConvoluteAverage = (w) => new Array(w * w).fill(1 / (w * w))

// 卷积矩阵定义
const Convolutes = {
	'精细': creatConvoluteAverage(5),
	'一般': creatConvoluteAverage(7),
	'稍粗': creatConvoluteAverage(9),
	'超粗': creatConvoluteAverage(11),
	'极粗': creatConvoluteAverage(13),
	'浮雕': [
		1, 1, 1,
		1, 1, -1,
		-1, -1, -1
	],
	'线稿': null,
};

// 默认样式参数
const defaultStyle = {
	zoom: 1,
	light: 0,
	shadeLimit: 108,
	shadeLight: 80,
	shade: true,
	kuma: true,
	hajimei: false,
	watermark: true,
	convoluteName: '一般',
	convolute1Diff: true,
	convoluteName2: null,
	Convolutes,
	lightCut: 128,
	darkCut: 118,
	denoise: true,
};



/**
 * 卷积函数 (Y 通道)
 */
const convoluteY = (pixels, weights, ctx) => {
	const side = Math.round(Math.sqrt(weights.length));
	const halfSide = Math.floor(side / 2);

	const src = pixels.data;
	const w = pixels.width;
	const h = pixels.height;
	const output = ctx.createImageData(w, h);
	const dst = output.data;

	for (let sy = 0; sy < h; sy++) {
		for (let sx = 0; sx < w; sx++) {
			const dstOff = (sy * w + sx) * 4;
			let r = 0;

			for (let cy = 0; cy < side; cy++) {
				for (let cx = 0; cx < side; cx++) {
					const scy = Math.min(h - 1, Math.max(0, sy + cy - halfSide));
					const scx = Math.min(w - 1, Math.max(0, sx + cx - halfSide));
					const srcOff = (scy * w + scx) * 4;
					const wt = weights[cy * side + cx];
					r += src[srcOff] * wt;
				}
			}
			dst[dstOff] = r;
			dst[dstOff + 1] = r;
			dst[dstOff + 2] = r;
			dst[dstOff + 3] = 255;
		}
	}
	return output;
};

// 预加载的资源
let pencilTextureEl;
let watermarkImageEl;

/**
 * 初始化函数，用于预加载资源
 * 确保 /html 目录在项目根部
 */
async function initialize() {
	try {
        // process.cwd() 在 Vercel 中指向项目的根目录
		const assetsPath = path.join(process.cwd(), 'html');
		const pencilTexturePath = path.join(assetsPath, 'pencil-texture.jpg');
		const watermarkImagePath = path.join(assetsPath, 'one-last-image-logo2.png');
		
		pencilTextureEl = await loadImage(pencilTexturePath);
		watermarkImageEl = await loadImage(watermarkImagePath);
		
		console.log('Assets loaded successfully from:', assetsPath);
	} catch (error) {
		console.error('Failed to load assets:', error);
		throw new Error('API initialization failed: Could not load required image assets.');
	}
}

/**
 * 核心渲染函数
 */
async function renderLouvre({ img, outputCanvas, config }) {
	if (!img || !config || !outputCanvas) return;
    if (!pencilTextureEl || !watermarkImageEl) {
        throw new Error('Assets not initialized. Call initialize() first.');
    }

	const oriWidth = img.naturalWidth || img.width;
	const oriHeight = img.naturalHeight || img.height;

	let _width = Math.round(oriWidth / config.zoom);
	let _height = Math.round(oriHeight / config.zoom);

	const maxWidth = 1920;
	if (_width > maxWidth) {
		_height = _height * maxWidth / _width;
		_width = maxWidth;
	}

    // API 假定图像已按需裁剪，或使用原始比例
	let cutLeft = 0;
	let cutTop = 0;
	let calcWidth = oriWidth;
	let calcHeight = oriHeight;
    
	let setLeft = 0;
	let setTop = 0;
	let setWidth = _width;
	let setHeight = _height;

    // 使用 node-canvas 创建画布
    const canvas = createCanvas(_width, _height);
	const ctx = canvas.getContext('2d');
	const canvasShade = createCanvas(_width, _height);
	const canvasShadeMin = createCanvas(_width, _height);
	const canvasMin = createCanvas(_width, _height);
	const pencilTextureCanvas = createCanvas(_width, _height);

	ctx.drawImage(
		img,
		cutLeft, cutTop,
		calcWidth, calcHeight,
		setLeft, setTop,
		setWidth, setHeight
	);

	let pixel = ctx.getImageData(0, 0, _width, _height);
	let pixelData = pixel.data;

	// 转灰度
	for (let i = 0; i < pixelData.length; i += 4) {
		const r = pixelData[i];
		const g = pixelData[i + 1];
		const b = pixelData[i + 2];
		let y = r * .299000 + g * .587000 + b * .114000;
		y = Math.floor(y);
		pixelData[i] = y;
		pixelData[i + 1] = y;
		pixelData[i + 2] = y;
	}

	let shadePixel;
	const { shadeLimit = 80, shadeLight = 40 } = config;

    // 处理调子（阴影）
	if (config.shade) {
		const pencilTextureCtx = pencilTextureCanvas.getContext('2d');
		const pencilSetWidthHeight = Math.max(_width, _height);
		pencilTextureCtx.drawImage(
			pencilTextureEl,
			0, 0,
			pencilTextureEl.width, pencilTextureEl.height,
			0, 0,
			pencilSetWidthHeight, pencilSetWidthHeight
		);
		let pencilTexturePixel = pencilTextureCtx.getImageData(0, 0, _width, _height);

		shadePixel = ctx.createImageData(_width, _height);
		for (let i = 0; i < pixelData.length; i += 4) {
			let y = pixelData[i];
			y = y > shadeLimit ? 0 : 255;
			shadePixel.data[i] = y;
			shadePixel.data[i + 1] = 128;
			shadePixel.data[i + 2] = 128;
			shadePixel.data[i + 3] = Math.floor(Math.random() * 255);
		}

		const ctxShade = canvasShade.getContext('2d');
		const ctxShadeMin = canvasShadeMin.getContext('2d');
		const shadeZoom = 4;
		canvasShadeMin.width = Math.floor(_width / shadeZoom);
		canvasShadeMin.height = Math.floor(_height / shadeZoom);

		ctxShade.putImageData(shadePixel, 0, 0);
		ctxShadeMin.drawImage(
			canvasShade,
			0, 0,
			canvasShadeMin.width, canvasShadeMin.height
		);
		ctxShade.clearRect(0, 0, _width, _height);
		ctxShade.drawImage(
			canvasShadeMin,
			0, 0,
			_width, _height
		);
		shadePixel = ctxShade.getImageData(0, 0, _width, _height);

		for (let i = 0; i < shadePixel.data.length; i += 4) {
			let y = shadePixel.data[i];
			y = Math.round((255 - pencilTexturePixel.data[i]) / 255 * y / 255 * shadeLight);
			shadePixel.data[i] = y;
		}
	}

    // 降噪
	if (config.denoise) {
		pixel = convoluteY(
			pixel,
			[
				1 / 9, 1 / 9, 1 / 9,
				1 / 9, 1 / 9, 1 / 9,
				1 / 9, 1 / 9, 1 / 9
			],
			ctx
		);
	}

    // 卷积处理
	const convoluteMatrix = config.Convolutes[config.convoluteName];
	let pixel1 = convoluteMatrix ? convoluteY(pixel, convoluteMatrix, ctx) : pixel;

	if (convoluteMatrix && config.convolute1Diff) {
		let pixel2 = config.convoluteName2 ? convoluteY(pixel, config.Convolutes[config.convoluteName2], ctx) : pixel;
		for (let i = 0; i < pixel2.data.length; i += 4) {
			let r = 128 + pixel2.data[i] - pixel1.data[i];
			pixel2.data[i] = r;
			pixel2.data[i + 1] = r;
			pixel2.data[i + 2] = r;
			pixel2.data[i + 3] = 255;
		}
		pixel = pixel2;
	} else {
		pixel = pixel1;
	}

	pixelData = pixel.data;

    // 亮暗切割
	if (convoluteMatrix)
		if (config.lightCut || config.darkCut) {
			const scale = 255 / (255 - config.lightCut - config.darkCut);
			for (let i = 0; i < pixelData.length; i += 4) {
				let y = pixelData[i];
				y = (y - config.darkCut) * scale;
				y = Math.max(0, y);
				pixelData[i + 0] = y;
				pixelData[i + 1] = y;
				pixelData[i + 2] = y;
				pixelData[i + 3] = 255;
			}
		}

    // 'Kiss' 效果 (kuma)
	if (config.kuma) {
		const gradient = ctx.createLinearGradient(0, 0, _width, _height);
		gradient.addColorStop(0, '#fbba30');
		gradient.addColorStop(0.4, '#fc7235');
		gradient.addColorStop(.6, '#fc354e');
		gradient.addColorStop(.7, '#cf36df');
		gradient.addColorStop(.8, '#37b5d9');
		gradient.addColorStop(1, '#3eb6da');

		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, _width, _height);
		let gradientPixel = ctx.getImageData(0, 0, _width, _height);

		for (let i = 0; i < pixelData.length; i += 4) {
			let y = pixelData[i];
			pixelData[i + 0] = gradientPixel.data[i + 0];
			pixelData[i + 1] = gradientPixel.data[i + 1];
			pixelData[i + 2] = gradientPixel.data[i + 2];
			y = 255 - y;
			if (config.shade) {
				y = Math.max(y, shadePixel.data[i]);
			}
			pixelData[i + 3] = y;
		}
	}

	ctx.putImageData(pixel, 0, 0);

    // 缩放模糊处理
	const ctxMin = canvasMin.getContext('2d');
	canvasMin.width = Math.floor(_width / 1.4);
	canvasMin.height = Math.floor(_height / 1.3);
	ctxMin.clearRect(0, 0, canvasMin.width, canvasMin.height);
	ctxMin.drawImage(
		canvas,
		0, 0,
		canvasMin.width, canvasMin.height
	);
	ctx.clearRect(0, 0, _width, _height);
	ctx.drawImage(
		canvasMin,
		0, 0,
		canvasMin.width, canvasMin.height,
		0, 0, _width, _height
	);

    // 水印
	if (config.watermark) {
		const watermarkImageWidth = watermarkImageEl.naturalWidth;
		const watermarkImageHeight = watermarkImageEl.naturalHeight / 2;
		let setWidth = _width * 0.3;
		let setHeight = setWidth / watermarkImageWidth * watermarkImageHeight;

		if (_width / _height > 1.1) {
			setHeight = _height * 0.15;
			setWidth = setHeight / watermarkImageHeight * watermarkImageWidth;
		}
		let cutTop = 0;
		if (config.hajimei) {
			cutTop = watermarkImageHeight;
		}
		let setLeft = _width - setWidth - setHeight * 0.2;
		let setTop = _height - setHeight - setHeight * 0.16;
		ctx.drawImage(
			watermarkImageEl,
			0, cutTop,
			watermarkImageWidth, watermarkImageHeight,
			setLeft, setTop,
			setWidth, setHeight
		);
	}

    // 最终输出到目标画布
	const outputCtx = outputCanvas.getContext('2d');
	outputCanvas.width = _width;
	outputCanvas.height = _height;
	outputCtx.fillStyle = '#FFF';
	outputCtx.fillRect(0, 0, _width, _height);
	outputCtx.drawImage(
		canvas,
		0, 0, _width, _height
	);
}

/**
 * API 主函数
 * @param {Buffer} imageBuffer - 输入图像的 Buffer
 * @param {object} userConfig - 用户自定义参数，将覆盖 defaultStyle
 * @returns {Promise<Buffer>} - 生成的 JPEG 图像 Buffer
 */
async function generateOneLastImage(imageBuffer, userConfig = {}) {
	try {
        // 1. 加载输入图像
		const inputImage = await loadImage(imageBuffer);

        // 2. 合并配置
		const config = { 
            ...defaultStyle, 
            ...userConfig,
            Convolutes: defaultStyle.Convolutes // 确保 Convolutes 不被覆盖
        };
        
        // 3. 创建输出画布
        // 尺寸将在 renderLouvre 内部根据配置和图像大小确定
        const outputCanvas = createCanvas(1, 1); 

        // 4. 调用核心渲染函数
		await renderLouvre({
			img: inputImage,
			outputCanvas: outputCanvas,
			config: config
		});

        // 5. 返回 JPEG buffer
		return outputCanvas.toBuffer('image/jpeg', .9);
        
	} catch (error) {
		console.error('Error in generateOneLastImage:', error);
		throw error;
	}
}

module.exports = {
	generateOneLastImage,
	initialize
};