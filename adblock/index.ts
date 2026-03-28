/**
 * Adblock Plugin for youtube-music-cli
 *
 * Blocks ads and sponsored content by intercepting stream requests
 * and detecting ad markers in track metadata.
 */

import type {
	Plugin,
	PluginManifest,
	PluginContext,
	Track,
} from '../../source/types/plugin.types.ts';

const manifest: PluginManifest = {
	id: 'adblock',
	name: 'Adblock',
	version: '1.0.0',
	description: 'Block ads and sponsored content in YouTube Music',
	author: 'Involvex',
	license: 'MIT',
	main: 'index.ts',
	permissions: ['player'],
	hooks: ['stream-request', 'track-change'],
};

// Known ad video IDs and patterns
const AD_PATTERNS = {
	// Video IDs known to be ads (this would be updated periodically)
	videoIds: new Set<string>([
		// Add known ad video IDs here
	]),

	// Title patterns that indicate ads
	titlePatterns: [
		/^ad\s*[-:]/i,
		/\bad\b.*\bmusic\b/i,
		/sponsored/i,
		/advertisement/i,
		/promo(?:tion)?/i,
	],

	// Channel patterns for ad channels
	channelPatterns: [/youtube\s*ads/i, /google\s*ads/i, /sponsored\s*content/i],

	// Duration thresholds (ads are typically short)
	minAdDuration: 5, // seconds
	maxAdDuration: 30, // seconds
};

interface AdblockStats {
	blockedCount: number;
	blockedVideoIds: string[];
	lastBlocked: string | null;
}

let stats: AdblockStats = {
	blockedCount: 0,
	blockedVideoIds: [],
	lastBlocked: null,
};

function isAd(track: Track): boolean {
	// Check video ID blocklist
	if (AD_PATTERNS.videoIds.has(track.videoId)) {
		return true;
	}

	// Check title patterns
	for (const pattern of AD_PATTERNS.titlePatterns) {
		if (pattern.test(track.title)) {
			return true;
		}
	}

	// Check channel/artist patterns
	if (track.artists) {
		for (const artist of track.artists) {
			for (const pattern of AD_PATTERNS.channelPatterns) {
				if (pattern.test(artist.name)) {
					return true;
				}
			}
		}
	}

	// Check duration (very short tracks might be ads)
	if (track.duration !== undefined) {
		const duration = track.duration;
		if (
			duration >= AD_PATTERNS.minAdDuration &&
			duration <= AD_PATTERNS.maxAdDuration
		) {
			// Short duration alone isn't enough, but combined with other signals...
			// For now, we'll be conservative and not block based on duration alone
		}
	}

	return false;
}

const plugin: Plugin = {
	manifest,

	async init(context: PluginContext) {
		context.logger.info('Adblock plugin initialized');

		// Load saved stats
		try {
			const savedStats = context.config.get<AdblockStats>('stats', stats);
			stats = savedStats;
			context.logger.debug(`Loaded stats: ${stats.blockedCount} ads blocked`);
		} catch {
			// Use default stats
		}

		// Register stream request handler
		context.audio.onStreamRequest(async (url, track) => {
			if (isAd(track)) {
				stats.blockedCount++;
				stats.blockedVideoIds.push(track.videoId);
				stats.lastBlocked = track.title;

				// Save stats
				context.config.set('stats', stats);

				context.logger.info(`Blocked ad: "${track.title}"`);

				// Return null to skip this track
				return null;
			}

			// Allow normal playback
			return url;
		});

		// Listen for track changes to detect ads that slip through
		context.on('track-change', event => {
			if ('track' in event && event.track && isAd(event.track)) {
				context.logger.warn(
					`Ad detected in playback: "${event.track.title}" - skipping`,
				);
				// Skip to next track
				context.player.next();
			}
		});
	},

	async enable(context: PluginContext) {
		context.logger.info('Adblock enabled');
		context.logger.info(`Total ads blocked: ${stats.blockedCount}`);
	},

	async disable(context: PluginContext) {
		context.logger.info('Adblock disabled');
		// Save final stats
		context.config.set('stats', stats);
	},

	async destroy(context: PluginContext) {
		context.logger.info('Adblock plugin destroyed');
	},
};

export default plugin;
