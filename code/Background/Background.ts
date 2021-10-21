import { backgroundCall } from "./BackgroundCall"
import { StorageApp } from "../Download/StorageApp"
import { BackgroundDownloader } from "./BackgroundDownloader"
import { Daley } from "../lib/Configs"

export class Background {

    @backgroundCall('Background.isLoaded')
    static async isLoaded(url: string) {
        if (!Daley.historyProcessIgnore) {
            if (await StorageApp.exist('__queue_backup', url)) {
                return true
            }
        }

        if (Daley.historyIgnore)
            return false
        return await StorageApp.get(url, false)
    }

    @backgroundCall('Background.console')
    static async console(...args: any) {
        console.log(...args);
        return true
    }

    @backgroundCall('Background.DownloadFromContent')
    static async DownloadFromContent(url: string) {
        BackgroundDownloader.push(url).then()
        return true
    }

}