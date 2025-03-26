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
	eda.sys_Dialog.showInformationMessage(
		extensionConfig.description + '\n' +
		'版本：' + extensionConfig.version + '\n' +
		'作者：' + extensionConfig.publisher + '\n' +
		'————————————————————\n' +
		'本拓展使用 ' + extensionConfig.license + ' 开源许可协议\n' +
		'开源：' + extensionConfig.homepage + '\n' +
		'反馈：' + extensionConfig.bugs + '\n',
		'关于 ' + extensionConfig.displayName
	);
}

export function openIframe(): void {
	eda.sys_IFrame.openIFrame('/iframe/index.html', 400, 600);
}
