[![npm version](https://badge.fury.io/js/%40keydonix%2Fmaker-contract-interfaces.svg)](https://badge.fury.io/js/%40keydonix%2Fmaker-contract-interfaces)

TypeScript classes for interfacing with maker contracts.

# How to use
## Use the library
Note: See sections below for implementation of `./dependencies` and `./utils`
```
npm install @keydonix/maker-contract-interfaces
```
Additionally in NodeJS:
```
npm install @peculiar/webcrypto
```
```typescript
import { Crypto } from '@peculiar/webcrypto' // only necessary in node, can delete this line in browser
import { ETHJoin, Vat } from '@keydonix/maker-contract-interfaces'
import { DependenciesImpl } from './dependencies'
import { attoString, rontoString, attorontoString } from './utils'

async function doStuff() {
	const dependencies = await DependenciesImpl.create()
	// you can find mainnet contract addresses at https://changelog.makerdao.com/releases/mainnet/1.0.0/contracts.json
	const ethJoin = new ETHJoin(dependencies, 0x2f0b23f53734252bda2277357e97e1517d6b042an)
	const vat = new Vat(dependencies, 0x35d1b3f3d7966a1dfe207aa4514c12a259a0492bn)
	const ethId = await ethJoin.ilk_()
	const { Art, rate, spot, line, dust } = await vat.ilks_(ethId)
	console.log(`ETH Collateral Details:`)
	console.log(`Total Debt: ${attoString(Art)}`)
	console.log(`Accumulated Rate?: ${rontoString(rate)}`)
	console.log(`Liquidation Price: ${rontoString(spot)}`)
	console.log(`Debt Ceiling: ${attorontoString(line)}`)
	console.log(`Debt Floor (per vault): ${attorontoString(dust)}`)
}

// so we can run the script with `npx ts-node ./source/sample.ts`
if (require.main === module) {
	// necessary so @peculiar/webcrypto looks like browser WebCrypto, which @zoltu/ethereum-crypto needs
	;(globalThis as any).crypto = new Crypto()
	doStuff().catch(error => {
		console.error(error.message)
		console.error(error.method)
		console.error(error.data)
		console.error(error.stack)
		process.exit(1)
	})
}
```
## Setup Dependencies
You can use whatever implementation of `Dependencies` you want, but the following is what I use and should "just-work" in both node and browser and integrates nicely with these contracts.
```
npm install @zoltu/ethereum-crypto @zoltu/ethereum-types @zoltu/ethereum-abi-encoder @zoltu/ethereum-fetch-json-rpc
```
If you are using NodeJS (instead of browser) you'll also need to install:
```
npm install @peculiar/webcrypto node-fetch @types/node-fetch
```
```typescript
import fetch from 'node-fetch' // only necessary in node, can delete this line in browser
import { ethereum, keccak256, secp256k1, mnemonic, hdWallet } from '@zoltu/ethereum-crypto'
import { JsonRpc, Bytes } from '@zoltu/ethereum-types'
import { encodeMethod, EncodableArray } from '@zoltu/ethereum-abi-encoder'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { Dependencies, TransactionReceipt } from '@keydonix/maker-contract-interfaces'

export class DependenciesImpl implements Dependencies {
	public constructor(private readonly rpc: JsonRpc) {}

	public static readonly create = async () => {
		// signer stuff
		const words = ['zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'zoo', 'wrong']
		const seed = await mnemonic.toSeed(words)
		const privateKey = await hdWallet.privateKeyFromSeed(seed)
		const publicKey = await secp256k1.privateKeyToPublicKey(privateKey)
		const address = await ethereum.publicKeyToAddress(publicKey)
		const sign = async (message: Bytes): Promise<{ r: bigint, s: bigint, yParity: 'even'|'odd' }> => {
			const signature = await ethereum.signRaw(privateKey, message)
			return {
				r: signature.r,
				s: signature.s,
				yParity: signature.recoveryParameter === 0 ? 'even' : 'odd',
			}
		}

		// rpc stuff
		const gasPriceInAttoethProvider = async () => 1n * 10n**9n
		const addressProvider = async () => address
		const signatureProvider =  sign
		const rpc = new FetchJsonRpc('http://localhost:8545', fetch, { addressProvider, gasPriceInAttoethProvider, signatureProvider })
		return new DependenciesImpl(rpc)
	}

	public readonly call = async (to: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<Uint8Array> => {
		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		return await this.rpc.offChainContractCall({ to, data, value })
	}
	public readonly submitTransaction = async (to: bigint, methodSignature: string, methodParameters: EncodableArray, value: bigint): Promise<TransactionReceipt> => {
		const data = await encodeMethod(keccak256.hash, methodSignature, methodParameters)
		return await this.rpc.onChainContractCall({ to, data, value })
	}
}
```
## Utilities
I find these helpful for presenting fixed point bigint values to the user without precision loss.
```typescript
export function fixedPointString(value: bigint, scalar: bigint): string {
	const integerPart = value / 10n**scalar
	const fractionalPart = value % 10n**scalar
	if (fractionalPart === 0n) {
		return integerPart.toString(10)
	} else {
		return `${integerPart.toString(10)}.${fractionalPart.toString(10).padStart(Number(scalar), '0')}`
	}
}
export function attoString(value: bigint): string {
	return fixedPointString(value, 18n)
}
export function rontoString(value: bigint): string {
	return fixedPointString(value, 27n)
}
export function attorontoString(value: bigint): string {
	return fixedPointString(value, 45n)
}
```
