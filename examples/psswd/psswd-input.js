const { ReadInput } = require('../../utils/psswd')

let psswd = ReadInput('Passphrase: ')

console.log(`\n[+] recieved: '${psswd}'`)
