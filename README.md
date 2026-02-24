# Water Collection Invoice System

A professional web application for housing societies, hostels, and commercial properties to manage room-wise monthly water billing with accuracy, transparency, and speed.

## 🚀 Features

- **Professional UI/UX** - Clean, enterprise-style interface with neutral colors
- **Role-based Access Control** - Admin, Staff, and Customer roles
- **Sector & Room Management** - Organize rooms into logical groupings
- **Customer Management** - One customer per room with contact details
- **Payment Processing** - Multiple payment methods (Cash, UPI, Bank Transfer)
- **Invoice Generation** - Automated monthly billing with WhatsApp delivery
- **Dashboard & Reports** - Comprehensive analytics and reporting
- **WhatsApp Integration** - Automated invoice delivery via WhatsApp Business API

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Material-UI
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Testing**: Jest + Vitest + fast-check (Property-based testing)

### Project Structure
```
water-collection-invoice-system/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── tests/          # Test files
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── layouts/        # Layout components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── theme/          # Material-UI theme
│   │   └── types/          # TypeScript types
│   └── package.json
└── .kiro/specs/            # Project specifications
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Git

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/water_collection_system
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Water Collection Invoice System
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
```

### Frontend Testing
```bash
cd frontend
npm test                    # Run all tests
npm run test:ui            # Run tests with UI
npm run test:coverage      # Run tests with coverage
```

### Property-Based Testing
The system includes property-based tests using fast-check to validate:
- Authentication round-trip consistency
- Data persistence integrity
- Business rule enforcement
- Invoice calculation accuracy
- Payment processing integrity

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Sectors
- `GET /api/sectors` - List all sectors
- `POST /api/sectors` - Create new sector
- `PUT /api/sectors/:id` - Update sector
- `DELETE /api/sectors/:id` - Delete sector

### Rooms
- `GET /api/rooms` - List rooms with filters
- `POST /api/rooms` - Create new room
- `PUT /api/rooms/:id` - Update room
- `PUT /api/rooms/:id/status` - Update room status

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Remove customer

### Payments & Invoices
- `POST /api/invoices/generate` - Generate monthly invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices/:id/send` - Send invoice via WhatsApp
- `POST /api/payments` - Record payment
- `GET /api/payments` - List payments

### Reports
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/collections` - Collection reports
- `GET /api/reports/occupancy` - Occupancy statistics

## 🎨 Design System

### Color Palette
- **Primary**: #2563eb (Professional Blue)
- **Secondary**: #64748b (Slate Gray)
- **Success**: #059669 (Green)
- **Warning**: #d97706 (Amber)
- **Error**: #dc2626 (Red)
- **Background**: #f8fafc (Light Gray)

### Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Headings**: 600 weight
- **Body Text**: 400 weight, 16px base size

## 🚀 Deployment

### Backend Deployment
- **Recommended**: AWS EC2, DigitalOcean, or Heroku
- **Database**: MongoDB Atlas
- **Environment**: Production environment variables

### Frontend Deployment
- **Recommended**: Vercel, Netlify, or AWS S3 + CloudFront
- **Build**: `npm run build`
- **Static Files**: Serve from `dist/` directory

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.