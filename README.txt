# Game Backend API

API backend cho game sử dụng Node.js, Express và MongoDB.

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env`:
```
MONGO_URI=your_mongodb_connection_string
PORT=3000
```

## Chạy server

```bash
npm start
```

## API Documentation

Truy cập: http://localhost:3000/api-docs

## Endpoints

- `POST /add_player` - Tạo người chơi mới
- `POST /update_score/:id` - Cập nhật điểm
- `GET /player/:id` - Lấy thông tin người chơi
- `GET /get_all_players` - Lấy tất cả người chơi
```