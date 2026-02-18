# Desktop Notifications Plugin

Get desktop notifications when the track changes.

## Features

- 🔔 Notification on track change
- 🖥️ Cross-platform support (Windows, macOS, Linux)
- ⚙️ Configurable notification behavior
- 🎨 Shows track title and artist

## Installation

```bash
youtube-music-cli plugins install notifications
youtube-music-cli plugins enable notifications
```

## How It Looks

When a track changes:

**macOS:**

```
┌────────────────────────────┐
│ 🎵 Song Title              │
│ by Artist Name             │
│ Album Name                 │
└────────────────────────────┘
```

**Windows:**
Toast notification with track info

**Linux:**
Native notification via notify-send

## Configuration

```json
{
	"notifications": {
		"enabled": true,
		"showOnPlay": true,
		"showOnPause": false,
		"showArtwork": true,
		"duration": 5000
	}
}
```

### Options

| Option        | Default | Description                         |
| ------------- | ------- | ----------------------------------- |
| `enabled`     | `true`  | Enable/disable notifications        |
| `showOnPlay`  | `true`  | Show notification on track change   |
| `showOnPause` | `false` | Show notification when paused       |
| `showArtwork` | `true`  | Include album art (where supported) |
| `duration`    | `5000`  | How long to show notification (ms)  |

## Platform Support

| Platform | Method                         |
| -------- | ------------------------------ |
| macOS    | AppleScript (`osascript`)      |
| Linux    | `notify-send`                  |
| Windows  | PowerShell toast notifications |

### Linux Requirements

Make sure `notify-send` is installed:

```bash
# Ubuntu/Debian
sudo apt install libnotify-bin

# Arch
sudo pacman -S libnotify

# Fedora
sudo dnf install libnotify
```

## Permissions

This plugin requires:

- `player` - To get track information
- `config` - To store notification preferences

## Troubleshooting

### Notifications not showing

**macOS:**

- Check System Preferences → Notifications → Terminal
- Allow notifications for Terminal/iTerm

**Linux:**

- Ensure `notify-send` is installed
- Check your notification daemon is running

**Windows:**

- Check Focus Assist settings
- Ensure toast notifications are enabled

### Notifications too frequent

Set `showOnPause: false` in config

## License

MIT
