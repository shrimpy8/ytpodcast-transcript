#!/bin/bash

# Improved YouTube transcript downloader with aggressive deduplication
# Configuration
PLAYLIST_URL="$1"
OUTPUT_DIR="transcripts"
TEMP_DIR="temp"

if [ -z "$PLAYLIST_URL" ]; then
    echo "Usage: $0 <playlist_or_channel_url>"
    echo "Example: $0 https://www.youtube.com/playlist?list=..."
    echo "Example: $0 https://www.youtube.com/@channelname"
    exit 1
fi

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

# Create directories
mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"

echo "Extracting video information..."
yt-dlp --get-id --get-title "$PLAYLIST_URL" > "$TEMP_DIR/video_info.txt"

video_count=$(wc -l < "$TEMP_DIR/video_info.txt")
video_pairs=$((video_count / 2))

echo "Found $video_pairs videos"

# Process each video
line_num=1
video_num=1
while [ $line_num -le $video_count ]; do
    title=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
    line_num=$((line_num + 1))
    video_id=$(sed -n "${line_num}p" "$TEMP_DIR/video_info.txt")
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

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "Transcript extraction complete!"
echo "Files created in $OUTPUT_DIR/:"
ls -1 "$OUTPUT_DIR" | head -5
if [ $(ls -1 "$OUTPUT_DIR" | wc -l) -gt 5 ]; then
    echo "... and $(($(ls -1 "$OUTPUT_DIR" | wc -l) - 5)) more files"
fi