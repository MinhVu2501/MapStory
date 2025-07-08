# MapStory Creator

A platform for creating and sharing interactive map stories with Google Maps integration.

## Features

- 🗺️ **Interactive Google Maps** - Search and explore locations worldwide
- 📍 **City Search** - Find places, addresses, and points of interest
- 👤 **User Authentication** - Register, login, and manage your account
- 📖 **Map Stories** - Create and share your own interactive maps
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- Google Maps API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mapstory
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:

```env
# Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/mapstory

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Server Port
PORT=3000
```

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
4. Create credentials (API Key)
5. Add the API key to your `.env` file

### Database Setup

1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env` file
3. Run the seed script to create tables and sample data:
```bash
node seed.js
```

### Running the Application

1. Start the backend server:
```bash
npm start
```

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

### Home Page
- Search for cities, places, or addresses using the search bar
- View search results with location details
- Click on markers to see information windows
- Explore the interactive map

### User Features
- **Register**: Create a new account
- **Login**: Access your account and maps
- **My Maps**: View and manage your created maps
- **Logout**: Securely log out of your account

## Technologies Used

- **Frontend**: React, Vite, Google Maps JavaScript API
- **Backend**: Node.js, Express, PostgreSQL
- **Authentication**: JWT, bcrypt
- **Styling**: CSS3 with responsive design

## API Endpoints

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/maps/my-maps` - Get user's maps (authenticated)
- `POST /api/maps` - Create new map (authenticated)
- `GET /api/maps` - Get public maps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License. 