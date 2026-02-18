# youtube-music-cli Plugins

Official plugin repository for [youtube-music-cli](https://github.com/involvex/youtube-music-cli).

## Available Plugins

| Plugin                           | Description                             | Version |
| -------------------------------- | --------------------------------------- | ------- |
| [adblock](./adblock)             | Block ads and sponsored content         | 1.0.0   |
| [lyrics](./lyrics)               | Display synchronized lyrics             | 1.0.0   |
| [scrobbler](./scrobbler)         | Scrobble tracks to Last.fm              | 1.0.0   |
| [discord-rpc](./discord-rpc)     | Discord Rich Presence integration       | 1.0.0   |
| [notifications](./notifications) | Desktop notifications for track changes | 1.0.0   |

## Installation

### From this repository (default)

```bash
# Install by plugin name
youtube-music-cli plugins install adblock
youtube-music-cli plugins install lyrics
```

### From GitHub URL

```bash
youtube-music-cli plugins install https://github.com/involvex/youtube-music-cli-plugins
```

## Plugin Structure

Each plugin follows this structure:

```
plugin-name/
├── plugin.json    # Plugin manifest
├── index.ts       # Main entry point
└── README.md      # Documentation
```

### plugin.json

```json
{
	"id": "plugin-name",
	"name": "Plugin Name",
	"version": "1.0.0",
	"description": "What this plugin does",
	"author": "Your Name",
	"license": "MIT",
	"main": "index.ts",
	"permissions": ["player", "ui", "config"],
	"hooks": ["track-change", "play", "pause"]
}
```

## Creating Your Own Plugin

1. **Use a template:**

   ```bash
   # In the main youtube-music-cli repo
   cp -r templates/plugin-basic my-plugin
   ```

2. **Edit your plugin:**
   - Update `plugin.json` with your plugin info
   - Implement your logic in `index.ts`

3. **Test locally:**

   ```bash
   youtube-music-cli plugins install /path/to/my-plugin
   youtube-music-cli plugins enable my-plugin
   ```

4. **Submit to this repo:**
   - Fork this repository
   - Add your plugin directory
   - Submit a pull request

## Plugin Permissions

| Permission   | Description                                     |
| ------------ | ----------------------------------------------- |
| `player`     | Control playback, access queue, intercept audio |
| `ui`         | Register views, add keyboard shortcuts          |
| `filesystem` | Read/write files in plugin data directory       |
| `network`    | Make network requests                           |
| `config`     | Read/write application configuration            |

## Documentation

- [Plugin API Reference](https://involvex.github.io/youtube-music-cli/PLUGIN_API)
- [Plugin Development Guide](https://involvex.github.io/youtube-music-cli/PLUGIN_DEVELOPMENT)

## Contributing

1. Fork this repository
2. Create your plugin in a new directory
3. Test thoroughly with youtube-music-cli
4. Submit a pull request

### Guidelines

- Follow the plugin structure above
- Include a comprehensive README
- Request only necessary permissions
- Handle errors gracefully
- Don't include malicious code

## License

MIT © [Involvex](https://github.com/involvex)
