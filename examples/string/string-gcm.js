const { EncryptFlat, DecryptFlat } = require('../../utils/darlene')
const { PrintContent, GetMeta } = require('../../utils/file')
const { ReadInput } = require('../../utils/psswd')

let secret = 'thisisnotsecure'
let text = "Hello, friend"

let blob = EncryptFlat(secret, text, {
    mode: 'gcm',
    keylength: 256,
    encoding: 'base64',
    isJSON: false,
    isBinary: false
})

let meta = GetMeta(blob)

PrintContent(blob)

let decrypted = DecryptFlat(ReadInput('Enter secret: '), meta)

console.log(`\nDecrypted:\n\n'${decrypted}'`)
