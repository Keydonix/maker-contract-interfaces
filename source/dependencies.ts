import fetch from 'node-fetch' // only necessary in node, can delete this line in browser
import { ethereum, keccak256, secp256k1, mnemonic, hdWallet } from '@zoltu/ethereum-crypto'
import { JsonRpc, Bytes } from '@zoltu/ethereum-types'
import { encodeMethod, EncodableArray } from '@zoltu/ethereum-abi-encoder'
import { FetchJsonRpc } from '@zoltu/ethereum-fetch-json-rpc'
import { Dependencies, TransactionReceipt } from './index' // in your project this will be import { Dependencies } from '@keydonix/maker-contract-interfaces'

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
