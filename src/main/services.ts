import { AccountService } from '@features/account/main/account'
import { AppWindow } from './window'
import { AdBlock } from '@features/adblock/main/adblock'
import { webContents } from 'electron'
import { oauthConfig } from './config'
import { getSettings } from './store'

/** Process-wide services shared by every window. */
export const accountService = new AccountService(oauthConfig, (account) =>
  AppWindow.broadcast('account:changed', account)
)

/** Ad and tracker blocker shared by every session. */
export const adblock = new AdBlock(getSettings, (webContentsId) => {
  const wc = webContents.fromId(webContentsId)
  if (wc) AppWindow.fromSender(wc)?.tabs.refresh()
})
