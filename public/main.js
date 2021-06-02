const { app, BrowserWindow, Tray, Menu } = require('electron')
const path = require('path')

/**
 * Переменная tray вынесена чтобы сборщики мусора не сносили иконку из taskBar
 **/
let tray
function createWindow () {

    /**
     * Создание окна со всеми характеристиками
     * nodeIntegration опасная хрень, открывает доступ ко всему, но без нее никак
     **/
    const win = new BrowserWindow({
        height: 150,
        width: 200,
        frame: false,
        resizable: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
    })

    /**
     * путь к главному html
     * не ставлю проверку isDev, так как библиотеки слетают, лучше просто при package не забыть поменять и все))
     **/
    // win.loadURL('http://localhost:3001')
    win.loadURL(path.join(__dirname, '../build/index.html'))

    /**
     * Функция если кликаем мимо открытого окна, чтобы закрыть это окно
     * очень важная вещь, так как пользователи все абсолютно привыкли к подобному поведению подобных программ
     **/
    win.on('blur', () => {
        win.hide()
    })

    /**
     * Указываем пути к иконкам для таскбара (большой и маленькой)
     * Проверка не имеет смысла пока что, но оставляю ее на случай если кто захочет разделить вид иконок для MacOS и Windows
     **/
    const iconName = process.platform === 'win32' ? "logo_main.png" : "logo_main.png"
    const iconPath = path.join(__dirname, `./${iconName}`)
    win.setIcon(iconPath)
    tray = new Tray(iconPath)

    /**
     * При наведении на иконку увидим эту надпись
     **/
    tray.setToolTip('froot.kz screenshot watcher')

    /**
     * Событие открытия окна, здесь идет расчет координат где именно появится окно
     * Есть проверка на Windows и MacOS
     **/
    tray.on('click', (event, bounds) => {
        const {x, y} = bounds
        const {height, width} = win.getBounds()
        if (win.isVisible()) {
            win.hide()
        } else {
            const yPosition = process.platform === 'darwin' ? y : y - height
            win.setBounds({
                x: x - width / 2,
                y: yPosition,
                height: height,
                width: width
            })
            win.show()
        }
    })

    /**
     * Событие клика правой кнопки мыши
     * Дает меню, где есть только кнопка Quit (выйти)
     **/
    tray.on('right-click', () => {
        const menuConfig = Menu.buildFromTemplate([
            {
                label: 'Quit',
                click: () => {
                    app.quit()
                }
            }
        ])

        tray.popUpContextMenu(menuConfig)
    })

    /**
     * В целом не очень нужная штука, все равно кнопки не видно, но событие на нажатие клавиш работает
     * Command+Q или Ctrl+Q закрывают программу
     * Но шлавная фишка этой штуки в том, что оно удаляет базовое меню и закрывает полностью доступ в dev tools чтобы пользователи не шарялись в кишках программы
     **/
    const menuTemplate = [
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ?'Command+Q' : 'Ctrl+Q',
                    click() {
                        app.quit()
                    }
                }
    ]
    const mainMenu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(mainMenu)
}

/**
 * Базовые функции электрона для запуска программы, обычно везде такие они вот стандартные
 **/
app.on("ready", () => createWindow())
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})