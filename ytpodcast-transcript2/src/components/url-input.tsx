'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { isValidYouTubeUrl, extractVideoId } from '@/lib/utils'
import { Youtube, Link, AlertCircle } from 'lucide-react'

/**
 * Form validation schema
 */
const urlInputSchema = z.object({
  url: z.string()
    .min(1, 'URL is required')
    .refine((url) => isValidYouTubeUrl(url), {
      message: 'Please enter a valid YouTube URL'
    }),
  type: z.enum(['single', 'channel', 'playlist']),
  maxVideos: z.number().min(1).max(60).optional()
})

type UrlInputForm = z.infer<typeof urlInputSchema>

interface UrlInputProps {
  onSubmit: (data: UrlInputForm) => void
  isLoading?: boolean
}

/**
 * URL Input Component
 * Handles YouTube URL input with validation and type selection
 */
export function UrlInput({ onSubmit, isLoading = false }: UrlInputProps) {
  const [urlType, setUrlType] = useState<'single' | 'channel' | 'playlist'>('single')
  const [urlPreview, setUrlPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm<UrlInputForm>({
    resolver: zodResolver(urlInputSchema),
    defaultValues: {
      url: '',
      type: 'single',
      maxVideos: 60
    }
  })

  // const watchedUrl = watch('url') // Unused for now

  // Update URL type when URL changes
  const handleUrlChange = (url: string) => {
    if (url && isValidYouTubeUrl(url)) {
      const videoId = extractVideoId(url)
      if (videoId) {
        if (url.includes('/watch?v=') || url.includes('youtu.be/')) {
          setUrlType('single')
          setValue('type', 'single')
        } else if (url.includes('/channel/') || url.includes('/@')) {
          setUrlType('channel')
          setValue('type', 'channel')
        } else if (url.includes('/playlist')) {
          setUrlType('playlist')
          setValue('type', 'playlist')
        }
        setUrlPreview(videoId)
      }
    } else {
      setUrlPreview(null)
    }
  }

  const handleFormSubmit = (data: UrlInputForm) => {
    onSubmit(data)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-6 w-6 text-red-500" />
          YouTube Transcript Downloader
        </CardTitle>
        <CardDescription>
          Enter a YouTube URL to download and process transcripts with advanced deduplication and speaker detection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-10"
                {...register('url')}
                onChange={(e) => {
                  register('url').onChange(e)
                  handleUrlChange(e.target.value)
                }}
              />
            </div>
            {errors.url && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.url.message}</AlertDescription>
              </Alert>
            )}
            {urlPreview && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">Detected: {urlType}</Badge>
                <span>ID: {urlPreview}</span>
              </div>
            )}
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type">Processing Type</Label>
            <Select
              value={urlType}
              onValueChange={(value: 'single' | 'channel' | 'playlist') => {
                setUrlType(value)
                setValue('type', value)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select processing type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Video</SelectItem>
                <SelectItem value="channel">Channel (up to 60 videos)</SelectItem>
                <SelectItem value="playlist">Playlist (up to 60 videos)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Videos (for channels/playlists) */}
          {urlType !== 'single' && (
            <div className="space-y-2">
              <Label htmlFor="maxVideos">Maximum Videos to Process</Label>
              <Select
                defaultValue="60"
                onValueChange={(value) => setValue('maxVideos', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select max videos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 videos</SelectItem>
                  <SelectItem value="25">25 videos</SelectItem>
                  <SelectItem value="50">50 videos</SelectItem>
                  <SelectItem value="60">60 videos (maximum)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Example URLs */}
          <div className="space-y-2">
            <Label>Example URLs</Label>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>• Single video: <code className="bg-muted px-1 rounded">https://www.youtube.com/watch?v=VIDEO_ID</code></div>
              <div>• Channel: <code className="bg-muted px-1 rounded">https://www.youtube.com/@channelname</code></div>
              <div>• Playlist: <code className="bg-muted px-1 rounded">https://www.youtube.com/playlist?list=PLAYLIST_ID</code></div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isValid || isLoading}
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Youtube className="h-4 w-4 mr-2" />
                Download Transcript
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
