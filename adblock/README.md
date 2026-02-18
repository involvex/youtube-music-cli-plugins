# Adblock Plugin

Block ads and sponsored content in youtube-music-cli.

## Features

- 🚫 Blocks known ad video IDs
- 🔍 Detects ads by title patterns
- 📊 Tracks blocking statistics
- ⏭️ Automatically skips detected ads

## Installation

```bash
youtube-music-cli plugins install adblock
youtube-music-cli plugins enable adblock
```

## How It Works

The plugin intercepts audio stream requests and checks tracks against:

1. **Known ad video IDs** - A blocklist of video IDs identified as ads
2. **Title patterns** - Detects titles containing "ad", "sponsored", "promo", etc.
3. **Channel patterns** - Identifies channels known for ad content

When an ad is detected, the plugin:

- Blocks the stream request (returns null)
- Logs the blocked ad
- Automatically skips to the next track

## Configuration

The plugin stores its configuration in its data directory:

```json
{
	"stats": {
		"blockedCount": 42,
		"blockedVideoIds": ["abc123", "def456"],
		"lastBlocked": "Some Ad Title"
	}
}
```

## Statistics

The plugin tracks:

- Total number of ads blocked
- Video IDs of blocked ads
- Last blocked ad title

## Permissions

This plugin requires:

- `player` - To intercept streams and control playback

## Limitations

- Cannot block all ads (YouTube frequently changes ad delivery)
- May occasionally false-positive on legitimate short tracks
- Relies on pattern matching which may need updates

## Contributing

Found an ad that slipped through? Report the video ID to help improve the blocklist!

## License

MIT
