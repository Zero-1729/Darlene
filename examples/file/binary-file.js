const { WriteFile }       = require('../../utils/file')
const { EncryptFileSync,
        DecryptFileSync } = require('../../utils/darlene')
const { ReadInput }       = require('../../utils/psswd')

const path = require('path')


let psswd = ReadInput('Enter secret: ')

const fp = path.join('data', 'samples', 'darlene.jpg') // Test file path
const efp = path.join('data', 'darlene.drln')

const meta = {
    keylength: 256,
    mode: 'gcm',
    encoding: 'base64',
    isJSON: false,
    isBinary: true, // indicates whether content is binary file
    ext: 'jpg'
}

const buff = EncryptFileSync(psswd, fp, meta)

WriteFile(efp, buff)

let out = DecryptFileSync(ReadInput('Enter secret again: '), efp)

// Remember the extension isn't stored with the prepended dot ('.')
WriteFile(efp, out.plain, out.metas.ext)