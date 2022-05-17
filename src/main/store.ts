import Store from 'electron-store';

const settings = new Store({watch: true});

settings.set({
  applist: {
    SchulCloud: true, 
    BBZPortal: true, 
    MSOffice: true,
    CryptPad: true,
    Excalidraw: true,
    OneNote: true,
    Miro: true,
    BigBlueButton: true,
    Outlook: true,
    WebUntis: true,
    PlagScan: true,
    Taskcards: true,
    SchulSHPortal: true,
    KurzeLinks: true,
    BBZHandbuch: true,
    Anleitung: true
  },
	autostart: false
});

export default settings;