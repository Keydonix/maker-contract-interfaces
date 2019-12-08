import { Crypto } from '@peculiar/webcrypto' // only necessary in node, can delete this line in browser
import { ETHJoin, Vat } from '.' // in your project this will be import { Dependencies } from '@keydonix/maker-contract-interfaces'
import { DependenciesImpl } from './dependencies'
import { attoString, rontoString, attorontoString } from './utils'

async function doStuff() {
	const dependencies = await DependenciesImpl.create()
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
