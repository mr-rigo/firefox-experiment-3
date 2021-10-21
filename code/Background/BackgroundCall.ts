import { Configs } from "../lib/Configs"
import { BrowserBackground } from "./BrowserBackground"

class BackgroundDecorator {
    private static currentTicket: number = 0
    private static functions: any = {}
    private static results: any = {}

    private static register(key: string, func: any) {
        this.functions[key] = func
    }

    private static get(key: string) {
        return this.functions[key]
    }

    private static massageLister(request: any, sender: any, sendResponse: any) {
        let out = {};
        let key = request.backgroundAction;

        if (key === '__get_result__') {
            let out = undefined;
            let result = this.results[request.args];

            if (result !== undefined) {
                out = result;
                delete this.results[request.args];
            }

            sendResponse({ response: out });
            return
        }

        let func = this.get(key);

        if (!func) {
            console.error('Нет такого действия', key)
            sendResponse({ response: out })
            return
        }

        let result = func(...request.args);

        if (result instanceof Promise) {
            let ticket = this.currentTicket;
            this.currentTicket++;
            result.then(arg => this.results[ticket] = arg);
            out = { __wait_ticket__: ticket }
        } else {
            out = result
        }

        sendResponse({ response: out })
    }

    private static async send(key: any, ...args: any) {
        let result = await BrowserBackground.message({
            backgroundAction: key,
            args: args
        });

        if (result.response !== undefined) {
            let ticket = result.response.__wait_ticket__ !== undefined ? result.response.__wait_ticket__ : false;

            if (ticket !== false) {
                while (true) {
                    await new Promise(resolve => window.setTimeout(resolve, 200));

                    let waitResult = await BrowserBackground.message({
                        backgroundAction: '__get_result__', args: ticket
                    });

                    waitResult = waitResult.response;

                    if (waitResult !== undefined) {
                        return waitResult;
                    }
                }
            } else
                return result.response;
        }
    }

    static registerListener() {
        BrowserBackground.addListenerMessage((request: any, sender: any, sendResponse: any) =>
            BackgroundDecorator.massageLister(request, sender, sendResponse))

    }

    static call(key: string) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            let func = descriptor.value
            BackgroundDecorator.register(key, func)

            descriptor.value = async (...arg: any) => {
                if (Configs.isBackground) {
                    let res = func(...arg)

                    if (res instanceof Promise) {
                        return await new Promise(resolve => res.then((value: any) => resolve(value)));
                    } else
                        return res
                } else {
                    return await BackgroundDecorator.send(key, ...arg)
                }
            }
        };
    }
};

export let registerListener = BackgroundDecorator.registerListener

export let backgroundCall = BackgroundDecorator.call