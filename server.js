const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const Player = require('./models/Player');

const app = express();
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.vercel.app'] 
    : '*',
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : `http://localhost:${PORT}`;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Game Backend API',
      version: '1.0.0',
      description: 'API Documentation cho Game sử dụng MongoDB',
    },
    servers: [
      {
        url: BASE_URL,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Local server',
      },
    ],
  },
  apis: ['./server.js'], 
};
const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Đã kết nối MongoDB thành công'))
  .catch((err) => console.error('❌ Lỗi kết nối MongoDB:', err));


// ======================================
// ===========Routes=====================
// ======================================
/**
 * @swagger
 * components:
 *   schemas:
 *     Player:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID tự sinh của MongoDB
 *         name:
 *           type: string
 *           description: Tên người chơi
 *         history:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               wave:
 *                 type: integer
 *               score:
 *                 type: integer
 *               playtime:
 *                 type: integer
 *               playedAt:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /add_player:
 *   post:
 *     summary: Tạo người chơi mới
 *     tags: [Player]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "GamerVN"
 *     responses:
 *       201:
 *         description: Tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 */
app.post('/add_player', async (req, res) => {
    try {
        const {name} = req.body;
        if (!name || name.trim() === ''){
            return res.status(400).json({error: 'Tên người chơi là bắt buộc'});
        }
        const newPlayer = new Player({ name: name.trim(), history: [] });

        const savedPlayer = await newPlayer.save();
        res.status(201).json(savedPlayer);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi thêm người chơi', details: error.message });
    }
})


/**
 * @swagger
 * /update_score/{id}:
 *   post:
 *     summary: Thêm lượt chơi (cập nhật điểm)
 *     tags: [Player]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người chơi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wave
 *               - score
 *               - playtime
 *             properties:
 *               wave:
 *                 type: integer
 *                 example: 5
 *               score:
 *                 type: integer
 *                 example: 2500
 *               playtime:
 *                 type: integer
 *                 description: Thời gian chơi (giây)
 *                 example: 120
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       404:
 *         description: Không tìm thấy người chơi
 */
app.post('/update_score/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { wave, score, playtime } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID không hợp lệ' });
        }
        
        if (wave === undefined || score === undefined || playtime === undefined) {
            return res.status(400).json({ error: 'wave, score và playtime là bắt buộc' });
        }
        
        const updatedPlayer = await Player.findByIdAndUpdate(
            id,
            { $push: { history: { wave: wave, score: score, playtime: playtime } } },
            { new: true }
        );

        if (!updatedPlayer) {
            return res.status(404).json({ error: 'Người chơi không tìm thấy' });
        }

        res.status(200).json(updatedPlayer);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi cập nhật điểm số', details: error.message });
    }
})


/**
 * @swagger
 * /player/{id}:
 *   get:
 *     summary: Lấy thông tin người chơi
 *     tags: [Player]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người chơi
 *     responses:
 *       200:
 *         description: Thông tin người chơi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Player'
 *       404:
 *         description: Không tìm thấy người chơi
 */
app.get('/player/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID không hợp lệ' });
        }
        
        const player = await Player.findById(id);
        if (!player) {
            return res.status(404).json({ error: 'Người chơi không tìm thấy' });
        }
        res.status(200).json(player);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy thông tin người chơi', details: error.message });
    }
})

/**
 * @swagger
 * /get_all_players:
 *   get:
 *     summary: Lấy danh sách tất cả người chơi
 *     description: Trả về danh sách toàn bộ người chơi, sắp xếp theo thời gian tạo mới nhất.
 *     tags: [Player]
 *     responses:
 *       200:
 *         description: Danh sách người chơi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Player'
 *       500:
 *         description: Lỗi server
 */
app.get('/get_all_players', async (req, res) => {
    try {
        const players = await Player.find().sort({ createdAt: -1 });
        res.status(200).json(players);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy danh sách người chơi', details: error.message });
    }
})


//======================================
// ===========Server====================
//======================================
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📄 Swagger Docs at http://localhost:${PORT}/api-docs`);
  });
}

// Export cho Vercel
module.exports = app;