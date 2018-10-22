[![npm version](https://badge.fury.io/js/%40keydonix%2Fmaker-contract-interfaces.svg)](https://badge.fury.io/js/%40keydonix%2Fmaker-contract-interfaces)

TypeScript classes for interfacing with maker contracts.

```typescript
import { Tub } from '@keydonix/maker-contract-interfaces'

// you will need to fill in dependencies for Tub (first constructor parameter)
// these are functions it uses to talk to an Ethereum client, intentionally not included since everyone has their favorite library
// everything is typed with TypeScript, so your editor should provide autocomplete/hints for filling it in
const tub = new Tub({...}, '0x448a5065aebb8e423f0896e6c5d525c040f59af3')
tub.bite('0x0000000000000000000000000000000000000000000000000000000000000012')
```
