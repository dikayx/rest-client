const { app, BrowserWindow } = require("electron");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: "#ffffff",
  });

  // **dirname is a node variable that gives us the path to the current directory
  win.loadFile(`${__dirname}/dist/ng-rest-client/browser/index.html`);

  // Use dev tools when needed
  // win.webContents.openDevTools();

  win.on("closed", () => {
    win = null;
  });
}

// Create window on electron initialization
app.on("ready", createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  // On macOS specific close process
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // macOS specific close process
  if (win === null) {
    createWindow();
  }
});
