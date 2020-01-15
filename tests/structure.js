const { GetMeta, CreateData } = require('./../utils/file')
const { GetExt } = require('./../utils/file')
const crypto = require('crypto')

// We have to essentially fake the darlene data
let meta = {
    mode: 'gcm',
    keylength: 128,
    isJSON: false,
    isBinary: true,
    ext: 'png',
    encoding: 'base64',
    hash: crypto.randomBytes(16).toString('hex'),
    iv: crypto.randomBytes(16),
    tag: crypto.randomBytes(16)
}

let fakeData = CreateData(meta)
let fakeMeta = GetMeta(fakeData)

console.log(fakeMeta)

console.log(`\nExt matches original: ${GetExt(fakeMeta.ext) == meta.ext}`)
console.log(`Content type: ${fakeMeta.isBinary ? 'Binary' : 'Text/JSON'}`)