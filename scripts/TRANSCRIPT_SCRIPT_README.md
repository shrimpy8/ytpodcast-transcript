# YouTube Podcast Channel Transcript Downloader

A comprehensive shell script that downloads and processes transcripts from all episodes in a YouTube podcast channel or playlist. The script extracts clean, deduplicated transcripts suitable for further processing such as summarization.

## Features

- **Batch Processing**: Downloads transcripts from all videos in a YouTube channel or playlist
- **Intelligent Deduplication**: Removes repetitive content common in auto-generated transcripts
- **Speaker Detection**: Automatically identifies and labels Host/Guest speakers based on content patterns
- **Clean Output**: Removes timestamps, sequence numbers, and formatting artifacts
- **Fallback Support**: Works with or without Python (with reduced functionality)
- **Robust Error Handling**: Continues processing even when some videos lack transcripts

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

### Basic Usage
```bash
./ytpodcast_channel_transcript_downloader.sh <playlist_or_channel_url>
```

### Examples
```bash
# Process a specific playlist
./ytpodcast_channel_transcript_downloader.sh "https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMhI_0NMIx4zjJ_LCo"

# Process all videos from a channel
./ytpodcast_channel_transcript_downloader.sh "https://www.youtube.com/@channelname"
```

## How It Works

### 1. Video Discovery
- Extracts video IDs and titles from the provided channel/playlist URL
- Creates a processing queue with all available videos

### 2. Subtitle Download
- Downloads auto-generated subtitles in SRT format using yt-dlp
- Supports English subtitles with automatic language detection
- Skips videos without available transcripts

### 3. Content Processing

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

### 4. File Organization
- Creates `transcripts/` directory for output files
- Names files using format: `{number}_{video_id}_{clean_title}.txt`
- Includes metadata (title, video ID, URL) in each transcript file

## Output Structure

Each generated transcript file contains:

```
# Video Title
Video ID: ABC123DEF456
URL: https://www.youtube.com/watch?v=ABC123DEF456

## Transcript:

**Host**: Welcome back to the show today we have...

**Guest**: Thanks for having me on the podcast...

---
*Note: Speaker identification is automated and may not be 100% accurate.*
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

## Limitations

- Only processes videos with available auto-generated or manual subtitles
- Speaker detection accuracy depends on content patterns (typical podcast format)
- Requires stable internet connection for downloading subtitles
- Processing time scales with number of videos in channel/playlist

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