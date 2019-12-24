const { AbbvEnconding, ExpandEncoding, MakeBuffer } = require('./encoding')

const fs   = require('fs')
const path = require('path')


const isEmptyBuffer = (buff) => {
    let emptyBuff = new Buffer.alloc(buff.length)
    
    return emptyBuff.equals(buff)
}

const keylengths = {
    128: '7f',
    192: 'bf',
    256: 'ff'
}

const getExtension = (ext) => {
    if (!Buffer.isBuffer(ext)) {
        return ext
    }

    // Remember the 'ext' buffer carries zeros when not filled
    // So we have to remove all zero bytes
    return ext.asciiSlice().replace(new RegExp('\u0000', 'g'), '')
}

const PrintContent = (data) => {
    if (Buffer.isBuffer(data)) {
        // We have a darlene data blob
        let info = GetMeta(data)

        console.log('\nDarlene (Info):\n--------------\n--------------\n')
        console.log("version: ", info.version)
        console.log("mode: ", info.version == 1 ? "cbc" : "gcm")
        console.log("key length: ", info.keylength)
        console.log("encoding: ", info.encoding)
        console.log("\nJSON: ", !info.isJSON.toString())
        console.log("\niv (hex): ", info.iv.toString('hex'))

        console.log("\ntag (hex): ", info.tag.toString('hex'))
        console.log("\next (ascii): ", isEmptyBuffer(info.ext) ? '-' : info.ext.toString())

        console.log('\n---------------\n---------------\n')
    } else {
        console.log(data)
    }
}


const CreateData = (meta) => {
    let hexed_string = ''

    // We fill in the 'hexed_string' one piece of info at a time
    // Fill in file version byte
    hexed_string += meta.mode == 'cbc' ? '01' : '02'

    // Fill in key length
    hexed_string += keylengths[meta.keylength]

    // Fill in encoding
    let tmp_buff = Buffer.alloc(3)
    let zipped_encoding = AbbvEnconding(meta.encoding)
    tmp_buff.asciiWrite(zipped_encoding)
    hexed_string += tmp_buff.toString('hex')

    // Fill iv
    if (Buffer.isBuffer(meta.iv)) {
        hexed_string += meta.iv.toString('hex')
    } else {
        // Assuming it is in the form '0x...'
        hexed_string += meta.iv.slice(0, 2) == '0x' ? meta.iv.slice(2) : meta.iv
    }

    // Add 'isJSON' flag
    if (meta.isJSON) {
        hexed_string += '01'
    } else { hexed_string += '00' }

    // Fill Actual encrypted content
    hexed_string += MakeBuffer(meta.hash, meta.encoding).toString('hex')

    // Fill tag details
    if (Buffer.isBuffer(meta.tag)) {
        hexed_string += meta.tag.toString('hex')
    } else {
        hexed_string += meta.tag
    }

    // Fill in file extention tag
    if (meta.ext) {
        tmp_buff = Buffer.alloc(5)
        tmp_buff.asciiWrite(meta.ext)
        hexed_string += tmp_buff.toString('hex')
    } else {
        hexed_string += '0000000000'
    }

    return Buffer.from(hexed_string, 'hex')
}

const GetMeta = (buff) => {
    let version = buff[0]
    let keylength = buff[1] + 1
    let encoding = ExpandEncoding(buff.slice(2, 5).toString('utf8'))
    let iv = buff.slice(5, 21)
    let isJSON = buff[21]

    // The tag is a full 32 char hex in 'cbc' mode
    // and a shorter 16 char hex in 'gcm' mode
    let tag_type = version == 1 ? 'extended' : 'compressed'
    let multiplier = tag_type == 'extended' ? 32 : 16
    let tag_start = buff.length - (5 + multiplier)

    let content = buff.slice(22, tag_start).toString(encoding)

    let tag = buff.slice(tag_start, buff.length - 5) // Last 16 bytes
    let ext = buff.slice(buff.length - 5)

    return {
        version: version,
        mode: version == 1 ? 'cbc' : 'gcm',
        keylength: keylength,
        encoding: encoding,
        iv: iv,
        isJSON: isJSON,
        hash: content,
        tag: tag,
        ext: ext
    }
}

const ReadFile = (fp, print=true) => {
    let content = fs.readFileSync(fp)

    if (!print) {
        printContent(content)
    }

    return content
}

const WriteFile = (fp, data, ext='.drln') => {
    if (Buffer.isBuffer(ext)) {
        // Only attempt to sanitize if buffer
        ext = getExtension(ext)
    }

    let lastDotIdx = fp.lastIndexOf('.')
    let outfp = path.extname(fp) ? 
                fp.slice(0, lastDotIdx) + ext : fp + ext

    fs.writeFileSync(outfp, data)

    // So we can know the final file path written to
    return outfp
}

module.exports = { ReadFile, WriteFile, CreateData, GetMeta, PrintContent }
