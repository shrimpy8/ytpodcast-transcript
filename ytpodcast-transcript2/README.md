# YouTube Transcript Downloader 2.0

A modern Next.js application for downloading and processing YouTube video transcripts with advanced deduplication, speaker detection, and multiple export formats. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Features

### Core Functionality
- **Single Video Processing**: Download transcripts from individual YouTube videos
- **Batch Processing**: Process entire channels or playlists (up to 60 videos)
- **Real-time Progress Tracking**: Live updates for batch processing jobs
- **Multiple Export Formats**: TXT, JSON, SRT, and WebVTT formats

### Advanced Processing
- **Intelligent Deduplication**: Removes repetitive content and formatting artifacts
- **Speaker Detection**: Automatically identifies Host/Guest speakers using content patterns
- **Text Normalization**: Cleans HTML tags, brackets, and whitespace
- **Metadata Extraction**: Includes video information, timing, and statistics

### User Experience
- **Modern UI/UX**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Validation**: Instant URL validation and type detection
- **Progress Indicators**: Visual feedback for all operations
- **Error Handling**: Comprehensive error messages and recovery options

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15+ with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Language**: TypeScript with strict type checking
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **YouTube API**: youtube-transcript library

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── transcript/    # Transcript processing endpoints
│   │   └── export/        # Export functionality
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Main application page
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── url-input.tsx     # URL input with validation
│   ├── transcript-display.tsx  # Transcript viewer
│   └── progress-tracker.tsx    # Batch processing progress
├── lib/                   # Utility functions
│   ├── utils.ts          # Centralized utilities
│   └── transcript-processor.ts  # Advanced processing logic
└── types/                 # TypeScript definitions
    └── index.ts          # Type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ytpodcast-transcript2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 📖 Usage

### Single Video Processing

1. **Enter YouTube URL**: Paste any YouTube video URL
2. **Select Processing Type**: Choose "Single Video"
3. **Configure Options**: Set speaker detection and deduplication preferences
4. **Process**: Click "Download Transcript" to start processing
5. **View Results**: Review the processed transcript with speaker labels
6. **Export**: Download in your preferred format (TXT, JSON, SRT, WebVTT)

### Batch Processing

1. **Enter Channel/Playlist URL**: Paste a YouTube channel or playlist URL
2. **Select Processing Type**: Choose "Channel" or "Playlist"
3. **Set Limits**: Configure maximum videos to process (up to 60)
4. **Start Processing**: Click "Download Transcript" to begin batch processing
5. **Monitor Progress**: Watch real-time progress updates
6. **View Results**: Access processed transcripts when complete

### Supported URL Formats

- **Single Video**: 
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`

- **Channel**:
  - `https://www.youtube.com/@channelname`
  - `https://www.youtube.com/channel/CHANNEL_ID`

- **Playlist**:
  - `https://www.youtube.com/playlist?list=PLAYLIST_ID`

## 🔧 API Endpoints

### Transcript Processing
- `POST /api/transcript` - Process single video transcript
- `POST /api/transcript/batch` - Start batch processing
- `GET /api/transcript/batch/[jobId]` - Get batch processing status
- `DELETE /api/transcript/batch/[jobId]` - Cancel batch processing

### Export
- `POST /api/export` - Export transcript in various formats
- `GET /api/export` - Get available export formats

## 🎨 Components

### UrlInput
- URL validation and type detection
- Processing options configuration
- Real-time feedback and examples

### TranscriptDisplay
- Formatted transcript with speaker labels
- Statistics and metadata display
- Export options and copy functionality

### ProgressTracker
- Real-time batch processing updates
- Job status monitoring
- Cancel functionality

## 🔍 Advanced Features

### Deduplication Algorithm
The application implements a sophisticated multi-pass deduplication system:

1. **Artifact Removal**: Cleans HTML tags and formatting characters
2. **Phrase Deduplication**: Removes repeated phrases of 2-10 words
3. **Word Repetition**: Eliminates immediate word duplications
4. **Sentence-Level**: Normalizes and deduplicates complete sentences

### Speaker Detection
Automatic speaker identification using content pattern analysis:

**Host Patterns**:
- "welcome back", "thanks for joining", "can you tell us"
- "so tell me", "that's interesting", "before we"

**Guest Patterns**:
- "thanks for having me", "absolutely", "what i did"
- "in my experience", "what we found", "the way i"

### Export Formats

- **TXT**: Clean text with speaker labels and metadata
- **JSON**: Structured data with full transcript information
- **SRT**: Standard subtitle format with timestamps
- **WebVTT**: Web video text track format

## 🛠️ Development

### Code Standards
This project follows strict development standards defined in `.cursorrules`:

- **TypeScript**: Comprehensive interfaces, zero `any` types
- **Centralized Utilities**: All common operations use centralized functions
- **Error Handling**: Proper error boundaries and user feedback
- **Performance**: <2s page loads, <500ms API responses
- **Accessibility**: WCAG compliant, semantic HTML

### Key Principles
- **Mobile-First**: Responsive design with proper breakpoints
- **Component Reusability**: Build for cross-feature usage
- **Input Validation**: Sanitize all user inputs
- **Loading States**: Always show indicators for async operations

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables if needed
3. Deploy automatically on push to main branch

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📊 Performance

### Benchmarks
- **Bundle Size**: <1MB initial JavaScript
- **Load Time**: <2s initial page load
- **API Response**: <500ms standard operations
- **Memory Usage**: <100MB typical operations

### Optimization
- Server-side rendering with Next.js App Router
- Optimized bundle splitting
- Efficient state management
- Minimal re-renders with React hooks

## 🔒 Security

### Input Validation
- URL sanitization and validation
- Request schema validation with Zod
- XSS protection through proper escaping
- Rate limiting for API endpoints

### Data Protection
- No persistent storage of user data
- Temporary processing only
- Secure API endpoints
- HTTPS enforcement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards in `.cursorrules`
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- YouTube transcript extraction via [youtube-transcript](https://www.npmjs.com/package/youtube-transcript)

## 📞 Support

For support, feature requests, or bug reports, please open an issue on GitHub.

---

**Note**: This application is for educational and personal use. Ensure compliance with YouTube's Terms of Service when processing content.