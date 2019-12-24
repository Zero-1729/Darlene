#!/usr/local/bin/node

const { buildMeta, sanitizeArgs, checkSemantics, isDarleneFile } = require('../utils/trenton')
const { EncryptFlat, EncryptFileSync, DecryptFlat, DecryptFileSync } = require('./../utils/darlene')
const { ReadFile, WriteFile, GetMeta } = require('./../utils/file')
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
    console.log("-E  --encrypt\t\targs: - \t\tRequired flag to indicate whether to encrypt.\n\n")
    console.log("-D  --decrypt\t\targs: - \t\tRequired flag to indicate whether to decrypt.\n\n")
    console.log("-J  --json\t\targs: - \t\tFlag to indicate content type of plain text.\n\n\t\t\tDefaults to false when left out.\n\n")
    console.log("-S  --show\t\targs: - \t\tFlag to show contents of file written.\n\n\t\t\tDefaults to false when left out.")
    console.log("-B  --binary\t\targs: - \t\tFlag to indicate the input file is a binary file.\n\n\t\t\tDefaults to false when left out")

    console.log("\nExamples:")
    console.log("\n\tdarlene -c 'Hello world' --show -E")
    console.log("\tdarlene --content='Hello world' -o . -E --show") // REM: Creates a 'txt' file by default
    console.log("\n\tdarlene -f plain.txt -k 192 -E")
    console.log("\tdarlene -f crypted.drln -o ~/Documents/ --mode cbc --keylength 128 -D")
    console.log("\tdarlene -f image.png -B -o ~/Pictures -x base64 -E\n")
    console.log("\tdarlene -f password -B -o ~/Pictures -x base64 -E\n")
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

            console.log(metas)

            // Semantic pass
            checkSemantics(metas)

            // Exec pass
            //
            // Set ext value
            if (metas.ext) {
                // Remember that the 'binary' option set this to true
                // ... now we fill it in with the actual ext value
                metas.ext = metas.file.slice(metas.file.lastIndexOf('.') + 1)
            } 

            // Accept secret here
            const key = ReadInput("Enter passphrase: ")

            // Template meta
            console.log('\n[*] Building meta...')

            let meta = {
                mode: metas.mode,
                keylength: metas.keylength,
                encoding: metas.encoding,
                isJSON: metas.isJSON
            }
            
            // Handle encryption
            if (metas.encrypt) {
                // hanlde raw content
                if (metas.content) {
                    console.log('[*] Attempting to encrypt content...')
                    let blob = EncryptFlat(key, metas.content, meta)
                    
                    console.log('[*] Attempting to write encrypted content to file...')
                    let outfp = WriteFile(metas.out, blob)

                    console.log(`[+] Wrote file: '${outfp}'`)
                } else {
                    // handle file
                    // Add extra fields in meta
                    let fp = metas.file
                    let efp = isDarleneFile(metas.out) ? metas.out : metas.out + '.drln'
                    
                    console.log(`[*] Checking input file content type...`)
                    // Hadler for binary files
                    if (metas.binary) {
                        meta.ext = metas.ext
                    } else {
                        meta.ext = null
                    }

                    console.log(`[*] Encrypting file contents...`)
                    let buff = EncryptFileSync(key, fp, meta)

                    console.log(`[*] Writing encrypted content to file: '${efp}'...`)
                    let outfp = WriteFile(efp, buff)

                    console.log(`[+] Wrote file: '${outfp}'`)
                }
            } else {
                // Handle decryption
                let decrypted
                let fp = metas.out

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

                    let outfp = WriteFile(fp, decrypted, '.txt')
                    console.log(`[+] Wrote content to file: ${outfp}`)
                } else {
                    // Handle (darlene) file decryption
                    // file path
                    let fp = metas.file

                    console.log('[*] Reading encrypted content...')
                    let blob = ReadFile(fp)

                    console.log('[*] Attempting to decrypt content...')
                    decrypted = DecryptFileSync(key, fp)

                    // Extract new file content
                    console.log('[*] Extracting encrypted file extension...')
                    let file_info = GetMeta(blob)

                    let efp
                    let ext = meta.ext
                    
                    console.log('[*] Creating file path to write content...')
                    if (file_info.ext) {
                        // binary file
                        efp = metas.out ? 
                              metas.out.slice(0, metas.out.lastIndexOf('.')) : 
                              fp.slice(0, fp.lastIndexOf('.'))
                    } else {
                        // text/json file
                        if (metas.isJSON) {
                            efp = metas.out ? 
                                  metas.out.slice(0, metas.out.lastIndexOf('.')) : 
                                  fp.slice(0, fp.lastIndexOf('.'))

                            ext = '.json'
                        } else {
                            efp = metas.out ? 
                                  metas.out.slice(0, metas.out.lastIndexOf('.')) : 
                                  fp.slice(0, fp.lastIndexOf('.'))

                            ext = '.txt'
                        }
                    }

                    if (metas.show) {
                        console.log('[+] Recovered:')
                        console.log(decrypted)
                    }

                    let outfp = WriteFile(efp, decrypted, ext)
                    console.log(`[+] Wrote content to file: '${outfp}'`)
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
