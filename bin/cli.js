#!/usr/local/bin/node

const path = require('path')
const fs   = require('fs')

const { buildMeta, sanitizeArgs, checkSemantics } = require('../utils/trenton')
const { EncryptFlat, EncryptFileSync, DecryptFlat, DecryptFileSync } = require('./../utils/darlene')
const { ReadFile, WriteFile, GetMeta, isEmptyBuffer, isDarleneFile, SplitFP, StripMerge, GetExt } = require('./../utils/file')
const { ReadInput } = require('./../utils/psswd')


console.log('-------------')
console.log('Darlene CLI')
console.log('-------------\n')

const help = () => {
    console.log('Available options:\n')
    console.log('-h  --help\t\targs: - \t\tPrint this message.\n\n\t\t\tNote: should be used without other options.\n\n')
    console.log('-c  --content\t\targs: <string> \t\tSpecify raw text to encrypt\n\n\t\t\tNote: specifying output path for file is optional when this flag is used\n\n')
    console.log('-f  --file\t\targs: <filepath> \t\tSpecify file to read from.\n\n\t\t\tNote: Option required.\n\n')
    console.log("-o  --out\t\targs: <filepath> \t\tSpecify where to write darlene file.\n\n\t\t\tDefaults to writing output file in the current directory.\n\n")
    console.log("-m  --mode\t\targs: <mode> \t\tSpecify the specific AES mode, value is either 'gcm' or 'cbc'.\n\n\t\t\tDefaults to 'gcm' if this flag not specified.\n\n")
    console.log("-k  --keylength\t\targs: <keylength> \t\tSpecify the key length, values are '128', '192', '256'.\n\n\t\t\tDefaults to '256' if this flag not specified.\n\n")
    console.log("-x  --encoding\t\targs: <encoding> \t\tSpecify the encoding for hash(es), values are either 'hex' or 'base64'.\n\n\t\t\tDefaults to 'hex' if this flag not specified.\n\n")
    console.log("-i  --iv\t\targs: <iv> \t\tSpecify Initialization vector.\n\n\t\t\tRequired if '-D' flag included.\n\n")
    console.log("-t  --tag\t\targs: <tag> \t\tSpecify Tag.\n\n\t\t\tRequired if '-D' flag included.\n\n")
    console.log("-w  --words\t\targs: <word count> \t\tSpecify the number of words to encrypt\n\n\t\tOnly useable with '-E' and '-c' flags\n\n")
    console.log("-E  --encrypt\t\targs: - \t\tRequired flag to indicate whether to encrypt.\n\n")
    console.log("-D  --decrypt\t\targs: - \t\tRequired flag to indicate whether to decrypt.\n\n")
    console.log("-J  --json\t\targs: - \t\tFlag to indicate content type of plain text.\n\n\t\t\tDefaults to false.\n\n")
    console.log("-S  --show\t\targs: - \t\tFlag to show contents of file written.\n\n\t\t\tDefaults to false.")
    console.log("-B  --binary\t\targs: - \t\tFlag to indicate the input file is a binary file.\n\n\t\t\tDefaults to false.")
    console.log("-C  --concat\t\targs: - \t\tFlag to indicate whether 'drln' extension in decryption should be concatenated with output file extension.\n\n\t\tDefaults to false.")

    console.log("\nExamples:")
    console.log("\n\tdarlene -c 'Hello, friend' -E -o test --show")
    console.log("\tdarlene -f ./test.txt -o ./hello -D --show")
    console.log("\n\tdarlene -f plain.txt -k 192 -o crypted -E")
    console.log("\tdarlene -f crypted.drln -o ~/Documents/decrypted --mode cbc --keylength 128 -D")
    console.log("\tdarlene -f image.png -B -o ~/Pictures/image -x base64 -E\n")
    console.log("\tdarlene -f wallet_words.txt -o ./wallet_words -x base64 -E\n")
}

