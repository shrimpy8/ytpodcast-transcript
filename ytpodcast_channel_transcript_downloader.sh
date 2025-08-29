#!/bin/bash

# Improved YouTube transcript downloader with aggressive deduplication
# Configuration
OUTPUT_DIR="transcripts"
TEMP_DIR="temp"

# Welcome message and user input
echo "=================================================="
echo "  YouTube Transcript Downloader Utility"
echo "=================================================="
echo ""
echo "This simple utility helps you download text transcripts of YouTube videos."
echo "You can either provide a channel URL or a direct YouTube video URL."
echo ""
echo "Note: This is best effort transcript processing. Transcripts may not be"
echo "100% clean and there may be some duplicate sentences or formatting issues."
echo ""
echo "For channels: Processes maximum first 60 videos from the channel."
echo ""
echo "What would you like to do?"
echo "1. Download transcripts from a YouTube channel"
echo "2. Download transcript from a single YouTube video"
echo "3. Exit"
echo ""
echo -n "Enter your choice (1-3): "
read -r user_choice
echo ""

case $user_choice in
    1)
        echo "You selected: Channel URL"
        echo -n "Please enter the YouTube channel URL: "
        read -r PLAYLIST_URL
        URL_TYPE="channel"
        ;;
    2)
        echo "You selected: Direct Video URL"
        echo -n "Please enter the YouTube video URL: "
        read -r PLAYLIST_URL
        URL_TYPE="video"
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Please run the script again and select 1, 2, or 3."
        exit 1
        ;;
esac

# Validate URL input
if [ -z "$PLAYLIST_URL" ]; then
    echo "Error: No URL provided. Exiting."
    exit 1
fi

