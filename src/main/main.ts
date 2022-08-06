/* eslint-disable no-empty */
/* eslint-disable no-inner-declarations */
/* eslint-disable promise/catch-or-return */
/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable vars-on-top */
/* eslint global-require: off, no-console: off, promise/always-return: off */

import path from 'path';
import os from 'os';
import {
  app,
  BrowserWindow,
  shell,
  // Notification,
  dialog,
  ipcMain,
  Menu,
  systemPreferences,
  autoUpdater,
} from 'electron';
// import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';

let zoomFaktor = 1.0;
let messageBoxIsDisplayed = false;

ipcMain.on('autostart', (event, args) => {
  app.setLoginItemSettings({
    openAtLogin: args,
    openAsHidden: true,
  });
});

ipcMain.on('zoom', (event, args) => {
  zoomFaktor = args;
  mainWindow.webContents.setZoomFactor(zoomFaktor);
});

var fs = require('fs');
var https = require('https');

const updateserver = 'bbz-cloud-update-csbzsrzzj-dclausen01.vercel.app';
const updaterFeedURL = `${updateserver}/update/${
  process.platform
}/${app.getVersion()}`;

function appUpdater() {
  autoUpdater.setFeedURL({ url: updaterFeedURL });
  autoUpdater.on('error', (err) =>
    dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      defaultId: 0,
      message: `Ein Fehler ist aufgetreten: ${err}`,
    })
  );
  autoUpdater.on('checking-for-update', () =>
    console.log('checking-for-update')
  );
  autoUpdater.on('update-available', () => console.log('update-available'));
  autoUpdater.on('update-not-available', () =>
    console.log('update-not-available')
  );
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    let message = `${app.getName()} ${releaseName} ist als Update verfügbar. Das Update wird automatisch installiert, wenn die App das nächste Mal gestartet wird.`;
    if (releaseNotes) {
      const splitNotes = releaseNotes.split(/[^\r]\n/);
      message += '\n\nRelease notes:\n';
      splitNotes.forEach((notes) => {
        message += `${notes}\n\n`;
      });
    }
    // Ask user to update the app
    dialog.showMessageBox(
      {
        type: 'question',
        buttons: ['Installieren und sofort neu starten', 'Später installieren'],
        defaultId: 0,
        message:
          // eslint-disable-next-line prefer-template
          'Eine neue Version von ' + app.getName() + ' wurde heruntergeladen.',
        detail: message,
      },
      (response) => {
        if (response === 0) {
          setTimeout(() => autoUpdater.quitAndInstall(), 1);
        }
      }
    );
  });
  // init for updates
  autoUpdater.checkForUpdates();
}

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

/* export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
} */

function isWindowsOrmacOS() {
  return process.platform === 'darwin' || process.platform === 'win32';
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

  mainWindow = new BrowserWindow({
    show: false,
    width: 1600,
    height: 900,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webviewTag: true,
      nodeIntegration: false, // is default value after Electron v5
      contextIsolation: true, // protect against prototype pollution
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  Menu.setApplicationMenu(null);

  if (!isDevelopment) {
    mainWindow.webContents.insertCSS('.debug{display:none !important;}');
  }

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (
      process.env.START_MINIMIZED ||
      app.getLoginItemSettings().wasOpenedAsHidden
    ) {
      mainWindow.show();
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
  const checkOS = isWindowsOrmacOS();
  if (checkOS && !isDevelopment) {
    // Initate auto-updates on macOs and windows
    appUpdater();
  }
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
  '.xlsx',
  '.ppt',
  '.zip',
  '.exe',
  '.AppImage',
  '.snap',
  '.bin',
  '.sh',
  '.doc',
  '.docx',
  '.fls',
];

const microshaftWords = ['onedrive', 'onenote', 'download.aspx'];

function isDownloadType(url: string) {
  var isdt = false;
  downloadtypes.forEach((s) => {
    if (url.includes(s)) {
      isdt = true;
    }
  });
  return isdt;
}

function isWinzigWeich(url: string) {
  var isww = false;
  microshaftWords.forEach((s) => {
    if (url.includes(s)) {
      isww = true;
    }
  });
  return isww;
}

// Open third-party links in browser
app.on('web-contents-created', (event, contents) => {
  // eslint-disable-next-line no-var
  var handleNewWindow = (e, url) => {
    if (isWinzigWeich(url) || url.includes('download.aspx')) {
      if (
        url.includes('about:blank') ||
        url.includes('download') ||
        url.includes('sharepoint')
      ) {
        e.preventDefault();
        const newWin = new BrowserWindow({
          width: 1024,
          height: 728,
          minWidth: 600,
          minHeight: 300,
          show: false,
        });
        newWin.loadURL(url);
      } else if (!isDownloadType(url)) {
        if (!url.includes('onedrive')) {
          e.preventDefault();
          const newWin = new BrowserWindow({
            width: 1280,
            height: 728,
            minWidth: 600,
            minHeight: 300,
            show: false,
          });
          newWin.loadURL(url);
          newWin.setMenu(null);
          e.newGuest = newWin;
          if (!url.includes('about:blank') || !url.includes('download')) {
            newWin.show();
          }
        } else {
          e.preventDefault();
          contents.loadURL(url);
        }
      }
    }
  };
  contents.on('new-window', handleNewWindow);

  function handleDownloads(event, item, webContents) {
    item.on('done', (event, state) => {
      if (state === 'completed') {
        const RESOURCES_PATH = app.isPackaged
          ? path.join(process.resourcesPath, 'assets')
          : path.join(__dirname, '../../assets');
        const getAssetPath = (...paths: string[]): string => {
          return path.join(RESOURCES_PATH, ...paths);
        };
        /* new Notification({
          title: 'BBZ-Cloud',
          body: 'Download abgeschlossen.',
          icon: getAssetPath('icon.png'),
        }).show(); */
        const options = {
          type: 'info',
          buttons: ['Ok'],
          title: 'Download',
          message: 'Download abgeschlossen',
        };
        if (!messageBoxIsDisplayed) {
          messageBoxIsDisplayed = true;
          const response = dialog.showMessageBox(mainWindow, options);
          response.then(() => {
            messageBoxIsDisplayed = false;
          });
        }
      } else {
        console.log(`Download failed: ${state}`);
      }
    });
  }
  contents.session.on('will-download', handleDownloads);
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
