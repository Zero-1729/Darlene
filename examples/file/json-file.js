const { PrintContent } = require('../../utils/file')
const { EncryptFileSync, DecryptFlat } = require('../../utils/darlene')
const { ReadInput } = require('../../utils/psswd')

const path = require('path')


let secret = 'thisisnotsecure'
let fp = path.join('data', 'samples', 'test.json')

let out = EncryptFileSync(secret, fp, {
    mode: 'gcm',
    keylength: 256,
    encoding: 'hex',
    isJSON: true,
    isBinary: false,
    ext: 'json'
})

PrintContent(out)

let decrypted = DecryptFlat(ReadInput('Enter Passphrase: '), out)

console.log('\nrecovered:')
console.log('\n', decrypted)