const { EncryptFlat, DecryptFlat } = require('../../utils/darlene')
const { WriteFile, ReadFile } = require('../../utils/file')
const { readInput } = require('../../utils/psswd')

const path = require('path')


let secret = 'thisisnotsecure'
let text = "Hello, friend"
let fp = path.join('data', 'test-string')
let efp = fp + '.drln'

WriteFile(fp, EncryptFlat(secret, text, {
    mode: 'gcm',
    keylength: 256,
    encoding: 'base64',
    isJSON: false
}))

let decrypted = DecryptFlat(readInput('Enter Passphrase: '), ReadFile(efp))

console.log("\nDecrypted: \n")
console.log(decrypted)