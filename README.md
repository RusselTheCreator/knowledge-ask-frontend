# Knowledge Ask Frontend

A modern React + TypeScript frontend for the Knowledge Ask RAG-powered Q&A system. Upload documents, ask questions, and get AI-generated answers with source citations.

## Features

- **User Authentication**: JWT-based register/login with secure token storage
- **Document Upload**: Drag-and-drop or click to upload PDF, TXT, MD, DOCX, and CSV files
- **File Management**: View, download, and delete uploaded documents
- **AI-Powered Q&A**: Ask questions and get answers with source citations
- **Question History**: Browse previous questions and answers
- **Modern UI**: Clean, responsive interface with gradient design
- **Error Handling**: Comprehensive error messages and loading states

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Playwright** - E2E testing

## Prerequisites

- Node.js 18+ (for ES modules)
- npm or yarn
- Backend API running (see [knowledge-ask-api](https://github.com/RusselTheCreator/knowledge-ask-api))

## Local Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/RusselTheCreator/knowledge-ask-frontend.git
cd knowledge-ask-frontend

# Install dependencies
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and set the API base URL:

```env
VITE_API_BASE_URL=http://localhost:6544
```

**Important**: The API URL must point to your running backend instance.

### 3. Start Development Server

```bash
npm run dev
```

The app will start at `http://localhost:5174`

### 4. Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## API Wiring

The frontend expects the backend API to be available at the URL specified in `VITE_API_BASE_URL`.

### API Endpoints Used

- **POST** `/api/authentication/register` - User registration
- **POST** `/api/authentication/login` - User login
- **POST** `/api/files` - Upload file (multipart/form-data)
- **GET** `/api/files` - List user's files
- **GET** `/api/files/:id` - Get file metadata
- **GET** `/api/files/:id/download` - Download file
- **DELETE** `/api/files/:id` - Delete file
- **POST** `/api/ask` - Ask a question
- **GET** `/api/ask/history` - Get question history
- **GET** `/api/ask/:id` - Get specific question details

### Authentication

JWT tokens are stored in `localStorage` after successful login or registration. The token is automatically included in the `Authorization: Bearer <token>` header for all authenticated requests.

**Security Trade-off**: Using `localStorage` for JWT storage is convenient but has XSS vulnerability risks. In a production environment, consider:
- Using `httpOnly` cookies (requires backend support)
- Implementing token refresh flows
- Adding XSS protection headers
- Regular security audits

## Testing

### E2E Tests with Playwright

The project includes comprehensive end-to-end tests that cover the full user journey.

```bash
# Run tests headless
npm test

# Run tests with UI
npm run test:ui
```

**Test Coverage**:
- User registration and login
- Document upload
- File list, download, and delete
- Question asking with answer retrieval
- Error handling

**Note**: Tests gracefully skip if the backend API is not available, preventing CI/CD failures.

## Deployment to Render (Static Site)

This app is configured for deployment to [Render](https://render.com/) as a Static Site.

### Quick Deploy

1. **Push to GitHub** (if not already done):
   ```bash
   git push origin main
   ```

2. **Create Render Static Site**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Static Site"
   - Connect your GitHub repository: `RusselTheCreator/knowledge-ask-frontend`
   - Render will auto-detect `render.yaml` configuration

3. **Configure Environment Variable**:
   - In Render dashboard, set environment variable:
     - Key: `VITE_API_BASE_URL`
     - Value: Your deployed backend URL (e.g., `https://your-api.onrender.com`)

4. **Deploy**:
   - Click "Create Static Site"
   - Render will automatically build and deploy

### render.yaml Configuration

The included `render.yaml` configures:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `./dist`
- **Environment Variable**: `VITE_API_BASE_URL` (sync: false, requires manual setup)

### Important Notes for Render Deployment

1. **Environment Variables**: 
   - Must be set in Render dashboard (not in repo for security)
   - Set `VITE_API_BASE_URL` to your **deployed backend URL**
   - DO NOT commit `.env` files with production URLs

2. **CORS Configuration**:
   - Ensure your backend API allows requests from your Render frontend domain
   - Update `CORS_ALLOWED_ORIGINS` in backend `.env`

3. **Auto-Deploy**:
   - Render auto-deploys on every push to `main` branch
   - Check deploy logs if build fails

4. **Static Site Limitations**:
   - No server-side rendering
   - All routes served as client-side (SPA)
   - API calls made from browser to backend

## Project Structure

```
knowledge-ask-frontend/
├── src/
│   ├── components/         # React components
│   │   ├── Auth.tsx        # Login/Register form
│   │   ├── FileUpload.tsx  # File upload with drag-drop
│   │   ├── FileList.tsx    # File management grid
│   │   └── AskQuestion.tsx # Q&A interface with history
│   ├── services/           # API service layers
│   │   ├── api.ts          # Base API client
│   │   ├── auth.ts         # Authentication service
│   │   ├── files.ts        # File management service
│   │   └── ask.ts          # Q&A service
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles
├── tests/                  # Playwright E2E tests
│   └── e2e.spec.ts
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── playwright.config.ts    # Playwright configuration
├── render.yaml             # Render deployment config
├── .env.example            # Environment variable template
└── package.json            # Dependencies and scripts
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:6544` | Yes |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 5174 |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Playwright E2E tests |
| `npm run test:ui` | Run Playwright tests with UI |

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Troubleshooting

### API Connection Errors

**Problem**: "Failed to fetch" or CORS errors

**Solution**:
1. Verify backend API is running
2. Check `VITE_API_BASE_URL` in `.env`
3. Ensure backend CORS allows your frontend origin
4. Check browser console for detailed errors

### Build Fails

**Problem**: TypeScript or build errors

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

### Tests Fail

**Problem**: Playwright tests fail

**Solution**:
1. Ensure backend API is running on `localhost:6544`
2. Install Playwright browsers: `npx playwright install`
3. Run tests with debug: `npm test -- --debug`

### Token Expired

**Problem**: "Unauthorized" errors after some time

**Solution**:
- JWT tokens expire after 1 hour (backend default)
- Logout and login again
- Consider implementing token refresh in production

## Security Considerations

1. **JWT Storage**: Tokens stored in `localStorage` (see API Wiring section for trade-offs)
2. **No Secrets in Repo**: Never commit `.env` files with real credentials
3. **HTTPS Required**: Use HTTPS in production (Render provides this automatically)
4. **CORS**: Ensure backend only allows trusted origins
5. **Input Validation**: Backend validates all inputs; frontend provides UX validation

## Contributing

This project was created by a Cursor Cloud Agent. Contributions welcome!

## License

MIT

## Related Projects

- [Knowledge Ask API](https://github.com/RusselTheCreator/knowledge-ask-api) - Backend API

---

**Questions?** Check the [API documentation](https://github.com/RusselTheCreator/knowledge-ask-api) or open an issue!
