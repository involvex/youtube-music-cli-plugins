# Last.fm Scrobbler Plugin

Scrobble your music to Last.fm to build your listening history.

## Features

- 📊 Scrobbles tracks to your Last.fm profile
- 🎵 Updates "Now Playing" status in real-time
- 💾 Queues failed scrobbles for retry
- ⚙️ Configurable scrobble threshold

## Installation

```bash
youtube-music-cli plugins install scrobbler
youtube-music-cli plugins enable scrobbler
```

## Configuration

You need to configure your Last.fm API credentials:

1. **Get API credentials** from [Last.fm API](https://www.last.fm/api/account/create)

2. **Configure the plugin** by editing the config:

```json
{
	"lastfm": {
		"apiKey": "your_api_key",
		"apiSecret": "your_api_secret",
		"sessionKey": "your_session_key",
		"username": "your_username"
	}
}
```

### Getting a Session Key

1. Create an application at [Last.fm API](https://www.last.fm/api/account/create)
2. Use the Last.fm authentication flow to get a session key
3. Alternatively, use a tool like [lastfm-session-key](https://github.com/jackschmidt/lastfm-session-key)

## How It Works

The plugin:

1. Detects when a track starts playing
2. Sends "Now Playing" update to Last.fm immediately
3. Scrobbles the track after 50% has been played (or 4 minutes)
4. If scrobble fails, queues it for later retry

## Scrobble Rules

Following Last.fm guidelines:

- Track must be played for at least 50% of its duration
- OR at least 4 minutes (for long tracks)
- Track must be at least 30 seconds long

## Pending Scrobbles

If a scrobble fails (network issue, etc.), it's saved locally and retried:

- On plugin enable
- Periodically during playback

View pending scrobbles in:

```
~/.youtube-music-cli/plugins/scrobbler/data/
```

## Permissions

This plugin requires:

- `player` - To track playback state and duration
- `config` - To store API credentials and pending scrobbles
- `network` - To communicate with Last.fm API

## Troubleshooting

### "Not configured" warning

Set your Last.fm API credentials in the config.

### Scrobbles not appearing

- Check your API key and session key are valid
- Ensure you've played at least 50% of the track
- Check pending scrobbles for failures

### Authentication errors

Your session key may have expired. Generate a new one.

## License

MIT
