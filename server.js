const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const Player = require('./models/Player');

const app = express();
const corsOptions = {
  origin: '*', 
  // origin: [
  //   'https://game-backend-wheat.vercel.app', 
  //   'https://itch.io', 
  //   'https://html-classic.itch.zone' 
  // ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ Đã kết nối MongoDB thành công'))
  .catch((err) => {
    console.error('❌ Lỗi kết nối MongoDB:', err);
    console.error('Connection string:', process.env.MONGO_URI?.replace(/\/\/.*@/, '//<hidden>@'));
  });



// ======================================
// ===========Routes=====================
// ======================================
/**
 * @swagger
 * components:
 * schemas:
 * Player:
 * type: object
 * properties:
 * _id:
 * type: string
 * description: ID tự sinh của MongoDB
 * name:
 * type: string
 * description: Tên người chơi
 * history:
 * type: array
 * items:
 * type: object
 * properties:
 * wave:
 * type: integer
 * score:
 * type: integer
 * playtime:
 * type: integer
 * playedAt:
 * type: string
 * format: date-time
 * createdAt:
 * type: string
 * format: date-time
 */

/**
 * @swagger
 * /add_player:
 * post:
 * summary: Tạo người chơi mới
 * tags: [Player]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * properties:
 * name:
 * type: string
 * example: "GamerVN"
 * responses:
 * 201:
 * description: Tạo thành công
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Player'
 */
app.post('/add_player', async (req, res) => {
    try {
        const {name} = req.body;
        if (!name || name.trim() === ''){
            return res.status(400).json({error: 'Tên người chơi là bắt buộc'});
        }
        
        const existingPlayer = await Player.findOne({ name: name.trim() });
        if (existingPlayer) {
             return res.status(409).json({ error: 'Tên người chơi đã tồn tại' });
        }

        const newPlayer = new Player({ name: name.trim(), history: [] });

        const savedPlayer = await newPlayer.save();
        res.status(201).json(savedPlayer);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Tên người chơi đã tồn tại' });
        }
        res.status(500).json({ error: 'Lỗi khi thêm người chơi', details: error.message });
    }
})


/**
 * @swagger
 * /update_score/{name}:
 * patch:
 * summary: Thêm lượt chơi (cập nhật điểm theo tên)
 * description: Sử dụng phương thức PATCH để tìm người chơi theo TÊN và cập nhật lịch sử.
 * tags: [Player]
 * parameters:
 * - in: path
 * name: name
 * schema:
 * type: string
 * required: true
 * description: Tên của người chơi (chính xác)
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - wave
 * - score
 * - playtime
 * properties:
 * wave:
 * type: integer
 * example: 5
 * score:
 * type: integer
 * example: 2500
 * playtime:
 * type: integer
 * description: Thời gian chơi (giây)
 * example: 120
 * responses:
 * 200:
 * description: Cập nhật thành công
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Player'
 * 404:
 * description: Không tìm thấy người chơi với tên này
 * 400:
 * description: Dữ liệu đầu vào không hợp lệ
 */
app.patch('/update_score/:name', async (req, res) => {
  try {
      const { name } = req.params;
      const { wave, score, playtime } = req.body;
      
      if (!name) {
          return res.status(400).json({ error: 'Tên người chơi là bắt buộc' });
      }
      
      if (wave === undefined || score === undefined || playtime === undefined) {
          return res.status(400).json({ error: 'wave, score và playtime là bắt buộc' });
      }
      
      // Sử dụng findOneAndUpdate thay vì findByIdAndUpdate
      const updatedPlayer = await Player.findOneAndUpdate(
          { name: name }, // Điều kiện tìm kiếm: name
          { 
              $push: { 
                  history: { 
                      wave: wave, 
                      score: score, 
                      playtime: playtime,
                      playedAt: new Date()
                  } 
              } 
          },
          { new: true, runValidators: true } // new: true trả về document sau khi update
      );

      if (!updatedPlayer) {
          return res.status(404).json({ error: `Không tìm thấy người chơi có tên: ${name}` });
      }

      res.status(200).json(updatedPlayer);
  } catch (error) {
      res.status(500).json({ error: 'Lỗi khi cập nhật điểm số', details: error.message });
  }
});


/**
 * @swagger
 * /player/{name}:
 * get:
 * summary: Lấy thông tin người chơi theo tên
 * tags: [Player]
 * parameters:
 * - in: path
 * name: name
 * schema:
 * type: string
 * required: true
 * description: Tên của người chơi
 * responses:
 * 200:
 * description: Thông tin người chơi
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/Player'
 * 404:
 * description: Không tìm thấy người chơi
 */
app.get('/player/:name', async (req, res) => {
    try {
        const { name } = req.params;
        
        if (!name) {
            return res.status(400).json({ error: 'Tên người chơi là bắt buộc' });
        }
        
        // Sử dụng findOne thay vì findById
        const player = await Player.findOne({ name: name });
        
        if (!player) {
            return res.status(404).json({ error: `Không tìm thấy người chơi có tên: ${name}` });
        }
        res.status(200).json(player);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy thông tin người chơi', details: error.message });
    }
})

/**
 * @swagger
 * /get_all_players:
 * get:
 * summary: Lấy danh sách tất cả người chơi
 * description: Trả về danh sách toàn bộ người chơi, sắp xếp theo thời gian tạo mới nhất.
 * tags: [Player]
 * responses:
 * 200:
 * description: Danh sách người chơi
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Player'
 * 500:
 * description: Lỗi server
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


module.exports = app;