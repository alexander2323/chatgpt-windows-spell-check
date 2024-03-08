const {
	app,
	BrowserWindow,
	ipcMain,
	clipboard,
	Tray,
	Menu,
	nativeImage,
	globalShortcut,
} = require("electron");
const path = require("path");
const openai = require("./modules/openai.js");

let mainWindow;
let tray = null;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 700,
		height: 600,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
		},
	});

	mainWindow.loadFile("index.html");
	mainWindow.setAlwaysOnTop(true, "screen-saver");
	mainWindow.setVisibleOnAllWorkspaces(true);
	mainWindow.setFullScreenable(false);
 
	// Listen for the close event
	mainWindow.on('close', (event) => {
	    event.preventDefault(); // Prevent the window from being closed
	    mainWindow.minimize(); // Minimize the window instead
	}); 

	createTray();
}

function createTray() {
	const iconPath = path.join(__dirname, "icon.svg");
	const trayIcon = nativeImage.createFromPath(iconPath);
	tray = new Tray(trayIcon);

	const contextMenu = Menu.buildFromTemplate([
		{ label: "Show Window", click: toggleWindow },
		{ label: "Quit", click: () => app.quit() },
	]);

	tray.setToolTip("Clipboard App");
	tray.setContextMenu(contextMenu);
	tray.on("double-click", toggleWindow);
}

function toggleWindow() {
	try {
		if (mainWindow.isVisible()) {
			mainWindow.hide();
		} else {
			mainWindow.show();
			const data = clipboard.readText();
			console.log("Sending clipboard data:", data); // Debug log
			mainWindow.webContents.send("clipboard-data", data);
			correctSpelling(data);
			mainWindow.webContents.send("api-loading", true);
		}
	} catch (error) {
		console.error("Error toggling window:", error);
	}
}

async function correctSpelling(data) {
	try {
		if (data && data.trim() !== "") {
			// Improved check for non-empty string
			let prompt = `Please correct the spelling in the text below. Use the same language as in the text provided below. Don't remove anything important but rather fix the grammar and spelling. Answer only with the corrected text and absolutely nothing else.`;
			// Corrected API call format
			let res = await openai(prompt + "\n\nText: '" + data + "'");
			clipboard.writeText(res);
			await mainWindow.webContents.send("corrected", res);
			await mainWindow.webContents.send("api-loading", false);
		} else {
			await mainWindow.webContents.send("corrected", "Clipboard is empty");
			await mainWindow.webContents.send("api-loading", false);
		}
	} catch (error) {
		console.error("Error correcting spelling:", error);
		await mainWindow.webContents.send("api-error", "Error correcting spelling");
	}
}

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});

	globalShortcut.register("Shift+Alt+j", toggleWindow);
});

app.on("will-quit", () => {
	// Unregister all shortcuts.
	globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
