const { app, BrowserWindow, Menu, globalShortcut, ipcMain, Tray, nativeImage, shell, desktopCapturer, clipboard, dialog, Notification } = require('electron');
const { event } = require('jquery');
const path = require('node:path')
var { firebase, initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const fs = require('fs')
const os = require('os')
const isMac = process.platform === 'darwin'
Menu.setApplicationMenu(false)
let tray
let mainWindow

var firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STROAGE_BUCKET,
    messagingSenderId: process.env.MESSING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID 
};
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })
}
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
var currenttext = ''
var previoustext = ''
function createWindow() {
    mainWindow = new BrowserWindow({
        minWidth: 700,
        minHeight: 500,
        width: 700,
        height: 500,
        maxWidth: 700,
        maxHeight: 500,
        frame: false,
        icon: './bin/Assets/icons/icons8-male-thinking-64.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            nativeWindowOpen: true
        }
    })
    mainWindow.loadFile(`./src/renderer/index.html`)
    // screen record.
    ipcMain.on('screen:record', e => {
        desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
            for (const source of sources) {
                if (source.name == 'Entire screen' || source.name == '') {
                    mainWindow.webContents.send('SET_SOURCE', source.id)
                    return;
                }
            }
        })
    });
    ipcMain.on("dowloadtextinfolder", (e, inputValue) => {
        async function saveFile() {
            try {
                const result = await dialog.showSaveDialog({
                    title: 'Save File',
                    defaultPath: `${inputValue.filename}.txt`, // default filename
                    filters: [
                        { name: 'Text Files', extensions: ['txt'] },
                    ],
                });
                if (!result.canceled && result.filePath) {
                    // Write content to the file
                    const content = inputValue.inputText
                    fs.writeFile(result.filePath, content, err => {
                        if (err) {
                            console.error('Error saving file:', err);
                        } else {
                            console.log('File saved successfully!');
                        }
                    });
                }
            } catch (err) {
                console.error('Error showing save dialog:', err);
            }
        }
        saveFile(inputValue)
    })
    ipcMain.on("min-btn", (event, title) => {
        var window = BrowserWindow.getFocusedWindow();
        window.minimize();
    })
    ipcMain.on("max-btn", (event, title) => {
        var window = BrowserWindow.getFocusedWindow();
        window.maximize();
    })
    ipcMain.on("close-btn", (event, title) => {
        var window = BrowserWindow.getFocusedWindow();
        window.close();
    })
    ipcMain.on("notify", (e, content) => {
        new Notification({
            title: "CCRapp",
            body: content
        }).show()
    })
    ipcMain.on("auth", (e, obj) => {     
        const app = initializeApp(firebaseConfig);
        // const analytics = getAnalytics(app);
        const auth = getAuth()
        console.log(obj)
        let name = obj.username
        let email = obj.useremail
        let password = obj.userpassword
        console.log(email, password)
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                var user = userCredential.user;
                console.log(user)
                // ...
            })
            .catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;
                // ..
            });

    })
    ipcMain.on("signin", (e, obj) => {
        console.log(obj)
        const app = initializeApp(firebaseConfig);
        const auth = getAuth();
        let name = obj.username
        let email = obj.useremail
        let password = obj.userpassword
        console.log(email, password)

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                console, log(user)
                // ...
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
            });
    })
}
app.whenReady().then(() => {
    const icon = nativeImage.createFromPath(path.join(__dirname, "../", "bin", "Assets", "icons", "32x32.png"))
    tray = new Tray(icon)
    tray.on('click', function (e) {
        if (mainWindow.isVisible()) {
            mainWindow.hide()
        } else {
            mainWindow.show()
        }
    });
    const cmenu = Menu.buildFromTemplate([
        isMac ? { role: 'close' } : { role: 'quit' },

        {
            label: 'Video recorder', submenu: [{
                label: 'Stop Recording',
                click: () => {
                    mainWindow.webContents.send("stoprec")

                }
            }
            ]
        }
    ])
    tray.setToolTip('CCRapp')
    tray.setContextMenu(cmenu)
    // globalShortcut.register('commandOrControl+R', () => {
    //     mainWindow.reload();
    // })
    //developertool coding
    // globalShortcut.register('commandOrControl+shift+I', () => {
    //     mainWindow.webContents.openDevTools()
    // })
    setInterval(() => {
        const copytext = clipboard.readText('clipboard')
        currenttext = copytext
        if (!(currenttext == previoustext)) {
            mainWindow.webContents.send("copiedtext", currenttext)
            previoustext = currenttext
        }
    }, 500);
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

