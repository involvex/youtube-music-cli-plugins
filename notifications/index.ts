/**
 * Desktop Notifications Plugin for youtube-music-cli
 *
 * Shows desktop notifications when the track changes.
 */

import type {
	Plugin,
	PluginManifest,
	PluginContext,
	Track,
} from '../../source/types/plugin.types.ts';
import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

const manifest: PluginManifest = {
	id: 'notifications',
	name: 'Desktop Notifications',
	version: '1.0.0',
	description: 'Desktop notifications for track changes',
	author: 'Involvex',
	license: 'MIT',
	main: 'index.ts',
	permissions: ['player', 'config'],
	hooks: ['track-change'],
};

interface NotificationsConfig {
	enabled: boolean;
	showOnPlay: boolean;
	showOnPause: boolean;
	showArtwork: boolean;
	duration: number; // milliseconds
}

let config: NotificationsConfig = {
	enabled: true,
	showOnPlay: true,
	showOnPause: false,
	showArtwork: true,
	duration: 5000,
};

async function showNotification(
	title: string,
	message: string,
	context: PluginContext,
): Promise<void> {
	const platform = process.platform;

	try {
		if (platform === 'darwin') {
			// macOS - use osascript
			const script = `display notification "${message}" with title "${title}"`;
			await execAsync(`osascript -e '${script}'`);
		} else if (platform === 'linux') {
			// Linux - use notify-send
			await execAsync(
				`notify-send "${title}" "${message}" -t ${config.duration}`,
			);
		} else if (platform === 'win32') {
			// Windows - use PowerShell toast notification
			const ps = `
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
        $template = @"
<toast>
    <visual>
        <binding template="ToastText02">
            <text id="1">${title}</text>
            <text id="2">${message}</text>
        </binding>
    </visual>
</toast>
"@
        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("youtube-music-cli").Show($toast)
      `;

			// Simplified fallback for Windows
			await execAsync(
				`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${message}', '${title}')"`,
			);
		}

		context.logger.debug(`Notification shown: ${title}`);
	} catch (error) {
		context.logger.warn(`Failed to show notification: ${error}`);
	}
}

function formatTrackNotification(track: Track): {
	title: string;
	message: string;
} {
	const artist = track.artists?.[0]?.name || 'Unknown Artist';
	const album = track.album?.name;

	let message = `by ${artist}`;
	if (album) {
		message += `\n${album}`;
	}

	return {
		title: `🎵 ${track.title}`,
		message,
	};
}

const plugin: Plugin = {
	manifest,

	async init(context: PluginContext) {
		context.logger.info('Desktop Notifications initialized');

		// Load configuration
		config = context.config.get<NotificationsConfig>('notifications', config);

		if (!config.enabled) {
			context.logger.info('Desktop notifications are disabled');
			return;
		}

		// Listen for track changes
		context.on('track-change', event => {
			if (event.track && config.showOnPlay) {
				const {title, message} = formatTrackNotification(event.track);
				void showNotification(title, message, context);
			}
		});

		// Listen for pause if configured
		if (config.showOnPause) {
			context.on('pause', () => {
				void showNotification('⏸️ Paused', 'Music playback paused', context);
			});
		}
	},

	async enable(context: PluginContext) {
		context.logger.info('Desktop Notifications enabled');

		// Show a test notification
		await showNotification(
			'🔔 Notifications Enabled',
			"You'll see notifications when tracks change",
			context,
		);
	},

	async disable(context: PluginContext) {
		context.logger.info('Desktop Notifications disabled');
	},

	async destroy(context: PluginContext) {
		context.logger.info('Desktop Notifications destroyed');
	},
};

export default plugin;
export {manifest};
