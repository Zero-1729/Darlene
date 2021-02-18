const { ReadInput } = require('../../utils/psswd')

let psswd = ReadInput('Passphrase: ')

console.log(`\n[+] received: '${psswd}'`)