# Basic URL validation
if [[ ! "$PLAYLIST_URL" =~ ^https?://(www\.)?(youtube\.com|youtu\.be) ]]; then
    echo "Error: Please provide a valid YouTube URL."
    echo "Examples:"
    echo "  Channel: https://www.youtube.com/@channelname"
    echo "  Playlist: https://www.youtube.com/playlist?list=..."
    echo "  Video: https://www.youtube.com/watch?v=..."
    exit 1
fi

echo ""
echo "Processing URL: $PLAYLIST_URL"
echo ""

# Create timestamp for run summary
RUN_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SUMMARY_FILE="yt-transcript-run_${RUN_TIMESTAMP}.txt"

# Function to aggressively clean transcript from SRT
extract_clean_transcript() {
    local srt_file="$1"
    local output_file="$2"
    
    # Use Python for aggressive deduplication
    python3 -c "
import re
import sys
from collections import OrderedDict

def clean_srt_text(srt_file):
    try:
        with open(srt_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        with open(srt_file, 'r', encoding='latin-1') as f:
            content = f.read()
    
    # Split into subtitle blocks
    blocks = re.split(r'\n\s*\n', content.strip())
    
    # Extract and clean text from each block
    all_text_segments = []
    
    for block in blocks:
        lines = block.strip().split('\n')
        
        # Skip blocks without enough content
        if len(lines) < 3:
            continue
            
        # Extract text lines (skip sequence numbers and timestamps)
        text_lines = []
        for line in lines[2:]:  # Skip first 2 lines
            line = line.strip()
            # Skip if it looks like sequence number or timestamp
            if (line and 
                not re.match(r'^[0-9]+$', line) and 
                not re.match(r'^[0-9]{2}:[0-9]{2}:[0-9]{2}', line) and
                not re.match(r'^[0-9]+:[0-9]{2}:[0-9]{2}', line)):
                text_lines.append(line)
        
        if text_lines:
            # Join text from this subtitle block
            segment_text = ' '.join(text_lines)
            
            # Clean HTML tags and artifacts
            segment_text = re.sub(r'<[^>]+>', '', segment_text)
            segment_text = re.sub(r'\[.*?\]', '', segment_text)
            segment_text = re.sub(r'\(.*?\)', '', segment_text)
            
            # Normalize whitespace
            segment_text = ' '.join(segment_text.split())
            
            if len(segment_text.strip()) > 5:
                all_text_segments.append(segment_text)
    
    return all_text_segments

def aggressive_deduplication(segments):
    '''Apply multiple passes of deduplication'''
    if not segments:
        return []
    
    # Join all segments
    full_text = ' '.join(segments)
    
    # Step 1: Remove repeated arrows and formatting artifacts
    full_text = re.sub(r'(>>\\s*)+', '>> ', full_text)
    full_text = re.sub(r'(\\*\\*[^*]*\\*\\*:\\s*)+', '', full_text)
    
    # Step 2: Aggressive phrase deduplication
    # Remove sequences of 2+ repeated words
    for i in range(10, 1, -1):  # Start with longer phrases
        pattern = r'\\b((?:\\w+\\s+){' + str(i-1) + r'}\\w+)(?:\\s+\\1)+\\b'
        full_text = re.sub(pattern, r'\\1', full_text, flags=re.IGNORECASE)
    
    # Step 3: Remove immediate word repetitions
    full_text = re.sub(r'\\b(\\w+)\\s+\\1\\b', r'\\1', full_text, flags=re.IGNORECASE)
    
    # Step 4: Clean up multiple spaces
    full_text = re.sub(r'\\s+', ' ', full_text).strip()
    
    # Step 5: Split into sentences and remove duplicates
    sentences = re.split(r'[.!?]+', full_text)
    unique_sentences = []
    seen_normalized = set()
    
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) < 8:  # Skip very short fragments
            continue
            
        # Normalize for comparison
        normalized = re.sub(r'[^a-zA-Z0-9\\s]', '', sentence.lower())
        normalized = re.sub(r'\\s+', ' ', normalized).strip()
        
        if normalized and len(normalized) > 10 and normalized not in seen_normalized:
            unique_sentences.append(sentence)
            seen_normalized.add(normalized)
    
    return unique_sentences

def format_with_speakers(sentences):
    '''Add speaker detection'''
    if not sentences:
        return ''
    
    formatted_parts = []
    current_speaker = None
    paragraph_buffer = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
            
        # Detect speaker based on content
        new_speaker = None
        sentence_lower = sentence.lower()
        
        # Strong host indicators
        host_patterns = [
            'welcome back', 'thanks for joining', 'can you tell us', 'so tell me',
            'that\\'s interesting', 'before we', 'moving on', 'let me ask',
            'i\\'m so happy', 'okay tom', 'got it', 'this is super interesting'
        ]
        
        # Strong guest indicators
        guest_patterns = [
            'thanks for having me', 'absolutely', 'what i did', 'well thanks',
            'i think it\\'s', 'in my experience', 'what we found', 'the way i',
            'yeah i think', 'i wrote this', 'so i initially'
        ]
        
        for pattern in host_patterns:
            if pattern in sentence_lower:
                new_speaker = 'Host'
                break
        
        if not new_speaker:
            for pattern in guest_patterns:
                if pattern in sentence_lower:
                    new_speaker = 'Guest'
                    break
        
        # Add speaker label if changed or starting
        if new_speaker != current_speaker:
            # Flush previous paragraph
            if paragraph_buffer:
                formatted_parts.append(' '.join(paragraph_buffer))
                paragraph_buffer = []
            
            if new_speaker:
                formatted_parts.append(f'\\n\\n**{new_speaker}**: {sentence}')
                current_speaker = new_speaker
            else:
                paragraph_buffer.append(sentence)
        else:
            paragraph_buffer.append(sentence)
    
    # Flush remaining buffer
    if paragraph_buffer:
        formatted_parts.append(' '.join(paragraph_buffer))
    
    return ''.join(formatted_parts)

# Process the file
segments = clean_srt_text('$srt_file')
print(f'Extracted {len(segments)} raw segments')

unique_sentences = aggressive_deduplication(segments)
print(f'After deduplication: {len(unique_sentences)} unique sentences')

formatted_text = format_with_speakers(unique_sentences)

# Write to output file
with open('$output_file', 'a', encoding='utf-8') as f:
    f.write(formatted_text)
    f.write('\\n\\n---\\n')
    f.write('*Note: Speaker identification is automated and may not be 100% accurate.*\\n')

print(f'Final output: {len(formatted_text.split())} words')
"
}

# Simple fallback function for systems without Python
simple_cleanup() {
    local srt_file="$1"
    local output_file="$2"
    
    # Basic cleanup using shell tools
    grep -v "^[0-9]*$" "$srt_file" | \
    grep -v "^[0-9][0-9]:[0-9][0-9]:[0-9][0-9]" | \
    grep -v "^$" | \
    sed 's/<[^>]*>//g' | \
    # Remove consecutive duplicate lines more aggressively
    awk '{
        # Normalize line for comparison
        normalized = tolower($0)
        gsub(/[^a-z0-9 ]/, "", normalized)
        gsub(/  */, " ", normalized)
        
        # Skip if very similar to recent lines
        skip = 0
        for (i = 1; i <= 5 && i <= NR; i++) {
            if (normalized == recent[i]) {
                skip = 1
                break
            }
        }
        
        if (!skip && length(normalized) > 5) {
            print $0
            # Shift recent lines array
            for (i = 5; i > 1; i--) recent[i] = recent[i-1]
            recent[1] = normalized
        }
    }' | \
    tr '\n' ' ' | \
    sed 's/  */ /g' | \
    sed 's/^ *//;s/ *$//' >> "$output_file"
    
    echo "" >> "$output_file"
    echo "---" >> "$output_file"
    echo "*Note: Speaker identification is automated and may not be 100% accurate.*" >> "$output_file"
}

# Function to process a single video
process_single_video() {
    local title="$1"
    local video_id="$2"
    local video_url="$3"
    local video_num="$4"
    
    # Clean title for filename
    clean_title=$(echo "$title" | sed 's/[^a-zA-Z0-9 ]//g' | sed 's/ /_/g' | cut -c1-50)
    
    echo "Processing: $title"
    
    output_file="$OUTPUT_DIR/${video_num}_${video_id}_${clean_title}.txt"
    
    # Download subtitle with better options
    yt-dlp --write-auto-subs --skip-download \
           --sub-lang en --convert-subs srt \
           --sub-format "best[ext=srt]" \
           -o "$TEMP_DIR/%(id)s.%(ext)s" \
           "$video_url" 2>/dev/null
    
    # Find subtitle file
    srt_file=""
    for possible_file in "$TEMP_DIR/${video_id}.srt" "$TEMP_DIR/${video_id}.en.srt"; do
        if [[ -f "$possible_file" ]]; then
            srt_file="$possible_file"
            break
        fi
    done
    
    if [[ -n "$srt_file" && -f "$srt_file" ]]; then
        # Create file header
        {
            echo "# $title"
            echo "Video ID: $video_id"
            echo "URL: $video_url"
            echo ""
            echo "## Transcript:"
            echo ""
        } > "$output_file"
        
        # Process transcript
        if command -v python3 >/dev/null 2>&1; then
            echo "Using Python-based aggressive deduplication..."
            extract_clean_transcript "$srt_file" "$output_file"
        else
            echo "Python not found, using basic cleanup..."
            simple_cleanup "$srt_file" "$output_file"
        fi
        
        echo "✓ Created: $output_file"
        
        # Clean up temp files
        rm -f "${TEMP_DIR}/${video_id}."*
        
        return 0
    else
        echo "✗ No transcript available for: $title"
        return 1
    fi
}

# Create directories
mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"

echo "Extracting video information..."

# Branch based on URL type
if [ "$URL_TYPE" = "video" ]; then
    # Single video processing - get title, id, and upload date
    yt-dlp --get-id --get-title --get-filename -o "%(upload_date)s" "$PLAYLIST_URL" > "$TEMP_DIR/video_info.txt"
    
    video_count=$(wc -l < "$TEMP_DIR/video_info.txt")
    video_pairs=$((video_count / 3))  # Now we have title, id, and date
    
    if [ $video_pairs -eq 0 ]; then
        echo "Error: Could not extract video information. Please check the URL."
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    # Get video details
    title=$(sed -n "1p" "$TEMP_DIR/video_info.txt")
    video_id=$(sed -n "2p" "$TEMP_DIR/video_info.txt")
    upload_date=$(sed -n "3p" "$TEMP_DIR/video_info.txt")
    
    # Format upload date for display
    if [ -n "$upload_date" ] && [ "$upload_date" != "NA" ]; then
        formatted_date=$(date -j -f "%Y%m%d" "$upload_date" "+%B %d, %Y" 2>/dev/null || echo "$upload_date")
    else
        formatted_date="Unknown"
    fi
    
    echo "Found video: $title"
    echo "Published: $formatted_date"
    echo "URL: $PLAYLIST_URL"
    echo ""
    
    # Create summary file for single video immediately after extraction
    {
        echo "YouTube Transcript Download Summary"
        echo "Generated: $(date)"
        echo "=========================================="
        echo ""
        echo "Type: Single Video"
        echo "Video Title: $title"
        echo "Video URL: $PLAYLIST_URL"
        echo "Video ID: $video_id"
        echo "Published: $formatted_date"
        echo "Total Videos: 1"
        echo ""
        echo "Video information:"
        echo "1. $title"
        echo "   URL: $PLAYLIST_URL"
        echo "   Published: $formatted_date"
        echo ""
    } > "$SUMMARY_FILE"
    
    echo "Summary file created: $SUMMARY_FILE"
    echo ""
    
    # Ask for confirmation before processing
    echo -n "Do you want to proceed with downloading the transcript? (y/n): "
    read -r proceed_choice
    
    if [[ ! "$proceed_choice" =~ ^[Yy] ]]; then
        echo "Processing cancelled by user."
        rm -rf "$TEMP_DIR"
        exit 0
    fi
    
    echo ""
    
    # Process single video
    process_single_video "$title" "$video_id" "$PLAYLIST_URL" "1"
    
else
    # Channel/playlist processing - get title, id, and upload date
    yt-dlp --get-id --get-title --get-filename -o "%(upload_date)s" "$PLAYLIST_URL" > "$TEMP_DIR/video_info.txt"
    
    video_count=$(wc -l < "$TEMP_DIR/video_info.txt")
    video_pairs=$((video_count / 3))  # Now we have title, id, and date
    
    # Implement 60-video limit
    if [ $video_pairs -gt 60 ]; then
        echo "Found $video_pairs videos in channel. Limiting to first 60 videos as per policy."
        video_pairs=60
        # Truncate the file to only include first 60 videos (180 lines)
        head -n 180 "$TEMP_DIR/video_info.txt" > "$TEMP_DIR/video_info_limited.txt"
        mv "$TEMP_DIR/video_info_limited.txt" "$TEMP_DIR/video_info.txt"
        video_count=180
    fi
    
    if [ $video_pairs -eq 0 ]; then
        echo "Error: Could not extract video information. Please check the URL."
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    # Get channel name (try to extract from first video or use URL)
    channel_name="Unknown Channel"
    if command -v yt-dlp >/dev/null 2>&1; then
        channel_name=$(yt-dlp --get-filename -o "%(channel)s" "$PLAYLIST_URL" 2>/dev/null | head -1)
        if [ -z "$channel_name" ] || [ "$channel_name" = "NA" ]; then
            channel_name="YouTube Channel"
        fi
    fi
    
    echo "Found $video_pairs videos in the channel: $channel_name"
    echo ""
    
    # Create summary file header for channel
    {
        echo "YouTube Transcript Download Summary"
        echo "Generated: $(date)"
        echo "=========================================="
        echo ""
        echo "Type: Channel/Playlist"
        echo "Channel Name: $channel_name"
        echo "Source URL: $PLAYLIST_URL"
        echo "Total Videos: $video_pairs"
        echo ""
        echo "Videos available:"
    } > "$SUMMARY_FILE"
    
    # Add all videos to summary file
    line_num=1
    video_num=1
    while [ $line_num -le $video_count ]; do
        title=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
        line_num=$((line_num + 1))
        video_id=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
        line_num=$((line_num + 1))
        upload_date=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
        line_num=$((line_num + 1))
        video_url="https://www.youtube.com/watch?v=${video_id}"
        
        # Format upload date for display
        if [ -n "$upload_date" ] && [ "$upload_date" != "NA" ]; then
            formatted_date=$(date -j -f "%Y%m%d" "$upload_date" "+%B %d, %Y" 2>/dev/null || echo "$upload_date")
        else
            formatted_date="Unknown"
        fi
        
        echo "$video_num. $title" >> "$SUMMARY_FILE"
        echo "   URL: $video_url" >> "$SUMMARY_FILE"
        echo "   Published: $formatted_date" >> "$SUMMARY_FILE"
        echo "" >> "$SUMMARY_FILE"
        
        video_num=$((video_num + 1))
    done
    
    echo "Summary file created: $SUMMARY_FILE"
    echo ""
fi

# Only run interactive processing for channels, not single videos
if [ "$URL_TYPE" = "video" ]; then
    # Single video is already processed above, just clean up and exit
    echo ""
    echo "Single video processing complete!"
else
    # Continue with channel batch processing
    
# Function to display batch of videos
display_video_batch() {
    local start_video="$1"
    local batch_size=5
    local end_video=$((start_video + batch_size - 1))
    
    if [ $end_video -gt $video_pairs ]; then
        end_video=$video_pairs
    fi
    
    echo "Videos $start_video to $end_video (of $video_pairs total):"
    echo "================================================="
    
    local line_num=$(((start_video - 1) * 3 + 1))  # Now 3 lines per video
    local display_num=$start_video
    
    while [ $display_num -le $end_video ]; do
        local title=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
        line_num=$((line_num + 1))
        local video_id=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
        line_num=$((line_num + 1))
        local upload_date=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
        line_num=$((line_num + 1))
        local video_url="https://www.youtube.com/watch?v=${video_id}"
        
        # Format upload date for display
        if [ -n "$upload_date" ] && [ "$upload_date" != "NA" ]; then
            local formatted_date=$(date -j -f "%Y%m%d" "$upload_date" "+%B %d, %Y" 2>/dev/null || echo "$upload_date")
        else
            local formatted_date="Unknown"
        fi
        
        echo "$display_num. $title"
        echo "   URL: $video_url"
        echo "   Published: $formatted_date"
        echo ""
        
        display_num=$((display_num + 1))
    done
}

# Function to process selected videos
process_video_batch() {
    local start_video="$1"
    local batch_size=5
    local end_video=$((start_video + batch_size - 1))
    
    if [ $end_video -gt $video_pairs ]; then
        end_video=$video_pairs
    fi
    
    echo "Processing videos $start_video to $end_video..."
    echo ""
    
    local line_num=$(((start_video - 1) * 3 + 1))  # Now 3 lines per video
    local video_num=$start_video
    
    while [ $video_num -le $end_video ]; do
        title=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
        line_num=$((line_num + 1))
        video_id=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
        line_num=$((line_num + 1))
        upload_date=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
        line_num=$((line_num + 1))
        
        # Clean title for filename
        clean_title=$(echo "$title" | sed 's/[^a-zA-Z0-9 ]//g' | sed 's/ /_/g' | cut -c1-50)
        
        echo "Processing ($video_num/$video_pairs): $title"
        
        output_file="$OUTPUT_DIR/${video_num}_${video_id}_${clean_title}.txt"
        video_url="https://www.youtube.com/watch?v=${video_id}"
        
        # Download subtitle with better options
        yt-dlp --write-auto-subs --skip-download \
               --sub-lang en --convert-subs srt \
               --sub-format "best[ext=srt]" \
               -o "$TEMP_DIR/%(id)s.%(ext)s" \
               "$video_url" 2>/dev/null
        
        # Find subtitle file
        srt_file=""
        for possible_file in "$TEMP_DIR/${video_id}.srt" "$TEMP_DIR/${video_id}.en.srt"; do
            if [[ -f "$possible_file" ]]; then
                srt_file="$possible_file"
                break
            fi
        done
        
        if [[ -n "$srt_file" && -f "$srt_file" ]]; then
            # Create file header
            {
                echo "# $title"
                echo "Video ID: $video_id"
                echo "URL: $video_url"
                echo ""
                echo "## Transcript:"
                echo ""
            } > "$output_file"
            
            # Process transcript
            if command -v python3 >/dev/null 2>&1; then
                echo "Using Python-based aggressive deduplication..."
                extract_clean_transcript "$srt_file" "$output_file"
            else
                echo "Python not found, using basic cleanup..."
                simple_cleanup "$srt_file" "$output_file"
            fi
            
            echo "✓ Created: $output_file"
            
            # Clean up temp files
            rm -f "${TEMP_DIR}/${video_id}."*
        else
            echo "✗ No transcript available for: $title"
        fi
        
        video_num=$((video_num + 1))
    done
}

# Interactive batch processing
current_start=1

while [ $current_start -le $video_pairs ]; do
    # Display current batch
    display_video_batch $current_start
    
    # Calculate if there are more videos after this batch
    next_batch_start=$((current_start + 5))
    has_more_videos=false
    if [ $next_batch_start -le $video_pairs ]; then
        has_more_videos=true
    fi
    
    # Present options
    echo "What would you like to do?"
    echo "1. Process these videos (create markdown transcripts)"
    if [ $has_more_videos = true ]; then
        echo "2. Skip to next 5 videos"
        echo "3. Exit"
        echo -n "Enter your choice (1-3): "
    else
        echo "2. Exit"
        echo -n "Enter your choice (1-2): "
    fi
    
    read -r choice
    echo ""
    
    case $choice in
        1)
            process_video_batch $current_start
            echo "Batch processing complete!"
            echo ""
            if [ $has_more_videos = true ]; then
                echo -n "Continue to next batch? (y/n): "
                read -r continue_choice
                if [[ "$continue_choice" =~ ^[Yy] ]]; then
                    current_start=$next_batch_start
                else
                    break
                fi
            else
                echo "All videos processed!"
                break
            fi
            ;;
        2)
            if [ $has_more_videos = true ]; then
                current_start=$next_batch_start
            else
                echo "Exiting..."
                break
            fi
            ;;
        3)
            if [ $has_more_videos = true ]; then
                echo "Exiting..."
                break
            else
                echo "Invalid choice. Please try again."
            fi
            ;;
        *)
            echo "Invalid choice. Please try again."
            echo ""
            ;;
    esac
done

fi  # End of channel processing conditional

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "Session complete!"
if [ -d "$OUTPUT_DIR" ] && [ "$(ls -A $OUTPUT_DIR 2>/dev/null)" ]; then
    echo "Files created in $OUTPUT_DIR/:"
    ls -1 "$OUTPUT_DIR" | head -5
    if [ $(ls -1 "$OUTPUT_DIR" | wc -l) -gt 5 ]; then
        echo "... and $(($(ls -1 "$OUTPUT_DIR" | wc -l) - 5)) more files"
    fi
else
    echo "No transcript files were created."
fi

echo ""
echo "Summary file: $SUMMARY_FILE"