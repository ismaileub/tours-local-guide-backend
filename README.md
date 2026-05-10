# Tourist Guide Backend

This is the **backend application** for the Tourist Guide project. It is built with **Node.js**, **Express.js**, **TypeScript**, and **MongoDB**. The backend handles tours, bookings, users, payments, and reviews.

---

**Live Demo:** [https://tourist-guide-backend.vercel.app](https://tour-guide-backend-murex.vercel.app)

## 🛠 Features

- REST API for tours, bookings, and users
- Payment processing via Stripe
- User authentication and authorization (JWT)
- Review system for tours and guides
- MongoDB database integration
- Error handling and validation

---

## ⚡ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Git](https://git-scm.com/)

---

## 🔧 Setup Instructions (Local Development)

1. **Clone the repository**

```bash
git clone https://github.com/your-username/tourist-guide-backend.git
cd tourist-guide-backend
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Create environment variables**

Create a `.env` file in the root:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/tourist-guide
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=sk_test_yourkey
FRONTEND_URL=http://localhost:3000
```

> Replace with your actual MongoDB URI, Stripe secret key, and JWT secret.

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
```

- Server runs on [http://localhost:5000](http://localhost:5000)

---

## 📦 Build & Production

1. **Build the project**

```bash
npm run build
# or
yarn build
```

2. **Start the production server**

```bash
npm start
# or
yarn start
```

- Make sure MongoDB Atlas or production database is accessible.
- Ensure `FRONTEND_URL` is set correctly for CORS.

---

## 🔗 Folder Structure

```
backend/
│
├─ src/
│   ├─ controllers/       # API route controllers
│   ├─ models/            # Mongoose models
│   ├─ routes/            # Express routes
│   ├─ middleware/        # Auth, error handling, etc.
│   ├─ services/          # Stripe and other service logic
│   └─ utils/             # Helper functions
├─ .env                  # Environment variables
├─ package.json           # Dependencies and scripts
├─ tsconfig.json          # TypeScript configuration
└─ README.md              # Project documentation
```

---

## 📝 Useful Scripts

| Command          | Description                                 |
| ---------------- | ------------------------------------------- |
| `npm run dev`    | Run server in development mode with nodemon |
| `npm run build`  | Compile TypeScript for production           |
| `npm start`      | Start production server                     |
| `npm run lint`   | Lint code                                   |
| `npm run format` | Format code with Prettier                   |

---

## ⚠️ Common Issues

1. **MongoDB connection errors**

   - Ensure `MONGO_URI` is correct and your IP is whitelisted in MongoDB Atlas

2. **Stripe payment errors**

   - Ensure `STRIPE_SECRET_KEY` is valid
   - Check your frontend is sending the correct request

3. **JWT authentication errors**

   - Make sure `JWT_SECRET` is consistent between backend and frontend

4. **CORS issues**

   - Ensure `FRONTEND_URL` is added to CORS whitelist in your Express app

---

## 📚 References

- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Stripe API](https://stripe.com/docs)
- [JWT Authentication](https://jwt.io/introduction/)

---


