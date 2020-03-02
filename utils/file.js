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

const GetExt = (buff) => {
    // returns a file extension without the unicode escape code
    // Remember the 'ext' buffer carries zeros when not filled
    // So we have to remove all zero bytes
    return Buffer.isBuffer(buff) ? 
           // Returns extracted ext
           buff.toString().replace(new RegExp('\u0000[0000]*', 'g'), '') : 
           // Strips all dots from ext
           buff.replace(/\.*/, '')
}

const Exists = (fp) => {
    // returns whether a path exists or not
    return fs.existsSync(fp)
}

const isFile = (fp) => {
    // Detects whether path is file or directory
    if (Exists(fp)) {
        return fs.statSync(fp).isFile()
    }

    return false
}

const isDirectory = (fp) => {
    return !isFile(fp) && Exists(fp)
}

const JoinFP = (path, ext, concat) => {
    if (ext == '') {
        return path
    }

    // concate multiple exts
    if (concat) {
        for (var i = 0;i < ext.length;i++) {
            path += '.' + ext[i]
        }

        return path
    }

    return path + '.' + ext
}

const SplitFP = (fp, single=false) => {
    // strip entire path except file name
    if (single) {
        fp = path.basename(fp)
    }

    // returns the file path and extension
    if (path.extname(fp).length > 0) {
        // Returns the file path stripped of its ext alongside the ext
        return {fp: fp.slice(0, fp.lastIndexOf('.')), ext: path.extname(fp).slice(1)}
    }

    return {fp: fp, ext: 'txt'}
}

const isValidPath = (fp) => {
    if (fp == null) {
        return false
    } else {
        return path.basename(fp) == '.'
    }
}

const StripMerge = (fp, ext) => {
    // returns properly joined text
    if (path.extname(fp).length > 0) {
        return fp.replace(/\.[a-zA-Z]+$/, '.' + GetExt(ext))
    }

    // No extension file name
    return  JoinFP(fp, GetExt(ext))
}


const isDarleneFile = (fp) => {
    if (fp) {
        return fp.slice(fp.lastIndexOf('.')+1) == 'drln'
    }

    return false
}

const PrintContent = (data) => {
    if (Buffer.isBuffer(data)) {
        // We have a darlene data blob
        let info = GetMeta(data)

        console.log("\n-------BEGIN DARLENE DIGEST")
        console.log("version: ", info.version)
        console.log("mode: ", info.version == 1 ? "cbc" : "gcm")
        console.log("key length: ", info.keylength)
        console.log("encoding: ", info.encoding)
        console.log("\nBinary: ", info.isBinary)
        console.log("\nJSON: ", !info.isJSON)
        console.log("\niv (hex): ", info.iv.toString('hex'))

        console.log("\ntag (hex): ", info.tag.toString('hex'))
        console.log("\next (ascii): ", isEmptyBuffer(info.ext) ? '-' : info.ext.toString())

        console.log("END DARLENE DIGEST---------")
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

    // Add content type flag
    if (meta.isBinary) {
        hexed_string += '02'
    } else if (meta.isJSON) {
        hexed_string += '01'
    } else {
        // Plain text 
        hexed_string += '00'
    }

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
    let contentFlag = buff[21] //isJSON = buff[21]

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
        isBinary: contentFlag == 2,
        isJSON: contentFlag == 1,
        hash: content,
        tag: tag,
        ext: ext
    }
}

const ReadFile = (fp, print=true) => {
    try {
        let content = fs.readFileSync(fp)

        if (!print) {
            printContent(content)
        }

        return content
    } catch (e) {
        // File does not exist
        throw `[FileError] ${e.message.split(':')[1]}`
    }
}

const WriteFile = (fp, data, ext='drln', concat=false) => {
    // NOTE: Remember the 'ext' overrides whatever ext 'fp' carries
    // Sanitized output: properly joined fp and ext
    let outfp = StripMerge(fp, ext)

    // Check of concatenation enabled
    if (concat) {
        // We can only concat if extension exists
        // Note: It's assumed the exts were concatenated before hand
        outfp = fp
    }

    fs.writeFileSync(outfp, data)

    // So we can know the final file path written to
    return outfp
}

module.exports = { ReadFile, WriteFile, CreateData, GetMeta, PrintContent, isEmptyBuffer, GetExt, isDarleneFile, isValidPath, JoinFP, SplitFP, StripMerge, isDirectory }