// Our synthetic main fn
(() => {
    // We have to sanitize the args to make building the meta easier
    const args = sanitizeArgs(process.argv.slice(2))

    // If no args provided or the help flag is included we print the help message
    if (args.length == 0 || args.includes('-h') || args.includes('--help')) {
        help()
    } else {
        try {
            // Meta needed by Darlene
            let metas = buildMeta(args)

            // Semantic pass
            checkSemantics(metas)

            // Exec pass
            //
            // Accept secret here
            const key = ReadInput("Enter passphrase: ")

            // Template meta
            console.log('\n[*] Building meta...')

            let meta = {
                mode: metas.mode,
                keylength: metas.keylength,
                encoding: metas.encoding,
                isJSON: metas.isJSON,
                isBinary: metas.isBinary,
                ext: 'txt'
            }

            // Override ext if words count added
            // ... as we are encrypting an array of words
            if (metas.words > 0) {
                meta.ext = 'json'
            }

            // Handle encryption
            if (metas.encrypt) {
                // Gather pieces of the puzzle
                let ofp = SplitFP(metas.out)

                let output_fp = ofp.fp
                let output_fp_ext = ofp.ext ? GetExt(ofp.ext) : ext

                // Set output file path to input's if folder specified instead
                // But only if the input path specified
                if (!path.extname(metas.out)) {
                    output_fp = path.join(metas.out, SplitFP(metas.file).fp)
                    output_fp_ext = GetExt(meta.ext)
                }

                // Override file ext
                output_fp_ext = !isDarleneFile(metas.out) ? 'drln' : output_fp_ext

                // hanlde raw content
                if (metas.content || (metas.words > 0)) {
                    // Get words if '-w' (or --words) flag provided
                    if (metas.words > 0) {
                        let words = []

                        console.log(`\nEnter words below:\n`)

                        for (var i = 0;i < metas.words;i++) {
                            words.push(ReadInput(`${i} (hit enter): `))
                        }

                        metas.content = JSON.stringify(words, null, 2)

                        // Manually add content type
                        meta.isJSON = true
                    }

                    console.log('[*] Attempting to encrypt content...')
                    let blob = EncryptFlat(key, metas.content, meta)
                    
                    console.log('[*] Attempting to write encrypted content to file...')

                    // Check if it exists first to warn the user of a file overwrite
                    if (fs.existsSync(output_fp)) {
                        let response = ReadInput(`darlene: '${output_fp}' exists, overwrite file? [y/n]: `)

                        if (response == 'n') {
                            return 0
                        }
                    }

                    let out_fp = WriteFile(output_fp, blob)

                    if (metas.show) {
                        let hash = GetMeta(blob).hash

                        console.log('[+] hash: ', hash)
                    }

                    console.log(`[+] Wrote file: '${out_fp}'`)
                } else {
                    // Obtain remaining file info
                    let ifp = SplitFP(metas.file)

                    console.log(`[*] Checking input file content type...`)
                    // File ext darlene would store
                    // Grab it from input file
                    // Defaults to 'txt'
                    meta.ext = SplitFP(metas.file).ext

                    console.log(`[*] Encrypting file contents...`)
                    let buff = EncryptFileSync(key, ifp.fp + '.' + ifp.ext, meta)

                    // We have to rejoin when file we are writing to
                    console.log(`[*] Writing encrypted content to file: '${output_fp + '.' + output_fp_ext}'...`)

                    // Check if it exists first to warn the user of a file overwrite
                    if (fs.existsSync(output_fp)) {
                        let response = ReadInput(`darlene: '${output_fp}' exists, overwrite file? [y/n]: `)

                        if (response == 'n') {
                            return 0
                        }
                    }

                    let out_fp = WriteFile(output_fp, buff, output_fp_ext)

                    console.log(`[+] Wrote file: '${out_fp}'`)
                }
            } else {
                // Handle decryption
                let decrypted

                // Gather pieces of the puzzle
                let ofp = SplitFP(metas.out)

                let output_fp = ofp.fp
                let output_fp_ext = GetExt(ofp.ext)

                // Set output file path to input's if folder specified instead
                // But only if the input path specified
                if (!path.extname(metas.out) && fs.existsSync(metas.out) && metas.file) {
                    output_fp = path.join(metas.out, SplitFP(metas.file, true).fp)
                    output_fp_ext = GetExt(meta.ext)
                }

                if (metas.content) {
                    // Handle content decryption
                    // Add extra fields
                    console.log(`[*] Appending tag and iv to meta...`)
                    meta.iv = metas.iv
                    meta.tag = metas.tag
                    meta.hash = metas.content

                    console.log('[*] Attempting to decrypt content...')
                    decrypted = DecryptFlat(key, meta)

                    if (metas.show) {
                        console.log('[+] Recovered:')
                        console.log(`\n${decrypted}\n`)
                    }

                    // Check if it exists first to warn the user of a file overwrite
                    if (fs.existsSync(output_fp)) {
                        let response = ReadInput(`darlene: '${output_fp+'.'+output_fp_ext}' exists, overwrite file? [y/n]: `)

                        if (response == 'n') {
                            return 0
                        }
                    }

                    let written_out_fp = WriteFile(output_fp + '.' + output_fp_ext, decrypted, output_fp_ext)
                    console.log(`[+] Wrote content to file: ${written_out_fp}`)
                } else {
                    // Handle (darlene) file decryption
                    // file path
                    let raw_input_fp = metas.file

                    console.log('[*] Reading encrypted content...')
                    let blob = ReadFile(raw_input_fp)

                    console.log('[*] Attempting to decrypt content...')
                    decrypted = DecryptFileSync(key, raw_input_fp).plain

                    // Extract new file content
                    console.log('[*] Extracting encrypted file extension...')
                    let file_info = GetMeta(blob)

                    // Remember 'drln' does not store dot
                    ext = GetExt(file_info.ext)
                    
                    console.log('[*] Determining content type...')
                    // Check if text file from ext
                    // We know it is a text file if its neither binary or is json or 
                    // ... ext field left out (default to 'txt')
                    if (isEmptyBuffer(file_info.ext) || (!file_info.isBinary || file_info.isJSON)) {
                        // Stringify text
                        decrypted = file_info.isJSON ? JSON.parse(decrypted) : decrypted.toString()
                    }

                    // Determine content type 
                    console.log(`[+] Content is ${file_info.isBinary ? 'binary' : (file_info.isJSON ? 'json' : 'text')} data`)

                    if (metas.show) {
                        console.log('[+] Recovered:')
                        console.log("\n", decrypted, "\n")
                    }

                    // If concat on, then we pass both exts
                    if (!metas.concat) {
                        // Else we override it with the one darlene stored
                        output_fp_ext = ext
                    }

                    // Check if it exists first to warn the user of a file overwrite
                    // Basically preemptively perform all checks before hand
                    let file_to_check = metas.concat ? 
                                        (path.extname(output_fp+'.'+output_fp_ext).length > 0 ? 
                                        output_fp + '.' + output_fp_ext + '.' + ext : 
                                        output_fp + '.' + output_fp_ext) 
                                        : StripMerge(output_fp+'.'+output_fp_ext, ext)

                    if (fs.existsSync(file_to_check)) {
                        let response = ReadInput(`darlene: '${file_to_check}' exists, overwrite file? [y/n]: `)

                        if (response == 'n') {
                            return 0
                        }
                    }

                    // Write content
                    let written_out_fp = WriteFile(output_fp+'.'+output_fp_ext, decrypted,  ext, metas.concat)
                    console.log(`[+] Wrote content to file: '${written_out_fp}'`)
                }
            }
        } catch (e) {
            // Print errors
            console.log(e)

            // Print additional message if cli error
            if (e.includes('darlene')) {
                console.log("use -h flag to print list of options and usage")
            }
        }
    }
})()
