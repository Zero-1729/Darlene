const { WriteFile } = require('../../utils/file')
const { EncryptFileSync, DecryptFileSync } = require('../../utils/darlene')
const { ReadInput } = require('../../utils/psswd')

const path = require('path')


let psswd = ReadInput('Enter secret: ')

const fp = path.join('data', 'samples', 'image.jpeg') // Test file path
const efp = path.join('data', 'image.drln')

const meta = {
    keylength: 256,
    mode: 'gcm',
    encoding: 'base64',
    isJSON: false,
    ext: 'jpeg' // only set to null for text files
}

const buff = EncryptFileSync(psswd, fp, meta)

WriteFile(efp, buff)

let out = DecryptFileSync(readInput('Enter secret again: '), efp)

WriteFile(efp, out.plain, out.metas.ext)