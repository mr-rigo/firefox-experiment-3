import { Configs, Daley } from "../lib/Configs"
import { wait } from "../lib/Helpers"
import { Browser } from "../lib/Browser"

export let browserBackground = eval('browser')

export class BrowserBackground {
    static browser = eval('browser')

    static async setValue(key: string, value: any) {
        await this.browser.storage.local.set({ [key]: value })
        // localStorage.setItem(name, value);
    }

    static async removeValue(key: string) {
        await this.browser.storage.local.remove(key)
        // localStorage.removeItem(name)
    }

    static async getValue(key: string) {
        return await this.browser.storage.local.get(key)
        // localStorage.getItem(name)
    }

    static async getAllValues() {
        return await this.browser.storage.local.get(null)
        // localStorage.getItem(name)
    }

    static tabIndex: number = null

    static lastDownloadURL: string = ''

    static async openNewTab(url: string, active = false) {
        let tab = await this.browser.tabs.create(
            { url: url, active: active }
        );

        this.browser.tabs.executeScript(tab.id, {
            code: 'window.exp_3_download = true',
            allFrames: true,
            runAt: "document_start"
        })

        return tab.id
    }

    static async openURLDirect(url: string, active = false) {
        if (await this.isActiveTab()) {
            // Если вкладка открыта то перейти по адресу
            await this.executeScript(`(()=>{
                    window.open("${url}","_self");                    
                    return null
                })()`)
        } else {
            // Создать новою вкладку
            this.tabIndex = await this.openNewTab(url, active)
        }

        // Ожидание загрузки страницы
        let count = Daley.pageOpenWaitError
        let loop_wait = 1500
        let ok = false

        while (count > 0) {
            ok = true

            await wait(loop_wait)

            this.browser.tabs.executeScript(this.tabIndex, {
                code: 'window.exp_3_download = true',
                allFrames: true,
                runAt: "document_start"
            })
            // TODO Проверка на 404
            // document.title
            if (loop_wait === 1500)
                loop_wait = 500

            let states = await this.browser.tabs.executeScript(this.tabIndex, {
                code: 'document.readyState',
                allFrames: true,
                runAt: "document_start"
            })

            for (let state of states) {
                if (state !== "complete") {
                    ok = false
                }
            }

            if (ok) {
                break
            }
        }


        await wait(Daley.pageOpenBackground)
        return ok
    }

    static async openURL(url: string, active = false, testMove = 0) {
        let lastURL = await this.getCurrentURL()
        let currentURL = lastURL

        let remove

        if (lastURL === '') {
            remove = false
        } else
            remove = currentURL.indexOf(url) !== -1

        let ok = false

        let addressMove = () => lastURL.indexOf(currentURL) === -1

        do {
            if (remove) {
                await this.closeTab()
                lastURL = ''
            } else {
                remove = true
            }

            ok = await this.openURLDirect(url, active)
            currentURL = await this.getCurrentURL()

            if (testMove > 0) {
                currentURL = lastURL
                testMove--
            }

        } while (!(ok && addressMove()))

        return this.tabIndex
    }

    static async getCurrentURL() {
        if (await this.isActiveTab()) {
            let r = await this.browser.tabs.executeScript(this.tabIndex, {
                code: 'window.location.href',
                allFrames: true,
                runAt: "document_start"
            })
            return r[0]
        }
        return ''
    }

    static async downloadFile(url: string, name: string = null) {
        if (url === this.lastDownloadURL) {
            console.error('Совпадение последних скаченных адресов', url)
            return
        }

        name = name ? name : Browser.fileName(url)
        await this.browser.downloads.download({ url: url, filename: name })

        await new Promise((resolve: any) => {
            function handleChanged(delta: any) {
                if (delta.state && delta.state.current === "complete") {
                    resolve()
                }// TODO Обработать ошибки скачивания
            }
            this.browser.downloads.onChanged.addListener(handleChanged)
        });

        this.lastDownloadURL = url
    }

    static async isActiveTab(tabID: number = null) {
        tabID = tabID === null ? this.tabIndex : tabID

        if (tabID === null)
            return false

        for (let tab of await this.browser.tabs.query({})) {
            if (tabID === tab.id) {
                return true
            }
        }
        return false
    }

    static async openTabAndScript(url: string, script: string, default_: any = null) {
        let res = undefined
        let self = this

        async function f() {
            res = await self.executeScript(script, await self.openURL(url))
        }

        f().then()

        let count = Daley.ScriptResultWait
        while (count && res === undefined) {
            await wait(1000)
            count--
        }


        return res ? res[0] : default_
    }

    static async executeScript(script: string, tabID: number = null) {
        tabID = tabID ? tabID : this.tabIndex
        if (tabID)
            return await this.browser.tabs.executeScript(tabID, { code: script, allFrames: true })
        else {
            console.warn('Не могу выполнить скрипт')
        }
    }

    static async closeTab(id: number = null) {
        if (id === null) {
            id = this.tabIndex
        }
        if (id === null)
            return

        await this.browser.tabs.remove(this.tabIndex)

        if (id === this.tabIndex)
            this.tabIndex = null
    }

    static async message(args: any) {
        return await this.browser.runtime.sendMessage(args);
    }

    static addListenerMessage(func: any) {
        this.browser.runtime.onMessage.addListener(func);
    }
}
