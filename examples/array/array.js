const { EncryptFlat, DecryptFlat }  = require('../../utils/darlene')
const { PrintContent }              = require('../../utils/file')
const { Matches }                   = require('../../utils/match')

let secret = 'thisisnotsecure'

/* To encrypt an array just turn it into JSON */
/* ... because encrypting each item leaks info for repeated letters */
let words = JSON.stringify([
    "absurd",
    "advance",
    "crucial",
    "deliver",
    "furnace",
    "lecture"
])

let blob = EncryptFlat(secret, words, {
    mode: 'cbc',
    keylength: 128,
    encoding: 'base64',
    isJSON: true,
    isBinary: false
})

PrintContent(blob)

let decrypted = DecryptFlat(secret, blob)

console.log('\nrecovered: \n')
console.log(JSON.parse(decrypted))
console.log("\nPlain Content Matches Decrypted: ", Matches(words, decrypted))
