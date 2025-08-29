# YouTube Transcript Downloader Utility

A comprehensive shell script that downloads and processes transcripts from YouTube videos. Supports both single video processing and batch processing of entire channels/playlists. The script extracts clean, deduplicated transcripts suitable for further processing such as summarization.

## Features

- **Interactive User Interface**: Welcome screen with clear options for single videos or channels
- **Dual Processing Modes**: 
  - Single video transcript download with confirmation
  - Channel/playlist batch processing (up to 60 videos)
- **Intelligent Deduplication**: Removes repetitive content common in auto-generated transcripts
- **Speaker Detection**: Automatically identifies and labels Host/Guest speakers based on content patterns
- **Clean Output**: Removes timestamps, sequence numbers, and formatting artifacts
- **Video Metadata**: Includes video titles, URLs, and publish dates in all outputs
- **Run Summary Files**: Creates timestamped summary files with complete video information
- **Interactive Batch Navigation**: Browse through videos in groups of 5 with user control
- **60-Video Limit**: Processes maximum first 60 videos from channels to ensure reasonable processing times
- **Input Validation**: Comprehensive error handling for URLs and user choices
- **Fallback Support**: Works with or without Python (with reduced functionality)
- **Best Effort Processing**: Clear disclaimers about transcript quality and potential duplicates

## Prerequisites

### Required Dependencies
- `yt-dlp` - For downloading YouTube content and subtitles
- `bash` - Shell environment (Linux/macOS/WSL)

### Optional Dependencies
- `python3` - Enables advanced deduplication and speaker detection features

### Installation

1. **Install yt-dlp**:
   ```bash
   # Using pip
   pip install yt-dlp
   
   # Using homebrew (macOS)
   brew install yt-dlp
   
   # Using apt (Ubuntu/Debian)
   sudo apt install yt-dlp
   ```

2. **Make script executable**:
   ```bash
   chmod +x ytpodcast_channel_transcript_downloader.sh
   ```

## Usage

### Interactive Mode
Simply run the script and follow the interactive prompts:
```bash
./ytpodcast_channel_transcript_downloader.sh
```

The script will present you with three options:
1. **Download transcripts from a YouTube channel** - Process up to 60 videos from a channel/playlist
2. **Download transcript from a single YouTube video** - Process one specific video
3. **Exit** - Quit the application

### Single Video Mode
When you select option 2:
1. Enter a YouTube video URL (e.g., `https://www.youtube.com/watch?v=VIDEO_ID`)
2. Review the video details (title, publish date, URL)
3. Confirm whether to proceed with transcript processing
4. Get instant results with summary file

### Channel Mode  
When you select option 1:
1. Enter a channel or playlist URL
2. View total video count and first 60 videos limit notification
3. Browse videos in batches of 5 with titles, URLs, and publish dates
4. Choose to process current batch, skip to next 5, or exit
5. Navigate through all available videos with user control

### Example URLs
```bash
# Single video
https://www.youtube.com/watch?v=dQw4w9WgXcQ

# Channel
https://www.youtube.com/@channelname

# Playlist
https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMhI_0NMIx4zjJ_LCo
```

## How It Works

### 1. User Interface & Input Validation
- **Interactive Welcome Screen**: Presents clear options and usage information
- **URL Validation**: Checks for valid YouTube URLs and provides helpful examples
- **Input Sanitization**: Validates user choices and handles errors gracefully
- **Confirmation Prompts**: Asks for user confirmation before processing (especially for single videos)

### 2. Video Discovery & Metadata Extraction
- Extracts video IDs, titles, and **publish dates** from provided URLs
- **60-Video Limit**: For channels, processes maximum first 60 videos to ensure reasonable processing times
- Creates comprehensive metadata for summary files
- Displays video information with publish dates for user review

### 3. Subtitle Download
- Downloads auto-generated subtitles in SRT format using yt-dlp
- Supports English subtitles with automatic language detection
- Skips videos without available transcripts

### 4. Content Processing

#### With Python (Advanced Mode)
- **Text Extraction**: Parses SRT files to extract clean text segments
- **Aggressive Deduplication**: 
  - Removes repeated phrases using regex patterns
  - Eliminates immediate word repetitions
  - Deduplicates at sentence level using normalized comparison
- **Speaker Detection**: Identifies Host/Guest speakers using content pattern analysis
- **Output Formatting**: Structures transcript with speaker labels and clean formatting

#### Without Python (Fallback Mode)
- Basic cleanup using shell tools (grep, sed, awk)
- Removes timestamps and sequence numbers
- Simple duplicate line detection
- Less sophisticated but still functional

