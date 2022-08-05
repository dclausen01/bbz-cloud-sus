const os = require('os');
const { app, autoUpdater, dialog } = require('electron');
const version = app.getVersion();
const platform = os.platform() + '_' + os.arch(); // usually returns darwin_64
const server = 'https://bbz-cloud-updater-mqyqbo42f-dclausen01.vercel.app';
const updaterFeedURL = `${server}/update/${
  process.platform
}/${app.getVersion()}`;

function appUpdater() {
  autoUpdater.setFeedURL(updaterFeedURL);
  /* Log whats happening
	TODO send autoUpdater events to renderer so that we could console log it in developer tools
	You could alsoe use nslog or other logging to see what's happening */
  autoUpdater.on('error', (err) => console.log(err));
  autoUpdater.on('checking-for-update', () =>
    console.log('checking-for-update')
  );
  autoUpdater.on('update-available', () => console.log('update-available'));
  autoUpdater.on('update-not-available', () =>
    console.log('update-not-available')
  );

  // Ask the user if update is available
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    let message =
      // eslint-disable-next-line prefer-template
      app.getName() +
      ' ' +
      releaseName +
      ' ist als Update verfügbar. Das Update wird automatisch installiert, wenn die App das nächste Mal gestartet wird.';
    if (releaseNotes) {
      const splitNotes = releaseNotes.split(/[^\r]\n/);
      message += '\n\nRelease notes:\n';
      splitNotes.forEach((notes) => {
        message += notes + '\n\n';
      });
    }
    // Ask user to update the app
    dialog.showMessageBox(
      {
        type: 'question',
        buttons: ['Installieren und sofort neu starte', 'Später installieren'],
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

// eslint-disable-next-line no-multi-assign
exports = module.exports = {
  appUpdater,
};
