# Discord Rich Presence Plugin

Show what you're listening to on your Discord profile.

## Features

- 🎵 Display current track on Discord
- 🖼️ Show album artwork
- ⏱️ Show time remaining
- ⏸️ Show paused status
- 🔗 Quick link to track on YouTube Music

## Installation

```bash
youtube-music-cli plugins install discord-rpc
youtube-music-cli plugins enable discord-rpc
```

## How It Looks

When playing a track, your Discord status will show:

```
🎵 Listening to YouTube Music
   Song Title
   by Artist Name
   [Album Art] ▶️ 2:45 remaining
   [Listen on YouTube Music] button
```

## Configuration

Edit the config to customize:

```json
{
	"discord": {
		"enabled": true,
		"showAlbumArt": true,
		"showTimeRemaining": true,
		"showPausedStatus": true
	}
}
```

### Options

| Option              | Default | Description                    |
| ------------------- | ------- | ------------------------------ |
| `enabled`           | `true`  | Enable/disable the plugin      |
| `showAlbumArt`      | `true`  | Show album artwork in presence |
| `showTimeRemaining` | `true`  | Show progress/time remaining   |
| `showPausedStatus`  | `true`  | Show status when paused        |

## Requirements

- Discord desktop app running
- Discord Rich Presence enabled in Discord settings

## How It Works

The plugin:

1. Connects to Discord via IPC
2. Listens for playback events
3. Updates your Discord presence in real-time
4. Clears presence when playback stops

## Permissions

This plugin requires:

- `player` - To get current track and playback state
- `config` - To store plugin settings

## Troubleshooting

### Presence not showing

1. Make sure Discord is running
2. Check Discord Settings → Activity Status → "Display current activity"
3. Restart the plugin: disable then enable

### "Failed to connect to Discord"

- Discord must be running before enabling the plugin
- Try restarting Discord

### Button not clickable

Discord limits activity buttons for bots/applications. The link may not be clickable for everyone.

## Privacy

- Only shows what you're currently playing
- Clears when you stop playback
- Can be disabled at any time

## License

MIT
