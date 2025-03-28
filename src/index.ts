/**
 * 入口文件
 *
 * 本文件为默认扩展入口文件，如果你想要配置其它文件作为入口文件，
 * 请修改 `extension.json` 中的 `entry` 字段；
 *
 * 请在此处使用 `export`  导出所有你希望在 `headerMenus` 中引用的方法，
 * 方法通过方法名与 `headerMenus` 关联。
 *
 * 如需了解更多开发细节，请阅读：
 * https://prodocs.lceda.cn/cn/api/guide/
 */
import * as extensionConfig from '../extension.json';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function activate(status?: 'onStartupFinished', arg?: string): void {}

export function openAbout(): void {
	eda.sys_ClientUrl.request('https://api.github.com/repos/klxf/eda-copilot/releases/latest').then(async (res) => {
		let updateTip = '';
		if (res.status === 200) {
			console.log('检查更新成功');
			const data = JSON.parse(await res.text());
			// 比较版本号
			const latestVersion = data.tag_name;
			if (compareVersions(extensionConfig.version, latestVersion.replaceAll('v', '')) < 0) {
				updateTip = '（存在新版本' + latestVersion + '）';
			} else {
				updateTip = '（已是最新版本）';
			}
		} else {
			console.log('检查更新失败');
			updateTip = '（检查更新失败）';
		}

		eda.sys_Dialog.showInformationMessage(
			extensionConfig.description +
				'\n' +
				'版本：' +
				extensionConfig.version +
				updateTip +
				'\n' +
				'作者：' +
				extensionConfig.publisher +
				'\n' +
				'————————————————————\n' +
				'本拓展使用 ' +
				extensionConfig.license +
				' 开源许可协议\n' +
				'开源：' +
				extensionConfig.homepage +
				'\n' +
				'反馈：' +
				extensionConfig.bugs +
				'\n',
			'关于 ' + extensionConfig.displayName,
		);
	});
}

export function openIframe(): void {
	eda.sys_IFrame.openIFrame('/iframe/index.html', 400, 600);
}

function compareVersions(version1: string, version2: string): number {
	const v1Parts = version1.split('.');
	const v2Parts = version2.split('.');

	const maxLength = Math.max(v1Parts.length, v2Parts.length);

	for (let i = 0; i < maxLength; i++) {
		const part1 = parseInt(v1Parts[i] || '0', 10);
		const part2 = parseInt(v2Parts[i] || '0', 10);

		if (part1 < part2) {
			return -1; // 后者版本号更高
		} else if (part1 > part2) {
			return 1; // 前者版本号更高
		}
	}

	return 0; // 两个版本号相等
}
