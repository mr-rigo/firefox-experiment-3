import { Downloader } from "../Download/Downloader"
import { BrowserBackground } from "./BrowserBackground"


export class BackgroundDownloader extends Downloader {

    static async direct_run(url: string, script: string, default_: any = null, auto_close = false) {
        return await BrowserBackground.openTabAndScript(url, script, default_)
    }

    static async download(url: string, filename: string = null) {
        await BrowserBackground.downloadFile(url, filename)
        return true
    }

}

(window as any).BackgroundDownloader = BackgroundDownloader
