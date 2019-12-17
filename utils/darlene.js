const fs = require('fs')

const crypto = require('crypto')
const { HexToBuffer } = require('./hex')
const { CreateData, GetMeta, ReadFile } = require('./file')
const { AbbvEnconding, ExpandEncoding } = require('./encoding')

/*
* Uses AES CBC/GCM Symmetric Cipher To Encrypt/Decrypt inputs
*/

/*
*  CreateKey (fn):-
*
*  Creates a key from a 'passphrase', returning a Buffer
*
*
*  Inputs:
*
*  passphrase -> (String)
*
*  Output:
*
*  key -> (Buffer)
*  key_length -> Int
*
*/

const CreateKey = (passphrase, key_length=24) => {
    // key_lengths:
    //              24 -> 192 keys
    //              32 -> 256 keys
    try {
        return crypto.scryptSync(passphrase, 'salt', key_length)
    } catch (e) {
        throw new Error("[KeyLengthError] Key length out of valid range")
    }
}


/*
    Creates a cipher/decipher
*/
const CreateCipher = (meta) => {
    return crypto.createCipheriv(`aes-${meta.keylength}-${meta.mode}`, meta.key, meta.iv)
}

const CreateDecipher = (meta) => {
    return crypto.createDecipheriv(`aes-${meta.keylength}-${meta.mode}`, meta.key, meta.iv)
}


/*
*
*  SHA256 (fn):-
*
*  Generates 'sha256' hash of inputs
*
*  Input:
*
*  raw -> <Buffer> | <String>
*
*  Output:
*
*  hash -> <String>
*
*/

const SHA256 = (raw) => {
    let hash = crypto.createHash('sha256')
    let key = raw

    // Obtain 'hex' text if raw is buffer
    if (Buffer.isBuffer(raw)) {
        key = raw.toString('hex')
    }

    hash.update(key)

    return hash.digest('hex')
}


/*
*
*  GetAuthTag (fn)
*
*  Inputs:
*
*  passphrase -> <String>
*  iv -> <Buffer>
*  cryptedText -> <String> 'hex'
*
*  Outputs:
*
*  tag -> <String> 'hex'
*
*/

const GetAuthTag = (passphrase, iv, cryptedText) => {
    let key = SHA256(passphrase)
    let tagger = crypto.createHmac('sha256', key)

    tagger.update(iv.toString('hex') + cryptedText)

    return tagger.digest('hex')
}


/* String, JSON & Buffer (D)Encryption */

/*
*  Encrypts data (string/JSON/Buffer) using using key created from passphrase.
*  Outputs an object containing;
*                   the Initialization Vector(iv)
*                   and encrypted data (hash)
*
*  Inputs:
*
*  passphrase -> (String)
*  buff -> (String | Buffer | JSON)
*
*  Output:
*
*  [object]:
*               iv -> Initialization Vector <Buffer>
*               hash -> (String)
*               keylength -> <String>; defaults to '128'
*               tag -> Auth Tag
*               encoding -> text encoding; defaults to 'hex'
*               mode -> AES mode; defaults to gcm
*               isJSON -> whether encrypted data s JSON
*
*/

const EncryptFlat = (passphrase, data, meta) => {
    // Change content to string
    if (Buffer.isBuffer(data)) {
        data = data.toString('utf8')
    }

    // Turn JSON into string
    if (meta.isJSON) {
        data = JSON.stringify(data)
    }

    // create cipher
    let iv = crypto.randomBytes(16)
    let key = CreateKey(passphrase, meta.keylength/8)

    let cipher = CreateCipher({keylength: meta.keylength, mode: meta.mode, key: key, iv: iv})

    let content = cipher.update(data, 'utf8', meta.encoding)
    content += cipher.final(meta.encoding)

    // Generate tag from 'passphrase', 'iv', and 'cipher text'
    let tag = meta.mode == 'gcm' ? cipher.getAuthTag() : GetAuthTag(passphrase, iv, content)

    return CreateData({
        mode: meta.mode,
        iv: iv,
        keylength: meta.keylength,
        encoding: AbbvEnconding(meta.encoding),
        tag: tag,
        hash: content,
        isJSON: meta.isJSON,
        ext: null
    })
}


/*
*
*  Decrypts data ('hash') using using key created from passphrase.
*  Outputs an object containing;
*                   the Initialization Vector(iv)
*                   and decrypted data (text)
*
*  Inputs:
*
*  passphrase   -> (String)
*  hash         -> (String | Buffer)
*  iv           -> Initialization Vector
*
*  Output:
*
*  [object]:
*               text  -> (String)
*
*/

