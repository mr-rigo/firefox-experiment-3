import { Browser } from "../lib/Browser"
import { Tasks } from "./Tasks"
import { wait } from "../lib/Helpers"
import { Configs, Daley } from "../lib/Configs"
import { StorageApp } from "./StorageApp"


export class Downloader {
    protected static session: any = null
    protected static work = false
    protected static active = true
    protected static downloadMode = true
    protected static workRestart = false

    protected static downloaded: Array<string> = []
    protected static errors = 0
    protected static errorsNoneStop = false
    protected static restartTimer: number = null

    protected static tasks = Tasks

    static async direct_run(url: string, script: string, default_: any = null, auto_close = false) {
        if (Configs.pauseGetDetails)
            return
        // Logger.downloader('Open tab')
        let out = await Browser.openAndExec(url, script)
        return out ? out : default_
    }

    static stopManual() {
        this.active = false
        this.work = false
        this.stop()
    }

    static stop() {
        this.work = false
        this.session = null
        this.active = false
        console.error('Остановка из за большого количества ошибок')
    }

    static async push(url: string) {
        if (await Tasks.push(url)) {
            if (!this.work)
                this.run().then()
        }
    }

    static async runManual(url: string, script: string = null) {
        if (await Tasks.push(url)) {
            if (!this.work)
                this.run().then()
        }
    }

    static async run() {
        if (!this.downloadMode || !this.active) {
            return
        }

        this.work = true
        this.restartLoop().then()
        let session = Date.now()
        this.session = session
        while (true) {
            this.timeTrigger()
            if (session !== this.session || !this.active || !this.work)
                return

            if (!this.errorsNoneStop && this.errors > Daley.errorStop) {
                this.stop()
                return
            }

            let task = await Tasks.next()
            if (!task)
                break

            await wait(Daley.nextPageDelay);

            let url = task[0]

            let errors = false
            let urlList: Array<any> = []
            // 3 попытки выполнения
            for (let i = 0; i < 2; i++) {
                urlList = await this.direct_run(url,
                    `'exp_3_result' in window ? window.exp_3_result : null`,
                    [])
                urlList = urlList ? urlList : []

                if (urlList.length > 0)
                    break
                this.timeTrigger()
                await wait(500);
            }

            this.timeTrigger()

            await wait(Daley.downloadDelay);

            if (session !== this.session) {
                return
            } else if (!urlList || urlList.length === 0) {
                // console.warn('Не могу получить информацию со страницы', url)
                this.errors++
                continue
            }

            let downloaded = 0
            for (let downloadUrl of Array.isArray(urlList) ? urlList : [urlList]) {
                this.timeTrigger()

                // Проверка был ли уже скачен файл по этой ссылке
                if (this.downloaded.indexOf(downloadUrl) === -1) {
                    if (await this.download((new URL(downloadUrl, url)).href)) {
                        this.downloaded.push(url)
                        downloaded++
                    } else {
                        console.warn('Не могу скачать файл', url)
                        this.errors++
                        errors = true
                    }
                    if (session !== this.session)
                        return
                } else
                    downloaded++

            }

            if (!errors && downloaded > 0) {
                await Tasks.complete()
                // console.log('Задача выполнена', url)
                this.errors = 0
            } else {
                // console.log('Задача не выполнена', url)
            }
        }

        this.work = false
        for (let list of ['__done', '__tasks', '__queue', '__queue_backup']) {
            await StorageApp.remove(list)
        }

        let dead: Array<any> = await Tasks.getDead()
        if (dead.length > 0) {
            console.log('Загрузка окончена, с ошибками', Date.now())
            console.log(dead)
        } else {
            console.log("Загрузка окончена, без ошибок", Date.now())
        }

    }

    static async download(url: string, filename: string = null) {
        await Browser.downloadFile(url, filename)
        return true
    }

    protected static timeTrigger() {
        this.restartTimer = Date.now()
    }

    protected static async restartLoop() {
        if (this.workRestart)
            return

        this.workRestart = true
        await wait(2000)
        while (this.work) {
            let daley = Date.now() - this.restartTimer

            if (daley > Daley.restartDelay) {
                console.warn('Перезапуск скачивания')
                this.errors++
                this.run().then()
            }
            await wait(Daley.restartLoopDelay);
        }
        this.workRestart = false
    }

    static async reanimate() {
        console.log('Реанимация адресов')
        for (let url of await Tasks.getDead() as any) {
            if (await StorageApp.get(url, false))
                continue

            await this.push(url)
            await wait(500)
        }
        await Tasks.clearDead()
        console.log('Мертвые адреса', await Tasks.getDead())
    }

}

