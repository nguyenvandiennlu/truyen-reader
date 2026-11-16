const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: "Truyện Reader — Sách Nói & Đọc Truyện Thông Minh",
    backgroundColor: "#09090b",
    autoHideMenuBar: true,
    show: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#09090b",
      symbolColor: "#f4f4f5",
      height: 38
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false // Đọc truyện ngầm khi chuyển sang app khác không bị ngắt tiếng!
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || "http://localhost:3000";
  mainWindow.loadURL(startUrl);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Hỗ trợ phím tắt F11 toàn màn hình
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.key === "F11" && input.type === "keyDown") {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Đăng ký phím Media bàn phím Windows (Play/Pause, Next, Prev)
app.whenReady().then(() => {
  createWindow();

  try {
    globalShortcut.register("MediaPlayPause", () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("media-command", "toggle-play");
      }
    });

    globalShortcut.register("MediaNextTrack", () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("media-command", "next-paragraph");
      }
    });

    globalShortcut.register("MediaPreviousTrack", () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("media-command", "prev-paragraph");
      }
    });
  } catch (err) {
    console.warn("Could not register media shortcuts:", err);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
