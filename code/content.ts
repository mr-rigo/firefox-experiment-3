import { Configs } from "./lib/Configs"
import { Content } from "./lib/Content"

Configs.isBackground = false

let sites = [Content]

for (let contentClass of sites) {
    if (!contentClass.isSupportPage()) {
        continue
    }

    let content: Content = new contentClass()
    content.run()
    break
}

