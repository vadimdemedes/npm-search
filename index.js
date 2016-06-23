'use strict';
const Positioner = require('electron-positioner');
const AutoLaunch = require('auto-launch');
const electron = require('electron');
const shell = electron.shell;
const ipc = electron.ipcMain;
const app = electron.app;

app.dock.hide();

// launch at login
const appLauncher = new AutoLaunch({
	name: 'npm-search'
});

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// prevent window and tray from being garbage collected
let mainWindow;
let tray;
let trayMenu;

function createMainWindow() {
	const win = new electron.BrowserWindow({
		width: 320,
		height: 68,
		frame: false,
		closeable: false,
		resizable: false
	});

	const positioner = new Positioner(win);
	positioner.move('center');

	win.loadURL(`file://${__dirname}/index.html`);
	win.on('close', e => {
		e.preventDefault();
		closeMainWindow();
	});

	return win;
}

function closeMainWindow () {
	mainWindow.hide();
	mainWindow.setSize(320, 68, false);
	mainWindow.reload();
}

function createTray () {
	const tray = new electron.Tray(__dirname + '/images/icons/tray.png');
	tray.setToolTip('Search npm');

	tray.on('click', () => {
		mainWindow.show();
		mainWindow.focus();
	});

	tray.on('right-click', () => {
		tray.popUpContextMenu(trayMenu);
	});

	return tray;
}

// list of last opened modules
const modules = [];

// handler for last opened module menu item click event
function onModuleClick (menuItem) {
	const module = modules.find(module => module.name === menuItem.label);
	shell.openExternal(module.url);
}

function createTrayMenu () {
	const lastOpened = new electron.MenuItem({
		label: 'Last opened',
		enabled: false
	});

	const preferences = new electron.MenuItem({
		label: 'Preferences',
		enabled: false
	});

	const openAtLogin = new electron.MenuItem({
		label: 'Open at login',
		type: 'checkbox',
		click: menuItem => {
			appLauncher.isEnabled()
				.then(isEnabled => {
					menuItem.checked = !isEnabled;

					if (isEnabled) {
						appLauncher.disable();
					} else {
						appLauncher.enable();
					}
				});
		}
	});

	const quit = new electron.MenuItem({
		label: process.platform === 'darwin' ? 'Quit' : 'Exit',
		click: exit,
		accelerator: 'CmdOrCtrl+Q'
	});

	const separator = new electron.MenuItem({
		type: 'separator'
	});

	const moduleItems = modules.map(module => {
		return new electron.MenuItem({
			label: module.name,
			click: onModuleClick
		});
	});

	const menu = new electron.Menu();
	menu.append(lastOpened);

	moduleItems.forEach(moduleItem => {
		menu.append(moduleItem);
	});

	menu.append(separator);
	menu.append(preferences);
	menu.append(openAtLogin);
	menu.append(separator);
	menu.append(quit);

	appLauncher.isEnabled()
		.then(isEnabled => {
			openAtLogin.checked = isEnabled;
		});

	return menu;
}

ipc.on('resize', () => {
	mainWindow.setSize(320, 400, true);
});

ipc.on('close', () => {
	closeMainWindow();
});

ipc.on('open', (e, url, name) => {
	if (modules.length === 5) {
		modules.pop();
	}

	modules.unshift({ url, name });

	shell.openExternal(url);
	closeMainWindow();

	trayMenu = createTrayMenu();
});

app.on('ready', () => {
	mainWindow = createMainWindow();
	tray = createTray();
	trayMenu = createTrayMenu();
});

function exit () {
	tray.destroy();
	app.exit(0);
}
