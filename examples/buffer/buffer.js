const { EncryptFlat, DecryptFlat }  = require('../../utils/darlene')
const { PrintContent, GetMeta }     = require('../../utils/file')
const { ReadInput }                 = require('../../utils/psswd')

let secret = 'thisisnotsecure'
let digit = Buffer.from('06c1') // Secret number: 1729 (hex)

let blob = EncryptFlat(secret, digit, {
    mode: 'cbc',
    keylength: 256,
    encoding: 'hex',
    isJSON: false,
    isBinary: false
})

let meta = GetMeta(blob)

PrintContent(blob)

// Here you can decide to convert it back to a Buffer; using `Buffer.from(data, 'hex')`
// I chose not to because I need to print out the content
let decrypted = DecryptFlat(ReadInput('Enter secret: '), meta)

console.log(`\nDecrypted:\n\n'${decrypted}'`) // Returns buffer string
