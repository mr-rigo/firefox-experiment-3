import { StorageApp } from "./StorageApp"

export class Task {
    url: string
    script: string

    done: boolean = false
    restart: boolean = false
    counter: number = 0

    protected static maxIter = 1

    constructor(url: string, script: string = null, done = false, restart = false, counter = 0) {
        this.url = url
        this.script = script

        this.done = done
        this.restart = restart
        this.counter = counter
    }

    async iter_direct() {
        this.counter++

        if (this.restart) {
            if (this.counter > Task.maxIter * 2) {
                console.error('Мертвый адрес', this.url)
                await this.complete(false)
                return false
            }
        } else if (this.counter > Task.maxIter) {
            console.warn('Не могу обработать', this.url)
            return false
        }
        return true
    }

    async complete(res = true) {
        let url = this.url
        if (res) {
            await StorageApp.set(url, true)
            await StorageApp.add('__done', url)
        } else {
            await StorageApp.add('__dead', url)
        }
        await StorageApp.remove('__queue_backup', url)
        await StorageApp.remove('__tasks', url)
    }

    async isDead() {
        return await StorageApp.exist('__dead', this.url)
    }

    static deserialize(data: any) {
        return new Task(data.url, data.script, data.done, data.restart, data.counter)
    }

    async dead() {
        this.complete(false)
    }

}


