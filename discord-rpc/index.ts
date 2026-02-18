/**
 * Discord Rich Presence Plugin for youtube-music-cli
 *
 * Shows what you're listening to on your Discord profile.
 */

import type {
	Plugin,
	PluginManifest,
	PluginContext,
	Track,
} from '../../source/types/plugin.types.ts';

const manifest: PluginManifest = {
	id: 'discord-rpc',
	name: 'Discord Rich Presence',
	version: '1.0.0',
	description: "Show what you're listening to on Discord",
	author: 'Involvex',
	license: 'MIT',
	main: 'index.ts',
	permissions: ['player', 'config'],
	hooks: ['track-change', 'play', 'pause', 'resume', 'stop'],
};

// Discord application ID (you would create one at discord.com/developers)
const DISCORD_CLIENT_ID = '1234567890'; // Replace with real ID

interface DiscordRPCConfig {
	enabled: boolean;
	showAlbumArt: boolean;
	showTimeRemaining: boolean;
	showPausedStatus: boolean;
}

interface RPCActivity {
	details?: string;
	state?: string;
	timestamps?: {
		start?: number;
		end?: number;
	};
	assets?: {
		large_image?: string;
		large_text?: string;
		small_image?: string;
		small_text?: string;
	};
	buttons?: Array<{
		label: string;
		url: string;
	}>;
}

let config: DiscordRPCConfig = {
	enabled: true,
	showAlbumArt: true,
	showTimeRemaining: true,
	showPausedStatus: true,
};

let currentActivity: RPCActivity | null = null;
let isConnected = false;
let playStartTime: number = 0;

// Discord RPC connection (would use discord-rpc package in production)
async function connectToDiscord(context: PluginContext): Promise<boolean> {
	try {
		// In production, this would use the discord-rpc npm package:
		// const RPC = require('discord-rpc');
		// const client = new RPC.Client({ transport: 'ipc' });
		// await client.login({ clientId: DISCORD_CLIENT_ID });

		context.logger.info('Connected to Discord');
		isConnected = true;
		return true;
	} catch (error) {
		context.logger.warn(`Failed to connect to Discord: ${error}`);
		isConnected = false;
		return false;
	}
}

async function setActivity(
	activity: RPCActivity | null,
	context: PluginContext,
): Promise<void> {
	if (!isConnected) {
		await connectToDiscord(context);
	}

	if (!isConnected) return;

	try {
		// In production:
		// await client.setActivity(activity);

		currentActivity = activity;

		if (activity) {
			context.logger.debug(`Set Discord activity: ${activity.details}`);
		} else {
			context.logger.debug('Cleared Discord activity');
		}
	} catch (error) {
		context.logger.warn(`Failed to set Discord activity: ${error}`);
	}
}

function buildActivity(
	track: Track,
	isPlaying: boolean,
	context: PluginContext,
): RPCActivity {
	const artist = track.artists?.[0]?.name || 'Unknown Artist';
	const album = track.album?.name;

	const activity: RPCActivity = {
		details: track.title,
		state: `by ${artist}`,
	};

	// Add timestamps if playing
	if (isPlaying && config.showTimeRemaining && track.duration?.totalSeconds) {
		activity.timestamps = {
			start: playStartTime,
			end: playStartTime + track.duration.totalSeconds * 1000,
		};
	}

	// Add album art
	if (config.showAlbumArt) {
		activity.assets = {
			large_image: 'youtube_music_logo', // Would use actual thumbnail
			large_text: album || 'YouTube Music',
			small_image: isPlaying ? 'playing' : 'paused',
			small_text: isPlaying ? 'Playing' : 'Paused',
		};
	}

	// Add button to open track
	activity.buttons = [
		{
			label: 'Listen on YouTube Music',
			url: `https://music.youtube.com/watch?v=${track.videoId}`,
		},
	];

	return activity;
}

const plugin: Plugin = {
	manifest,

	async init(context: PluginContext) {
		context.logger.info('Discord Rich Presence initialized');

		// Load configuration
		config = context.config.get<DiscordRPCConfig>('discord', config);

		if (!config.enabled) {
			context.logger.info('Discord RPC is disabled in config');
			return;
		}

		// Connect to Discord
		await connectToDiscord(context);

		// Listen for track changes
		context.on('track-change', event => {
			if (event.track) {
				playStartTime = Date.now();
				const activity = buildActivity(event.track, true, context);
				void setActivity(activity, context);
			} else {
				void setActivity(null, context);
			}
		});

		// Listen for play/pause/resume
		context.on('play', () => {
			const track = context.player.getCurrentTrack();
			if (track) {
				playStartTime = Date.now();
				const activity = buildActivity(track, true, context);
				void setActivity(activity, context);
			}
		});

		context.on('pause', () => {
			if (config.showPausedStatus) {
				const track = context.player.getCurrentTrack();
				if (track) {
					const activity = buildActivity(track, false, context);
					void setActivity(activity, context);
				}
			} else {
				void setActivity(null, context);
			}
		});

		context.on('resume', () => {
			const track = context.player.getCurrentTrack();
			if (track) {
				playStartTime = Date.now();
				const activity = buildActivity(track, true, context);
				void setActivity(activity, context);
			}
		});

		context.on('stop', () => {
			void setActivity(null, context);
		});

		// Set initial activity if already playing
		const currentTrack = context.player.getCurrentTrack();
		if (currentTrack) {
			playStartTime = Date.now();
			const activity = buildActivity(currentTrack, true, context);
			void setActivity(activity, context);
		}
	},

	async enable(context: PluginContext) {
		context.logger.info('Discord Rich Presence enabled');
		await connectToDiscord(context);
	},

	async disable(context: PluginContext) {
		context.logger.info('Discord Rich Presence disabled');
		await setActivity(null, context);
	},

	async destroy(context: PluginContext) {
		context.logger.info('Discord Rich Presence destroyed');
		// In production: client.destroy();
		isConnected = false;
	},
};

export default plugin;
export {manifest};
