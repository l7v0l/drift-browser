import { AccountService } from '@features/account/main/account'
import { AppWindow } from './window'
import { oauthConfig } from './config'

/** Process-wide services shared by every window. */
export const accountService = new AccountService(oauthConfig, (account) =>
  AppWindow.broadcast('account:changed', account)
)