### 5. File Organization & Summary Generation
- **Transcript Files**: Creates `transcripts/` directory for output files
- **File Naming**: Uses format `{number}_{video_id}_{clean_title}.txt`
- **Enhanced Metadata**: Includes title, video ID, URL, and **publish date** in each transcript file
- **Run Summary Files**: Creates timestamped summary file `yt-transcript-run_YYYYMMDD_HHMMSS.txt` containing:
  - Complete session information
  - All video titles, URLs, and publish dates
  - Channel name or video details
  - Total video count and processing timestamp

## Output Structure

Each generated transcript file contains:

### Transcript Files
```
# Video Title
Video ID: ABC123DEF456
URL: https://www.youtube.com/watch?v=ABC123DEF456
Published: January 15, 2024

## Transcript:

**Host**: Welcome back to the show today we have...

**Guest**: Thanks for having me on the podcast...

---
*Note: Speaker identification is automated and may not be 100% accurate.*
```

### Summary Files (yt-transcript-run_YYYYMMDD_HHMMSS.txt)
```
YouTube Transcript Download Summary
Generated: Thu Jan 15 14:30:22 PST 2024
==========================================

Type: Channel/Playlist
Channel Name: AI Podcast Network
Source URL: https://www.youtube.com/@aipodcast
Total Videos: 25

Videos available:
1. Building AI Systems at Scale
   URL: https://www.youtube.com/watch?v=ABC123
   Published: January 14, 2024

2. The Future of Machine Learning
   URL: https://www.youtube.com/watch?v=DEF456
   Published: January 12, 2024
...
```

## Configuration

### Directory Structure
- `transcripts/` - Output directory for processed transcripts
- `temp/` - Temporary directory (automatically cleaned up)

### Customization Options
You can modify these variables in the script:
```bash
OUTPUT_DIR="transcripts"  # Change output directory
TEMP_DIR="temp"          # Change temporary directory
```

## Advanced Features

### Deduplication Algorithm
The script implements multi-pass deduplication:
1. **Artifact Removal**: Cleans formatting characters and HTML tags
2. **Phrase Deduplication**: Removes repeated phrases of 2-10 words
3. **Word Repetition**: Eliminates immediate word duplications
4. **Sentence-Level**: Normalizes and deduplicates complete sentences

### Speaker Detection Patterns
- **Host Indicators**: "welcome back", "thanks for joining", "can you tell us"
- **Guest Indicators**: "thanks for having me", "in my experience", "what we found"
- Automatically switches speaker labels based on detected patterns

## Limitations & Disclaimers

- **Transcript Quality**: Best effort processing - transcripts may not be 100% clean and may contain duplicate sentences or formatting issues
- **Subtitle Dependency**: Only processes videos with available auto-generated or manual subtitles
- **Speaker Detection**: Accuracy depends on content patterns (optimized for typical podcast format)
- **60-Video Limit**: Channels are limited to first 60 videos to ensure reasonable processing times
- **Network Dependency**: Requires stable internet connection for downloading subtitles and video metadata
- **Processing Time**: Scales with number of videos selected for processing
- **Date Formatting**: Publish dates depend on YouTube metadata availability

## Future Enhancement Opportunities

The script is designed as a preprocessing step for further AI-powered analysis:

- **Summarization**: Use the clean transcripts with LLM APIs (OpenAI, Anthropic, etc.)
- **Topic Extraction**: Apply NLP techniques to identify key themes
- **Sentiment Analysis**: Analyze host/guest interactions and emotional content
- **Search Index**: Create searchable database of podcast content
- **Content Recommendations**: Build recommendation systems based on transcript content

## Troubleshooting

### Common Issues

1. **"yt-dlp command not found"**
   ```bash
   # Install yt-dlp using your package manager
   pip install yt-dlp
   ```

2. **No transcripts found**
   - Some videos may not have auto-generated subtitles
   - Try different channels or playlists
   - Check video accessibility (not private/restricted)

3. **Python errors**
   - Ensure Python 3 is installed: `python3 --version`
   - Script falls back to shell-only mode if Python is unavailable

4. **Permission denied**
   ```bash
   chmod +x ytpodcast_channel_transcript_downloader.sh
   ```

### Debug Mode
Add debug output by modifying the script to include:
```bash
set -x  # Enable debug mode
set -e  # Exit on error
```

## Contributing

Potential improvements:
- Add support for multiple languages
- Implement more sophisticated speaker detection
- Add progress bars for long-running processes
- Support for custom output formats (JSON, CSV)
- Integration with transcript databases

## License

This script is provided as-is for educational and personal use. Ensure compliance with YouTube's Terms of Service when processing content.