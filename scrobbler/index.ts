/**
 * Last.fm Scrobbler Plugin for youtube-music-cli
 *
 * Scrobbles tracks to Last.fm to build your listening history.
 */

import type {
	Plugin,
	PluginManifest,
	PluginContext,
	Track,
} from '../../source/types/plugin.types.ts';
import {createHash} from 'crypto';

const manifest: PluginManifest = {
	id: 'scrobbler',
	name: 'Last.fm Scrobbler',
	version: '1.0.0',
	description: 'Scrobble tracks to Last.fm',
	author: 'Involvex',
	license: 'MIT',
	main: 'index.ts',
	permissions: ['player', 'config', 'network'],
	hooks: ['track-change', 'play'],
};

interface ScrobblerConfig {
	apiKey: string;
	apiSecret: string;
	sessionKey: string;
	username: string;
}

interface ScrobbleEntry {
	track: string;
	artist: string;
	album?: string;
	timestamp: number;
	duration?: number;
}

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';
const SCROBBLE_THRESHOLD = 0.5; // Scrobble after 50% of track played

let config: ScrobblerConfig | null = null;
let currentTrack: Track | null = null;
let playStartTime: number = 0;
let scrobbled = false;
let pendingScrobbles: ScrobbleEntry[] = [];

function generateSignature(
	params: Record<string, string>,
	secret: string,
): string {
	// Sort parameters alphabetically and concatenate
	const sorted = Object.keys(params)
		.sort()
		.map(key => `${key}${params[key]}`)
		.join('');

	// Append secret and MD5 hash
	return createHash('md5')
		.update(sorted + secret)
		.digest('hex');
}

async function apiCall(
	method: string,
	params: Record<string, string>,
	context: PluginContext,
): Promise<unknown> {
	if (!config) {
		throw new Error('Not configured');
	}

	const allParams: Record<string, string> = {
		...params,
		method,
		api_key: config.apiKey,
		sk: config.sessionKey,
		format: 'json',
	};

	allParams['api_sig'] = generateSignature(allParams, config.apiSecret);

	const formData = new URLSearchParams(allParams);

	try {
		const response = await fetch(LASTFM_API_URL, {
			method: 'POST',
			body: formData,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		const data = await response.json();
		return data;
	} catch (error) {
		context.logger.error(`Last.fm API error: ${error}`);
		throw error;
	}
}

async function updateNowPlaying(
	track: Track,
	context: PluginContext,
): Promise<void> {
	if (!config) return;

	const artist = track.artists?.[0]?.name || 'Unknown Artist';
	const album = track.album?.name;

	const params: Record<string, string> = {
		track: track.title,
		artist,
	};

	if (album) {
		params['album'] = album;
	}

	if (track.duration) {
		// duration is in seconds for Last.fm
		params['duration'] = String(Math.floor(track.duration / 1000));
	}

	try {
		await apiCall('track.updateNowPlaying', params, context);
		context.logger.debug(`Now playing: ${artist} - ${track.title}`);
	} catch (error) {
		context.logger.warn(`Failed to update now playing: ${error}`);
	}
}

async function scrobble(
	track: Track,
	timestamp: number,
	context: PluginContext,
): Promise<void> {
	if (!config) return;

	const artist = track.artists?.[0]?.name || 'Unknown Artist';
	const album = track.album?.name;

	const params: Record<string, string> = {
		track: track.title,
		artist,
		timestamp: String(Math.floor(timestamp / 1000)),
	};

	if (album) {
		params['album'] = album;
	}

	try {
		await apiCall('track.scrobble', params, context);
		context.logger.info(`Scrobbled: ${artist} - ${track.title}`);
	} catch (error) {
		context.logger.warn(`Failed to scrobble, queueing for later: ${error}`);

		// Queue for later
		pendingScrobbles.push({
			track: track.title,
			artist,
			album,
			timestamp,
			duration: track.duration ? Math.floor(track.duration / 1000) : undefined,
		});

		// Save pending scrobbles
		context.config.set('pendingScrobbles', pendingScrobbles);
	}
}

async function flushPendingScrobbles(context: PluginContext): Promise<void> {
	if (pendingScrobbles.length === 0) return;

	context.logger.info(`Flushing ${pendingScrobbles.length} pending scrobbles`);

	const failed: ScrobbleEntry[] = [];

	for (const entry of pendingScrobbles) {
		const params: Record<string, string> = {
			track: entry.track,
			artist: entry.artist,
			timestamp: String(Math.floor(entry.timestamp / 1000)),
		};

		if (entry.album) {
			params['album'] = entry.album;
		}

		try {
			await apiCall('track.scrobble', params, context);
		} catch {
			failed.push(entry);
		}
	}

	pendingScrobbles = failed;
	context.config.set('pendingScrobbles', pendingScrobbles);
}

const plugin: Plugin = {
	manifest,

	async init(context: PluginContext) {
		context.logger.info('Last.fm Scrobbler initialized');

		// Load configuration
		config = context.config.get<ScrobblerConfig | null>('lastfm', null);

		if (!config || !config.sessionKey) {
			context.logger.warn(
				'Last.fm not configured. Please set up your API credentials.',
			);
			context.logger.info(
				'Set config: lastfm.apiKey, lastfm.apiSecret, lastfm.sessionKey',
			);
		}

		// Load pending scrobbles
		pendingScrobbles = context.config.get<ScrobbleEntry[]>(
			'pendingScrobbles',
			[],
		);

		// Try to flush pending scrobbles
		if (config) {
			await flushPendingScrobbles(context);
		}

		// Listen for track changes
		context.on('track-change', async event => {
			// Scrobble previous track if played enough
			if (currentTrack && !scrobbled) {
				const playTime = Date.now() - playStartTime;
				const duration = currentTrack.duration || 180000;

				if (playTime >= duration * SCROBBLE_THRESHOLD || playTime >= 240000) {
					await scrobble(currentTrack, playStartTime, context);
				}
			}

			// Update to new track
			currentTrack = 'track' in event ? (event.track ?? null) : null;
			playStartTime = Date.now();
			scrobbled = false;

			if (currentTrack) {
				await updateNowPlaying(currentTrack, context);
			}
		});

		// Check periodically for scrobble threshold
		// This would need a timer implementation
	},

	async enable(context: PluginContext) {
		context.logger.info('Last.fm Scrobbler enabled');

		if (config?.username) {
			context.logger.info(`Logged in as: ${config.username}`);
		}
	},

	async disable(context: PluginContext) {
		context.logger.info('Last.fm Scrobbler disabled');

		// Scrobble current track if applicable
		if (currentTrack && !scrobbled) {
			const playTime = Date.now() - playStartTime;
			const duration = currentTrack.duration || 180000;

			if (playTime >= duration * SCROBBLE_THRESHOLD) {
				await scrobble(currentTrack, playStartTime, context);
			}
		}
	},

	async destroy(context: PluginContext) {
		context.logger.info('Last.fm Scrobbler destroyed');
	},
};

export default plugin;