const DecryptFlat = (passphrase, data) => {
    // Scrapp darlene data
    let meta = Buffer.isBuffer(data) ? GetMeta(data) : data
    
    let key = CreateKey(passphrase, meta.keylength/8)
    let iv = meta.iv

    // Check if 'iv' is hex value and convert to 16 byte buffer
    if (!Buffer.isBuffer(meta.iv)) {
        iv = HexToBuffer(iv, 16)
    }

    let decipher = CreateDecipher({keylength: meta.keylength, mode: meta.mode, key: key, iv: iv})

    if (meta.mode == 'gcm') {
        decipher.setAuthTag(meta.tag)
    }

    if (meta.mode == 'cbc') {
        // Generate tag from 'passphrase', 'iv', and 'cipher text'
        // To compare with existing tag
        let newTag = GetAuthTag(passphrase, iv, meta.hash)

        // If the secret passphrase, iv or ciphertext edited
        // It will fail to encrypt
        if (meta.tag.toString('hex') != newTag) {
            throw new Error('[TagError] Tag Mismatch, suspecting edited inputs!')
        }

        try {
            let decrypted = decipher.update(meta.hash, ExpandEncoding(meta.encoding), 'utf8')

            decrypted += decipher.final('utf8')

            return meta.isJSON ? JSON.parse(decrypted) : decrypted
        } catch (e) {
            if (e.message.includes('error:06065064')) {
                throw new Error("[KeyLengthError] CBC Key Length provided is invalid")
            } else {
                throw new Error("[EncodingError] Provided wrong encoding for cipher text")
            }
        }
    } else {
        // GCM mode
        let text = decipher.update(meta.hash, ExpandEncoding(meta.encoding), 'utf8')

        try {
            text += decipher.final('utf8')

            return meta.isJSON ? JSON.parse(text) : text
        } catch (e) {
            throw new Error('[AuthError] Bad or Forged tag detected!')
        }
    }
}

/*
*  Encrypts a file using using key created from passphrase.
*  Outputs an object containing;
*                   the Initialization Vector(iv)
*                   and encrypted data (hash)
*
*  Inputs:
*
*  passphrase -> (String)
*  path -> string
*  meta -> [object]; encoding, iv, mode, isJOSN, keylength
*
*  Output:
*
*  [object]:
*               iv -> Initialization Vector <Buffer>
*               hash -> (String)
*               keylength -> <String>; defaults to '128'
*               tag -> Auth Tag
*               encoding -> text encoding; defaults to 'hex'
*               mode -> AES mode; defaults to gcm
*               isJSON -> whether encrypted data is JSON (auto false)
*               ext -> file extention
*
*/

const EncryptFileSync = (passphrase, fp, meta) => {
    meta.ext = fp.slice(fp.lastIndexOf('.')+1)

    let buff

    try {
        buff = fs.readFileSync(fp)
    } catch (e) {
        throw new Error(`[Couldn't read file '${fp}': ${e.message}`)
    }

    // create cipher
    let iv = crypto.randomBytes(16)
    let key = CreateKey(passphrase, meta.keylength/8)

    let cipher = CreateCipher({keylength: meta.keylength, mode: meta.mode, key: key, iv: iv})

    let encrypted = cipher.update(buff, 'utf8', meta.encoding)
    encrypted += cipher.final(meta.encoding)

    // Generate tag from 'passphrase', 'iv', and 'cipher text'
    let tag = meta.mode == 'gcm' ? cipher.getAuthTag() : GetAuthTag(passphrase, iv, encrypted)

    meta.hash = encrypted
    meta.iv = iv
    meta.tag = tag
    meta.ext = meta.ext || null

    return CreateData(meta)
}


/*
*
*  Decrypts data ('hash') using using key created from passphrase.
*  Outputs an object containing;
*                   the Initialization Vector(iv)
*                   and decrypted data (text)
*
*  Inputs:
*
*  passphrase   -> (String)
*  hash         -> (String | Buffer)
*  iv           -> Initialization Vector
*
*  Output:
*
*  [object]:
*               text  -> (String)
*
*/

const DecryptFileSync = (passphrase, fp) => {
    let meta = GetMeta(ReadFile(fp))
    let content = meta.hash

    let key = CreateKey(passphrase, meta.keylength/8)
    let iv = meta.iv

    // Check if 'iv' is hex value and convert to 16 byte buffer
    if (!Buffer.isBuffer(iv)) {
        iv = HexToBuffer(iv, 16)
    }

    let decipher = CreateDecipher({keylength: meta.keylength, mode: meta.mode, key: key, iv: iv})

    if (meta.mode == 'gcm') {
        decipher.setAuthTag(meta.tag)
    }

    if (meta.mode == 'cbc') {
        // Generate tag from 'passphrase', 'iv', and 'cipher text'
        // To compare with existing tag
        let newTag = GetAuthTag(passphrase, iv, content)

        // If the secret passphrase, iv or ciphertext edited
        // It will fail to encrypt
        if (meta.tag.toString('hex') != newTag) {
            throw new Error('[TagError] Tag Mismatch, suspecting edited inputs!')
        }

        try {
            let decrypted = decipher.update(content, ExpandEncoding(meta.encoding), 'utf8')

            decrypted += decipher.final('utf8')

            // Writing file should be handled externally
            return {plain: decrypted, metas: meta}
        } catch (e) {
            if (e.message.includes('error:06065064')) {
                throw new Error("[KeyLengthError] CBC Key Length provided is invalid")
            } else {
                throw new Error("[EncodingError] Provided wrong encoding for cipher text")
            }
        }
    } else {
        // GCM mode
        let text = decipher.update(content, ExpandEncoding(meta.encoding), 'utf8')

        try {
            text += decipher.final('utf8')

            // Writing file should be handled externally
            return {plain: text, metas: meta}
        } catch (e) {
            throw new Error('[AuthError] Bad or Forged tag detected!')
        }
    }
}

module.exports = { GetAuthTag,
                   CreateKey,
                   CreateCipher,
                   CreateDecipher,
                   EncryptFlat,
                   DecryptFlat,
                   EncryptFileSync,
                   DecryptFileSync }
