import { remove } from "../lib/Helpers"
import { BrowserBackground } from "../Background/BrowserBackground"

export class StorageApp {
    static data = {}

    static async add_to_dict(key: string, value_name: string, value: any) {
        let obj = await this.get(key, {})
        if (typeof obj !== 'object' || Array.isArray(obj)) {
            obj = {}
        }

        obj[value_name] = value
        this.set(key, obj)
    }

    static async add(key: string, value: any, value_name: any = null) {
        if (value_name === null) {
            let arr = await this.get(key, [])
            if (!Array.isArray(arr)) {
                arr = []
            }
            arr.unshift(value)
            await this.set(key, arr)
        } else {
            let obj = await this.get(key, {})
            if (typeof obj !== 'object' || Array.isArray(obj)) {
                obj = {}
            }

            obj[value_name] = value
            await this.set(key, obj)
        }
    }

    static async set(key: string, value: any) {
        await BrowserBackground.setValue(key, value)
    }

    static async remove(key: string, value_name: any = null) {
        if (value_name !== null) {
            return await this.remove_by_value(key, value_name)
        }
    }

    static async remove_from_dict(key: string, value_name: string) {
        let obj = await this.get(key)

        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return
        }

        delete obj[value_name]
    }

    static async remove_by_value(key: string, value: any) {
        let obj = await this.get(key)
        if (!obj) {
            return
        } else if (Array.isArray(obj)) {
            if (obj.indexOf(value) !== -1) {
                obj = remove(obj, value)
                await this.set(key, obj)
            }
        } else if (typeof obj === 'object') {
            if (value in obj) {
                delete obj[value]
                await this.set(key, obj)
            }
        } else {
            return false
        }
    }

    static async get_direct(key: string, default_: any = null) {
        let res: any = await BrowserBackground.getValue(key)
        return res[key] ? res[key] : default_
    }

    static async get(key: string, default_: any = null, value_name: string = null) {
        let obj = await this.get_direct(key, default_)

        if (value_name === null)
            return obj
        if (typeof obj === 'object' && value_name in obj) {
            return obj[value_name]
        }
    }

    static async getAll() {
        return await BrowserBackground.getAllValues()
    }

    static async exist(key: string, value: any = null) {
        let obj = await this.get(key)

        if (!obj) {
            return false
        } else if (Array.isArray(obj)) {
            return obj.indexOf(value) !== -1
        } else if (typeof obj === 'object') {
            return obj[value] !== undefined
        } else {
            return false
        }

    }

    static async pop(key: string) {
        let obj = await this.get(key)

        if (Array.isArray(obj) && obj.length > 0) {
            let res = obj.pop()
            await this.set(key, obj)
            return res
        }
    }
}

export async function configs(key: string, arg: any = null, default_: any = null) {
    if (arg !== null)
        await StorageApp.set(key, arg)
    else
        return await StorageApp.get(key, default_)
}

