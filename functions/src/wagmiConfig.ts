import { http, createConfig } from '@wagmi/core'
import { avalanche } from '@wagmi/core/chains'

export const config = createConfig({
  chains: [avalanche],
  transports: {
    [avalanche.id]: http(),
  },
})