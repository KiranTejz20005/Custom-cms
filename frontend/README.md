# LifeMonk Mapping Admin Interface

A production-ready mapping admin system built with React, Vite, and Xano.

## Features
- **4-Step Mapping Wizard**: Create course-to-user group mappings with ease.
- **Dynamic Dashboard**: Search, filter, and manage all your mapped assets.
- **Xano Integration**: Fully powered by Xano REST APIs.
- **Premium Aesthetics**: Clean, modern interface with smooth animations and glassmorphism.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Setup
Create a `.env` file in the `frontend` directory:
```env
VITE_XANO_BASE_URL=https://your-xano-instance.n7.xano.io/api:YOUR_GROUP_ID
```

### Running Locally
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Building for Production
```bash
npm run build
```

## Architecture
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (Global + Component-level blocks)
- **Icons**: Lucide React
- **API Client**: Axios

## API Endpoints Used
- `GET /get_all_grades`
- `GET /get_all_schools`
- `GET /get_all_courses`
- `GET /count-users`
- `POST /mappings`
- `GET /mappings`
- `DELETE /mappings/:id`
- `PATCH /mappings/:id`
