const fs = require('fs')
const path = require('path')

const { Translate } = require('./hex')
const { AbbvEnconding, ExpandEncoding, MakeBuffer } = require('./encoding')


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
        let content = info.hashes ? info.hashes : info.hash

        console.log('INFO:\n========\n')
        console.log(`version: ${info.version}`)
        console.log(`mode: ${info.version == 1 ? 'cbc' : 'gcm' }`)
        console.log(`key length: ${info.keylength}`)
        console.log(`encoding: ${info.encoding}`)
        console.log(`hash type: ${info.flag ? 'list' : 'single'}`)
        console.log(`hashes length: ${info.flag ? info.hash_length : '-' }`)
        console.log(`\niv (hex): ${info.iv.toString('hex')}`)

        if (info.flag) {
            for (var i = 0;i < info.hashes_length;i++) {
                console.log(`index: ${i}, hash: ${content[i]}`)
            }
        } else {
            console.log(`\ncontent (hex): ${content.toString('hex')}`)
        }

        console.log(`content (is JSON): ${!info.isJSON.toString()}\n`)

        console.log(`tag (hex): ${info.tag.toString('hex')}`)
        console.log(`ext (ascii): ${isEmptyBuffer(info.ext) ? '-' : info.ext.toString()}`)

        console.log('==========')
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

    // Fill (hashes) flag
    hexed_string += meta.hashes_length != null ? '01' : '00'

    // Fill (hashes length), only if available
    if (meta.hashes_length) {
        hexed_string += Translate(meta.hashes_length)
    }

    // Fill iv
    if (Buffer.isBuffer(meta.iv)) {
        hexed_string += meta.iv.toString('hex')
    } else {
        // Assuming it is in the form '0x...'
        hexed_string += meta.iv.slice(2)
    }

    // Add 'isJSON' flag
    if (meta.isJSON) {
        hexed_string += '01'
    } else { hexed_string += '00' }

    // Fill Actual encrypted content
    if (meta.hashes) {
        hexed_string += MakeBuffer(meta.hashes, meta.encoding, true).toString('hex')
    } else {
        hexed_string += MakeBuffer(meta.hash, meta.encoding).toString('hex')
    }

    // Fill tag details
    if (meta.tag) {
        if (Buffer.isBuffer(meta.tag)) {
            hexed_string += meta.tag.toString('hex')
        } else {
            hexed_string += meta.tag
        }
    } else {
        hexed_string += MakeBuffer(meta.tags, 'hex', true).toString('hex')
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
    let flag = buff[5]
    let hashes_length = flag ? buff.slice(7, 9) : null
    let iv = flag ? buff.slice(9, 26) : buff.slice(6, 22)
    let isJSON = buff[22]

    // The tag is a full 32 char hex in 'cbc' mode
    // and a shorter 16 char hex in 'gcm' mode
    let tag_type = version == 1 ? 'extended' : 'compressed'
    let tag_start = tag_type == 'extended' ? 37 : 21

    let content = buff.slice(23, buff.length - tag_start).toString(encoding)

    let tag = buff.slice(buff.length - tag_start, buff.length - 5) // Last 16 bytes
    let ext = buff.slice(buff.length - 5)

    return {
        version: version,
        mode: version == 1 ? 'cbc' : 'gcm',
        keylength: keylength,
        encoding: encoding,
        flag: flag,
        hashes_length: hashes_length,
        iv: iv,
        isJSON: isJSON,
        hash: hashes_length > 0 ? null : content,
        hashes: hashes_length > 0 ? content : null,
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

const WriteFile = (fp, data, ext='drln') => {
    if (Buffer.isBuffer(ext)) {
        // Only attempt to sanitize if buffer
        ext = getExtension(ext)
    }

    let outfp = fp.includes('.') ? fp.slice(0, fp.lastIndexOf('.')) + '.' + ext : fp + '.' + ext

    fs.writeFileSync(outfp, data)
}

module.exports = { ReadFile, WriteFile, CreateData, GetMeta, PrintContent }