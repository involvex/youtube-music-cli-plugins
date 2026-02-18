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
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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

function getArtist(track: Track): string {
	return track.artists?.[0]?.name ?? 'Unknown Artist';
}

type RpcService = {
	setEnabled: (enabled: boolean) => void;
	connect: () => Promise<void>;
	updateActivity: (activity: {title: string; artist: string; startTimestamp: number}) => Promise<void>;
	clearActivity: () => Promise<void>;
	disconnect: () => Promise<void>;
};

let cachedService: RpcService | null = null;

async function resolveDiscordService(): Promise<RpcService | null> {
	if (cachedService) return cachedService;

	const candidates = [
		'@involvex/youtube-music-cli/dist/source/services/discord/discord-rpc.service.js',
		'@involvex/youtube-music-cli/source/services/discord/discord-rpc.service.js',
		// Local development fallback (when plugins directory lives inside the repo)
		path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			'../../source/services/discord/discord-rpc.service.ts',
		),
	];

	for (const specifier of candidates) {
		try {
			const mod = await import(specifier);
			const service =
				mod?.getDiscordRpcService?.() ??
				mod?.default?.getDiscordRpcService?.();
			if (service) {
				cachedService = service as RpcService;
				return cachedService;
			}
		} catch {
			// Try next candidate
		}
	}

	// Last resort: attempt CommonJS resolution from current module
	try {
		const req = createRequire(import.meta.url);
		const resolved = req.resolve(
			'@involvex/youtube-music-cli/dist/source/services/discord/discord-rpc.service.js',
		);
		const mod = await import(resolved);
		const service =
			mod?.getDiscordRpcService?.() ??
			mod?.default?.getDiscordRpcService?.();
		if (service) {
			cachedService = service as RpcService;
			return cachedService;
		}
	} catch {
		// Ignore
	}

	return null;
}

const plugin: Plugin = {
	manifest,

	async init(context: PluginContext) {
		context.logger.info('Discord Rich Presence initialized');

		const discord = await resolveDiscordService();
		if (!discord) {
			context.logger.warn(
				'Discord RPC service unavailable; is the CLI package accessible?',
			);
			return;
		}

		discord.setEnabled(true);
		await discord.connect();

		context.on('track-change', event => {
			if (event.track) {
				void discord.updateActivity({
					title: event.track.title,
					artist: getArtist(event.track),
					startTimestamp: Date.now(),
				});
			} else {
				void discord.clearActivity();
			}
		});

		context.on('play', () => {
			const track = context.player.getCurrentTrack();
			if (track) {
				void discord.updateActivity({
					title: track.title,
					artist: getArtist(track),
					startTimestamp: Date.now(),
				});
			}
		});

		context.on('resume', () => {
			const track = context.player.getCurrentTrack();
			if (track) {
				void discord.updateActivity({
					title: track.title,
					artist: getArtist(track),
					startTimestamp: Date.now(),
				});
			}
		});

		context.on('pause', () => {
			void discord.clearActivity();
		});

		context.on('stop', () => {
			void discord.clearActivity();
		});

		// Set initial activity if already playing
		const currentTrack = context.player.getCurrentTrack();
		if (currentTrack) {
			void discord.updateActivity({
				title: currentTrack.title,
				artist: getArtist(currentTrack),
				startTimestamp: Date.now(),
			});
		}
	},

	async enable(context: PluginContext) {
		context.logger.info('Discord Rich Presence enabled');
		const discord = await resolveDiscordService();
		if (!discord) {
			context.logger.warn(
				'Discord RPC service unavailable; is the CLI package accessible?',
			);
			return;
		}
		discord.setEnabled(true);
		await discord.connect();
	},

	async disable(context: PluginContext) {
		context.logger.info('Discord Rich Presence disabled');
		const discord = await resolveDiscordService();
		if (discord) {
			discord.setEnabled(false);
		}
	},

	async destroy(context: PluginContext) {
		context.logger.info('Discord Rich Presence destroyed');
		const discord = await resolveDiscordService();
		if (discord) {
			await discord.disconnect();
		}
	},
};

export default plugin;
export {manifest};
