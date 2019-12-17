const { PrintContent } = require('../../utils/file')
const { GetMeta, WriteFile } = require('../../utils/file')
const { EncryptFileSync, DecryptFileSync } = require('../../utils/darlene')
const { readInput } = require('../../utils/psswd')

const path = require('path')


let psswd = readInput('Enter secret: ')

const fp = path.join('data', 'samples', 'message.txt') // Test file path
const efp = path.join('data', 'message.drln')

const meta = {
    keylength: 128,
    mode: 'cbc',
    encoding: 'hex',
    isJSON: false,
}

const buff = EncryptFileSync(psswd, fp, meta)

let data = GetMeta(buff)

PrintContent(data)

WriteFile(efp, buff)

let out = DecryptFileSync(readInput('Enter secret again: '), efp)

console.log('\nDecrypted: \n')
console.log(out.plain)

WriteFile(efp, out.plain, out.metas.ext)