/**
 * Lyrics Plugin for youtube-music-cli
 *
 * Displays synchronized lyrics for the current track.
 * Fetches lyrics from public APIs and caches them locally.
 */

import type {
	Plugin,
	PluginManifest,
	PluginContext,
	Track,
} from '../../source/types/plugin.types.ts';

const manifest: PluginManifest = {
	id: 'lyrics',
	name: 'Lyrics',
	version: '1.0.0',
	description: 'Display synchronized lyrics for the current track',
	author: 'Involvex',
	license: 'MIT',
	main: 'index.ts',
	permissions: ['player', 'ui', 'network'],
	hooks: ['track-change', 'play', 'pause'],
	ui: {
		views: ['lyrics'],
		shortcuts: ['l'],
	},
};

interface LyricLine {
	time: number; // seconds
	text: string;
}

interface CachedLyrics {
	videoId: string;
	title: string;
	artist: string;
	lyrics: LyricLine[];
	plain: string;
	fetchedAt: number;
}

let currentLyrics: CachedLyrics | null = null;
let currentLineIndex = 0;
let lyricsCache: Map<string, CachedLyrics> = new Map();

// Simple lyrics API endpoints (these would need real implementations)
const LYRICS_APIS = [
	'https://api.lyrics.ovh/v1',
	// Add more APIs as fallbacks
];

async function fetchLyrics(
	title: string,
	artist: string,
	context: PluginContext,
): Promise<string | null> {
	// Try to fetch from APIs
	for (const apiBase of LYRICS_APIS) {
		try {
			const url = `${apiBase}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
			context.logger.debug(`Fetching lyrics from: ${url}`);

			const response = await fetch(url);
			if (response.ok) {
				const data = (await response.json()) as {lyrics?: string};
				if (data.lyrics) {
					return data.lyrics;
				}
			}
		} catch (error) {
			context.logger.debug(`Failed to fetch from API: ${error}`);
		}
	}

	return null;
}

function parseLyrics(plainLyrics: string): LyricLine[] {
	// Parse plain lyrics into lines
	// For synchronized lyrics, we'd need a different format
	const lines = plainLyrics.split('\n').filter(line => line.trim());

	return lines.map((text, index) => ({
		time: index * 4, // Rough estimate: 4 seconds per line
		text: text.trim(),
	}));
}

async function loadLyricsForTrack(
	track: Track,
	context: PluginContext,
): Promise<void> {
	const cacheKey = track.videoId;

	// Check cache first
	if (lyricsCache.has(cacheKey)) {
		currentLyrics = lyricsCache.get(cacheKey)!;
		currentLineIndex = 0;
		context.logger.info(`Loaded cached lyrics for "${track.title}"`);
		return;
	}

	// Fetch new lyrics
	const artistName = track.artists?.[0]?.name || 'Unknown Artist';
	const plainLyrics = await fetchLyrics(track.title, artistName, context);

	if (plainLyrics) {
		const lyrics = parseLyrics(plainLyrics);

		currentLyrics = {
			videoId: track.videoId,
			title: track.title,
			artist: artistName,
			lyrics,
			plain: plainLyrics,
			fetchedAt: Date.now(),
		};

		// Cache the lyrics
		lyricsCache.set(cacheKey, currentLyrics);

		// Save to filesystem for persistence
		try {
			await context.filesystem.writeFile(
				`cache/${cacheKey}.json`,
				JSON.stringify(currentLyrics),
			);
		} catch {
			// Cache write failed, not critical
		}

		context.logger.info(`Loaded lyrics for "${track.title}"`);
	} else {
		currentLyrics = null;
		context.logger.info(`No lyrics found for "${track.title}"`);
	}

	currentLineIndex = 0;
}

function getCurrentLine(positionSeconds: number): LyricLine | null {
	if (!currentLyrics || currentLyrics.lyrics.length === 0) {
		return null;
	}

	// Find the current line based on playback position
	for (let i = currentLyrics.lyrics.length - 1; i >= 0; i--) {
		if (currentLyrics.lyrics[i]!.time <= positionSeconds) {
			currentLineIndex = i;
			return currentLyrics.lyrics[i]!;
		}
	}

	return currentLyrics.lyrics[0] || null;
}

const plugin: Plugin = {
	manifest,

	async init(context: PluginContext) {
		context.logger.info('Lyrics plugin initialized');

		// Load cached lyrics from filesystem
		try {
			const files = await context.filesystem.listFiles('cache');
			for (const file of files) {
				if (file.endsWith('.json')) {
					const content = await context.filesystem.readFile(`cache/${file}`);
					const cached = JSON.parse(content) as CachedLyrics;
					lyricsCache.set(cached.videoId, cached);
				}
			}
			context.logger.debug(`Loaded ${lyricsCache.size} cached lyrics`);
		} catch {
			// No cache yet
		}

		// Register keyboard shortcut
		context.registerShortcut(['l'], () => {
			if (currentLyrics) {
				// Display lyrics in a view
				context.navigation.navigate('lyrics');
			} else {
				context.logger.info('No lyrics available for current track');
			}
		});

		// Listen for track changes
		context.on('track-change', async event => {
			if (event.track) {
				await loadLyricsForTrack(event.track, context);
			} else {
				currentLyrics = null;
			}
		});

		// Load lyrics for current track if playing
		const currentTrack = context.player.getCurrentTrack();
		if (currentTrack) {
			await loadLyricsForTrack(currentTrack, context);
		}
	},

	async enable(context: PluginContext) {
		context.logger.info('Lyrics plugin enabled');
	},

	async disable(context: PluginContext) {
		context.logger.info('Lyrics plugin disabled');
		currentLyrics = null;
	},

	async destroy(context: PluginContext) {
		context.logger.info('Lyrics plugin destroyed');
		lyricsCache.clear();
	},
};

// Export helpers for the lyrics view
export function getLyrics(): CachedLyrics | null {
	return currentLyrics;
}

export function getLyricLine(position: number): LyricLine | null {
	return getCurrentLine(position);
}

export default plugin;
export {manifest};
