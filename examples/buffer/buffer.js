const { EncryptFlat, DecryptFlat } = require('../../utils/darlene')
const { PrintContent, GetMeta } = require('../../utils/file')
const { readInput } = require('../../utils/psswd')

let secret = 'thisisnotsecure'
let digit = Buffer.from('06c1') // Secret number: 1729 (hex)

let blob = EncryptFlat(secret, digit, {
    mode: 'cbc',
    keylength: 256,
    encoding: 'hex',
    isJSON: false
})

let meta = GetMeta(blob)

PrintContent(blob)

let decrypted = DecryptFlat(readInput('Enter secret: '), meta)

console.log(`\nDecrypted:\n\n'${decrypted}'`) // Returns buffer string
