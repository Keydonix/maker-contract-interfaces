import { generateContractInterfaces } from 'solidity-typescript-generator'
import { readFile as readFileCallback, writeFile as writeFileCallback } from 'fs'
import { join as pathJoin } from 'path'
import { promisify } from 'util'
const readFile = promisify(readFileCallback)
const writeFile = promisify(writeFileCallback)

async function run() {
	const makerCompilerOutputJson = await readFile(pathJoin(__dirname, './maker-compiler-output.json'), { encoding: 'utf8' })
	const makerCompilerOutput = JSON.parse(makerCompilerOutputJson)
	const contractInterfaces = generateContractInterfaces(makerCompilerOutput)
	await writeFile(pathJoin(__dirname, '../source/index.ts'), contractInterfaces, { encoding: 'utf8' })
}

run().then(() => {
	process.exit(0)
}).catch(error => {
	console.error(error)
	process.exit(1)
})
