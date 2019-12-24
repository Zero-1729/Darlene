#!/usr/local/bin/node

const { buildMeta, sanitizeArgs, checkSemantics } = require('../utils/trenton')

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

        } catch (e) {
            // Print errors
            console.log(e)
            console.log("use -h flag to print list of options and usage")
        }
    }
})()
