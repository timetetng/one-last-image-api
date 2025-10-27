const { generateOneLastImage, initialize } = require('../oneLastImageAPI');
const { formidable } = require('formidable');
const fs = require('fs');

// 初始化资源
let initPromise = initialize().catch(err => {
    console.error("Initialization failed!", err);
    return err; // 存储错误以便后续调用知晓
});

// 辅助函数：解析 Vercel 的请求
function parseForm(req) {
    return new Promise((resolve, reject) => {
        const form = formidable({}); 
        
        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            const unwrappedFields = {};
            for (const key in fields) {
                if (Array.isArray(fields[key]) && fields[key].length > 0) {
                    unwrappedFields[key] = fields[key][0];
                } else {
                    unwrappedFields[key] = undefined;
                }
            }
            const unwrappedFiles = {};
            for (const key in files) {
                if (Array.isArray(files[key]) && files[key].length > 0) {
                    unwrappedFiles[key] = files[key][0]; 
                } else {
                    unwrappedFiles[key] = undefined;
                }
            }
            
            resolve({ fields: unwrappedFields, files: unwrappedFiles });
        });
    });
}

// Vercel Serverless 函数主入口
module.exports = async (req, res) => {
    // 确保只处理 POST 请求
    if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method Not Allowed' });
        return;
    }

    try {
        // 1. 确保资源已加载
        const initResult = await initPromise;
        if (initResult instanceof Error) {
            console.error("Initialization failed on request:", initResult);
            throw new Error("API failed to initialize assets.");
        }

        // 2. 解析表单数据 (图片和配置)
        const { fields, files } = await parseForm(req);

        if (!files.image) {
            return res.status(400).send({ error: 'No image file uploaded.' });
        }

        // 3. 读取上传的图片 buffer
        const imageBuffer = fs.readFileSync(files.image.filepath);

        // 4. 解析配置
        let userConfig = {};
        if (fields.config) {
            try {
                userConfig = JSON.parse(fields.config);
            } catch (e) {
                return res.status(400).send({ error: 'Invalid config JSON.' });
            }
        }
        
        // 转换表单中可能为字符串的布尔值/数字
        Object.keys(userConfig).forEach(key => {
            if (userConfig[key] === 'true') userConfig[key] = true;
            else if (userConfig[key] === 'false') userConfig[key] = false;
            else if (!isNaN(parseFloat(userConfig[key])) && isFinite(userConfig[key])) {
                userConfig[key] = parseFloat(userConfig[key]);
            }
        });

        // 5. 生成图片
        const outputBuffer = await generateOneLastImage(imageBuffer, userConfig);

        // 6. 返回图片
        res.setHeader('Content-Type', 'image/jpeg');
        res.status(200).send(outputBuffer);

    } catch (error) {
        console.error('Error during image generation:', error);
        res.status(500).send({ error: 'Failed to generate image.', details: error.message });
    }
};