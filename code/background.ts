import "./Background/Background"
import { Configs } from "./lib/Configs"
import { registerListener } from "./Background/BackgroundCall"

Configs.isBackground = true

registerListener()

