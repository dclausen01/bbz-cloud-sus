/* eslint-disable promise/catch-or-return */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable vars-on-top */
/* eslint global-require: off, no-console: off, promise/always-return: off */

import path from 'path';
import { app, BrowserWindow, shell, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';

var fs = require('fs');
var https = require('https');

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webviewTag: true,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.setMenu(null);

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function download(url, dest) {
  try {
    var file = fs.createWriteStream(dest);
    var request = https
      .get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
          file.close(function () {
            console.log('file saved.');
          }); // close() is async, call cb after close completes.
        });
      })
      .on('error', function (e) {
        // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
      });
  } catch (e) {
    console.error(e);
  }
}

const downloadtypes = [
  '.mp4',
  '.mp3',
  '.ogg',
  '.flac',
  '.wav',
  '.mkv',
  '.mov',
  '.wmv',
  '.oga',
  '.ogv',
  '.opus',
  '.pdf',
  '.xls',
  '.ppt',
  '.zip',
  '.exe',
  '.AppImage',
  '.snap',
  '.bin',
  '.sh',
  '.doc',
];

function isDownloadType(url: string) {
  var isdt = false;
  downloadtypes.forEach((s) => {
    if (url.includes(s)) {
      isdt = true;
    }
  });
  return isdt;
}

// Open third-party links in browser
app.on('web-contents-created', (e, contents) => {
  // eslint-disable-next-line no-var
  var handleNewWindow = (e, url) => {
    if (url.includes('about:blank') || url.includes('download')) { 
      if (url.includes('about:blank')) {
        e.preventDefault();
      } else {
        contents.loadURL(url);
      }
    } else if (!isDownloadType(url)) {
      if (!url.includes('onedrive')) {
        e.preventDefault();
        const newWin = new BrowserWindow({
          width: 1024,
          height: 728,
          minWidth: 600,
          minHeight: 300,
          show: false,
        });
        newWin.loadURL(url);
        newWin.setMenu(null);
        if (!url.includes('about:blank') || !url.includes('download')) {
          newWin.show();
        }
      } else {
        e.preventDefault();
        contents.loadURL(url);
      }
    }
  };
  contents.on('new-window', handleNewWindow);
  // contents.on('will-navigate', handleNewWindow);


  /* var handleNavigation = (e, url) => {
    if (isDownloadType(url)) {
      e.preventDefault();
      var toLocalPath = path.resolve(
        app.getPath('downloads'),
        path.basename(url)
      );
      var userChosenPath = dialog.showSaveDialog({
        defaultPath: toLocalPath,
      });
      if (userChosenPath) {
        userChosenPath.then((value) => {
          if (isDownloadType(url)) {
            download(url, value.filePath);
          }
        });
      }
    }
  };
  contents.on('will-navigate', handleNavigation); */
}); 

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
