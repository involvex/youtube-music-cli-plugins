# Lyrics Plugin

Display synchronized lyrics for the current track in youtube-music-cli.

## Features

- 📝 Fetches lyrics automatically when track changes
- 💾 Caches lyrics locally for offline access
- ⌨️ Press `l` to view lyrics
- 🔄 Syncs with playback position (when available)

## Installation

```bash
youtube-music-cli plugins install lyrics
youtube-music-cli plugins enable lyrics
```

## Usage

1. Play a song
2. Press `l` to open the lyrics view
3. Lyrics will scroll automatically with playback

## Keyboard Shortcut

| Key | Action             |
| --- | ------------------ |
| `l` | Toggle lyrics view |

## How It Works

The plugin:

1. Detects track changes
2. Fetches lyrics from public APIs (lyrics.ovh, etc.)
3. Caches lyrics locally in the plugin's data directory
4. Displays lyrics synchronized with playback

## Configuration

Lyrics are cached in:

```
~/.youtube-music-cli/plugins/lyrics/data/cache/
```

Each track's lyrics are stored as `{videoId}.json`.

## Permissions

This plugin requires:

- `player` - To get current track and playback position
- `ui` - To register the lyrics view and keyboard shortcut
- `network` - To fetch lyrics from APIs

## Limitations

- Not all songs have lyrics available
- Synchronization is approximate (based on line estimation)
- Some lyrics APIs may have rate limits

## API Sources

The plugin tries multiple lyrics sources:

- [lyrics.ovh](https://lyrics.ovh)
- Additional sources may be added

## Contributing

Want to add more lyrics sources? PRs welcome!

## License

MIT
