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
import {getDiscordRpcService} from '../../source/services/discord/discord-rpc.service.ts';

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

const plugin: Plugin = {
	manifest,

	async init(context: PluginContext) {
		context.logger.info('Discord Rich Presence initialized');

		const discord = getDiscordRpcService();
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
		const discord = getDiscordRpcService();
		discord.setEnabled(true);
		await discord.connect();
	},

	async disable(context: PluginContext) {
		context.logger.info('Discord Rich Presence disabled');
		const discord = getDiscordRpcService();
		discord.setEnabled(false);
	},

	async destroy(context: PluginContext) {
		context.logger.info('Discord Rich Presence destroyed');
		const discord = getDiscordRpcService();
		await discord.disconnect();
	},
};

export default plugin;
export {manifest};
