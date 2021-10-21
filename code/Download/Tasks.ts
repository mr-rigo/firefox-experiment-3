import { Task } from "./Task"
import { StorageApp } from "./StorageApp"

export class Tasks {

    protected static queue: Array<any> = []
    protected static loop = false

    static async push(url: string, script: string = '') {
        this.queue.unshift([url, ''])
        if (this.loop)
            return true

        this.loop = true

        while (this.queue.length > 0) {
            let data = this.queue.pop()
            let url = data[0]            

            let exist = await this.exist(url)
            if (!url || exist) {
                continue
            }
            await StorageApp.add('__queue', url)
            await StorageApp.add('__queue_backup', url)

            let task = new Task(url, '')
            await this.setTask(task)
        }
        this.loop = false
        return true
    }

    static async exist(url: string) {
        return await StorageApp.exist('__queue_backup', url)
    }

    protected static async nextDirect() {
        let self = this

        async function next() {
            let url = await StorageApp.pop('__queue')
            if (!url)
                return
            let task = await self.getTask(url)
            if (!task) {
                return
            }

            if (await self.iter(task)) {
                return task
            }
        }

        // Итерация имеющейся задачи
        let current_task = await this.getLast()
        if (current_task) {
            if (await this.iter(current_task))
                return current_task
            else
                await this.lastClear()

        }

        await this.setLast(await next())
        let task__ = await this.getLast()
        if (task__)
            return task__

        // Проверяем есть ли задачи которые нужно перезапустить
        let backup = await StorageApp.get('__queue_backup', [])

        for (let url of backup) {
            let task: Task = await this.getTask(url)

            if (!task) {
                if (!await StorageApp.get(url, false)) {
                    console.log('Адрес провалился', url)
                    await new Task(url).dead()
                }
            } else if (!task.isDead()) {
                this.restart(task)
                await StorageApp.add('__queue', url)
            } else {
                await task.dead()
            }
        }

        await StorageApp.set('__queue_backup', await StorageApp.get('__queue'))

        await this.setLast(await next())
        return await this.getLast()
    }

    static async complete() {
        let task = await this.getLast()
        if (task) {
            await task.complete()
        }
        await this.lastClear()
    }

    static async next() {
        let task = await this.nextDirect()
        if (task) {
            return [task.url, '']
        }
    }

    protected static async setLast(task: Task) {
        if (task) {
            await StorageApp.set('__last_task', task.url)
        }
    }

    protected static async getLast() {
        let last_task = await StorageApp.get('__last_task')
        if (last_task)
            return await this.getTask(last_task)
    }

    protected static async lastClear() {
        await StorageApp.remove('__last_task')
    }

    protected static async getTask(url: string) {
        let task = await StorageApp.get('__tasks', null, url)
        if (!task)
            return
        return Task.deserialize(task)
    }

    protected static async setTask(task: Task) {
        await StorageApp.add('__tasks', task, task.url)
    }

    protected static async iter(task: Task) {
        let res = await task.iter_direct()
        await this.setTask(task)
        return res
    }

    static async restart(task: Task) {
        task.restart = true
        await Tasks.setTask(task)
    }

    static async getDead() {
        return await StorageApp.get('__dead', [])
    }

    static async clearDead() {
        await StorageApp.set('__dead', [])
        await StorageApp.remove('__dead')
    }

}